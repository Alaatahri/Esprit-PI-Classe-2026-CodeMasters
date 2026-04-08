"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- reconnaissance vocale navigateur (API hétérogène) */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { getStoredUser } from "@/lib/auth";

export function VoiceAssistant() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [supportText, setSupportText] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const routeAliases: Array<{
    href: string;
    keys: string[];
    speak: { fr: string; en: string; ar: string };
  }> = [
    {
      href: "/",
      keys: ["accueil", "home", "الرئيسية", "main"],
      speak: { fr: "Accueil", en: "Home", ar: "الصفحة الرئيسية" },
    },
    {
      href: "/espace",
      keys: ["espace", "dashboard", "mon espace", "space", "مساحتي"],
      speak: { fr: "Retour à votre espace", en: "Back to your space", ar: "العودة إلى مساحتك" },
    },
    {
      href: "/gestion-chantier",
      keys: ["chantier", "projet", "projects", "worksite", "site", "مشاريع", "مشروع", "ورشة"],
      speak: { fr: "Ouverture des chantiers", en: "Opening site management", ar: "فتح إدارة المشاريع" },
    },
    {
      href: "/gestion-devis-facturation",
      keys: ["devis", "facture", "facturation", "invoice", "quote", "فواتير", "فاتورة"],
      speak: { fr: "Devis et facturation", en: "Quotes and invoicing", ar: "عروض الأسعار والفواتير" },
    },
    {
      href: "/gestion-marketplace",
      keys: ["marketplace", "boutique", "magasin", "store", "shop", "سوق", "متجر"],
      speak: { fr: "Marketplace", en: "Marketplace", ar: "السوق" },
    },
    {
      href: "/messages",
      keys: ["message", "messages", "chat", "messagerie", "الرسائل"],
      speak: { fr: "Messages", en: "Messages", ar: "الرسائل" },
    },
    {
      href: "/contact",
      keys: ["contact", "support", "aide", "help", "اتصل", "مساعدة", "دعم"],
      speak: { fr: "Page de contact", en: "Contact page", ar: "صفحة الاتصال" },
    },
    {
      href: "/login",
      keys: ["login", "connexion", "se connecter", "تسجيل الدخول", "دخول"],
      speak: { fr: "Page de connexion", en: "Login page", ar: "صفحة الدخول" },
    },
    {
      href: "/inscription",
      keys: ["inscription", "register", "signup", "سجل", "حساب جديد"],
      speak: { fr: "Page d'inscription", en: "Registration page", ar: "صفحة التسجيل" },
    },
    {
      href: "/espace/client/nouveau-projet",
      keys: ["nouveau projet", "créer projet", "create project", "new project", "إنشاء مشروع", "مشروع جديد"],
      speak: { fr: "Création de projet", en: "Create a new project", ar: "إنشاء مشروع جديد" },
    },
  ];

  const speakBack = (text: string, forceLang?: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = forceLang || lang;
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) => v.lang.startsWith(targetLang.substring(0, 2)));
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window as unknown as {
        SpeechRecognition?: new () => unknown;
        webkitSpeechRecognition?: new () => unknown;
      };
      const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor() as any;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = lang;

        recognition.onresult = (event: any) => {
          const transcript =
            event.results[event.results.length - 1][0].transcript.toLowerCase() || "";
          setSupportText(transcript);
          handleCommand(transcript, router);
        };

        recognition.onend = () => {
          setIsListening(false);
          setTimeout(() => setSupportText(""), 4000);
        };

        recognition.onerror = (e: { error: string }) => {
          console.error("Erreur de reconnaissance vocale:", e.error);
          setIsListening(false);
          setSupportText("Erreur micro / Mic error");
        };

        recognitionRef.current = recognition;
        setIsSupported(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setup unique
  }, [router]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  const handleCommand = (transcript: string, routerInstance: ReturnType<typeof useRouter>) => {
    const raw = String(transcript || "").trim();
    const t = raw.toLowerCase();

    // Allow "go to /some/path"
    const pathMatch = raw.match(/(\/[a-z0-9\-\/\[\]]+)/i);
    if (pathMatch?.[1]) {
      const p = pathMatch[1];
      speakBack(
        lang === "fr-FR" ? `Ouverture ${p}` : lang === "ar-SA" ? `فتح ${p}` : `Opening ${p}`,
      );
      routerInstance.push(p);
      return;
    }

    const isLangCommand =
      t.includes("langue") || t.includes("language") || t.includes("لغة") || t.includes("تغيير") || t.includes("بدل");
    if (
      isLangCommand ||
      t.includes("arabe") ||
      t.includes("français") ||
      t.includes("francais") ||
      t.includes("anglais") ||
      t.includes("arabic") ||
      t.includes("french") ||
      t.includes("english") ||
      t.includes("عرب") ||
      t.includes("فرنس") ||
      t.includes("انجليز")
    ) {
      if (t.includes("arabe") || t.includes("arabic") || t.includes("عرب")) {
        setLang("ar-SA");
        speakBack("تم تغيير اللغة إلى العربية", "ar-SA");
        return;
      }
      if (
        t.includes("français") ||
        t.includes("francais") ||
        t.includes("french") ||
        t.includes("فرنس")
      ) {
        setLang("fr-FR");
        speakBack("Changement de langue en français", "fr-FR");
        return;
      }
      if (
        t.includes("anglais") ||
        t.includes("english") ||
        t.includes("إنجليز") ||
        t.includes("انجليز")
      ) {
        setLang("en-US");
        speakBack("Language changed to English", "en-US");
        return;
      }
    }

    // Generic navigation to "any page" by keywords.
    const wantsNav =
      t.includes("va") ||
      t.includes("aller") ||
      t.includes("ouvre") ||
      t.includes("go") ||
      t.includes("open") ||
      t.includes("take me") ||
      t.includes("navigate") ||
      t.includes("إذهب") ||
      t.includes("افتح") ||
      t.includes("اذهب") ||
      t.includes("صفحة");

    if (wantsNav) {
      // Prefer role-aware /espace route if user says "espace"
      if (t.includes("espace") || t.includes("dashboard") || t.includes("مساح")) {
        const user = getStoredUser();
        const targetRole = user?.role || "client";
        const href = `/espace/${targetRole}`;
        speakBack(routeAliases[1]?.speak?.fr || "Retour à votre espace");
        routerInstance.push(href);
        return;
      }

      for (const r of routeAliases) {
        if (r.keys.some((k) => t.includes(k))) {
          const speak =
            lang === "fr-FR" ? r.speak.fr : lang === "ar-SA" ? r.speak.ar : r.speak.en;
          speakBack(speak);
          routerInstance.push(r.href);
          return;
        }
      }
    }

    if (
      wantsNav ||
      t.includes("الرئيسية") ||
      t.includes("مشاريع") ||
      t.includes("فواتير") ||
      t.includes("سوق")
    ) {
      if (
        t.includes("espace") ||
        t.includes("client") ||
        t.includes("accueil") ||
        t.includes("home") ||
        t.includes("dashboard") ||
        t.includes("الرئيسية") ||
        t.includes("حساب") ||
        t.includes("بداية")
      ) {
        const user = getStoredUser();
        const targetRole = user?.role || "client";
        speakBack(
          lang === "fr-FR"
            ? "Retour à l'espace"
            : lang === "ar-SA"
              ? "العودة إلى مساحتك"
              : "Returning to space",
        );
        routerInstance.push(`/espace/${targetRole}`);
        return;
      }
    }

    const isCreate =
      t.includes("créer") ||
      t.includes("nouveau") ||
      t.includes("creer") ||
      t.includes("ajoute") ||
      t.includes("create") ||
      t.includes("new") ||
      t.includes("add") ||
      t.includes("إنشاء") ||
      t.includes("جديد") ||
      t.includes("اضافة") ||
      t.includes("اعمل") ||
      t.includes("اصنع");
    if (isCreate) {
      if (
        t.includes("projet") ||
        t.includes("chantier") ||
        t.includes("project") ||
        t.includes("مشروع") ||
        t.includes("مشاريع") ||
        t.includes("بناء")
      ) {
        const user = getStoredUser();
        const targetRole = user?.role || "client";
        speakBack(
          lang === "fr-FR"
            ? "Création de projet"
            : lang === "ar-SA"
              ? "فتح صفحة إنشاء مشروع جديد"
              : "Creating new project",
        );
        routerInstance.push(
          targetRole === "client" ? "/espace/client/nouveau-projet" : `/espace/${targetRole}`,
        );
        return;
      }
    }

    speakBack(
      lang === "fr-FR"
        ? "Je n'ai pas compris. Dites par exemple : « ouvre marketplace », « va à devis », ou « ouvre /messages »."
        : lang === "ar-SA"
          ? "لم أفهم. قل مثلاً: افتح السوق، أو اذهب إلى الفواتير، أو افتح /messages."
          : "I didn't understand. Say for example: open marketplace, go to invoices, or open /messages.",
    );
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSupportText("");
    } else {
      try {
        setSupportText(
          lang === "fr-FR" ? "Écoute en cours..." : lang === "ar-SA" ? "جاري الاستماع..." : "Listening...",
        );
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Microphone in use or error", e);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={toggleListen}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 ${
          isListening
            ? "bg-red-500 text-white animate-pulse shadow-red-500/50"
            : "bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 shadow-amber-500/40 hover:shadow-amber-500/60"
        }`}
        aria-label="Assistant Vocal"
        title={
          lang === "fr-FR"
            ? "Assistant Vocal"
            : lang === "ar-SA"
              ? "المساعد الصوتي"
              : "Voice Assistant"
        }
      >
        {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-gray-800" />}
      </button>
      {supportText && (
        <div
          className="absolute right-[calc(100%+16px)] top-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-xl text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 max-w-[250px] whitespace-nowrap"
          dir={lang === "ar-SA" ? "rtl" : "ltr"}
        >
          {supportText}
        </div>
      )}
    </div>
  );
}
