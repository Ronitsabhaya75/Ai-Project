require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./config/database");
const { WebSocketServer } = require("ws");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/interviews", require("./routes/interviewRoutes"));

// WebSocket for real-time feedback
const wss = new WebSocketServer({ port: 8080 });
wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const { code, question } = JSON.parse(message);
    const feedback = await analyzeCode(code, question);
    ws.send(JSON.stringify(feedback));
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));