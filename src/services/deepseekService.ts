
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

Respond to candidate messages as if you're speaking. Keep your responses concise and focused.
Always wait for the candidate to finish their thought before moving on to a new question.
Don't interrupt with new questions if they're in the middle of explaining their approach.`,

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

Respond to candidate messages as if you're speaking. Keep your responses concise and focused.
Always wait for the candidate to complete their thoughts before asking follow-up questions.
Don't introduce new topics until the current one has been fully explored.`,

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
Respond to candidate messages as if you're speaking. Keep your responses concise and focused.
Always wait for the candidate to finish their story or example before asking follow-up questions.`,

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

Respond to candidate messages as if you're speaking. Keep your responses concise and focused.
Allow the candidate to fully explore each component of their design before moving to the next topic.
Don't interrupt their explanations with new requirements until they've completed their current thought.`,
};

class DeepseekService {
  private useApiIfAvailable = true;
  private lastUserMessage = '';
  private lastAiResponse = '';
  private currentConversationId = '';
  private interviewProgress = 0; // 0-100 indicating progress through the interview
  
  async generateChatResponse(
    messages: ChatMessage[],
    temperature: number = 0.7,
    max_tokens: number = 800
  ): Promise<string> {
    const currentUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // Reset interview progress if a new question is detected
    if (currentUserMessage.includes('I will be conducting a coding interview with you today')) {
      this.interviewProgress = 0;
      this.currentConversationId = Date.now().toString();
    } else if (currentUserMessage.toLowerCase().includes('how was the interview') || 
               currentUserMessage.toLowerCase().includes('rate my performance')) {
      this.interviewProgress = 100;
    } else {
      // Increment the progress for each interaction
      this.interviewProgress = Math.min(95, this.interviewProgress + 5);
    }
    
    if (currentUserMessage === this.lastUserMessage && this.lastAiResponse) {
      const systemDirective: ChatMessage = {
        role: 'system',
        content: 'Please provide a different, progressive response than your last answer. Move the conversation forward without repeating yourself. Respond directly to what the candidate is saying.'
      };
      messages = [...messages, systemDirective];
    }
    
    if (!this.useApiIfAvailable) {
      const mockResponse = this.getMockResponse(messages, currentUserMessage);
      
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
          return this.getMockResponse(messages, currentUserMessage);
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
      
      const mockResponse = this.getMockResponse(messages, currentUserMessage);
      
      this.lastUserMessage = currentUserMessage;
      this.lastAiResponse = mockResponse;
      
      return mockResponse;
    }
  }

  private getMockResponse(messages: ChatMessage[], currentUserMessage: string): string {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    
    let interviewType: 'coding' | 'oop' | 'behavioral' | 'systemDesign' = 'coding';
    
    if (systemMessage.includes('object-oriented programming')) {
      interviewType = 'oop';
    } else if (systemMessage.includes('behavioral interview')) {
      interviewType = 'behavioral';
    } else if (systemMessage.includes('system design')) {
      interviewType = 'systemDesign';
    }
    
    // Check for specific message types
    const isInitialQuestion = messages.some(m => 
      m.role === 'user' && 
      (m.content.includes('initial interview question') || m.content.includes('conducting a coding interview with you today'))
    );
    
    const isFinalFeedback = messages.some(m => 
      m.role === 'user' && 
      (m.content.includes('interview is now complete') || 
       m.content.includes('provide detailed feedback') ||
       m.content.toLowerCase().includes('how was the interview') ||
       m.content.toLowerCase().includes('rate my performance'))
    );
    
    const isRatingRequest = currentUserMessage.toLowerCase().includes('rate if it was google') || 
                           currentUserMessage.toLowerCase().includes('rate all skills');
    
    const containsCode = currentUserMessage.includes('```') || 
                         currentUserMessage.includes('class ') ||
                         currentUserMessage.includes('def ') ||
                         currentUserMessage.includes('function') ||
                         currentUserMessage.includes('I\'ve written this code');
                         
    // Analyze the question type for better responses
    const isQuestionAboutApproach = currentUserMessage.toLowerCase().includes('approach') || 
                                    currentUserMessage.toLowerCase().includes('solve');
    
    const isAskingForClarification = currentUserMessage.length < 60 && 
                                    (currentUserMessage.toLowerCase().includes('?') || 
                                     currentUserMessage.toLowerCase().includes('will') ||
                                     currentUserMessage.toLowerCase().includes('can') ||
                                     currentUserMessage.toLowerCase().includes('what') ||
                                     currentUserMessage.toLowerCase().includes('how'));
                                     
    const isExplainingApproach = currentUserMessage.length > 60 && 
                                !containsCode &&
                                !isRatingRequest;
                                
    const isShortAcknowledgment = currentUserMessage.length < 10;
    
    // Provide mock responses based on message analysis
    if (isInitialQuestion) {
      return "Let's begin our coding interview. Could you walk me through your approach to solving this problem? How would you tackle it?";
    } else if (isFinalFeedback) {
      return "You did well in the interview. Your problem-solving approach was methodical, and you arrived at an optimal solution with O(n) time complexity. Your communication was clear once you settled on an approach. To improve, I'd suggest being more confident in your initial problem breakdown and discussing edge cases more thoroughly. Overall, I'd rate your performance at 85/100.";
    } else if (isRatingRequest) {
      if (currentUserMessage.toLowerCase().includes('google')) {
        return "For a Google interview, I'd rate your performance around 8/10. You demonstrated strong problem-solving skills and arrived at an optimal solution using Cantor's Diagonalization technique. Your time and space complexity analysis was accurate. Areas for improvement would be more clarity in your initial approach and more thorough discussion of edge cases, which are important aspects in Google interviews.";
      } else {
        return "Here's my assessment of your skills:\n\n1. Problem Understanding: 8/10 - You grasped the core problem quickly.\n2. Algorithm Design: 9/10 - Your final approach was elegant and optimal.\n3. Code Implementation: 7/10 - Some initial syntax issues, but your final implementation was clean.\n4. Communication: 8/10 - You explained your thought process clearly.\n5. Complexity Analysis: 9/10 - Your time and space complexity analysis was spot-on.\n6. Edge Case Handling: 7/10 - More detailed discussion would strengthen this area.\n7. Debugging: 8/10 - You identified and corrected issues efficiently.\n8. Overall: 8/10 - Strong performance, particularly in finding an optimal solution.";
      }
    } else if (containsCode) {
      if (currentUserMessage.includes("no code")) {
        return "I see you're thinking through the problem step by step, which is a good approach. Could you elaborate on how you would implement this solution? What specific data structures would you use, and how would you ensure your solution handles all possible cases?";
      }
      return "I've analyzed your code. You're using Cantor's Diagonalization method which is an elegant solution. By flipping each bit along the diagonal, you ensure your result differs from every string in the input array. The time complexity is O(n) and space complexity is O(n), which is optimal. One small issue: your loop should use range(len(nums)) instead of (0, len(nums)) to iterate through all indices. Would you like to explain why this approach guarantees a valid answer?";
    } else if (isAskingForClarification) {
      const clarificationResponses = [
        "Yes, that's correct. The problem states that we need to find a binary string (containing only 0s and 1s) of length n that isn't present in the given array.",
        "Good question. The strings will all be of length n, and the array will contain n unique strings. This means there are 2^n possible binary strings of length n, but only n of them are in the array, so there must be at least one string not present.",
        "That's an important clarification. The strings will only contain '0' and '1' characters since they're binary strings. No other characters will be present.",
        "The length of each string will be equal to n, which is also the length of the input array. So if nums has 3 strings, each string will be 3 characters long."
      ];
      
      // Return a consistent response based on the question
      const hashCode = currentUserMessage.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      return clarificationResponses[Math.abs(hashCode) % clarificationResponses.length];
    } else if (isExplainingApproach) {
      return "That's a good approach. Using a hash set to track strings is efficient for lookups. The key insight is that with n strings of length n, there are 2^n possible binary strings, but only n of them are in the array. This guarantees at least one string is missing. How would you implement this to find a missing string efficiently?";
    } else if (isShortAcknowledgment) {
      return "Could you elaborate more on your approach? I'd like to understand how you're thinking about this problem in detail.";
    } else {
      // Default responses based on interview progress
      const progressResponses = [
        "That's a good start. Can you explain how you would handle edge cases in your solution?",
        "Interesting approach. How would you analyze the time and space complexity of this solution?",
        "You're on the right track. Let's discuss optimization possibilities. Can you think of a way to improve the efficiency further?",
        "I like your thinking. Now, how would you implement this algorithm in code?",
        "Great progress. Let's step back and consider: is there an even more elegant solution to this problem?"
      ];
      
      const progressIndex = Math.floor(this.interviewProgress / 20);
      return progressResponses[Math.min(progressIndex, progressResponses.length - 1)];
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
      : 'Please respond directly to my last message. If I asked a question, answer it. If I provided an approach or solution, give feedback. Don\'t change the subject unless my response is complete.';
    
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
