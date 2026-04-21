"use client";

import { useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

export function KeyboardTTS() {
  const { lang } = useLanguage();

  useEffect(() => {
    let isKeyboardNav = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        isKeyboardNav = true;
      }
    };

    const handleMouseDown = () => {
      isKeyboardNav = false;
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (!isKeyboardNav) return;

      const target = e.target as HTMLElement;
      if (!target || target === document.body) return;

      let textToSpeak =
        target.getAttribute("aria-label") ||
        target.getAttribute("title") ||
        target.innerText ||
        target.textContent ||
        "";

      textToSpeak = textToSpeak.replace(/\s+/g, " ").trim();

      if (!textToSpeak) {
        if (target.tagName === "INPUT") {
          const input = target as HTMLInputElement;
          textToSpeak =
            input.placeholder ||
            input.name ||
            input.type ||
            (lang === "fr-FR" ? "Champ de texte" : lang === "ar-SA" ? "حقل إدخال" : "Text field");
        } else if (target.tagName === "BUTTON") {
          textToSpeak = lang === "fr-FR" ? "Bouton" : lang === "ar-SA" ? "زر" : "Button";
        } else if (target.tagName === "A") {
          textToSpeak = lang === "fr-FR" ? "Lien" : lang === "ar-SA" ? "رابط" : "Link";
        }
      }

      if (textToSpeak && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("focusin", handleFocusIn);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("focusin", handleFocusIn);
    };
  }, [lang]);

  return null;
}
