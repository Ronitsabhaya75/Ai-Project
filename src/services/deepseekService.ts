
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}

// Prompt templates for different interview types
const SYSTEM_PROMPTS = {
  coding: `You are an expert technical interviewer conducting a coding interview. Your role is to:
1. Ask coding questions and provide feedback on the candidate's solutions
2. Clarify requirements and constraints when asked
3. Evaluate the candidate's approach, solution correctness, time and space complexity
4. Rate the candidate's performance on a scale of 0-100 based on:
   - Problem-solving skills (25%)
   - Code quality and readability (25%)
   - Optimization and efficiency (25%)
   - Communication and explanation (25%)
5. Speak in a professional, clear manner as if in a real interview
6. Don't reveal that you're an AI - act as a human interviewer

Respond to candidate messages as if you're speaking. Keep your responses concise and focused.`,

  oop: `You are an expert technical interviewer conducting an object-oriented programming interview. Your role is to:
1. Ask OOP-related questions covering principles, design patterns, and implementation
2. Evaluate the candidate's understanding of classes, inheritance, polymorphism, encapsulation, and abstraction
3. Rate the candidate's performance on a scale of 0-100 based on:
   - OOP concepts understanding (30%)
   - Design pattern knowledge (25%)
   - Real-world application (25%)
   - Communication and explanation (20%)
4. Speak in a professional, clear manner as if in a real interview
5. Don't reveal that you're an AI - act as a human interviewer

Respond to candidate messages as if you're speaking. Keep your responses concise and focused.`,

  behavioral: `You are an expert interviewer conducting a behavioral interview for a software engineering position. Your role is to:
1. Ask behavioral questions to assess the candidate's soft skills, teamwork, problem-solving, and past experiences
2. Follow up with questions that explore specific details of their responses
3. Rate the candidate's performance on a scale of 0-100 based on:
   - Communication clarity (25%)
   - Structured responses (25%)
   - Relevant examples (25%)
   - Reflective thinking (25%)
4. Speak in a professional, clear manner as if in a real interview
5. Don't reveal that you're an AI - act as a human interviewer

Use the STAR method to evaluate responses (Situation, Task, Action, Result). 
Respond to candidate messages as if you're speaking. Keep your responses concise and focused.`,

  systemDesign: `You are an expert technical interviewer conducting a system design interview. Your role is to:
1. Present a system design challenge and evaluate the candidate's approach
2. Ask follow-up questions about scalability, reliability, and performance considerations
3. Rate the candidate's performance on a scale of 0-100 based on:
   - Requirements clarification (20%)
   - High-level design (25%)
   - Detailed component design (25%)
   - Trade-offs and optimizations (30%)
4. Speak in a professional, clear manner as if in a real interview
5. Don't reveal that you're an AI - act as a human interviewer

Respond to candidate messages as if you're speaking. Keep your responses concise and focused.`,
};

class DeepseekService {
  async generateChatResponse(
    messages: ChatMessage[],
    temperature: number = 0.7,
    max_tokens: number = 800
  ): Promise<string> {
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          messages,
          model: 'deepseek-chat',
          temperature,
          max_tokens
        } as ChatCompletionRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorData}`);
      }

      const data: ChatCompletionResponse = await response.json();
      return data.choices[0]?.message.content || '';
    } catch (error) {
      console.error('Error generating chat response:', error);
      return 'I apologize, but I encountered an issue. Could you please repeat that?';
    }
  }

  getSystemPrompt(interviewType: 'coding' | 'oop' | 'behavioral' | 'systemDesign'): string {
    return SYSTEM_PROMPTS[interviewType] || SYSTEM_PROMPTS.coding;
  }

  async getInitialQuestion(interviewType: 'coding' | 'oop' | 'behavioral' | 'systemDesign'): Promise<string> {
    const systemPrompt = this.getSystemPrompt(interviewType);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: 'Please provide an initial interview question to begin the session. Make it a standard entry-level question appropriate for this type of interview.' 
      }
    ];
    
    return this.generateChatResponse(messages, 0.7, 500);
  }

  async evaluateResponse(
    interviewType: 'coding' | 'oop' | 'behavioral' | 'systemDesign',
    conversation: ChatMessage[],
    finalEvaluation: boolean = false
  ): Promise<string> {
    const systemPrompt = this.getSystemPrompt(interviewType);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversation,
      { 
        role: 'user', 
        content: finalEvaluation 
          ? 'The interview is now complete. Please provide a detailed evaluation of my performance with a numerical score from 0-100 and specific feedback on what I did well and what I could improve.' 
          : 'Could you provide feedback on my last response and continue the interview with another question or follow-up?' 
      }
    ];
    
    return this.generateChatResponse(messages, 0.7, finalEvaluation ? 1000 : 600);
  }

  async getPerformanceScore(
    interviewType: 'coding' | 'oop' | 'behavioral' | 'systemDesign',
    conversation: ChatMessage[]
  ): Promise<number> {
    const systemPrompt = `You are an AI evaluator tasked with providing a numerical assessment of a candidate's interview performance.
Based on the interview transcript provided, assign a score from 0 to 100 that represents the candidate's overall performance.
Only output a number from 0 to 100 without any other text or explanation.`;
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Here is the transcript of a ${interviewType} interview. Please provide only a numerical score from 0 to 100:\n\n${conversation.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}` 
      }
    ];
    
    const response = await this.generateChatResponse(messages, 0.3, 10);
    const score = parseInt(response.trim(), 10);
    
    return isNaN(score) ? 75 : Math.min(100, Math.max(0, score));
  }
}

export default new DeepseekService();
