
import { useState, useEffect, useCallback } from 'react';
import { Clock, PauseCircle, PlayCircle } from 'lucide-react';

interface InterviewTimerProps {
  duration: number; // in minutes
  onTimeUp?: () => void;
}

const InterviewTimer = ({ duration, onTimeUp }: InterviewTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isWarning, setIsWarning] = useState(false);

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  useEffect(() => {
    let timer: number;
    
    if (isRunning && secondsLeft > 0) {
      timer = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft, onTimeUp]);

  useEffect(() => {
    // Set warning when less than 10% of time remains
    setIsWarning(secondsLeft < duration * 60 * 0.1);
  }, [secondsLeft, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (secondsLeft / (duration * 60)) * 100;

  return (
    <div className="glass-panel p-4 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center text-white/70">
          <Clock size={16} className="mr-2" />
          <span className="text-sm">Time Remaining</span>
        </div>
        <button 
          onClick={toggleTimer}
          className="text-radium hover:text-radium-light transition-colors"
        >
          {isRunning ? 
            <PauseCircle size={20} /> : 
            <PlayCircle size={20} />
          }
        </button>
      </div>
      
      <div className="w-full bg-dark-lighter rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full transition-all duration-1000 ${
            isWarning ? 'bg-red-500' : 'bg-radium'
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className={`text-2xl font-mono font-bold ${
        isWarning ? 'text-red-500 animate-pulse' : 'text-white'
      }`}>
        {formatTime(secondsLeft)}
      </div>
    </div>
  );
};

export default InterviewTimer;
