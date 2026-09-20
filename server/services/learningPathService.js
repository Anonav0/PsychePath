/**
 * PsychePath - Learning Path Service
 *
 * Coordinates recommendation generation, AI personalization, DAG prerequisite
 * validation, MongoDB persistence, versioned archiving, and path retrieval.
 */

const { LearningPath, LearnerProfile, CurriculumModule } = require("../models");
const recommendationService = require("./recommendationService");
const config = require("../config");

class LearningPathService {
  /**
   * Helper to format a LearningPath document into a sanitized output
   */
  formatPath(pathDoc) {
    if (!pathDoc) return null;

    const doc = pathDoc.toObject ? pathDoc.toObject() : pathDoc;

    return {
      id: doc._id.toString(),
      user: doc.user?.toString ? doc.user.toString() : doc.user,
      version: doc.version,
      status: doc.status,
      summary: doc.summary,
      focusAreas: doc.focusAreas || [],
      learningStrategy: doc.learningStrategy || [],
      estimatedDuration: doc.estimatedDuration,
      generatedBy: doc.generatedBy,
      generatedAt: doc.generatedAt,
      sourceAssessment: doc.sourceAssessment || null,
      goals: doc.goals || [],
      modules: (doc.modules || []).map((m) => ({
        module: m.module
          ? {
              id: m.module._id ? m.module._id.toString() : m.module.toString(),
              title: m.module.title,
              description: m.module.description,
              category: m.module.category,
              difficulty: m.module.difficulty,
              estimatedDuration: m.module.estimatedDuration,
              skills: m.module.skills,
              learningObjectives: m.module.learningObjectives,
              resources: m.module.resources,
              order: m.module.order,
            }
          : null,
        order: m.order,
        priority: m.priority,
        reason: m.reason,
        status: m.status,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Generates, validates, and persists a personalized LearningPath
   */
  async generateLearningPath(userId, options = {}) {
    // 1. Verify Profile and readiness
    const profile = await LearnerProfile.findOne({ user: userId }).lean();

    if (!profile) {
      const error = new Error(
        "Learner profile not found. Complete profile setup first.",
      );
      error.statusCode = 404;
      error.errorCode = "PROFILE_NOT_FOUND";
      throw error;
    }

    const readiness = recommendationService.checkProfileReadiness(profile);
    if (!readiness.ready) {
      const error = new Error(
        `Learner profile is incomplete. Missing: ${readiness.missingFields.join(", ")}`,
      );
      error.statusCode = 400;
      error.errorCode = "PROFILE_INCOMPLETE";
      error.data = {
        ready: false,
        missingFields: readiness.missingFields,
      };
      throw error;
    }

    // 2. Fetch recommendations (integrates Phase 7 deterministic scoring + Phase 8 Gemini personalization)
    const maxModules = parseInt(options.maxModules, 10) || 10;
    const recData = await recommendationService.getRecommendations(userId, {
      limit: maxModules,
    });

    if (!recData.recommendations || recData.recommendations.length === 0) {
      const error = new Error(
        "No eligible curriculum modules found to generate a learning path.",
      );
      error.statusCode = 400;
      error.errorCode = "NO_RECOMMENDATIONS_AVAILABLE";
      throw error;
    }

    // 3. Authoritative duration calculation (sum of curriculum module durations)
    const estimatedDuration = recData.recommendations.reduce(
      (sum, r) => sum + (r.module.estimatedDuration || 0),
      0,
    );

    // 4. Format path modules
    const pathModules = recData.recommendations.map((rec, index) => ({
      module: rec.module.id,
      order: index + 1,
      priority: rec.aiPriority || index + 1,
      reason: rec.reason || "Recommended based on your profile and goals.",
      status: "NOT_STARTED",
    }));

    // 5. Goals extraction
    const goals = (profile.learningGoals || []).map((g) =>
      typeof g === "string" ? g : g.name || "",
    );

    // 6. Versioning: Calculate next version & archive previous active path
    const latestPath = await LearningPath.findOne({ user: userId })
      .sort({ version: -1 })
      .lean();

    const nextVersion = latestPath ? (latestPath.version || 0) + 1 : 1;

    // Archive any currently active paths for this user
    await LearningPath.updateMany(
      { user: userId, status: "ACTIVE" },
      { $set: { status: "ARCHIVED" } },
    );

    // 7. Persist new active learning path
    const newPath = await LearningPath.create({
      user: userId,
      sourceAssessment: profile.lastAssessmentAttempt || null,
      modules: pathModules,
      goals,
      summary:
        recData.summary ||
        "Personalized learning path tailored to your goals and cognitive style.",
      focusAreas: recData.focusAreas || [],
      learningStrategy: Array.isArray(recData.learningStrategy)
        ? recData.learningStrategy
        : [recData.learningStrategy].filter(Boolean),
      estimatedDuration,
      status: "ACTIVE",
      generatedBy: recData.source || "RULE_ENGINE",
      generatedAt: new Date(),
      version: nextVersion,
    });

    // Populate module references
    await newPath.populate({
      path: "modules.module",
      select:
        "title description category difficulty estimatedDuration skills learningObjectives resources order",
    });

    return this.formatPath(newPath);
  }

  /**
   * Regenerates learning path (alias workflow with explicit intention)
   */
  async regenerateLearningPath(userId, options = {}) {
    return this.generateLearningPath(userId, options);
  }

  /**
   * Retrieves the current active learning path for user
   */
  async getCurrentPath(userId) {
    const pathDoc = await LearningPath.findOne({
      user: userId,
      status: "ACTIVE",
    })
      .populate({
        path: "modules.module",
        select:
          "title description category difficulty estimatedDuration skills learningObjectives resources order",
      })
      .populate("sourceAssessment");

    return this.formatPath(pathDoc);
  }

  /**
   * Retrieves version history of all learning paths for user
   */
  async getPathHistory(userId) {
    const paths = await LearningPath.find({ user: userId })
      .sort({ version: -1 })
      .populate({
        path: "modules.module",
        select:
          "title description category difficulty estimatedDuration skills learningObjectives resources order",
      });

    return paths.map((p) => this.formatPath(p));
  }

  /**
   * Retrieves specific learning path by ID with ownership enforcement
   */
  async getPathById(userId, pathId, userRole = "STUDENT") {
    const pathDoc = await LearningPath.findById(pathId)
      .populate({
        path: "modules.module",
        select:
          "title description category difficulty estimatedDuration skills learningObjectives resources order",
      })
      .populate("sourceAssessment");

    if (!pathDoc) {
      const error = new Error("Learning path not found");
      error.statusCode = 404;
      error.errorCode = "LEARNING_PATH_NOT_FOUND";
      throw error;
    }

    // Ownership check (unless ADMIN)
    if (pathDoc.user.toString() !== userId.toString() && userRole !== "ADMIN") {
      const error = new Error(
        "You do not have permission to view this learning path",
      );
      error.statusCode = 403;
      error.errorCode = "PATH_ACCESS_DENIED";
      throw error;
    }

    return this.formatPath(pathDoc);
  }
}

module.exports = new LearningPathService();
