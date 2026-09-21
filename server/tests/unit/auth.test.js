const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const config = require("../../config");
const { User } = require("../../models");
const {
  connect,
  clearDatabase,
  closeDatabase,
  createTestUser,
  generateToken,
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

describe("Authentication & Credentials Unit Tests", () => {
  describe("1. User Registration", () => {
    it("successfully registers a new student with hashed password and returns JWT", async () => {
      const payload = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        password: "SecurePassword123!",
      };

      const res = await request(app).post("/api/auth/register").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe("jane.doe@example.com");
      expect(res.body.data.user.role).toBe("STUDENT");

      // Password and sensitive fields must NEVER be returned in response
      expect(res.body.data.user.password).toBeUndefined();

      // Database check: verify password was hashed with bcrypt
      const savedUser = await User.findOne({
        email: "jane.doe@example.com",
      }).select("+password");
      expect(savedUser).toBeDefined();
      expect(savedUser.password).not.toBe("SecurePassword123!");
      const isMatch = await bcrypt.compare(
        "SecurePassword123!",
        savedUser.password,
      );
      expect(isMatch).toBe(true);
    });

    it("rejects duplicate email registration", async () => {
      await createTestUser("STUDENT", { email: "duplicate@example.com" });

      const res = await request(app).post("/api/auth/register").send({
        firstName: "Clone",
        lastName: "User",
        email: "duplicate@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        /already exists|already registered|duplicate/i,
      );
    });

    it("rejects registration with missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({
        firstName: "Incomplete",
        email: "incomplete@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. User Login", () => {
    it("successfully logs in with valid credentials and returns valid JWT", async () => {
      const { user, rawPassword } = await createTestUser("STUDENT", {
        email: "login.test@example.com",
        password: "ValidPassword123!",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "login.test@example.com",
        password: rawPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();

      // Verify JWT claims
      const decoded = jwt.verify(res.body.data.token, config.jwtSecret);
      expect(decoded.sub).toBe(user._id.toString());
      expect(decoded.role).toBe("STUDENT");
    });

    it("rejects login with incorrect password", async () => {
      await createTestUser("STUDENT", {
        email: "wrong.pass@example.com",
        password: "CorrectPassword123!",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "wrong.pass@example.com",
        password: "WrongPassword123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        /invalid email or password|invalid credentials/i,
      );
    });

    it("rejects login with non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "ghost@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects login for deactivated/inactive accounts", async () => {
      const { rawPassword } = await createTestUser("STUDENT", {
        email: "inactive@example.com",
        password: "Password123!",
        isActive: false,
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "inactive@example.com",
        password: rawPassword,
      });

      expect([401, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        /invalid email or password|inactive|deactivated/i,
      );
    });
  });

  describe("3. Current Authenticated User (/auth/me)", () => {
    it("retrieves current user profile without password exposure", async () => {
      const { user, token } = await createTestUser("STUDENT", {
        email: "me.test@example.com",
        firstName: "Morgan",
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("me.test@example.com");
      expect(res.body.data.firstName).toBe("Morgan");
      expect(res.body.data.password).toBeUndefined();
    });

    it("returns 401 when Authorization header is missing", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 401 when Authorization header is malformed (no Bearer prefix)", async () => {
      const { token } = await createTestUser("STUDENT");

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Basic ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 401 when token has an invalid signature", async () => {
      const invalidToken = jwt.sign(
        { id: "fake_id", role: "STUDENT" },
        "wrong_secret_key",
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 401 when token is expired", async () => {
      const { user } = await createTestUser("STUDENT");
      const expiredToken = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: "-1s" }, // Expired 1 second ago
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
