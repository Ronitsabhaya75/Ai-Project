const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signupUser = async (req, res) => {
  console.log("Received Data:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
  }

  try {
      // Check if the email already exists
      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (existingUser.rows.length > 0) {
          return res.status(409).json({ error: "Email already exists. Please use a different email." });
      }

      // Hash the password before storing it
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const newUser = await pool.query(
          "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
          [email, hashedPassword]
      );

      res.status(201).json({ message: "Signup successful!", user: newUser.rows[0] });
  } catch (err) {
      console.error("❌ Signup Error:", err);
      res.status(500).json({ error: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
    console.log("Received Data:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Check if the password matches
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful!", token });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getProfile = async (req, res) => {
  try {
      if (!req.user || !req.user.id) {  // Ensure req.user is properly set
          return res.status(401).json({ error: "Unauthorized. Token is missing or invalid." });
      }

      const user = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.user.id]);

      if (user.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ message: "Profile retrieved successfully", user: user.rows[0] });
  } catch (err) {
      console.error("❌ Error retrieving profile:", err);
      res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { signupUser, loginUser, getProfile };
