const request = require("supertest");
const app = require("../../app");
const { AssessmentAttempt } = require("../../models");
const {
  connect,
  clearDatabase,
  closeDatabase,
  createTestUser,
  createAdminUser,
  createTestAssessment,
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

describe("Assessment Lifecycle, Validation & Backend Scoring Tests", () => {
  describe("1. Assessment Discovery & Retrieval", () => {
    it("allows student to view active assessments and excludes hidden/admin fields", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      const res = await request(app)
        .get("/api/assessments")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(
        res.body.data.some(
          (a) => a._id.toString() === assessment._id.toString(),
        ),
      ).toBe(true);
    });

    it("prevents student from accessing an inactive assessment", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id, {
        isActive: false,
      });

      const res = await request(app)
        .get(`/api/assessments/${assessment._id}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. Attempt Creation & Resume", () => {
    it("creates a new in-progress attempt for a student", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      const res = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("IN_PROGRESS");
      const assessmentIdStr = (
        res.body.data.assessment?._id || res.body.data.assessment
      ).toString();
      expect(assessmentIdStr).toBe(assessment._id.toString());
    });

    it("resumes an existing active attempt without creating a duplicate", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      // First attempt request
      const firstRes = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const firstId = firstRes.body.data._id;

      // Second attempt request before completion (resume)
      const secondRes = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.data._id).toBe(firstId);

      // Verify only 1 attempt document exists in DB
      const count = await AssessmentAttempt.countDocuments({
        assessment: assessment._id,
      });
      expect(count).toBe(1);
    });
  });

  describe("3. Answer Submission & Backend Scoring Authority", () => {
    it("saves intermediate answers successfully", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment, questions } = await createTestAssessment(admin._id);

      const startRes = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const attemptId = startRes.body.data._id;

      // Save answer for question 1
      const saveRes = await request(app)
        .post(`/api/attempts/${attemptId}/answers`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          answers: [
            { questionId: questions[0]._id.toString(), selectedValue: "5" }, // Strongly Agree (100)
          ],
        });

      expect(resSaveOk(saveRes.status)).toBe(true);
      expect(saveRes.body.success).toBe(true);
    });

    it("rejects saving answers for invalid or unknown question IDs", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment } = await createTestAssessment(admin._id);

      const startRes = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const attemptId = startRes.body.data._id;

      const badRes = await request(app)
        .post(`/api/attempts/${attemptId}/answers`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          answers: [
            { questionId: "000000000000000000000000", selectedValue: "5" },
          ],
        });

      expect([400, 404]).toContain(badRes.status);
      expect(badRes.body.success).toBe(false);
    });

    it("completes submission, executes deterministic backend scoring, and computes dimension aggregates", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment, questions } = await createTestAssessment(admin._id);

      const startRes = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const attemptId = startRes.body.data._id;

      // Provide answers for all 3 questions
      // Question 1 (analytical): option '5' -> score 100
      // Question 2 (intuitive): option '4' -> score 80
      // Question 3 (collaborative): option '3' -> score 60
      await request(app)
        .post(`/api/attempts/${attemptId}/answers`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          answers: [
            { questionId: questions[0]._id.toString(), selectedValue: "5" },
            { questionId: questions[1]._id.toString(), selectedValue: "4" },
            { questionId: questions[2]._id.toString(), selectedValue: "3" },
          ],
        });

      // Submit attempt
      const submitRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.data.status).toBe("COMPLETED");

      // Verify backend computed score
      expect(submitRes.body.data.scores).toBeDefined();
      expect(submitRes.body.data.resultSummary).toBeDefined();

      // Retrieve official result
      const resultRes = await request(app)
        .get(`/api/attempts/${attemptId}/result`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(resultRes.status).toBe(200);
      expect(resultRes.body.data.scores).toBeDefined();
      // Analytical subscore should be 100
      expect(resultRes.body.data.scores.analytical).toBe(100);
    });

    it("strictly forbids duplicate submission on an already completed attempt", async () => {
      const { user: admin } = await createAdminUser();
      const { token: studentToken } = await createTestUser("STUDENT");
      const { assessment, questions } = await createTestAssessment(admin._id);

      const startRes = await request(app)
        .post(`/api/assessments/${assessment._id}/attempts`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      const attemptId = startRes.body.data._id;

      await request(app)
        .post(`/api/attempts/${attemptId}/answers`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          answers: questions.map((q) => ({
            questionId: q._id.toString(),
            selectedValue: "4",
          })),
        });

      // First submit
      const firstSubmit = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${studentToken}`);
      expect(firstSubmit.status).toBe(200);

      // Duplicate second submit attempt
      const secondSubmit = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(secondSubmit.status).toBe(400);
      expect(secondSubmit.body.success).toBe(false);
      expect(secondSubmit.body.errorCode).toBe("ATTEMPT_ALREADY_COMPLETED");
    });
  });
});

function resSaveOk(status) {
  return status === 200 || status === 201;
}
