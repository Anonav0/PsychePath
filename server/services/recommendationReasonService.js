class RecommendationReasonService {
  /**
   * Generates a concise, deterministic explanation for why a module was recommended
   * @param {Object} candidate - Module metadata
   * @param {Object} scoring - { score, scoreBreakdown, matchedSkills, skillGaps }
   * @param {Object} profile - Learner profile
   */
  generateReason(candidate, scoring, profile) {
    const reasons = [];
    const breakdown = scoring.scoreBreakdown || {};

    // 1. Goal alignment
    if (
      breakdown.goalMatch >= 65 &&
      profile.learningGoals &&
      profile.learningGoals.length > 0
    ) {
      const topGoal = profile.learningGoals[0];
      const goalTitle = typeof topGoal === "string" ? topGoal : topGoal.name;
      reasons.push(`Supports your learning goal of "${goalTitle}"`);
    }

    // 2. Skill gap closure
    if (scoring.skillGaps && scoring.skillGaps.length > 0) {
      const gapList = scoring.skillGaps.slice(0, 2).join(" and ");
      reasons.push(`Bridges a skill gap in ${gapList}`);
    } else if (scoring.matchedSkills && scoring.matchedSkills.length > 0) {
      const matchedList = scoring.matchedSkills.slice(0, 2).join(" and ");
      reasons.push(`Builds on your existing ${matchedList} experience`);
    }

    // 3. Prerequisite readiness
    if (candidate.prerequisitesSatisfied) {
      reasons.push("Prerequisites are fully satisfied");
    } else if (
      candidate.missingPrerequisites &&
      candidate.missingPrerequisites.length > 0
    ) {
      const missingTitle = candidate.missingPrerequisites[0].title;
      reasons.push(`Requires prerequisite "${missingTitle}" before starting`);
    }

    // 4. Difficulty alignment
    if (breakdown.difficultyAlignment === 100) {
      reasons.push(
        `Matches your preferred ${candidate.difficulty.toLowerCase()} difficulty`,
      );
    }

    // 5. Assessment alignment
    if (breakdown.assessmentAlignment >= 80) {
      reasons.push("Aligned with your diagnostic assessment development focus");
    }

    if (reasons.length === 0) {
      return `Recommended based on your ${candidate.category.toLowerCase().replace("_", " ")} learning path focus.`;
    }

    return reasons.slice(0, 3).join(". ") + ".";
  }
}

module.exports = new RecommendationReasonService();
