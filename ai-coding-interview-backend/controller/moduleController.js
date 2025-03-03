const db = require('../config/database');

const initializeModules = async () => {
  try {
    await db.none(`
      INSERT INTO modules (name, order_position) VALUES
      ('Arrays & Hashing', 1),
      ('Two Pointers', 2),
      ('Stacks', 3),
      ('Binary Search', 4),
      ('Sliding Window', 5),
      ('Linked List', 6),
      ('Trees', 7),
      ('Backtracking', 8),
      ('Heap/Priority Queue', 9),
      ('Graphs', 10),
      ('1-D DP', 11),
      ('Intervals', 12),
      ('Greedy', 13),
      ('Advanced Graphs', 14),
      ('2-D DP', 15),
      ('Bit Manipulation', 16),
      ('Math & Geometry', 17)
      ON CONFLICT DO NOTHING
    `);
  } catch (error) {
    console.error('Error initializing modules:', error);
  }
};

const getRoadmap = async (req, res) => {
  try {
    const roadmap = await db.many(`
      SELECT m.*, up.completed_at IS NOT NULL as completed
      FROM modules m
      LEFT JOIN user_progress up ON m.id = up.module_id AND up.user_id = $1
      ORDER BY m.order_position
    `, [req.user.id]);
    
    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { initializeModules, getRoadmap };