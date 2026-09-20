const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Strict RBAC: All admin endpoints require valid JWT and ADMIN role
router.use(authenticate, authorizeRole("ADMIN"));

// Overview Stats
router.get("/stats", adminController.getStats);

// Learner Management
router.get("/learners", adminController.getLearners);
router.get("/learners/:id", adminController.getLearnerDetails);
router.patch("/learners/:id/status", adminController.toggleLearnerStatus);

module.exports = router;
