"use client";

import { useState, useRef } from "react";
import { Mic } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface DictationButtonProps {
  onResult: (text: string) => void;
  className?: string;
}

type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((ev: Event & { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((ev: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function DictationButton({ onResult, className = "" }: DictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const { lang } = useLanguage();

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;
    type SpeechRecognitionCtorType = new () => RecognitionInstance;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtorType;
      webkitSpeechRecognition?: SpeechRecognitionCtorType;
    };
    const SpeechRecognitionCtorFn = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtorFn) {
      alert(
        lang === "fr-FR"
          ? "Microphone non supporté par votre navigateur."
          : lang === "ar-SA"
            ? "الميكروفون غير مدعوم في متصفحك."
            : "Microphone not supported by your browser.",
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtorFn();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: Event & { results: ArrayLike<{ 0: { transcript: string } }> }) => {
        const r = event.results;
        const last = r[r.length - 1];
        const transcript = last[0].transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: { error: string }) => {
        console.error("Erreur dictée:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={
        lang === "fr-FR"
          ? "Appuyez pour dicter"
          : lang === "ar-SA"
            ? "اضغط للإملاء"
            : "Press to dictate"
      }
      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
        isListening
          ? "bg-red-500 text-white animate-pulse"
          : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 hover:text-amber-200"
      } ${className}`}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
