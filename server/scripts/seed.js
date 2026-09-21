/**
 * PsychePath - Database Seeder Script
 *
 * Usage:
 *   npm run seed        # Safe, idempotent upsert seeding
 *   npm run seed:reset  # Development/Test reset & fresh seed (forbidden in production)
 */

const mongoose = require("mongoose");
const config = require("../config");
const {
  User,
  LearnerProfile,
  Assessment,
  Question,
  CurriculumModule,
  AssessmentAttempt,
  LearningPath,
  Progress,
  ProgressHistory,
} = require("../models");
const {
  SEED_PASSWORDS,
  usersData,
  assessmentsData,
  questionsAssessment1,
  questionsAssessment2,
  curriculumModulesData,
} = require("./seedData");

const isResetMode = process.argv.includes("--reset");

const runSeed = async () => {
  console.log("=================================================");
  console.log(
    `🌱 PsychePath Database Seeder [Mode: ${isResetMode ? "RESET & SEED" : "IDEMPOTENT UPSERT"}]`,
  );
  console.log("=================================================");

  // 1. Safety Guard for Reset Mode
  if (isResetMode) {
    if (config.isProduction) {
      console.error(
        "❌ [FATAL] seed:reset cannot be executed in production environment.",
      );
      process.exit(1);
    }
  }

  // 2. Connect to MongoDB
  console.log(`📡 Connecting to MongoDB at ${config.mongoUri}...`);
  await mongoose.connect(config.mongoUri);
  console.log("✅ Connected to MongoDB successfully.\n");

  try {
    // 3. Optional Collection Reset
    if (isResetMode) {
      console.log(
        "🧹 Dropping and cleaning existing development collections...",
      );
      await Promise.all([
        User.deleteMany({}),
        LearnerProfile.deleteMany({}),
        Assessment.deleteMany({}),
        Question.deleteMany({}),
        CurriculumModule.deleteMany({}),
        AssessmentAttempt.deleteMany({}),
        LearningPath.deleteMany({}),
        Progress.deleteMany({}),
        ProgressHistory.deleteMany({}),
      ]);
      console.log("✅ Collections cleaned.\n");
    }

    // 4. Seed Users
    console.log("👤 Seeding User Accounts...");
    const userMap = new Map();
    for (const u of usersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = new User(u);
        await user.save();
        console.log(`  + Created user: ${u.email} (${u.role})`);
      } else {
        user.firstName = u.firstName;
        user.lastName = u.lastName;
        user.role = u.role;
        user.isActive = u.isActive;
        user.password = u.password;
        await user.save();
        console.log(`  ~ Updated user: ${u.email} (${u.role})`);
      }
      userMap.set(u.email, user);
    }
    console.log(`✅ ${usersData.length} Users seeded.\n`);

    const adminUser = userMap.get("admin@psychepath.com");

    // 5. Seed Assessments & Questions
    console.log("📋 Seeding Assessments & Questions...");
    const assessmentMap = new Map();
    for (let i = 0; i < assessmentsData.length; i++) {
      const aData = assessmentsData[i];
      let assessment = await Assessment.findOne({ title: aData.title });
      if (!assessment) {
        assessment = await Assessment.create({
          ...aData,
          createdBy: adminUser._id,
        });
        console.log(`  + Created assessment: "${assessment.title}"`);
      } else {
        Object.assign(assessment, aData);
        await assessment.save();
        console.log(`  ~ Updated assessment: "${assessment.title}"`);
      }
      assessmentMap.set(assessment.title, assessment);

      // Questions
      const questionsList =
        i === 0 ? questionsAssessment1 : questionsAssessment2;
      for (const qData of questionsList) {
        let question = await Question.findOne({
          assessment: assessment._id,
          order: qData.order,
        });
        if (!question) {
          await Question.create({
            ...qData,
            assessment: assessment._id,
            isRequired: true,
            isActive: true,
          });
        } else {
          Object.assign(question, qData);
          await question.save();
        }
      }
      console.log(
        `    -> Seeded ${questionsList.length} questions for "${assessment.title}"`,
      );
    }
    console.log("✅ Assessments and questions seeded.\n");

    // 6. Seed Curriculum Modules with DAG Prerequisites
    console.log("📚 Seeding 20 Curriculum Modules with DAG Prerequisites...");
    const moduleMap = new Map(); // key -> document

    // First pass: create modules without prerequisites
    for (const mData of curriculumModulesData) {
      let mod = await CurriculumModule.findOne({ slug: mData.slug });
      if (!mod) {
        mod = await CurriculumModule.create({
          title: mData.title,
          slug: mData.slug,
          description: mData.description,
          category: mData.category,
          difficulty: mData.difficulty,
          estimatedDuration: mData.estimatedDuration,
          skills: mData.skills,
          learningObjectives: mData.learningObjectives,
          order: mData.order,
          isActive: mData.isActive,
          createdBy: adminUser._id,
          prerequisites: [],
        });
        console.log(`  + Created module [${mData.order}/20]: ${mData.title}`);
      } else {
        Object.assign(mod, {
          title: mData.title,
          description: mData.description,
          category: mData.category,
          difficulty: mData.difficulty,
          estimatedDuration: mData.estimatedDuration,
          skills: mData.skills,
          learningObjectives: mData.learningObjectives,
          order: mData.order,
          isActive: mData.isActive,
        });
        await mod.save();
        console.log(`  ~ Updated module [${mData.order}/20]: ${mData.title}`);
      }
      moduleMap.set(mData.key, mod);
    }

    // Second pass: link prerequisite ObjectIds safely
    for (const mData of curriculumModulesData) {
      if (mData.prerequisites && mData.prerequisites.length > 0) {
        const mod = moduleMap.get(mData.key);
        const prereqIds = mData.prerequisites
          .map((prereqKey) => moduleMap.get(prereqKey)?._id)
          .filter(Boolean);

        mod.prerequisites = prereqIds;
        await mod.save();
      }
    }
    console.log(
      "✅ 20 Curriculum modules seeded with non-circular DAG relationships.\n",
    );

    // 7. Seed Diverse Student Scenarios
    console.log("🎓 Seeding Diverse Student Scenarios...");
    const cognitiveAssessment = assessmentMap.get(
      "Cognitive Learning Style & Problem Solving Diagnostic",
    );
    const engineeringAssessment = assessmentMap.get(
      "Fullstack Engineering Aptitude & Systems Diagnostic",
    );

    // Scenario A: student.new@psychepath.com (New Student, empty state)
    const studentNew = userMap.get("student.new@psychepath.com");
    await LearnerProfile.findOneAndUpdate(
      { user: studentNew._id },
      {
        $set: {
          educationLevel: "UNDERGRADUATE",
          experienceLevel: "BEGINNER",
          weeklyLearningHours: 10,
          currentSkills: [{ name: "HTML", level: "BEGINNER" }],
          learningGoals: [
            { name: "Become a Fullstack Developer", priority: 1 },
          ],
          profileVersion: 1,
        },
      },
      { upsert: true, new: true },
    );
    console.log(
      "  [Scenario A] student.new@psychepath.com: Brand new student (no attempts)",
    );

    // Scenario B: student.assessed@psychepath.com (Completed assessment, profile generated)
    const studentAssessed = userMap.get("student.assessed@psychepath.com");
    const attemptAssessed = await AssessmentAttempt.findOneAndUpdate(
      { user: studentAssessed._id, assessment: cognitiveAssessment._id },
      {
        $set: {
          status: "COMPLETED",
          startedAt: new Date(Date.now() - 3600000),
          submittedAt: new Date(),
          scores: {
            analytical: 90,
            intuitive: 75,
            collaborative: 60,
            practical: 85,
          },
          resultSummary:
            "High aptitude in analytical reasoning and pragmatic hands-on implementation.",
        },
      },
      { upsert: true, new: true },
    );

    await LearnerProfile.findOneAndUpdate(
      { user: studentAssessed._id },
      {
        $set: {
          educationLevel: "UNDERGRADUATE",
          experienceLevel: "BEGINNER",
          weeklyLearningHours: 12,
          currentSkills: [
            { name: "HTML", level: "INTERMEDIATE" },
            { name: "CSS", level: "BEGINNER" },
          ],
          learningGoals: [
            { name: "Master Modern JavaScript", priority: 1 },
            { name: "Build Production React Apps", priority: 2 },
          ],
          assessmentDimensions: {
            analytical: 90,
            intuitive: 75,
            collaborative: 60,
            practical: 85,
          },
          strengths: ["analytical", "practical", "intuitive"],
          improvementAreas: ["collaborative"],
          lastAssessmentAttempt: attemptAssessed._id,
          profileVersion: 1,
        },
      },
      { upsert: true, new: true },
    );
    console.log(
      "  [Scenario B] student.assessed@psychepath.com: Completed assessment, profile ready for recommendations",
    );

    // Scenario C: student.active@psychepath.com (Active learning path with partial progress)
    const studentActive = userMap.get("student.active@psychepath.com");
    const activeMod1 = moduleMap.get("mod_html_css");
    const activeMod2 = moduleMap.get("mod_css_layout");
    const activeMod3 = moduleMap.get("mod_js_fundamentals");

    const activePath = await LearningPath.findOneAndUpdate(
      { user: studentActive._id, status: "ACTIVE" },
      {
        $set: {
          version: 1,
          status: "ACTIVE",
          summary: "Personalized Foundation to Frontend Engineering Path",
          focusAreas: ["HTML & CSS Layouts", "JavaScript Fundamentals"],
          learningStrategy: [
            "Follow prerequisite sequence",
            "Immediate coding exercises",
          ],
          estimatedDuration: 26,
          generatedBy: "RULE_ENGINE",
          generatedAt: new Date(),
          goals: ["Frontend Development Mastery"],
          modules: [
            {
              module: activeMod1._id,
              order: 1,
              priority: 1,
              reason: "Core foundation",
              status: "COMPLETED",
            },
            {
              module: activeMod2._id,
              order: 2,
              priority: 2,
              reason: "Layout fluency",
              status: "IN_PROGRESS",
            },
            {
              module: activeMod3._id,
              order: 3,
              priority: 3,
              reason: "Programming logic",
              status: "NOT_STARTED",
            },
          ],
        },
      },
      { upsert: true, new: true },
    );

    // Progress record 1: completed
    await Progress.findOneAndUpdate(
      {
        user: studentActive._id,
        learningPath: activePath._id,
        module: activeMod1._id,
      },
      {
        $set: {
          status: "COMPLETED",
          percentage: 100,
          startedAt: new Date(Date.now() - 86400000),
          completedAt: new Date(Date.now() - 43200000),
          lastAccessedAt: new Date(Date.now() - 43200000),
        },
      },
      { upsert: true, new: true },
    );

    // Progress record 2: 50% in progress
    await Progress.findOneAndUpdate(
      {
        user: studentActive._id,
        learningPath: activePath._id,
        module: activeMod2._id,
      },
      {
        $set: {
          status: "IN_PROGRESS",
          percentage: 50,
          startedAt: new Date(Date.now() - 3600000),
          completedAt: null,
          lastAccessedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    // Audit logs for active student
    await ProgressHistory.create([
      {
        user: studentActive._id,
        learningPath: activePath._id,
        module: activeMod1._id,
        action: "STARTED",
        previousStatus: "NOT_STARTED",
        newStatus: "IN_PROGRESS",
        previousPercentage: 0,
        newPercentage: 0,
      },
      {
        user: studentActive._id,
        learningPath: activePath._id,
        module: activeMod1._id,
        action: "COMPLETED",
        previousStatus: "IN_PROGRESS",
        newStatus: "COMPLETED",
        previousPercentage: 50,
        newPercentage: 100,
      },
      {
        user: studentActive._id,
        learningPath: activePath._id,
        module: activeMod2._id,
        action: "STARTED",
        previousStatus: "NOT_STARTED",
        newStatus: "IN_PROGRESS",
        previousPercentage: 0,
        newPercentage: 0,
      },
      {
        user: studentActive._id,
        learningPath: activePath._id,
        module: activeMod2._id,
        action: "PROGRESS_UPDATED",
        previousStatus: "IN_PROGRESS",
        newStatus: "IN_PROGRESS",
        previousPercentage: 0,
        newPercentage: 50,
      },
    ]);
    console.log(
      "  [Scenario C] student.active@psychepath.com: Active path with in-progress modules and audit trail",
    );

    // Scenario D: student.completed@psychepath.com (100% completed path)
    const studentCompleted = userMap.get("student.completed@psychepath.com");
    const completedPath = await LearningPath.findOneAndUpdate(
      { user: studentCompleted._id, status: "COMPLETED" },
      {
        $set: {
          version: 1,
          status: "COMPLETED",
          summary: "Accelerated Frontend Architecture Path",
          focusAreas: ["Semantic Web", "Modern CSS"],
          learningStrategy: ["Rapid mastery"],
          estimatedDuration: 14,
          generatedBy: "RULE_ENGINE",
          generatedAt: new Date(Date.now() - 172800000),
          goals: ["Complete Web Track"],
          modules: [
            {
              module: activeMod1._id,
              order: 1,
              priority: 1,
              reason: "Core web",
              status: "COMPLETED",
            },
            {
              module: activeMod2._id,
              order: 2,
              priority: 2,
              reason: "Responsive design",
              status: "COMPLETED",
            },
          ],
        },
      },
      { upsert: true, new: true },
    );

    for (const mod of [activeMod1, activeMod2]) {
      await Progress.findOneAndUpdate(
        {
          user: studentCompleted._id,
          learningPath: completedPath._id,
          module: mod._id,
        },
        {
          $set: {
            status: "COMPLETED",
            percentage: 100,
            startedAt: new Date(Date.now() - 100000000),
            completedAt: new Date(Date.now() - 50000000),
            lastAccessedAt: new Date(Date.now() - 50000000),
          },
        },
        { upsert: true, new: true },
      );
    }
    console.log(
      "  [Scenario D] student.completed@psychepath.com: 100% completed learning path",
    );

    // Scenario E: student.inactive@psychepath.com (Deactivated student)
    const studentInactive = userMap.get("student.inactive@psychepath.com");
    studentInactive.isActive = false;
    await studentInactive.save();
    console.log(
      "  [Scenario E] student.inactive@psychepath.com: Deactivated student account",
    );

    console.log("\n=================================================");
    console.log("🎉 PsychePath Development Seeding Complete!");
    console.log("=================================================");
    console.log("\n📋 DEVELOPMENT LOGIN CREDENTIALS:");
    console.log("-------------------------------------------------");
    console.log("Role   | Email                         | Password");
    console.log("-------------------------------------------------");
    console.log(
      `ADMIN  | admin@psychepath.com          | ${SEED_PASSWORDS.admin}`,
    );
    console.log(
      `STUDENT| student.new@psychepath.com       | ${SEED_PASSWORDS.student} (New)`,
    );
    console.log(
      `STUDENT| student.assessed@psychepath.com  | ${SEED_PASSWORDS.student} (Assessed)`,
    );
    console.log(
      `STUDENT| student.active@psychepath.com    | ${SEED_PASSWORDS.student} (In-Flight)`,
    );
    console.log(
      `STUDENT| student.completed@psychepath.com | ${SEED_PASSWORDS.student} (Completed)`,
    );
    console.log(
      `STUDENT| student.inactive@psychepath.com  | ${SEED_PASSWORDS.student} (Inactive)`,
    );
    console.log("-------------------------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ [Error] Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();
