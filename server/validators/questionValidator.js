const { errorResponse } = require("../utils/apiResponse");

const VALID_QUESTION_TYPES = [
  "LIKERT_SCALE",
  "MULTIPLE_CHOICE",
  "SINGLE_CHOICE",
];

/**
 * Validate question creation payload
 */
const validateCreateQuestion = (req, res, next) => {
  const { questionText, questionType, options, dimension, order } = req.body;

  if (
    !questionText ||
    typeof questionText !== "string" ||
    questionText.trim().length === 0
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Question text is required and must be a non-empty string",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (questionType && !VALID_QUESTION_TYPES.includes(questionType)) {
    return errorResponse(res, {
      statusCode: 400,
      message: `Question type must be one of: ${VALID_QUESTION_TYPES.join(", ")}`,
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Questions must have at least 2 options",
      errorCode: "VALIDATION_ERROR",
    });
  }

  for (const opt of options) {
    if (!opt.label || !opt.value) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Each option must contain both a label and a value",
        errorCode: "VALIDATION_ERROR",
      });
    }
  }

  if (
    !dimension ||
    typeof dimension !== "string" ||
    dimension.trim().length === 0
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Question dimension is required",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (order !== undefined) {
    const ord = Number(order);
    if (isNaN(ord) || ord < 1) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Question order must be a positive integer",
        errorCode: "VALIDATION_ERROR",
      });
    }
  }

  next();
};

/**
 * Validate reordering payload
 */
const validateReorder = (req, res, next) => {
  const { order } = req.body;
  const ord = Number(order);

  if (isNaN(ord) || ord < 1) {
    return errorResponse(res, {
      statusCode: 400,
      message: "New order must be a positive integer",
      errorCode: "VALIDATION_ERROR",
    });
  }

  next();
};

module.exports = {
  validateCreateQuestion,
  validateReorder,
};
