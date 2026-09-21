const request = require("supertest");
const app = require("../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  createTestUser,
  createAdminUser,
  createTestAssessment,
  createTestCurriculum,
} = require("../helpers/testDb");
const {
  CurriculumModule,
  LearnerProfile,
  AssessmentAttempt,
} = require("../../models");
const config = require("../../config");

describe("Deterministic Recommendations Engine Tests", () => {
  let originalApiKey;

  beforeAll(async () => {
    await connect();
    // Ensure deterministic rule-engine fallback in these tests
    originalApiKey = config.geminiApiKey;
    config.geminiApiKey = null;
  });

  afterAll(async () => {
    config.geminiApiKey = originalApiKey;
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("1. Profile Readiness Enforcement", () => {
    it("returns 400 PROFILE_NOT_READY if student profile lacks assessment dimensions", async () => {
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      // Profile has goals and skills but empty assessmentDimensions
      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        {
          $set: {
            learningGoals: [{ name: "Learn Web Dev" }],
            currentSkills: [{ name: "HTML", level: "BEGINNER" }],
            assessmentDimensions: {},
          },
        },
      );

      const res = await request(app)
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("PROFILE_NOT_READY");
      expect(res.body.data.missingFields).toContain("assessmentDimensions");
    });

    it("returns 400 PROFILE_NOT_READY if student profile lacks learning goals", async () => {
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        {
          $set: {
            learningGoals: [],
            currentSkills: [{ name: "HTML", level: "BEGINNER" }],
            assessmentDimensions: { analytical: 80 },
          },
        },
      );

      const res = await request(app)
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe("PROFILE_NOT_READY");
      expect(res.body.data.missingFields).toContain("learningGoals");
    });
  });

  describe("2. Deterministic Filtering, Prerequisite Enforcement & Scoring", () => {
    it("recommends actionable modules and places unsatisfied prerequisites in blockedModules", async () => {
      const { user: admin } = await createAdminUser();
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      // Seed curriculum: Mod1 (no prereq), Mod2 (prereq: Mod1), Mod3 (prereq: Mod1)
      const [mod1, mod2, mod3] = await createTestCurriculum(admin._id);

      // Setup learner profile with basic skills (does NOT have Mod1 skill yet)
      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        {
          $set: {
            educationLevel: "UNDERGRADUATE",
            experienceLevel: "BEGINNER",
            preferredDifficulty: "BEGINNER",
            currentSkills: [{ name: "CSS", level: "BEGINNER" }],
            learningGoals: [
              { name: "React Component Architecture" },
              { name: "JavaScript Fundamentals" },
            ],
            assessmentDimensions: { analytical: 80, intuitive: 60 },
          },
        },
      );

      const res = await request(app)
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe("RULE_ENGINE");

      const recs = res.body.data.recommendations;
      const blocked = res.body.data.blockedModules;

      // Mod1 has no prerequisites, so it must be in recommendations
      const recIds = recs.map((r) => r.module.id);
      expect(recIds).toContain(mod1._id.toString());

      // Mod2 and Mod3 require Mod1 which student hasn't satisfied yet, so they should be blocked
      const blockedIds = blocked.map((b) => b.module.id);
      expect(blockedIds).toContain(mod2._id.toString());
      expect(blockedIds).toContain(mod3._id.toString());
    });

    it("unlocks prerequisite modules once student possesses required prerequisite skills", async () => {
      const { user: admin } = await createAdminUser();
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      const [mod1, mod2] = await createTestCurriculum(admin._id);

      // Student possesses JavaScript skill at INTERMEDIATE level (satisfies Mod1 prereq for Mod2)
      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        {
          $set: {
            currentSkills: [{ name: "JavaScript", level: "INTERMEDIATE" }],
            learningGoals: [{ name: "React Component Architecture" }],
            assessmentDimensions: { analytical: 85 },
          },
        },
      );

      const res = await request(app)
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const recIds = res.body.data.recommendations.map((r) => r.module.id);

      // Mod2 is now unlocked and in recommendations
      expect(recIds).toContain(mod2._id.toString());
    });

    it("strictly NEVER includes inactive curriculum modules in recommendations or blocked lists", async () => {
      const { user: admin } = await createAdminUser();
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      // Create an inactive module
      const inactiveMod = await CurriculumModule.create({
        title: "Deprecated Angular 1.0 Legacy",
        slug: "deprecated-angular-legacy",
        description: "Old technology module",
        category: "FRONTEND",
        difficulty: "BEGINNER",
        estimatedDuration: 10,
        skills: [{ name: "AngularJS", level: "BEGINNER" }],
        isActive: false,
        createdBy: admin._id,
      });

      // Active module
      const activeMod = await CurriculumModule.create({
        title: "Modern TypeScript Essentials",
        slug: "modern-typescript-essentials",
        description: "Type safety for modern apps",
        category: "FULLSTACK",
        difficulty: "BEGINNER",
        estimatedDuration: 8,
        skills: [{ name: "TypeScript", level: "BEGINNER" }],
        isActive: true,
        createdBy: admin._id,
      });

      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        {
          $set: {
            currentSkills: [{ name: "JavaScript", level: "BEGINNER" }],
            learningGoals: [
              { name: "Modern TypeScript Essentials" },
              { name: "Deprecated Angular 1.0 Legacy" },
            ],
            assessmentDimensions: { analytical: 75 },
          },
        },
      );

      const res = await request(app)
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const allReturnedIds = [
        ...res.body.data.recommendations.map((r) => r.module.id),
        ...res.body.data.blockedModules.map((b) => b.module.id),
      ];

      expect(allReturnedIds).not.toContain(inactiveMod._id.toString());
      expect(allReturnedIds).toContain(activeMod._id.toString());
    });
  });

  describe("3. Edge Cases & Schema Contract", () => {
    it("handles empty curriculum database gracefully without crashing", async () => {
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        {
          $set: {
            currentSkills: [{ name: "JavaScript", level: "BEGINNER" }],
            learningGoals: [{ name: "Learn Web Dev" }],
            assessmentDimensions: { analytical: 80 },
          },
        },
      );

      // No curriculum modules exist in DB
      const res = await request(app)
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toEqual([]);
      expect(res.body.data.blockedModules).toEqual([]);
      expect(res.body.data.candidateCount).toBe(0);
    });

    it("verifies recommendation item structure adheres to contract schema", async () => {
      const { user: admin } = await createAdminUser();
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      const [mod1] = await createTestCurriculum(admin._id);

      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        {
          $set: {
            currentSkills: [{ name: "HTML", level: "BEGINNER" }],
            learningGoals: [{ name: "JavaScript Fundamentals" }],
            assessmentDimensions: { analytical: 90 },
          },
        },
      );

      const res = await request(app)
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);

      const rec = res.body.data.recommendations[0];
      expect(rec).toHaveProperty("module");
      expect(rec.module).toHaveProperty("id");
      expect(rec.module).toHaveProperty("title");
      expect(rec.module).toHaveProperty("category");
      expect(rec.module).toHaveProperty("difficulty");
      expect(rec).toHaveProperty("score");
      expect(rec).toHaveProperty("reason");
      expect(rec).toHaveProperty("matchedSkills");
      expect(rec).toHaveProperty("prerequisitesSatisfied");
      expect(rec).toHaveProperty("scoreBreakdown");
    });
  });
});
