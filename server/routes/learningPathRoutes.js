const express = require("express");
const learningPathController = require("../controllers/learningPathController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  validatePathId,
  validatePathOptions,
} = require("../validators/learningPathValidator");

const router = express.Router();

// All learning path routes require authentication
router.use(authenticate);

// Generate new learning path
router.post(
  "/generate",
  validatePathOptions,
  learningPathController.generateLearningPath,
);

// Explicit regeneration workflow
router.post(
  "/regenerate",
  validatePathOptions,
  learningPathController.regenerateLearningPath,
);

// Get current active path
router.get("/current", learningPathController.getCurrentPath);
router.get("/", learningPathController.getCurrentPath);

// Get path version history
router.get("/history", learningPathController.getPathHistory);

// Get specific path by ID (enforces ownership)
router.get("/:id", validatePathId, learningPathController.getPathById);

module.exports = router;
