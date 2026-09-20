const express = require("express");
const learnerProfileController = require("../controllers/learnerProfileController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");
const {
  validateUpdateProfile,
} = require("../validators/learnerProfileValidator");

const router = express.Router();

// Student self-managed learner profile endpoints
router.get(
  "/me",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  learnerProfileController.getMyProfile,
);

router.patch(
  "/me",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  validateUpdateProfile,
  learnerProfileController.updateMyProfile,
);

router.post(
  "/me",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  validateUpdateProfile,
  learnerProfileController.updateMyProfile,
);

// Transform completed assessment into learner profile
router.post(
  "/me/generate-from-assessment/:attemptId",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  learnerProfileController.generateFromAssessment,
);

router.post(
  "/generate-from-assessment/:attemptId",
  authenticate,
  authorizeRole("STUDENT", "ADMIN"),
  learnerProfileController.generateFromAssessment,
);

// Admin-only profile inspection by user ID
router.get(
  "/:userId",
  authenticate,
  authorizeRole("ADMIN"),
  learnerProfileController.getProfileByUserId,
);

module.exports = router;
