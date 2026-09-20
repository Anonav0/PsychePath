const { LearnerProfile } = require("../models");
const config = require("../config");
const candidateGenerationService = require("./candidateGenerationService");
const recommendationScoringService = require("./recommendationScoringService");
const recommendationReasonService = require("./recommendationReasonService");
const geminiPersonalizationService = require("./geminiPersonalizationService");

const MIN_RECOMMENDATION_SCORE = 35;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

class RecommendationService {
  /**
   * Deterministically validates profile readiness
   * Requires non-empty learningGoals, currentSkills, and assessmentDimensions
   */
  checkProfileReadiness(profile) {
    const missingFields = [];

    if (!profile) {
      return { ready: false, missingFields: ["profile"] };
    }

    if (
      !Array.isArray(profile.learningGoals) ||
      profile.learningGoals.length === 0
    ) {
      missingFields.push("learningGoals");
    }

    if (
      !Array.isArray(profile.currentSkills) ||
      profile.currentSkills.length === 0
    ) {
      missingFields.push("currentSkills");
    }

    const hasDimensions =
      profile.assessmentDimensions &&
      Object.keys(profile.assessmentDimensions).length > 0;

    if (!hasDimensions) {
      missingFields.push("assessmentDimensions");
    }

    return {
      ready: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Main recommendation orchestration method
   * @param {string|ObjectId} userId - Authenticated student ID
   * @param {Object} queryParams - Optional filters (limit, difficulty, category)
   */
  async getRecommendations(userId, queryParams = {}) {
    const profile = await LearnerProfile.findOne({ user: userId }).lean();

    if (!profile) {
      const error = new Error(
        "Learner profile not found. Complete profile setup first.",
      );
      error.statusCode = 404;
      error.errorCode = "PROFILE_NOT_FOUND";
      throw error;
    }

    // Verify readiness
    const readiness = this.checkProfileReadiness(profile);
    if (!readiness.ready) {
      const error = new Error(
        `Learner profile is not ready for recommendations. Missing required fields: ${readiness.missingFields.join(", ")}`,
      );
      error.statusCode = 400;
      error.errorCode = "PROFILE_NOT_READY";
      error.data = {
        ready: false,
        missingFields: readiness.missingFields,
      };
      throw error;
    }

    // Retrieve active candidates with prerequisite evaluation
    const candidates = await candidateGenerationService.getCandidateModules(
      queryParams,
      profile.currentSkills,
    );

    if (candidates.length === 0) {
      return {
        source: "RULE_ENGINE",
        summary: "No eligible modules match the current criteria.",
        focusAreas: profile.learningGoals || [],
        learningStrategy: [],
        recommendations: [],
        blockedModules: [],
        profileVersion: profile.profileVersion || 1,
        candidateCount: 0,
      };
    }

    // Score and annotate candidates
    const scoredCandidates = candidates.map((cand) => {
      const scoring = recommendationScoringService.scoreCandidate(
        cand,
        profile,
      );
      const reason = recommendationReasonService.generateReason(
        cand,
        scoring,
        profile,
      );

      return {
        module: {
          id: cand._id.toString(),
          title: cand.title,
          category: cand.category,
          difficulty: cand.difficulty,
          estimatedDuration: cand.estimatedDuration,
          order: cand.order || 1,
          resources: (cand.resources || []).map((r) => ({
            title: r.title,
            type: r.type,
            url: r.url,
          })),
        },
        score: scoring.score,
        reason,
        matchedSkills: scoring.matchedSkills,
        skillGaps: scoring.skillGaps,
        prerequisitesSatisfied: cand.prerequisitesSatisfied,
        missingPrerequisites: cand.missingPrerequisites,
        scoreBreakdown: scoring.scoreBreakdown,
      };
    });

    // Deterministic comparator
    const comparator = (a, b) => {
      // Primary: final score descending
      if (b.score !== a.score) return b.score - a.score;
      // Tie-breaker 1: goalMatch component descending
      const goalDiff =
        (b.scoreBreakdown?.goalMatch || 0) - (a.scoreBreakdown?.goalMatch || 0);
      if (goalDiff !== 0) return goalDiff;
      // Tie-breaker 2: curriculum order ascending
      const orderDiff = (a.module.order || 0) - (b.module.order || 0);
      if (orderDiff !== 0) return orderDiff;
      // Tie-breaker 3: title alphabetical
      return a.module.title.localeCompare(b.module.title);
    };

    // Separate actionable and blocked modules
    const actionable = scoredCandidates
      .filter(
        (c) => c.prerequisitesSatisfied && c.score >= MIN_RECOMMENDATION_SCORE,
      )
      .sort(comparator);

    const blocked = scoredCandidates
      .filter((c) => !c.prerequisitesSatisfied)
      .sort(comparator);

    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(queryParams.limit, 10) || DEFAULT_LIMIT),
    );

    const limitedActionable = actionable.slice(0, limit);
    const limitedBlocked = blocked.slice(0, limit);

    // If Gemini API key is configured, personalize recommendations using Gemini AI
    if (config.geminiApiKey) {
      return await geminiPersonalizationService.personalize(
        profile,
        limitedActionable,
        limitedBlocked,
      );
    }

    // Otherwise use deterministic rule engine result
    return geminiPersonalizationService.fallback(
      limitedActionable,
      limitedBlocked,
      profile,
    );
  }
}

module.exports = new RecommendationService();
