const db = require('../config/database');

const checkModuleAccess = async (req, res, next) => {
  try {
    const currentModule = await db.one(
      'SELECT order_position FROM modules WHERE id = $1',
      [req.body.module_id]
    );

    const userProgress = await db.one(
      `SELECT MAX(order_position) as max_position
       FROM user_progress
       JOIN modules ON modules.id = user_progress.module_id
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (userProgress.max_position < currentModule.order_position - 1) {
      return res.status(403).json({
        error: 'Complete previous module first'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkRoadmapCompletion = async (req, res, next) => {
  try {
    const totalModules = await db.one('SELECT COUNT(*) FROM modules');
    const completedModules = await db.one(
      'SELECT COUNT(*) FROM user_progress WHERE user_id = $1',
      [req.user.id]
    );

    if (completedModules.count < totalModules.count) {
      return res.status(403).json({
        error: 'Complete all roadmap modules to unlock custom problems'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { checkModuleAccess, checkRoadmapCompletion };