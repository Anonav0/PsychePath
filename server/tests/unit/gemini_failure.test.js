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
const { LearnerProfile } = require("../../models");
const geminiService = require("../../services/geminiService");
const config = require("../../config");

describe("Gemini AI Failure & Fallback Resilience Tests", () => {
  let originalApiKey;
  let originalMaxRetries;

  beforeAll(async () => {
    await connect();
    originalApiKey = config.geminiApiKey;
    originalMaxRetries = geminiService.maxRetries;
    // Set fast retries for failure testing to keep tests fast
    geminiService.maxRetries = 0;
  });

  afterAll(async () => {
    config.geminiApiKey = originalApiKey;
    geminiService.maxRetries = originalMaxRetries;
    geminiService.setCustomTransport(null);
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    geminiService.setCustomTransport(null);
    config.geminiApiKey = "mock_test_gemini_api_key_12345";
  });

  const setupTestLearnerWithModules = async () => {
    const { user: admin } = await createAdminUser();
    const { user: student, token: studentToken } =
      await createTestUser("STUDENT");
    const [mod1, mod2] = await createTestCurriculum(admin._id);

    await LearnerProfile.findOneAndUpdate(
      { user: student._id },
      {
        $set: {
          currentSkills: [{ name: "HTML", level: "BEGINNER" }],
          learningGoals: [{ name: "JavaScript Fundamentals" }],
          assessmentDimensions: { analytical: 85, intuitive: 70 },
        },
      },
    );

    return { student, studentToken, mod1, mod2 };
  };

  it("successfully personalizes recommendations when Gemini returns valid structured JSON", async () => {
    const { studentToken, mod1 } = await setupTestLearnerWithModules();

    // Mock successful Gemini response
    const mockAiPayload = {
      summary: "Personalized AI accelerated path for JavaScript mastery",
      focusAreas: ["JavaScript Fundamentals", "Async Programming"],
      learningStrategy: ["Focus on core concepts with immediate practice"],
      sequence: [
        {
          moduleId: mod1._id.toString(),
          reason:
            "Essential foundation aligned with your analytical strengths.",
        },
      ],
    };

    geminiService.setCustomTransport(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockAiPayload) }],
              },
            },
          ],
        }),
      };
    });

    const res = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("HYBRID");
    expect(res.body.data.summary).toBe(mockAiPayload.summary);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    expect(res.body.data.recommendations[0].aiSequenced).toBe(true);
  });

  it("gracefully falls back to RULE_ENGINE when Gemini returns non-JSON / corrupted text", async () => {
    const { studentToken } = await setupTestLearnerWithModules();

    // Mock non-JSON response from Gemini
    geminiService.setCustomTransport(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "I apologize, but as an AI language model I cannot format this right now.",
                  },
                ],
              },
            },
          ],
        }),
      };
    });

    const res = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("RULE_ENGINE");
    expect(res.body.data.recommendations).toBeDefined();
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
  });

  it("gracefully falls back to RULE_ENGINE when Gemini returns malformed schema", async () => {
    const { studentToken } = await setupTestLearnerWithModules();

    // Mock response missing required sequence and summary
    geminiService.setCustomTransport(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      unexpectedKey: "no schema compliance",
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    });

    const res = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("RULE_ENGINE");
  });

  it("gracefully falls back to RULE_ENGINE on network timeout / abort", async () => {
    const { studentToken } = await setupTestLearnerWithModules();

    geminiService.setCustomTransport(async () => {
      const abortErr = new Error("The operation was aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    });

    const res = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("RULE_ENGINE");
  });

  it("gracefully falls back to RULE_ENGINE when Gemini returns HTTP 500 internal server error", async () => {
    const { studentToken } = await setupTestLearnerWithModules();

    geminiService.setCustomTransport(async () => {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Internal Google API Error" } }),
      };
    });

    const res = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("RULE_ENGINE");
  });

  it("gracefully falls back to RULE_ENGINE when Gemini quota is exhausted (HTTP 429)", async () => {
    const { studentToken } = await setupTestLearnerWithModules();

    geminiService.setCustomTransport(async () => {
      return {
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: "Resource has been exhausted (e.g. check quota)." },
        }),
      };
    });

    const res = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("RULE_ENGINE");
  });

  it("immediately uses RULE_ENGINE when Gemini API key is missing or unconfigured", async () => {
    const { studentToken } = await setupTestLearnerWithModules();

    config.geminiApiKey = null;

    const res = await request(app)
      .get("/api/recommendations")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe("RULE_ENGINE");
  });
});
