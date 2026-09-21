const request = require("supertest");
const app = require("../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  createTestUser,
  createAdminUser,
  createTestCurriculum,
} = require("../helpers/testDb");
const {
  LearningPath,
  LearnerProfile,
  Progress,
  ProgressHistory,
} = require("../../models");
const config = require("../../config");

describe("Learning Path & Monotonic Progress Tracking Tests", () => {
  let originalApiKey;

  beforeAll(async () => {
    await connect();
    originalApiKey = config.geminiApiKey;
    config.geminiApiKey = null; // Enforce deterministic RULE_ENGINE path generation
  });

  afterAll(async () => {
    config.geminiApiKey = originalApiKey;
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  const setupLearnerWithCurriculum = async () => {
    const { user: admin } = await createAdminUser();
    const { user: student, token: studentToken } =
      await createTestUser("STUDENT");
    const [mod1, mod2, mod3] = await createTestCurriculum(admin._id);

    // Seed student profile with prerequisite skills
    await LearnerProfile.findOneAndUpdate(
      { user: student._id },
      {
        $set: {
          currentSkills: [{ name: "JavaScript", level: "INTERMEDIATE" }],
          learningGoals: [
            { name: "JavaScript Fundamentals" },
            { name: "React Component Architecture" },
            { name: "Node.js REST Services" },
          ],
          assessmentDimensions: { analytical: 85, intuitive: 75 },
        },
      },
    );

    return { admin, student, studentToken, modules: [mod1, mod2, mod3] };
  };

  describe("1. Learning Path Generation, Versioning & Archiving", () => {
    it("generates an initial active learning path (v1)", async () => {
      const { student, studentToken } = await setupLearnerWithCurriculum();

      const res = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.status).toBe("ACTIVE");
      expect(res.body.data.modules.length).toBeGreaterThan(0);

      // Verify DB persistence
      const savedPath = await LearningPath.findOne({
        user: student._id,
        status: "ACTIVE",
      });
      expect(savedPath).toBeDefined();
      expect(savedPath.version).toBe(1);
    });

    it("regenerating a learning path archives v1 and creates v2 monotonically", async () => {
      const { student, studentToken } = await setupLearnerWithCurriculum();

      // Path 1
      const gen1 = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});
      expect(gen1.body.data.version).toBe(1);
      const path1Id = gen1.body.data.id;

      // Path 2 (Regeneration)
      const gen2 = await request(app)
        .post("/api/learning-paths/regenerate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(gen2.status).toBe(200);
      expect(gen2.body.data.version).toBe(2);
      expect(gen2.body.data.status).toBe("ACTIVE");
      const path2Id = gen2.body.data.id;

      // Verify v1 is now ARCHIVED in DB
      const oldPath = await LearningPath.findById(path1Id);
      expect(oldPath.status).toBe("ARCHIVED");

      // Verify v2 is the only ACTIVE path in DB
      const activePaths = await LearningPath.find({
        user: student._id,
        status: "ACTIVE",
      });
      expect(activePaths.length).toBe(1);
      expect(activePaths[0]._id.toString()).toBe(path2Id);

      // Verify history endpoint retrieves both versions
      const historyRes = await request(app)
        .get("/api/learning-paths/history")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.length).toBe(2);
    });

    it("strictly forbids progress mutations on an archived learning path version", async () => {
      const { studentToken } = await setupLearnerWithCurriculum();

      // Generate v1 then v2 so v1 gets ARCHIVED
      const gen1 = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});
      const path1Id = gen1.body.data.id;
      const firstModuleId = gen1.body.data.modules[0].module.id;

      await request(app)
        .post("/api/learning-paths/regenerate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      // Attempt to modify progress on archived v1
      const res = await request(app)
        .post("/api/progress/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          learningPathId: path1Id,
          moduleId: firstModuleId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("PATH_ARCHIVED");
    });
  });

  describe("2. Module Lifecycle Transitions & Monotonic Progress Protection", () => {
    it("transitions module from NOT_STARTED to IN_PROGRESS and saves progress updates", async () => {
      const { studentToken } = await setupLearnerWithCurriculum();

      const genRes = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const pathId = genRes.body.data.id;
      const targetModuleId = genRes.body.data.modules[0].module.id;

      // 1. Start Module
      const startRes = await request(app)
        .post("/api/progress/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          learningPathId: pathId,
          moduleId: targetModuleId,
        });

      expect(startRes.status).toBe(200);
      expect(startRes.body.success).toBe(true);
      expect(startRes.body.data.progress.status).toBe("IN_PROGRESS");
      expect(startRes.body.data.progress.percentage).toBe(0);

      // 2. Update progress percentage to 45%
      const updateRes = await request(app)
        .patch("/api/progress")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          learningPathId: pathId,
          moduleId: targetModuleId,
          percentage: 45,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.progress.percentage).toBe(45);
      expect(updateRes.body.data.progress.status).toBe("IN_PROGRESS");
    });

    it("enforces monotonic policy: strictly rejects backwards progress regression", async () => {
      const { studentToken } = await setupLearnerWithCurriculum();

      const genRes = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const pathId = genRes.body.data.id;
      const targetModuleId = genRes.body.data.modules[0].module.id;

      // Set to 60%
      await request(app)
        .patch("/api/progress")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          learningPathId: pathId,
          moduleId: targetModuleId,
          percentage: 60,
        });

      // Attempt regression to 30%
      const regressRes = await request(app)
        .patch("/api/progress")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          learningPathId: pathId,
          moduleId: targetModuleId,
          percentage: 30,
        });

      expect(regressRes.status).toBe(400);
      expect(regressRes.body.success).toBe(false);
      expect(regressRes.body.errorCode).toBe("PROGRESS_REGRESSION");
    });

    it("completes module, updates overall path completion percentage, and marks path complete when all modules finish", async () => {
      const { studentToken } = await setupLearnerWithCurriculum();

      const genRes = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const pathId = genRes.body.data.id;
      const modules = genRes.body.data.modules;

      let previousOverallPercentage = 0;

      // Complete modules one by one and verify monotonic increase of path summary
      for (const item of modules) {
        const modId = item.module.id;

        const completeRes = await request(app)
          .post("/api/progress/complete")
          .set("Authorization", `Bearer ${studentToken}`)
          .send({
            learningPathId: pathId,
            moduleId: modId,
          });

        expect(completeRes.status).toBe(200);
        expect(completeRes.body.data.progress.status).toBe("COMPLETED");
        expect(completeRes.body.data.progress.percentage).toBe(100);

        const currentOverall = completeRes.body.data.summary.overallProgress;
        expect(currentOverall).toBeGreaterThanOrEqual(
          previousOverallPercentage,
        );
        previousOverallPercentage = currentOverall;
      }

      // After completing all modules, overall percentage must be 100%
      expect(previousOverallPercentage).toBe(100);

      // Verify LearningPath document status updated to COMPLETED
      const finalPath = await LearningPath.findById(pathId);
      expect(finalPath.status).toBe("COMPLETED");
    });

    it("supports skipping a module cleanly", async () => {
      const { studentToken } = await setupLearnerWithCurriculum();

      const genRes = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const pathId = genRes.body.data.id;
      const targetModuleId = genRes.body.data.modules[0].module.id;

      const skipRes = await request(app)
        .post("/api/progress/skip")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          learningPathId: pathId,
          moduleId: targetModuleId,
        });

      expect(skipRes.status).toBe(200);
      expect(skipRes.body.data.progress.status).toBe("SKIPPED");
    });
  });

  describe("3. Progress Audit Trail Verification", () => {
    it("creates immutable ProgressHistory audit trail entries for every lifecycle event", async () => {
      const { student, studentToken } = await setupLearnerWithCurriculum();

      const genRes = await request(app)
        .post("/api/learning-paths/generate")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const pathId = genRes.body.data.id;
      const targetModuleId = genRes.body.data.modules[0].module.id;

      // Action 1: Start
      await request(app)
        .post("/api/progress/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ learningPathId: pathId, moduleId: targetModuleId });

      // Action 2: Update to 50%
      await request(app)
        .patch("/api/progress")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          learningPathId: pathId,
          moduleId: targetModuleId,
          percentage: 50,
        });

      // Action 3: Complete
      await request(app)
        .post("/api/progress/complete")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ learningPathId: pathId, moduleId: targetModuleId });

      // Query database audit trail
      const auditEvents = await ProgressHistory.find({
        user: student._id,
        learningPath: pathId,
        module: targetModuleId,
      }).sort({ timestamp: 1 });

      expect(auditEvents.length).toBe(3);
      expect(auditEvents[0].action).toBe("STARTED");
      expect(auditEvents[0].newStatus).toBe("IN_PROGRESS");

      expect(auditEvents[1].action).toBe("PROGRESS_UPDATED");
      expect(auditEvents[1].newPercentage).toBe(50);

      expect(auditEvents[2].action).toBe("COMPLETED");
      expect(auditEvents[2].newPercentage).toBe(100);
      expect(auditEvents[2].newStatus).toBe("COMPLETED");
    });
  });
});
