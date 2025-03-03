const express = require("express");
const { addQuestion, getAllQuestions, getQuestionsByDifficulty, getQuestionsByCompany } = require("../controller/questionController");

const router = express.Router();

router.post("/add", addQuestion); // Add a new question
router.get("/", getAllQuestions); // Get all questions
router.get("/difficulty/:level", getQuestionsByDifficulty); // Get questions by difficulty
router.get("/company/:tag", getQuestionsByCompany); // Get questions by company

module.exports = router;
