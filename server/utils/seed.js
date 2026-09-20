const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const config = require("../config");
const {
  User,
  Assessment,
  Question,
  AssessmentAttempt,
  LearnerProfile,
  CurriculumModule,
  LearningPath,
  Progress,
} = require("../models");

const seedDatabase = async ({ disconnectOnComplete = false } = {}) => {
  if (config.isProduction && !process.argv.includes('--force')) {
    console.error('CRITICAL: Attempted to run seed script in PRODUCTION environment without --force flag. Aborting.');
    process.exit(1);
  }

  if (mongoose.connection.readyState !== 1) {
    console.log(`[Seed] Connecting to database at ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected successfully.');
  }

  console.log("[Seed] Cleaning existing development collections...");
  await Promise.all([
    User.deleteMany({}),
    Assessment.deleteMany({}),
    Question.deleteMany({}),
    AssessmentAttempt.deleteMany({}),
    LearnerProfile.deleteMany({}),
    CurriculumModule.deleteMany({}),
    LearningPath.deleteMany({}),
    Progress.deleteMany({}),
  ]);
  console.log("[Seed] Collections cleared.");

  // ==========================================
  // 1. CREATE USERS
  // ==========================================
  console.log("[Seed] Creating users...");
  const admin = await User.create({
    firstName: "Admin",
    lastName: "Coordinator",
    email: "admin@psychepath.io",
    password: "AdminPassword2026!",
    role: "ADMIN",
    isActive: true,
  });

  const studentAlex = await User.create({
    firstName: "Alex",
    lastName: "Chen",
    email: "alex.chen@example.com",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  const studentSarah = await User.create({
    firstName: "Sarah",
    lastName: "Kim",
    email: "sarah.kim@example.com",
    password: "StudentPassword2026!",
    role: "STUDENT",
    isActive: true,
  });

  console.log(
    `[Seed] Created 3 users: 1 Admin (${admin.email}), 2 Students (${studentAlex.email}, ${studentSarah.email})`,
  );

  // ==========================================
  // 2. CREATE CURRICULUM MODULES
  // ==========================================
  console.log("[Seed] Creating curriculum modules...");
  const module1 = await CurriculumModule.create({
    title: "Web Fundamentals: HTML, Modern CSS & DOM Architecture",
    description:
      "Core concepts of semantic HTML5, modern layout techniques (Flexbox, Grid), and document object model manipulation.",
    category: "Frontend",
    difficulty: "BEGINNER",
    estimatedDuration: 15,
    order: 1,
    skills: [
      { name: "HTML5 Semantic Markup", level: "BEGINNER" },
      { name: "CSS Flexbox and Grid", level: "BEGINNER" },
    ],
    learningObjectives: [
      "Structure accessible web pages using semantic HTML elements",
      "Build responsive multi-device layouts using CSS Grid and Flexbox",
      "Understand CSS cascade, specificity, and layout rendering lifecycle",
    ],
    resources: [
      {
        title: "MDN Web Docs: HTML5",
        type: "DOCUMENTATION",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
      },
      {
        title: "CSS Tricks: Complete Guide to Flexbox",
        type: "ARTICLE",
        url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
      },
    ],
    createdBy: admin._id,
  });

  const module2 = await CurriculumModule.create({
    title:
      "Modern JavaScript: ES6+, Asynchronous Programming & Functional Patterns",
    description:
      "Deep dive into asynchronous JavaScript (Promises, async/await), closures, scope chain, event loops, and modern ES features.",
    category: "Core Programming",
    difficulty: "BEGINNER",
    estimatedDuration: 25,
    order: 2,
    prerequisites: [module1._id],
    skills: [
      { name: "Modern JavaScript (ES6+)", level: "INTERMEDIATE" },
      { name: "Asynchronous Programming", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Master Promises, async/await, and error handling patterns",
      "Understand closures, prototype inheritance, and lexical scoping",
      "Manipulate immutable collections using map, filter, reduce",
    ],
    resources: [
      {
        title: "JavaScript.info: The Modern JavaScript Tutorial",
        type: "COURSE",
        url: "https://javascript.info",
      },
      {
        title: "MDN: Asynchronous JavaScript",
        type: "DOCUMENTATION",
        url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous",
      },
    ],
    createdBy: admin._id,
  });

  const module3 = await CurriculumModule.create({
    title: "Node.js Core Architecture: Event Loop, Streams & Buffers",
    description:
      "Understanding the Node.js V8 runtime, non-blocking I/O, Libuv thread pool, file system operations, and EventEmitter patterns.",
    category: "Backend",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 20,
    order: 3,
    prerequisites: [module2._id],
    skills: [
      { name: "Node.js Architecture", level: "INTERMEDIATE" },
      { name: "Streams and Buffer Management", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Explain the Node.js event loop phases and concurrency model",
      "Process high-throughput I/O streams safely with backpressure",
      "Modularize server-side code using CommonJS and ES Modules",
    ],
    resources: [
      {
        title: "Node.js Official Documentation: Event Loop",
        type: "DOCUMENTATION",
        url: "https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick",
      },
    ],
    createdBy: admin._id,
  });

  const module4 = await CurriculumModule.create({
    title: "Express.js Framework: Layered Architecture & Middleware Pipelines",
    description:
      "Building robust, decoupled RESTful APIs using Express, structured middleware, routing routers, and centralized error handling.",
    category: "Backend",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 20,
    order: 4,
    prerequisites: [module3._id],
    skills: [
      { name: "Express.js", level: "INTERMEDIATE" },
      { name: "RESTful API Design", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Implement clean layered architecture (Routes -> Controllers -> Services)",
      "Construct reusable middleware for validation, authentication, and logging",
      "Implement standard HTTP status codes and centralized error dispatchers",
    ],
    resources: [
      {
        title: "Express.js Guide: Writing Middleware",
        type: "DOCUMENTATION",
        url: "https://expressjs.com/en/guide/writing-middleware.html",
      },
    ],
    createdBy: admin._id,
  });

  const module5 = await CurriculumModule.create({
    title: "Database Engineering with MongoDB & Mongoose ODM",
    description:
      "Schema modeling, relationship strategies (embedding vs referencing), indexing optimization, and transaction handling.",
    category: "Database",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 22,
    order: 5,
    prerequisites: [module4._id],
    skills: [
      { name: "MongoDB Schema Design", level: "INTERMEDIATE" },
      { name: "Mongoose ODM", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Design normalized and denormalized document models effectively",
      "Establish compound and unique indexes to optimize query execution plans",
      "Write safe data mutations using Mongoose validation constraints",
    ],
    resources: [
      {
        title: "MongoDB University: Data Modeling",
        type: "COURSE",
        url: "https://learn.mongodb.com",
      },
      {
        title: "Mongoose Documentation",
        type: "DOCUMENTATION",
        url: "https://mongoosejs.com/docs/",
      },
    ],
    createdBy: admin._id,
  });

  const module6 = await CurriculumModule.create({
    title: "RESTful API Security, Token-Based Auth & RBAC",
    description:
      "Securing web applications with JSON Web Tokens (JWT), password hashing with bcrypt, role-based authorization, and CORS hardening.",
    category: "Security",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 18,
    order: 6,
    prerequisites: [module4._id, module5._id],
    skills: [
      { name: "JWT Authentication", level: "INTERMEDIATE" },
      { name: "Role-Based Access Control", level: "INTERMEDIATE" },
      { name: "Web Security Practices", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Implement secure stateless authentication using signed JWT tokens",
      "Hash and salt user passwords defensively using bcrypt",
      "Protect administrative endpoints with role-verification guards",
    ],
    resources: [
      {
        title: "OWASP REST Security Cheat Sheet",
        type: "DOCUMENTATION",
        url: "https://cheatsheetseries.owasp.org/",
      },
    ],
    createdBy: admin._id,
  });

  const module7 = await CurriculumModule.create({
    title: "React Fundamentals: Component Lifecycle, Hooks & State Systems",
    description:
      "Modern component-driven development with React 18, custom hooks, effect dependencies, and state management.",
    category: "Frontend",
    difficulty: "INTERMEDIATE",
    estimatedDuration: 28,
    order: 7,
    prerequisites: [module2._id],
    skills: [
      { name: "React Components & Props", level: "INTERMEDIATE" },
      { name: "React Hooks & State Management", level: "INTERMEDIATE" },
    ],
    learningObjectives: [
      "Construct declarative UI hierarchies with function components",
      "Manage complex local and shared state with useState, useReducer, and useContext",
      "Write custom hooks to extract reusable stateful business logic",
    ],
    resources: [
      {
        title: "React Documentation: Learn React",
        type: "DOCUMENTATION",
        url: "https://react.dev/learn",
      },
    ],
    createdBy: admin._id,
  });

  const module8 = await CurriculumModule.create({
    title: "Full-Stack Application Development with Next.js App Router",
    description:
      "Building server-rendered and statically generated web applications with Next.js, Server Components, client components, and API routes.",
    category: "Full-Stack",
    difficulty: "ADVANCED",
    estimatedDuration: 35,
    order: 8,
    prerequisites: [module6._id, module7._id],
    skills: [
      { name: "Next.js App Router", level: "ADVANCED" },
      { name: "Full-Stack Integration", level: "ADVANCED" },
    ],
    learningObjectives: [
      "Leverage React Server Components (RSC) and Client Components strategically",
      "Integrate frontend user experiences with Express REST APIs seamlessly",
      "Optimize Web Vitals, metadata, and production builds",
    ],
    resources: [
      {
        title: "Next.js Documentation",
        type: "DOCUMENTATION",
        url: "https://nextjs.org/docs",
      },
    ],
    createdBy: admin._id,
  });

  const module9 = await CurriculumModule.create({
    title: "System Design, Micro-Patterns & Clean Architectural Principles",
    description:
      "Enterprise architecture patterns: separation of concerns, dependency inversion, resilient background processing, and scalable schema designs.",
    category: "System Architecture",
    difficulty: "ADVANCED",
    estimatedDuration: 30,
    order: 9,
    prerequisites: [module6._id],
    skills: [
      { name: "Clean Architecture", level: "ADVANCED" },
      { name: "System Design Fundamentals", level: "ADVANCED" },
    ],
    learningObjectives: [
      "Design modular software that decouples core business logic from frameworks",
      "Apply SOLID design principles in JavaScript and Node.js environments",
      "Architect robust caching, rate limiting, and failure containment strategies",
    ],
    resources: [
      {
        title: "System Design Primer",
        type: "ARTICLE",
        url: "https://github.com/donnemartin/system-design-primer",
      },
    ],
    createdBy: admin._id,
  });

  const module10 = await CurriculumModule.create({
    title: "AI-Enhanced Engineering: Orchestrating LLMs & Gemini API",
    description:
      "Safely integrating generative AI into production web applications, structured prompt engineering, output schema validation, and guardrails.",
    category: "Artificial Intelligence",
    difficulty: "ADVANCED",
    estimatedDuration: 25,
    order: 10,
    prerequisites: [module8._id],
    skills: [
      { name: "Google Gemini API Integration", level: "ADVANCED" },
      { name: "Structured Prompt Engineering", level: "ADVANCED" },
    ],
    learningObjectives: [
      "Call Google Gemini API securely through backend proxies without leaking keys",
      "Enforce strict JSON schema guarantees on generative responses",
      "Construct hybrid recommendation pipelines combining rule engines with AI suggestions",
    ],
    resources: [
      {
        title: "Google AI Studio: Gemini API Docs",
        type: "DOCUMENTATION",
        url: "https://ai.google.dev/docs",
      },
    ],
    createdBy: admin._id,
  });

  console.log(
    `[Seed] Created 10 realistic curriculum modules spanning Beginner to Advanced.`,
  );

  // ==========================================
  // 3. CREATE PSYCHOMETRIC ASSESSMENT
  // ==========================================
  console.log("[Seed] Creating psychometric assessment...");
  const assessment = await Assessment.create({
    title: "Cognitive & Psychometric Learning Style Assessment",
    description:
      "A comprehensive psychometric assessment evaluating learner analytical depth, creative exploratory drive, collaboration traits, technical communication, and self-directed study management.",
    type: "LEARNING_STYLE",
    instructions:
      "Read each statement carefully and select the option that best reflects your natural learning habits, problem-solving methods, and technical study preferences.",
    estimatedDuration: 15,
    questionCount: 12,
    dimensions: [
      {
        key: "analyticalthinking",
        name: "Analytical Thinking",
        description:
          "Preference for systematic problem decomposition, algorithmic structure, and deductive reasoning.",
      },
      {
        key: "creativity",
        name: "Creative Problem Solving",
        description:
          "Tendency toward exploratory learning, novel solution discovery, and visual design experimentation.",
      },
      {
        key: "collaboration",
        name: "Collaborative Aptitude",
        description:
          "Propensity for peer programming, team knowledge exchange, and communal code reviews.",
      },
      {
        key: "communication",
        name: "Technical Communication",
        description:
          "Ability and desire to articulate technical rationale, write clear documentation, and explain concepts.",
      },
      {
        key: "selfmanagement",
        name: "Self-Management & Grit",
        description:
          "Discipline in autonomous scheduling, sustained focus, and iterative troubleshooting under uncertainty.",
      },
    ],
    scoringConfig: {
      minScore: 0,
      maxScore: 100,
      dimensionRules: {
        scalingFactor: 20, // 5-point Likert multiplied to 100 scale
      },
    },
    isActive: true,
    createdBy: admin._id,
  });

  // Standard Likert options helper
  const createLikertOptions = (dimensionKey) => [
    {
      label: "Strongly Disagree",
      value: "strongly_disagree",
      score: 1,
      dimensionScores: { [dimensionKey]: 1 },
    },
    {
      label: "Disagree",
      value: "disagree",
      score: 2,
      dimensionScores: { [dimensionKey]: 2 },
    },
    {
      label: "Neutral / Undecided",
      value: "neutral",
      score: 3,
      dimensionScores: { [dimensionKey]: 3 },
    },
    {
      label: "Agree",
      value: "agree",
      score: 4,
      dimensionScores: { [dimensionKey]: 4 },
    },
    {
      label: "Strongly Agree",
      value: "strongly_agree",
      score: 5,
      dimensionScores: { [dimensionKey]: 5 },
    },
  ];

  // 12 Questions covering the dimensions
  const questionsData = [
    {
      assessment: assessment._id,
      dimension: "analyticalthinking",
      order: 1,
      questionText:
        "When learning a new technology or algorithm, I prefer breaking it down into formal diagrams or mathematical flowcharts before writing any code.",
      options: createLikertOptions("analyticalthinking"),
    },
    {
      assessment: assessment._id,
      dimension: "analyticalthinking",
      order: 2,
      questionText:
        "I prioritize understanding the internal mechanism (e.g., event loop mechanics, memory models) over quickly assembling a working prototype.",
      options: createLikertOptions("analyticalthinking"),
    },
    {
      assessment: assessment._id,
      dimension: "analyticalthinking",
      order: 3,
      questionText:
        "When encountering unexpected bugs, I systematically isolate variables using logs and unit tests rather than making intuitive code adjustments.",
      options: createLikertOptions("analyticalthinking"),
    },
    {
      assessment: assessment._id,
      dimension: "creativity",
      order: 4,
      questionText:
        "I learn best when given an open-ended project prompt where I can design my own architecture rather than following step-by-step tutorials.",
      options: createLikertOptions("creativity"),
    },
    {
      assessment: assessment._id,
      dimension: "creativity",
      order: 5,
      questionText:
        "I often explore unorthodox programming paradigms or experimental libraries to solve common design challenges.",
      options: createLikertOptions("creativity"),
    },
    {
      assessment: assessment._id,
      dimension: "collaboration",
      order: 6,
      questionText:
        "Pair programming and interactive code review discussions accelerate my comprehension more than solitary studying.",
      options: createLikertOptions("collaboration"),
    },
    {
      assessment: assessment._id,
      dimension: "collaboration",
      order: 7,
      questionText:
        "I actively seek feedback from peers early during project development to validate architectural decisions.",
      options: createLikertOptions("collaboration"),
    },
    {
      assessment: assessment._id,
      dimension: "communication",
      order: 8,
      questionText:
        "Writing clear documentation, architectural READMEs, and technical blog posts solidifies my understanding of complex topics.",
      options: createLikertOptions("communication"),
    },
    {
      assessment: assessment._id,
      dimension: "communication",
      order: 9,
      questionText:
        "I am comfortable explaining intricate technical concepts to colleagues with diverse engineering or non-technical backgrounds.",
      options: createLikertOptions("communication"),
    },
    {
      assessment: assessment._id,
      dimension: "selfmanagement",
      order: 10,
      questionText:
        "I maintain a structured weekly study timetable and consistently complete learning targets without external deadlines.",
      options: createLikertOptions("selfmanagement"),
    },
    {
      assessment: assessment._id,
      dimension: "selfmanagement",
      order: 11,
      questionText:
        "When confronted with difficult technical hurdles, I persist through documentation and debugging without becoming discouraged.",
      options: createLikertOptions("selfmanagement"),
    },
    {
      assessment: assessment._id,
      dimension: "selfmanagement",
      order: 12,
      questionText:
        "I regularly evaluate my technical weaknesses and adjust my study curriculum to target improvement areas.",
      options: createLikertOptions("selfmanagement"),
    },
  ];

  await Question.insertMany(questionsData);
  console.log(
    `[Seed] Created assessment with ${questionsData.length} structured psychometric questions.`,
  );

  // ==========================================
  // 4. CREATE LEARNER PROFILES
  // ==========================================
  console.log("[Seed] Creating learner profiles...");
  const alexProfile = await LearnerProfile.create({
    user: studentAlex._id,
    educationLevel: "UNDERGRADUATE",
    experienceLevel: "INTERMEDIATE",
    weeklyLearningHours: 12,
    currentSkills: [
      { name: "JavaScript", level: "INTERMEDIATE" },
      { name: "HTML & CSS", level: "ADVANCED" },
      { name: "React", level: "INTERMEDIATE" },
    ],
    learningGoals: [
      { name: "Full-Stack Backend Mastery", priority: 1 },
      { name: "System Design & Scalability", priority: 2 },
    ],
    interests: ["Backend Systems", "Distributed Databases", "AI Engineering"],
    learningPreferences: {
      preferredFormat: "PROJECT",
      preferredDifficulty: "INTERMEDIATE",
      preferredSessionDuration: 60,
    },
    assessmentDimensions: {
      analyticalthinking: 85,
      creativity: 68,
      collaboration: 72,
      communication: 65,
      selfmanagement: 88,
    },
    strengths: ["Algorithmic Decomposition", "Disciplined Autonomous Study"],
    improvementAreas: [
      "Cloud Infrastructure Deployment",
      "High-Level System Design",
    ],
  });

  const sarahProfile = await LearnerProfile.create({
    user: studentSarah._id,
    educationLevel: "BOOTCAMP",
    experienceLevel: "BEGINNER",
    weeklyLearningHours: 15,
    currentSkills: [
      { name: "HTML & CSS", level: "INTERMEDIATE" },
      { name: "Basic JavaScript", level: "BEGINNER" },
    ],
    learningGoals: [
      { name: "Full-Stack Web Development", priority: 1 },
      { name: "Modern Frameworks (Next.js)", priority: 2 },
    ],
    interests: ["Frontend Engineering", "UX Design", "API Integration"],
    learningPreferences: {
      preferredFormat: "PRACTICE",
      preferredDifficulty: "BEGINNER",
      preferredSessionDuration: 45,
    },
    assessmentDimensions: {
      analyticalthinking: 65,
      creativity: 86,
      collaboration: 82,
      communication: 78,
      selfmanagement: 70,
    },
    strengths: ["Visual Prototyping", "Collaborative Team Dynamics"],
    improvementAreas: [
      "Asynchronous Programming Mechanics",
      "Database Indexing",
    ],
  });

  console.log(`[Seed] Created learner profiles for Alex Chen and Sarah Kim.`);

  // ==========================================
  // 5. CREATE SAMPLE ATTEMPT & LEARNING PATH
  // ==========================================
  console.log(
    "[Seed] Creating sample assessment attempt and personalized learning path for Alex...",
  );
  const attempt = await AssessmentAttempt.create({
    user: studentAlex._id,
    assessment: assessment._id,
    status: "COMPLETED",
    startedAt: new Date(Date.now() - 3600000 * 2),
    submittedAt: new Date(Date.now() - 3600000 * 1),
    scores: {
      analyticalthinking: 85,
      creativity: 68,
      collaboration: 72,
      communication: 65,
      selfmanagement: 88,
    },
    resultSummary:
      "Strong analytical reasoning and self-management. Recommended for structured backend and architectural curriculum.",
    answers: questionsData.map((q) => ({
      question: q._id || new mongoose.Types.ObjectId(),
      selectedOption: "agree",
      selectedValue: "agree",
      answeredAt: new Date(),
    })),
  });

  // Link attempt to Alex's profile
  alexProfile.lastAssessmentAttempt = attempt._id;
  await alexProfile.save();

  // Create personalized learning path for Alex
  const learningPath = await LearningPath.create({
    user: studentAlex._id,
    sourceAssessment: assessment._id,
    goals: ["Full-Stack Backend Mastery", "System Design & Scalability"],
    summary:
      "Tailored backend curriculum emphasizing structured system architecture, robust RESTful APIs, database engineering, and AI tool integration.",
    focusAreas: [
      "Node.js Event Loop",
      "Layered Express Architecture",
      "MongoDB Indexing",
      "Gemini AI API",
    ],
    learningStrategy:
      "Project-first progressive difficulty with emphasis on architectural decomposition.",
    estimatedDuration: 125, // Total hours across selected modules
    status: "ACTIVE",
    generatedBy: "HYBRID",
    version: 1,
    modules: [
      {
        module: module3._id,
        order: 1,
        reason: "Foundational runtime comprehension for backend specialization",
        priority: 1,
        status: "COMPLETED",
      },
      {
        module: module4._id,
        order: 2,
        reason: "Industry-standard RESTful routing and layered controllers",
        priority: 1,
        status: "IN_PROGRESS",
      },
      {
        module: module5._id,
        order: 3,
        reason: "Essential persistence layer engineering and schema modeling",
        priority: 1,
        status: "NOT_STARTED",
      },
      {
        module: module6._id,
        order: 4,
        reason: "Securing API endpoints with JWT and defensive authentication",
        priority: 2,
        status: "NOT_STARTED",
      },
      {
        module: module8._id,
        order: 5,
        reason: "Full-stack client-server integration with modern Next.js",
        priority: 2,
        status: "NOT_STARTED",
      },
      {
        module: module10._id,
        order: 6,
        reason: "Advanced portfolio capstone: AI-driven learning systems",
        priority: 3,
        status: "NOT_STARTED",
      },
    ],
  });

  // Progress records for Alex
  await Progress.create({
    user: studentAlex._id,
    learningPath: learningPath._id,
    module: module3._id,
    status: "COMPLETED",
    percentage: 100,
    startedAt: new Date(Date.now() - 86400000 * 5),
    completedAt: new Date(Date.now() - 86400000 * 1),
  });

  await Progress.create({
    user: studentAlex._id,
    learningPath: learningPath._id,
    module: module4._id,
    status: "IN_PROGRESS",
    percentage: 45,
    startedAt: new Date(Date.now() - 86400000 * 1),
  });

  console.log(
    "[Seed] Sample assessment attempt, personalized learning path, and progress records created.",
  );
  console.log("[Seed] Database seeding completed successfully!");

  if (disconnectOnComplete) {
    await mongoose.disconnect();
    console.log('[Seed] Database disconnected.');
  }
};

// Execute if invoked directly from CLI
if (require.main === module) {
  seedDatabase({ disconnectOnComplete: true })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed Error] Database seeding failed:", err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
