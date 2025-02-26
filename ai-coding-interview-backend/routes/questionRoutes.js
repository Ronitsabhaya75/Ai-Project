const express = require("express");
const { getAllQuestions, createQuestion, getRandomQuestion } = require("../controller/questionController");

const router = express.Router();

router.get("/", getAllQuestions);
router.post("/", createQuestion);
router.get("/random", getRandomQuestion);

module.exports = router;
