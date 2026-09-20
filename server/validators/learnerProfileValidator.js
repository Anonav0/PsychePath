const { errorResponse } = require("../utils/apiResponse");

const VALID_EDUCATION_LEVELS = [
  "HIGH_SCHOOL",
  "UNDERGRADUATE",
  "POSTGRADUATE",
  "BOOTCAMP",
  "SELF_TAUGHT",
  "OTHER",
  "SCHOOL",
  "DIPLOMA",
  "PROFESSIONAL",
];

const VALID_EXPERIENCE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const VALID_SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const VALID_LEARNING_FORMATS = [
  "VIDEO",
  "READING",
  "PROJECT",
  "PRACTICE",
  "MIXED",
  "ARTICLE",
  "DOCUMENTATION",
];
const FORBIDDEN_UPDATE_FIELDS = [
  "assessmentDimensions",
  "strengths",
  "improvementAreas",
  "lastAssessmentAttempt",
  "profileVersion",
  "profileCompleteness",
  "completeness",
  "user",
  "createdAt",
  "updatedAt",
];

/**
 * Validates updates to learner profile (ensuring user-managed data only)
 */
const validateUpdateProfile = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Profile update payload cannot be empty",
      errorCode: "VALIDATION_ERROR",
    });
  }

  // Security Guard: Prevent client from modifying assessment-derived fields
  for (const forbidden of FORBIDDEN_UPDATE_FIELDS) {
    if (body[forbidden] !== undefined) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Field "${forbidden}" is system-derived and cannot be modified directly by the student`,
        errorCode: "PROFILE_UPDATE_INVALID",
      });
    }
  }

  // Education level
  if (body.educationLevel !== undefined) {
    const edu = String(body.educationLevel).toUpperCase().trim();
    if (!VALID_EDUCATION_LEVELS.includes(edu)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Invalid educationLevel. Allowed values: ${VALID_EDUCATION_LEVELS.join(", ")}`,
        errorCode: "VALIDATION_ERROR",
      });
    }
    // Normalize to schema-supported values
    if (edu === "SCHOOL") req.body.educationLevel = "HIGH_SCHOOL";
    else if (edu === "DIPLOMA" || edu === "PROFESSIONAL")
      req.body.educationLevel = "BOOTCAMP";
    else req.body.educationLevel = edu;
  }

  // Experience level
  if (body.experienceLevel !== undefined) {
    const exp = String(body.experienceLevel).toUpperCase().trim();
    if (!VALID_EXPERIENCE_LEVELS.includes(exp)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Invalid experienceLevel. Allowed values: ${VALID_EXPERIENCE_LEVELS.join(", ")}`,
        errorCode: "VALIDATION_ERROR",
      });
    }
    req.body.experienceLevel = exp;
  }

  // Preferred difficulty
  if (body.preferredDifficulty !== undefined) {
    const diff = String(body.preferredDifficulty).toUpperCase().trim();
    if (!VALID_EXPERIENCE_LEVELS.includes(diff)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Invalid preferredDifficulty. Allowed values: ${VALID_EXPERIENCE_LEVELS.join(", ")}`,
        errorCode: "VALIDATION_ERROR",
      });
    }
    req.body.preferredDifficulty = diff;
  }

  // Current Skills validation
  if (body.currentSkills !== undefined) {
    if (!Array.isArray(body.currentSkills)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "currentSkills must be an array of skill objects",
        errorCode: "INVALID_SKILL",
      });
    }

    const seenSkills = new Set();

    for (const skill of body.currentSkills) {
      if (!skill || typeof skill !== "object") {
        return errorResponse(res, {
          statusCode: 400,
          message: "Each skill entry must be an object with name and level",
          errorCode: "INVALID_SKILL",
        });
      }

      if (
        !skill.name ||
        typeof skill.name !== "string" ||
        skill.name.trim().length === 0
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Skill name is required and cannot be empty",
          errorCode: "INVALID_SKILL",
        });
      }

      const normName = skill.name.trim().toLowerCase();
      if (seenSkills.has(normName)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Duplicate skill "${skill.name}" detected in currentSkills`,
          errorCode: "INVALID_SKILL",
        });
      }
      seenSkills.add(normName);

      const skillLevel = skill.level
        ? String(skill.level).toUpperCase().trim()
        : "BEGINNER";
      if (!VALID_SKILL_LEVELS.includes(skillLevel)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid level "${skill.level}" for skill "${skill.name}". Must be BEGINNER, INTERMEDIATE, or ADVANCED`,
          errorCode: "INVALID_SKILL",
        });
      }

      skill.name = skill.name.trim();
      skill.level = skillLevel;
    }
  }

  // Learning Goals validation
  if (body.learningGoals !== undefined) {
    if (!Array.isArray(body.learningGoals)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "learningGoals must be an array of goal objects",
        errorCode: "INVALID_GOAL",
      });
    }

    const seenGoals = new Set();

    for (const goal of body.learningGoals) {
      if (!goal || typeof goal !== "object") {
        return errorResponse(res, {
          statusCode: 400,
          message: "Each goal must be an object with name and priority",
          errorCode: "INVALID_GOAL",
        });
      }

      if (
        !goal.name ||
        typeof goal.name !== "string" ||
        goal.name.trim().length === 0
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Goal name is required and cannot be empty",
          errorCode: "INVALID_GOAL",
        });
      }

      const normName = goal.name.trim().toLowerCase();
      if (seenGoals.has(normName)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Duplicate goal "${goal.name}" detected in learningGoals`,
          errorCode: "INVALID_GOAL",
        });
      }
      seenGoals.add(normName);

      goal.name = goal.name.trim();

      // Normalize priority
      if (typeof goal.priority === "string") {
        const pStr = goal.priority.toUpperCase().trim();
        if (pStr === "HIGH") goal.priority = 3;
        else if (pStr === "MEDIUM") goal.priority = 2;
        else if (pStr === "LOW") goal.priority = 1;
        else goal.priority = 1;
      } else if (typeof goal.priority === "number") {
        goal.priority = Math.max(1, Math.round(goal.priority));
      } else {
        goal.priority = 1;
      }
    }
  }

  // Interests validation
  if (body.interests !== undefined) {
    if (!Array.isArray(body.interests)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "interests must be an array of strings",
        errorCode: "VALIDATION_ERROR",
      });
    }

    const seenInterests = new Set();
    const sanitizedInterests = [];

    for (const item of body.interests) {
      if (typeof item !== "string" || item.trim().length === 0) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Each interest must be a non-empty string",
          errorCode: "VALIDATION_ERROR",
        });
      }
      const trimmed = item.trim();
      const norm = trimmed.toLowerCase();
      if (!seenInterests.has(norm)) {
        seenInterests.add(norm);
        sanitizedInterests.push(trimmed);
      }
    }

    if (sanitizedInterests.length > 20) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Interests cannot exceed 20 entries",
        errorCode: "VALIDATION_ERROR",
      });
    }

    req.body.interests = sanitizedInterests;
  }

  // Learning Preferences validation
  if (body.learningPreferences !== undefined) {
    if (
      typeof body.learningPreferences !== "object" ||
      body.learningPreferences === null
    ) {
      return errorResponse(res, {
        statusCode: 400,
        message: "learningPreferences must be an object",
        errorCode: "INVALID_PREFERENCE",
      });
    }

    const { preferredFormat, preferredDifficulty, preferredSessionDuration } =
      body.learningPreferences;

    if (preferredFormat !== undefined) {
      const fmt = String(preferredFormat).toUpperCase().trim();
      if (!VALID_LEARNING_FORMATS.includes(fmt)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid preferredFormat. Allowed: ${VALID_LEARNING_FORMATS.join(", ")}`,
          errorCode: "INVALID_PREFERENCE",
        });
      }
      if (fmt === "ARTICLE" || fmt === "DOCUMENTATION") {
        body.learningPreferences.preferredFormat = "READING";
      } else {
        body.learningPreferences.preferredFormat = fmt;
      }
    }

    if (preferredDifficulty !== undefined) {
      const diff = String(preferredDifficulty).toUpperCase().trim();
      if (!VALID_EXPERIENCE_LEVELS.includes(diff)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid learning preference preferredDifficulty. Allowed: ${VALID_EXPERIENCE_LEVELS.join(", ")}`,
          errorCode: "INVALID_PREFERENCE",
        });
      }
      body.learningPreferences.preferredDifficulty = diff;
    }

    if (preferredSessionDuration !== undefined) {
      const dur = Number(preferredSessionDuration);
      if (isNaN(dur) || dur < 5 || dur > 480) {
        return errorResponse(res, {
          statusCode: 400,
          message: "preferredSessionDuration must be between 5 and 480 minutes",
          errorCode: "INVALID_PREFERENCE",
        });
      }
      body.learningPreferences.preferredSessionDuration = dur;
    }
  }

  // Weekly learning hours
  if (body.weeklyLearningHours !== undefined) {
    const hours = Number(body.weeklyLearningHours);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      return errorResponse(res, {
        statusCode: 400,
        message: "weeklyLearningHours must be a number between 1 and 168",
        errorCode: "VALIDATION_ERROR",
      });
    }
    req.body.weeklyLearningHours = hours;
  }

  next();
};

module.exports = {
  validateUpdateProfile,
  VALID_EDUCATION_LEVELS,
  VALID_EXPERIENCE_LEVELS,
};
