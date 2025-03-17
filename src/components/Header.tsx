
import { useContext, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";
import { Menu, X, Mic, MicOff } from "lucide-react";

const Header = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isInterviewPage = location.pathname.includes("/interview");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // Additional microphone toggle logic would go here
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-lg shadow-md shadow-radium/10" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-radium font-bold text-xl radium-text-shadow"
        >
          <span className="text-3xl">AI</span>
          <span className="text-white/90">Interview</span>
        </Link>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-radium"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-all hover:text-radium ${
              location.pathname === "/" ? "text-radium" : "text-white/70"
            }`}
          >
            Home
          </Link>
          
          {isAuthenticated && (
            <>
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-all hover:text-radium ${
                  location.pathname === "/dashboard" ? "text-radium" : "text-white/70"
                }`}
              >
                Dashboard
              </Link>
              
              {isInterviewPage && (
                <button
                  onClick={toggleMic}
                  className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full transition-all ${
                    isMicOn
                      ? "bg-radium/20 text-radium"
                      : "bg-muted text-white/70 hover:bg-muted/70"
                  }`}
                >
                  {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                  <span>{isMicOn ? "Mic On" : "Mic Off"}</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Authentication buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-white/70 text-sm">
                Hi, <span className="text-radium">{user?.username}</span>
              </span>
              <Button 
                variant="outline"
                className="border-radium/50 text-radium hover:bg-radium/10"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="border-radium/50 text-radium hover:bg-radium/10"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  className="bg-radium text-black hover:bg-radium-light"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 bg-black/95 z-40 md:hidden animate-fade-in">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
            <Link 
              to="/" 
              className="text-xl font-medium py-2 border-b border-white/10 hover:text-radium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-xl font-medium py-2 border-b border-white/10 hover:text-radium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                {isInterviewPage && (
                  <button
                    onClick={() => {
                      toggleMic();
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 text-xl font-medium py-2 border-b border-white/10 ${
                      isMicOn ? "text-radium" : "text-white/70 hover:text-radium"
                    }`}
                  >
                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                    <span>{isMicOn ? "Mic On" : "Mic Off"}</span>
                  </button>
                )}
                
                <button
                  className="text-xl font-medium py-2 text-red-500"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-xl font-medium py-2 border-b border-white/10 hover:text-radium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="text-xl font-medium py-2 border-b border-white/10 hover:text-radium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
