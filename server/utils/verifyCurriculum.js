const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const config = require("../config");
const { User, CurriculumModule } = require("../models");
const app = require("../app");
const http = require("http");

let mongod = null;
let server = null;
let serverBaseUrl = "";

const setup = async () => {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 });
  } catch (err) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    config.mongoUri = uri;
    await mongoose.connect(uri);
  }

  if (!config.jwtSecret) {
    config.jwtSecret = "test_suite_curriculum_secret_key_at_least_32_chars";
  }

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      serverBaseUrl = `http://localhost:${port}/api`;
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

const runCurriculumTests = async () => {
  console.log("\n======================================================");
  console.log("🧪 PsychePath Phase 6: Curriculum System Verification");
  console.log("======================================================\n");

  await setup();

  // Clear relevant collections for test isolation
  await Promise.all([User.deleteMany({}), CurriculumModule.deleteMany({})]);

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

  // Create Users & Tokens
  const adminUser = await User.create({
    firstName: "System",
    lastName: "Admin",
    email: "admin.curr@psychepath.io",
    password: "AdminPassword2026!",
    role: "ADMIN",
    isActive: true,
  });

  const studentUser = await User.create({
    firstName: "Alex",
    lastName: "Chen",
    email: "alex.curr@psychepath.io",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  const adminToken = jwt.sign(
    { sub: adminUser._id.toString(), role: "ADMIN" },
    config.jwtSecret,
    { expiresIn: "1h" },
  );

  const studentToken = jwt.sign(
    { sub: studentUser._id.toString(), role: "STUDENT" },
    config.jwtSecret,
    { expiresIn: "1h" },
  );

  // -------------------------------------------------------------
  // SUITE 1: Authentication & Authorization
  // -------------------------------------------------------------
  console.log("\n--- 1. Authentication & Role-Based Access Control ---");

  await test("Unauthenticated access to curriculum is rejected (401 AUTH_REQUIRED)", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`);
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    if (data.errorCode !== "AUTH_REQUIRED")
      throw new Error(`Expected AUTH_REQUIRED, got ${data.errorCode}`);
  });

  await test("Student cannot create curriculum modules (403 FORBIDDEN)", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Unauthorized Module",
        description: "Testing student block",
        category: "FRONTEND",
        difficulty: "BEGINNER",
        estimatedDuration: 10,
      }),
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    if (data.errorCode !== "FORBIDDEN")
      throw new Error(`Expected FORBIDDEN, got ${data.errorCode}`);
  });

  await test("Admin can create a valid curriculum module (201)", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Test Node.js Core",
        description: "Deep dive into Node.js event loop and streams",
        category: "BACKEND",
        difficulty: "INTERMEDIATE",
        estimatedDuration: 16,
        skills: ["Node.js", "Asynchronous Programming", "Event Loop"],
        learningObjectives: [
          "Understand the libuv event loop phases",
          "Master streams and buffers",
        ],
        resources: [
          {
            title: "Node.js Official Docs",
            type: "DOCUMENTATION",
            url: "https://nodejs.org/docs",
          },
        ],
      }),
    });
    const data = await res.json();
    if (res.status !== 201)
      throw new Error(`Expected 201, got ${res.status}: ${data.message}`);
    if (!data.success || !data.data || !data.data._id)
      throw new Error("Expected valid module response object");
    if (data.data.title !== "Test Node.js Core")
      throw new Error("Created module title mismatch");
    if (data.data.estimatedDuration !== 16)
      throw new Error("Created module estimatedDuration mismatch");
  });

  // -------------------------------------------------------------
  // SUITE 2: Validation Rules & Resource Security
  // -------------------------------------------------------------
  console.log("\n--- 2. Validation Rules & Resource URL Sanitization ---");

  await test("Missing required fields rejected with CURRICULUM_MODULE_INVALID", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Incomplete Module",
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_MODULE_INVALID")
      throw new Error(
        `Expected CURRICULUM_MODULE_INVALID, got ${data.errorCode}`,
      );
  });

  await test("Invalid category rejected with CURRICULUM_MODULE_INVALID", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Invalid Cat Module",
        description: "Valid description here",
        category: "BLOCKCHAIN",
        difficulty: "BEGINNER",
        estimatedDuration: 10,
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_MODULE_INVALID")
      throw new Error(
        `Expected CURRICULUM_MODULE_INVALID, got ${data.errorCode}`,
      );
  });

  await test("Invalid difficulty rejected with CURRICULUM_MODULE_INVALID", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Invalid Diff Module",
        description: "Valid description here",
        category: "FRONTEND",
        difficulty: "EXPERT_PLUS",
        estimatedDuration: 10,
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_MODULE_INVALID")
      throw new Error(
        `Expected CURRICULUM_MODULE_INVALID, got ${data.errorCode}`,
      );
  });

  await test("Negative or zero estimated duration rejected", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Zero Hours Module",
        description: "Valid description here",
        category: "FRONTEND",
        difficulty: "BEGINNER",
        estimatedDuration: 0,
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_MODULE_INVALID")
      throw new Error(
        `Expected CURRICULUM_MODULE_INVALID, got ${data.errorCode}`,
      );
  });

  await test("Dangerous resource URL schemes (javascript:, data:, ftp:) rejected with CURRICULUM_INVALID_RESOURCE", async () => {
    const maliciousUrls = [
      "javascript:alert('XSS')",
      "data:text/html,<script>alert(1)</script>",
      "ftp://malicious.com/file",
      "file:///etc/passwd",
    ];

    for (const badUrl of maliciousUrls) {
      const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: `XSS Test Module ${Date.now()}`,
          description: "Testing bad URL rejection",
          category: "FRONTEND",
          difficulty: "BEGINNER",
          estimatedDuration: 5,
          resources: [{ title: "Bad Link", type: "ARTICLE", url: badUrl }],
        }),
      });
      const data = await res.json();
      if (res.status !== 400)
        throw new Error(`Expected 400 for URL '${badUrl}', got ${res.status}`);
      if (data.errorCode !== "CURRICULUM_INVALID_RESOURCE")
        throw new Error(
          `Expected CURRICULUM_INVALID_RESOURCE for '${badUrl}', got ${data.errorCode}`,
        );
    }
  });

  // -------------------------------------------------------------
  // SUITE 3: Prerequisite Graph & Cycle Detection
  // -------------------------------------------------------------
  console.log("\n--- 3. Prerequisite Graph Validation & Cycle Detection ---");

  let modA, modB, modC;

  await test("Setup chain modules: A, B, and C", async () => {
    // Create Module A (Foundations)
    const resA = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Module A - Foundations",
        description: "Foundational concepts",
        category: "BACKEND",
        difficulty: "BEGINNER",
        estimatedDuration: 8,
      }),
    });
    const dataA = await resA.json();
    modA = dataA.data;

    // Create Module B depending on A (A -> B)
    const resB = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Module B - Intermediate",
        description: "Intermediate concepts",
        category: "BACKEND",
        difficulty: "INTERMEDIATE",
        estimatedDuration: 12,
        prerequisites: [modA._id],
      }),
    });
    const dataB = await resB.json();
    modB = dataB.data;

    // Create Module C depending on B (A -> B -> C)
    const resC = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Module C - Advanced",
        description: "Advanced concepts",
        category: "BACKEND",
        difficulty: "ADVANCED",
        estimatedDuration: 20,
        prerequisites: [modB._id],
      }),
    });
    const dataC = await resC.json();
    modC = dataC.data;

    if (!modA._id || !modB._id || !modC._id) {
      throw new Error("Failed to create modules A, B, and C");
    }
  });

  await test("Reject non-existent prerequisite ID (CURRICULUM_INVALID_PREREQUISITE)", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Module with Ghost Prereq",
        description: "Testing ghost prerequisite",
        category: "BACKEND",
        difficulty: "BEGINNER",
        estimatedDuration: 10,
        prerequisites: [fakeId],
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_INVALID_PREREQUISITE")
      throw new Error(
        `Expected CURRICULUM_INVALID_PREREQUISITE, got ${data.errorCode}`,
      );
  });

  await test("Reject self-dependency (CURRICULUM_INVALID_PREREQUISITE)", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules/${modA._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        prerequisites: [modA._id],
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_INVALID_PREREQUISITE")
      throw new Error(
        `Expected CURRICULUM_INVALID_PREREQUISITE, got ${data.errorCode}`,
      );
  });

  await test("Reject direct circular dependency: A -> B, updating A with prereq B (CURRICULUM_CIRCULAR_DEPENDENCY)", async () => {
    // Current: B requires A (A -> B).
    // If we update A to require B, we create a direct cycle (A -> B -> A).
    const res = await fetch(`${serverBaseUrl}/curriculum/modules/${modA._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        prerequisites: [modB._id],
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_CIRCULAR_DEPENDENCY")
      throw new Error(
        `Expected CURRICULUM_CIRCULAR_DEPENDENCY, got ${data.errorCode}`,
      );
  });

  await test("Reject transitive circular dependency: A -> B -> C, updating A with prereq C (CURRICULUM_CIRCULAR_DEPENDENCY)", async () => {
    // Current: B requires A, C requires B (A -> B -> C).
    // If we update A to require C, we create a 3-node cycle (A -> B -> C -> A).
    const res = await fetch(`${serverBaseUrl}/curriculum/modules/${modA._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        prerequisites: [modC._id],
      }),
    });
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_CIRCULAR_DEPENDENCY")
      throw new Error(
        `Expected CURRICULUM_CIRCULAR_DEPENDENCY, got ${data.errorCode}`,
      );
  });

  // -------------------------------------------------------------
  // SUITE 4: Browsing, Filtering, Search & Inactive Visibility
  // -------------------------------------------------------------
  console.log("\n--- 4. Browsing, Filtering, Search & Visibility ---");

  let inactiveMod;

  await test("Create inactive module and verify student visibility isolation", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Draft Secret Module",
        description: "Not yet published for students",
        category: "AI_DATA_SCIENCE",
        difficulty: "ADVANCED",
        estimatedDuration: 25,
        isActive: false,
        skills: ["PyTorch", "Deep Learning"],
      }),
    });
    const data = await res.json();
    inactiveMod = data.data;

    // Student browse should NOT include inactiveMod
    const sRes = await fetch(`${serverBaseUrl}/curriculum/modules`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const sData = await sRes.json();
    const foundInStudent = sData.data.modules.some(
      (m) => m._id === inactiveMod._id,
    );
    if (foundInStudent)
      throw new Error("Student should NOT see inactive modules");

    // Admin browse can include inactiveMod when requested
    const aRes = await fetch(
      `${serverBaseUrl}/curriculum/modules?isActive=false`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    const aData = await aRes.json();
    const foundInAdmin = aData.data.modules.some(
      (m) => m._id === inactiveMod._id,
    );
    if (!foundInAdmin)
      throw new Error("Admin should be able to view inactive modules");
  });

  await test("Filter by category (DATABASE)", async () => {
    // Create a database module
    await fetch(`${serverBaseUrl}/curriculum/modules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "PostgreSQL Schema Design",
        description: "Relational database patterns and normalization",
        category: "DATABASE",
        difficulty: "INTERMEDIATE",
        estimatedDuration: 14,
        skills: ["PostgreSQL", "SQL", "Database Design"],
      }),
    });

    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules?category=DATABASE`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!data.data.modules || data.data.modules.length === 0)
      throw new Error("Expected at least 1 DATABASE module");
    for (const mod of data.data.modules) {
      if (mod.category !== "DATABASE")
        throw new Error(`Expected category DATABASE, got ${mod.category}`);
    }
  });

  await test("Filter by difficulty (BEGINNER)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules?difficulty=BEGINNER`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!data.data.modules || data.data.modules.length === 0)
      throw new Error("Expected at least 1 BEGINNER module");
    for (const mod of data.data.modules) {
      if (mod.difficulty !== "BEGINNER")
        throw new Error(`Expected difficulty BEGINNER, got ${mod.difficulty}`);
    }
  });

  await test("Filter by skill name (case-insensitive regex)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules?skill=postgresql`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!data.data.modules || data.data.modules.length === 0)
      throw new Error("Expected matching module for skill postgresql");
    const hasSkill = data.data.modules.every((m) =>
      m.skills.some((s) => s.name.toLowerCase().includes("postgresql")),
    );
    if (!hasSkill)
      throw new Error("Returned module does not contain the filtered skill");
  });

  await test("Search keyword in title / description", async () => {
    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules?search=event%20loop`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!data.data.modules || data.data.modules.length === 0)
      throw new Error("Expected matching module for search 'event loop'");
    if (data.data.modules[0].title !== "Test Node.js Core")
      throw new Error(
        `Expected 'Test Node.js Core', got '${data.data.modules[0].title}'`,
      );
  });

  await test("Pagination metadata correctness (page, limit, totalPages)", async () => {
    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules?page=1&limit=2`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const pagination = data.data.pagination;
    if (pagination.page !== 1)
      throw new Error(`Expected page 1, got ${pagination.page}`);
    if (pagination.limit !== 2)
      throw new Error(`Expected limit 2, got ${pagination.limit}`);
    if (data.data.modules.length > 2)
      throw new Error("Returned modules exceed limit");
    if (typeof pagination.total !== "number" || pagination.total < 3)
      throw new Error("Invalid total count");
  });

  await test("Sorting by estimatedDuration ascending", async () => {
    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules?sortBy=estimatedDuration&sortOrder=asc&limit=100`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const durations = data.data.modules.map((m) => m.estimatedDuration);
    for (let i = 1; i < durations.length; i++) {
      if (durations[i] < durations[i - 1]) {
        throw new Error(
          `Sorting failed: ${durations[i]} is less than preceding ${durations[i - 1]}`,
        );
      }
    }
  });

  // -------------------------------------------------------------
  // SUITE 5: Module Retrieval with Prerequisite Population
  // -------------------------------------------------------------
  console.log("\n--- 5. Module Retrieval & Prerequisite Population ---");

  await test("GET /curriculum/modules/:id populates prerequisite details", async () => {
    const res = await fetch(`${serverBaseUrl}/curriculum/modules/${modB._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const mod = data.data;
    if (!mod.prerequisites || mod.prerequisites.length === 0)
      throw new Error("Expected populated prerequisites array");
    const prereq = mod.prerequisites[0];
    if (typeof prereq !== "object" || prereq.title !== modA.title)
      throw new Error("Prerequisite was not properly populated with title");
  });

  await test("Invalid ObjectId returns 400 CURRICULUM_MODULE_INVALID", async () => {
    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules/invalid-mongo-id`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    const data = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_MODULE_INVALID")
      throw new Error(
        `Expected CURRICULUM_MODULE_INVALID, got ${data.errorCode}`,
      );
  });

  await test("Non-existent module returns 404 CURRICULUM_MODULE_NOT_FOUND", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${serverBaseUrl}/curriculum/modules/${fakeId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data = await res.json();
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    if (data.errorCode !== "CURRICULUM_MODULE_NOT_FOUND")
      throw new Error(
        `Expected CURRICULUM_MODULE_NOT_FOUND, got ${data.errorCode}`,
      );
  });

  // -------------------------------------------------------------
  // SUITE 6: Updates, Status Toggles & Safe Deletion
  // -------------------------------------------------------------
  console.log(
    "\n--- 6. Status Toggle, Safe Deletion & Dependency Protection ---",
  );

  await test("Admin toggles module isActive status via PATCH /status", async () => {
    const res = await fetch(
      `${serverBaseUrl}/curriculum/modules/${inactiveMod._id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: true }),
      },
    );
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.isActive !== true)
      throw new Error("Expected isActive to become true");
  });

  await test("Safe Deletion: Module with active dependents is soft-deactivated instead of hard-deleted", async () => {
    // modA is a prerequisite for modB. Deleting modA must NOT delete it permanently.
    const res = await fetch(`${serverBaseUrl}/curriculum/modules/${modA._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.softDeleted !== true)
      throw new Error("Expected softDeleted to be true when dependents exist");
    if (!data.data.dependentModules || data.data.dependentModules.length === 0)
      throw new Error("Expected dependentModules list in response");

    // Verify modA still exists in DB but isActive = false
    const checkModA = await CurriculumModule.findById(modA._id);
    if (!checkModA)
      throw new Error("Module was erroneously hard deleted from database");
    if (checkModA.isActive !== false)
      throw new Error("Module should have isActive = false");
  });

  await test("Safe Deletion: Module without dependents is permanently deleted", async () => {
    // modC has no dependents (nothing depends on C)
    const res = await fetch(`${serverBaseUrl}/curriculum/modules/${modC._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (data.data.permanent !== true)
      throw new Error("Expected permanent deletion for unreferenced module");

    // Verify modC is removed from DB
    const checkModC = await CurriculumModule.findById(modC._id);
    if (checkModC)
      throw new Error(
        "Module should have been permanently deleted from database",
      );
  });

  console.log("\n======================================================");
  console.log(`📊 Curriculum Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("======================================================\n");

  await teardown();

  if (failed > 0) {
    process.exit(1);
  }
};

runCurriculumTests().catch(async (err) => {
  console.error("Fatal test runner error:", err);
  await teardown();
  process.exit(1);
});
