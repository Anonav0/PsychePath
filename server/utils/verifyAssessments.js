const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const config = require("../config");
const { User, Assessment, Question, AssessmentAttempt } = require("../models");
const app = require("../app");
const http = require("http");

let mongod = null;
let server = null;
let serverBaseUrl = "";

const setup = async () => {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 });
  } catch (err) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    config.mongoUri = uri;
    await mongoose.connect(uri);
  }

  if (!config.jwtSecret) {
    config.jwtSecret =
      "test_suite_assessment_engine_secret_key_at_least_32_chars";
  }

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      serverBaseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
};

const teardown = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

const runAssessmentTests = async () => {
  console.log("\n======================================================");
  console.log("🧪 PsychePath Phase 4: Assessment Engine Verification");
  console.log("======================================================\n");

  await setup();

  // Clear relevant collections for test isolation
  await Promise.all([
    User.deleteMany({}),
    Assessment.deleteMany({}),
    Question.deleteMany({}),
    AssessmentAttempt.deleteMany({}),
  ]);

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  };

  // Helper tokens and users
  const adminUser = await User.create({
    firstName: "Assessment",
    lastName: "Admin",
    email: "assessment.admin@psychepath.io",
    password: "AdminPassword2026!",
    role: "ADMIN",
    isActive: true,
  });

  const studentAlex = await User.create({
    firstName: "Alex",
    lastName: "Learner",
    email: "alex.learner@psychepath.io",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  const studentSarah = await User.create({
    firstName: "Sarah",
    lastName: "Learner",
    email: "sarah.learner@psychepath.io",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  const adminToken = jwt.sign(
    { sub: adminUser._id.toString(), role: "ADMIN" },
    config.jwtSecret,
    { expiresIn: "1h" },
  );

  const alexToken = jwt.sign(
    { sub: studentAlex._id.toString(), role: "STUDENT" },
    config.jwtSecret,
    { expiresIn: "1h" },
  );

  const sarahToken = jwt.sign(
    { sub: studentSarah._id.toString(), role: "STUDENT" },
    config.jwtSecret,
    { expiresIn: "1h" },
  );

  let createdAssessmentId = "";
  let question1Id = "";
  let question2Id = "";
  let activeAttemptId = "";

  // -------------------------------------------------------------
  // SUITE 1: Assessment Management & Role Authorization
  // -------------------------------------------------------------
  console.log("\n--- 1. Assessment Management & Role Authorization ---");

  await test("Admin successfully creates new assessment", async () => {
    const res = await fetch(`${serverBaseUrl}/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Cognitive Agility & Problem Solving",
        description:
          "Measures structured problem decomposition and algorithmic thinking.",
        type: "LEARNING_STYLE",
        estimatedDuration: 10,
        dimensions: [
          {
            key: "analytical",
            name: "Analytical Thinking",
            description: "Systematic deduction",
          },
          {
            key: "creativity",
            name: "Creative Synthesis",
            description: "Novel design patterns",
          },
        ],
        scoringConfig: {
          minScore: 0,
          maxScore: 100,
        },
      }),
    });

    const data = await res.json();
    if (res.status !== 201)
      throw new Error(`Expected 201, got ${res.status}: ${data.message}`);
    if (!data.success) throw new Error("Success flag is not true");
    if (!data.data._id) throw new Error("Created assessment ID missing");
    if (data.data.title !== "Cognitive Agility & Problem Solving")
      throw new Error("Title mismatch");

    createdAssessmentId = data.data._id;
  });

  await test("Student is denied assessment creation (RBAC 403)", async () => {
    const res = await fetch(`${serverBaseUrl}/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        title: "Unauthorized Student Assessment",
        description: "Should be rejected",
      }),
    });

    const data = await res.json();
    if (res.status !== 403)
      throw new Error(`Expected 403 FORBIDDEN, got ${res.status}`);
    if (data.errorCode !== "FORBIDDEN")
      throw new Error(`Expected errorCode FORBIDDEN, got ${data.errorCode}`);
  });

  await test("Invalid assessment payload is rejected (400 VALIDATION_ERROR)", async () => {
    const res = await fetch(`${serverBaseUrl}/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "", // Missing title
        type: "INVALID_TYPE",
        estimatedDuration: -5,
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "VALIDATION_ERROR")
      throw new Error(`Expected VALIDATION_ERROR, got ${data.errorCode}`);
  });

  await test("Admin updates assessment metadata", async () => {
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: "Cognitive Agility & Algorithmic Problem Solving (Updated)",
          estimatedDuration: 12,
        }),
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.estimatedDuration !== 12)
      throw new Error("Updated estimatedDuration did not persist");
  });

  // -------------------------------------------------------------
  // SUITE 2: Question Management & Scoring Sanitization
  // -------------------------------------------------------------
  console.log("\n--- 2. Question Management & Security Sanitization ---");

  await test("Admin creates questions with authoritative scoring keys", async () => {
    // Question 1 (Analytical dimension)
    const res1 = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          questionText: "I trace data flow step-by-step before writing code.",
          questionType: "SINGLE_CHOICE",
          dimension: "analytical",
          order: 1,
          isRequired: true,
          options: [
            {
              label: "Rarely",
              value: "rarely",
              score: 1,
              dimensionScores: { analytical: 1 },
            },
            {
              label: "Frequently",
              value: "frequently",
              score: 5,
              dimensionScores: { analytical: 5 },
            },
          ],
        }),
      },
    );

    const data1 = await res1.json();
    if (res1.status !== 201)
      throw new Error(
        `Expected 201 for Q1, got ${res1.status}: ${data1.message}`,
      );
    question1Id = data1.data._id;

    // Question 2 (Creativity dimension)
    const res2 = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          questionText:
            "I enjoy experimenting with alternative UI architectures.",
          questionType: "SINGLE_CHOICE",
          dimension: "creativity",
          order: 2,
          isRequired: true,
          options: [
            {
              label: "Disagree",
              value: "disagree",
              score: 1,
              dimensionScores: { creativity: 1 },
            },
            {
              label: "Agree",
              value: "agree",
              score: 5,
              dimensionScores: { creativity: 5 },
            },
          ],
        }),
      },
    );

    const data2 = await res2.json();
    if (res2.status !== 201)
      throw new Error(
        `Expected 201 for Q2, got ${res2.status}: ${data2.message}`,
      );
    question2Id = data2.data._id;

    // Verify assessment questionCount incremented to 2
    const checkRes = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    const checkData = await checkRes.json();
    if (checkData.data.questionCount !== 2) {
      throw new Error(
        `Expected questionCount 2, got ${checkData.data.questionCount}`,
      );
    }
  });

  await test("Student questions query strips options.score & dimensionScores", async () => {
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/questions`,
      {
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(data.data) || data.data.length !== 2)
      throw new Error("Expected 2 questions returned");

    for (const q of data.data) {
      for (const opt of q.options) {
        if (opt.score !== undefined) {
          throw new Error(
            `CRITICAL SECURITY FAILURE: option.score exposed to student (${opt.score})`,
          );
        }
        if (opt.dimensionScores !== undefined) {
          throw new Error(
            "CRITICAL SECURITY FAILURE: option.dimensionScores exposed to student",
          );
        }
      }
    }
  });

  await test("Admin questions query preserves scoring keys for editing", async () => {
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/questions`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const q1 = data.data.find((q) => q._id === question1Id);
    if (!q1 || q1.options[0].score === undefined) {
      throw new Error(
        "Admin should receive complete scoring configuration on options",
      );
    }
  });

  await test("Question reordering updates order correctly", async () => {
    const res = await fetch(`${serverBaseUrl}/questions/${question1Id}/order`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ order: 10 }),
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.order !== 10)
      throw new Error(`Expected order 10, got ${data.data.order}`);

    // Restore to 1
    await fetch(`${serverBaseUrl}/questions/${question1Id}/order`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ order: 1 }),
    });
  });

  // -------------------------------------------------------------
  // SUITE 3: Attempt Lifecycle & Guardrails
  // -------------------------------------------------------------
  console.log("\n--- 3. Attempt Lifecycle & Guardrails ---");

  await test("Student starts assessment attempt", async () => {
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/attempts`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 201)
      throw new Error(`Expected 201, got ${res.status}: ${data.message}`);
    if (data.data.status !== "IN_PROGRESS")
      throw new Error(`Expected IN_PROGRESS, got ${data.data.status}`);
    activeAttemptId = data.data._id;
  });

  await test("Second attempt start resumes existing active attempt (No duplicates)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/attempts`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200)
      throw new Error(`Expected 200 resume, got ${res.status}`);
    if (data.data._id !== activeAttemptId)
      throw new Error("Did not return existing active attempt ID");
  });

  await test("Student retrieves current active attempt", async () => {
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/attempts/active`,
      {
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data._id !== activeAttemptId)
      throw new Error("Mismatch in active attempt ID");
    if (data.data.scores !== undefined)
      throw new Error("Scores should not be exposed on active attempt");
  });

  await test("Starting inactive assessment is rejected (400 ASSESSMENT_INACTIVE)", async () => {
    // Deactivate assessment
    await fetch(`${serverBaseUrl}/assessments/${createdAssessmentId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });

    // Try starting attempt as Sarah
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}/attempts`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${sarahToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "ASSESSMENT_INACTIVE") {
      throw new Error(`Expected ASSESSMENT_INACTIVE, got ${data.errorCode}`);
    }

    // Reactivate assessment
    await fetch(`${serverBaseUrl}/assessments/${createdAssessmentId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: true }),
    });
  });

  // -------------------------------------------------------------
  // SUITE 4: Answer Saving, IDOR & Anti-Tampering Security
  // -------------------------------------------------------------
  console.log("\n--- 4. Answer Saving, IDOR & Anti-Tampering Defense ---");

  await test("Student saves valid answer to Question 1", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/answers`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          questionId: question1Id,
          selectedValue: "frequently",
        }),
      },
    );

    const data = await res.json();
    if (res.status !== 200)
      throw new Error(`Expected 200, got ${res.status}: ${data.message}`);
    if (data.data.answeredCount !== 1)
      throw new Error(
        `Expected answeredCount 1, got ${data.data.answeredCount}`,
      );
  });

  await test("Client-supplied score tampering is completely sanitized and ignored", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/answers`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          answers: [
            {
              questionId: question1Id,
              selectedValue: "frequently",
              score: 9999, // Malicious score attempt
              dimensionScores: { analytical: 1000 },
            },
          ],
        }),
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

    // Verify in database that attempt.answers does NOT have tampered score
    const savedAttempt = await AssessmentAttempt.findById(activeAttemptId);
    const ans = savedAttempt.answers.find(
      (a) => a.question.toString() === question1Id,
    );
    if (ans.score !== undefined && ans.score === 9999) {
      throw new Error(
        "CRITICAL SECURITY FAILURE: Client score was accepted into database",
      );
    }
  });

  await test("Invalid option value is rejected (400 INVALID_OPTION)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/answers`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          questionId: question1Id,
          selectedValue: "non_existent_option",
        }),
      },
    );

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "INVALID_OPTION") {
      throw new Error(`Expected INVALID_OPTION, got ${data.errorCode}`);
    }
  });

  await test("IDOR Protection: Student Sarah cannot save answers to Alex’s attempt (403)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/answers`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sarahToken}`, // Sarah trying to tamper with Alex's attempt
        },
        body: JSON.stringify({
          questionId: question1Id,
          selectedValue: "rarely",
        }),
      },
    );

    const data = await res.json();
    if (res.status !== 403)
      throw new Error(`Expected 403 FORBIDDEN, got ${res.status}`);
    if (data.errorCode !== "ATTEMPT_ACCESS_DENIED") {
      throw new Error(`Expected ATTEMPT_ACCESS_DENIED, got ${data.errorCode}`);
    }
  });

  // -------------------------------------------------------------
  // SUITE 5: Assessment Submission & Authoritative Scoring
  // -------------------------------------------------------------
  console.log("\n--- 5. Submission, Required Questions & Backend Scoring ---");

  await test("Submitting incomplete assessment is rejected (400 ASSESSMENT_INCOMPLETE)", async () => {
    // Only Q1 answered so far; Q2 is required and unanswered
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "ASSESSMENT_INCOMPLETE") {
      throw new Error(`Expected ASSESSMENT_INCOMPLETE, got ${data.errorCode}`);
    }
  });

  await test("Complete submission triggers backend scoring & transitions to COMPLETED", async () => {
    // Answer Q2 (Creativity: 'agree' -> score 5)
    await fetch(`${serverBaseUrl}/attempts/${activeAttemptId}/answers`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        questionId: question2Id,
        selectedValue: "agree",
      }),
    });

    // Submit attempt
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200)
      throw new Error(`Expected 200, got ${res.status}: ${data.message}`);
    if (data.data.status !== "COMPLETED")
      throw new Error(`Expected COMPLETED, got ${data.data.status}`);
    if (!data.data.submittedAt)
      throw new Error("submittedAt timestamp missing");

    // Verify backend calculated scores:
    // Q1: frequently (analytical: 5 out of 5 = 100%)
    // Q2: agree (creativity: 5 out of 5 = 100%)
    if (data.data.scores.analytical !== 100) {
      throw new Error(
        `Expected analytical score 100, got ${data.data.scores.analytical}`,
      );
    }
    if (data.data.scores.creativity !== 100) {
      throw new Error(
        `Expected creativity score 100, got ${data.data.scores.creativity}`,
      );
    }
    if (data.data.overallScore !== 100) {
      throw new Error(
        `Expected overallScore 100, got ${data.data.overallScore}`,
      );
    }
    if (
      !data.data.resultSummary ||
      typeof data.data.resultSummary !== "string"
    ) {
      throw new Error("Educational resultSummary missing or invalid");
    }
  });

  await test("Completed attempt rejects subsequent answer updates (400 ATTEMPT_ALREADY_COMPLETED)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/answers`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${alexToken}`,
        },
        body: JSON.stringify({
          questionId: question1Id,
          selectedValue: "rarely",
        }),
      },
    );

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "ATTEMPT_ALREADY_COMPLETED") {
      throw new Error(
        `Expected ATTEMPT_ALREADY_COMPLETED, got ${data.errorCode}`,
      );
    }
  });

  await test("Completed attempt rejects second submission (400 ATTEMPT_ALREADY_COMPLETED)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "ATTEMPT_ALREADY_COMPLETED") {
      throw new Error(
        `Expected ATTEMPT_ALREADY_COMPLETED, got ${data.errorCode}`,
      );
    }
  });

  // -------------------------------------------------------------
  // SUITE 6: Result Retrieval, IDOR & History
  // -------------------------------------------------------------
  console.log("\n--- 6. Results, IDOR Protection & History ---");

  await test("Student owner retrieves assessment result", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/result`,
      {
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.scores.analytical !== 100)
      throw new Error("Result scores missing or inaccurate");
    if (!data.data.resultSummary) throw new Error("Result summary missing");
  });

  await test("IDOR Protection: Student Sarah cannot view Alex’s result (403)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/result`,
      {
        headers: { Authorization: `Bearer ${sarahToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 403)
      throw new Error(`Expected 403 FORBIDDEN, got ${res.status}`);
    if (data.errorCode !== "ATTEMPT_ACCESS_DENIED") {
      throw new Error(`Expected ATTEMPT_ACCESS_DENIED, got ${data.errorCode}`);
    }
  });

  await test("Admin can view student’s result for administrative oversight", async () => {
    const res = await fetch(
      `${serverBaseUrl}/attempts/${activeAttemptId}/result`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.attemptId !== activeAttemptId)
      throw new Error("Mismatch in returned attempt ID");
  });

  await test("Student retrieves their own attempt history (/attempts/my)", async () => {
    const res = await fetch(`${serverBaseUrl}/attempts/my`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(data.data) || data.data.length !== 1) {
      throw new Error(
        `Expected 1 historical attempt, got ${data.data?.length}`,
      );
    }
    if (data.data[0]._id !== activeAttemptId) {
      throw new Error("Attempt ID does not match");
    }
  });

  await test("Admin retrieves all attempts across students (/attempts)", async () => {
    const res = await fetch(`${serverBaseUrl}/attempts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(data.data) || data.data.length < 1) {
      throw new Error("Admin should see at least 1 attempt");
    }
  });

  // -------------------------------------------------------------
  // SUITE 7: Assessment Safe Deletion
  // -------------------------------------------------------------
  console.log("\n--- 7. Assessment Deletion Safety ---");

  await test("Assessment with historical attempts is safely soft-deactivated", async () => {
    const res = await fetch(
      `${serverBaseUrl}/assessments/${createdAssessmentId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.softDeleted !== true)
      throw new Error("Expected softDeleted: true");

    const updatedDoc = await Assessment.findById(createdAssessmentId);
    if (updatedDoc.isActive !== false)
      throw new Error("Assessment should be deactivated to preserve history");
  });

  console.log("\n======================================================");
  console.log(`Assessment Test Summary: ${passed} passed, ${failed} failed`);
  console.log("======================================================\n");

  await teardown();

  if (failed > 0) {
    process.exit(1);
  }
};

runAssessmentTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  teardown().then(() => process.exit(1));
});
