const request = require("supertest");
const app = require("../../app");
const {
  AssessmentAttempt,
  LearningPath,
  LearnerProfile,
} = require("../../models");
const {
  connect,
  clearDatabase,
  closeDatabase,
  createTestUser,
  createAdminUser,
  createTestAssessment,
  createTestCurriculum,
} = require("../helpers/testDb");

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("Authorization, RBAC & IDOR Security Unit Tests", () => {
  describe("1. Role-Based Access Control (RBAC)", () => {
    it("allows a Student to access student endpoints (GET /api/profile/me)", async () => {
      const { token } = await createTestUser("STUDENT");

      const res = await request(app)
        .get("/api/profile/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("strictly blocks a Student from accessing Admin endpoints (GET /api/admin/stats) with 403", async () => {
      const { token } = await createTestUser("STUDENT");

      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("strictly blocks a Student from accessing Admin learner directory (GET /api/admin/learners) with 403", async () => {
      const { token } = await createTestUser("STUDENT");

      const res = await request(app)
        .get("/api/admin/learners")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("allows an Admin to access admin endpoints (GET /api/admin/stats)", async () => {
      const { token } = await createAdminUser();

      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalLearners).toBeDefined();
    });

    it("blocks unauthenticated access to protected endpoints with 401", async () => {
      const resStats = await request(app).get("/api/admin/stats");
      expect(resStats.status).toBe(401);
      expect(resStats.body.success).toBe(false);

      const resProfile = await request(app).get("/api/profile/me");
      expect(resProfile.status).toBe(401);
      expect(resProfile.body.success).toBe(false);

      const resPath = await request(app).get("/api/learning-path/current");
      expect(resPath.status).toBe(401);
      expect(resPath.body.success).toBe(false);
    });
  });

  describe("2. Insecure Direct Object Reference (IDOR) Protection", () => {
    it("prevents Student B from reading Student A's assessment attempt results", async () => {
      const { user: studentA, token: tokenA } = await createTestUser(
        "STUDENT",
        { email: "student.a@example.com" },
      );
      const { user: studentB, token: tokenB } = await createTestUser(
        "STUDENT",
        { email: "student.b@example.com" },
      );
      const { user: admin } = await createAdminUser();
      const { assessment, questions } = await createTestAssessment(admin._id);

      // Student A creates an assessment attempt
      const attemptRes = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      expect(attemptRes.status).toBe(201);
      const attemptId = attemptRes.body.data._id;

      // Student B attempts to inspect Student A's attempt result
      const snoopingRes = await request(app)
        .get(`/api/attempts/${attemptId}/result`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect([403, 404]).toContain(snoopingRes.status);
      expect(snoopingRes.body.success).toBe(false);
    });

    it("prevents Student B from accessing or mutating Student A's learning path progress", async () => {
      const { user: studentA, token: tokenA } = await createTestUser(
        "STUDENT",
        { email: "owner@example.com" },
      );
      const { user: studentB, token: tokenB } = await createTestUser(
        "STUDENT",
        { email: "attacker@example.com" },
      );
      const { user: admin } = await createAdminUser();
      const modules = await createTestCurriculum(admin._id);

      // Create a learning path for Student A
      const pathA = await LearningPath.create({
        user: studentA._id,
        version: 1,
        status: "ACTIVE",
        modules: [
          {
            module: modules[0]._id,
            order: 1,
            status: "NOT_STARTED",
            percentage: 0,
          },
        ],
        estimatedDuration: 10,
        generatedBy: "RULE_ENGINE",
      });

      // Student B attempts to start a module on Student A's learning path
      const hijackRes = await request(app)
        .post("/api/progress/start")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          learningPathId: pathA._id.toString(),
          moduleId: modules[0]._id.toString(),
        });

      expect([400, 403, 404]).toContain(hijackRes.status);
      expect(hijackRes.body.success).toBe(false);
    });

    it("prevents Student B from viewing Student A's progress history audit trail", async () => {
      const { user: studentA } = await createTestUser("STUDENT", {
        email: "target@example.com",
      });
      const { token: tokenB } = await createTestUser("STUDENT", {
        email: "spy@example.com",
      });

      const pathA = await LearningPath.create({
        user: studentA._id,
        version: 1,
        status: "ACTIVE",
        modules: [],
        estimatedDuration: 0,
        generatedBy: "RULE_ENGINE",
      });

      const auditRes = await request(app)
        .get(`/api/progress/${pathA._id}/history`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect([403, 404]).toContain(auditRes.status);
      expect(auditRes.body.success).toBe(false);
    });
  });

  describe("3. Client Parameter Tampering Resistance", () => {
    it("strictly rejects client attempts to override the user identity field in profile updates", async () => {
      const { token: tokenA } = await createTestUser("STUDENT");
      const { user: studentB } = await createTestUser("STUDENT", {
        email: "victim@example.com",
      });

      // Student A tries to update profile passing Student B's userId in the forbidden "user" field
      const res = await request(app)
        .patch("/api/profile/me")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          user: studentB._id.toString(),
          weeklyLearningHours: 25,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("PROFILE_UPDATE_INVALID");

      // Verify Student B's profile remained completely untouched
      const victimProfile = await LearnerProfile.findOne({
        user: studentB._id,
      });
      expect(victimProfile.weeklyLearningHours).toBe(10);
    });
  });
});
