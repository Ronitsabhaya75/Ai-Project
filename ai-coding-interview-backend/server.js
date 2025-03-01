require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeData } = require("./scripts/insertQuestions");

const app = express();
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// Initialize data (modules and questions) on server start
initializeData()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize data:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/modules", require("./routes/moduleRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/interviews", require("./routes/interviewRoutes"));