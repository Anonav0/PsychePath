const request = require("supertest");
const app = require("../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  createTestUser,
  createAdminUser,
  createTestAssessment,
} = require("../helpers/testDb");
const { AssessmentAttempt, LearnerProfile } = require("../../models");

describe("Learner Profile & Adaptive Signals Tests", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("1. Profile Retrieval & Self-Management", () => {
    it("returns 404 when profile has not yet been initialized or generated", async () => {
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      // Delete the default profile created by test helper to test uninitialized state
      await LearnerProfile.deleteMany({ user: student._id });

      const res = await request(app)
        .get("/api/profile/me")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("PROFILE_NOT_FOUND");
    });

    it("allows student to initialize and update profile with user-managed fields", async () => {
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");

      const updateData = {
        educationLevel: "UNDERGRADUATE",
        experienceLevel: "BEGINNER",
        preferredDifficulty: "BEGINNER",
        weeklyLearningHours: 10,
        interests: ["AI", "Web Development"],
        learningGoals: [
          { name: "Master Fullstack Development", priority: "HIGH" },
          { name: "Build Production Apps", priority: "MEDIUM" },
        ],
        currentSkills: [
          { name: "JavaScript", level: "INTERMEDIATE" },
          { name: "HTML", level: "BEGINNER" },
        ],
      };

      const res = await request(app)
        .patch("/api/profile/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.educationLevel).toBe("UNDERGRADUATE");
      expect(res.body.data.weeklyLearningHours).toBe(10);
      expect(res.body.data.interests).toContain("AI");
      expect(res.body.data.profileCompleteness).toBeGreaterThan(0);

      // Verify GET /api/profile/me retrieves the saved profile
      const getRes = await request(app)
        .get("/api/profile/me")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.user.toString()).toBe(student._id.toString());
      expect(getRes.body.data.weeklyLearningHours).toBe(10);
    });

    it("rejects forbidden/system-derived fields like strengths, assessmentDimensions, and user tampering", async () => {
      const { token: studentToken } = await createTestUser("STUDENT");

      const tamperAttempts = [
        { strengths: ["superhuman_intelligence"] },
        { assessmentDimensions: { analytical: 100 } },
        { profileVersion: 99 },
        { user: "000000000000000000000000" },
      ];

      for (const payload of tamperAttempts) {
        const res = await request(app)
          .patch("/api/profile/me")
          .set("Authorization", `Bearer ${studentToken}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errorCode).toBe("PROFILE_UPDATE_INVALID");
      }
    });

    it("validates education level and weekly hours boundaries", async () => {
      const { token: studentToken } = await createTestUser("STUDENT");

      // Invalid education level
      const badEduRes = await request(app)
        .patch("/api/profile/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ educationLevel: "ASTRONAUT_ACADEMY" });

      expect(badEduRes.status).toBe(400);
      expect(badEduRes.body.success).toBe(false);

      // Weekly hours out of bounds (negative or exceeding 168)
      const badHoursRes = await request(app)
        .patch("/api/profile/me")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ weeklyLearningHours: -5 });

      expect(badHoursRes.status).toBe(400);
      expect(badHoursRes.body.success).toBe(false);
    });
  });

  describe("2. Profile Generation from Assessment Signals", () => {
    it("transforms completed assessment results into strengths and improvement areas", async () => {
      const { user: admin } = await createAdminUser();
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      // Clear seeded profile so this generation creates fresh version 1
      await LearnerProfile.deleteMany({ user: student._id });

      // Create a completed attempt for this student with known scores
      const attempt = await AssessmentAttempt.create({
        user: student._id,
        assessment: assessment._id,
        status: "COMPLETED",
        scores: {
          analytical: 85, // >= 75 -> strength
          intuitive: 45, // < 60 -> improvement area
          collaborative: 65, // 60-74 -> neutral
        },
        resultSummary: "Good analytical foundations.",
        submittedAt: new Date(),
      });

      const res = await request(app)
        .post(`/api/profile/me/generate-from-assessment/${attempt._id}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profileVersion).toBe(1);

      // Check strengths and improvement areas mapping
      expect(res.body.data.strengths).toContain("analytical");
      expect(res.body.data.improvementAreas).toContain("intuitive");
      expect(res.body.data.strengths).not.toContain("intuitive");
      expect(res.body.data.improvementAreas).not.toContain("analytical");

      // Verify assessmentDimensions normalized
      expect(res.body.data.assessmentDimensions.analytical).toBe(85);
      expect(res.body.data.assessmentDimensions.intuitive).toBe(45);
      expect(res.body.data.lastAssessmentAttempt._id.toString()).toBe(
        attempt._id.toString(),
      );
    });

    it("increments profileVersion monotonically when generating again from a new attempt", async () => {
      const { user: admin } = await createAdminUser();
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      // Clear seeded profile
      await LearnerProfile.deleteMany({ user: student._id });

      // Attempt 1
      const attempt1 = await AssessmentAttempt.create({
        user: student._id,
        assessment: assessment._id,
        status: "COMPLETED",
        scores: { analytical: 80, intuitive: 60 },
        submittedAt: new Date(),
      });

      const gen1 = await request(app)
        .post(`/api/profile/me/generate-from-assessment/${attempt1._id}`)
        .set("Authorization", `Bearer ${studentToken}`);
      expect(gen1.body.data.profileVersion).toBe(1);

      // Attempt 2
      const attempt2 = await AssessmentAttempt.create({
        user: student._id,
        assessment: assessment._id,
        status: "COMPLETED",
        scores: { analytical: 90, intuitive: 80 },
        submittedAt: new Date(),
      });

      const gen2 = await request(app)
        .post(`/api/profile/me/generate-from-assessment/${attempt2._id}`)
        .set("Authorization", `Bearer ${studentToken}`);
      expect(gen2.body.data.profileVersion).toBe(2);
    });

    it("rejects generation if the attempt is not completed", async () => {
      const { user: admin } = await createAdminUser();
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      const inProgressAttempt = await AssessmentAttempt.create({
        user: student._id,
        assessment: assessment._id,
        status: "IN_PROGRESS",
      });

      const res = await request(app)
        .post(
          `/api/profile/me/generate-from-assessment/${inProgressAttempt._id}`,
        )
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ASSESSMENT_RESULT_NOT_AVAILABLE");
    });

    it("strictly forbids IDOR attempt: student cannot generate profile from another user's attempt", async () => {
      const { user: admin } = await createAdminUser();
      const { user: victimStudent } = await createTestUser("STUDENT");
      const { token: attackerToken } = await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      const victimAttempt = await AssessmentAttempt.create({
        user: victimStudent._id,
        assessment: assessment._id,
        status: "COMPLETED",
        scores: { analytical: 90 },
      });

      const res = await request(app)
        .post(`/api/profile/me/generate-from-assessment/${victimAttempt._id}`)
        .set("Authorization", `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ATTEMPT_ACCESS_DENIED");
    });
  });

  describe("3. Administrative Profile Inspection", () => {
    it("allows admin to inspect any learner profile but blocks regular students", async () => {
      const { user: student, token: studentToken } =
        await createTestUser("STUDENT");
      const { token: adminToken } = await createAdminUser();

      // Update student profile with custom values
      await LearnerProfile.findOneAndUpdate(
        { user: student._id },
        { $set: { educationLevel: "POSTGRADUATE", weeklyLearningHours: 15 } },
      );

      // Regular student trying to access via /api/profile/:userId
      const studentRes = await request(app)
        .get(`/api/profile/${student._id}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(studentRes.status).toBe(403);

      // Admin access
      const adminRes = await request(app)
        .get(`/api/profile/${student._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.profile.educationLevel).toBe("POSTGRADUATE");
      expect(adminRes.body.data.user._id.toString()).toBe(
        student._id.toString(),
      );
    });
  });
});
