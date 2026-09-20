const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const config = require("../config");
const { User, LearnerProfile, CurriculumModule } = require("../models");
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
    config.jwtSecret = "test_suite_recommendation_secret_key_at_least_32_chars";
  }

  // Ensure deterministic engine testing without live AI non-determinism
  config.geminiApiKey = "";

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

const runRecommendationTests = async () => {
  console.log("\n======================================================");
  console.log("🧪 PsychePath Phase 7: Recommendation Engine Verification");
  console.log("======================================================\n");

  await setup();

  // Clear relevant collections
  await Promise.all([
    User.deleteMany({}),
    LearnerProfile.deleteMany({}),
    CurriculumModule.deleteMany({}),
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

  // 1. Create Users
  const studentAlex = await User.create({
    firstName: "Alex",
    lastName: "Chen",
    email: "alex.rec@psychepath.io",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  const studentSarah = await User.create({
    firstName: "Sarah",
    lastName: "Kim",
    email: "sarah.rec@psychepath.io",
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

  // 2. Create Curriculum Modules forming realistic prerequisite chains
  const modJS = await CurriculumModule.create({
    title: "JavaScript Fundamentals",
    description: "Core ECMAScript variables, functions, and arrays",
    category: "FRONTEND",
    difficulty: "BEGINNER",
    estimatedDuration: 10,
    skills: [{ name: "JavaScript", level: "BEGINNER" }],
    learningObjectives: [
      "Understand variables and functions",
      "Manipulate arrays",
    ],
    order: 1,
    isActive: true,
  });

  const modNode = await CurriculumModule.create({
    title: "Node.js Fundamentals",
    description: "Server-side JavaScript and event loop architecture",
    category: "BACKEND",
    difficulty: "BEGINNER",
    estimatedDuration: 12,
    prerequisites: [modJS._id],
    skills: [
      { name: "JavaScript", level: "BEGINNER" },
      { name: "Node.js", level: "BEGINNER" },
    ],
    learningObjectives: ["Write server scripts", "Use core Node modules"],
    order: 2,
    isActive: true,
  });

  const modExpress = await CurriculumModule.create({
    title: "Express.js & REST APIs",
    description: "Building robust HTTP APIs and middleware with Express",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 14,
    prerequisites: [modNode._id],
    skills: [
      { name: "Node.js", level: "INTERMEDIATE" },
      { name: "REST APIs", level: "INTERMEDIATE" },
    ],
    learningObjectives: ["Design RESTful routes", "Implement middleware"],
    order: 3,
    isActive: true,
  });

  const modPython = await CurriculumModule.create({
    title: "Python for Data Science",
    description:
      "Python fundamentals, data structures, and scientific libraries",
    category: "AI_DATA_SCIENCE",
    difficulty: "BEGINNER",
    estimatedDuration: 15,
    skills: [{ name: "Python", level: "BEGINNER" }],
    learningObjectives: ["Learn Python syntax", "Process data collections"],
    order: 4,
    isActive: true,
  });

  const modML = await CurriculumModule.create({
    title: "Machine Learning Fundamentals",
    description: "Supervised and unsupervised learning with scikit-learn",
    category: "AI_DATA_SCIENCE",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 20,
    prerequisites: [modPython._id],
    skills: [
      { name: "Python", level: "INTERMEDIATE" },
      { name: "Machine Learning", level: "INTERMEDIATE" },
    ],
    learningObjectives: ["Train classifiers", "Evaluate regression metrics"],
    order: 5,
    isActive: true,
  });

  // Inactive module (must never be recommended)
  const modInactive = await CurriculumModule.create({
    title: "Draft Deprecated Module",
    description: "Archived module",
    category: "BACKEND",
    difficulty: "ADVANCED",
    estimatedDuration: 10,
    isActive: false,
  });

  // -------------------------------------------------------------
  // SUITE 1: Authentication & Profile Readiness
  // -------------------------------------------------------------
  console.log("\n--- 1. Authentication & Profile Readiness ---");

  await test("Unauthenticated recommendation access is rejected (401 AUTH_REQUIRED)", async () => {
    const res = await fetch(`${serverBaseUrl}/recommendations`);
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "AUTH_REQUIRED")
      throw new Error(`Expected AUTH_REQUIRED, got ${data.errorCode}`);
  });

  await test("Request without learner profile returns 404 PROFILE_NOT_FOUND", async () => {
    const res = await fetch(`${serverBaseUrl}/recommendations`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    if (data.errorCode !== "PROFILE_NOT_FOUND")
      throw new Error(`Expected PROFILE_NOT_FOUND, got ${data.errorCode}`);
  });

  await test("Incomplete profile (missing goals/skills/assessment) returns 400 PROFILE_NOT_READY", async () => {
    // Create bare profile with no goals, no skills, no assessment
    await LearnerProfile.create({
      user: studentAlex._id,
      educationLevel: "UNDERGRADUATE",
      experienceLevel: "BEGINNER",
      currentSkills: [],
      learningGoals: [],
      assessmentDimensions: {},
    });

    const res = await fetch(`${serverBaseUrl}/recommendations`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "PROFILE_NOT_READY")
      throw new Error(`Expected PROFILE_NOT_READY, got ${data.errorCode}`);
    if (!data.data || !Array.isArray(data.data.missingFields))
      throw new Error(
        "Expected missingFields array in readiness error payload",
      );
  });

  // -------------------------------------------------------------
  // SUITE 2: Core Deterministic Recommendation Generation
  // -------------------------------------------------------------
  console.log("\n--- 2. Core Deterministic Recommendation Generation ---");

  await test("Update Alex profile with valid goals, skills, and assessment dimensions", async () => {
    await LearnerProfile.findOneAndUpdate(
      { user: studentAlex._id },
      {
        $set: {
          learningGoals: [
            { name: "Become a Backend Developer", priority: 3 },
            { name: "Master REST APIs and Node.js", priority: 2 },
          ],
          currentSkills: [{ name: "JavaScript", level: "BEGINNER" }],
          preferredDifficulty: "BEGINNER",
          experienceLevel: "BEGINNER",
          assessmentDimensions: {
            analyticalThinking: 85,
            creativity: 65,
          },
          strengths: ["Analytical problem solving"],
          improvementAreas: ["Asynchronous architecture"],
          interests: ["Web Development", "Backend Systems"],
          profileVersion: 1,
        },
      },
    );
  });

  let recResult1;

  await test("Generate recommendations successfully (200)", async () => {
    const res = await fetch(`${serverBaseUrl}/recommendations`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    if (res.status !== 200)
      throw new Error(`Expected 200, got ${res.status}: ${data.message}`);
    if (
      !data.success ||
      !data.data ||
      !Array.isArray(data.data.recommendations)
    )
      throw new Error("Expected data.recommendations array");

    recResult1 = data.data;
    if (recResult1.recommendations.length === 0)
      throw new Error("Expected at least 1 actionable recommendation");
  });

  await test("Recommendations contain ONLY existing CurriculumModule documents", async () => {
    const validIds = new Set([
      modJS._id.toString(),
      modNode._id.toString(),
      modExpress._id.toString(),
      modPython._id.toString(),
      modML._id.toString(),
    ]);

    for (const rec of recResult1.recommendations) {
      if (!validIds.has(rec.module.id)) {
        throw new Error(
          `Recommended module ${rec.module.id} does not exist in DB!`,
        );
      }
    }
  });

  await test("Inactive modules are strictly excluded from recommendations", async () => {
    const hasInactive = recResult1.recommendations.some(
      (r) => r.module.id === modInactive._id.toString(),
    );
    if (hasInactive)
      throw new Error("Inactive module was erroneously recommended");
  });

  await test("Candidate with satisfied prerequisites (Node.js) is actionable", async () => {
    // Alex has JavaScript — BEGINNER, satisfying Node.js prerequisite
    const nodeRec = recResult1.recommendations.find(
      (r) => r.module.title === "Node.js Fundamentals",
    );
    if (!nodeRec) throw new Error("Node.js Fundamentals should be recommended");
    if (!nodeRec.prerequisitesSatisfied)
      throw new Error(
        "Node.js prerequisites should be marked satisfied for Alex",
      );
    if (nodeRec.missingPrerequisites.length > 0)
      throw new Error("Node.js should have no missing prerequisites");
  });

  await test("Candidate with unmet prerequisites (Express.js) is placed in blockedModules", async () => {
    // Alex has JS but does NOT have Node.js — INTERMEDIATE yet!
    // Express requires Node.js, so Express must be in blockedModules
    const expressBlocked = recResult1.blockedModules.find(
      (b) => b.module.title === "Express.js & REST APIs",
    );
    if (!expressBlocked)
      throw new Error(
        "Express.js should be in blockedModules because Node.js is missing",
      );
    if (expressBlocked.prerequisitesSatisfied)
      throw new Error("Express.js prerequisites should be false");
    if (expressBlocked.missingPrerequisites.length === 0)
      throw new Error("Express.js should identify missing prerequisite");
  });

  await test("Scoring transparency: Weighted sum equals final score", async () => {
    const rec = recResult1.recommendations[0];
    const b = rec.scoreBreakdown;

    const weights = {
      goalMatch: 0.25,
      skillMatch: 0.25,
      prerequisiteReadiness: 0.15,
      assessmentAlignment: 0.15,
      difficultyAlignment: 0.1,
      interestMatch: 0.05,
      preferenceMatch: 0.05,
    };

    const expectedScore = Math.round(
      b.goalMatch * weights.goalMatch +
        b.skillMatch * weights.skillMatch +
        b.prerequisiteReadiness * weights.prerequisiteReadiness +
        b.assessmentAlignment * weights.assessmentAlignment +
        b.difficultyAlignment * weights.difficultyAlignment +
        b.interestMatch * weights.interestMatch +
        b.preferenceMatch * weights.preferenceMatch,
    );

    if (rec.score !== expectedScore) {
      throw new Error(
        `Score mismatch: expected ${expectedScore}, got ${rec.score}`,
      );
    }
  });

  // -------------------------------------------------------------
  // SUITE 3: Determinism & Idempotency
  // -------------------------------------------------------------
  console.log("\n--- 3. Determinism Verification ---");

  await test("Identical profile and curriculum state generates identical recommendations & order", async () => {
    const res = await fetch(`${serverBaseUrl}/recommendations`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    const recResult2 = data.data;

    if (
      recResult1.recommendations.length !== recResult2.recommendations.length
    ) {
      throw new Error("Recommendation count differs between identical runs");
    }

    for (let i = 0; i < recResult1.recommendations.length; i++) {
      const r1 = recResult1.recommendations[i];
      const r2 = recResult2.recommendations[i];

      if (r1.module.id !== r2.module.id) {
        throw new Error(
          `Order mismatch at index ${i}: ${r1.module.title} vs ${r2.module.title}`,
        );
      }
      if (r1.score !== r2.score) {
        throw new Error(
          `Score mismatch at index ${i}: ${r1.score} vs ${r2.score}`,
        );
      }
      if (r1.reason !== r2.reason) {
        throw new Error(`Reason mismatch at index ${i}`);
      }
    }
  });

  // -------------------------------------------------------------
  // SUITE 4: Dynamic Adaptation on Profile Changes
  // -------------------------------------------------------------
  console.log("\n--- 4. Dynamic Adaptation on Profile Changes ---");

  await test("Changing goal to Data Science shifts top recommendation to Python", async () => {
    // Switch Alex's goal to Data Science and Python
    await LearnerProfile.findOneAndUpdate(
      { user: studentAlex._id },
      {
        $set: {
          learningGoals: [
            { name: "Master Machine Learning and Data Science", priority: 3 },
          ],
          currentSkills: [{ name: "Python", level: "BEGINNER" }],
          interests: ["Artificial Intelligence", "Data Science"],
        },
      },
    );

    const res = await fetch(`${serverBaseUrl}/recommendations`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    const recs = data.data.recommendations;

    if (recs.length === 0)
      throw new Error("Expected recommendations after goal change");
    const topRec = recs[0];
    if (topRec.module.category !== "AI_DATA_SCIENCE") {
      throw new Error(
        `Expected top recommendation in AI_DATA_SCIENCE, got category ${topRec.module.category} (${topRec.module.title})`,
      );
    }
  });

  // -------------------------------------------------------------
  // SUITE 5: Query Parameter Filtering & Validation
  // -------------------------------------------------------------
  console.log("\n--- 5. Query Parameter Filtering & Validation ---");

  await test("Query limit parameter is respected (?limit=2)", async () => {
    const res = await fetch(`${serverBaseUrl}/recommendations?limit=2`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.recommendations.length > 2) {
      throw new Error(
        `Expected at most 2 recommendations, got ${data.data.recommendations.length}`,
      );
    }
  });

  await test("Query category filter is respected (?category=AI_DATA_SCIENCE)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/recommendations?category=AI_DATA_SCIENCE`,
      {
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    for (const r of data.data.recommendations) {
      if (r.module.category !== "AI_DATA_SCIENCE") {
        throw new Error(
          `Expected category AI_DATA_SCIENCE, got ${r.module.category}`,
        );
      }
    }
  });

  await test("Invalid limit rejected with 400 INVALID_RECOMMENDATION_QUERY", async () => {
    const res = await fetch(`${serverBaseUrl}/recommendations?limit=999`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "INVALID_RECOMMENDATION_QUERY")
      throw new Error(
        `Expected INVALID_RECOMMENDATION_QUERY, got ${data.errorCode}`,
      );
  });

  await test("Invalid difficulty rejected with 400 INVALID_RECOMMENDATION_QUERY", async () => {
    const res = await fetch(
      `${serverBaseUrl}/recommendations?difficulty=SUPER_HARD`,
      {
        headers: { Authorization: `Bearer ${alexToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "INVALID_RECOMMENDATION_QUERY")
      throw new Error(
        `Expected INVALID_RECOMMENDATION_QUERY, got ${data.errorCode}`,
      );
  });

  // -------------------------------------------------------------
  // SUITE 6: IDOR Protection & User Isolation
  // -------------------------------------------------------------
  console.log("\n--- 6. IDOR Protection & Security ---");

  await test("Student Sarah cannot access Alex recommendations or pass fake user IDs", async () => {
    // Sarah has no profile yet -> must return 404, not Alex's profile!
    const res = await fetch(`${serverBaseUrl}/recommendations`, {
      headers: { Authorization: `Bearer ${sarahToken}` },
    });
    const data = await res.json();
    if (res.status !== 404)
      throw new Error(`Expected 404 for Sarah, got ${res.status}`);
    if (data.errorCode !== "PROFILE_NOT_FOUND")
      throw new Error(`Expected PROFILE_NOT_FOUND, got ${data.errorCode}`);
  });

  console.log("\n======================================================");
  console.log(
    `📊 Recommendation Engine Results: ${passed} Passed, ${failed} Failed`,
  );
  console.log("======================================================\n");

  await teardown();

  if (failed > 0) {
    process.exit(1);
  }
};

runRecommendationTests().catch(async (err) => {
  console.error("Fatal test runner error:", err);
  await teardown();
  process.exit(1);
});
