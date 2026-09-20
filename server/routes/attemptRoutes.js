const express = require("express");
const attemptController = require("../controllers/attemptController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");
const { validateSaveAnswer } = require("../validators/attemptValidator");

const router = express.Router();

// Student attempt history
router.get(
  "/my",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  attemptController.getMyAttempts,
);

// Admin all attempts listing
router.get(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  attemptController.getAllAttempts,
);

// Save / update answers (Supports both PATCH and POST)
router.patch(
  "/:attemptId/answers",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  validateSaveAnswer,
  attemptController.saveAnswers,
);

router.post(
  "/:attemptId/answers",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  validateSaveAnswer,
  attemptController.saveAnswers,
);

// Submit assessment attempt for backend scoring
router.post(
  "/:attemptId/submit",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  attemptController.submitAttempt,
);

// Get assessment result (Student owner or Admin)
router.get(
  "/:attemptId/result",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  attemptController.getAttemptResult,
);

module.exports = router;
