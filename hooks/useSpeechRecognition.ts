import { useState, useRef, useEffect } from 'react';

interface UseSpeechRecognitionProps {
  inputValue: string;
  setInputValue: (value: string) => void;
}

export function useSpeechRecognition({ inputValue, setInputValue }: UseSpeechRecognitionProps) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef<string>('');

  useEffect(() => {
    // Setup Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputValue(originalInputRef.current + (originalInputRef.current ? ' ' : '') + currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [setInputValue]);

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isDictating) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsDictating(false);
    } else {
      // Store what they already typed so dictation appends to it
      originalInputRef.current = inputValue.trim();
      try {
        recognitionRef.current.start();
        setIsDictating(true);
      } catch (e) {
        console.warn("Could not start recognition (might be already started)", e);
      }
    }
  };

  const stopDictation = () => {
    if (isDictating && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsDictating(false);
    }
  };

  return {
    isDictating,
    toggleDictation,
    stopDictation,
    isSupported: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  };
}
