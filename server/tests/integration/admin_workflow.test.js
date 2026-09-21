const request = require("supertest");
const app = require("../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  createAdminUser,
  createTestUser,
} = require("../helpers/testDb");
const { CurriculumModule, Assessment, User } = require("../../models");

describe("Admin Management Workflow Integration Tests", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it("executes the full administrative workflow: stats, learner directory, status toggling, assessment/question authoring, curriculum creation & DAG cycle prevention", async () => {
    // -------------------------------------------------------------------------
    // STEP 1: Admin Authentication
    // -------------------------------------------------------------------------
    const adminPassword = "AdminSecurePassword123!";
    const { user: admin } = await createAdminUser({ password: adminPassword });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: admin.email,
      password: adminPassword,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const adminToken = loginRes.body.data.token;
    expect(adminToken).toBeDefined();

    // Create a student user for directory and status modification tests
    const studentPassword = "StudentPassword123!";
    const { user: student } = await createTestUser("STUDENT", {
      firstName: "Jane",
      lastName: "Doe",
      password: studentPassword,
    });

    // -------------------------------------------------------------------------
    // STEP 2: Overview Platform Statistics
    // -------------------------------------------------------------------------
    const statsRes = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data).toHaveProperty("totalLearners");
    expect(statsRes.body.data).toHaveProperty("activeLearners");
    expect(statsRes.body.data.totalLearners).toBeGreaterThanOrEqual(1);

    // -------------------------------------------------------------------------
    // STEP 3: Learner Directory Retrieval & Search
    // -------------------------------------------------------------------------
    const learnersRes = await request(app)
      .get("/api/admin/learners?search=Jane")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(learnersRes.status).toBe(200);
    expect(learnersRes.body.success).toBe(true);
    expect(learnersRes.body.data.learners.length).toBeGreaterThanOrEqual(1);
    expect(learnersRes.body.data.learners[0].email).toBe(student.email);

    // -------------------------------------------------------------------------
    // STEP 4: Student Account Status Modification (Deactivation & Reactivation)
    // -------------------------------------------------------------------------
    // 4a. Deactivate student account
    const deactivateRes = await request(app)
      .patch(`/api/admin/learners/${student._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.isActive).toBe(false);

    // 4b. Verify deactivated student is blocked from login (generic 401 to prevent enumeration)
    const blockedLoginRes = await request(app).post("/api/auth/login").send({
      email: student.email,
      password: studentPassword,
    });

    expect(blockedLoginRes.status).toBe(401);
    expect(blockedLoginRes.body.errorCode).toBe("INVALID_CREDENTIALS");

    // 4c. Reactivate student account
    const reactivateRes = await request(app)
      .patch(`/api/admin/learners/${student._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: true });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.isActive).toBe(true);

    // 4d. Verify student can login again
    const allowedLoginRes = await request(app).post("/api/auth/login").send({
      email: student.email,
      password: studentPassword,
    });

    expect(allowedLoginRes.status).toBe(200);
    expect(allowedLoginRes.body.success).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 5: Assessment Authoring
    // -------------------------------------------------------------------------
    const assessmentPayload = {
      title: "Fullstack Architecture Aptitude",
      description: "Diagnostic assessment for fullstack development workflows.",
      type: "SKILLS",
      instructions: "Read each scenario carefully and select the best answer.",
      estimatedDuration: 20,
      dimensions: [
        {
          key: "system_design",
          name: "System Design",
          description: "Architectural capability",
        },
        {
          key: "debugging",
          name: "Debugging",
          description: "Troubleshooting ability",
        },
      ],
    };

    const createAssessRes = await request(app)
      .post("/api/assessments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(assessmentPayload);

    expect(createAssessRes.status).toBe(201);
    expect(createAssessRes.body.success).toBe(true);
    const createdAssessmentId = createAssessRes.body.data._id;
    expect(createdAssessmentId).toBeDefined();

    // -------------------------------------------------------------------------
    // STEP 6: Question Authoring with Dimension Mapping
    // -------------------------------------------------------------------------
    const questionPayload = {
      questionText:
        "How do you resolve unexpected high memory consumption in a Node.js microservice?",
      questionType: "MULTIPLE_CHOICE",
      dimension: "system_design",
      order: 1,
      isRequired: true,
      options: [
        {
          label: "Capture heap snapshot and analyze object retention graph",
          value: "snapshot",
          score: 100,
        },
        {
          label: "Restart the server container periodically",
          value: "restart",
          score: 20,
        },
      ],
    };

    const addQuestionRes = await request(app)
      .post(`/api/assessments/${createdAssessmentId}/questions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(questionPayload);

    expect(addQuestionRes.status).toBe(201);
    expect(addQuestionRes.body.success).toBe(true);
    expect(addQuestionRes.body.data.dimension).toBe("system_design");

    // -------------------------------------------------------------------------
    // STEP 7: Curriculum Module Creation
    // -------------------------------------------------------------------------
    const moduleAlphaRes = await request(app)
      .post("/api/curriculum")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Module Alpha: Advanced TypeScript",
        slug: "module-alpha-advanced-ts",
        description:
          "Deep dive into generics, conditional types, and utility types",
        category: "FRONTEND",
        difficulty: "INTERMEDIATE",
        estimatedDuration: 12,
        skills: [{ name: "TypeScript", level: "INTERMEDIATE" }],
        learningObjectives: ["Master TypeScript generics"],
        isActive: true,
      });

    expect(moduleAlphaRes.status).toBe(201);
    const moduleAlphaId = moduleAlphaRes.body.data._id;

    const moduleBetaRes = await request(app)
      .post("/api/curriculum")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Module Beta: Distributed Systems with NestJS",
        slug: "module-beta-distributed-systems",
        description: "Event-driven microservices architecture",
        category: "BACKEND",
        difficulty: "ADVANCED",
        estimatedDuration: 18,
        skills: [{ name: "NestJS", level: "ADVANCED" }],
        learningObjectives: ["Architect message-driven services"],
        isActive: true,
      });

    expect(moduleBetaRes.status).toBe(201);
    const moduleBetaId = moduleBetaRes.body.data._id;

    // -------------------------------------------------------------------------
    // STEP 8: Prerequisite DAG Cycle Prevention
    // -------------------------------------------------------------------------
    // 8a. Set Module Alpha as prerequisite of Module Beta (Valid DAG edge: Alpha -> Beta)
    const setPrereqRes = await request(app)
      .patch(`/api/curriculum/${moduleBetaId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        prerequisites: [moduleAlphaId],
      });

    expect(setPrereqRes.status).toBe(200);
    expect(setPrereqRes.body.success).toBe(true);

    // 8b. Attempt to set Module Beta as prerequisite of Module Alpha (Creates cycle: Alpha -> Beta -> Alpha)
    const cyclicRes = await request(app)
      .patch(`/api/curriculum/${moduleAlphaId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        prerequisites: [moduleBetaId],
      });

    expect(cyclicRes.status).toBe(400);
    expect(cyclicRes.body.success).toBe(false);
    expect(cyclicRes.body.errorCode).toBe("CURRICULUM_CIRCULAR_DEPENDENCY");
  });
});
