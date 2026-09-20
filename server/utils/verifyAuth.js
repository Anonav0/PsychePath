const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const config = require("../config");
const { User } = require("../models");
const authService = require("../services/authService");
const app = require("../app");
const http = require("http");

let mongod = null;
let server = null;
let baseUrl = "";

const setup = async () => {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 });
  } catch (err) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    config.mongoUri = uri;
    await mongoose.connect(uri);
  }

  // Ensure JWT_SECRET is set for testing
  if (!config.jwtSecret) {
    config.jwtSecret = "test_suite_super_secret_jwt_key_at_least_32_characters";
  }

  // Start HTTP server for end-to-end endpoint testing
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/auth`;
      resolve();
    });
  });
};

const teardown = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

const runAuthTests = async () => {
  console.log("\n=============================================");
  console.log("🔒 PsychePath Phase 3: Authentication & RBAC");
  console.log("=============================================\n");

  await setup();

  // Clear users for fresh test run
  await User.deleteMany({});

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  };

  let studentToken = "";
  let adminToken = "";
  let studentUser = null;
  let adminUser = null;

  // -----------------------------------------------------------
  // 1. Registration Tests
  // -----------------------------------------------------------
  console.log("--- 1. Registration & Input Validation ---");

  await test("Valid student registration succeeds and returns JWT", async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Elena",
        lastName: "Rostova",
        email: "elena.rostova@example.com",
        password: "SecurePassword123!",
      }),
    });

    const data = await res.json();
    if (res.status !== 201)
      throw new Error(`Expected 201, got ${res.status}: ${data.message}`);
    if (!data.success) throw new Error("Response success flag is not true");
    if (!data.data.token) throw new Error("JWT token was not returned");
    if (data.data.user.role !== "STUDENT")
      throw new Error(`Expected role STUDENT, got ${data.data.user.role}`);
    if (data.data.user.password)
      throw new Error("Password was returned in registration response");

    studentToken = data.data.token;
    studentUser = data.data.user;
  });

  await test("Duplicate email registration is rejected with 409 Conflict", async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Elena",
        lastName: "Clone",
        email: "elena.rostova@example.com",
        password: "AnotherPassword123!",
      }),
    });

    const data = await res.json();
    if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
    if (data.errorCode !== "EMAIL_ALREADY_EXISTS")
      throw new Error(`Expected EMAIL_ALREADY_EXISTS error code`);
  });

  await test("Role tampering prevention: attempting to register with role=ADMIN is forced to STUDENT", async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Hacker",
        lastName: "Attempt",
        email: "hacker@example.com",
        password: "Password123!",
        role: "ADMIN",
      }),
    });

    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (data.data.user.role !== "STUDENT")
      throw new Error(
        `Security breach! Role was set to ${data.data.user.role}`,
      );

    const dbUser = await User.findOne({ email: "hacker@example.com" });
    if (dbUser.role !== "STUDENT")
      throw new Error(`Database user has role ${dbUser.role}`);
  });

  await test("Registration rejects malformed email address (400 Bad Request)", async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Bad",
        lastName: "Email",
        email: "not-a-valid-email",
        password: "Password123!",
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "VALIDATION_ERROR")
      throw new Error("Expected VALIDATION_ERROR code");
  });

  await test("Registration rejects passwords shorter than 8 characters (400 Bad Request)", async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Short",
        lastName: "Pass",
        email: "shortpass@example.com",
        password: "short",
      }),
    });

    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // -----------------------------------------------------------
  // 2. Password Hashing Verification
  // -----------------------------------------------------------
  console.log("\n--- 2. Password Hashing & Storage Security ---");

  await test("Password is saved as bcrypt hash in MongoDB, never in plaintext", async () => {
    const userInDb = await User.findOne({
      email: "elena.rostova@example.com",
    }).select("+password");
    if (!userInDb) throw new Error("User not found in DB");
    if (userInDb.password === "SecurePassword123!")
      throw new Error("Password stored as plaintext!");
    if (
      !userInDb.password.startsWith("$2a$") &&
      !userInDb.password.startsWith("$2b$")
    ) {
      throw new Error(
        `Password is not a valid bcrypt hash: ${userInDb.password.substring(0, 7)}`,
      );
    }
  });

  // Create an Admin user in DB for RBAC testing
  adminUser = await User.create({
    firstName: "System",
    lastName: "Admin",
    email: "system.admin@psychepath.io",
    password: "AdminSuperPassword2026!",
    role: "ADMIN",
    isActive: true,
  });

  // -----------------------------------------------------------
  // 3. Login Verification
  // -----------------------------------------------------------
  console.log("\n--- 3. Login & Credential Verification ---");

  await test("Valid login succeeds and updates lastLoginAt", async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "elena.rostova@example.com",
        password: "SecurePassword123!",
      }),
    });

    const data = await res.json();
    if (res.status !== 200)
      throw new Error(`Expected 200, got ${res.status}: ${data.message}`);
    if (!data.data.token) throw new Error("JWT token was not returned");

    const updatedUser = await User.findOne({
      email: "elena.rostova@example.com",
    });
    if (!updatedUser.lastLoginAt)
      throw new Error("lastLoginAt was not updated on successful login");
  });

  await test("Admin login succeeds with correct credentials", async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "system.admin@psychepath.io",
        password: "AdminSuperPassword2026!",
      }),
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    adminToken = data.data.token;
  });

  await test("Login with incorrect password returns generic 401 error", async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "elena.rostova@example.com",
        password: "WrongPassword!",
      }),
    });

    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "INVALID_CREDENTIALS")
      throw new Error("Expected INVALID_CREDENTIALS code");
    if (data.message !== "Invalid email or password")
      throw new Error("Message leaks credential detail");
  });

  await test("Login with non-existent email returns identical generic 401 error", async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "SomePassword123!",
      }),
    });

    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.message !== "Invalid email or password")
      throw new Error("Non-generic message exposes user existence");
  });

  await test("Inactive account cannot log in", async () => {
    await User.create({
      firstName: "Deactivated",
      lastName: "User",
      email: "deactivated@example.com",
      password: "Password123!",
      role: "STUDENT",
      isActive: false,
    });

    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "deactivated@example.com",
        password: "Password123!",
      }),
    });

    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // -----------------------------------------------------------
  // 4. Protected Endpoints & Token Validation
  // -----------------------------------------------------------
  console.log(
    "\n--- 4. Protected Profile (/api/auth/me) & Token Verification ---",
  );

  await test("GET /api/auth/me returns current authenticated student data without password", async () => {
    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.email !== "elena.rostova@example.com")
      throw new Error("Returned wrong user email");
    if (data.data.password)
      throw new Error("Password hash leaked in /me response");
  });

  await test("GET /api/auth/me rejects request without Authorization header (401)", async () => {
    const res = await fetch(`${baseUrl}/me`);
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "AUTH_REQUIRED")
      throw new Error("Expected AUTH_REQUIRED");
  });

  await test("GET /api/auth/me rejects invalid / tampered token (401)", async () => {
    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: "Bearer invalid_tampered_jwt_token_payload" },
    });
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "INVALID_TOKEN")
      throw new Error("Expected INVALID_TOKEN");
  });

  await test("GET /api/auth/me rejects expired token (401)", async () => {
    const expiredToken = jwt.sign(
      { sub: studentUser._id, role: "STUDENT" },
      config.jwtSecret,
      { expiresIn: "-10s" }, // Expired 10 seconds ago
    );

    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "INVALID_TOKEN")
      throw new Error("Expected INVALID_TOKEN");
  });

  // -----------------------------------------------------------
  // 5. Role-Based Access Control (RBAC)
  // -----------------------------------------------------------
  console.log("\n--- 5. Role-Based Access Control (RBAC) ---");

  await test("Student accessing student-test endpoint succeeds with 200 OK", async () => {
    const res = await fetch(`${baseUrl}/student-test`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test("Student attempting admin-test endpoint is forbidden with 403 Forbidden", async () => {
    const res = await fetch(`${baseUrl}/admin-test`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    if (data.errorCode !== "FORBIDDEN")
      throw new Error("Expected FORBIDDEN error code");
  });

  await test("Admin accessing admin-test endpoint succeeds with 200 OK", async () => {
    const res = await fetch(`${baseUrl}/admin-test`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test("Unauthenticated request to admin-test returns 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/admin-test`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  console.log("\n=============================================");
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log("=============================================\n");

  await teardown();

  if (failed > 0) {
    process.exit(1);
  }
};

runAuthTests().catch((err) => {
  console.error("[Verify Auth Fatal Error]", err);
  process.exit(1);
});
