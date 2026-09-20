/**
 * PsychePath Phase 10: Progress Tracking Verification
 *
 * Automated verification of:
 * - Lazy module progress initialization & start idempotency
 * - Server-authoritative percentage updates and status derivation
 * - Input validation (0-100 bounds, non-numeric rejection)
 * - Monotonic progression (regression rejection)
 * - Module completion, idempotency & timestamp preservation
 * - Module skip behavior and denominator exclusion
 * - LearningPath overall progress & completion calculation
 * - Immutable ProgressHistory audit trail with pagination and filtering
 * - LearningPath regeneration version isolation (v1 vs v2)
 * - Archived path mutation protection (PATH_ARCHIVED)
 * - IDOR security and ownership isolation
 * - Module membership validation
 * - Single-roundtrip current path progress API
 *
 * Uses in-memory MongoDB for zero-side-effect, completely isolated testing.
 */

const http = require("http");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

const app = require("../app");
const config = require("../config");
const {
  User,
  CurriculumModule,
  LearningPath,
  Progress,
  ProgressHistory,
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
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              text: data,
            });
          }
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

function generateTestToken(userId, role = "STUDENT") {
  return jwt.sign({ sub: userId.toString(), role }, config.jwtSecret, {
    expiresIn: "1h",
  });
}

async function runProgressTests() {
  console.log("\n======================================================");
  console.log("   PsychePath Phase 10: Progress Tracking Test Suite   ");
  console.log("======================================================\n");

  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        serverBaseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // ----------------------------------------------------
    // Fixtures Setup: Users, Modules, LearningPaths
    // ----------------------------------------------------
    const userA = await User.create({
      firstName: "Alice",
      lastName: "Student",
      email: "alice@example.com",
      password: "TestPassword123!",
      role: "STUDENT",
      isActive: true,
    });

    const userB = await User.create({
      firstName: "Bob",
      lastName: "Student",
      email: "bob@example.com",
      password: "TestPassword123!",
      role: "STUDENT",
      isActive: true,
    });

    const tokenA = generateTestToken(userA._id);
    const tokenB = generateTestToken(userB._id);

    // Create 5 curriculum modules
    const modules = [];
    for (let i = 1; i <= 5; i++) {
      modules.push(
        await CurriculumModule.create({
          title: `Curriculum Module ${i}`,
          description: `Description for Module ${i}`,
          category: i <= 2 ? "Frontend" : "Backend",
          difficulty: i === 1 ? "BEGINNER" : "INTERMEDIATE",
          estimatedDuration: 10 + i * 2,
          skills: [{ name: `Skill ${i}`, level: "INTERMEDIATE" }],
          learningObjectives: [`Objective ${i}`],
        }),
      );
    }

    const unrelatedModule = await CurriculumModule.create({
      title: "Unrelated Module",
      description: "Not in any path",
      category: "DevOps",
      difficulty: "ADVANCED",
      estimatedDuration: 30,
      skills: [{ name: "Docker", level: "ADVANCED" }],
      learningObjectives: ["Containers"],
    });

    // Create LearningPath v1 for User A with first 4 modules
    const pathA1 = await LearningPath.create({
      user: userA._id,
      title: "Alice Learning Path v1",
      status: "ACTIVE",
      version: 1,
      generatedBy: "RULE_ENGINE",
      estimatedDuration: 56,
      modules: [
        { module: modules[0]._id, order: 1, status: "NOT_STARTED" },
        { module: modules[1]._id, order: 2, status: "NOT_STARTED" },
        { module: modules[2]._id, order: 3, status: "NOT_STARTED" },
        { module: modules[3]._id, order: 4, status: "NOT_STARTED" },
      ],
    });

    // Create LearningPath for User B
    const pathB = await LearningPath.create({
      user: userB._id,
      title: "Bob Learning Path",
      status: "ACTIVE",
      version: 1,
      generatedBy: "RULE_ENGINE",
      estimatedDuration: 30,
      modules: [{ module: modules[4]._id, order: 1, status: "NOT_STARTED" }],
    });

    // ----------------------------------------------------
    // Test 1: Start Module
    // ----------------------------------------------------
    await test("1. Start module initializes progress with IN_PROGRESS, sets startedAt and records history", async () => {
      const res = await request("/api/progress/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
        },
      });

      if (res.status !== 200 || !res.body.success) {
        throw new Error(
          `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }

      const { progress, summary } = res.body.data;
      if (progress.status !== "IN_PROGRESS") {
        throw new Error(`Expected status IN_PROGRESS, got ${progress.status}`);
      }
      if (progress.percentage !== 0) {
        throw new Error(`Expected percentage 0, got ${progress.percentage}`);
      }
      if (!progress.startedAt) {
        throw new Error("startedAt timestamp was not set");
      }
      if (!progress.lastAccessedAt) {
        throw new Error("lastAccessedAt timestamp was not set");
      }
      if (summary.inProgressModules !== 1 || summary.totalModules !== 4) {
        throw new Error(`Unexpected summary: ${JSON.stringify(summary)}`);
      }

      // Verify audit history
      const history = await ProgressHistory.findOne({
        user: userA._id,
        module: modules[0]._id,
        action: "STARTED",
      });
      if (!history || history.newStatus !== "IN_PROGRESS") {
        throw new Error("ProgressHistory STARTED event was not recorded");
      }
    });

    // ----------------------------------------------------
    // Test 2: Start Module Idempotency
    // ----------------------------------------------------
    await test("2. Restarting an in-progress module is idempotent (preserves startedAt and percentage)", async () => {
      // First update percentage to 30
      await request("/api/progress", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
          percentage: 30,
        },
      });

      const beforeDoc = await Progress.findOne({
        user: userA._id,
        module: modules[0]._id,
      });
      const originalStartedAt = beforeDoc.startedAt.toISOString();

      // Call start again
      const res = await request("/api/progress/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
        },
      });

      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }

      const { progress } = res.body.data;
      if (progress.percentage !== 30) {
        throw new Error(
          `Percentage was reset! Expected 30, got ${progress.percentage}`,
        );
      }
      if (new Date(progress.startedAt).toISOString() !== originalStartedAt) {
        throw new Error("startedAt was overwritten on idempotent start");
      }
    });

    // ----------------------------------------------------
    // Test 3: Update Progress Valid Percentage Transitions
    // ----------------------------------------------------
    await test("3. Updating progress percentage increases progress monotonically and audits transitions", async () => {
      const res = await request("/api/progress", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
          percentage: 75,
        },
      });

      if (res.status !== 200) {
        throw new Error(
          `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }

      const { progress, summary } = res.body.data;
      if (progress.percentage !== 75) {
        throw new Error(`Expected 75%, got ${progress.percentage}`);
      }
      if (progress.status !== "IN_PROGRESS") {
        throw new Error(`Expected IN_PROGRESS, got ${progress.status}`);
      }

      const history = await ProgressHistory.findOne({
        user: userA._id,
        module: modules[0]._id,
        action: "PROGRESS_UPDATED",
        newPercentage: 75,
      });
      if (!history || history.previousPercentage !== 30) {
        throw new Error(
          "Audit history did not capture previous and new percentage transition",
        );
      }
    });

    // ----------------------------------------------------
    // Test 4: Percentage Input Validation
    // ----------------------------------------------------
    await test("4. Rejects invalid percentage inputs (-1, 101, NaN, strings, null)", async () => {
      const testCases = [-1, 101, "fifty", null, NaN];

      for (const invalidVal of testCases) {
        const res = await request("/api/progress", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tokenA}` },
          body: {
            learningPathId: pathA1._id.toString(),
            moduleId: modules[0]._id.toString(),
            percentage: invalidVal,
          },
        });

        if (res.status !== 400) {
          throw new Error(
            `Expected 400 for value ${invalidVal}, got ${res.status}`,
          );
        }
      }
    });

    // ----------------------------------------------------
    // Test 5: Monotonic Progression (Regression Rejection)
    // ----------------------------------------------------
    await test("5. Rejects progress regression (attempting to decrease percentage)", async () => {
      const res = await request("/api/progress", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
          percentage: 50, // current is 75%
        },
      });

      if (res.status !== 400 || res.body.errorCode !== "PROGRESS_REGRESSION") {
        throw new Error(
          `Expected 400 PROGRESS_REGRESSION, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 6: Explicit Completion & Idempotency
    // ----------------------------------------------------
    await test("6. Complete module sets percentage to 100%, status COMPLETED, and is idempotent", async () => {
      const res1 = await request("/api/progress/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
        },
      });

      if (res1.status !== 200) {
        throw new Error(
          `Expected 200, got ${res1.status}: ${JSON.stringify(res1.body)}`,
        );
      }

      const { progress: p1 } = res1.body.data;
      if (
        p1.status !== "COMPLETED" ||
        p1.percentage !== 100 ||
        !p1.completedAt
      ) {
        throw new Error(`Incomplete completion state: ${JSON.stringify(p1)}`);
      }

      const originalCompletedAt = new Date(p1.completedAt).toISOString();

      // Repeated call to complete
      const res2 = await request("/api/progress/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
        },
      });

      if (res2.status !== 200) {
        throw new Error(`Expected 200, got ${res2.status}`);
      }
      const { progress: p2 } = res2.body.data;
      if (new Date(p2.completedAt).toISOString() !== originalCompletedAt) {
        throw new Error("completedAt changed on repeated completion call");
      }
    });

    // ----------------------------------------------------
    // Test 7: Skip Module & Formula Exclusion
    // ----------------------------------------------------
    await test("7. Skip module marks status SKIPPED, percentage 0, and excludes module from calculation denominator", async () => {
      const res = await request("/api/progress/skip", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[1]._id.toString(),
        },
      });

      if (res.status !== 200) {
        throw new Error(
          `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }

      const { progress, summary } = res.body.data;
      if (progress.status !== "SKIPPED" || progress.percentage !== 0) {
        throw new Error(`Unexpected skip state: ${JSON.stringify(progress)}`);
      }

      // Total = 4, Skipped = 1 => Actionable = 3. Completed = 1 (Module 0).
      // Overall progress = 1 / 3 = 33%
      if (
        summary.totalModules !== 4 ||
        summary.skippedModules !== 1 ||
        summary.actionableModules !== 3
      ) {
        throw new Error(
          `Unexpected summary counts: ${JSON.stringify(summary)}`,
        );
      }
      if (summary.overallProgress !== 33) {
        throw new Error(
          `Expected 33% progress, got ${summary.overallProgress}%`,
        );
      }

      // Cannot skip an already completed module (Module 0)
      const errRes = await request("/api/progress/skip", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
        },
      });
      if (
        errRes.status !== 400 ||
        errRes.body.errorCode !== "INVALID_PROGRESS_TRANSITION"
      ) {
        throw new Error(
          `Expected 400 INVALID_PROGRESS_TRANSITION for skipping completed module, got ${errRes.status}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 8: Overall Path Completion (100% & isComplete)
    // ----------------------------------------------------
    await test("8. Completing all actionable modules yields 100% and isComplete = true", async () => {
      // Complete remaining actionable modules (Module 2 and Module 3)
      await request("/api/progress/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[2]._id.toString(),
        },
      });

      const res = await request("/api/progress/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[3]._id.toString(),
        },
      });

      const { summary } = res.body.data;
      // Total: 4, Skipped: 1, Actionable: 3, Completed: 3 => 100%
      if (
        summary.completedModules !== 3 ||
        summary.overallProgress !== 100 ||
        !summary.isComplete
      ) {
        throw new Error(
          `Expected 100% and isComplete: true, got ${JSON.stringify(summary)}`,
        );
      }

      // Verify LearningPath document status synchronized to COMPLETED
      const updatedPath = await LearningPath.findById(pathA1._id);
      if (updatedPath.status !== "COMPLETED") {
        throw new Error(
          `Expected LearningPath status COMPLETED, got ${updatedPath.status}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 9: Progress History Audit Trail Queries & Pagination
    // ----------------------------------------------------
    await test("9. Progress history returns paginated, immutable audit trail with module filtering", async () => {
      const resAll = await request(
        `/api/progress/${pathA1._id}/history?limit=10`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenA}` },
        },
      );

      if (resAll.status !== 200 || !resAll.body.success) {
        throw new Error(`Expected 200, got ${resAll.status}`);
      }

      const { history, pagination } = resAll.body.data;
      if (!Array.isArray(history) || history.length < 3) {
        throw new Error(
          `Expected at least 3 history items, got ${history.length}`,
        );
      }
      if (pagination.total < 3 || pagination.page !== 1) {
        throw new Error(
          `Unexpected pagination metadata: ${JSON.stringify(pagination)}`,
        );
      }

      // Test module filter
      const resFiltered = await request(
        `/api/progress/${pathA1._id}/history?moduleId=${modules[1]._id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenA}` },
        },
      );

      const filteredHistory = resFiltered.body.data.history;
      if (
        filteredHistory.length !== 1 ||
        filteredHistory[0].action !== "SKIPPED"
      ) {
        throw new Error(
          `Filter by module failed: ${JSON.stringify(filteredHistory)}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 10: Path Regeneration Version Isolation
    // ----------------------------------------------------
    await test("10. Regenerated LearningPath v2 starts with independent progress, keeping v1 progress attached to v1", async () => {
      // Archive pathA1 and create pathA2
      await LearningPath.findByIdAndUpdate(pathA1._id, { status: "ARCHIVED" });

      const pathA2 = await LearningPath.create({
        user: userA._id,
        title: "Alice Learning Path v2",
        status: "ACTIVE",
        version: 2,
        generatedBy: "HYBRID",
        estimatedDuration: 40,
        modules: [
          { module: modules[0]._id, order: 1, status: "NOT_STARTED" },
          { module: modules[4]._id, order: 2, status: "NOT_STARTED" },
        ],
      });

      // Verify v1 progress is still 100%
      const resV1 = await request(`/api/progress/summary/${pathA1._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      if (resV1.body.data.overallProgress !== 100) {
        throw new Error(
          `v1 progress altered! Expected 100%, got ${resV1.body.data.overallProgress}%`,
        );
      }

      // Verify v2 progress is initially 0%
      const resV2 = await request(`/api/progress/summary/${pathA2._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      if (
        resV2.body.data.overallProgress !== 0 ||
        resV2.body.data.completedModules !== 0
      ) {
        throw new Error(
          `v2 progress was not independent! Got ${JSON.stringify(resV2.body.data)}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 11: Archived Path Mutation Rejection
    // ----------------------------------------------------
    await test("11. Progress mutations on archived paths are rejected with PATH_ARCHIVED (400)", async () => {
      const res = await request("/api/progress/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          learningPathId: pathA1._id.toString(), // pathA1 is ARCHIVED
          moduleId: modules[0]._id.toString(),
        },
      });

      if (res.status !== 400 || res.body.errorCode !== "PATH_ARCHIVED") {
        throw new Error(
          `Expected 400 PATH_ARCHIVED, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 12: Security & IDOR Isolation
    // ----------------------------------------------------
    await test("12. User B cannot access or mutate User A's progress (IDOR isolation)", async () => {
      // User B attempts to start module on User A's path
      const resMutate = await request("/api/progress/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenB}` },
        body: {
          learningPathId: pathA1._id.toString(),
          moduleId: modules[0]._id.toString(),
        },
      });
      if (
        resMutate.status !== 403 ||
        resMutate.body.errorCode !== "LEARNING_PATH_NOT_OWNED"
      ) {
        throw new Error(
          `Expected 403 LEARNING_PATH_NOT_OWNED, got ${resMutate.status}`,
        );
      }

      // User B attempts to query User A's progress history
      const resHistory = await request(`/api/progress/${pathA1._id}/history`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      if (resHistory.status !== 403) {
        throw new Error(
          `Expected 403 for cross-user history, got ${resHistory.status}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 13: Module Membership Validation
    // ----------------------------------------------------
    await test("13. Rejects progress mutation for a module not part of the specified learning path", async () => {
      const res = await request("/api/progress/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenB}` },
        body: {
          learningPathId: pathB._id.toString(),
          moduleId: unrelatedModule._id.toString(),
        },
      });

      if (
        res.status !== 400 ||
        res.body.errorCode !== "MODULE_NOT_IN_LEARNING_PATH"
      ) {
        throw new Error(
          `Expected 400 MODULE_NOT_IN_LEARNING_PATH, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }
    });

    // ----------------------------------------------------
    // Test 14: Current Path Progress API
    // ----------------------------------------------------
    await test("14. GET /api/progress/current retrieves active path progress and merged module states in single response", async () => {
      const res = await request("/api/progress/current", {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      });

      if (res.status !== 200 || !res.body.success) {
        throw new Error(
          `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }

      const { learningPathId, modules: pathMods, pathSummary } = res.body.data;
      if (learningPathId !== pathB._id.toString()) {
        throw new Error(`Expected path ${pathB._id}, got ${learningPathId}`);
      }
      if (!Array.isArray(pathMods) || pathMods.length !== 1) {
        throw new Error(`Expected 1 module, got ${pathMods.length}`);
      }
      if (
        pathMods[0].status !== "NOT_STARTED" ||
        pathMods[0].percentage !== 0
      ) {
        throw new Error(
          `Unexpected module state: ${JSON.stringify(pathMods[0])}`,
        );
      }
      if (pathSummary.overallProgress !== 0) {
        throw new Error(
          `Expected 0% overall progress, got ${pathSummary.overallProgress}%`,
        );
      }
    });
  } catch (error) {
    console.error("FATAL ERROR during test execution:", error);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log("\n------------------------------------------------------");
    console.log(`Total Tests Run: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log("------------------------------------------------------\n");

    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runProgressTests();
}

module.exports = { runProgressTests };
