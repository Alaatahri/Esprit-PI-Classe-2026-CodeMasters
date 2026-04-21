"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import { Globe } from "lucide-react";

export type LangCode = "fr-FR" | "en-US" | "ar-SA";

export const translations = {
  "fr-FR": {
    espace_client: "Espace client",
    connectez_vous: "Connectez-vous pour créer et suivre vos projets.",
    aller_connexion: "Aller à la connexion",
    espace_reserve: "Espace réservé aux clients",
    connecte_en_tant_que: "Vous êtes connecté en tant que",
    ecran_dedie: "Cet écran est dédié aux clients qui créent des projets.",
    bonjour: "Bonjour",
    inspirez_vous:
      "Inspirez-vous de projets déjà réalisés et découvrez des idées de produits pour vos travaux.",
    nouveau_projet: "Nouveau projet",
    projets_realises: "Projets réalisés via BMP.tn",
    inspiration: "Inspiration",
    quelques_projets:
      "Quelques projets menés avec des experts et artisans via BMP.tn, avec leur budget, durée et avis.",
    mes_projets_recents: "Mes projets récents",
    aucun_projet:
      "Vous n'avez pas encore créé de projet. Remplissez le formulaire à gauche pour commencer.",
    terminé: "Terminé",
    en_cours: "En cours",
    en_attente: "En attente",
    avancement: "avancement",
    produits_populaires: "Produits populaires du marketplace",
    marketplace: "Marketplace",
    quelques_produits:
      "Quelques produits fréquemment commandés pour les projets de construction et rénovation.",
    creer_nouveau_projet: "Créer un nouveau projet",
    decrivez_besoin:
      "Décrivez votre besoin (construction, rénovation, extension…) pour que les experts et artisans puissent vous accompagner.",
    titre_projet: "Titre du projet",
    placeholder_titre:
      "Ex: Construction maison familiale, Extension chambre, Rénovation cuisine…",
    description: "Description",
    placeholder_desc:
      "Décrivez votre besoin, la surface, le budget estimé, les délais souhaités, etc.",
    date_debut: "Date de début souhaitée",
    date_fin: "Date de fin prévue",
    budget: "Budget estimé (TND)",
    placeholder_budget: "Ex: 50000",
    creer_projet: "Créer le projet",
    creation_en_cours: "Création en cours...",
    succes_creation: "Projet créé avec succès.",
    erreur_creation: "Erreur lors de la création du projet.",
    assistant_vocal: "Assistant Vocal",
    ecoute: "Écoute en cours...",
    dicter: "Appuyez pour dicter",
    non_supporte: "Microphone non supporté par votre navigateur.",
    mon_espace: "Mon espace",
    gestion_chantier: "Gestion de Chantier",
    devis_facturation: "Devis & Facturation",
    contact: "Contact",
    mes_projets: "Mes projets",
    connexion: "Connexion",
    deconnexion: "Déconnexion",
    nouveau_projet_plus: "Nouveau projet +",
    nav_chantier: "Chantier",
    nav_devis: "Devis",
    nav_suivi_mes_projets: "Suivi de mes projets",
    nav_plus_nouveau_projet: "+ Nouveau projet",
    nav_tous_les_projets: "Tous les projets",
    nav_projets: "Projets",
    nav_invitations: "Invitations",
    nav_messages: "Messages",
    tagline_plateforme: "PLATEFORME",
    mobile_menu: "Menu",
    changer_langue: "Changer de langue",
    aria_fermer_menu: "Fermer le menu",
    aria_fermer: "Fermer",
    title_suivi_photos: "Voir le taux d'avancement et les photos de chantier",
  },
  "en-US": {
    espace_client: "Client Space",
    connectez_vous: "Log in to create and track your projects.",
    aller_connexion: "Go to login",
    espace_reserve: "Client reserved space",
    connecte_en_tant_que: "You are logged in as",
    ecran_dedie: "This screen is dedicated to clients creating projects.",
    bonjour: "Hello",
    inspirez_vous:
      "Get inspired by completed projects and discover product ideas for your work.",
    nouveau_projet: "New Project",
    projets_realises: "Projects completed via BMP.tn",
    inspiration: "Inspiration",
    quelques_projets:
      "Some projects carried out with experts and craftsmen via BMP.tn, with their budget, duration and reviews.",
    mes_projets_recents: "My recent projects",
    aucun_projet:
      "You haven't created a project yet. Fill out the form to get started.",
    terminé: "Completed",
    en_cours: "In progress",
    en_attente: "Pending",
    avancement: "progress",
    produits_populaires: "Popular marketplace products",
    marketplace: "Marketplace",
    quelques_produits:
      "Some frequently ordered products for construction and renovation projects.",
    creer_nouveau_projet: "Create a new project",
    decrivez_besoin:
      "Describe your needs (construction, renovation, extension...) so that experts and craftsmen can assist you.",
    titre_projet: "Project Title",
    placeholder_titre:
      "Ex: Family home construction, Room extension, Kitchen renovation...",
    description: "Description",
    placeholder_desc:
      "Describe your need, surface area, estimated budget, desired deadlines, etc.",
    date_debut: "Desired start date",
    date_fin: "Estimated end date",
    budget: "Estimated budget (TND)",
    placeholder_budget: "Ex: 50000",
    creer_projet: "Create project",
    creation_en_cours: "Creating...",
    succes_creation: "Project successfully created.",
    erreur_creation: "Error creating project.",
    assistant_vocal: "Voice Assistant",
    ecoute: "Listening...",
    dicter: "Press to dictate",
    non_supporte: "Microphone not supported by your browser.",
    mon_espace: "My Space",
    gestion_chantier: "Site Management",
    devis_facturation: "Quotes & Invoicing",
    contact: "Contact",
    mes_projets: "My Projects",
    connexion: "Login",
    deconnexion: "Logout",
    nouveau_projet_plus: "New Project +",
    nav_chantier: "Sites",
    nav_devis: "Quotes",
    nav_suivi_mes_projets: "Project tracking",
    nav_plus_nouveau_projet: "+ New project",
    nav_tous_les_projets: "All projects",
    nav_projets: "Projects",
    nav_invitations: "Invitations",
    nav_messages: "Messages",
    tagline_plateforme: "PLATFORM",
    mobile_menu: "Menu",
    changer_langue: "Change language",
    aria_fermer_menu: "Close menu",
    aria_fermer: "Close",
    title_suivi_photos: "View progress and site photos",
  },
  "ar-SA": {
    espace_client: "مساحة العميل",
    connectez_vous: "سجل الدخول لإنشاء وتتبع مشاريعك.",
    aller_connexion: "الذهاب لتسجيل الدخول",
    espace_reserve: "مساحة مخصصة للعملاء",
    connecte_en_tant_que: "لقد قمت بتسجيل الدخول كـ",
    ecran_dedie: "هذه الشاشة مخصصة للعملاء الذين ينشئون مشاريع.",
    bonjour: "مرحباً",
    inspirez_vous:
      "استلهم من المشاريع المنجزة واكتشف أفكارًا لمنتجات لأعمالك.",
    nouveau_projet: "مشروع جديد",
    projets_realises: "المشاريع المنجزة عبر BMP.tn",
    inspiration: "إلهام",
    quelques_projets:
      "بعض المشاريع المنفذة مع الخبراء والحرفيين عبر BMP.tn، مع ميزانيتها ومدتها والآراء.",
    mes_projets_recents: "مشاريعي الأخيرة",
    aucun_projet: "لم تقم بإنشاء مشروع بعد. املأ النموذج للبدء.",
    terminé: "مكتمل",
    en_cours: "قيد التنفيذ",
    en_attente: "قيد الانتظار",
    avancement: "تقدم",
    produits_populaires: "المنتجات الأكثر رواجاً في السوق",
    marketplace: "السوق",
    quelques_produits:
      "بعض المنتجات المطلوبة بشكل متكرر لمشاريع البناء والتجديد.",
    creer_nouveau_projet: "إنشاء مشروع جديد",
    decrivez_besoin:
      "صف حاجتك (بناء، تجديد، توسعة...) حتى يتمكن الخبراء والحرفيون من مرافقتك.",
    titre_projet: "عنوان المشروع",
    placeholder_titre: "مثال: بناء منزل عائلي، توسيع غرفة، تجديد المطبخ...",
    description: "الوصف",
    placeholder_desc:
      "صف حاجتك، المساحة، الميزانية المقدرة، المواعيد النهائية المطلوبة، إلخ.",
    date_debut: "تاريخ البدء المطلوب",
    date_fin: "تاريخ الانتهاء المقدر",
    budget: "الميزانية المقدرة (TND)",
    placeholder_budget: "مثال: 50000",
    creer_projet: "إنشاء المشروع",
    creation_en_cours: "جاري الإنشاء...",
    succes_creation: "تم إنشاء المشروع بنجاح.",
    erreur_creation: "خطأ أثناء إنشاء المشروع.",
    assistant_vocal: "المساعد الصوتي",
    ecoute: "جاري الاستماع...",
    dicter: "اضغط للإملاء",
    non_supporte: "الميكروفون غير مدعوم في متصفحك.",
    mon_espace: "مساحتي",
    gestion_chantier: "إدارة الموقع",
    devis_facturation: "عروض الأسعار والفواتير",
    contact: "اتصل بنا",
    mes_projets: "مشاريعي",
    connexion: "تسجيل الدخول",
    deconnexion: "تسجيل الخروج",
    nouveau_projet_plus: "مشروع جديد +",
    nav_chantier: "الموقع",
    nav_devis: "عروض الأسعار",
    nav_suivi_mes_projets: "متابعة مشاريعي",
    nav_plus_nouveau_projet: "+ مشروع جديد",
    nav_tous_les_projets: "كل المشاريع",
    nav_projets: "المشاريع",
    nav_invitations: "الدعوات",
    nav_messages: "الرسائل",
    tagline_plateforme: "المنصة",
    mobile_menu: "القائمة",
    changer_langue: "تغيير اللغة",
    aria_fermer_menu: "إغلاق القائمة",
    aria_fermer: "إغلاق",
    title_suivi_photos: "عرض نسبة الإنجاز وصور الموقع",
  },
};

export type TranslationKeys = keyof (typeof translations)["fr-FR"];

interface LangContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LangContextType>({
  lang: "fr-FR",
  setLang: () => {},
  t: (key) => translations["fr-FR"][key] || key,
});

function applyDocumentLang(code: LangCode) {
  if (typeof document === "undefined") return;
  document.documentElement.dir = code === "ar-SA" ? "rtl" : "ltr";
  document.documentElement.lang = code === "ar-SA" ? "ar" : code === "en-US" ? "en" : "fr";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("fr-FR");

  useLayoutEffect(() => {
    const raw = localStorage.getItem("bmp_lang");
    if (raw === "fr-FR" || raw === "en-US" || raw === "ar-SA") {
      setLangState(raw);
      applyDocumentLang(raw);
    }
  }, []);

  const handleSetLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    localStorage.setItem("bmp_lang", newLang);
    applyDocumentLang(newLang);
    try {
      window.dispatchEvent(new CustomEvent("bmp:lang-change", { detail: newLang }));
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKeys) =>
      translations[lang][key] || translations["fr-FR"][key] || String(key),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang: handleSetLang, t }),
    [lang, handleSetLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function LanguageSwitcher({
  onMenuOpenChange,
}: {
  onMenuOpenChange?: (open: boolean) => void;
}) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onMenuOpenChange?.(open);
  }, [open, onMenuOpenChange]);

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 shadow-lg transition-transform hover:scale-105"
        title={t("changer_langue")}
      >
        <Globe className="w-5 h-5" />
        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-900">
          {lang === "fr-FR" ? "FR" : lang === "ar-SA" ? "AR" : "EN"}
        </span>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+12px)] right-0 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-2 flex flex-col gap-1 w-36">
          <button
            type="button"
            onClick={() => {
              setLang("fr-FR");
              setOpen(false);
            }}
            className={`px-4 py-2.5 text-left text-sm rounded-lg hover:bg-white/10 transition-colors ${
              lang === "fr-FR"
                ? "text-amber-400 font-bold bg-white/5"
                : "text-gray-300"
            }`}
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => {
              setLang("en-US");
              setOpen(false);
            }}
            className={`px-4 py-2.5 text-left text-sm rounded-lg hover:bg-white/10 transition-colors ${
              lang === "en-US"
                ? "text-amber-400 font-bold bg-white/5"
                : "text-gray-300"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => {
              setLang("ar-SA");
              setOpen(false);
            }}
            dir="rtl"
            className={`px-4 py-2.5 text-right text-sm rounded-lg hover:bg-white/10 transition-colors ${
              lang === "ar-SA"
                ? "text-amber-400 font-bold bg-white/5"
                : "text-gray-300"
            }`}
          >
            العربية
          </button>
        </div>
      )}
    </div>
  );
}
