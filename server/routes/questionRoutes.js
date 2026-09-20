const express = require("express");
const questionController = require("../controllers/questionController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");
const { validateReorder } = require("../validators/questionValidator");

const router = express.Router();

// Admin individual question operations
router.get(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  questionController.getQuestionById,
);
router.patch(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  questionController.updateQuestion,
);
router.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  questionController.updateQuestion,
);
router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  questionController.deleteQuestion,
);

// Reordering
router.patch(
  "/:id/order",
  authenticate,
  authorizeRole("ADMIN"),
  validateReorder,
  questionController.reorderQuestion,
);
router.patch(
  "/:id/reorder",
  authenticate,
  authorizeRole("ADMIN"),
  validateReorder,
  questionController.reorderQuestion,
);

module.exports = router;
