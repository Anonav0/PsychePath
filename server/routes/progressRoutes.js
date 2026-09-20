const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  validateProgressAction,
  validateProgressUpdate,
  validatePathIdParam,
  validateHistoryQuery,
} = require("../validators/progressValidator");

// All progress endpoints require authentication
router.use(authenticate);

// Module progress action mutations
router.post("/start", validateProgressAction, progressController.startModule);
router.patch("/", validateProgressUpdate, progressController.updateProgress);
router.post(
  "/complete",
  validateProgressAction,
  progressController.completeModule,
);
router.post("/skip", validateProgressAction, progressController.skipModule);

// Learning path progress queries
router.get("/current", progressController.getCurrentPathProgress);
router.get(
  "/summary/:learningPathId",
  validatePathIdParam,
  progressController.getPathSummary,
);
router.get(
  "/:learningPathId/history",
  validatePathIdParam,
  validateHistoryQuery,
  progressController.getPathHistory,
);
router.get(
  "/:learningPathId",
  validatePathIdParam,
  progressController.getPathProgress,
);

module.exports = router;
