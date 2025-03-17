
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Home, UserCheck, ArrowRight, Star, StarHalf } from 'lucide-react';
import InterviewTimer from '@/components/InterviewTimer';
import SpeechHandler from '@/components/SpeechHandler';
import AIFeedback from '@/components/AIFeedback';
import LineChart, { DataPoint } from '@/components/LineChart';
import deepseekService from '@/services/deepseekService';
import { getBehavioralQuestions } from '@/utils/questions';

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

const BehavioralInterview = () => {
  const navigate = useNavigate();
  const behavioralQuestions = getBehavioralQuestions();
  
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
  const [starRatings, setStarRatings] = useState({
    clarity: 0,
    structure: 0,
    relevance: 0,
    reflection: 0
  });
  
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
        content: deepseekService.getSystemPrompt('behavioral')
      };
      
      setMessages([initialSystemMessage]);
      
      // Get the initial question from the AI
      const initialQuestion = await deepseekService.getInitialQuestion('behavioral');
      
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
      // Get AI's response
      const aiResponse = await deepseekService.generateChatResponse(
        [...conversationHistoryRef.current, userMessage]
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
        'behavioral',
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
      const score = await deepseekService.getPerformanceScore('behavioral', conversationHistoryRef.current);
      setFinalScore(score);
      
      // Generate performance data for the chart
      const performancePoints: DataPoint[] = [];
      
      // Sample data points for the chart (in a real app, this would be based on actual performance metrics)
      for (let i = 1; i <= 5; i++) {
        const milestone = i * 20;
        const value = Math.min(100, Math.max(0, score - 15 + Math.random() * 30));
        performancePoints.push({
          name: `Q${i}`,
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
      
      // Generate star ratings based on the score
      setStarRatings({
        clarity: Math.round((score * 0.25 + Math.random() * 5) / 20),
        structure: Math.round((score * 0.25 + Math.random() * 5) / 20),
        relevance: Math.round((score * 0.25 + Math.random() * 5) / 20),
        reflection: Math.round((score * 0.25 + Math.random() * 5) / 20)
      });
      
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
      items.push({ type: 'positive', content: 'You showed willingness to engage with the behavioral questions and provided responses.' });
    }
    
    if (!items.some(item => item.type === 'negative')) {
      items.push({ type: 'negative', content: 'Try to be more specific in your examples and use the STAR method more consistently.' });
    }
    
    if (!items.some(item => item.type === 'suggestion')) {
      items.push({ type: 'suggestion', content: 'Prepare a few key stories from your experience that can be adapted to different behavioral questions.' });
    }
    
    return { summary, items };
  };

  // Generate star display for ratings
  const renderStars = (rating: number) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<StarHalf key={i} className="h-4 w-4 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-white/20" />);
      }
    }
    
    return stars;
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
                <UserCheck size={16} />
                Behavioral Interview
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">
              {stage === 'preparation' ? 'Prepare for Behavioral Interview' : 
               stage === 'results' ? 'Interview Results' : 
               'Behavioral Interview'}
            </h1>
          </div>
          
          {stage === 'interview' && (
            <div className="w-full md:w-auto">
              <InterviewTimer duration={30} onTimeUp={handleTimeUp} />
            </div>
          )}
        </div>

        {/* Preparation Stage */}
        {stage === 'preparation' && (
          <div className="glass-panel p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Ready to Begin</h2>
            <p className="text-white/70 mb-6">
              You are about to start a 30-minute behavioral interview. The AI interviewer will ask you 
              questions about your past experiences, challenges, and how you handled specific situations.
            </p>
            
            <div className="glass-panel p-4 mb-6">
              <h3 className="text-lg font-medium text-radium mb-3">Sample Behavioral Questions</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                {behavioralQuestions.slice(0, 5).map((question, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-radium mr-2">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">STAR Method:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-3">
                  <div className="text-radium font-medium mb-1">Situation</div>
                  <p className="text-white/70 text-sm">
                    Describe the context and specific situation you faced
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-radium font-medium mb-1">Task</div>
                  <p className="text-white/70 text-sm">
                    Explain your responsibility or the challenge you needed to address
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-radium font-medium mb-1">Action</div>
                  <p className="text-white/70 text-sm">
                    Describe specifically what you did to handle the situation
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-radium font-medium mb-1">Result</div>
                  <p className="text-white/70 text-sm">
                    Share the outcomes of your actions and what you learned
                  </p>
                </div>
              </div>
              
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
                    <h3 className="text-lg font-medium text-radium mb-3">STAR Method</h3>
                    <ul className="space-y-2 text-white/80 text-sm">
                      <li>
                        <span className="font-medium text-white">S</span>ituation - Set the scene
                      </li>
                      <li>
                        <span className="font-medium text-white">T</span>ask - Describe your responsibility
                      </li>
                      <li>
                        <span className="font-medium text-white">A</span>ction - Explain what you did
                      </li>
                      <li>
                        <span className="font-medium text-white">R</span>esult - Share the outcome
                      </li>
                    </ul>
                    
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-white font-medium mb-2">Communication Tips:</h4>
                      <ul className="text-white/70 text-xs space-y-1">
                        <li>• Be specific, not general</li>
                        <li>• Quantify results when possible</li>
                        <li>• Keep answers concise (1-2 minutes)</li>
                        <li>• Highlight your personal contribution</li>
                        <li>• Use positive framing for challenges</li>
                      </ul>
                    </div>
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
                You've completed the behavioral interview. Review your performance below.
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
                  color="#FFBD2E"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-4">Communication Skills</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Clarity of Communication</span>
                    <div className="flex">{renderStars(starRatings.clarity)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">STAR Structure</span>
                    <div className="flex">{renderStars(starRatings.structure)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Relevance of Examples</span>
                    <div className="flex">{renderStars(starRatings.relevance)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Self-Reflection</span>
                    <div className="flex">{renderStars(starRatings.reflection)}</div>
                  </div>
                </div>
              </div>
              
              <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-4">Interview Highlights</h3>
                <div className="space-y-4 text-sm text-white/80">
                  {/* Extract some highlights from the messages */}
                  {messages.filter(m => m.role === 'user').slice(-3).map((message, index) => (
                    <div key={index} className="border-l-2 border-radium/50 pl-3 py-1">
                      <p className="italic">
                        {message.content.length > 120
                          ? `"${message.content.substring(0, 120)}..."`
                          : `"${message.content}"`
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                    setStarRatings({
                      clarity: 0,
                      structure: 0,
                      relevance: 0,
                      reflection: 0
                    });
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

export default BehavioralInterview;
