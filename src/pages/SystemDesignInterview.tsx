
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
      // Tell the AI we're ending the interview and ask for final feedback
      const completionMessage: ChatMessage = {
        role: 'user',
        content: 'The interview is now complete. Could you provide detailed feedback on my system design solution, including a score from 0-100?'
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
      
      // Create categories for system design performance stages
      const categories = ['Requirements', 'High-Level', 'Components', 'Tradeoffs', 'Scaling', 'Final'];
      
      // Sample data points for the chart (in a real app, this would be based on actual performance metrics)
      for (let i = 0; i < 5; i++) {
        const value = Math.min(100, Math.max(0, score - 15 + Math.random() * 30));
        performancePoints.push({
          name: categories[i],
          value: Math.round(value)
        });
      }
      
      // Ensure the final point is exactly the score
      performancePoints.push({
        name: categories[5],
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
      items.push({ type: 'positive', content: 'You addressed the key components of system design and attempted to create a cohesive architecture.' });
    }
    
    if (!items.some(item => item.type === 'negative')) {
      items.push({ type: 'negative', content: 'Consider spending more time on scalability aspects and discussing trade-offs in your design decisions.' });
    }
    
    if (!items.some(item => item.type === 'suggestion')) {
      items.push({ type: 'suggestion', content: 'Practice drawing system design diagrams and breaking down complex systems into manageable components.' });
    }
    
    return { summary, items };
  };

  // Handle the timer running out
  const handleTimeUp = () => {
    toast.warning('Time is up! Please wrap up your design.');
    
    // In a full app, you might want to give a grace period before automatically ending the interview
    setTimeout(() => {
      if (stage === 'interview') {
        handleCompleteInterview();
      }
    }, 10000); // 10-second grace period
  };
  
  const getCategoryColor = (category: SystemDesignNote['category']) => {
    switch(category) {
      case 'requirements': return 'bg-blue-500/20 text-blue-500';
      case 'components': return 'bg-green-500/20 text-green-500';
      case 'scaling': return 'bg-yellow-500/20 text-yellow-500';
      case 'tradeoffs': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-white/20 text-white';
    }
  };

  const getCategoryLabel = (category: SystemDesignNote['category']) => {
    switch(category) {
      case 'requirements': return 'Requirements';
      case 'components': return 'Components';
      case 'scaling': return 'Scaling';
      case 'tradeoffs': return 'Trade-offs';
      default: return 'Note';
    }
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
               'System Design Challenge'}
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
              with a system design challenge, and you'll need to discuss your approach to designing a scalable solution.
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
              <h3 className="text-lg font-medium text-white">System Design Framework:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-3">
                  <div className="text-blue-500 font-medium mb-1">Requirements Clarification</div>
                  <p className="text-white/70 text-sm">
                    Ask questions to clarify functional and non-functional requirements
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-green-500 font-medium mb-1">High-Level Design</div>
                  <p className="text-white/70 text-sm">
                    Define major components and their interactions
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-yellow-500 font-medium mb-1">Scaling & Performance</div>
                  <p className="text-white/70 text-sm">
                    Address bottlenecks and scaling strategies for high traffic
                  </p>
                </div>
                <div className="glass-panel p-3">
                  <div className="text-purple-500 font-medium mb-1">Trade-offs Discussion</div>
                  <p className="text-white/70 text-sm">
                    Analyze different approaches and their trade-offs
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
            <div>
              <Card className="glass-panel h-[500px] flex flex-col overflow-hidden mb-4">
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
            
            {/* Right panel - Design notes */}
            <div>
              <Card className="glass-panel h-[500px] flex flex-col overflow-hidden">
                <div className="p-4 bg-dark-lighter border-b border-white/10">
                  <h2 className="text-white font-medium">Design Notes</h2>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                  {designNotes.length > 0 ? (
                    designNotes.map((note) => (
                      <div 
                        key={note.id}
                        className="p-2 border border-white/10 rounded-md bg-dark-lighter group relative"
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(note.category)}`}>
                            {getCategoryLabel(note.category)}
                          </span>
                          <button 
                            className="text-white/40 hover:text-white/80 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-white/80 text-sm mt-1">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm">
                      <Database size={40} className="mb-2 opacity-30" />
                      <p>No design notes yet. Add some to help with your system design.</p>
                    </div>
                  )}
                  <div ref={notesEndRef} />
                </div>
                
                <div className="p-4 border-t border-white/10 bg-dark-lighter">
                  <div className="flex mb-2">
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value as SystemDesignNote['category'])}
                      className="text-xs p-1 mr-2 bg-dark border border-white/20 rounded text-white"
                    >
                      <option value="requirements">Requirements</option>
                      <option value="components">Components</option>
                      <option value="scaling">Scaling</option>
                      <option value="tradeoffs">Trade-offs</option>
                    </select>
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a design note..."
                      className="input-primary flex-grow text-sm mr-2 py-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addNote();
                        }
                      }}
                    />
                    <Button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      size="sm"
                      className="bg-radium text-black hover:bg-radium-light"
                    >
                      <CheckCircle size={16} />
                    </Button>
                  </div>
                </div>
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
                  title="Performance By Design Stage"
                  height={300}
                  color="#1E90FF"
                />
              </div>
            </div>
            
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Design Notes</h3>
              
              {designNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {designNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="p-3 border border-white/10 rounded-md bg-dark-lighter"
                    >
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block mb-2 ${getCategoryColor(note.category)}`}>
                        {getCategoryLabel(note.category)}
                      </div>
                      <p className="text-white/80 text-sm">{note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/50 py-6">
                  You didn't add any design notes during this interview.
                </div>
              )}
              
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
                    setDesignNotes([]);
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
