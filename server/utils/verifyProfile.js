const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const config = require("../config");
const {
  User,
  Assessment,
  AssessmentAttempt,
  LearnerProfile,
} = require("../models");
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
      "test_suite_learner_profile_secret_key_at_least_32_chars";
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

const runProfileTests = async () => {
  console.log("\n======================================================");
  console.log("🧪 PsychePath Phase 5: Learner Profile Verification");
  console.log("======================================================\n");

  await setup();

  // Clear relevant collections for test isolation
  await Promise.all([
    User.deleteMany({}),
    Assessment.deleteMany({}),
    AssessmentAttempt.deleteMany({}),
    LearnerProfile.deleteMany({}),
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

  // Helper users and tokens
  const adminUser = await User.create({
    firstName: "System",
    lastName: "Admin",
    email: "admin.profile@psychepath.io",
    password: "AdminPassword2026!",
    role: "ADMIN",
    isActive: true,
  });

  const studentAlex = await User.create({
    firstName: "Alex",
    lastName: "Chen",
    email: "alex.profile@psychepath.io",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  const studentSarah = await User.create({
    firstName: "Sarah",
    lastName: "Kim",
    email: "sarah.profile@psychepath.io",
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

  // Helper assessment and attempts
  const testAssessment = await Assessment.create({
    title: "Diagnostic Learning Assessment",
    description: "Measures learning dimensions",
    type: "LEARNING_STYLE",
    estimatedDuration: 15,
    createdBy: adminUser._id,
    isActive: true,
  });

  // Completed attempt for Alex
  const alexCompletedAttempt = await AssessmentAttempt.create({
    user: studentAlex._id,
    assessment: testAssessment._id,
    status: "COMPLETED",
    startedAt: new Date(Date.now() - 3600000),
    submittedAt: new Date(),
    scores: {
      analyticalthinking: 85, // Strength (>= 75)
      creativity: 70, // Neutral (60-74)
      communication: 52, // Improvement (< 60)
    },
    resultSummary:
      "Strong analytical aptitude; communication recommended for development.",
  });

  // In-progress attempt for Alex
  const alexInProgressAttempt = await AssessmentAttempt.create({
    user: studentAlex._id,
    assessment: testAssessment._id,
    status: "IN_PROGRESS",
    startedAt: new Date(),
    scores: {},
  });

  // Completed attempt for Sarah (for IDOR testing)
  const sarahCompletedAttempt = await AssessmentAttempt.create({
    user: studentSarah._id,
    assessment: testAssessment._id,
    status: "COMPLETED",
    startedAt: new Date(Date.now() - 1800000),
    submittedAt: new Date(),
    scores: {
      collaboration: 90,
    },
  });

  // -------------------------------------------------------------
  // SUITE 1: Authentication & Initial Retrieval
  // -------------------------------------------------------------
  console.log("\n--- 1. Authentication & Profile Retrieval ---");

  await test("Unauthenticated profile access is rejected (401 AUTH_REQUIRED)", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`);
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "AUTH_REQUIRED")
      throw new Error(`Expected AUTH_REQUIRED, got ${data.errorCode}`);
  });

  await test("Retrieving non-existent profile returns 404 PROFILE_NOT_FOUND", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    if (data.errorCode !== "PROFILE_NOT_FOUND")
      throw new Error(`Expected PROFILE_NOT_FOUND, got ${data.errorCode}`);
  });

  // -------------------------------------------------------------
  // SUITE 2: User-Managed Profile Updates & Validations
  // -------------------------------------------------------------
  console.log("\n--- 2. User-Managed Profile Updates & Validations ---");

  await test("Student successfully creates/updates user-managed profile attributes", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        educationLevel: "UNDERGRADUATE",
        experienceLevel: "INTERMEDIATE",
        currentSkills: [
          { name: "JavaScript", level: "INTERMEDIATE" },
          { name: "Node.js", level: "BEGINNER" },
        ],
        learningGoals: [
          { name: "Full-Stack Architecture Mastery", priority: "HIGH" },
        ],
        interests: ["Backend Systems", "Distributed Databases"],
        learningPreferences: {
          preferredFormat: "PROJECT",
          preferredDifficulty: "INTERMEDIATE",
          preferredSessionDuration: 60,
        },
        preferredDifficulty: "INTERMEDIATE",
        weeklyLearningHours: 12,
      }),
    });

    const data = await res.json();
    if (res.status !== 200)
      throw new Error(`Expected 200, got ${res.status}: ${data.message}`);
    if (!data.success) throw new Error("Success flag is not true");
    if (data.data.educationLevel !== "UNDERGRADUATE")
      throw new Error("educationLevel mismatch");
    if (data.data.currentSkills.length !== 2)
      throw new Error("currentSkills length mismatch");
    if (data.data.learningGoals[0].priority !== 3)
      throw new Error("Goal priority HIGH was not normalized to 3");
    if (typeof data.data.profileCompleteness !== "number")
      throw new Error("profileCompleteness missing");
    if (data.data.profileCompleteness <= 0)
      throw new Error("Completeness should be greater than 0");
  });

  await test("Duplicate skills in update payload are rejected (400 INVALID_SKILL)", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        currentSkills: [
          { name: "React", level: "BEGINNER" },
          { name: "react", level: "INTERMEDIATE" }, // Duplicate
        ],
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "INVALID_SKILL")
      throw new Error(`Expected INVALID_SKILL, got ${data.errorCode}`);
  });

  await test("Invalid skill level is rejected (400 INVALID_SKILL)", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        currentSkills: [{ name: "Rust", level: "NINJA_EXPERT" }],
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "INVALID_SKILL")
      throw new Error(`Expected INVALID_SKILL, got ${data.errorCode}`);
  });

  await test("Invalid weekly learning hours is rejected (400 VALIDATION_ERROR)", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        weeklyLearningHours: 250, // Exceeds 168
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "VALIDATION_ERROR")
      throw new Error(`Expected VALIDATION_ERROR, got ${data.errorCode}`);
  });

  // -------------------------------------------------------------
  // SUITE 3: Security & Anti-Tampering Defense
  // -------------------------------------------------------------
  console.log("\n--- 3. Security & Anti-Tampering Defense ---");

  await test("Client cannot spoof assessment-derived fields via PATCH /me (400 PROFILE_UPDATE_INVALID)", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        strengths: ["genius_algorithmic_thinking"], // Forbidden spoofing attempt
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "PROFILE_UPDATE_INVALID") {
      throw new Error(`Expected PROFILE_UPDATE_INVALID, got ${data.errorCode}`);
    }
  });

  await test("Client cannot spoof profileVersion directly (400 PROFILE_UPDATE_INVALID)", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${alexToken}`,
      },
      body: JSON.stringify({
        profileVersion: 99, // Forbidden spoofing attempt
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "PROFILE_UPDATE_INVALID") {
      throw new Error(`Expected PROFILE_UPDATE_INVALID, got ${data.errorCode}`);
    }
  });

  // -------------------------------------------------------------
  // SUITE 4: Assessment-to-Profile Conversion & IDOR
  // -------------------------------------------------------------
  console.log(
    "\n--- 4. Assessment-to-Profile Conversion & IDOR Protection ---",
  );

  await test("In-progress assessment attempt cannot generate profile (400 ASSESSMENT_RESULT_NOT_AVAILABLE)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/profile/me/generate-from-assessment/${alexInProgressAttempt._id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "ASSESSMENT_RESULT_NOT_AVAILABLE") {
      throw new Error(
        `Expected ASSESSMENT_RESULT_NOT_AVAILABLE, got ${data.errorCode}`,
      );
    }
  });

  await test("IDOR Protection: Student Alex cannot generate profile from Sarah’s attempt (403)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/profile/me/generate-from-assessment/${sarahCompletedAttempt._id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` }, // Alex trying to use Sarah's attempt
      },
    );

    const data = await res.json();
    if (res.status !== 403)
      throw new Error(`Expected 403 FORBIDDEN, got ${res.status}`);
    if (data.errorCode !== "ATTEMPT_ACCESS_DENIED") {
      throw new Error(`Expected ATTEMPT_ACCESS_DENIED, got ${data.errorCode}`);
    }
  });

  await test("Completed assessment generates structured profile with strengths and development areas", async () => {
    const res = await fetch(
      `${serverBaseUrl}/profile/me/generate-from-assessment/${alexCompletedAttempt._id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200)
      throw new Error(`Expected 200, got ${res.status}: ${data.message}`);
    const profile = data.data;

    // Verify assessment dimensions
    if (profile.assessmentDimensions.analyticalthinking !== 85) {
      throw new Error(
        `Expected analyticalthinking 85, got ${profile.assessmentDimensions?.analyticalthinking}`,
      );
    }

    // Verify strengths (85 >= 75)
    if (!profile.strengths.includes("analyticalthinking")) {
      throw new Error("Expected analyticalthinking in strengths");
    }

    // Verify improvement areas (52 < 60)
    if (!profile.improvementAreas.includes("communication")) {
      throw new Error("Expected communication in improvementAreas");
    }

    // Verify neutral dimension is neither strength nor improvement area (70)
    if (
      profile.strengths.includes("creativity") ||
      profile.improvementAreas.includes("creativity")
    ) {
      throw new Error(
        "Creativity (70%) should remain neutral/developing, not forced into strength/weakness",
      );
    }

    // Verify source assessment and version
    if (!profile.lastAssessmentAttempt)
      throw new Error("lastAssessmentAttempt should be populated");
    if (profile.profileVersion < 2)
      throw new Error(
        `Expected profileVersion >= 2, got ${profile.profileVersion}`,
      );

    // Verify user-managed skills were preserved
    if (
      profile.currentSkills.length !== 2 ||
      profile.currentSkills[0].name !== "JavaScript"
    ) {
      throw new Error(
        "CRITICAL FAILURE: Assessment conversion wiped user-managed currentSkills",
      );
    }
    if (profile.learningGoals.length !== 1) {
      throw new Error(
        "CRITICAL FAILURE: Assessment conversion wiped user-managed learningGoals",
      );
    }
  });

  await test("Idempotent re-generation with the same attempt updates safely", async () => {
    const res = await fetch(
      `${serverBaseUrl}/profile/me/generate-from-assessment/${alexCompletedAttempt._id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (
      data.data.strengths.length !== 1 ||
      !data.data.strengths.includes("analyticalthinking")
    ) {
      throw new Error("Strengths corrupted after re-generation");
    }
  });

  // -------------------------------------------------------------
  // SUITE 5: Profile Completeness & Retrieval
  // -------------------------------------------------------------
  console.log("\n--- 5. Profile Completeness & Retrieval ---");

  await test("GET /api/profile/me returns complete profile with 100% completeness", async () => {
    const res = await fetch(`${serverBaseUrl}/profile/me`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    // Education (15) + Skills (20) + Goals (20) + Interests (10) + Preferences (10) + Assessment (25) = 100%
    if (data.data.profileCompleteness !== 100) {
      throw new Error(
        `Expected profileCompleteness 100%, got ${data.data.profileCompleteness}%`,
      );
    }
  });

  // -------------------------------------------------------------
  // SUITE 6: Administrative Access & Role Enforcement
  // -------------------------------------------------------------
  console.log("\n--- 6. Administrative Profile Access ---");

  await test("Admin successfully queries student profile (/api/profiles/:userId)", async () => {
    const res = await fetch(`${serverBaseUrl}/profiles/${studentAlex._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (
      !data.data.profile ||
      data.data.profile.user.toString() !== studentAlex._id.toString()
    ) {
      throw new Error("Admin did not receive target student profile");
    }
  });

  await test("Student is denied administrative profile query (403 FORBIDDEN)", async () => {
    const res = await fetch(`${serverBaseUrl}/profiles/${studentAlex._id}`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });

    const data = await res.json();
    if (res.status !== 403)
      throw new Error(`Expected 403 FORBIDDEN, got ${res.status}`);
    if (data.errorCode !== "FORBIDDEN")
      throw new Error(`Expected FORBIDDEN, got ${data.errorCode}`);
  });

  console.log("\n======================================================");
  console.log(
    `Learner Profile Test Summary: ${passed} passed, ${failed} failed`,
  );
  console.log("======================================================\n");

  await teardown();

  if (failed > 0) {
    process.exit(1);
  }
};

runProfileTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  teardown().then(() => process.exit(1));
});
