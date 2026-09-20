const express = require("express");
const recommendationController = require("../controllers/recommendationController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  validateRecommendationQuery,
} = require("../validators/recommendationValidator");

const router = express.Router();

// Supported endpoints:
// GET /api/recommendations
// GET /api/recommendations/modules
router.get(
  "/",
  authenticate,
  validateRecommendationQuery,
  recommendationController.getRecommendations,
);
router.get(
  "/modules",
  authenticate,
  validateRecommendationQuery,
  recommendationController.getRecommendations,
);

module.exports = router;
