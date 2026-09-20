const mongoose = require("mongoose");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Validates request body for module progress actions (start, complete, skip)
 */
const validateProgressAction = (req, res, next) => {
  const { learningPathId, moduleId } = req.body || {};

  if (!learningPathId || !mongoose.Types.ObjectId.isValid(learningPathId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Valid learningPathId is required",
      errorCode: "INVALID_LEARNING_PATH_ID",
    });
  }

  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Valid moduleId is required",
      errorCode: "INVALID_MODULE_ID",
    });
  }

  next();
};

/**
 * Validates request body for progress updates (includes percentage check)
 */
const validateProgressUpdate = (req, res, next) => {
  const { learningPathId, moduleId, percentage } = req.body || {};

  if (!learningPathId || !mongoose.Types.ObjectId.isValid(learningPathId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Valid learningPathId is required",
      errorCode: "INVALID_LEARNING_PATH_ID",
    });
  }

  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Valid moduleId is required",
      errorCode: "INVALID_MODULE_ID",
    });
  }

  if (
    percentage === undefined ||
    percentage === null ||
    typeof percentage !== "number" ||
    isNaN(percentage) ||
    !isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Percentage must be a finite number between 0 and 100",
      errorCode: "INVALID_PROGRESS_PERCENTAGE",
    });
  }

  next();
};

/**
 * Validates learningPathId route parameter
 */
const validatePathIdParam = (req, res, next) => {
  const { learningPathId } = req.params;

  if (!learningPathId || !mongoose.Types.ObjectId.isValid(learningPathId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid learningPathId parameter format",
      errorCode: "INVALID_LEARNING_PATH_ID",
    });
  }

  next();
};

/**
 * Validates history query parameters (pagination & optional moduleId)
 */
const validateHistoryQuery = (req, res, next) => {
  const { moduleId, page, limit } = req.query;

  if (moduleId && !mongoose.Types.ObjectId.isValid(moduleId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid moduleId query parameter format",
      errorCode: "INVALID_MODULE_ID",
    });
  }

  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Query parameter 'page' must be a positive integer",
        errorCode: "INVALID_PAGINATION",
      });
    }
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l < 1 || l > 100) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Query parameter 'limit' must be an integer between 1 and 100",
        errorCode: "INVALID_PAGINATION",
      });
    }
  }

  next();
};

module.exports = {
  validateProgressAction,
  validateProgressUpdate,
  validatePathIdParam,
  validateHistoryQuery,
};
