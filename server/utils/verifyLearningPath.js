/**
 * PsychePath Phase 9: Personalized Learning Paths Verification
 *
 * Automated verification of:
 * - Profile readiness gate & validation
 * - Hybrid (Gemini) and deterministic (RULE_ENGINE) path generation
 * - Authoritative duration summation and real module referencing
 * - Prerequisite DAG ordering preservation in persisted paths
 * - Versioning ($v1 -> v2 -> v3$) and single-active-path archiving
 * - Current path, version history, and ID-based retrieval APIs
 * - Authentication, IDOR ownership protection, and data isolation
 *
 * Uses in-memory MongoDB and mocked Gemini transport so NO live API key is required in CI.
 */

const http = require("http");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

const app = require("../app");
const config = require("../config");
const {
  User,
  LearnerProfile,
  CurriculumModule,
  LearningPath,
  AssessmentAttempt,
} = require("../models");
const geminiService = require("../services/geminiService");

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

async function runLearningPathTests() {
  console.log("\n======================================================");
  console.log(
    "🧪 PsychePath Phase 9: Personalized Learning Paths Verification",
  );
  console.log("======================================================\n");

  // Spin up in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Start HTTP server on dynamic port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  serverBaseUrl = `http://127.0.0.1:${port}/api`;

  // 1. Seed users
  const studentAlex = await User.create({
    firstName: "Alex",
    lastName: "Chen",
    email: "alex.lp@psychepath.io",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  const studentSarah = await User.create({
    firstName: "Sarah",
    lastName: "Kim",
    email: "sarah.lp@psychepath.io",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

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

  // 2. Seed curriculum modules with prerequisite chain (modJS -> modNode -> modExpress)
  const modJS = await CurriculumModule.create({
    title: "JavaScript Foundations",
    description: "Core JS language constructs, closures, and promises",
    category: "FRONTEND",
    difficulty: "BEGINNER",
    estimatedDuration: 40,
    skills: [{ name: "JavaScript", level: "BEGINNER" }],
    order: 1,
    isActive: true,
  });

  const modNode = await CurriculumModule.create({
    title: "Node.js Server Architecture",
    description: "Event loop, streams, and non-blocking I/O",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 60,
    skills: [{ name: "Node.js", level: "INTERMEDIATE" }],
    prerequisites: [modJS._id],
    order: 2,
    isActive: true,
  });

  const modExpress = await CurriculumModule.create({
    title: "REST API Engineering with Express",
    description: "Layered controllers, middleware, and API security",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 50,
    skills: [{ name: "Express", level: "INTERMEDIATE" }],
    prerequisites: [modNode._id],
    order: 3,
    isActive: true,
  });

  const modDB = await CurriculumModule.create({
    title: "MongoDB & Database Modeling",
    description: "NoSQL document design, indexing, and aggregation pipelines",
    category: "DATABASE",
    difficulty: "BEGINNER",
    estimatedDuration: 45,
    skills: [{ name: "MongoDB", level: "BEGINNER" }],
    order: 4,
    isActive: true,
  });

  // 3. Seed assessment attempt for Alex
  const alexAttempt = await AssessmentAttempt.create({
    user: studentAlex._id,
    assessment: new mongoose.Types.ObjectId(),
    status: "COMPLETED",
    answers: [],
    dimensionScores: new Map([
      ["abstractReasoning", 85],
      ["conscientiousness", 90],
    ]),
    strengths: ["Deductive logic", "Systematic planning"],
    improvementAreas: ["Asynchronous debugging"],
    completedAt: new Date(),
  });

  // 4. Seed learner profiles
  await LearnerProfile.create({
    user: studentAlex._id,
    educationLevel: "UNDERGRADUATE",
    experienceLevel: "BEGINNER",
    currentSkills: [{ name: "JavaScript", level: "BEGINNER" }],
    learningGoals: [
      { name: "Become a Full-Stack Backend Developer", priority: 1 },
    ],
    interests: ["Node.js", "Databases"],
    learningPreferences: {
      preferredFormat: "PROJECT",
      preferredDifficulty: "INTERMEDIATE",
      preferredSessionDuration: 60,
    },
    assessmentDimensions: {
      abstractReasoning: 85,
      conscientiousness: 90,
    },
    strengths: ["Deductive logic"],
    improvementAreas: ["Asynchronous debugging"],
    lastAssessmentAttempt: alexAttempt._id,
  });

  // Sarah has no profile initially

  // -------------------------------------------------------------
  // SUITE 1: Authentication & Profile Readiness Gate
  // -------------------------------------------------------------
  console.log("\n--- 1. Authentication & Profile Readiness Gate ---");

  await test("Unauthenticated path generation is rejected (401 AUTH_REQUIRED)", async () => {
    const res = await fetch(`${serverBaseUrl}/learning-path/generate`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "AUTH_REQUIRED")
      throw new Error(`Expected AUTH_REQUIRED, got ${data.errorCode}`);
  });

  await test("Generation request for user without profile returns 404 PROFILE_NOT_FOUND", async () => {
    const res = await fetch(`${serverBaseUrl}/learning-path/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sarahToken}` },
    });
    const data = await res.json();
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    if (data.errorCode !== "PROFILE_NOT_FOUND")
      throw new Error(`Expected PROFILE_NOT_FOUND, got ${data.errorCode}`);
  });

  await test("Incomplete profile returns 400 PROFILE_INCOMPLETE", async () => {
    // Create empty profile for Sarah
    await LearnerProfile.create({
      user: studentSarah._id,
      educationLevel: "UNDERGRADUATE",
      currentSkills: [],
      learningGoals: [],
      assessmentDimensions: {},
    });

    const res = await fetch(`${serverBaseUrl}/learning-path/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sarahToken}` },
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "PROFILE_INCOMPLETE")
      throw new Error(`Expected PROFILE_INCOMPLETE, got ${data.errorCode}`);
  });

  // -------------------------------------------------------------
  // SUITE 2: Hybrid Learning Path Generation (Gemini AI)
  // -------------------------------------------------------------
  console.log("\n--- 2. Hybrid Learning Path Generation (Gemini AI) ---");

  let pathV1;

  await test("Generate initial learning path successfully (201 Created, HYBRID)", async () => {
    // Mock Gemini personalized response
    geminiService.setCustomTransport(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    summary: "Curated backend mastery journey for Alex Chen",
                    focusAreas: ["Server Runtime", "REST Engineering"],
                    learningStrategy: [
                      "Study in 60-minute blocks aligned with your optimal session duration",
                      "Build hands-on Express APIs for each milestone",
                    ],
                    sequence: [
                      {
                        moduleId: modNode._id.toString(),
                        reason:
                          "Bridges JavaScript baseline into server architecture",
                        priority: 1,
                      },
                      {
                        moduleId: modDB._id.toString(),
                        reason: "Essential database persistence layer",
                        priority: 2,
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    }));

    const res = await fetch(`${serverBaseUrl}/learning-path/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${alexToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxModules: 5 }),
    });

    const body = await res.json();
    if (res.status !== 201) {
      throw new Error(`Expected 201, got ${res.status}: ${body.message}`);
    }
    if (!body.success || !body.data)
      throw new Error("Expected success: true and data object");

    pathV1 = body.data;
    if (pathV1.status !== "ACTIVE") {
      throw new Error(`Expected status ACTIVE, got ${pathV1.status}`);
    }
    if (pathV1.version !== 1) {
      throw new Error(`Expected version 1, got ${pathV1.version}`);
    }
    if (pathV1.generatedBy !== "HYBRID") {
      throw new Error(`Expected generatedBy HYBRID, got ${pathV1.generatedBy}`);
    }
    if (!Array.isArray(pathV1.modules) || pathV1.modules.length === 0) {
      throw new Error("Expected non-empty modules array in learning path");
    }
    if (pathV1.summary !== "Curated backend mastery journey for Alex Chen") {
      throw new Error(`Summary mismatch: ${pathV1.summary}`);
    }
    if (pathV1.focusAreas.length !== 2) {
      throw new Error(
        `Expected 2 focus areas, got ${pathV1.focusAreas.length}`,
      );
    }
  });

  await test("Authoritative estimatedDuration equals sum of populated modules", async () => {
    const expectedSum = pathV1.modules.reduce(
      (acc, m) => acc + (m.module?.estimatedDuration || 0),
      0,
    );
    if (pathV1.estimatedDuration !== expectedSum) {
      throw new Error(
        `Duration calculation mismatch: expected ${expectedSum}, got ${pathV1.estimatedDuration}`,
      );
    }
  });

  await test("Path modules strictly reference existing CurriculumModule documents", async () => {
    const validIds = new Set([
      modJS._id.toString(),
      modNode._id.toString(),
      modExpress._id.toString(),
      modDB._id.toString(),
    ]);

    for (const item of pathV1.modules) {
      if (!validIds.has(item.module.id)) {
        throw new Error(
          `Referenced module ${item.module.id} is not in database!`,
        );
      }
      if (item.status !== "NOT_STARTED") {
        throw new Error(
          `Initial module status must be NOT_STARTED, got ${item.status}`,
        );
      }
    }
  });

  // -------------------------------------------------------------
  // SUITE 3: Deterministic Fallback Generation (RULE_ENGINE)
  // -------------------------------------------------------------
  console.log("\n--- 3. Deterministic Fallback Generation (RULE_ENGINE) ---");

  await test("Gemini outage triggers deterministic fallback path (generatedBy: RULE_ENGINE)", async () => {
    // Simulate Gemini network drop
    geminiService.setCustomTransport(async () => {
      throw new Error("Simulated Gemini connection timeout");
    });

    const res = await fetch(`${serverBaseUrl}/learning-path/regenerate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${alexToken}` },
    });

    const body = await res.json();
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${body.message}`);
    }
    if (body.data.generatedBy !== "RULE_ENGINE") {
      throw new Error(
        `Expected generatedBy RULE_ENGINE, got ${body.data.generatedBy}`,
      );
    }
    if (body.data.version !== 2) {
      throw new Error(`Expected version 2, got ${body.data.version}`);
    }
  });

  // -------------------------------------------------------------
  // SUITE 4: Prerequisite DAG Preservation in Persisted Path
  // -------------------------------------------------------------
  console.log("\n--- 4. Prerequisite DAG Preservation in Persisted Path ---");

  await test("Inverted AI sequence (Express before Node.js) is repaired before persistence", async () => {
    // Give Alex intermediate Node.js so Express is actionable
    await LearnerProfile.findOneAndUpdate(
      { user: studentAlex._id },
      {
        $push: { currentSkills: { name: "Node.js", level: "INTERMEDIATE" } },
      },
    );

    // AI attempts to order Express (B) before Node.js (A)
    geminiService.setCustomTransport(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    summary: "Topological test",
                    focusAreas: ["API"],
                    learningStrategy: ["Code daily"],
                    sequence: [
                      {
                        moduleId: modExpress._id.toString(),
                        reason: "Express first",
                      },
                      {
                        moduleId: modNode._id.toString(),
                        reason: "Node second",
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    }));

    const res = await fetch(`${serverBaseUrl}/learning-path/regenerate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${alexToken}` },
    });

    const body = await res.json();
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }

    const modules = body.data.modules;
    const nodeIdx = modules.findIndex(
      (m) => m.module.id === modNode._id.toString(),
    );
    const expressIdx = modules.findIndex(
      (m) => m.module.id === modExpress._id.toString(),
    );

    if (nodeIdx !== -1 && expressIdx !== -1 && nodeIdx > expressIdx) {
      throw new Error(
        "DAG prerequisite violation: Node.js must precede Express!",
      );
    }
  });

  // -------------------------------------------------------------
  // SUITE 5: Versioning & Single Active Path Invariant
  // -------------------------------------------------------------
  console.log("\n--- 5. Versioning & Single Active Path Invariant ---");

  await test("Regeneration archives previous versions; exactly ONE active path per student", async () => {
    const allAlexPaths = await LearningPath.find({
      user: studentAlex._id,
    }).lean();
    const activePaths = allAlexPaths.filter((p) => p.status === "ACTIVE");
    const archivedPaths = allAlexPaths.filter((p) => p.status === "ARCHIVED");

    if (activePaths.length !== 1) {
      throw new Error(
        `Expected exactly 1 ACTIVE path, found ${activePaths.length}`,
      );
    }
    if (archivedPaths.length < 2) {
      throw new Error(
        `Expected at least 2 ARCHIVED paths, found ${archivedPaths.length}`,
      );
    }
  });

  // -------------------------------------------------------------
  // SUITE 6: Retrieval Endpoints & Ownership Security
  // -------------------------------------------------------------
  console.log("\n--- 6. Retrieval Endpoints & Ownership Security ---");

  let currentAlexPath;

  await test("GET /api/learning-path/current returns active learning path", async () => {
    const res = await fetch(`${serverBaseUrl}/learning-path/current`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const body = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!body.data || body.data.status !== "ACTIVE") {
      throw new Error("Expected active learning path");
    }
    currentAlexPath = body.data;
  });

  await test("GET /api/learning-path/history returns all versions descending", async () => {
    const res = await fetch(`${serverBaseUrl}/learning-path/history`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const body = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(body.data) || body.data.length < 3) {
      throw new Error(
        `Expected history list of at least 3 paths, got ${body.data?.length}`,
      );
    }
    // Verify sorted descending by version
    for (let i = 0; i < body.data.length - 1; i++) {
      if (body.data[i].version < body.data[i + 1].version) {
        throw new Error("History must be ordered descending by version!");
      }
    }
  });

  await test("GET /api/learning-path/:id retrieves path by ID for owner", async () => {
    const res = await fetch(
      `${serverBaseUrl}/learning-path/${currentAlexPath.id}`,
      {
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );
    const body = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (body.data.id !== currentAlexPath.id) {
      throw new Error("Retrieved path ID mismatch");
    }
  });

  await test("Student Sarah CANNOT access Alex learning path by ID (403 PATH_ACCESS_DENIED)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/learning-path/${currentAlexPath.id}`,
      {
        headers: { Authorization: `Bearer ${sarahToken}` },
      },
    );
    const body = await res.json();
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    if (body.errorCode !== "PATH_ACCESS_DENIED") {
      throw new Error(`Expected PATH_ACCESS_DENIED, got ${body.errorCode}`);
    }
  });

  await test("Invalid path ObjectId format returns 400 INVALID_PATH_ID", async () => {
    const res = await fetch(`${serverBaseUrl}/learning-path/not-a-mongo-id`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const body = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (body.errorCode !== "INVALID_PATH_ID") {
      throw new Error(`Expected INVALID_PATH_ID, got ${body.errorCode}`);
    }
  });

  // Teardown
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise((resolve) => server.close(resolve));

  console.log("\n======================================================");
  console.log(
    `📊 Learning Path Verification Results: ${passedTests} Passed, ${failedTests} Failed`,
  );
  console.log("======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLearningPathTests().catch((err) => {
  console.error("Fatal error during LearningPath verification:", err);
  process.exit(1);
});
