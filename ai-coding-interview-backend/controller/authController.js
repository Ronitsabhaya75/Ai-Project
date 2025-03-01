const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.none(
      'INSERT INTO users(email, password) VALUES($1, $2)',
      [email, hashedPassword]
    );
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.one('SELECT * FROM users WHERE email = $1', [email]);
    
    if (!await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized. Token is missing or invalid." });
    }

    const user = await db.one("SELECT id, email FROM users WHERE id = $1", [req.user.id]);
    res.status(200).json({ message: "Profile retrieved successfully", user });
  } catch (err) {
    console.error("❌ Error retrieving profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { signup, login, getProfile };