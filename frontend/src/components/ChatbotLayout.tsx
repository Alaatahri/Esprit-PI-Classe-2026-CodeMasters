"use client";

import { useState } from "react";
import { ChatbotWidget } from "./ChatbotWidget";
import { VoiceAssistant } from "./VoiceAssistant";
import { LanguageSwitcher } from "./LanguageProvider";
import { AccessibilityMenu } from "./AccessibilityProvider";
import { Sparkles, X, Eye } from "lucide-react";

export function ChatbotLayout() {
  const [hovered, setHovered] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAccOpen, setIsAccOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const showMenu = hovered || dockOpen || isChatOpen || isAccOpen || langMenuOpen;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col items-center gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`flex flex-col gap-3 bg-gray-900/95 backdrop-blur-2xl border border-white/20 p-2.5 rounded-[2rem] shadow-[0_0_40px_rgba(251,191,36,0.15)] transition-opacity duration-300 ${
          showMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative z-50">
          <button
            type="button"
            onClick={() => setIsAccOpen(!isAccOpen)}
            className={`w-12 h-12 rounded-full ${
              isAccOpen ? "bg-amber-500 text-gray-900" : "bg-white/10 text-white hover:bg-white/20"
            } backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-transform hover:scale-105`}
            title="Accessibilité"
            aria-expanded={isAccOpen}
            aria-label="Menu accessibilité"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
        <div className="w-8 h-px bg-white/10 mx-auto" />
        <LanguageSwitcher onMenuOpenChange={setLangMenuOpen} />
        <div className="w-8 h-px bg-white/10 mx-auto" />
        <VoiceAssistant />
        <div className="w-8 h-px bg-white/10 mx-auto" />
        <ChatbotWidget onToggle={(open) => setIsChatOpen(open)} />
      </div>

      <button
        type="button"
        onClick={() => setDockOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 shadow-xl shadow-amber-500/30 flex items-center justify-center transition-transform hover:scale-105"
        aria-expanded={showMenu}
        aria-label={showMenu ? "Fermer le menu d'accessibilité" : "Ouvrir le menu d'accessibilité"}
      >
        {showMenu ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {isAccOpen && (
        <div className="absolute right-[calc(100%+16px)] bottom-16 z-[110]">
          <AccessibilityMenu onClose={() => setIsAccOpen(false)} />
        </div>
      )}
    </div>
  );
}
