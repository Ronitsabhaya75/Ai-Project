const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeCode = async (code, question) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Analyze this code for the problem: ${question}
      Code: ${code}
      Return JSON with: { correctness: 0-10, timeComplexity: string, feedback: string }
    `;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    throw new Error("AI analysis failed");
  }
};