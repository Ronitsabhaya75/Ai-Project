const pool = require("../config/database");

const createQuestion = async (req, res) => {
    const { question_text, difficulty } = req.body;

    if (!question_text || !difficulty) {
        return res.status(400).json({ error: "Question text and difficulty are required" });
    }

    try {
        const newQuestion = await pool.query(
            "INSERT INTO questions (question_text, difficulty) VALUES ($1, $2) RETURNING *",
            [question_text, difficulty]
        );
        res.status(201).json(newQuestion.rows[0]);
    } catch (err) {
        console.error("Error creating question:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        const questions = await pool.query("SELECT * FROM questions");
        res.status(200).json(questions.rows);
    } catch (err) {
        console.error("Error fetching questions:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getRandomQuestion = async (req, res) => {
    try {
        const question = await pool.query("SELECT * FROM questions ORDER BY RANDOM() LIMIT 1");
        res.status(200).json(question.rows[0]);
    } catch (err) {
        console.error("Error fetching random question:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { createQuestion, getAllQuestions, getRandomQuestion };

