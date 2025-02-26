// routes/questionRoutes.js
const express = require("express");
const router = express.Router();
const questionController = require("../controller/questionController");
const authMiddleware = require("../middleware/authMiddleware");

// Add a new question (protected by auth)
router.post("/add", authMiddleware, questionController.addQuestion);

// Other routes (GET)
router.get("/all", questionController.getAllQuestions);
router.get("/difficulty/:level", questionController.getQuestionsByDifficulty);
router.get("/company/:tag", questionController.getQuestionsByCompany);

module.exports = router;