const express = require("express");
const router = express.Router();
const interviewController = require("../controller/interviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/start", authMiddleware, interviewController.startInterview);
router.post("/submit", authMiddleware, interviewController.submitCode);

module.exports = router;