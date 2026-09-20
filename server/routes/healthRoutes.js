const express = require("express");
const healthController = require("../controllers/healthController");

const router = express.Router();

// GET /api/health
router.get("/", healthController.getHealth);

module.exports = router;
