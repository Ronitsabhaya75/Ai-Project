const express = require("express");
const router = express.Router();
const moduleController = require("../controller/moduleController");
const authMiddleware = require("../middleware/authMiddleware");

// Get roadmap progress
router.get("/", authMiddleware, moduleController.getRoadmap);

module.exports = router;