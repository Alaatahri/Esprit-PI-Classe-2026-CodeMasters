"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const DEFAULT_MESSAGES = [
  {
    role: "bot",
    text: "Bonjour ! Je suis l'assistant BMP.tn. Comment puis-je vous aider ?",
  },
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
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
      return "BMP.tn propose des modules pour la gestion de chantier, les devis et facturation IA, et une marketplace B2B.";
    }
    if (lower.includes("contact") || lower.includes("aide")) {
      return "Vous pouvez nous contacter à contact@bmp.tn ou visiter la page Contact.";
    }
    if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello")) {
      return "Bonjour ! En quoi puis-je vous aider ?";
    }
    return "Merci pour votre message. Pour plus d'informations, contactez-nous à contact@bmp.tn ou explorez les pages Gestion de Chantier, Devis & Facturation, et Marketplace.";
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user" as const, text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    // Simuler un délai (pourrait être remplacé par un appel API IA)
    await new Promise((r) => setTimeout(r, 600));
    const botReply = getBotResponse(trimmed);
    setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
    setLoading(false);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all flex items-center justify-center"
        aria-label="Ouvrir le chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window */}
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
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Votre message..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 text-sm"
              />
              <button
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
