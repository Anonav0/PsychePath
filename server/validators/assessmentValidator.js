const { errorResponse } = require("../utils/apiResponse");

const VALID_ASSESSMENT_TYPES = [
  "LEARNING_STYLE",
  "SKILLS",
  "PERSONALITY_PROFILE",
  "GENERAL",
];

/**
 * Validate assessment creation payload
 */
const validateCreateAssessment = (req, res, next) => {
  const {
    title,
    description,
    type,
    dimensions,
    estimatedDuration,
    scoringConfig,
  } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Assessment title is required and must be a non-empty string",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (title.trim().length > 120) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Assessment title cannot exceed 120 characters",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Assessment description is required",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (type && !VALID_ASSESSMENT_TYPES.includes(type)) {
    return errorResponse(res, {
      statusCode: 400,
      message: `Invalid assessment type. Must be one of: ${VALID_ASSESSMENT_TYPES.join(", ")}`,
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (dimensions !== undefined) {
    if (!Array.isArray(dimensions)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Dimensions must be an array of dimension definitions",
        errorCode: "VALIDATION_ERROR",
      });
    }

    for (const dim of dimensions) {
      if (
        !dim.key ||
        typeof dim.key !== "string" ||
        !dim.name ||
        typeof dim.name !== "string"
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Each dimension must have a non-empty key and name",
          errorCode: "VALIDATION_ERROR",
        });
      }
    }
  }

  if (estimatedDuration !== undefined) {
    const dur = Number(estimatedDuration);
    if (isNaN(dur) || dur < 1) {
      return errorResponse(res, {
        statusCode: 400,
        message:
          "Estimated duration must be a positive number (minimum 1 minute)",
        errorCode: "VALIDATION_ERROR",
      });
    }
  }

  next();
};

/**
 * Validate assessment update payload
 */
const validateUpdateAssessment = (req, res, next) => {
  const { title, description, type, dimensions, estimatedDuration } = req.body;

  if (
    title !== undefined &&
    (typeof title !== "string" ||
      title.trim().length === 0 ||
      title.trim().length > 120)
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Assessment title must be between 1 and 120 characters",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (type !== undefined && !VALID_ASSESSMENT_TYPES.includes(type)) {
    return errorResponse(res, {
      statusCode: 400,
      message: `Invalid assessment type. Must be one of: ${VALID_ASSESSMENT_TYPES.join(", ")}`,
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (dimensions !== undefined) {
    if (!Array.isArray(dimensions)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Dimensions must be an array",
        errorCode: "VALIDATION_ERROR",
      });
    }
  }

  if (
    estimatedDuration !== undefined &&
    (isNaN(Number(estimatedDuration)) || Number(estimatedDuration) < 1)
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Estimated duration must be a positive number",
      errorCode: "VALIDATION_ERROR",
    });
  }

  next();
};

module.exports = {
  validateCreateAssessment,
  validateUpdateAssessment,
};
