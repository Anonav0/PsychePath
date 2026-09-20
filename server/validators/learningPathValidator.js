const mongoose = require("mongoose");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Validates path ID parameter is a valid MongoDB ObjectId
 */
const validatePathId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid learning path ID format",
      errorCode: "INVALID_PATH_ID",
    });
  }

  next();
};

/**
 * Validates optional query or body options for learning path generation
 */
const validatePathOptions = (req, res, next) => {
  const maxModules = req.body?.maxModules || req.query?.maxModules;

  if (maxModules !== undefined) {
    const num = parseInt(maxModules, 10);
    if (isNaN(num) || num < 1 || num > 20) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Parameter 'maxModules' must be an integer between 1 and 20",
        errorCode: "INVALID_PATH_OPTIONS",
      });
    }
  }

  next();
};

module.exports = {
  validatePathId,
  validatePathOptions,
};
