const mongoose = require("mongoose");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Validate answer saving payload
 */
const validateSaveAnswer = (req, res, next) => {
  // Support either single answer or batch answers
  const answers = Array.isArray(req.body.answers)
    ? req.body.answers
    : req.body.questionId
      ? [
          {
            questionId: req.body.questionId,
            selectedValue: req.body.selectedValue,
            selectedOption: req.body.selectedOption,
          },
        ]
      : null;

  if (!answers || answers.length === 0) {
    return errorResponse(res, {
      statusCode: 400,
      message:
        "At least one answer with questionId and selectedValue is required",
      errorCode: "VALIDATION_ERROR",
    });
  }

  for (const ans of answers) {
    if (!ans.questionId || !mongoose.Types.ObjectId.isValid(ans.questionId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Invalid questionId format: ${ans.questionId}`,
        errorCode: "VALIDATION_ERROR",
      });
    }

    if (
      ans.selectedValue === undefined ||
      ans.selectedValue === null ||
      String(ans.selectedValue).trim() === ""
    ) {
      return errorResponse(res, {
        statusCode: 400,
        message: `selectedValue is required for question ${ans.questionId}`,
        errorCode: "VALIDATION_ERROR",
      });
    }

    // Security check: Explicitly delete any client-attempted score manipulation
    delete ans.score;
    delete ans.dimensionScores;
  }

  // Attach sanitized answers array to request
  req.sanitizedAnswers = answers;
  next();
};

module.exports = {
  validateSaveAnswer,
};
