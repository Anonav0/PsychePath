const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const {
  User,
  LearnerProfile,
  Assessment,
  Question,
  AssessmentAttempt,
  CurriculumModule,
  LearningPath,
  ProgressRecord,
} = require("../../models");

let mongod = null;

// Ensure consistent JWT secret for all tests
config.jwtSecret =
  process.env.JWT_SECRET || "test_secret_for_jest_suite_minimum_32_chars_12345";

/**
 * Connect to in-memory MongoDB
 */
const connect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
  }
  const uri = mongod.getUri();
  config.mongoUri = uri;
  await mongoose.connect(uri);
};

/**
 * Clear all collections between test cases
 */
const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Close MongoDB connection and stop server
 */
const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
};

/**
 * Generate a JWT token for a user
 */
const generateToken = (user, expiresIn = "24h") => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn },
  );
};

/**
 * Helper to seed a test student
 */
const createTestUser = async (role = "STUDENT", overrides = {}) => {
  const email =
    overrides.email ||
    `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`;
  const rawPassword = overrides.password || "Password123!";

  const user = new User({
    firstName: overrides.firstName || "Alex",
    lastName: overrides.lastName || "Student",
    email,
    password: rawPassword,
    role,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    ...overrides,
  });
  await user.save();

  // Create default learner profile
  const profile = new LearnerProfile({
    user: user._id,
    educationLevel: "UNDERGRADUATE",
    experienceLevel: "BEGINNER",
    weeklyLearningHours: 10,
    currentSkills: [
      { name: "JavaScript", level: "BEGINNER" },
      { name: "HTML", level: "INTERMEDIATE" },
    ],
    learningGoals: [
      { name: "Full Stack Mastery", targetLevel: "INTERMEDIATE" },
    ],
    learningPreferences: {
      preferredFormat: "MIXED",
      preferredDifficulty: "BEGINNER",
    },
  });
  await profile.save();

  const token = generateToken(user);
  return { user, rawPassword, token, profile };
};

/**
 * Helper to seed a test administrator
 */
const createAdminUser = async (overrides = {}) => {
  return createTestUser("ADMIN", {
    firstName: "Admin",
    lastName: "Supervisor",
    ...overrides,
  });
};

/**
 * Helper to seed a test assessment with questions
 */
const createTestAssessment = async (adminId, overrides = {}) => {
  const assessment = new Assessment({
    title: overrides.title || "Diagnostic Cognitive Evaluation",
    description:
      "Evaluates visual, auditory, and kinesthetic learning signals.",
    type: overrides.type || "LEARNING_STYLE",
    instructions: "Answer each prompt honestly.",
    estimatedDuration: 15,
    dimensions: [
      {
        key: "analytical",
        name: "Analytical Thinking",
        description: "Problem solving",
      },
      {
        key: "intuitive",
        name: "Intuitive Synthesis",
        description: "Big picture",
      },
      {
        key: "collaborative",
        name: "Collaborative Learning",
        description: "Teamwork",
      },
    ],
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    createdBy: adminId,
  });
  await assessment.save();

  const questions = [];
  const dims = ["analytical", "intuitive", "collaborative"];
  for (let i = 1; i <= 3; i++) {
    const q = new Question({
      assessment: assessment._id,
      questionText: `Sample question ${i} testing ${dims[i - 1]}?`,
      questionType: "LIKERT_SCALE",
      dimension: dims[i - 1],
      order: i,
      options: [
        { label: "Strongly Disagree", value: "1", score: 20 },
        { label: "Disagree", value: "2", score: 40 },
        { label: "Neutral", value: "3", score: 60 },
        { label: "Agree", value: "4", score: 80 },
        { label: "Strongly Agree", value: "5", score: 100 },
      ],
      createdBy: adminId,
    });
    await q.save();
    questions.push(q);
  }

  return { assessment, questions };
};

/**
 * Helper to seed sample curriculum modules
 */
const createTestCurriculum = async (adminId) => {
  const mod1 = await CurriculumModule.create({
    title: "JavaScript Fundamentals",
    slug: "javascript-fundamentals",
    description: "Core JS syntax, execution context, and primitives",
    category: "FRONTEND",
    difficulty: "BEGINNER",
    estimatedDuration: 10,
    skills: [{ name: "JavaScript", level: "BEGINNER" }],
    learningObjectives: ["Master variables and closures"],
    prerequisites: [],
    isActive: true,
    createdBy: adminId,
  });

  const mod2 = await CurriculumModule.create({
    title: "React Component Architecture",
    slug: "react-component-architecture",
    description: "Component composition, state hooks, and side effects",
    category: "FRONTEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 15,
    skills: [{ name: "React", level: "INTERMEDIATE" }],
    learningObjectives: ["Build modular UI components"],
    prerequisites: [mod1._id],
    isActive: true,
    createdBy: adminId,
  });

  const mod3 = await CurriculumModule.create({
    title: "Node.js REST Services",
    slug: "nodejs-rest-services",
    description: "Express routing, middleware, and request validation",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 12,
    skills: [{ name: "Node.js", level: "INTERMEDIATE" }],
    learningObjectives: ["Architect clean REST endpoints"],
    prerequisites: [mod1._id],
    isActive: true,
    createdBy: adminId,
  });

  return [mod1, mod2, mod3];
};

module.exports = {
  connect,
  clearDatabase,
  closeDatabase,
  generateToken,
  createTestUser,
  createAdminUser,
  createTestAssessment,
  createTestCurriculum,
};
