import { APIError } from "../middleware/errorHandler.js"

export const analyzeCode = async (code, question) => {
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Response Error:", errorData);
      throw new APIError("AI analysis unavailable", response.status);
    }

    const data = await response.json();

    // Ensure valid response structure
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) throw new APIError("Invalid AI response", 502);

    return JSON.parse(result);
  } catch (error) {
    console.error("AI Analysis Failed:", error.message);

    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("API Request Timed Out");
      throw new APIError("AI analysis timed out", 504);
    }

    throw new APIError("AI analysis unavailable", 503);
  }
};

