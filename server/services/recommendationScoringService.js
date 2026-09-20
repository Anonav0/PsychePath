const RECOMMENDATION_WEIGHTS = {
  goalMatch: 0.25,
  skillMatch: 0.25,
  prerequisiteReadiness: 0.15,
  assessmentAlignment: 0.15,
  difficultyAlignment: 0.1,
  interestMatch: 0.05,
  preferenceMatch: 0.05,
};

const LEVEL_MAP = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

class RecommendationScoringService {
  constructor() {
    this.weights = RECOMMENDATION_WEIGHTS;
  }

  /**
   * Tokenizes and cleans text into alphanumeric keywords
   */
  tokenize(text) {
    if (!text || typeof text !== "string") return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  /**
   * Normalizes a single skill string for matching
   */
  normalize(str) {
    if (!str || typeof str !== "string") return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  /**
   * Evaluates goal match score (0-100) based on keyword and category overlap
   */
  calculateGoalScore(goals = [], moduleDoc) {
    if (!Array.isArray(goals) || goals.length === 0) {
      return 40; // Neutral baseline when goals are empty
    }

    const moduleText = [
      moduleDoc.title,
      moduleDoc.description,
      moduleDoc.category,
      ...(moduleDoc.skills || []).map((s) =>
        typeof s === "string" ? s : s.name,
      ),
      ...(moduleDoc.learningObjectives || []),
    ]
      .join(" ")
      .toLowerCase();

    const moduleTokens = new Set(this.tokenize(moduleText));
    let highestScore = 20;

    for (const goal of goals) {
      const goalName = typeof goal === "string" ? goal : goal.name;
      if (!goalName) continue;

      const priorityWeight =
        goal.priority === "HIGH" || goal.priority === 3
          ? 1.2
          : goal.priority === "MEDIUM" || goal.priority === 2
            ? 1.0
            : 0.85;

      const goalTokens = this.tokenize(goalName);
      if (goalTokens.length === 0) continue;

      let matchedCount = 0;
      for (const token of goalTokens) {
        if (moduleTokens.has(token) || moduleText.includes(token)) {
          matchedCount++;
        }
      }

      if (matchedCount > 0) {
        const ratio = matchedCount / goalTokens.length;
        const score = Math.min(
          100,
          Math.round((50 + ratio * 50) * priorityWeight),
        );
        if (score > highestScore) highestScore = score;
      }
    }

    return highestScore;
  }

  /**
   * Evaluates skill match and detects skill gaps (0-100)
   */
  calculateSkillScore(learnerSkills = [], moduleDoc) {
    const learnerSkillMap = new Map();
    for (const s of learnerSkills) {
      if (s && s.name) {
        learnerSkillMap.set(
          this.normalize(s.name),
          LEVEL_MAP[String(s.level).toUpperCase()] || 1,
        );
      }
    }

    const moduleSkills = moduleDoc.skills || [];
    if (moduleSkills.length === 0) {
      return { score: 50, matchedSkills: [], skillGaps: [] };
    }

    const matchedSkills = [];
    const skillGaps = [];
    let allRedundant = true;

    for (const mSkill of moduleSkills) {
      const sName = typeof mSkill === "string" ? mSkill : mSkill.name;
      const sLevel = LEVEL_MAP[String(mSkill.level).toUpperCase()] || 1;
      const sNorm = this.normalize(sName);

      if (learnerSkillMap.has(sNorm)) {
        matchedSkills.push(sName);
        const lLevel = learnerSkillMap.get(sNorm);
        if (lLevel < sLevel) {
          skillGaps.push(sName);
          allRedundant = false;
        }
      } else {
        skillGaps.push(sName);
        allRedundant = false;
      }
    }

    let score = 50;
    if (allRedundant && matchedSkills.length > 0) {
      // Learner already knows all skills at or above this module's level -> low learning value
      score = 30;
    } else if (skillGaps.length > 0) {
      // Module bridges active skill gaps
      const gapRatio = skillGaps.length / moduleSkills.length;
      score = Math.min(100, Math.round(60 + gapRatio * 40));
    }

    return { score, matchedSkills, skillGaps };
  }

  /**
   * Evaluates prerequisite readiness (0-100)
   */
  calculatePrerequisiteScore(candidate) {
    if (candidate.prerequisitesSatisfied) {
      return 100;
    }

    const totalPrereqs = (candidate.prerequisites || []).length;
    const missingCount = (candidate.missingPrerequisites || []).length;

    if (totalPrereqs === 0) return 100;
    const satisfiedCount = Math.max(0, totalPrereqs - missingCount);
    return Math.round((satisfiedCount / totalPrereqs) * 50);
  }

  /**
   * Evaluates assessment alignment (0-100) using strengths & improvement areas
   */
  calculateAssessmentScore(profile, moduleDoc) {
    const strengths = profile.strengths || [];
    const improvementAreas = profile.improvementAreas || [];
    const dimensions = profile.assessmentDimensions || {};

    const moduleText = [
      moduleDoc.title,
      moduleDoc.description,
      moduleDoc.category,
      ...(moduleDoc.skills || []).map((s) =>
        typeof s === "string" ? s : s.name,
      ),
      ...(moduleDoc.learningObjectives || []),
    ]
      .join(" ")
      .toLowerCase();

    let score = 50; // Neutral baseline

    // Improvement areas: developing a skill in need
    for (const area of improvementAreas) {
      const tokens = this.tokenize(area);
      if (tokens.some((t) => moduleText.includes(t))) {
        score = Math.max(score, 85);
      }
    }

    // Strengths: building on cognitive assets
    for (const str of strengths) {
      const tokens = this.tokenize(str);
      if (tokens.some((t) => moduleText.includes(t))) {
        score = Math.max(score, 75);
      }
    }

    // High dimensions check
    for (const [dimKey, dimVal] of Object.entries(dimensions)) {
      if (dimVal >= 75) {
        const tokens = this.tokenize(dimKey);
        if (tokens.some((t) => moduleText.includes(t))) {
          score = Math.max(score, 80);
        }
      }
    }

    return score;
  }

  /**
   * Evaluates difficulty alignment (0-100)
   */
  calculateDifficultyScore(profile, moduleDoc) {
    const prefDiff = LEVEL_MAP[profile.preferredDifficulty] || null;
    const expLevel = LEVEL_MAP[profile.experienceLevel] || 1;
    const targetLevel = prefDiff || expLevel;
    const moduleLevel = LEVEL_MAP[moduleDoc.difficulty] || 1;

    const diffDistance = Math.abs(targetLevel - moduleLevel);
    if (diffDistance === 0) return 100;
    if (diffDistance === 1) return 70;
    return 40;
  }

  /**
   * Evaluates interest match (0-100)
   */
  calculateInterestScore(interests = [], moduleDoc) {
    if (!Array.isArray(interests) || interests.length === 0) return 50;

    const moduleText = [
      moduleDoc.title,
      moduleDoc.description,
      moduleDoc.category,
      ...(moduleDoc.skills || []).map((s) =>
        typeof s === "string" ? s : s.name,
      ),
    ]
      .join(" ")
      .toLowerCase();

    for (const interest of interests) {
      const tokens = this.tokenize(interest);
      if (tokens.some((t) => moduleText.includes(t))) {
        return 90;
      }
    }

    return 40;
  }

  /**
   * Evaluates learning preference alignment (0-100)
   */
  calculatePreferenceScore(preferences = {}, moduleDoc) {
    if (!preferences || Object.keys(preferences).length === 0) return 50;

    let score = 50;
    const prefFormat = preferences.preferredFormat;
    const resources = moduleDoc.resources || [];

    if (prefFormat && resources.length > 0) {
      const hasPreferredResource = resources.some(
        (r) =>
          r.type &&
          String(r.type).toUpperCase() === String(prefFormat).toUpperCase(),
      );
      if (hasPreferredResource) {
        score += 30;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Computes the complete deterministic score and component breakdown for a candidate
   */
  scoreCandidate(candidate, profile) {
    const goalMatch = this.calculateGoalScore(profile.learningGoals, candidate);
    const {
      score: skillMatch,
      matchedSkills,
      skillGaps,
    } = this.calculateSkillScore(profile.currentSkills, candidate);
    const prerequisiteReadiness = this.calculatePrerequisiteScore(candidate);
    const assessmentAlignment = this.calculateAssessmentScore(
      profile,
      candidate,
    );
    const difficultyAlignment = this.calculateDifficultyScore(
      profile,
      candidate,
    );
    const interestMatch = this.calculateInterestScore(
      profile.interests,
      candidate,
    );
    const preferenceMatch = this.calculatePreferenceScore(
      profile.learningPreferences,
      candidate,
    );

    const scoreBreakdown = {
      goalMatch,
      skillMatch,
      prerequisiteReadiness,
      assessmentAlignment,
      difficultyAlignment,
      interestMatch,
      preferenceMatch,
    };

    const weightedScore =
      goalMatch * this.weights.goalMatch +
      skillMatch * this.weights.skillMatch +
      prerequisiteReadiness * this.weights.prerequisiteReadiness +
      assessmentAlignment * this.weights.assessmentAlignment +
      difficultyAlignment * this.weights.difficultyAlignment +
      interestMatch * this.weights.interestMatch +
      preferenceMatch * this.weights.preferenceMatch;

    const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));

    return {
      score: finalScore,
      scoreBreakdown,
      matchedSkills,
      skillGaps,
    };
  }
}

module.exports = new RecommendationScoringService();
