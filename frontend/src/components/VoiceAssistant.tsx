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
    const isLangCommand =
      transcript.includes("langue") ||
      transcript.includes("language") ||
      transcript.includes("لغة") ||
      transcript.includes("تغيير") ||
      transcript.includes("بدل");
    if (
      isLangCommand ||
      transcript.includes("arabe") ||
      transcript.includes("français") ||
      transcript.includes("anglais") ||
      transcript.includes("عرب") ||
      transcript.includes("فرنس") ||
      transcript.includes("انجليز")
    ) {
      if (transcript.includes("arabe") || transcript.includes("arabic") || transcript.includes("عرب")) {
        setLang("ar-SA");
        speakBack("تم تغيير اللغة إلى العربية", "ar-SA");
        return;
      }
      if (
        transcript.includes("français") ||
        transcript.includes("francais") ||
        transcript.includes("french") ||
        transcript.includes("فرنس")
      ) {
        setLang("fr-FR");
        speakBack("Changement de langue en français", "fr-FR");
        return;
      }
      if (
        transcript.includes("anglais") ||
        transcript.includes("english") ||
        transcript.includes("إنجليز") ||
        transcript.includes("انجليز")
      ) {
        setLang("en-US");
        speakBack("Language changed to English", "en-US");
        return;
      }
    }

    const isGo =
      transcript.includes("va") ||
      transcript.includes("aller") ||
      transcript.includes("ouvre") ||
      transcript.includes("go") ||
      transcript.includes("open") ||
      transcript.includes("إذهب") ||
      transcript.includes("افتح") ||
      transcript.includes("اذهب") ||
      transcript.includes("امشي") ||
      transcript.includes("وريني") ||
      transcript.includes("اعرض") ||
      transcript.includes("هزني") ||
      transcript.includes("ريني") ||
      transcript.includes("صفحة");

    if (
      transcript.includes("inscription") ||
      transcript.includes("register") ||
      transcript.includes("signup") ||
      transcript.includes("حساب جديد") ||
      transcript.includes("سجل")
    ) {
      speakBack(
        lang === "fr-FR"
          ? "Page d'inscription"
          : lang === "ar-SA"
            ? "صفحة التسجيل"
            : "Registration page",
      );
      routerInstance.push("/inscription");
      return;
    }
    if (
      transcript.includes("connexion") ||
      transcript.includes("login") ||
      transcript.includes("تسجيل الدخول") ||
      transcript.includes("دخول")
    ) {
      speakBack(
        lang === "fr-FR"
          ? "Page de connexion"
          : lang === "ar-SA"
            ? "صفحة الدخول"
            : "Login page",
      );
      routerInstance.push("/login");
      return;
    }

    if (
      transcript.includes("contact") ||
      transcript.includes("support") ||
      transcript.includes("aide") ||
      transcript.includes("اتصل") ||
      transcript.includes("مساعدة") ||
      transcript.includes("دعم")
    ) {
      speakBack(
        lang === "fr-FR"
          ? "Page de contact"
          : lang === "ar-SA"
            ? "صفحة الاتصال"
            : "Contact page",
      );
      routerInstance.push("/contact");
      return;
    }

    if (
      transcript.includes("profil") ||
      transcript.includes("compte") ||
      transcript.includes("profile") ||
      transcript.includes("account") ||
      transcript.includes("حسابي") ||
      transcript.includes("ملفي") ||
      transcript.includes("بروفايل")
    ) {
      speakBack(
        lang === "fr-FR"
          ? "Votre profil"
          : lang === "ar-SA"
            ? "الملف الشخصي"
            : "Your profile",
      );
      routerInstance.push("/espace/profil");
      return;
    }

    if (
      transcript.includes("admin") ||
      transcript.includes("administrateur") ||
      transcript.includes("ادارة") ||
      transcript.includes("مدير")
    ) {
      speakBack(
        lang === "fr-FR"
          ? "Espace Administrateur"
          : lang === "ar-SA"
            ? "مساحة الإدارة"
            : "Admin Space",
      );
      routerInstance.push("/espace/admin");
      return;
    }
    if (transcript.includes("expert") || transcript.includes("خبير")) {
      speakBack(
        lang === "fr-FR"
          ? "Espace Expert"
          : lang === "ar-SA"
            ? "مساحة الخبير"
            : "Expert Space",
      );
      routerInstance.push("/espace/expert");
      return;
    }
    if (transcript.includes("artisan") || transcript.includes("صنايعي") || transcript.includes("حرفي")) {
      speakBack(
        lang === "fr-FR"
          ? "Espace Artisan"
          : lang === "ar-SA"
            ? "مساحة الحرفي"
            : "Artisan Space",
      );
      routerInstance.push("/espace/artisan");
      return;
    }
    if (
      transcript.includes("fournisseur") ||
      transcript.includes("supplier") ||
      transcript.includes("مزود") ||
      transcript.includes("مورد")
    ) {
      speakBack(
        lang === "fr-FR"
          ? "Espace Fournisseur"
          : lang === "ar-SA"
            ? "مساحة المزود"
            : "Supplier Space",
      );
      routerInstance.push("/espace/fournisseur");
      return;
    }

    if (
      isGo ||
      transcript.includes("الرئيسية") ||
      transcript.includes("مشاريع") ||
      transcript.includes("فواتير") ||
      transcript.includes("سوق")
    ) {
      if (
        transcript.includes("chantier") ||
        transcript.includes("projet") ||
        transcript.includes("project") ||
        transcript.includes("مشاريع") ||
        transcript.includes("مشروع") ||
        transcript.includes("ورشة") ||
        transcript.includes("شوانط") ||
        transcript.includes("شانطي")
      ) {
        speakBack(
          lang === "fr-FR"
            ? "Ouverture des chantiers"
            : lang === "ar-SA"
              ? "فتح لوحة المشاريع"
              : "Opening projects",
        );
        routerInstance.push("/gestion-chantier");
        return;
      }
      if (
        transcript.includes("devis") ||
        transcript.includes("facturation") ||
        transcript.includes("facture") ||
        transcript.includes("quote") ||
        transcript.includes("invoice") ||
        transcript.includes("فاتورة") ||
        transcript.includes("فواتير") ||
        transcript.includes("ديفي") ||
        transcript.includes("حساب") ||
        transcript.includes("فلوس")
      ) {
        speakBack(
          lang === "fr-FR"
            ? "Vos devis et factures"
            : lang === "ar-SA"
              ? "الذهاب إلى الفواتير"
              : "Your quotes and invoices",
        );
        routerInstance.push("/gestion-devis-facturation");
        return;
      }
      if (
        transcript.includes("marketplace") ||
        transcript.includes("boutique") ||
        transcript.includes("magasin") ||
        transcript.includes("store") ||
        transcript.includes("متجر") ||
        transcript.includes("سوق") ||
        transcript.includes("منتجات") ||
        transcript.includes("شراء") ||
        transcript.includes("سلعة") ||
        transcript.includes("مواد")
      ) {
        speakBack(
          lang === "fr-FR"
            ? "Accès au magasin"
            : lang === "ar-SA"
              ? "الوصول إلى السوق"
              : "Accessing the store",
        );
        routerInstance.push("/gestion-marketplace");
        return;
      }
      if (
        transcript.includes("espace") ||
        transcript.includes("client") ||
        transcript.includes("accueil") ||
        transcript.includes("home") ||
        transcript.includes("dashboard") ||
        transcript.includes("الرئيسية") ||
        transcript.includes("حساب") ||
        transcript.includes("بداية") ||
        transcript.includes("دار") ||
        transcript.includes("أكوي")
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
      transcript.includes("créer") ||
      transcript.includes("nouveau") ||
      transcript.includes("creer") ||
      transcript.includes("ajoute") ||
      transcript.includes("create") ||
      transcript.includes("new") ||
      transcript.includes("add") ||
      transcript.includes("إنشاء") ||
      transcript.includes("جديد") ||
      transcript.includes("اضافة") ||
      transcript.includes("زيد") ||
      transcript.includes("اعمل") ||
      transcript.includes("اصنع") ||
      transcript.includes("صب");
    if (isCreate) {
      if (
        transcript.includes("projet") ||
        transcript.includes("chantier") ||
        transcript.includes("project") ||
        transcript.includes("مشروع") ||
        transcript.includes("مشاريع") ||
        transcript.includes("بناء") ||
        transcript.includes("شانطي")
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
        if (targetRole === "client") {
          routerInstance.push("/espace/client/nouveau-projet");
        } else {
          routerInstance.push(`/espace/${targetRole}`);
        }
        return;
      }
    }
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
