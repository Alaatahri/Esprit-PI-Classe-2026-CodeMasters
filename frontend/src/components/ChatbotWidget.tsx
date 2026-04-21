"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";

// Imports locaux avec alias @/ pour la compatibilité Next.js
import { getStoredUser } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { DictationButton } from "@/components/DictationButton";

// URL de l'API Backend NestJS
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Message {
    role: "user" | "bot";
    text: string;
}

const DEFAULT_MESSAGES: Message[] = [
    {
        role: "bot",
        text: "Bonjour ! Je suis l'assistant intelligent de BMP.tn. Comment puis-je vous aider aujourd'hui ? 😊",
    },
];

export function ChatbotWidget({ onToggle }: { onToggle?: (state: boolean) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { lang } = useLanguage();
    const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const speakBack = (text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'ar-SA' ? 'ar-SA' : lang === 'en-US' ? 'en-US' : 'fr-FR';
            
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
            if (preferredVoice) utterance.voice = preferredVoice;

            window.speechSynthesis.speak(utterance);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = { role: "user", text: trimmed };
        const updatedMessages = [...messages, userMsg];
        
        setMessages(updatedMessages);
        setInputValue("");
        setLoading(true);

        try {
            let contextStr = "";
            try {
                const user = getStoredUser();
                const userId = user?._id || "";
                const role = user?.role || "visiteur";
                const name = user?.nom || "Inconnu";

                const [resDevis, resFactures] = await Promise.all([
                    fetch(`${API_BASE}/devis?clientId=${userId}`).catch(() => null),
                    fetch(`${API_BASE}/factures?clientId=${userId}`).catch(() => null)
                ]);

                const devis = resDevis && resDevis.ok ? await resDevis.json() : [];
                const factures = resFactures && resFactures.ok ? await resFactures.json() : [];

                const safeDevis = Array.isArray(devis) ? devis : [];
                const safeFactures = Array.isArray(factures) ? factures : [];

                contextStr = `\n\n[CONTEXTE TEMPS RÉEL]\nLangue client actuelle: ${lang}\nNom: ${name}\nRôle: ${role}\nNombre de Devis: ${safeDevis.length}\nNombre de Factures: ${safeFactures.length}\n\nRéponds obligatoirement en ${lang === 'ar-SA' ? 'ARABE' : lang === 'en-US' ? 'ANGLAIS' : 'FRANÇAIS'}.`;
            } catch (err) {
                console.error("Context Error:", err);
            }

            const history = updatedMessages
                .slice(-7)
                .map((m) => ({
                    role: m.role === "bot" ? "assistant" : "user",
                    content: m.text,
                }));

            const res = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: trimmed + contextStr,
                    history: history,
                }),
            });

            if (!res.ok) throw new Error("IA Server Down");

            const data = await res.json();
            const botMsg: Message = { role: "bot", text: data.response };
            setMessages((prev) => [...prev, botMsg]);
            speakBack(data.response);
        } catch (error) {
            console.error("Chatbot Error:", error);
            const errMsg: Message = { 
                role: "bot", 
                text: lang === 'ar-SA' 
                    ? "عذرًا، لم أتمكن من الاتصال بخادم الذكاء الاصطناعي حاليًا." 
                    : lang === 'en-US'
                    ? "Sorry, I couldn't connect to the AI server right now."
                    : "Désolé, impossible de contacter le serveur d'intelligence artificielle pour le moment." 
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-wrapper font-sans">
            <button
                onClick={() => {
                    const next = !isOpen;
                    setIsOpen(next);
                    if (onToggle) onToggle(next);
                }}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[9999] active:scale-95 ${
                    isOpen ? 'bg-gray-800 rotate-90 scale-90' : 'bg-gradient-to-tr from-amber-500 to-yellow-400 hover:scale-110'
                }`}
            >
                {isOpen ? <X className="text-white w-6 h-6" /> : <MessageCircle className="text-gray-900 w-7 h-7" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[390px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[80vh] bg-[#0a0a0a] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] z-[9998] flex flex-col overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-6">
                    <div className="p-6 bg-white/[0.03] border-b border-white/10 backdrop-blur-md flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-3">
                                <Sparkles className="w-6 h-6 text-gray-950" />
                            </div>
                            <div>
                                <p className="text-white font-black text-base tracking-tight">BMP AI Assistant</p>
                                <p className="text-[10px] text-emerald-400 uppercase font-black tracking-[0.2em]">En ligne</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[88%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${m.role === 'user' ? 'bg-amber-500/10' : 'bg-white/5'}`}>
                                        {m.role === 'user' ? <User className="w-4 h-4 text-amber-500" /> : <Bot className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                                        m.role === 'user' 
                                            ? 'bg-amber-500 text-gray-950 rounded-tr-none font-bold' 
                                            : 'bg-white/[0.07] text-gray-200 rounded-tl-none border border-white/10 backdrop-blur-sm'
                                    }`}>
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start items-center gap-3">
                                <div className="bg-white/5 px-4 py-3 rounded-2xl flex gap-1.5 items-center border border-white/5">
                                    <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-5 bg-white/[0.02] border-t border-white/10">
                        <div className="flex gap-3 items-center bg-white/[0.05] p-2 rounded-[1.5rem] border border-white/10 focus-within:border-amber-500/50">
                            <DictationButton 
                                onResult={(text) => setInputValue(p => p + (p ? " " : "") + text)}
                                className="!bg-transparent !p-2.5 text-gray-400 hover:text-amber-500"
                            />
                            <input 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={lang === 'ar-SA' ? 'اكتب...' : 'Votre message...'}
                                className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 placeholder-gray-600 px-2"
                                dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!inputValue.trim() || loading}
                                className="w-11 h-11 bg-amber-500 rounded-2xl hover:bg-amber-600 shadow-lg flex items-center justify-center active:scale-90"
                            >
                                <Send className="w-5 h-5 text-gray-950" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 20px; }
            `}</style>
        </div>
    );
}
