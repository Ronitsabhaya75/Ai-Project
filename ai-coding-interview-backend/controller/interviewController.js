const db = require("../config/database");
const { analyzeCode } = require("../service/geminiService");
const { executeCode } = require("../service/codeExecutor");
const sanitizeHtml = require("sanitize-html");

exports.startInterview = async (req, res) => {
  try {
    const { difficulty, topic } = req.body;

    if (!difficulty || !topic) {
      return res.status(400).json({ error: "Difficulty and topic are required" });
    }

    // Fetch next available question (150 predefined + user-submitted)
    const question = await db.oneOrNone(
      `SELECT q.*, array_agg(tc.input) as test_cases 
       FROM questions q
       LEFT JOIN test_cases tc ON q.id = tc.question_id
       WHERE q.difficulty = $1 
       AND q.topic = $2
       AND q.id NOT IN (
           SELECT question_id FROM interviews WHERE user_id = $3
       )
       GROUP BY q.id
       ORDER BY q.id
       LIMIT 1`,
      [difficulty, topic, req.user.id]
    );

    if (!question) {
      return res.status(404).json({ error: "No more questions available for this topic." });
    }

    // Insert into interviews table
    const interview = await db.one(
      "INSERT INTO interviews (user_id, question_id) VALUES ($1, $2) RETURNING id",
      [req.user.id, question.id]
    );

    res.json({
      interviewId: interview.id,
      question: question.question_text,
      testCases: question.test_cases,
    });
  } catch (error) {
    console.error("Interview Error:", error);
    res.status(500).json({ error: "Interview failed", details: error.message });
  }
};

exports.submitCode = async (req, res) => {
  try {
    let { code, interviewId } = req.body;
    if (!code || !interviewId) {
      return res.status(400).json({ error: "Missing data" });
    }

    // Sanitize code input
    code = sanitizeHtml(code, { allowedTags: [], allowedAttributes: {} });

    // Fetch interview details
    const interview = await db.oneOrNone(
      `SELECT i.*, q.*, array_agg(tc.input) as test_cases 
       FROM interviews i
       JOIN questions q ON i.question_id = q.id
       LEFT JOIN test_cases tc ON q.id = tc.question_id
       WHERE i.id = $1
       GROUP BY i.id, q.id`,
      [interviewId]
    );

    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    // Execute test cases
    const testResults = await executeCode(code, interview.test_cases);

    // Get AI feedback
    const aiFeedback = await analyzeCode(code, interview.question_text);

    // Update the interview with submission results
    await db.none(
      `UPDATE interviews 
       SET code_submission = $1, 
           ai_feedback = $2,
           test_results = $3
       WHERE id = $4`,
      [code, aiFeedback, testResults, interviewId]
    );

    res.json({ aiFeedback, testResults });
  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({
      error: "Submission failed",
      details: error.message,
    });
  }
};
