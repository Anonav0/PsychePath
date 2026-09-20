const express = require("express");
const curriculumController = require("../controllers/curriculumController");
const {
  authenticate,
  optionalAuthenticate,
  authorizeRole,
} = require("../middleware/authMiddleware");
const {
  validateCreateModule,
  validateUpdateModule,
  validateModuleQuery,
} = require("../validators/curriculumValidator");

const router = express.Router();

// Browsing and Retrieval (Authenticated Student / Admin)
// Supports both /api/curriculum and /api/curriculum/modules
router.get(
  "/",
  authenticate,
  validateModuleQuery,
  curriculumController.getModules,
);
router.get(
  "/modules",
  authenticate,
  validateModuleQuery,
  curriculumController.getModules,
);

router.get("/:id", authenticate, curriculumController.getModuleById);
router.get("/modules/:id", authenticate, curriculumController.getModuleById);

// Admin Management operations
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  validateCreateModule,
  curriculumController.createModule,
);

router.post(
  "/modules",
  authenticate,
  authorizeRole("ADMIN"),
  validateCreateModule,
  curriculumController.createModule,
);

router.patch(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  validateUpdateModule,
  curriculumController.updateModule,
);

router.patch(
  "/modules/:id",
  authenticate,
  authorizeRole("ADMIN"),
  validateUpdateModule,
  curriculumController.updateModule,
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRole("ADMIN"),
  curriculumController.toggleStatus,
);

router.patch(
  "/modules/:id/status",
  authenticate,
  authorizeRole("ADMIN"),
  curriculumController.toggleStatus,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  curriculumController.deleteModule,
);

router.delete(
  "/modules/:id",
  authenticate,
  authorizeRole("ADMIN"),
  curriculumController.deleteModule,
);

module.exports = router;
