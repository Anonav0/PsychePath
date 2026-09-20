/**
 * PsychePath Phase 12: Admin Dashboard & Management System Verification
 *
 * Automated verification of:
 * - Admin authentication and RBAC protection (401 on guest, 403 on student)
 * - Platform metrics and overview stats aggregation
 * - Learner management (search, filter, pagination, status toggle)
 * - Learner detailed data inspection (profile, attempts, active path, progress)
 * - Safety guards (preventing modification of admin accounts via learner endpoints)
 * - Assessment management CRUD and status toggle
 * - Question management (create, update, reorder, delete)
 * - Curriculum module management and status toggle
 *
 * Uses MongoMemoryServer for isolated, zero-side-effect testing.
 */

const http = require("http");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

const app = require("../app");
const config = require("../config");
const {
  User,
  Assessment,
  Question,
  AssessmentAttempt,
  LearnerProfile,
  CurriculumModule,
  LearningPath,
  Progress,
} = require("../models");

let mongoServer;
let server;
let serverBaseUrl;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    if (err.stack) {
      console.error(
        `     Stack: ${err.stack.split("\n").slice(1, 3).join("\n")}`,
      );
    }
    failedTests++;
  }
}

async function request(path, options = {}) {
  const url = `${serverBaseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch (e) {
            data = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      },
    );

    req.on("error", reject);
    if (options.body) {
      req.write(
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
      );
    }
    req.end();
  });
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: "1h" },
  );
}

async function runTests() {
  console.log("\n======================================================");
  console.log("🧪 PsychePath Phase 12: Admin Dashboard Verification");
  console.log("======================================================\n");

  // 1. Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 2. Start HTTP server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      serverBaseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
    // 3. Seed test users
    const adminUser = await User.create({
      firstName: "Admin",
      lastName: "Superuser",
      email: "admin@psychepath.io",
      password: "SuperSecretPassword123!",
      role: "ADMIN",
      isActive: true,
    });
    const adminToken = generateToken(adminUser);

    const studentUser = await User.create({
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex@example.com",
      password: "Password123!",
      role: "STUDENT",
      isActive: true,
    });
    const studentToken = generateToken(studentUser);

    const inactiveStudent = await User.create({
      firstName: "Taylor",
      lastName: "Swift",
      email: "taylor@example.com",
      password: "Password123!",
      role: "STUDENT",
      isActive: false,
    });

    // Seed profile, curriculum, assessment, attempts, learning path
    const module1 = await CurriculumModule.create({
      title: "Data Structures",
      slug: "data-structures",
      description: "Fundamental data structures and algorithms",
      category: "Computer Science",
      difficulty: "BEGINNER",
      estimatedDuration: 120,
      skills: [
        { name: "Arrays", level: "BEGINNER" },
        { name: "Linked Lists", level: "BEGINNER" },
      ],
      learningObjectives: ["Understand arrays and pointer manipulation"],
      isActive: true,
    });

    const assessment1 = await Assessment.create({
      title: "Cognitive Style Diagnostic",
      description: "Evaluates analytical vs intuitive problem solving",
      type: "LEARNING_STYLE",
      instructions:
        "Answer all questions honestly based on your first instinct.",
      dimensions: [
        {
          key: "analytical",
          name: "Analytical Thinking",
          description: "Analytical reasoning",
        },
        {
          key: "intuitive",
          name: "Intuitive Exploration",
          description: "Intuitive exploration",
        },
      ],
      questionCount: 0,
      estimatedDuration: 15,
      isActive: true,
    });

    const attempt1 = await AssessmentAttempt.create({
      user: studentUser._id,
      assessment: assessment1._id,
      status: "COMPLETED",
      scores: { analytical: 85, intuitive: 65 },
      resultSummary: "High analytical reasoning capabilities.",
      submittedAt: new Date(),
    });

    await LearnerProfile.create({
      user: studentUser._id,
      educationLevel: "UNDERGRADUATE",
      experienceLevel: "BEGINNER",
      currentSkills: [{ name: "JavaScript", level: "BEGINNER" }],
      learningGoals: [{ name: "Full Stack Mastery", priority: 1 }],
      interests: ["Web Development"],
      assessmentDimensions: { analytical: 85, intuitive: 65 },
      strengths: ["Analytical Problem Solving"],
      improvementAreas: ["Intuitive Exploration"],
    });

    const activePath = await LearningPath.create({
      user: studentUser._id,
      version: 1,
      status: "ACTIVE",
      modules: [{ module: module1._id, order: 1, status: "IN_PROGRESS" }],
      generatedBy: "RULE_ENGINE",
      estimatedDuration: 120,
    });

    await Progress.create({
      user: studentUser._id,
      learningPath: activePath._id,
      module: module1._id,
      status: "IN_PROGRESS",
      percentage: 50,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    // ==========================================
    // TEST SECTION 1: AUTHENTICATION & RBAC
    // ==========================================
    console.log("--- 1. Admin RBAC & Route Protection ---");

    await test("Guest access to /api/admin/stats returns 401 AUTH_REQUIRED", async () => {
      const res = await request("/api/admin/stats");
      if (res.status !== 401)
        throw new Error(`Expected 401, got ${res.status}`);
      if (res.data?.errorCode !== "AUTH_REQUIRED") {
        throw new Error(
          `Expected errorCode AUTH_REQUIRED, got ${res.data?.errorCode}`,
        );
      }
    });

    await test("Student access to /api/admin/stats is forbidden (403 FORBIDDEN)", async () => {
      const res = await request("/api/admin/stats", {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (res.status !== 403)
        throw new Error(`Expected 403, got ${res.status}`);
      if (res.data?.errorCode !== "FORBIDDEN") {
        throw new Error(
          `Expected errorCode FORBIDDEN, got ${res.data?.errorCode}`,
        );
      }
    });

    await test("Admin access to /api/admin/stats succeeds (200 OK)", async () => {
      const res = await request("/api/admin/stats", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
      if (!res.data?.success) throw new Error("Expected success true");
    });

    // ==========================================
    // TEST SECTION 2: STATS OVERVIEW
    // ==========================================
    console.log("\n--- 2. Admin Dashboard Stats Aggregation ---");

    await test("Stats correctly reflect system counts and recent records", async () => {
      const res = await request("/api/admin/stats", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = res.data.data;

      if (data.totalLearners !== 2)
        throw new Error(`Expected 2 learners, got ${data.totalLearners}`);
      if (data.activeLearners !== 1)
        throw new Error(
          `Expected 1 active learner, got ${data.activeLearners}`,
        );
      if (data.totalAssessments !== 1)
        throw new Error(`Expected 1 assessment, got ${data.totalAssessments}`);
      if (data.totalCurriculumModules !== 1) {
        throw new Error(
          `Expected 1 curriculum module, got ${data.totalCurriculumModules}`,
        );
      }
      if (
        !Array.isArray(data.recentAttempts) ||
        data.recentAttempts.length !== 1
      ) {
        throw new Error("Expected recentAttempts to have 1 attempt");
      }
      if (
        !Array.isArray(data.recentLearners) ||
        data.recentLearners.length !== 2
      ) {
        throw new Error("Expected recentLearners to have 2 learners");
      }
    });

    // ==========================================
    // TEST SECTION 3: LEARNER DIRECTORY & ACTIONS
    // ==========================================
    console.log("\n--- 3. Learner Directory (Search, Filter, Pagination) ---");

    await test("Learner listing returns paginated students with activity stats", async () => {
      const res = await request("/api/admin/learners?page=1&limit=10", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
      const { learners, pagination } = res.data.data;

      if (learners.length !== 2)
        throw new Error(`Expected 2 learners, got ${learners.length}`);
      if (pagination.total !== 2)
        throw new Error(`Expected pagination total 2, got ${pagination.total}`);

      const alex = learners.find((l) => l.email === "alex@example.com");
      if (!alex) throw new Error("Alex Rivera not found in learners list");
      if (alex.totalAttempts !== 1)
        throw new Error(
          `Expected Alex to have 1 attempt, got ${alex.totalAttempts}`,
        );
      if (alex.completedAttempts !== 1) {
        throw new Error(
          `Expected Alex to have 1 completed attempt, got ${alex.completedAttempts}`,
        );
      }
      if (alex.hasActiveLearningPath !== true)
        throw new Error("Expected Alex to have active learning path");
    });

    await test("Learner search filters by name or email correctly", async () => {
      const res = await request("/api/admin/learners?search=Taylor", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const { learners } = res.data.data;
      if (learners.length !== 1 || learners[0].email !== "taylor@example.com") {
        throw new Error("Search did not return only Taylor Swift");
      }
    });

    await test("Learner filter by status=ACTIVE returns only active students", async () => {
      const res = await request("/api/admin/learners?status=ACTIVE", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const { learners } = res.data.data;
      if (learners.length !== 1 || learners[0].email !== "alex@example.com") {
        throw new Error("Status filter ACTIVE did not return only Alex Rivera");
      }
    });

    await test("Learner filter by status=INACTIVE returns only inactive students", async () => {
      const res = await request("/api/admin/learners?status=INACTIVE", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const { learners } = res.data.data;
      if (learners.length !== 1 || learners[0].email !== "taylor@example.com") {
        throw new Error(
          "Status filter INACTIVE did not return only Taylor Swift",
        );
      }
    });

    await test("Toggle learner status modifies isActive", async () => {
      const res = await request(
        `/api/admin/learners/${studentUser._id}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { isActive: false },
        },
      );
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
      if (res.data.data.isActive !== false)
        throw new Error("Expected isActive to be false");

      // Reactivate Alex
      await request(`/api/admin/learners/${studentUser._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isActive: true },
      });
    });

    await test("Guard prevents modifying admin account via learner status endpoint", async () => {
      const res = await request(`/api/admin/learners/${adminUser._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isActive: false },
      });
      if (res.status !== 400)
        throw new Error(`Expected 400, got ${res.status}`);
      if (res.data?.errorCode !== "CANNOT_MODIFY_ADMIN") {
        throw new Error(
          `Expected errorCode CANNOT_MODIFY_ADMIN, got ${res.data?.errorCode}`,
        );
      }
    });

    // ==========================================
    // TEST SECTION 4: DETAILED LEARNER INSPECTION
    // ==========================================
    console.log("\n--- 4. Detailed Learner Profile & Progress Inspection ---");

    await test("Retrieve full learner details (profile, attempts, active path, progress)", async () => {
      const res = await request(`/api/admin/learners/${studentUser._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
      const { user, profile, attempts, learningPath, progressSummary } =
        res.data.data;

      if (user.email !== "alex@example.com")
        throw new Error("Unexpected user email");
      if (!profile || profile.educationLevel !== "UNDERGRADUATE") {
        throw new Error("Expected learner profile with UNDERGRADUATE level");
      }
      if (attempts.length !== 1 || attempts[0].status !== "COMPLETED") {
        throw new Error("Expected 1 completed attempt in learner details");
      }
      if (!learningPath || learningPath.version !== 1) {
        throw new Error("Expected active learning path version 1");
      }
      if (!progressSummary || progressSummary.inProgressModules !== 1) {
        throw new Error("Expected progress summary with 1 in-progress module");
      }
    });

    await test("Invalid ObjectId for learner details returns 400 INVALID_LEARNER_ID", async () => {
      const res = await request("/api/admin/learners/not-an-id", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 400)
        throw new Error(`Expected 400, got ${res.status}`);
      if (res.data?.errorCode !== "INVALID_LEARNER_ID") {
        throw new Error(
          `Expected errorCode INVALID_LEARNER_ID, got ${res.data?.errorCode}`,
        );
      }
    });

    await test("Non-existent learner returns 404 LEARNER_NOT_FOUND", async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      const res = await request(`/api/admin/learners/${nonExistent}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 404)
        throw new Error(`Expected 404, got ${res.status}`);
      if (res.data?.errorCode !== "LEARNER_NOT_FOUND") {
        throw new Error(
          `Expected errorCode LEARNER_NOT_FOUND, got ${res.data?.errorCode}`,
        );
      }
    });

    // ==========================================
    // TEST SECTION 5: QUESTION CRUD & REORDERING
    // ==========================================
    console.log("\n--- 5. Admin Question Management & Reordering ---");

    let createdQuestionId = null;

    await test("Admin adds a new question to an assessment", async () => {
      const res = await request(
        `/api/assessments/${assessment1._id}/questions`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            questionText:
              "When faced with a difficult bug, do you isolate variables systematically?",
            questionType: "LIKERT_SCALE",
            dimension: "analytical",
            order: 1,
            options: [
              { label: "Strongly Disagree", value: 1, score: 20 },
              { label: "Disagree", value: 2, score: 40 },
              { label: "Neutral", value: 3, score: 60 },
              { label: "Agree", value: 4, score: 80 },
              { label: "Strongly Agree", value: 5, score: 100 },
            ],
          },
        },
      );
      if (res.status !== 201)
        throw new Error(`Expected 201, got ${res.status}`);
      createdQuestionId = res.data.data._id;
      if (!createdQuestionId) throw new Error("Question was not created");
    });

    await test("Admin updates an existing question", async () => {
      const res = await request(`/api/questions/${createdQuestionId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          questionText:
            "Updated question text for systematic variable isolation",
        },
      });
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
      if (
        res.data.data.questionText !==
        "Updated question text for systematic variable isolation"
      ) {
        throw new Error("Question text did not update");
      }
    });

    await test("Admin reorders a question", async () => {
      const res = await request(`/api/questions/${createdQuestionId}/order`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { order: 2 },
      });
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
      if (res.data.data.order !== 2)
        throw new Error("Order was not updated to 2");
    });

    await test("Admin deletes a question", async () => {
      const res = await request(`/api/questions/${createdQuestionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
    });

    // ==========================================
    // TEST SECTION 6: CURRICULUM MANAGEMENT
    // ==========================================
    console.log("\n--- 6. Admin Curriculum Management ---");

    let createdModuleId = null;

    await test("Admin creates a new curriculum module", async () => {
      const res = await request("/api/curriculum/modules", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          title: "Advanced Express Architecture",
          slug: "advanced-express-arch",
          description: "Production patterns for Node/Express APIs",
          category: "BACKEND",
          difficulty: "ADVANCED",
          estimatedDuration: 180,
          skills: [
            { name: "Express.js", level: "ADVANCED" },
            { name: "Architecture", level: "ADVANCED" },
          ],
          learningObjectives: ["Build layered REST APIs"],
          isActive: true,
        },
      });
      if (res.status !== 201)
        throw new Error(`Expected 201, got ${res.status}`);
      createdModuleId = res.data.data._id;
    });

    await test("Admin toggles module active status", async () => {
      const res = await request(
        `/api/curriculum/modules/${createdModuleId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { isActive: false },
        },
      );
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
      if (res.data.data.isActive !== false)
        throw new Error("Expected module isActive to be false");
    });

    await test("Admin safely deletes module without dependents", async () => {
      const res = await request(`/api/curriculum/modules/${createdModuleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200)
        throw new Error(`Expected 200, got ${res.status}`);
    });
  } finally {
    // Teardown
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }

  console.log("\n======================================================");
  console.log(
    `📊 Admin Verification Results: ${passedTests} Passed, ${failedTests} Failed`,
  );
  console.log("======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
