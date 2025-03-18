
// Define types for the Web Speech API since TypeScript doesn't include them by default
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

// Need to declare the SpeechRecognition class since TypeScript doesn't include it
declare class SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
}

// Define the speech recognition and synthesis functionality
const speechUtils = {
  recognition: null as SpeechRecognition | null,
  synthesis: window.speechSynthesis,
  
  // Check if the platform supports speech recognition and synthesis
  isPlatformSupported: (): boolean => {
    const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!speechRecognition && !!window.speechSynthesis;
  },
  
  // Start listening for speech
  startListening: (onResult: (transcript: string) => void): boolean => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        return false;
      }
      
      // Create a new speech recognition instance
      const recognition = new SpeechRecognition();
      speechUtils.recognition = recognition;
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Handle results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            // For interim results, update in real-time
            onResult(transcript);
          }
        }
        
        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };
      
      // Handle errors
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
      
      // Start listening
      recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition', error);
      return false;
    }
  },
  
  // Stop listening
  stopListening: (): void => {
    if (speechUtils.recognition) {
      speechUtils.recognition.stop();
      speechUtils.recognition = null;
    }
  },
  
  // Speak text using speech synthesis
  speak: (text: string, onEnd?: () => void): void => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      if (onEnd) onEnd();
      return;
    }
    
    // Cancel any ongoing speech
    speechUtils.cancelSpeech();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    // Handle end of speech
    if (onEnd) {
      utterance.onend = onEnd;
    }
    
    // Start speaking
    speechUtils.synthesis.speak(utterance);
  },
  
  // Cancel ongoing speech
  cancelSpeech: (): void => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};

export default speechUtils;
