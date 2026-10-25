import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceConfig } from '../types/character';

// Speech Recognition declaration for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSpeech() {
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // STT State
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Text to Speech
  const speak = useCallback((text: string, messageId: string, voiceConfig?: VoiceConfig) => {
    if (!('speechSynthesis' in window)) {
      setSpeechError('Speech synthesis is not supported on this browser.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // If clicking the currently speaking message, stop it
    if (isSpeaking && speakingMessageId === messageId) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    // Clean text: remove roleplay action asterisks like *chuckles* or keep clean prose
    const cleanText = text
      .replace(/\*([^*]+)\*/g, '') // remove *actions* for smoother speech
      .replace(/https?:\/\/\S+/g, '') // remove URLs
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = voiceConfig?.pitch ?? 1.0;
    utterance.rate = voiceConfig?.rate ?? 1.0;

    // Pick best available English voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Find a natural English voice
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, speakingMessageId]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, []);

  // Speech Recognition (Voice Input)
  const startListening = useCallback((onResult: (text: string) => void) => {
    setSpeechError(null);
    const win = window as IWindow;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // just ignore silent stop
        } else {
          setSpeechError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      setSpeechError('Failed to start microphone. Please check permissions.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }
  }, []);

  return {
    isSpeaking,
    speakingMessageId,
    speak,
    stopSpeaking,
    isListening,
    startListening,
    stopListening,
    speechError,
    clearSpeechError: () => setSpeechError(null),
  };
}
