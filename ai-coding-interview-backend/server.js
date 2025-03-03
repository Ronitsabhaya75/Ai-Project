require("dotenv").config();
const express = require("express");
const { initializeData } = require("./scripts/insertQuestions");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use("/questions", require("./routes/questionRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/interview", require("./routes/interviewRoutes"));
app.use("/modules", require("./routes/moduleRoutes"));

// Ensure data is inserted on server start
initializeData()
  .then(() => console.log("✅ Data initialization completed successfully"))
  .catch((err) => console.error("❌ Error initializing data:", err));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
