
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, ThumbsUp, MessageSquare, LightbulbIcon, ExternalLink } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface FeedbackItem {
  type: 'positive' | 'negative' | 'suggestion';
  content: string;
}

interface AIFeedbackProps {
  score: number;
  summary?: string;
  feedbackItems?: FeedbackItem[];
  loading?: boolean;
  onCopyFeedback?: () => void;
}

const AIFeedback = ({
  score = 0,
  summary = '',
  feedbackItems = [],
  loading = false,
  onCopyFeedback
}: AIFeedbackProps) => {
  const [positiveItems, setPositiveItems] = useState<FeedbackItem[]>([]);
  const [negativeItems, setNegativeItems] = useState<FeedbackItem[]>([]);
  const [suggestionItems, setSuggestionItems] = useState<FeedbackItem[]>([]);
  
  useEffect(() => {
    const positive = feedbackItems.filter(item => item.type === 'positive');
    const negative = feedbackItems.filter(item => item.type === 'negative');
    const suggestions = feedbackItems.filter(item => item.type === 'suggestion');
    
    setPositiveItems(positive);
    setNegativeItems(negative);
    setSuggestionItems(suggestions);
  }, [feedbackItems]);
  
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getScoreText = () => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    if (score >= 50) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const handleCopyFeedback = () => {
    const feedbackText = `
Interview Score: ${score}/100 - ${getScoreText()}

Summary:
${summary}

Strengths:
${positiveItems.map(item => `- ${item.content}`).join('\n')}

Areas for Improvement:
${negativeItems.map(item => `- ${item.content}`).join('\n')}

Suggestions:
${suggestionItems.map(item => `- ${item.content}`).join('\n')}
    `;
    
    navigator.clipboard.writeText(feedbackText.trim());
    toast.success('Feedback copied to clipboard');
    
    if (onCopyFeedback) {
      onCopyFeedback();
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel w-full animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white/90">AI Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-6 w-20 bg-white/10 rounded mb-4"></div>
          <div className="h-24 bg-white/10 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-4/5"></div>
            <div className="h-4 bg-white/10 rounded w-3/5"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center justify-between">
          <span>AI Interview Feedback</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyFeedback}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ExternalLink size={14} className="mr-1" />
            <span className="text-xs">Copy</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
          <div className="flex items-center justify-center min-w-[120px]">
            <div className="relative">
              <svg className="w-24 h-24">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="5"
                  fill="transparent"
                  r="36"
                  cx="48"
                  cy="48"
                />
                <circle
                  className={`${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'} stroke-current`}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${score * 2.26} 226`}
                  strokeDashoffset="0"
                  fill="transparent"
                  r="36"
                  cx="48"
                  cy="48"
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-2xl font-bold ${getScoreColor()}`}>{score}</span>
                <span className="text-xs text-white/70">out of 100</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium text-white mb-1">
              {getScoreText()}
            </div>
            <p className="text-white/80 text-sm">{summary}</p>
          </div>
        </div>

        <Tabs defaultValue="strengths">
          <TabsList className="grid grid-cols-3 mb-2 bg-dark-lighter">
            <TabsTrigger value="strengths" className="data-[state=active]:bg-radium/20 data-[state=active]:text-radium">
              <ThumbsUp size={14} className="mr-1" /> Strengths
            </TabsTrigger>
            <TabsTrigger value="areas" className="data-[state=active]:bg-radium/20 data-[state=active]:text-radium">
              <AlertCircle size={14} className="mr-1" /> Areas to Improve
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="data-[state=active]:bg-radium/20 data-[state=active]:text-radium">
              <LightbulbIcon size={14} className="mr-1" /> Suggestions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="strengths" className="text-white/80 mt-1">
            {positiveItems.length > 0 ? (
              <ul className="space-y-2">
                {positiveItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={16} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm">{item.content}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-white/50 text-sm text-center py-4">No strengths identified</div>
            )}
          </TabsContent>
          
          <TabsContent value="areas" className="text-white/80 mt-1">
            {negativeItems.length > 0 ? (
              <ul className="space-y-2">
                {negativeItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <XCircle size={16} className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm">{item.content}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-white/50 text-sm text-center py-4">No areas for improvement identified</div>
            )}
          </TabsContent>
          
          <TabsContent value="suggestions" className="text-white/80 mt-1">
            {suggestionItems.length > 0 ? (
              <ul className="space-y-2">
                {suggestionItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <MessageSquare size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm">{item.content}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-white/50 text-sm text-center py-4">No suggestions available</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIFeedback;
