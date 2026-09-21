const request = require("supertest");
const app = require("../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  createAdminUser,
  createTestAssessment,
  createTestCurriculum,
} = require("../helpers/testDb");
const {
  LearnerProfile,
  LearningPath,
  ProgressHistory,
} = require("../../models");
const config = require("../../config");

describe("End-to-End Critical Workflow Integration Tests", () => {
  let originalApiKey;
  let adminUser;

  beforeAll(async () => {
    await connect();
    originalApiKey = config.geminiApiKey;
    config.geminiApiKey = null; // Rule engine deterministic path
  });

  afterAll(async () => {
    config.geminiApiKey = originalApiKey;
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Seed admin and curriculum
    const { user: admin } = await createAdminUser();
    adminUser = admin;
    await createTestCurriculum(admin._id);
    await createTestAssessment(admin._id);
  });

  it("executes the complete 10-step student lifecycle seamlessly from registration to module completion", async () => {
    // -------------------------------------------------------------------------
    // STEP 1: Register new student account
    // -------------------------------------------------------------------------
    const studentData = {
      firstName: "E2E",
      lastName: "Student",
      email: "e2e.student@example.com",
      password: "SecurePassword123!",
    };

    const regRes = await request(app)
      .post("/api/auth/register")
      .send(studentData);

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.email).toBe(studentData.email);

    // -------------------------------------------------------------------------
    // STEP 2: Authenticate (Login) and extract JWT token
    // -------------------------------------------------------------------------
    const loginRes = await request(app).post("/api/auth/login").send({
      email: studentData.email,
      password: studentData.password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    // -------------------------------------------------------------------------
    // STEP 3: Discover available assessments
    // -------------------------------------------------------------------------
    const assessRes = await request(app)
      .get("/api/assessments")
      .set("Authorization", `Bearer ${token}`);

    expect(assessRes.status).toBe(200);
    expect(assessRes.body.success).toBe(true);
    expect(assessRes.body.data.length).toBeGreaterThan(0);
    const targetAssessment = assessRes.body.data[0];
    const assessmentId = targetAssessment._id;

    // -------------------------------------------------------------------------
    // STEP 4: Start an assessment attempt
    // -------------------------------------------------------------------------
    const startAttemptRes = await request(app)
      .post(`/api/assessments/${assessmentId}/attempts`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect([200, 201]).toContain(startAttemptRes.status);
    expect(startAttemptRes.body.success).toBe(true);
    const attemptId = startAttemptRes.body.data._id;
    expect(attemptId).toBeDefined();

    // Fetch assessment questions
    const questionsRes = await request(app)
      .get(`/api/assessments/${assessmentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(questionsRes.status).toBe(200);
    const questions = questionsRes.body.data.questions;
    expect(questions.length).toBeGreaterThan(0);

    // -------------------------------------------------------------------------
    // STEP 5: Submit intermediate answers
    // -------------------------------------------------------------------------
    const answerPayload = {
      answers: questions.map((q) => ({
        questionId: q._id.toString(),
        selectedValue: q.options[0].value, // First option
      })),
    };

    const saveAnswersRes = await request(app)
      .post(`/api/attempts/${attemptId}/answers`)
      .set("Authorization", `Bearer ${token}`)
      .send(answerPayload);

    expect(saveAnswersRes.status).toBe(200);
    expect(saveAnswersRes.body.success).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 6: Finalize assessment submission & receive authoritative score
    // -------------------------------------------------------------------------
    const submitRes = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.status).toBe("COMPLETED");
    expect(submitRes.body.data.scores).toBeDefined();

    // -------------------------------------------------------------------------
    // STEP 7: Generate learner profile from completed assessment results
    // -------------------------------------------------------------------------
    const profileGenRes = await request(app)
      .post(`/api/profile/me/generate-from-assessment/${attemptId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(profileGenRes.status).toBe(200);
    expect(profileGenRes.body.success).toBe(true);
    expect(profileGenRes.body.data.assessmentDimensions).toBeDefined();

    // Augment profile with learning goals to enable full recommendations
    await request(app)
      .patch("/api/profile/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learningGoals: [{ name: "JavaScript Fundamentals" }],
        currentSkills: [{ name: "HTML", level: "BEGINNER" }],
      });

    // -------------------------------------------------------------------------
    // STEP 8: Request curriculum recommendations
    // -------------------------------------------------------------------------
    const recsRes = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${token}`);

    expect(recsRes.status).toBe(200);
    expect(recsRes.body.success).toBe(true);
    expect(recsRes.body.data.recommendations.length).toBeGreaterThan(0);

    // -------------------------------------------------------------------------
    // STEP 9: Generate personalized learning path
    // -------------------------------------------------------------------------
    const pathGenRes = await request(app)
      .post("/api/learning-paths/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(pathGenRes.status).toBe(201);
    expect(pathGenRes.body.success).toBe(true);
    const learningPath = pathGenRes.body.data;
    expect(learningPath.status).toBe("ACTIVE");
    expect(learningPath.modules.length).toBeGreaterThan(0);
    const firstModule = learningPath.modules[0].module;

    // -------------------------------------------------------------------------
    // STEP 10: Execute module lifecycle, progress update & verify audit trail
    // -------------------------------------------------------------------------
    // 10a. Start module
    const startModRes = await request(app)
      .post("/api/progress/start")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learningPathId: learningPath.id,
        moduleId: firstModule.id,
      });

    expect(startModRes.status).toBe(200);
    expect(startModRes.body.data.progress.status).toBe("IN_PROGRESS");

    // 10b. Update progress to 50%
    const updateProgressRes = await request(app)
      .patch("/api/progress")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learningPathId: learningPath.id,
        moduleId: firstModule.id,
        percentage: 50,
      });

    expect(updateProgressRes.status).toBe(200);
    expect(updateProgressRes.body.data.progress.percentage).toBe(50);

    // 10c. Complete module
    const completeModRes = await request(app)
      .post("/api/progress/complete")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learningPathId: learningPath.id,
        moduleId: firstModule.id,
      });

    expect(completeModRes.status).toBe(200);
    expect(completeModRes.body.data.progress.status).toBe("COMPLETED");
    expect(completeModRes.body.data.progress.percentage).toBe(100);

    // 10d. Verify audit trail history
    const historyRes = await request(app)
      .get(`/api/progress/${learningPath.id}/history`)
      .set("Authorization", `Bearer ${token}`);

    expect(historyRes.status).toBe(200);
    const historyEvents = historyRes.body.data.history;
    expect(historyEvents.length).toBeGreaterThanOrEqual(3);
    const actions = historyEvents.map((e) => e.action);
    expect(actions).toContain("STARTED");
    expect(actions).toContain("PROGRESS_UPDATED");
    expect(actions).toContain("COMPLETED");
  });
});
