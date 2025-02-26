const db = require("../config/database");
const { analyzeCode } = require("../service/geminiService");

exports.startInterview = async (req, res) => {
  try {
    const { difficulty } = req.body;
    const question = await db.one(
      "SELECT * FROM questions WHERE difficulty = $1 ORDER BY RANDOM() LIMIT 1", 
      [difficulty]
    );
    
    const interview = await db.one(
      "INSERT INTO interviews (user_id, question_id) VALUES ($1, $2) RETURNING id",
      [req.user.userId, question.id]
    );

    res.json({ 
      interviewId: interview.id,
      question: question.question_text 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to start interview" });
  }
};

exports.submitCode = async (req, res) => {
  try {
    const { code, interviewId } = req.body;
    const interview = await db.one("SELECT * FROM interviews WHERE id = $1", [interviewId]);
    const question = await db.one("SELECT * FROM questions WHERE id = $1", [interview.question_id]);

    // Get AI feedback
    const aiFeedback = await analyzeCode(code, question.question_text);

    // Save to DB
    await db.none(
      "UPDATE interviews SET code_submission = $1, ai_feedback = $2 WHERE id = $3",
      [code, aiFeedback, interviewId]
    );

    // Update progress
    await db.none(
      `INSERT INTO progress (user_id, total_sessions, avg_score)
       VALUES ($1, 1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET total_sessions = progress.total_sessions + 1,
           avg_score = (progress.avg_score * progress.total_sessions + $2) / (progress.total_sessions + 1)`,
      [req.user.userId, aiFeedback.correctness]
    );

    res.json(aiFeedback);
  } catch (error) {
    res.status(500).json({ error: "Code submission failed" });
  }
};

module.exports = exports;