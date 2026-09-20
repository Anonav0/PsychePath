const express = require("express");
const assessmentController = require("../controllers/assessmentController");
const questionController = require("../controllers/questionController");
const attemptController = require("../controllers/attemptController");
const {
  authenticate,
  optionalAuthenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");
const {
  validateCreateAssessment,
  validateUpdateAssessment,
} = require("../validators/assessmentValidator");
const { validateCreateQuestion } = require("../validators/questionValidator");

const router = express.Router();

// Assessment Listing & Retrieval (Public / Student sanitized, Admin full)
router.get("/", optionalAuthenticate, assessmentController.getAssessments);
router.get(
  "/:id",
  optionalAuthenticate,
  assessmentController.getAssessmentById,
);

// Admin Assessment Management
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  validateCreateAssessment,
  assessmentController.createAssessment,
);

router.patch(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  validateUpdateAssessment,
  assessmentController.updateAssessment,
);

router.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  validateUpdateAssessment,
  assessmentController.updateAssessment,
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRole("ADMIN"),
  assessmentController.toggleStatus,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  assessmentController.deleteAssessment,
);

// Question delivery & management within an assessment
router.get(
  "/:assessmentId/questions",
  optionalAuthenticate,
  questionController.getQuestions,
);

router.post(
  "/:assessmentId/questions",
  authenticate,
  authorizeRole("ADMIN"),
  validateCreateQuestion,
  questionController.addQuestion,
);

// Assessment attempt lifecycle endpoints
router.post(
  "/:assessmentId/attempts",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  attemptController.startAttempt,
);

router.get(
  "/:assessmentId/attempts/active",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  attemptController.getActiveAttempt,
);

module.exports = router;
