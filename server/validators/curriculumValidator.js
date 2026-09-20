const mongoose = require("mongoose");
const { errorResponse } = require("../utils/apiResponse");

const VALID_CATEGORIES = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "DEVOPS",
  "AI_DATA_SCIENCE",
  "SYSTEM_DESIGN",
  "MOBILE",
  "CLOUD",
  "FOUNDATIONS",
];

const VALID_DIFFICULTY_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const VALID_SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const VALID_RESOURCE_TYPES = [
  "ARTICLE",
  "VIDEO",
  "DOCUMENTATION",
  "COURSE",
  "PRACTICE",
  "PROJECT",
];

const VALID_SORT_FIELDS = [
  "order",
  "-order",
  "title",
  "-title",
  "difficulty",
  "-difficulty",
  "estimatedDuration",
  "-estimatedDuration",
  "estimatedHours",
  "-estimatedHours",
  "createdAt",
  "-createdAt",
];

const VALID_SORT_KEYS = [
  "order",
  "title",
  "difficulty",
  "estimatedDuration",
  "estimatedHours",
  "createdAt",
  "category",
];

/**
 * Validates a resource URL to ensure it uses safe HTTP/HTTPS schemes
 */
const isValidHttpUrl = (string) => {
  if (!string || typeof string !== "string") return false;
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

/**
 * Validates module creation payload
 */
const validateCreateModule = (req, res, next) => {
  const {
    title,
    description,
    category,
    difficulty,
    estimatedDuration,
    estimatedHours,
    skills,
    learningObjectives,
    resources,
    prerequisites,
    order,
  } = req.body;

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Module title is required and must be at least 3 characters",
      errorCode: "CURRICULUM_MODULE_INVALID",
    });
  }

  if (title.trim().length > 150) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Module title cannot exceed 150 characters",
      errorCode: "CURRICULUM_MODULE_INVALID",
    });
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Module description is required and cannot be empty",
      errorCode: "CURRICULUM_MODULE_INVALID",
    });
  }

  if (
    !category ||
    typeof category !== "string" ||
    category.trim().length === 0
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Module category is required and cannot be empty",
      errorCode: "CURRICULUM_MODULE_INVALID",
    });
  }

  const cat = String(category).toUpperCase().trim();
  if (!VALID_CATEGORIES.includes(cat)) {
    return errorResponse(res, {
      statusCode: 400,
      message: `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      errorCode: "CURRICULUM_MODULE_INVALID",
    });
  }
  req.body.category = cat;

  const diff = difficulty
    ? String(difficulty).toUpperCase().trim()
    : "BEGINNER";
  if (!VALID_DIFFICULTY_LEVELS.includes(diff)) {
    return errorResponse(res, {
      statusCode: 400,
      message: `Invalid difficulty "${difficulty}". Must be one of: ${VALID_DIFFICULTY_LEVELS.join(", ")}`,
      errorCode: "CURRICULUM_MODULE_INVALID",
    });
  }
  req.body.difficulty = diff;

  const rawDuration =
    estimatedDuration !== undefined ? estimatedDuration : estimatedHours;
  if (
    rawDuration === undefined ||
    isNaN(Number(rawDuration)) ||
    Number(rawDuration) < 1
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Estimated duration must be a positive number (minimum 1 hour)",
      errorCode: "CURRICULUM_MODULE_INVALID",
    });
  }
  req.body.estimatedDuration = Number(rawDuration);

  // Skills validation & normalization
  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "skills must be an array",
        errorCode: "CURRICULUM_INVALID_SKILL",
      });
    }

    req.body.skills = skills.map((s) => {
      if (typeof s === "string") {
        return { name: s.trim(), level: "BEGINNER" };
      }
      return s;
    });

    for (const s of req.body.skills) {
      if (!s.name || typeof s.name !== "string" || s.name.trim().length === 0) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Each skill must have a valid non-empty name",
          errorCode: "CURRICULUM_INVALID_SKILL",
        });
      }
      const sLevel = s.level
        ? String(s.level).toUpperCase().trim()
        : "BEGINNER";
      if (!VALID_SKILL_LEVELS.includes(sLevel)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid skill level "${s.level}". Must be BEGINNER, INTERMEDIATE, or ADVANCED`,
          errorCode: "CURRICULUM_INVALID_SKILL",
        });
      }
      s.name = s.name.trim();
      s.level = sLevel;
    }
  }

  // Learning Objectives validation
  if (learningObjectives !== undefined) {
    if (!Array.isArray(learningObjectives)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "learningObjectives must be an array of strings",
        errorCode: "CURRICULUM_MODULE_INVALID",
      });
    }
    for (const obj of learningObjectives) {
      if (typeof obj !== "string" || obj.trim().length === 0) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Each learning objective must be a non-empty string",
          errorCode: "CURRICULUM_MODULE_INVALID",
        });
      }
    }
  }

  // Resources validation
  if (resources !== undefined) {
    if (!Array.isArray(resources)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "resources must be an array",
        errorCode: "CURRICULUM_INVALID_RESOURCE",
      });
    }

    for (const r of resources) {
      if (
        !r.title ||
        typeof r.title !== "string" ||
        r.title.trim().length === 0
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Resource title is required",
          errorCode: "CURRICULUM_INVALID_RESOURCE",
        });
      }

      if (
        r.type &&
        !VALID_RESOURCE_TYPES.includes(String(r.type).toUpperCase().trim())
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid resource type "${r.type}". Must be one of: ${VALID_RESOURCE_TYPES.join(", ")}`,
          errorCode: "CURRICULUM_INVALID_RESOURCE",
        });
      }

      // Strict URL security check
      if (r.url && r.url.trim().length > 0) {
        if (!isValidHttpUrl(r.url.trim())) {
          return errorResponse(res, {
            statusCode: 400,
            message: `Resource URL "${r.url}" is invalid. Must use http:// or https:// scheme`,
            errorCode: "CURRICULUM_INVALID_RESOURCE",
          });
        }
      }
    }
  }

  // Prerequisites array validation
  if (prerequisites !== undefined) {
    if (!Array.isArray(prerequisites)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "prerequisites must be an array of CurriculumModule IDs",
        errorCode: "CURRICULUM_INVALID_PREREQUISITE",
      });
    }

    for (const preId of prerequisites) {
      if (!mongoose.Types.ObjectId.isValid(preId)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid prerequisite ObjectId format: "${preId}"`,
          errorCode: "CURRICULUM_INVALID_PREREQUISITE",
        });
      }
    }
  }

  // Order validation
  if (order !== undefined) {
    const ord = Number(order);
    if (isNaN(ord) || ord < 1) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Order must be a positive integer (minimum 1)",
        errorCode: "CURRICULUM_MODULE_INVALID",
      });
    }
  }

  next();
};

/**
 * Validates module update payload
 */
const validateUpdateModule = (req, res, next) => {
  const body = req.body;

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length < 3) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Module title must be at least 3 characters",
        errorCode: "CURRICULUM_MODULE_INVALID",
      });
    }
  }

  if (body.category !== undefined) {
    const cat = String(body.category).toUpperCase().trim();
    if (!VALID_CATEGORIES.includes(cat)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Invalid category "${body.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        errorCode: "CURRICULUM_MODULE_INVALID",
      });
    }
    req.body.category = cat;
  }

  if (body.difficulty !== undefined) {
    const diff = String(body.difficulty).toUpperCase().trim();
    if (!VALID_DIFFICULTY_LEVELS.includes(diff)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Invalid difficulty. Allowed: ${VALID_DIFFICULTY_LEVELS.join(", ")}`,
        errorCode: "CURRICULUM_MODULE_INVALID",
      });
    }
    req.body.difficulty = diff;
  }

  const rawUpdateDuration =
    body.estimatedDuration !== undefined
      ? body.estimatedDuration
      : body.estimatedHours;
  if (rawUpdateDuration !== undefined) {
    const dur = Number(rawUpdateDuration);
    if (isNaN(dur) || dur < 1) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Estimated duration must be a positive number",
        errorCode: "CURRICULUM_MODULE_INVALID",
      });
    }
    req.body.estimatedDuration = dur;
  }

  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "skills must be an array",
        errorCode: "CURRICULUM_INVALID_SKILL",
      });
    }

    req.body.skills = body.skills.map((s) => {
      if (typeof s === "string") {
        return { name: s.trim(), level: "BEGINNER" };
      }
      return s;
    });

    for (const s of req.body.skills) {
      if (!s.name || typeof s.name !== "string" || s.name.trim().length === 0) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Each skill must have a valid non-empty name",
          errorCode: "CURRICULUM_INVALID_SKILL",
        });
      }
      const sLevel = s.level
        ? String(s.level).toUpperCase().trim()
        : "BEGINNER";
      if (!VALID_SKILL_LEVELS.includes(sLevel)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid skill level "${s.level}". Must be BEGINNER, INTERMEDIATE, or ADVANCED`,
          errorCode: "CURRICULUM_INVALID_SKILL",
        });
      }
      s.name = s.name.trim();
      s.level = sLevel;
    }
  }

  if (body.resources !== undefined && Array.isArray(body.resources)) {
    for (const r of body.resources) {
      if (r.url && r.url.trim().length > 0 && !isValidHttpUrl(r.url.trim())) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Resource URL "${r.url}" is invalid. Must use http:// or https:// scheme`,
          errorCode: "CURRICULUM_INVALID_RESOURCE",
        });
      }
    }
  }

  if (body.prerequisites !== undefined) {
    if (!Array.isArray(body.prerequisites)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "prerequisites must be an array of CurriculumModule IDs",
        errorCode: "CURRICULUM_INVALID_PREREQUISITE",
      });
    }

    for (const preId of body.prerequisites) {
      if (!mongoose.Types.ObjectId.isValid(preId)) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Invalid prerequisite ObjectId format: "${preId}"`,
          errorCode: "CURRICULUM_INVALID_PREREQUISITE",
        });
      }
    }
  }

  next();
};

/**
 * Validates query parameters for curriculum browsing/filtering
 */
const validateModuleQuery = (req, res, next) => {
  const { page, limit, sort, sortBy, sortOrder, difficulty, category } =
    req.query;

  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Query parameter "page" must be a positive integer',
        errorCode: "CURRICULUM_INVALID_QUERY",
      });
    }
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l < 1 || l > 100) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Query parameter "limit" must be between 1 and 100',
        errorCode: "CURRICULUM_INVALID_QUERY",
      });
    }
  }

  if (category !== undefined) {
    const cat = String(category).toUpperCase().trim();
    if (!VALID_CATEGORIES.includes(cat)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Query parameter "category" must be one of: ${VALID_CATEGORIES.join(", ")}`,
        errorCode: "CURRICULUM_INVALID_QUERY",
      });
    }
  }

  if (difficulty !== undefined) {
    const d = String(difficulty).toUpperCase().trim();
    if (!VALID_DIFFICULTY_LEVELS.includes(d)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Query parameter "difficulty" must be one of: ${VALID_DIFFICULTY_LEVELS.join(", ")}`,
        errorCode: "CURRICULUM_INVALID_QUERY",
      });
    }
  }

  if (sort !== undefined) {
    if (!VALID_SORT_FIELDS.includes(sort.trim())) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Query parameter "sort" must be one of: ${VALID_SORT_FIELDS.join(", ")}`,
        errorCode: "CURRICULUM_INVALID_QUERY",
      });
    }
  }

  if (sortBy !== undefined) {
    if (!VALID_SORT_KEYS.includes(sortBy.trim())) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Query parameter "sortBy" must be one of: ${VALID_SORT_KEYS.join(", ")}`,
        errorCode: "CURRICULUM_INVALID_QUERY",
      });
    }
  }

  if (sortOrder !== undefined) {
    const order = sortOrder.toLowerCase().trim();
    if (!["asc", "desc", "1", "-1"].includes(order)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Query parameter "sortOrder" must be "asc" or "desc"',
        errorCode: "CURRICULUM_INVALID_QUERY",
      });
    }
  }

  next();
};

module.exports = {
  VALID_CATEGORIES,
  VALID_DIFFICULTY_LEVELS,
  VALID_SKILL_LEVELS,
  VALID_RESOURCE_TYPES,
  VALID_SORT_FIELDS,
  VALID_SORT_KEYS,
  validateCreateModule,
  validateUpdateModule,
  validateModuleQuery,
  isValidHttpUrl,
};
