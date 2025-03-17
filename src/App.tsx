
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext } from "react";
import "./App.css";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CodingInterview from "./pages/CodingInterview";
import OOPInterview from "./pages/OOPInterview";
import BehavioralInterview from "./pages/BehavioralInterview";
import SystemDesignInterview from "./pages/SystemDesignInterview";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Authentication context
export interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; email: string } | null;
  login: (username: string, email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    // Check if user data exists in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (username: string, email: string) => {
    const userData = { username, email };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-black tech-logos">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route 
                    path="/dashboard" 
                    element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/interview/coding" 
                    element={isAuthenticated ? <CodingInterview /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/interview/oop" 
                    element={isAuthenticated ? <OOPInterview /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/interview/behavioral" 
                    element={isAuthenticated ? <BehavioralInterview /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/interview/system-design" 
                    element={isAuthenticated ? <SystemDesignInterview /> : <Navigate to="/login" />} 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
