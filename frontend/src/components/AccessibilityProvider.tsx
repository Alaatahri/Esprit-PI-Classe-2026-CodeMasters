"use client";

import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from "react";
import { Eye, Type, ZoomIn, Focus, Activity, UserPlus, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export type AccessibilityProfile =
  | "none"
  | "malvoyant"
  | "daltonien"
  | "dyslexique"
  | "mobilite"
  | "senior"
  | "concentration";

interface AccessibilityContextType {
  profile: AccessibilityProfile;
  setProfile: (p: AccessibilityProfile) => void;
  highContrast: boolean;
  largeText: boolean;
  readableFont: boolean;
  stopAnimations: boolean;
  readingMask: boolean;
}

const ACCESS_PREFIX = "access-";
const ACCESS_IDS: AccessibilityProfile[] = [
  "none",
  "malvoyant",
  "daltonien",
  "dyslexique",
  "mobilite",
  "senior",
  "concentration",
];

function stripAccessClasses(el: HTMLElement) {
  ACCESS_IDS.forEach((id) => {
    if (id === "none") return;
    el.classList.remove(`${ACCESS_PREFIX}${id}`);
  });
}

function applyAccessToDom(profile: AccessibilityProfile) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  stripAccessClasses(root);
  stripAccessClasses(body);
  if (profile !== "none") {
    root.classList.add(`${ACCESS_PREFIX}${profile}`);
  }
}

function isValidProfile(v: string | null): v is AccessibilityProfile {
  if (!v) return false;
  return ACCESS_IDS.includes(v as AccessibilityProfile);
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  profile: "none",
  setProfile: () => {},
  highContrast: false,
  largeText: false,
  readableFont: false,
  stopAnimations: false,
  readingMask: false,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<AccessibilityProfile>("none");
  const [readingMaskPos, setReadingMaskPos] = useState(0);

  const setProfile = (newProfile: AccessibilityProfile) => {
    setProfileState(newProfile);
    localStorage.setItem("bmp_access_profile", newProfile);
    applyAccessToDom(newProfile);
  };

  useLayoutEffect(() => {
    const raw = localStorage.getItem("bmp_access_profile");
    if (isValidProfile(raw) && raw !== "none") {
      setProfileState(raw);
      applyAccessToDom(raw);
    } else if (raw && !isValidProfile(raw)) {
      localStorage.removeItem("bmp_access_profile");
      applyAccessToDom("none");
    }
  }, []);

  useEffect(() => {
    if (profile === "concentration") {
      const updateMouse = (e: MouseEvent) => setReadingMaskPos(e.clientY);
      window.addEventListener("mousemove", updateMouse);
      return () => window.removeEventListener("mousemove", updateMouse);
    }
    return undefined;
  }, [profile]);

  return (
    <AccessibilityContext.Provider
      value={{
        profile,
        setProfile,
        highContrast:
          profile === "malvoyant" || profile === "daltonien" || profile === "senior",
        largeText: profile === "malvoyant" || profile === "senior",
        readableFont: profile === "dyslexique",
        stopAnimations: profile === "concentration" || profile === "mobilite",
        readingMask: profile === "concentration",
      }}
    >
      {children}

      {profile === "concentration" && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{
            background: `radial-gradient(circle 150px at center ${readingMaskPos}px, transparent 0%, rgba(0,0,0,0.6) 100%)`,
          }}
        />
      )}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);

export function AccessibilityMenu({ onClose }: { onClose?: () => void }) {
  const { profile, setProfile } = useAccessibility();
  const { lang } = useLanguage();

  const profiles = [
    { id: "malvoyant", icon: ZoomIn, label: "Malvoyant", desc: "Grand texte, contraste fort" },
    { id: "daltonien", icon: Eye, label: "Daltonien", desc: "Couleurs adaptées, contrastes purs" },
    { id: "dyslexique", icon: Type, label: "Dyslexique", desc: "Police espacée, lignes claires" },
    {
      id: "mobilite",
      icon: Activity,
      label: "Mobilité Réduite",
      desc: "Navigation clavier, gros focus",
    },
    { id: "senior", icon: UserPlus, label: "Senior", desc: "Texte lisible, simplifié" },
    {
      id: "concentration",
      icon: Focus,
      label: "Concentration",
      desc: "Masque de lecture, sans animations",
    },
  ];

  return (
    <div
      className="bg-gray-900/95 backdrop-blur-2xl border border-white/20 p-4 rounded-3xl shadow-[0_0_50px_rgba(251,191,36,0.2)] w-80 max-w-[90vw] animate-in zoom-in-95"
      dir={lang === "ar-SA" ? "rtl" : "ltr"}
    >
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-500" />
          {lang === "ar-SA"
            ? "إمكانية الوصول"
            : lang === "en-US"
              ? "Accessibility"
              : "Accessibilité Universelle"}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => setProfile("none")}
          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
            profile === "none"
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }`}
        >
          <span className="font-semibold text-sm">Mode Standard</span>
        </button>

        {profiles.map((p) => {
          const Icon = p.icon;
          const isActive = profile === p.id;
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => setProfile(p.id as AccessibilityProfile)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? "bg-amber-500/20" : "bg-white/5"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left flex-1" dir={lang === "ar-SA" ? "rtl" : "ltr"}>
                <div className="font-semibold text-sm">{p.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{p.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
