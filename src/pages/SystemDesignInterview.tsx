
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Home, LayoutTemplate, Server, Database, ArrowRight } from 'lucide-react';
import InterviewTimer from '@/components/InterviewTimer';
import SpeechHandler from '@/components/SpeechHandler';
import AIFeedback from '@/components/AIFeedback';
import LineChart, { DataPoint } from '@/components/LineChart';
import deepseekService from '@/services/deepseekService';

// Define the message type
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Define the interview stage
type InterviewStage = 'preparation' | 'interview' | 'results';

interface FeedbackItem {
  type: 'positive' | 'negative' | 'suggestion';
  content: string;
}

const SystemDesignInterview = () => {
  const navigate = useNavigate();
  
  const [stage, setStage] = useState<InterviewStage>('preparation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [performanceData, setPerformanceData] = useState<DataPoint[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState('');
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<ChatMessage[]>([]);

  // Update conversation history reference
  useEffect(() => {
    conversationHistoryRef.current = messages;
  }, [messages]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Start the interview
  const startInterview = async () => {
    setStage('interview');
    setIsProcessing(true);
    
    try {
      // Set initial system message
      const initialSystemMessage: ChatMessage = {
        role: 'system',
        content: deepseekService.getSystemPrompt('systemDesign')
      };
      
      setMessages([initialSystemMessage]);
      
      // Get the initial question from the AI
      const initialQuestion = await deepseekService.getInitialQuestion('systemDesign');
      
      // Add the AI's question to messages
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: initialQuestion
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setCurrentAiMessage(initialQuestion);
      
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process user's speech input
  const handleSpeechResult = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: transcript
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      // Get AI's response with explicit instructions to address the user's last message
      const aiResponse = await deepseekService.evaluateResponse(
        'systemDesign',
        [...conversationHistoryRef.current, userMessage],
        false // Not final evaluation
      );
      
      // Add AI's response to messages
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setCurrentAiMessage(aiResponse);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle completion of the interview
  const handleCompleteInterview = async () => {
    setIsProcessing(true);
    
    try {
      // Tell the AI we're ending the interview and ask for final feedback
      const completionMessage: ChatMessage = {
        role: 'user',
        content: 'The interview is now complete. Could you provide detailed feedback on my performance, including a score from 0-100?'
      };
      
      // Get final evaluation
      const finalEvaluation = await deepseekService.evaluateResponse(
        'systemDesign',
        [...conversationHistoryRef.current, completionMessage],
        true
      );
      
      // Add the final evaluation to messages
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: finalEvaluation
      };
      
      setMessages(prev => [...prev, completionMessage, aiMessage]);
      setCurrentAiMessage(finalEvaluation);
      
      // Get numerical score
      const score = await deepseekService.getPerformanceScore('systemDesign', conversationHistoryRef.current);
      setFinalScore(score);
      
      // Generate performance data for the chart
      const performancePoints: DataPoint[] = [];
      
      // Sample data points for the chart (in a real app, this would be based on actual performance metrics)
      for (let i = 1; i <= 5; i++) {
        const milestone = i * 20;
        const value = Math.min(100, Math.max(0, score - 15 + Math.random() * 30));
        performancePoints.push({
          name: `Milestone ${i}`,
          value: Math.round(value)
        });
      }
      
      // Ensure the final point is exactly the score
      performancePoints.push({
        name: 'Final',
        value: score
      });
      
      setPerformanceData(performancePoints);
      
      // Generate feedback items
      const parsedFeedback = parseFeedback(finalEvaluation);
      setFeedbackItems(parsedFeedback.items);
      setFeedbackSummary(parsedFeedback.summary);
      
      // Move to results stage
      setStage('results');
      setShowFeedback(true);
      
    } catch (error) {
      console.error('Error completing interview:', error);
      toast.error('Failed to complete interview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse feedback from AI response
  const parseFeedback = (response: string): { summary: string, items: FeedbackItem[] } => {
    // In a real app, you would implement more sophisticated parsing
    // This is a simplified version
    
    const summary = response.split('\n')[0] || 'Performance evaluation complete.';
    
    // Extract feedback items with basic heuristics
    const positivePattern = /(strength|did well|positive|excellent|good job|great)/i;
    const negativePattern = /(improve|weakness|lacking|missed|error|mistake|could have|should have)/i;
    const suggestionPattern = /(suggest|recommend|try|consider|next time)/i;
    
    const lines = response.split('\n').filter(line => line.trim().length > 10);
    
    const items: FeedbackItem[] = [];
    
    for (const line of lines) {
      const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
      if (cleanLine.length < 15) continue;
      
      if (positivePattern.test(cleanLine)) {
        items.push({ type: 'positive', content: cleanLine });
      } else if (negativePattern.test(cleanLine)) {
        items.push({ type: 'negative', content: cleanLine });
      } else if (suggestionPattern.test(cleanLine)) {
        items.push({ type: 'suggestion', content: cleanLine });
      }
    }
    
    // Ensure we have at least one item of each type
    if (!items.some(item => item.type === 'positive')) {
      items.push({ type: 'positive', content: 'You demonstrated knowledge of system design principles during the interview.' });
    }
    
    if (!items.some(item => item.type === 'negative')) {
      items.push({ type: 'negative', content: 'Consider giving more specific details about system architecture and data flow.' });
    }
    
    if (!items.some(item => item.type === 'suggestion')) {
      items.push({ type: 'suggestion', content: 'Practice drawing out system diagrams and explain trade-offs between different solutions.' });
    }
    
    return { summary, items };
  };

  // Handle the timer running out
  const handleTimeUp = () => {
    toast.warning('Time is up! Concluding the interview.');
    
    // In a full app, you might want to give a grace period before automatically ending the interview
    setTimeout(() => {
      if (stage === 'interview') {
        handleCompleteInterview();
      }
    }, 10000); // 10-second grace period
  };

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header with navigation and timer */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
                onClick={() => navigate('/dashboard')}
              >
                <Home size={16} className="mr-1" />
                Dashboard
              </Button>
              <ArrowRight size={14} className="text-white/40" />
              <span className="text-white flex items-center gap-1">
                <LayoutTemplate size={16} />
                System Design Interview
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">
              {stage === 'preparation' ? 'Prepare for System Design Interview' : 
               stage === 'results' ? 'Interview Results' : 
               'System Design Interview'}
            </h1>
          </div>
          
          {stage === 'interview' && (
            <div className="w-full md:w-auto">
              <InterviewTimer duration={45} onTimeUp={handleTimeUp} />
            </div>
          )}
        </div>

        {/* Preparation Stage */}
        {stage === 'preparation' && (
          <div className="glass-panel p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Ready to Begin</h2>
            <p className="text-white/70 mb-6">
              You are about to start a 45-minute System Design interview. The AI interviewer 
              will ask you to design a complex system and evaluate your approach, focusing on 
              scalability, reliability, and performance considerations.
            </p>
            
            <div className="glass-panel p-4 mb-6">
              <h3 className="text-lg font-medium text-radium mb-3">Common System Design Questions</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start">
                  <span className="text-radium mr-2">•</span>
                  <span>Design a URL shortening service like TinyURL</span>
                </li>
                <li className="flex items-start">
                  <span className="text-radium mr-2">•</span>
                  <span>Design Twitter or a social media feed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-radium mr-2">•</span>
                  <span>Design a distributed cache system</span>
                </li>
                <li className="flex items-start">
                  <span className="text-radium mr-2">•</span>
                  <span>Design a video streaming service like YouTube</span>
                </li>
                <li className="flex items-start">
                  <span className="text-radium mr-2">•</span>
                  <span>Design a rate limiter for an API service</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Tips for Success:</h3>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Begin by clarifying requirements and constraints</li>
                <li>Consider both functional and non-functional requirements</li>
                <li>Explain high-level architecture before diving into details</li>
                <li>Discuss trade-offs in your design decisions</li>
                <li>Address scalability, reliability, and performance</li>
                <li>Be prepared to iterate based on feedback</li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button 
                  className="btn-primary"
                  onClick={startInterview}
                >
                  Start Interview
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white/80 hover:bg-white/10"
                  onClick={() => navigate('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Stage */}
        {stage === 'interview' && (
          <div className="animate-fade-in">
            <Card className="glass-panel h-[500px] flex flex-col overflow-hidden mb-6">
              <div className="p-4 bg-dark-lighter border-b border-white/10">
                <h2 className="text-white font-medium">Interview Conversation</h2>
              </div>
              
              <div 
                ref={messagesContainerRef}
                className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide"
              >
                {/* Skip the system message when rendering */}
                {messages.slice(1).map((message, index) => (
                  <div 
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-radium/20 text-white' 
                          : 'bg-dark-lighter text-white/90'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] p-3 rounded-lg bg-dark-lighter">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <SpeechHandler 
                  onSpeechResult={handleSpeechResult}
                  isAiSpeaking={isAiSpeaking}
                  setIsAiSpeaking={setIsAiSpeaking}
                  aiMessage={currentAiMessage}
                />
              </div>
              
              <div className="lg:w-1/3">
                <Card className="glass-panel p-4">
                  <CardContent className="p-0">
                    <h3 className="text-lg font-medium text-radium mb-3">System Design Components</h3>
                    <ul className="space-y-3 text-white/80 text-sm">
                      <li className="flex items-start">
                        <Server size={16} className="text-radium mr-2 flex-shrink-0 mt-1" />
                        <div>
                          <span className="font-medium text-white">Load Balancers</span>
                          <p className="text-white/60 text-xs mt-1">
                            Distribute traffic across multiple servers for reliability and scalability
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Database size={16} className="text-radium mr-2 flex-shrink-0 mt-1" />
                        <div>
                          <span className="font-medium text-white">Database Options</span>
                          <p className="text-white/60 text-xs mt-1">
                            SQL vs NoSQL, sharding, replication, and caching strategies
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <LayoutTemplate size={16} className="text-radium mr-2 flex-shrink-0 mt-1" />
                        <div>
                          <span className="font-medium text-white">System Architecture</span>
                          <p className="text-white/60 text-xs mt-1">
                            Monolithic vs microservices, event-driven architecture
                          </p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                className="btn-primary"
                onClick={handleCompleteInterview}
                disabled={isProcessing || messages.length <= 2}
              >
                Complete Interview
              </Button>
            </div>
          </div>
        )}

        {/* Results Stage */}
        {stage === 'results' && (
          <div className="animate-fade-in">
            <div className="glass-panel p-6 mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Interview Complete</h2>
              <p className="text-white/70">
                You've completed the System Design interview. Review your performance below.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
              <div className="lg:col-span-3">
                <AIFeedback
                  score={finalScore}
                  summary={feedbackSummary}
                  feedbackItems={feedbackItems}
                  loading={!showFeedback}
                />
              </div>
              
              <div className="lg:col-span-2">
                <LineChart
                  data={performanceData}
                  title="Performance Throughout Interview"
                  height={300}
                  color="#4C8BF5"
                />
              </div>
            </div>
            
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Interview Transcript</h3>
              <div className="max-h-[300px] overflow-y-auto border border-white/10 rounded-lg p-4 bg-dark-lighter text-white/80 text-sm space-y-4">
                {messages.slice(1).map((message, index) => (
                  <div key={index} className="space-y-1">
                    <div className={`font-medium ${message.role === 'assistant' ? 'text-radium' : 'text-white'}`}>
                      {message.role === 'assistant' ? 'Interviewer' : 'You'}:
                    </div>
                    <p className="whitespace-pre-wrap pl-4">{message.content}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button 
                  className="btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Return to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white/80 hover:bg-white/10"
                  onClick={() => {
                    // Reset the interview state
                    setStage('preparation');
                    setMessages([]);
                    setCurrentAiMessage('');
                    setFinalScore(0);
                    setPerformanceData([]);
                    setFeedbackItems([]);
                    setFeedbackSummary('');
                  }}
                >
                  Start New Interview
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDesignInterview;
