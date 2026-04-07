"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { useLanguage } from "./LanguageProvider";
import { DictationButton } from "./DictationButton";

type ChatLine = { role: "bot" | "user"; text: string };

const DEFAULT_MESSAGES: ChatLine[] = [
  {
    role: "bot",
    text: "Bonjour ! Je suis l'assistant BMP.tn. Comment puis-je vous aider ?",
  },
];

/** Serveur type g4f (optionnel). Ex. http://127.0.0.1:5000/api/chat */
const CHAT_AI_URL =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_CHATBOT_AI_URL?.trim() || "" : "";

function getBotResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (
    lower.includes("login") ||
    lower.includes("connexion") ||
    lower.includes("se connecter")
  ) {
    return "Pour vous connecter, cliquez sur le bouton Login dans la barre de navigation ou allez sur la page /login.";
  }
  if (
    lower.includes("inscription") ||
    lower.includes("s'inscrire") ||
    lower.includes("créer un compte")
  ) {
    return "Pour créer un compte, rendez-vous sur la page /inscription.";
  }
  if (
    lower.includes("projet") ||
    lower.includes("chantier") ||
    lower.includes("construction")
  ) {
    return "BMP.tn propose des modules pour la gestion de chantier, les devis et facturation, et une marketplace B2B.";
  }
  if (lower.includes("contact") || lower.includes("aide")) {
    return "Vous pouvez nous contacter via la page Contact ou contact@bmp.tn.";
  }
  if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello")) {
    return "Bonjour ! En quoi puis-je vous aider ?";
  }
  return "Merci pour votre message. Explorez les pages Gestion de Chantier, Devis & Facturation, et Marketplace pour en savoir plus.";
}

function offlineAiError(lang: string): string {
  if (lang === "ar-SA") {
    return "تعذر الاتصال بالمساعد الذكي. يمكنك ضبط NEXT_PUBLIC_CHATBOT_AI_URL أو استخدام الردود التلقائية.";
  }
  if (lang === "en-US") {
    return "Could not reach the AI server. Set NEXT_PUBLIC_CHATBOT_AI_URL or use built-in answers.";
  }
  return "Connexion au serveur d'IA impossible. Définissez NEXT_PUBLIC_CHATBOT_AI_URL (ex. script local port 5000) ou utilisez les réponses intégrées.";
}

export function ChatbotWidget({ onToggle }: { onToggle?: (state: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useLanguage();
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const speakBack = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) => v.lang.startsWith(lang.substring(0, 2)));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatLine = { role: "user", text: trimmed };
    const messagesAfterUser = [...messages, userMsg];
    setMessages(messagesAfterUser);
    setInputValue("");
    setLoading(true);

    if (!CHAT_AI_URL) {
      await new Promise((r) => setTimeout(r, 400));
      const botReply = getBotResponse(trimmed);
      setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
      speakBack(botReply);
      setLoading(false);
      return;
    }

    try {
      const user = getStoredUser();
      const name = user?.nom || "Invité";
      const role = user?.role || "visiteur";
      const contextStr = `\n\n--- Contexte (ne pas citer tel quel) ---\nLangue UI: ${lang}. Réponds dans la langue de l'interface.\nUtilisateur: ${name}, rôle: ${role}.`;

      const history = messagesAfterUser
        .slice(-6)
        .map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        }));

      const res = await fetch(CHAT_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed + contextStr,
          history,
        }),
      });

      if (!res.ok) throw new Error("Erreur serveur IA");

      const data = (await res.json()) as { response?: string };
      const reply = data.response ?? "";
      if (!reply) throw new Error("Réponse vide");
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      speakBack(reply);
    } catch (error) {
      console.error("Erreur Chatbot AI:", error);
      const fallback = getBotResponse(trimmed);
      const errText = `${offlineAiError(lang)} — ${fallback}`;
      setMessages((prev) => [...prev, { role: "bot", text: errText }]);
      speakBack(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative z-50">
        <button
          type="button"
          onClick={() => {
            const next = !isOpen;
            setIsOpen(next);
            onToggle?.(next);
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 shadow-xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Ouvrir le chatbot"
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[480px] max-h-[70vh] backdrop-blur-2xl bg-gray-900/95 rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-gray-900" />
              </div>
              <div>
                <p className="font-semibold text-white">Assistant BMP.tn</p>
                <p className="text-xs text-gray-400">En ligne</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    m.role === "user"
                      ? "bg-amber-500/30 text-white"
                      : "bg-white/10 text-gray-200"
                  }`}
                >
                  <p className="text-sm">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 text-gray-400 text-sm">
                  ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  lang === "ar-SA" ? "رسالتك..." : lang === "en-US" ? "Your message..." : "Votre message..."
                }
                className="flex-1 pl-4 pr-12 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 text-sm"
                dir={lang === "ar-SA" ? "rtl" : "ltr"}
              />
              <div className="absolute right-[60px] top-1 bottom-1 flex items-center">
                <DictationButton
                  onResult={(text) => setInputValue((prev) => `${prev} ${text}`.trim())}
                  className="!p-1.5 w-8 h-8 !bg-transparent hover:!bg-white/10"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold disabled:opacity-50 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
