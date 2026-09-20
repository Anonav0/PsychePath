const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
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
const seedDatabase = require("./seed");
const config = require("../config");

let mongod = null;

const setupDatabase = async () => {
  try {
    console.log(`[Verify] Trying direct connection to ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log("[Verify] Connected to local MongoDB instance.");
  } catch (err) {
    console.log(
      "[Verify] Local MongoDB not running. Initializing isolated MongoMemoryServer...",
    );
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    config.mongoUri = uri; // Redirect for seeder
    await mongoose.connect(uri);
    console.log(`[Verify] Connected to MongoMemoryServer at ${uri}`);
  }
};

const teardownDatabase = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

const runTests = async () => {
  console.log("\n========================================");
  console.log("🧪 PsychePath Phase 2 Model Verification");
  console.log("========================================\n");

  await setupDatabase();

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

  // ----------------------------------------------------
  // 1. Model Loading
  // ----------------------------------------------------
  console.log("--- 1. Testing Model Registration ---");
  await test("All 8 models are loaded in Mongoose", async () => {
    const modelNames = [
      "User",
      "Assessment",
      "Question",
      "AssessmentAttempt",
      "LearnerProfile",
      "CurriculumModule",
      "LearningPath",
      "Progress",
    ];
    modelNames.forEach((name) => {
      if (!mongoose.model(name))
        throw new Error(`Model ${name} is not registered`);
    });
  });

  // ----------------------------------------------------
  // 2. Schema Validations & Constraints
  // ----------------------------------------------------
  console.log("\n--- 2. Testing Schema Validations & Constraints ---");

  await test("User rejects invalid role", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "valid@example.com",
      password: "password123",
      role: "INVALID_ROLE",
    });
    let errorCaught = false;
    try {
      await user.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error("Expected validation error for invalid role");
  });

  await test("User rejects malformed email address", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "not-an-email",
      password: "password123",
    });
    let errorCaught = false;
    try {
      await user.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error("Expected validation error for malformed email");
  });

  await test("User requires password of minimum 8 characters", async () => {
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com",
      password: "short",
    });
    let errorCaught = false;
    try {
      await user.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error("Expected validation error for short password");
  });

  await test("User enforces unique email index", async () => {
    await User.create({
      firstName: "Unique",
      lastName: "User1",
      email: "duplicate@test.com",
      password: "password123",
    });

    let duplicateError = false;
    try {
      await User.create({
        firstName: "Unique",
        lastName: "User2",
        email: "duplicate@test.com",
        password: "password123",
      });
    } catch (err) {
      if (err.code === 11000) duplicateError = true;
    }
    if (!duplicateError)
      throw new Error(
        "Expected duplicate key error (code 11000) for duplicate email",
      );
  });

  await test("Question requires at least 2 options", async () => {
    const question = new Question({
      assessment: new mongoose.Types.ObjectId(),
      questionText: "Is this valid?",
      dimension: "analyticalthinking",
      order: 1,
      options: [{ label: "Only One", value: "one", score: 1 }],
    });
    let errorCaught = false;
    try {
      await question.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error("Expected validation error when question options < 2");
  });

  await test("CurriculumModule rejects invalid difficulty", async () => {
    const mod = new CurriculumModule({
      title: "Module Title",
      description: "Desc",
      category: "Backend",
      difficulty: "SUPER_HARD",
      estimatedDuration: 10,
    });
    let errorCaught = false;
    try {
      await mod.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error(
        "Expected validation error for invalid module difficulty",
      );
  });

  await test("Progress rejects negative percentage (< 0)", async () => {
    const prog = new Progress({
      user: new mongoose.Types.ObjectId(),
      learningPath: new mongoose.Types.ObjectId(),
      module: new mongoose.Types.ObjectId(),
      percentage: -10,
    });
    let errorCaught = false;
    try {
      await prog.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error("Expected validation error for negative percentage");
  });

  await test("Progress rejects percentage greater than 100 (> 100)", async () => {
    const prog = new Progress({
      user: new mongoose.Types.ObjectId(),
      learningPath: new mongoose.Types.ObjectId(),
      module: new mongoose.Types.ObjectId(),
      percentage: 105,
    });
    let errorCaught = false;
    try {
      await prog.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error("Expected validation error for percentage > 100");
  });

  await test("LearnerProfile rejects invalid weeklyLearningHours (> 168)", async () => {
    const profile = new LearnerProfile({
      user: new mongoose.Types.ObjectId(),
      weeklyLearningHours: 200,
    });
    let errorCaught = false;
    try {
      await profile.validate();
    } catch (err) {
      errorCaught = true;
    }
    if (!errorCaught)
      throw new Error(
        "Expected validation error for weekly learning hours > 168",
      );
  });

  // ----------------------------------------------------
  // 3. Database Seeding & Relationships
  // ----------------------------------------------------
  console.log("\n--- 3. Testing Development Seeding & Relationships ---");

  await test("Development seed script runs and populates collections", async () => {
    await seedDatabase();

    const [
      userCount,
      assessmentCount,
      questionCount,
      moduleCount,
      profileCount,
      pathCount,
      progressCount,
    ] = await Promise.all([
      User.countDocuments(),
      Assessment.countDocuments(),
      Question.countDocuments(),
      CurriculumModule.countDocuments(),
      LearnerProfile.countDocuments(),
      LearningPath.countDocuments(),
      Progress.countDocuments(),
    ]);

    if (userCount !== 3)
      throw new Error(`Expected 3 users, found ${userCount}`);
    if (assessmentCount !== 1)
      throw new Error(`Expected 1 assessment, found ${assessmentCount}`);
    if (questionCount !== 12)
      throw new Error(`Expected 12 questions, found ${questionCount}`);
    if (moduleCount < 10)
      throw new Error(`Expected at least 10 modules, found ${moduleCount}`);
    if (profileCount !== 2)
      throw new Error(`Expected 2 learner profiles, found ${profileCount}`);
    if (pathCount !== 1)
      throw new Error(`Expected 1 learning path, found ${pathCount}`);
    if (progressCount !== 2)
      throw new Error(`Expected 2 progress records, found ${progressCount}`);
  });

  await test("Relationship Population: User ↔ LearnerProfile", async () => {
    const profile = await LearnerProfile.findOne().populate("user");
    if (!profile || !profile.user || !profile.user.email) {
      throw new Error("Failed to populate user from LearnerProfile");
    }
  });

  await test("Relationship Population: Question ↔ Assessment", async () => {
    const question = await Question.findOne().populate("assessment");
    if (!question || !question.assessment || !question.assessment.title) {
      throw new Error("Failed to populate assessment from Question");
    }
  });

  await test("Relationship Population: LearningPath ↔ CurriculumModule & Prerequisites", async () => {
    const path = await LearningPath.findOne().populate({
      path: "modules.module",
      populate: { path: "prerequisites" },
    });
    if (!path || path.modules.length === 0 || !path.modules[0].module.title) {
      throw new Error("Failed to populate modules in LearningPath");
    }
  });

  await test("User model toJSON safely hides password", async () => {
    const user = await User.findOne({ email: "admin@psychepath.io" }).select(
      "+password",
    );
    const jsonOutput = user.toJSON();
    if (jsonOutput.password) {
      throw new Error(
        "Security flaw: Password is exposed in User toJSON output",
      );
    }
  });

  console.log("\n========================================");
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log("========================================\n");

  await teardownDatabase();

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error("[Verify Fatal Error]", err);
  process.exit(1);
});
