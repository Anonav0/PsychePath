const express = require("express");
const authController = require("../controllers/authController");
const {
  validateRegister,
  validateLogin,
} = require("../validators/authValidators");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Public authentication routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);

// Protected routes requiring authentication
router.get("/me", authenticate, authController.getMe);

// Role-protected test routes for RBAC verification
router.get(
  "/student-test",
  authenticate,
  authorizeRole("STUDENT"),
  authController.studentTest,
);
router.get(
  "/admin-test",
  authenticate,
  authorizeRole("ADMIN"),
  authController.adminTest,
);

module.exports = router;
