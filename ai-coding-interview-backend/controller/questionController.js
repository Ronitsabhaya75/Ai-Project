const pool = require("../config/database");

exports.addQuestion = async (req, res) => {
  const { question_text, difficulty, company_tag } = req.body;

  if (!question_text || !difficulty || !company_tag) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await pool.query(
      "INSERT INTO questions (question_text, difficulty, company_tag) VALUES ($1, $2, $3)",
      [question_text, difficulty, company_tag]
    );
    res.status(201).json({ message: "Question added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error adding question", details: error.message });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM questions");
    console.log("Fetched Questions:", rows);  // Debug
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching questions:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getQuestionsByDifficulty = async (req, res) => {
  const { level } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM questions WHERE difficulty = $1",
      [level]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching questions", details: error.message });
  }
};

exports.getQuestionsByCompany = async (req, res) => {
  const { tag } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM questions WHERE company_tag = $1",
      [tag]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching questions", details: error.message });
  }
};