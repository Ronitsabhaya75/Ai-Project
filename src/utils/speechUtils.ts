
// Define the necessary types for browser speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

class SpeechUtils {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    // Initialize speech recognition if available
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        if (this.onResultCallback) {
          this.onResultCallback(transcript);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition?.start();
        } else if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
    } else {
      console.error('Speech recognition not supported in this browser');
    }

    // Initialize speech synthesis if available
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.error('Speech synthesis not supported in this browser');
    }
  }

  startListening(onResult: (transcript: string) => void, onEnd?: () => void): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return false;
    }

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd || null;
    this.isListening = true;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  stopListening(): void {
    if (!this.recognition) return;
    
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.synthesis) {
      console.error('Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synthesis.speak(utterance);
  }

  cancelSpeech(): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();
  }

  isPlatformSupported(): boolean {
    return !!this.recognition && !!this.synthesis;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }
}

export default new SpeechUtils();
