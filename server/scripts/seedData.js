/**
 * PsychePath - Production Hardening Seed Dataset
 *
 * Defines realistic seed data across users, assessments, questions, and curriculum.
 */

const SEED_PASSWORDS = {
  admin: "AdminPass123!",
  student: "Password123!",
};

const usersData = [
  {
    firstName: "Administrator",
    lastName: "Supervisor",
    email: "admin@psychepath.com",
    password: SEED_PASSWORDS.admin,
    role: "ADMIN",
    isActive: true,
  },
  {
    firstName: "Alex",
    lastName: "Newbie",
    email: "student.new@psychepath.com",
    password: SEED_PASSWORDS.student,
    role: "STUDENT",
    isActive: true,
  },
  {
    firstName: "Sarah",
    lastName: "Diagnostic",
    email: "student.assessed@psychepath.com",
    password: SEED_PASSWORDS.student,
    role: "STUDENT",
    isActive: true,
  },
  {
    firstName: "David",
    lastName: "InFlight",
    email: "student.active@psychepath.com",
    password: SEED_PASSWORDS.student,
    role: "STUDENT",
    isActive: true,
  },
  {
    firstName: "Elena",
    lastName: "Master",
    email: "student.completed@psychepath.com",
    password: SEED_PASSWORDS.student,
    role: "STUDENT",
    isActive: true,
  },
  {
    firstName: "Marcus",
    lastName: "Deactivated",
    email: "student.inactive@psychepath.com",
    password: SEED_PASSWORDS.student,
    role: "STUDENT",
    isActive: false,
  },
];

const assessmentsData = [
  {
    title: "Cognitive Learning Style & Problem Solving Diagnostic",
    description:
      "Evaluates analytical reasoning, intuitive pattern recognition, collaborative synergy, and practical execution signals.",
    type: "LEARNING_STYLE",
    instructions:
      "Respond honestly to each prompt indicating how closely it describes your habitual learning approach.",
    estimatedDuration: 15,
    dimensions: [
      {
        key: "analytical",
        name: "Analytical Thinking",
        description: "Structured, sequential logic and proof verification.",
      },
      {
        key: "intuitive",
        name: "Intuitive Synthesis",
        description:
          "Holistic, big-picture conceptualization and mental modeling.",
      },
      {
        key: "collaborative",
        name: "Collaborative Learning",
        description:
          "Peer review, interactive discussion, and social learning.",
      },
      {
        key: "practical",
        name: "Hands-on Pragmatism",
        description:
          "Experimentation, code authoring, and project-based execution.",
      },
    ],
    isActive: true,
  },
  {
    title: "Fullstack Engineering Aptitude & Systems Diagnostic",
    description:
      "Evaluates foundational web technologies, backend service architecture, relational/document database design, and debugging fluency.",
    type: "SKILLS",
    instructions:
      "Choose the optimal engineering solution for each real-world architectural and technical challenge.",
    estimatedDuration: 20,
    dimensions: [
      {
        key: "frontend",
        name: "Frontend & UI Architecture",
        description: "DOM lifecycle, component composition, state management.",
      },
      {
        key: "backend",
        name: "Backend Services & APIs",
        description:
          "Runtime mechanics, REST design, middleware, and authentication.",
      },
      {
        key: "database",
        name: "Database & Data Modeling",
        description: "Schema normalization, indexing, query optimization.",
      },
      {
        key: "system_design",
        name: "System Design & Resilience",
        description: "Microservices, concurrency, caching, and scalability.",
      },
    ],
    isActive: true,
  },
];

const questionsAssessment1 = [
  {
    questionText:
      "When faced with a complex bug, I systematically trace variables and execution flow step-by-step.",
    questionType: "LIKERT_SCALE",
    dimension: "analytical",
    order: 1,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I prefer understanding the theoretical rationale and formal mechanics behind algorithms before implementing them.",
    questionType: "LIKERT_SCALE",
    dimension: "analytical",
    order: 2,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I quickly spot high-level architectural patterns across different software stacks without reading every line of documentation.",
    questionType: "LIKERT_SCALE",
    dimension: "intuitive",
    order: 3,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I learn best by zooming out to visualize how end-to-end user journeys flow through distributed services.",
    questionType: "LIKERT_SCALE",
    dimension: "intuitive",
    order: 4,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "Pair programming and code reviews accelerate my mastery of complex software concepts.",
    questionType: "LIKERT_SCALE",
    dimension: "collaborative",
    order: 5,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "Explaining a technical concept or architectural pattern to a teammate solidifies my own understanding.",
    questionType: "LIKERT_SCALE",
    dimension: "collaborative",
    order: 6,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I retain programming concepts significantly faster when immediately building executable code and experiments.",
    questionType: "LIKERT_SCALE",
    dimension: "practical",
    order: 7,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I prefer sandbox playgrounds and live coding environments over watching passive lectures.",
    questionType: "LIKERT_SCALE",
    dimension: "practical",
    order: 8,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I evaluate technical trade-offs between speed, space complexity, and maintainability before coding.",
    questionType: "LIKERT_SCALE",
    dimension: "analytical",
    order: 9,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I frequently connect ideas from unrelated domains (e.g., biological networks, transit systems) to software architecture.",
    questionType: "LIKERT_SCALE",
    dimension: "intuitive",
    order: 10,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "Participating in open-source discussions and issue triage sharpens my engineering judgment.",
    questionType: "LIKERT_SCALE",
    dimension: "collaborative",
    order: 11,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
  {
    questionText:
      "I learn by breaking working systems intentionally to observe failure modes and debug mechanisms.",
    questionType: "LIKERT_SCALE",
    dimension: "practical",
    order: 12,
    options: [
      { label: "Strongly Disagree", value: "1", score: 20 },
      { label: "Disagree", value: "2", score: 40 },
      { label: "Neutral", value: "3", score: 60 },
      { label: "Agree", value: "4", score: 80 },
      { label: "Strongly Agree", value: "5", score: 100 },
    ],
  },
];

const questionsAssessment2 = [
  {
    questionText:
      "What is the primary operational difference between the Virtual DOM and the real browser DOM?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "frontend",
    order: 1,
    options: [
      {
        label:
          "Virtual DOM batches updates in memory to minimize expensive layout thrashing in browser DOM",
        value: "opt_a",
        score: 100,
      },
      {
        label:
          "Virtual DOM bypasses JavaScript execution and compiles directly to WebAssembly",
        value: "opt_b",
        score: 20,
      },
      {
        label: "Virtual DOM stores state permanently in IndexedDB storage",
        value: "opt_c",
        score: 10,
      },
      {
        label: "There is no performance difference between them",
        value: "opt_d",
        score: 0,
      },
    ],
  },
  {
    questionText:
      "When designing state in React, which hook is most appropriate for caching expensive computations across renders?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "frontend",
    order: 2,
    options: [
      { label: "useMemo", value: "use_memo", score: 100 },
      { label: "useCallback", value: "use_callback", score: 60 },
      { label: "useEffect", value: "use_effect", score: 30 },
      { label: "useRef", value: "use_ref", score: 40 },
    ],
  },
  {
    questionText:
      "How does the Node.js event loop handle asynchronous I/O operations without blocking the main execution thread?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "backend",
    order: 3,
    options: [
      {
        label:
          "It offloads system-level I/O to libuv thread pool and registers event callbacks on the poll phase",
        value: "libuv",
        score: 100,
      },
      {
        label:
          "It spawns a new OS child process for every incoming network socket",
        value: "processes",
        score: 20,
      },
      {
        label:
          "Node.js runs multi-threaded V8 isolates automatically for every HTTP request",
        value: "isolates",
        score: 30,
      },
      {
        label:
          "It uses hardware interrupts directly through the kernel without thread pools",
        value: "kernel",
        score: 10,
      },
    ],
  },
  {
    questionText:
      "Which HTTP header and status code sequence is essential to protect REST APIs against cross-origin data leakage?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "backend",
    order: 4,
    options: [
      {
        label:
          "Access-Control-Allow-Origin with explicit whitelist and OPTIONS preflight 204",
        value: "cors_whitelist",
        score: 100,
      },
      {
        label: "Access-Control-Allow-Origin: * on all mutation routes",
        value: "cors_wildcard",
        score: 20,
      },
      {
        label: "X-Forwarded-Host with 301 Permanent Redirect",
        value: "x_forwarded",
        score: 10,
      },
      {
        label: "Cache-Control: private, max-age=0",
        value: "cache_control",
        score: 30,
      },
    ],
  },
  {
    questionText:
      "In MongoDB, what index strategy is best suited for queries filtering by `tenantId` and sorting by `createdAt` descending?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "database",
    order: 5,
    options: [
      {
        label: "Compound index: { tenantId: 1, createdAt: -1 }",
        value: "compound_idx",
        score: 100,
      },
      {
        label:
          "Two independent single-field indexes: { tenantId: 1 } and { createdAt: -1 }",
        value: "single_idx",
        score: 40,
      },
      { label: "Text index across both fields", value: "text_idx", score: 10 },
      { label: "Hashed index on tenantId", value: "hash_idx", score: 30 },
    ],
  },
  {
    questionText:
      "Under what conditions is database denormalization preferable over relational normalization in a production service?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "database",
    order: 6,
    options: [
      {
        label:
          "Read-heavy access patterns where avoiding high-frequency multi-table joins justifies modest write overhead",
        value: "read_heavy",
        score: 100,
      },
      {
        label:
          "Write-heavy transactional workflows with strict ACID audit requirements",
        value: "acid",
        score: 10,
      },
      {
        label: "When storage space is extremely limited on cloud disks",
        value: "storage",
        score: 20,
      },
      {
        label: "Denormalization should never be used under any circumstances",
        value: "never",
        score: 0,
      },
    ],
  },
  {
    questionText:
      "How does the Circuit Breaker pattern prevent cascading failures across distributed microservices?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "system_design",
    order: 7,
    options: [
      {
        label:
          "It trips to an OPEN state after repeated downstream timeouts, fast-failing requests to protect caller capacity",
        value: "trip_open",
        score: 100,
      },
      {
        label:
          "It automatically increases retry attempts exponentially until the downstream service restarts",
        value: "infinite_retry",
        score: 10,
      },
      {
        label: "It drops network packets silently using iptables firewalls",
        value: "packet_drop",
        score: 0,
      },
      {
        label:
          "It converts all synchronous HTTP calls into synchronized database polling loops",
        value: "db_polling",
        score: 20,
      },
    ],
  },
  {
    questionText:
      "What is the primary reason to use an idempotency key on financial and mutation API requests?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "system_design",
    order: 8,
    options: [
      {
        label:
          "Prevents accidental duplicate processing when clients retry requests after network timeouts",
        value: "safe_retry",
        score: 100,
      },
      {
        label: "Encrypts the payload payload using symmetric AES-256 cipher",
        value: "encryption",
        score: 10,
      },
      {
        label: "Bypasses authentication token validation for faster throughput",
        value: "bypass_auth",
        score: 0,
      },
      {
        label: "Compacts JSON payload size using gzip compression algorithms",
        value: "gzip",
        score: 10,
      },
    ],
  },
  {
    questionText:
      "Which technique prevents CSS layout thrashing and cumulative layout shift (CLS) in modern web applications?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "frontend",
    order: 9,
    options: [
      {
        label:
          "Reserving explicit aspect-ratio or dimensions for media and using CSS containment",
        value: "aspect_ratio",
        score: 100,
      },
      {
        label: "Loading all fonts synchronously with render-blocking link tags",
        value: "blocking_fonts",
        score: 20,
      },
      {
        label: "Applying transition: all 0.5s to every element in the DOM tree",
        value: "all_transition",
        score: 0,
      },
      {
        label: "Rendering all images as base64 inline strings in HTML markup",
        value: "base64_img",
        score: 30,
      },
    ],
  },
  {
    questionText:
      "When implementing JWT authentication, where should refresh tokens be stored to mitigate Cross-Site Scripting (XSS) theft?",
    questionType: "MULTIPLE_CHOICE",
    dimension: "backend",
    order: 10,
    options: [
      {
        label:
          "HttpOnly, Secure, SameSite=Strict cookie inaccessible to client-side JavaScript",
        value: "http_only",
        score: 100,
      },
      {
        label: "localStorage with window.localStorage.setItem",
        value: "local_storage",
        score: 30,
      },
      {
        label: "sessionStorage attached to the current browser tab",
        value: "session_storage",
        score: 40,
      },
      {
        label: "URL query parameters on every API redirect",
        value: "url_param",
        score: 0,
      },
    ],
  },
];

// 20 Curriculum Modules with Valid DAG Prerequisites
const curriculumModulesData = [
  // 1
  {
    key: "mod_html_css",
    title: "Foundations of Web & Semantic HTML5",
    slug: "foundations-of-web-html5",
    description:
      "Structure web applications cleanly using semantic markup, accessibility fundamentals, and modern document architecture.",
    category: "FOUNDATIONS",
    difficulty: "BEGINNER",
    estimatedDuration: 6,
    skills: [{ name: "HTML", level: "BEGINNER" }],
    learningObjectives: [
      "Master semantic HTML5 tags",
      "Implement accessible ARIA landmarks",
      "Structure web forms with client-side validation",
    ],
    prerequisites: [],
    order: 1,
    isActive: true,
  },
  // 2
  {
    key: "mod_css_layout",
    title: "Modern Responsive CSS, Flexbox & CSS Grid",
    slug: "modern-responsive-css-flexbox-grid",
    description:
      "Build adaptive, fluid layouts using modern CSS Flexbox, Grid, container queries, and mobile-first design patterns.",
    category: "FRONTEND",
    difficulty: "BEGINNER",
    estimatedDuration: 8,
    skills: [{ name: "CSS", level: "BEGINNER" }],
    learningObjectives: [
      "Master 1D Flexbox and 2D Grid layouts",
      "Implement responsive breakpoints",
      "Utilize modern CSS variables and color palettes",
    ],
    prerequisites: ["mod_html_css"],
    order: 2,
    isActive: true,
  },
  // 3
  {
    key: "mod_js_fundamentals",
    title: "JavaScript Syntax, Data Structures & DOM Manipulation",
    slug: "javascript-syntax-data-structures-dom",
    description:
      "Core JavaScript mechanics: primitives, reference types, scope, closures, array methods, and programmatic DOM interaction.",
    category: "FRONTEND",
    difficulty: "BEGINNER",
    estimatedDuration: 12,
    skills: [{ name: "JavaScript", level: "BEGINNER" }],
    learningObjectives: [
      "Understand closures and lexical scope",
      "Manipulate the browser DOM dynamically",
      "Process collections with map, filter, and reduce",
    ],
    prerequisites: ["mod_html_css"],
    order: 3,
    isActive: true,
  },
  // 4
  {
    key: "mod_js_async",
    title: "Asynchronous JavaScript: Promises, Async/Await & Event Loop",
    slug: "asynchronous-javascript-promises-event-loop",
    description:
      "Master non-blocking concurrency in JavaScript: macro/microtask queues, Promises, async/await, and error handling patterns.",
    category: "FRONTEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 10,
    skills: [{ name: "JavaScript", level: "INTERMEDIATE" }],
    learningObjectives: [
      "Trace the V8 event loop phases",
      "Handle concurrent operations with Promise.allSettled",
      "Manage async error propagation",
    ],
    prerequisites: ["mod_js_fundamentals"],
    order: 4,
    isActive: true,
  },
  // 5
  {
    key: "mod_git_vcs",
    title: "Git Version Control & Collaborative Engineering Workflows",
    slug: "git-version-control-collaborative-workflows",
    description:
      "Distributed version control using Git: branch management, interactive rebasing, merge conflict resolution, and PR workflows.",
    category: "FOUNDATIONS",
    difficulty: "BEGINNER",
    estimatedDuration: 5,
    skills: [{ name: "Git", level: "BEGINNER" }],
    learningObjectives: [
      "Create feature branch lifecycles",
      "Resolve merge conflicts cleanly",
      "Perform interactive git rebase for clean history",
    ],
    prerequisites: [],
    order: 5,
    isActive: true,
  },
  // 6
  {
    key: "mod_react_arch",
    title: "React Component Architecture & Lifecycle Hooks",
    slug: "react-component-architecture-hooks",
    description:
      "Component composition, unidirectional data flow, reconciliation, and hooks (useState, useEffect, useMemo, useCallback).",
    category: "FRONTEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 14,
    skills: [{ name: "React", level: "INTERMEDIATE" }],
    learningObjectives: [
      "Design reusable declarative components",
      "Optimize render cycles with memoization",
      "Manage side effects safely in useEffect",
    ],
    prerequisites: ["mod_js_async"],
    order: 6,
    isActive: true,
  },
  // 7
  {
    key: "mod_react_state",
    title: "Client State Management: Context API & Redux Toolkit",
    slug: "client-state-management-context-redux-toolkit",
    description:
      "Scale stateful web applications with predictable global state containers, context slicing, and async thunks.",
    category: "FRONTEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 10,
    skills: [{ name: "React", level: "ADVANCED" }],
    learningObjectives: [
      "Architect clean global state slices",
      "Implement async thunks with Redux Toolkit",
      "Prevent unnecessary subtree re-renders",
    ],
    prerequisites: ["mod_react_arch"],
    order: 7,
    isActive: true,
  },
  // 8
  {
    key: "mod_nextjs",
    title: "Fullstack Web Development with Next.js App Router",
    slug: "fullstack-web-development-nextjs-app-router",
    description:
      "Server-side rendering (SSR), static site generation (SSG), React Server Components, and Next.js route handlers.",
    category: "FRONTEND",
    difficulty: "ADVANCED",
    estimatedDuration: 16,
    skills: [
      { name: "Next.js", level: "INTERMEDIATE" },
      { name: "React", level: "ADVANCED" },
    ],
    learningObjectives: [
      "Leverage React Server Components",
      "Implement streaming layouts and suspense boundaries",
      "Author performant Next.js API routes",
    ],
    prerequisites: ["mod_react_state"],
    order: 8,
    isActive: true,
  },
  // 9
  {
    key: "mod_nodejs_core",
    title: "Node.js Runtime Architecture & Core Modules",
    slug: "nodejs-runtime-architecture-core-modules",
    description:
      "Event-driven runtime mechanics: Buffer, Stream pipelines, File System API, EventEmitter, and process execution.",
    category: "BACKEND",
    difficulty: "BEGINNER",
    estimatedDuration: 8,
    skills: [{ name: "Node.js", level: "BEGINNER" }],
    learningObjectives: [
      "Work with Node.js binary Buffers and Streams",
      "Handle system events with EventEmitter",
      "Understand CommonJS vs ES Modules",
    ],
    prerequisites: ["mod_js_fundamentals"],
    order: 9,
    isActive: true,
  },
  // 10
  {
    key: "mod_express_apis",
    title: "RESTful API Architecture & Express Middleware Pipelines",
    slug: "restful-api-architecture-express-middleware",
    description:
      "Build robust backend HTTP services: routing, parameterized handlers, request validation, error handling, and middleware.",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 12,
    skills: [
      { name: "Node.js", level: "INTERMEDIATE" },
      { name: "Express", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Design idempotent REST API resources",
      "Construct composable middleware pipelines",
      "Handle centralized errors cleanly",
    ],
    prerequisites: ["mod_nodejs_core"],
    order: 10,
    isActive: true,
  },
  // 11
  {
    key: "mod_sql_db",
    title: "Relational Database Modeling & SQL Essentials",
    slug: "relational-database-modeling-sql-essentials",
    description:
      "Relational schema design: primary/foreign keys, joins, indexes, aggregate queries, ACID transactions, and normalization.",
    category: "DATABASE",
    difficulty: "BEGINNER",
    estimatedDuration: 10,
    skills: [{ name: "SQL", level: "BEGINNER" }],
    learningObjectives: [
      "Normalize schemas to Third Normal Form (3NF)",
      "Write complex multi-table INNER/LEFT JOINs",
      "Apply ACID transaction constraints",
    ],
    prerequisites: [],
    order: 11,
    isActive: true,
  },
  // 12
  {
    key: "mod_mongodb_mongoose",
    title: "NoSQL Database Design with MongoDB & Mongoose ODM",
    slug: "nosql-database-design-mongodb-mongoose",
    description:
      "Document data modeling: embedding vs referencing, compound indexes, aggregation pipelines, and validation hooks.",
    category: "DATABASE",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 10,
    skills: [
      { name: "MongoDB", level: "INTERMEDIATE" },
      { name: "Mongoose", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Design schema relationships in document stores",
      "Optimize query performance with compound indexes",
      "Build multi-stage aggregation pipelines",
    ],
    prerequisites: ["mod_express_apis"],
    order: 12,
    isActive: true,
  },
  // 13
  {
    key: "mod_auth_security",
    title: "Authentication, JWT Tokens & Web Application Security",
    slug: "authentication-jwt-tokens-web-security",
    description:
      "Implement secure authentication: bcrypt password hashing, stateless JWT signing, refresh token rotation, RBAC, and OWASP Top 10.",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 12,
    skills: [
      { name: "Security", level: "INTERMEDIATE" },
      { name: "JWT", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Implement password salting and hashing with bcrypt",
      "Architect dual-token JWT access & refresh lifecycles",
      "Enforce strict Role-Based Access Control",
    ],
    prerequisites: ["mod_express_apis"],
    order: 13,
    isActive: true,
  },
  // 14
  {
    key: "mod_microservices",
    title: "Microservices Architecture & Event-Driven Systems",
    slug: "microservices-architecture-event-driven-systems",
    description:
      "Decompose monoliths: domain-driven design, service discovery, API gateways, message queues, and eventual consistency.",
    category: "SYSTEM_DESIGN",
    difficulty: "ADVANCED",
    estimatedDuration: 16,
    skills: [{ name: "System Design", level: "ADVANCED" }],
    learningObjectives: [
      "Apply Domain-Driven Design boundaries",
      "Design asynchronous message queues",
      "Implement circuit breakers and fallback patterns",
    ],
    prerequisites: ["mod_express_apis", "mod_auth_security"],
    order: 14,
    isActive: true,
  },
  // 15
  {
    key: "mod_python_core",
    title: "Python Programming Fundamentals & Data Structures",
    slug: "python-programming-fundamentals-data-structures",
    description:
      "Python language mastery: comprehension syntax, generators, OOP classes, typing, decorators, and package management.",
    category: "AI_DATA_SCIENCE",
    difficulty: "BEGINNER",
    estimatedDuration: 8,
    skills: [{ name: "Python", level: "BEGINNER" }],
    learningObjectives: [
      "Write idiomatic Pythonic scripts",
      "Utilize lists, dicts, sets, and generators effectively",
      "Author modular classes with type hints",
    ],
    prerequisites: [],
    order: 15,
    isActive: true,
  },
  // 16
  {
    key: "mod_data_analytics",
    title: "Data Manipulation, Analysis & Visualization with Pandas/NumPy",
    slug: "data-manipulation-analysis-pandas-numpy",
    description:
      "Scientific Python ecosystem: vector operations with NumPy arrays, DataFrame filtering, grouping, and statistical transforms in Pandas.",
    category: "AI_DATA_SCIENCE",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 12,
    skills: [
      { name: "Python", level: "INTERMEDIATE" },
      { name: "Data Analysis", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Perform fast vectorized calculations in NumPy",
      "Clean, transform, and aggregate data with Pandas",
      "Generate visual statistical charts",
    ],
    prerequisites: ["mod_python_core"],
    order: 16,
    isActive: true,
  },
  // 17
  {
    key: "mod_ml_fundamentals",
    title: "Applied Machine Learning & Predictive Modeling",
    slug: "applied-machine-learning-predictive-modeling",
    description:
      "Supervised and unsupervised learning: classification, regression, clustering, feature engineering, and scikit-learn pipelines.",
    category: "AI_DATA_SCIENCE",
    difficulty: "ADVANCED",
    estimatedDuration: 16,
    skills: [{ name: "Machine Learning", level: "INTERMEDIATE" }],
    learningObjectives: [
      "Perform feature scaling and cross-validation",
      "Train classification and regression models",
      "Evaluate models using ROC-AUC, precision, and recall",
    ],
    prerequisites: ["mod_data_analytics"],
    order: 17,
    isActive: true,
  },
  // 18
  {
    key: "mod_docker",
    title: "Docker Containerization & Multi-Container Orchestration",
    slug: "docker-containerization-orchestration",
    description:
      "Package applications reliably: Dockerfiles, multi-stage builds, layer caching, volume mounts, and Docker Compose networking.",
    category: "DEVOPS",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 10,
    skills: [{ name: "Docker", level: "INTERMEDIATE" }],
    learningObjectives: [
      "Author lightweight multi-stage Dockerfiles",
      "Orchestrate fullstack apps with docker-compose",
      "Manage persistent container volumes and networks",
    ],
    prerequisites: ["mod_express_apis"],
    order: 18,
    isActive: true,
  },
  // 19
  {
    key: "mod_cicd",
    title: "Continuous Integration & Automated Testing with GitHub Actions",
    slug: "continuous-integration-automated-testing-github-actions",
    description:
      "Automate delivery pipelines: GitHub Actions workflows, test execution on pull requests, matrix builds, and artifact caching.",
    category: "DEVOPS",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 8,
    skills: [
      { name: "DevOps", level: "INTERMEDIATE" },
      { name: "CI/CD", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Author YAML CI/CD workflow pipelines",
      "Run automated test matrices across Node versions",
      "Deploy verified builds automatically",
    ],
    prerequisites: ["mod_git_vcs", "mod_docker"],
    order: 19,
    isActive: true,
  },
  // 20
  {
    key: "mod_cloud_deploy",
    title: "Cloud Infrastructure Deployment & Production Observability",
    slug: "cloud-infrastructure-deployment-observability",
    description:
      "Production cloud operations: managed container deployments, environment variable management, logging, health probes, and SSL.",
    category: "CLOUD",
    difficulty: "ADVANCED",
    estimatedDuration: 12,
    skills: [
      { name: "Cloud", level: "ADVANCED" },
      { name: "DevOps", level: "ADVANCED" },
    ],
    learningObjectives: [
      "Deploy containerized apps to cloud providers",
      "Configure health checks and automatic restarts",
      "Monitor application performance and structured logs",
    ],
    prerequisites: ["mod_docker"],
    order: 20,
    isActive: true,
  },
];

module.exports = {
  SEED_PASSWORDS,
  usersData,
  assessmentsData,
  questionsAssessment1,
  questionsAssessment2,
  curriculumModulesData,
};
