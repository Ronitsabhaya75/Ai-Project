
import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!username || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      setIsLoading(false);
      return;
    }

    // Check password strength
    const isPasswordValid = Object.values(passwordValidation).every(
      (isValid) => isValid
    );
    if (!isPasswordValid) {
      toast.error("Please use a stronger password");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // Mock signup success - in a real app, you'd register with a backend
      login(username, email);
      toast.success("Account created successfully!");
      navigate("/dashboard");
      setIsLoading(false);
    }, 1000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-32">
      <div className="max-w-md w-full glass-panel p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/60">Sign up to start your interview journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              className="input-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password strength indicators */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center text-xs">
                {passwordValidation.minLength ? (
                  <CheckCircle size={12} className="text-green-500 mr-1" />
                ) : (
                  <XCircle size={12} className="text-red-400 mr-1" />
                )}
                <span className={passwordValidation.minLength ? "text-green-500" : "text-white/60"}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center text-xs">
                {passwordValidation.hasUpper ? (
                  <CheckCircle size={12} className="text-green-500 mr-1" />
                ) : (
                  <XCircle size={12} className="text-red-400 mr-1" />
                )}
                <span className={passwordValidation.hasUpper ? "text-green-500" : "text-white/60"}>
                  Uppercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                {passwordValidation.hasLower ? (
                  <CheckCircle size={12} className="text-green-500 mr-1" />
                ) : (
                  <XCircle size={12} className="text-red-400 mr-1" />
                )}
                <span className={passwordValidation.hasLower ? "text-green-500" : "text-white/60"}>
                  Lowercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                {passwordValidation.hasNumber ? (
                  <CheckCircle size={12} className="text-green-500 mr-1" />
                ) : (
                  <XCircle size={12} className="text-red-400 mr-1" />
                )}
                <span className={passwordValidation.hasNumber ? "text-green-500" : "text-white/60"}>
                  Number
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              className="h-4 w-4 rounded border-gray-300 text-radium focus:ring-radium"
              required
            />
            <Label htmlFor="terms" className="text-sm text-white/70">
              I agree to the{" "}
              <a href="#" className="text-radium hover:text-radium-light">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-radium hover:text-radium-light">
                Privacy Policy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link to="/login" className="text-radium hover:text-radium-light">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
