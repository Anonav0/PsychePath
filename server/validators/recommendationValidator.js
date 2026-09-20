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

const VALID_DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

/**
 * Validates query parameters for the recommendation endpoint
 */
const validateRecommendationQuery = (req, res, next) => {
  const { limit, difficulty, category } = req.query;

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l < 1 || l > 20) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Query parameter "limit" must be an integer between 1 and 20',
        errorCode: "INVALID_RECOMMENDATION_QUERY",
      });
    }
  }

  if (difficulty !== undefined) {
    const diff = String(difficulty).toUpperCase().trim();
    if (!VALID_DIFFICULTIES.includes(diff)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Query parameter "difficulty" must be one of: ${VALID_DIFFICULTIES.join(", ")}`,
        errorCode: "INVALID_RECOMMENDATION_QUERY",
      });
    }
  }

  if (category !== undefined) {
    const cat = String(category).toUpperCase().trim();
    if (!VALID_CATEGORIES.includes(cat)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Query parameter "category" must be one of: ${VALID_CATEGORIES.join(", ")}`,
        errorCode: "INVALID_RECOMMENDATION_QUERY",
      });
    }
  }

  next();
};

module.exports = {
  validateRecommendationQuery,
  VALID_CATEGORIES,
  VALID_DIFFICULTIES,
};
