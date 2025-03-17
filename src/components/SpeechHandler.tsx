
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import speechUtils from '../utils/speechUtils';

interface SpeechHandlerProps {
  onSpeechResult: (transcript: string) => void;
  onSpeechEnd?: () => void;
  isAiSpeaking?: boolean;
  setIsAiSpeaking?: (speaking: boolean) => void;
  aiMessage?: string;
  className?: string;
}

const SpeechHandler = ({
  onSpeechResult,
  onSpeechEnd,
  isAiSpeaking = false,
  setIsAiSpeaking,
  aiMessage = '',
  className = '',
}: SpeechHandlerProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isPreparingToSpeak, setIsPreparingToSpeak] = useState(false);
  const [pendingTranscripts, setPendingTranscripts] = useState<string[]>([]);

  // Check if browser supports speech recognition and synthesis
  useEffect(() => {
    const supported = speechUtils.isPlatformSupported();
    setIsSupported(supported);
    
    if (!supported) {
      console.error('Speech recognition or synthesis not supported in this browser');
    }
  }, []);

  // Handle AI speaking
  useEffect(() => {
    if (aiMessage && !isMuted) {
      setIsPreparingToSpeak(true);
      
      // Small delay to ensure UI updates before speech starts
      const timer = setTimeout(() => {
        if (setIsAiSpeaking) setIsAiSpeaking(true);
        
        speechUtils.speak(aiMessage, () => {
          if (setIsAiSpeaking) setIsAiSpeaking(false);
        });
        
        setIsPreparingToSpeak(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [aiMessage, isMuted, setIsAiSpeaking]);

  // Send accumulated transcripts when AI stops speaking
  useEffect(() => {
    if (!isAiSpeaking && pendingTranscripts.length > 0) {
      // Send accumulated transcript to parent component
      const fullTranscript = pendingTranscripts.join(' ');
      if (fullTranscript.trim()) {
        onSpeechResult(fullTranscript);
      }
      setPendingTranscripts([]);
    }
  }, [isAiSpeaking, pendingTranscripts, onSpeechResult]);

  // Handle speech recognition results
  const handleSpeechResult = useCallback((result: string) => {
    setTranscript(result);
    
    // If AI is speaking, store transcripts to send later
    if (isAiSpeaking) {
      setPendingTranscripts(prev => [...prev, result]);
    } else {
      // Only send immediately if AI is not speaking
      onSpeechResult(result);
    }
  }, [isAiSpeaking, onSpeechResult]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isListening) {
      speechUtils.stopListening();
      setIsListening(false);
      
      // If there's content in the transcript, send it
      if (transcript.trim() && !isAiSpeaking) {
        onSpeechResult(transcript);
        setTranscript('');
      }
      
      if (onSpeechEnd) {
        onSpeechEnd();
      }
    } else {
      const success = speechUtils.startListening(handleSpeechResult);
      setIsListening(success);
      
      if (!success) {
        console.error('Failed to start listening');
      }
    }
  }, [isListening, transcript, isAiSpeaking, onSpeechResult, onSpeechEnd, handleSpeechResult]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    
    if (!isMuted) {
      // If currently not muted, cancel any ongoing speech
      speechUtils.cancelSpeech();
      if (setIsAiSpeaking) setIsAiSpeaking(false);
    }
  }, [isMuted, setIsAiSpeaking]);

  return (
    <div className={`glass-panel p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            onClick={toggleListening}
            disabled={!isSupported || isAiSpeaking}
            className={`rounded-full w-12 h-12 flex items-center justify-center ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-radium hover:bg-radium-light text-black'
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          <Button
            onClick={toggleMute}
            disabled={!isSupported}
            variant="ghost"
            className={`rounded-full w-10 h-10 flex items-center justify-center ${
              isMuted 
                ? 'text-red-400 hover:text-red-500' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          {isListening ? (
            <div className="text-radium font-medium flex items-center justify-center sm:justify-start gap-2">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-radium rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-radium rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                <span className="w-2 h-2 bg-radium rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
              </div>
              <span>Listening...</span>
            </div>
          ) : isAiSpeaking || isPreparingToSpeak ? (
            <div className="text-radium font-medium flex items-center justify-center sm:justify-start gap-2">
              {isPreparingToSpeak ? (
                <Loader2 size={16} className="animate-spin text-radium" />
              ) : (
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-radium rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-radium rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-2 h-2 bg-radium rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                </div>
              )}
              <span>{isPreparingToSpeak ? "Preparing response..." : "AI speaking..."}</span>
            </div>
          ) : (
            <div className="text-white/60 text-sm">
              {isSupported 
                ? "Click the microphone button to start speaking" 
                : "Speech recognition is not supported in your browser"
              }
            </div>
          )}
          
          {transcript && (
            <div className="mt-2 p-2 bg-dark-lighter rounded-lg text-white/90 text-sm max-h-20 overflow-y-auto">
              {transcript}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechHandler;
