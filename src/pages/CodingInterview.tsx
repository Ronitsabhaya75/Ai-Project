
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Home, Code, Play, ArrowLeft, ArrowRight } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import InterviewTimer from '@/components/InterviewTimer';
import SpeechHandler from '@/components/SpeechHandler';
import AIFeedback from '@/components/AIFeedback';
import LineChart, { DataPoint } from '@/components/LineChart';
import deepseekService from '@/services/deepseekService';
import { useCodingQuestions, CodingQuestion } from '@/utils/questions';

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

const CodingInterview = () => {
  const navigate = useNavigate();
  const { getRandomQuestion, isLoading: isLoadingQuestions } = useCodingQuestions();
  
  const [currentQuestion, setCurrentQuestion] = useState<CodingQuestion | null>(null);
  const [stage, setStage] = useState<InterviewStage>('preparation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCode, setUserCode] = useState('');
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

  // Load a random coding question
  useEffect(() => {
    if (stage === 'preparation' && !currentQuestion && !isLoadingQuestions) {
      const question = getRandomQuestion();
      setCurrentQuestion(question);
      
      // Set initial message with the question
      if (question) {
        const initialSystemMessage: ChatMessage = {
          role: 'system',
          content: deepseekService.getSystemPrompt('coding')
        };
        
        setMessages([initialSystemMessage]);
      }
    }
  }, [stage, currentQuestion, isLoadingQuestions, getRandomQuestion]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Start the interview with an initial question from the AI
  const startInterview = async () => {
    if (!currentQuestion) {
      toast.error('Failed to load question. Please refresh and try again.');
      return;
    }
    
    setStage('interview');
    setIsProcessing(true);
    
    try {
      // Format the coding question for the AI
      const questionPrompt = `I will be conducting a coding interview with you today. The question is: ${currentQuestion.title}. ${currentQuestion.content}`;
      
      // Add the interview question as a user message
      const questionMessage: ChatMessage = {
        role: 'user',
        content: questionPrompt
      };
      
      // Add to messages
      setMessages(prev => [...prev, questionMessage]);
      
      // Get AI's initial response
      const initialResponse = await deepseekService.generateChatResponse(
        [...conversationHistoryRef.current, questionMessage]
      );
      
      // Add AI's response to messages
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: initialResponse
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setCurrentAiMessage(initialResponse);
      
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

  // Handle running the code
  const handleRunCode = (code: string) => {
    setUserCode(code);
    
    // In a real app, this would send the code to a backend for execution
    toast.info('Code execution is simulated in this demo');
    
    // Add code submission as a user message
    const codeMessage: ChatMessage = {
      role: 'user',
      content: `I've written this code to solve the problem:\n\n\`\`\`\n${code}\n\`\`\``
    };
    
    handleSpeechResult(codeMessage.content);
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
        'coding',
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
      const score = await deepseekService.getPerformanceScore('coding', conversationHistoryRef.current);
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
      items.push({ type: 'positive', content: 'You attempted to solve the problem and engaged with the interview process.' });
    }
    
    if (!items.some(item => item.type === 'negative')) {
      items.push({ type: 'negative', content: 'Consider working on more practice problems to improve your problem-solving speed.' });
    }
    
    if (!items.some(item => item.type === 'suggestion')) {
      items.push({ type: 'suggestion', content: 'Practice explaining your thought process while coding to enhance communication skills.' });
    }
    
    return { summary, items };
  };

  // Handle the timer running out
  const handleTimeUp = () => {
    toast.warning('Time is up! Please wrap up your solution.');
    
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
                <Code size={16} />
                Coding Interview
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">
              {stage === 'preparation' ? 'Prepare for Coding Interview' : 
               stage === 'results' ? 'Interview Results' : 
               currentQuestion?.title || 'Coding Challenge'}
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
              You are about to start a 45-minute coding interview. The AI interviewer will present you 
              with a coding problem, and you can discuss your approach verbally before coding your solution.
            </p>
            
            {currentQuestion ? (
              <div className="glass-panel p-4 mb-6">
                <h3 className="text-lg font-medium text-radium mb-2">{currentQuestion.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    currentQuestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                    currentQuestion.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <div className="text-white/80 text-sm">
                  Preview: This problem will ask you to {currentQuestion.title.toLowerCase()}.
                </div>
              </div>
            ) : (
              <div className="glass-panel p-4 mb-6 animate-pulse">
                <div className="h-6 w-3/4 bg-white/10 rounded mb-3"></div>
                <div className="h-4 w-1/4 bg-white/10 rounded mb-4"></div>
                <div className="h-16 w-full bg-white/10 rounded"></div>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Tips for Success:</h3>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Think aloud and explain your approach before coding</li>
                <li>Ask clarifying questions if needed</li>
                <li>Consider edge cases in your solution</li>
                <li>Optimize your solution if possible</li>
                <li>Test your code with examples</li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button 
                  className="btn-primary"
                  onClick={startInterview}
                  disabled={isLoadingQuestions || !currentQuestion}
                >
                  {isLoadingQuestions ? 'Loading Question...' : 'Start Interview'}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left panel - Conversation */}
            <div>
              <Card className="glass-panel h-[500px] flex flex-col overflow-hidden mb-4">
                <div className="p-4 bg-dark-lighter border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-white font-medium">Interview Conversation</h2>
                  {currentQuestion && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      currentQuestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                      currentQuestion.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
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
              
              <SpeechHandler 
                onSpeechResult={handleSpeechResult}
                isAiSpeaking={isAiSpeaking}
                setIsAiSpeaking={setIsAiSpeaking}
                aiMessage={currentAiMessage}
              />
              
              <div className="flex justify-end mt-4">
                <Button 
                  className="btn-primary"
                  onClick={handleCompleteInterview}
                  disabled={isProcessing || messages.length <= 2}
                >
                  Complete Interview
                </Button>
              </div>
            </div>
            
            {/* Right panel - Code Editor and Problem */}
            <div className="space-y-4">
              {currentQuestion && (
                <Card className="glass-panel p-4 max-h-[200px] overflow-y-auto">
                  <CardContent className="p-0">
                    <h2 className="text-lg font-medium text-radium mb-2">{currentQuestion.title}</h2>
                    <div 
                      className="text-white/80 text-sm whitespace-pre-line"
                      dangerouslySetInnerHTML={{ 
                        __html: currentQuestion.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                          .replace(/\n/g, '<br>') 
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              
              <CodeEditor 
                onRun={handleRunCode}
                height="300px"
              />
            </div>
          </div>
        )}

        {/* Results Stage */}
        {stage === 'results' && (
          <div className="animate-fade-in">
            <div className="glass-panel p-6 mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Interview Complete</h2>
              <p className="text-white/70">
                You've completed the coding interview. Review your performance below.
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
                />
              </div>
            </div>
            
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Your Solution</h3>
              <CodeEditor
                initialCode={userCode}
                readOnly={true}
                height="200px"
              />
              
              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-4">Problem</h3>
                {currentQuestion && (
                  <div className="text-white/80 text-sm whitespace-pre-line mb-4">
                    <h4 className="text-radium text-lg mb-1">{currentQuestion.title}</h4>
                    <div 
                      className="text-white/80"
                      dangerouslySetInnerHTML={{ 
                        __html: currentQuestion.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                          .replace(/\n/g, '<br>') 
                      }}
                    />
                  </div>
                )}
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
                    setCurrentQuestion(null);
                    setUserCode('');
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

export default CodingInterview;
