
import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";
import { Code, Code2, UserCheck, Database, Cpu, ChevronRight, BookOpen, CheckCircle } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [animateElements, setAnimateElements] = useState(false);

  useEffect(() => {
    // Trigger animations after a short delay
    const timer = setTimeout(() => {
      setAnimateElements(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pt-20 min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="lg:w-1/2 max-w-xl">
          <div 
            className={`opacity-0 transform translate-y-8 transition-all duration-700 ${
              animateElements ? "opacity-100 translate-y-0" : ""
            }`}
          >
            <div className="inline-block px-4 py-1 rounded-full bg-radium/10 border border-radium/20 text-sm text-radium mb-4">
              AI-Powered Technical Interviews
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 radium-text-shadow">
              Master Your <span className="text-radium">Tech Interviews</span> with AI
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Practice coding, object-oriented, behavioral, and system design interviews with an 
              AI that provides real-time feedback, ratings, and improvement suggestions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Button 
                  className="btn-primary w-full sm:w-auto flex items-center gap-2"
                  onClick={() => navigate("/dashboard")}
                >
                  <span>Go to Dashboard</span>
                  <ChevronRight size={18} />
                </Button>
              ) : (
                <>
                  <Button 
                    className="btn-primary w-full sm:w-auto flex items-center gap-2"
                    onClick={() => navigate("/signup")}
                  >
                    <span>Get Started</span>
                    <ChevronRight size={18} />
                  </Button>
                  <Button 
                    className="btn-secondary w-full sm:w-auto"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:w-1/2 relative">
          <div 
            className={`glass-panel p-8 relative opacity-0 transition-all duration-700 delay-300 ${
              animateElements ? "opacity-100" : ""
            }`}
          >
            <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-radium text-black text-sm font-medium">
              AI Interview
            </div>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-radium/20 text-radium">
                AI
              </div>
              <div className="flex-1 glass-panel p-3">
                <p className="text-sm text-white/90">
                  Implement a function to find the two numbers in an array that sum up to a target value.
                  Can you tell me your approach?
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white">
                You
              </div>
              <div className="flex-1 glass-panel p-3">
                <p className="text-sm text-white/90">
                  I would use a hash map to store values as I iterate through the array. For each number, 
                  I check if the complement (target - current) exists in the map...
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-radium/20 text-radium">
                AI
              </div>
              <div className="flex-1 glass-panel p-3">
                <p className="text-sm text-white/90">
                  Great approach! Using a hash map gives us O(n) time complexity. Can you now code this solution?
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-3 rounded-lg bg-dark-lighter border border-white/10">
              <code className="text-xs text-white/80 font-mono">
                <div>function twoSum(nums, target) {'{'}</div>
                <div className="pl-4">const map = new Map();</div>
                <div className="pl-4">for (let i = 0; i {'<'} nums.length; i++) {'{'}</div>
                <div className="pl-8 text-radium">const complement = target - nums[i];</div>
                <div className="pl-8">if (map.has(complement)) {'{'}</div>
                <div className="pl-12">return [map.get(complement), i];</div>
                <div className="pl-8">{'}'}</div>
                <div className="pl-8 text-radium">map.set(nums[i], i);</div>
                <div className="pl-4">{'}'}</div>
                <div className="pl-4">return [];</div>
                <div>{'}'}</div>
              </code>
            </div>
          </div>
          
          <div className="absolute -bottom-5 -right-5 h-40 w-40 rounded-full bg-radium/5 blur-3xl"></div>
          <div className="absolute -top-5 -left-5 h-40 w-40 rounded-full bg-radium/5 blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Four Interview <span className="text-radium">Categories</span>
          </h2>
          <p className="text-white/70">
            Comprehensive practice in all major technical interview formats with real-time AI evaluation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className={`interview-card opacity-0 transition-all duration-500 delay-100 ${
              animateElements ? "opacity-100" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-radium/20 flex items-center justify-center mb-4">
              <Code2 className="h-6 w-6 text-radium" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Coding Interview</h3>
            <p className="text-white/60 mb-4">
              45-minute session with algorithm and data structure problems from a curated question bank
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-radium">45 min</span>
              <span className="text-white/40">Live feedback</span>
            </div>
          </div>

          <div 
            className={`interview-card opacity-0 transition-all duration-500 delay-200 ${
              animateElements ? "opacity-100" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-radium/20 flex items-center justify-center mb-4">
              <Cpu className="h-6 w-6 text-radium" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">OOP Interview</h3>
            <p className="text-white/60 mb-4">
              30-minute session focused on object-oriented programming concepts and design patterns
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-radium">30 min</span>
              <span className="text-white/40">Performance rating</span>
            </div>
          </div>

          <div 
            className={`interview-card opacity-0 transition-all duration-500 delay-300 ${
              animateElements ? "opacity-100" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-radium/20 flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6 text-radium" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Behavioral Interview</h3>
            <p className="text-white/60 mb-4">
              30-minute session with common behavioral questions and in-depth response analysis
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-radium">30 min</span>
              <span className="text-white/40">Communication assessment</span>
            </div>
          </div>

          <div 
            className={`interview-card opacity-0 transition-all duration-500 delay-400 ${
              animateElements ? "opacity-100" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-radium/20 flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-radium" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">System Design Interview</h3>
            <p className="text-white/60 mb-4">
              30-minute session focused on architecture, scalability, and design trade-offs
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-radium">30 min</span>
              <span className="text-white/40">Detailed evaluation</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 bg-dark-light/5 rounded-3xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-radium">Works</span>
          </h2>
          <p className="text-white/70">
            Our AI-powered platform simulates real interview experiences with voice interaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-radium/10 border border-radium/20 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 text-radium" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Choose Interview Type</h3>
            <p className="text-white/60">
              Select from coding, OOP, behavioral, or system design interview formats
            </p>
          </div>

          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-radium/10 border border-radium/20 flex items-center justify-center mx-auto mb-6">
              <Cpu className="h-8 w-8 text-radium" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Interaction</h3>
            <p className="text-white/60">
              Engage in voice conversations with the AI interviewer just like a real interview
            </p>
          </div>

          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-radium/10 border border-radium/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-radium" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Get Evaluated</h3>
            <p className="text-white/60">
              Receive detailed performance analysis and improvement suggestions
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          {isAuthenticated ? (
            <Button 
              className="btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button 
              className="btn-primary"
              onClick={() => navigate("/signup")}
            >
              Get Started Now
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
