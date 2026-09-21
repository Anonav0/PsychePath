const request = require("supertest");
const app = require("../../app");
const {
  connect,
  closeDatabase,
  clearDatabase,
  createTestUser,
  createAdminUser,
} = require("../helpers/testDb");

describe("API Error Handling & Edge Cases Tests", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("1. Malformed MongoDB ObjectId Handling", () => {
    it("returns 400 Bad Request with errorCode INVALID_ID on malformed route parameters", async () => {
      const { token: studentToken } = await createTestUser("STUDENT");

      const malformedRoutes = [
        "/api/assessments/not-a-valid-mongo-id",
        "/api/attempts/12345/result",
        "/api/curriculum/invalid_object_id_format",
        "/api/learning-paths/xyz-invalid",
      ];

      for (const route of malformedRoutes) {
        const res = await request(app)
          .get(route)
          .set("Authorization", `Bearer ${studentToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect([
          "INVALID_ID",
          "INVALID_PATH_ID",
          "INVALID_LEARNING_PATH_ID",
          "CURRICULUM_MODULE_INVALID",
        ]).toContain(res.body.errorCode);
      }
    });
  });

  describe("2. Validation Errors & Missing Required Fields", () => {
    it("returns 400 Bad Request with errorCode VALIDATION_ERROR on missing required payload fields", async () => {
      // Empty body on registration
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({});

      expect(registerRes.status).toBe(400);
      expect(registerRes.body.success).toBe(false);
      expect(registerRes.body.errorCode).toBe("VALIDATION_ERROR");

      // Missing password on login
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@example.com" });

      expect(loginRes.status).toBe(400);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.errorCode).toBe("VALIDATION_ERROR");
    });
  });

  describe("3. Invalid JSON Body Syntax", () => {
    it("returns 400 Bad Request with errorCode INVALID_JSON when client sends malformed JSON", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send('{"email": "broken_json@example.com", "password": '); // Incomplete JSON

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("INVALID_JSON");
      expect(res.body.message).toMatch(/invalid json/i);
    });
  });

  describe("4. Undefined Route Handling (404)", () => {
    it("returns standardized 404 response with errorCode ROUTE_NOT_FOUND for non-existent endpoints", async () => {
      const res = await request(app).get("/api/nonexistent/endpoint/path");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ROUTE_NOT_FOUND");
      expect(res.body.message).toMatch(/route not found/i);
    });
  });

  describe("5. Consistent Error Contract & Security Verification", () => {
    it("guarantees every error payload conforms to standard structure without leaking stack trace", async () => {
      const res = await request(app).get("/api/nonexistent/something");

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("errorCode");
      expect(res.body).not.toHaveProperty("stack");
    });
  });
});
