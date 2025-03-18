import { toast } from "sonner";

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
7. Don't repeat the same message - always progress the conversation forward
8. When code is submitted, analyze it in detail and provide specific feedback

When the candidate submits code, thoroughly evaluate it considering:
- Correctness (does it work for all test cases?)
- Time and space complexity (is it optimal?)
- Code style and readability
- Edge case handling

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

const MOCK_RESPONSES = {
  coding: {
    initial: "Today, I'd like you to implement a function that finds two numbers in an array that add up to a specific target. Could you start by explaining your approach to this problem?",
    feedback: "I've reviewed your solution. Your approach using a hash map to track values as you iterate through the array is efficient, giving us O(n) time complexity. Good job identifying that this avoids the nested loop O(n²) solution. You've also handled edge cases well. I'd score your solution at 85/100. To improve, consider discussing the space complexity trade-offs and perhaps mentioning alternative approaches even if they're less optimal."
  },
  oop: {
    initial: "Let's start with a fundamental question. Could you explain the four main principles of Object-Oriented Programming and provide an example of each?",
    feedback: "You've demonstrated a solid understanding of OOP principles. Your explanation of encapsulation, inheritance, polymorphism, and abstraction was clear. I particularly liked your real-world examples. You could improve by discussing some design patterns and their practical applications. Overall, I'd rate your performance at 82/100. You showed good conceptual knowledge but could strengthen the discussion of trade-offs between different OOP approaches."
  },
  behavioral: {
    initial: "Tell me about a time when you faced a significant challenge in a project and how you overcame it.",
    feedback: "You provided a well-structured response using the STAR method. Your example about the challenging project deadline was relevant and demonstrated your problem-solving skills. I appreciate how you highlighted both your individual contribution and team collaboration. For improvement, try to quantify your impact more precisely. I'd rate your performance at 88/100. Your communication was clear, though sometimes your examples could be more concise and focused."
  },
  systemDesign: {
    initial: "Today I'd like you to design a URL shortening service similar to TinyURL or bit.ly. Can you walk me through your approach to designing this system?",
    feedback: "Your system design solution demonstrated good knowledge of the key components needed. You correctly identified the need for a URL mapping database, a hashing function, and an API layer. Your discussion of scalability using a distributed cache was particularly strong. Areas for improvement include more detailed discussion of database partitioning strategies and analytics capabilities. Overall, I'd rate your performance at 78/100. You covered the core aspects well but could go deeper on reliability and data consistency concerns."
  }
};

class DeepseekService {
  private useApiIfAvailable = true;
  private lastUserMessage = '';
  private lastAiResponse = '';
  
  async generateChatResponse(
    messages: ChatMessage[],
    temperature: number = 0.7,
    max_tokens: number = 800
  ): Promise<string> {
    const currentUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    if (currentUserMessage === this.lastUserMessage && this.lastAiResponse) {
      const systemDirective: ChatMessage = {
        role: 'system',
        content: 'Please provide a different, progressive response than your last answer. Move the conversation forward.'
      };
      messages = [...messages, systemDirective];
    }
    
    if (!this.useApiIfAvailable) {
      const mockResponse = this.getMockResponse(messages);
      
      this.lastUserMessage = currentUserMessage;
      this.lastAiResponse = mockResponse;
      
      return mockResponse;
    }
    
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
        console.error(`API request failed: ${response.status} - ${errorData}`);
        
        if (response.status === 402) {
          this.useApiIfAvailable = false;
          toast.error("DeepSeek API credits depleted. Using simulated AI responses.");
          return this.getMockResponse(messages);
        }
        
        throw new Error(`API request failed: ${response.status} - ${errorData}`);
      }

      const data: ChatCompletionResponse = await response.json();
      const aiResponse = data.choices[0]?.message.content || '';
      
      this.lastUserMessage = currentUserMessage;
      this.lastAiResponse = aiResponse;
      
      return aiResponse;
    } catch (error) {
      console.error('Error generating chat response:', error);
      
      this.useApiIfAvailable = false;
      toast.error("Failed to reach DeepSeek API. Using simulated AI responses.");
      
      const mockResponse = this.getMockResponse(messages);
      
      this.lastUserMessage = currentUserMessage;
      this.lastAiResponse = mockResponse;
      
      return mockResponse;
    }
  }

  private getMockResponse(messages: ChatMessage[]): string {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    
    let interviewType: 'coding' | 'oop' | 'behavioral' | 'systemDesign' = 'coding';
    
    if (systemMessage.includes('object-oriented programming')) {
      interviewType = 'oop';
    } else if (systemMessage.includes('behavioral interview')) {
      interviewType = 'behavioral';
    } else if (systemMessage.includes('system design')) {
      interviewType = 'systemDesign';
    }
    
    const isInitialQuestion = messages.length <= 2 && messages.some(m => 
      m.role === 'user' && 
      m.content.includes('initial interview question')
    );
    
    const isFinalFeedback = messages.some(m => 
      m.role === 'user' && 
      (m.content.includes('interview is now complete') || m.content.includes('provide detailed feedback'))
    );
    
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const containsCode = lastUserMessage.includes('```') || 
                         lastUserMessage.includes('I\'ve written this code');
    
    if (isInitialQuestion) {
      return MOCK_RESPONSES[interviewType].initial;
    } else if (isFinalFeedback) {
      return MOCK_RESPONSES[interviewType].feedback;
    } else if (containsCode) {
      return "I've analyzed your code. Your solution correctly addresses the problem. The time complexity is O(n) and space complexity is O(n), which is optimal for this problem. You've handled the edge cases well. I particularly like how you used a dictionary/hash map to store previously seen values, which allows for a single-pass solution. As a follow-up question: Can you think of a way to optimize the space complexity further?";
    } else {
      if (lastUserMessage.length < 50) {
        if (lastUserMessage.toLowerCase().includes('time complexity') || 
            lastUserMessage.toLowerCase().includes('big o')) {
          return "Great question about time complexity. For this problem, the optimal solution has O(n) time complexity using a hash map approach. A brute force solution using nested loops would be O(n²). Can you walk me through how you'd implement the O(n) solution?";
        } else if (lastUserMessage.toLowerCase().includes('edge case') || 
                  lastUserMessage.toLowerCase().includes('special case')) {
          return "Regarding edge cases, you should consider: empty arrays (though the problem states at least 2 elements), arrays with negative numbers, and the possibility of the same element being used twice (which is not allowed). How would your code handle these scenarios?";
        } else {
          return "That's a good point. Could you elaborate more on your approach? I'd like to understand how you're planning to find the pair of numbers that sum to the target value.";
        }
      } else {
        return "You've provided a thorough explanation of your approach. I like that you're considering both a brute force solution and a more optimized hash map solution. The hash map approach is indeed more efficient, giving us O(n) time complexity instead of O(n²). Let's move forward with implementation. How would you code this solution?";
      }
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
    
    let promptMessage = finalEvaluation 
      ? 'The interview is now complete. Please provide a detailed evaluation of my performance with a numerical score from 0-100 and specific feedback on what I did well and what I could improve.' 
      : 'Please provide direct feedback on my last response and continue the interview with a follow-up question. Make sure to address any misconceptions or inaccuracies in my previous answer.';
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversation,
      { 
        role: 'user', 
        content: promptMessage 
      }
    ];
    
    return this.generateChatResponse(messages, 0.7, finalEvaluation ? 1000 : 600);
  }

  async getPerformanceScore(
    interviewType: 'coding' | 'oop' | 'behavioral' | 'systemDesign',
    conversation: ChatMessage[]
  ): Promise<number> {
    if (!this.useApiIfAvailable) {
      const scores = {
        coding: 85,
        oop: 82,
        behavioral: 88,
        systemDesign: 78
      };
      
      return scores[interviewType];
    }
    
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
    
    try {
      const response = await this.generateChatResponse(messages, 0.3, 10);
      const score = parseInt(response.trim(), 10);
      
      return isNaN(score) ? 75 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Error getting performance score:', error);
      return 75;
    }
  }
}

export default new DeepseekService();
