const { AssessmentAttempt } = require("../models");

// Configurable thresholds for learning-oriented diagnostic indicators
const STRENGTH_THRESHOLD = 75; // Scores >= 75% are strengths
const DEVELOPMENT_THRESHOLD = 60; // Scores < 60% are development areas

class ProfileGenerationService {
  /**
   * Converts a completed assessment attempt into structured learner-profile attributes
   * @param {string|ObjectId} userId - Authenticated student ID
   * @param {string|ObjectId} attemptId - Target assessment attempt ID
   */
  async generateProfileFromAttempt(userId, attemptId) {
    const attempt = await AssessmentAttempt.findById(attemptId);

    if (!attempt) {
      const error = new Error("Assessment attempt not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_ATTEMPT_NOT_FOUND";
      throw error;
    }

    // IDOR Protection: Enforce student ownership
    if (attempt.user.toString() !== userId.toString()) {
      const error = new Error(
        "You do not have permission to generate a profile from this assessment attempt",
      );
      error.statusCode = 403;
      error.errorCode = "ATTEMPT_ACCESS_DENIED";
      throw error;
    }

    // Only COMPLETED attempts can generate a learner profile
    if (attempt.status !== "COMPLETED") {
      const error = new Error(
        `Cannot generate profile from assessment with status "${attempt.status}". Assessment must be completed.`,
      );
      error.statusCode = 400;
      error.errorCode = "ASSESSMENT_RESULT_NOT_AVAILABLE";
      throw error;
    }

    // Extract authoritative scores
    const rawScores =
      attempt.scores instanceof Map
        ? Object.fromEntries(attempt.scores)
        : attempt.scores || {};

    const normalizedDimensions = {};
    const strengths = [];
    const improvementAreas = [];

    // Map dimensions and evaluate strengths/improvement areas deterministically
    Object.entries(rawScores).forEach(([dim, scoreVal]) => {
      const key = dim.toLowerCase().trim();
      const score = Math.round(Number(scoreVal) || 0);
      normalizedDimensions[key] = score;

      if (score >= STRENGTH_THRESHOLD) {
        strengths.push(key);
      } else if (score < DEVELOPMENT_THRESHOLD) {
        improvementAreas.push(key);
      }
      // Scores between 60% and 74% remain neutral/developing
    });

    return {
      assessmentDimensions: normalizedDimensions,
      strengths,
      improvementAreas,
      lastAssessmentAttempt: attempt._id,
    };
  }

  /**
   * Computes deterministic profile completeness score (0-100%)
   * @param {Object} profile - LearnerProfile document or object
   */
  calculateCompleteness(profile) {
    if (!profile) return 0;

    let score = 0;

    // 1. Education specified (15%)
    if (profile.educationLevel) {
      score += 15;
    }

    // 2. Current skills listed (20%)
    if (
      Array.isArray(profile.currentSkills) &&
      profile.currentSkills.length > 0
    ) {
      score += 20;
    }

    // 3. Learning goals set (20%)
    if (
      Array.isArray(profile.learningGoals) &&
      profile.learningGoals.length > 0
    ) {
      score += 20;
    }

    // 4. Interests provided (10%)
    if (Array.isArray(profile.interests) && profile.interests.length > 0) {
      score += 10;
    }

    // 5. Learning preferences configured (10%)
    if (
      profile.learningPreferences &&
      profile.learningPreferences.preferredFormat
    ) {
      score += 10;
    }

    // 6. Assessment completed & dimensions mapped (25%)
    const hasDimensions =
      profile.assessmentDimensions &&
      (profile.assessmentDimensions instanceof Map
        ? profile.assessmentDimensions.size > 0
        : Object.keys(profile.assessmentDimensions).length > 0);

    if (profile.lastAssessmentAttempt && hasDimensions) {
      score += 25;
    }

    return Math.min(100, score);
  }
}

module.exports = new ProfileGenerationService();
