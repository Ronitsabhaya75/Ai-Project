
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Home, Database, ArrowRight, CheckCircle, Trash2 } from 'lucide-react';
import InterviewTimer from '@/components/InterviewTimer';
import SpeechHandler from '@/components/SpeechHandler';
import AIFeedback from '@/components/AIFeedback';
import LineChart, { DataPoint } from '@/components/LineChart';
import deepseekService from '@/services/deepseekService';
import { getSystemDesignQuestions } from '@/utils/questions';

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

interface SystemDesignNote {
  id: string;
  text: string;
  category: 'requirements' | 'components' | 'scaling' | 'tradeoffs';
}

const SystemDesignInterview = () => {
  const navigate = useNavigate();
  const systemDesignQuestions = getSystemDesignQuestions();
  
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
  const [designNotes, setDesignNotes] = useState<SystemDesignNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<SystemDesignNote['category']>('requirements');
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<ChatMessage[]>([]);
  const notesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to the latest note
  useEffect(() => {
    if (notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [designNotes]);

  // Add a new note
  const addNote = () => {
    if (newNote.trim()) {
      const note: SystemDesignNote = {
        id: Date.now().toString(),
        text: newNote.trim(),
        category: newNoteCategory
      };
      
      setDesignNotes(prev => [...prev, note]);
      setNewNote('');
    }
  };

  // Delete a note
  const deleteNote = (id: string) => {
    setDesignNotes(prev => prev.filter(note => note.id !== id));
  };

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
      // Prepare a summary of the notes for the AI
      const notesSummary = designNotes.length > 0 ? 
        `Throughout the interview, I've made the following design notes:
${designNotes.map(note => `- ${note.category.toUpperCase()}: ${note.text}`).join('\n')}
` : '';
      
      // Tell the AI we're ending the interview and ask for final feedback
      const completionMessage: ChatMessage = {
        role: 'user',
        content: `The interview is now complete. ${notesSummary}Could you provide detailed feedback on my performance, including a score from 0-100?`
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
          name: `Phase ${i}`,
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
      items.push({ type: 'positive', content: 'You demonstrated understanding of system design concepts and component interactions.' });
    }
    
    if (!items.some(item => item.type === 'negative')) {
      items.push({ type: 'negative', content: 'Consider discussing more about data consistency and failure handling in distributed systems.' });
    }
    
    if (!items.some(item => item.type === 'suggestion')) {
      items.push({ type: 'suggestion', content: 'Practice drawing system diagrams and explaining trade-offs between different architectural choices.' });
    }
    
    return { summary, items };
  };

  // Get color for note category
  const getCategoryColor = (category: SystemDesignNote['category']): string => {
    switch (category) {
      case 'requirements':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'components':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'scaling':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'tradeoffs':
        return 'bg-pink-500/20 text-pink-500 border-pink-500/30';
      default:
        return 'bg-white/20 text-white/80 border-white/30';
    }
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
                <Database size={16} />
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
              <InterviewTimer duration={30} onTimeUp={handleTimeUp} />
            </div>
          )}
        </div>

        {/* Preparation Stage */}
        {stage === 'preparation' && (
          <div className="glass-panel p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Ready to Begin</h2>
            <p className="text-white/70 mb-6">
              You are about to start a 30-minute system design interview. The AI interviewer will present you 
              with a system design problem, and you'll be expected to discuss your approach to designing a scalable solution.
            </p>
            
            <div className="glass-panel p-4 mb-6">
              <h3 className="text-lg font-medium text-radium mb-3">Sample System Design Questions</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                {systemDesignQuestions.slice(0, 5).map((question, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-radium mr-2">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">System Design Process:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-3">
                  <div className="text-blue-400 font-medium mb-1">1. Requirements Gathering</div>
                  <p className="text-white/70 text-sm">
                    Clarify functional and non-functional requirements
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-purple-400 font-medium mb-1">2. Component Design</div>
                  <p className="text-white/70 text-sm">
                    Identify major components and their interactions
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-orange-400 font-medium mb-1">3. Scaling Strategy</div>
                  <p className="text-white/70 text-sm">
                    Address performance, availability, and reliability
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-pink-400 font-medium mb-1">4. Trade-offs</div>
                  <p className="text-white/70 text-sm">
                    Discuss trade-offs in your design decisions
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left panel - Conversation */}
            <div className="flex flex-col gap-4">
              <Card className="glass-panel h-[400px] flex flex-col overflow-hidden">
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
              
              <SpeechHandler 
                onSpeechResult={handleSpeechResult}
                isAiSpeaking={isAiSpeaking}
                setIsAiSpeaking={setIsAiSpeaking}
                aiMessage={currentAiMessage}
              />
              
              <div className="flex justify-end mt-2">
                <Button 
                  className="btn-primary"
                  onClick={handleCompleteInterview}
                  disabled={isProcessing || messages.length <= 2}
                >
                  Complete Interview
                </Button>
              </div>
            </div>
            
            {/* Right panel - Design Notes */}
            <div className="space-y-4">
              <Card className="glass-panel p-4">
                <h3 className="text-lg font-medium text-radium mb-3 flex items-center gap-2">
                  <Database size={18} />
                  Design Notes
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    size="sm"
                    variant="outline"
                    className={`${newNoteCategory === 'requirements' ? 
                      'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                      'bg-transparent text-white/60 border-white/20'}`}
                    onClick={() => setNewNoteCategory('requirements')}
                  >
                    Requirements
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className={`${newNoteCategory === 'components' ? 
                      'bg-purple-500/20 text-purple-400 border-purple-500/30' : 
                      'bg-transparent text-white/60 border-white/20'}`}
                    onClick={() => setNewNoteCategory('components')}
                  >
                    Components
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className={`${newNoteCategory === 'scaling' ? 
                      'bg-orange-500/20 text-orange-400 border-orange-500/30' : 
                      'bg-transparent text-white/60 border-white/20'}`}
                    onClick={() => setNewNoteCategory('scaling')}
                  >
                    Scaling
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className={`${newNoteCategory === 'tradeoffs' ? 
                      'bg-pink-500/20 text-pink-400 border-pink-500/30' : 
                      'bg-transparent text-white/60 border-white/20'}`}
                    onClick={() => setNewNoteCategory('tradeoffs')}
                  >
                    Trade-offs
                  </Button>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 p-2 bg-dark-lighter border border-white/20 rounded text-white text-sm focus:border-radium focus:outline-none"
                    placeholder="Add a design note..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNote();
                      }
                    }}
                  />
                  <Button 
                    variant="default" 
                    className="bg-radium hover:bg-radium-light text-black"
                    onClick={addNote}
                  >
                    <CheckCircle size={16} />
                  </Button>
                </div>
                
                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                  {designNotes.length === 0 ? (
                    <p className="text-white/50 text-center text-sm italic py-4">
                      Add notes about your system design here
                    </p>
                  ) : (
                    designNotes.map(note => (
                      <div 
                        key={note.id}
                        className={`p-2 text-sm rounded border ${getCategoryColor(note.category)} flex justify-between items-start`}
                      >
                        <span className="mr-2">{note.text}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-white/10 text-white/40 hover:text-white/80"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))
                  )}
                  <div ref={notesEndRef}></div>
                </div>
              </Card>
              
              <Card className="glass-panel p-4">
                <CardContent className="p-0">
                  <h3 className="text-lg font-medium text-radium mb-3">System Design Key Aspects</h3>
                  
                  <div className="text-white/80 text-sm space-y-4">
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">Scalability</h4>
                      <p className="text-white/60 text-xs">
                        Horizontal scaling (more machines) vs. vertical scaling (more power)
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-purple-400 mb-1">Reliability</h4>
                      <p className="text-white/60 text-xs">
                        Redundancy, fault tolerance, graceful degradation
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-orange-400 mb-1">Performance</h4>
                      <p className="text-white/60 text-xs">
                        Latency, throughput, caching strategies
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-pink-400 mb-1">Consistency</h4>
                      <p className="text-white/60 text-xs">
                        Strong vs. eventual consistency, CAP theorem considerations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Results Stage */}
        {stage === 'results' && (
          <div className="animate-fade-in">
            <div className="glass-panel p-6 mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Interview Complete</h2>
              <p className="text-white/70">
                You've completed the system design interview. Review your performance below.
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
                  color="#1E90FF"
                />
              </div>
            </div>
            
            {designNotes.length > 0 && (
              <div className="glass-panel p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Your Design Notes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Group notes by category */}
                  {(['requirements', 'components', 'scaling', 'tradeoffs'] as const).map(category => {
                    const categoryNotes = designNotes.filter(note => note.category === category);
                    if (categoryNotes.length === 0) return null;
                    
                    return (
                      <div key={category} className="glass-panel p-4">
                        <h4 className={`font-medium mb-3 ${
                          category === 'requirements' ? 'text-blue-400' :
                          category === 'components' ? 'text-purple-400' :
                          category === 'scaling' ? 'text-orange-400' :
                          'text-pink-400'
                        }`}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </h4>
                        <ul className="space-y-2">
                          {categoryNotes.map(note => (
                            <li key={note.id} className="text-white/80 text-sm">
                              • {note.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
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
                    setDesignNotes([]);
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
