
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code, Cpu, UserCheck, Database, Clock, Calendar, ArrowRight, BarChart3 } from "lucide-react";

interface InterviewType {
  id: string;
  title: string;
  icon: React.ReactNode;
  duration: string;
  route: string;
  description: string;
  count: number;
}

interface PerformanceData {
  date: string;
  coding: number | null;
  oop: number | null;
  behavioral: number | null;
  systemDesign: number | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [recentPerformance, setRecentPerformance] = useState<PerformanceData[]>([]);

  // Interview types configuration
  const interviewTypes: InterviewType[] = [
    {
      id: "coding",
      title: "Coding Interview",
      icon: <Code className="h-6 w-6 text-radium" />,
      duration: "45 min",
      route: "/interview/coding",
      description: "Solve algorithm and data structure problems with live AI feedback",
      count: 0
    },
    {
      id: "oop",
      title: "OOP Interview",
      icon: <Cpu className="h-6 w-6 text-radium" />,
      duration: "30 min",
      route: "/interview/oop",
      description: "Demonstrate your object-oriented programming knowledge",
      count: 0
    },
    {
      id: "behavioral",
      title: "Behavioral Interview",
      icon: <UserCheck className="h-6 w-6 text-radium" />,
      duration: "30 min",
      route: "/interview/behavioral",
      description: "Practice answering common behavioral questions",
      count: 0
    },
    {
      id: "system-design",
      title: "System Design Interview",
      icon: <Database className="h-6 w-6 text-radium" />,
      duration: "30 min",
      route: "/interview/system-design",
      description: "Design scalable systems and discuss architecture trade-offs",
      count: 0
    }
  ];

  useEffect(() => {
    // Generate mock performance data (in a real app, this would come from an API)
    const mockData: PerformanceData[] = [];
    const today = new Date();
    
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Generate random scores or null (for days with no activity)
      const hasCoding = Math.random() > 0.6;
      const hasOOP = Math.random() > 0.7;
      const hasBehavioral = Math.random() > 0.7;
      const hasSystemDesign = Math.random() > 0.8;
      
      mockData.push({
        date: dateStr,
        coding: hasCoding ? Math.floor(Math.random() * 41) + 60 : null, // Score between 60-100
        oop: hasOOP ? Math.floor(Math.random() * 41) + 60 : null,
        behavioral: hasBehavioral ? Math.floor(Math.random() * 41) + 60 : null,
        systemDesign: hasSystemDesign ? Math.floor(Math.random() * 41) + 60 : null,
      });
    }
    
    setRecentPerformance(mockData);
  }, []);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="glassmorphism p-3">
          <p className="text-white text-sm font-medium">{label}</p>
          {payload.map((entry, index) => (
            entry.value !== null && (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {entry.value}%
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="text-radium">{user?.username}</span>
            </h1>
            <p className="text-white/60 mt-1">
              Continue your interview preparation journey
            </p>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Performance chart */}
        <Card className="glass-panel p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-radium" />
                Recent Performance
              </h2>
              <p className="text-white/60 text-sm">
                Your interview scores over the past 15 days
              </p>
            </div>
          </div>

          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={recentPerformance}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff50"
                  tick={{ fill: '#ffffff80', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#ffffff50"
                  tick={{ fill: '#ffffff80', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="coding" 
                  name="Coding"
                  stroke="#00FF66" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                  dot={{ stroke: '#00FF66', strokeWidth: 2, r: 4, fill: '#000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="oop" 
                  name="OOP"
                  stroke="#FF5F56" 
                  strokeWidth={2}
                  dot={{ stroke: '#FF5F56', strokeWidth: 2, r: 4, fill: '#000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="behavioral" 
                  name="Behavioral"
                  stroke="#FFBD2E" 
                  strokeWidth={2}
                  dot={{ stroke: '#FFBD2E', strokeWidth: 2, r: 4, fill: '#000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="systemDesign" 
                  name="System Design"
                  stroke="#1E90FF" 
                  strokeWidth={2}
                  dot={{ stroke: '#1E90FF', strokeWidth: 2, r: 4, fill: '#000' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Interview types */}
        <h2 className="text-xl font-bold text-white mb-4">Choose an Interview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {interviewTypes.map((type) => (
            <Card key={type.id} className="interview-card flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-lg bg-radium/20 flex items-center justify-center">
                  {type.icon}
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{type.duration}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
              <p className="text-white/60 text-sm mb-6 flex-grow">{type.description}</p>
              
              <Button 
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => navigate(type.route)}
              >
                <span>Start Interview</span>
                <ArrowRight size={16} />
              </Button>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-4">Interview Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-radium font-bold">Coding Interviews</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Think out loud through your problem-solving process</li>
                <li>• Start with a brute force solution, then optimize</li>
                <li>• Test your code with edge cases</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-radium font-bold">Behavioral Interviews</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Use the STAR method for your answers</li>
                <li>• Prepare specific examples from past experience</li>
                <li>• Keep answers concise and relevant</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-radium font-bold">System Design</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Clarify requirements before designing</li>
                <li>• Consider scalability, reliability, and performance</li>
                <li>• Discuss trade-offs in your design decisions</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
