const { CurriculumModule } = require("../models");

const LEVEL_MAP = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

class CandidateGenerationService {
  /**
   * Normalizes text / skill names for reliable comparison
   */
  normalizeSkillName(name) {
    if (!name || typeof name !== "string") return "";
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  /**
   * Evaluates prerequisite satisfaction for a given module against learner skills
   * @param {Object} moduleDoc - CurriculumModule document with populated prerequisites
   * @param {Array} learnerSkills - Array of { name, level } from LearnerProfile
   */
  evaluatePrerequisites(moduleDoc, learnerSkills = []) {
    const studentSkillMap = new Map();
    for (const s of learnerSkills) {
      if (s && s.name) {
        const key = this.normalizeSkillName(s.name);
        const level = LEVEL_MAP[String(s.level).toUpperCase()] || 1;
        studentSkillMap.set(
          key,
          Math.max(studentSkillMap.get(key) || 0, level),
        );
      }
    }

    const missingPrerequisites = [];

    if (!moduleDoc.prerequisites || moduleDoc.prerequisites.length === 0) {
      return {
        prerequisitesSatisfied: true,
        missingPrerequisites: [],
      };
    }

    for (const prereq of moduleDoc.prerequisites) {
      // If prereq has skills defined, verify learner has those skills at adequate level
      let satisfied = true;

      if (prereq.skills && prereq.skills.length > 0) {
        for (const reqSkill of prereq.skills) {
          const reqKey = this.normalizeSkillName(reqSkill.name);
          const requiredLevel =
            LEVEL_MAP[String(reqSkill.level).toUpperCase()] || 1;
          const learnerLevel = studentSkillMap.get(reqKey) || 0;

          if (learnerLevel < requiredLevel) {
            satisfied = false;
            break;
          }
        }
      } else {
        // Fallback if prereq module has no skills listed: match by prereq title as a skill
        const titleKey = this.normalizeSkillName(prereq.title);
        if (!studentSkillMap.has(titleKey)) {
          satisfied = false;
        }
      }

      if (!satisfied) {
        missingPrerequisites.push({
          moduleId: prereq._id ? prereq._id.toString() : prereq.toString(),
          title: prereq.title || "Prerequisite Module",
        });
      }
    }

    return {
      prerequisitesSatisfied: missingPrerequisites.length === 0,
      missingPrerequisites,
    };
  }

  /**
   * Retrieves active candidate modules matching optional query filters
   * @param {Object} query - Optional category, difficulty
   * @param {Array} learnerSkills - Learner profile skills
   */
  async getCandidateModules(query = {}, learnerSkills = []) {
    const filter = { isActive: true };

    if (query.category) {
      filter.category = new RegExp(`^${query.category.trim()}$`, "i");
    }

    if (query.difficulty) {
      filter.difficulty = query.difficulty.trim().toUpperCase();
    }

    const modules = await CurriculumModule.find(filter)
      .populate(
        "prerequisites",
        "_id title skills difficulty category estimatedDuration",
      )
      .lean();

    return modules.map((mod) => {
      const prereqEval = this.evaluatePrerequisites(mod, learnerSkills);
      return {
        ...mod,
        prerequisitesSatisfied: prereqEval.prerequisitesSatisfied,
        missingPrerequisites: prereqEval.missingPrerequisites,
      };
    });
  }
}

module.exports = new CandidateGenerationService();
