const axios = require("axios");
const { APIError } = require("../utils/errors");

const analyzeCode = async (code, question) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) throw new APIError("Missing API configuration", 500);
    
    if (!code || !question) throw new APIError("Code and question cannot be empty", 400);

    const prompt = `
    **Code Analysis Task**
    Question: ${question}
    Code: ${code}

    Evaluate based on:
    1. Correctness (0-5) - Does it solve the problem?
    2. Efficiency (0-5) - Time/space complexity
    3. Best Practices (0-5) - Readability, proper naming
    4. Edge Cases - Which are handled?

    Respond in JSON format:
    {
      "scores": {
        "correctness": number,
        "efficiency": number,
        "best_practices": number
      },
      "edge_cases": {
        "handled": string[],
        "missing": string[]
      },
      "feedback": string,
      "security_concerns": string[]
    }`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { timeout: 10000 }
    );

    // Ensure valid response structure
    const result = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) throw new APIError("Invalid AI response", 502);

    return JSON.parse(result);
  } catch (error) {
    console.error("AI Analysis Failed:", error.message);

    if (error.response) {
      console.error("API Response Error:", error.response.data);
    } else if (error.request) {
      console.error("API Request Failed:", error.request);
    }

    throw new APIError("AI analysis unavailable", 503);
  }
};

module.exports = { analyzeCode };
