const pgp = require("pg-promise")({
  capSQL: true, // Capitalizes SQL for better readability
});
require("dotenv").config();

// Secure connection settings
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 30, // Connection pool size
  allowExitOnIdle: true, // Ensures the pool shuts down properly
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, // SSL for production
};

// Create a database connection
const db = pgp(config);

// Handle unexpected errors
db.connect()
  .then((obj) => {
    console.log("✅ Connected to the PostgreSQL database!");
    obj.done(); // Release the connection
  })
  .catch((error) => {
    console.error("❌ Database connection error:", error.message || error);
    process.exit(1); // Exit process if DB connection fails
  });

module.exports = db;
