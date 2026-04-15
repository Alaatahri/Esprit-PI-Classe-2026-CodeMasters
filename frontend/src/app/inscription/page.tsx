"use client";

import {
  useMemo,
  useState,
  useEffect,
  FormEvent,
  useCallback,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";
import { formatApiError } from "@/lib/api-error";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  buildZonesTravail,
  buildZonesLivraison,
  buildLivreurDisponibilite,
  validateInscriptionForm,
  type FieldKey,
  type NiveauEtudes,
  type MoyenTransportLivreur,
} from "@/lib/inscription-validation";
import { FieldError, fieldInputClass } from "@/lib/form-ui";

const API_URL = getApiBaseUrl();

const ROLES = [
  { value: "client", label: "Client" },
  { value: "expert", label: "Expert" },
  { value: "artisan", label: "Artisan" },
  { value: "manufacturer", label: "Fabricant" },
  { value: "livreur", label: "Livreur" },
] as const;

type WorkZone = {
  scope: "tn_all" | "tn_city" | "tn_region" | "country" | "world";
  value?: string;
};

export default function InscriptionPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("client");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [experienceAnnees, setExperienceAnnees] = useState<string>("");
  const [domaineExpertise, setDomaineExpertise] = useState("");
  const [expertExperienceAnnees, setExpertExperienceAnnees] = useState("");
  const [niveauEtudes, setNiveauEtudes] = useState<NiveauEtudes | "">("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvDragging, setCvDragging] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [moyenTransport, setMoyenTransport] = useState<MoyenTransportLivreur | "">(
    "",
  );
  const [zoneLivTunisie, setZoneLivTunisie] = useState(false);
  const [zoneLivVillesTunisie, setZoneLivVillesTunisie] = useState(false);
  const [zoneLivRegion, setZoneLivRegion] = useState(false);
  const [villesLivreur, setVillesLivreur] = useState("");
  const [regionLivreur, setRegionLivreur] = useState("");
  const [dispoTempsPlein, setDispoTempsPlein] = useState(false);
  const [dispoTempsPartiel, setDispoTempsPartiel] = useState(false);
  const [dispoWeekend, setDispoWeekend] = useState(false);
  const [cinFile, setCinFile] = useState<File | null>(null);
  const [cinDragging, setCinDragging] = useState(false);
  const [cinPreviewUrl, setCinPreviewUrl] = useState<string | null>(null);
  const cinInputRef = useRef<HTMLInputElement>(null);
  const [zoneTunisie, setZoneTunisie] = useState(false);
  const [zoneMonde, setZoneMonde] = useState(false);
  const [zoneVillesTunisie, setZoneVillesTunisie] = useState(false);
  const [zonePays, setZonePays] = useState(false);
  const [villesTunisie, setVillesTunisie] = useState("");
  const [pays, setPays] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  /** true = e-mail de vérification réellement envoyé par le serveur SMTP */
  const [verificationEmailSent, setVerificationEmailSent] = useState<
    boolean | undefined
  >(undefined);
  /** true = backend ALLOW_REGISTRATION_WITHOUT_SMTP (dev uniquement) */
  const [devBypass, setDevBypass] = useState(false);
  /** Lien Ethereal (dev sans Gmail) pour ouvrir le faux e-mail et cliquer Confirmer */
  const [etherealPreviewUrl, setEtherealPreviewUrl] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const submitLock = useRef(false);

  const isArtisan = role === "artisan";
  const isExpert = role === "expert";
  const isLivreur = role === "livreur";

  const parsedVilles = useMemo(() => {
    return villesTunisie
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [villesTunisie]);

  const parsedPays = useMemo(() => {
    return pays
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [pays]);

  const parsedVillesLivreur = useMemo(() => {
    return villesLivreur
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [villesLivreur]);

  const parsedRegionsLivreur = useMemo(() => {
    return regionLivreur
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [regionLivreur]);

  useEffect(() => {
    if (!cinFile) {
      setCinPreviewUrl(null);
      return;
    }
    const n = cinFile.name.toLowerCase();
    if (n.endsWith(".pdf")) {
      setCinPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(cinFile);
    setCinPreviewUrl(u);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [cinFile]);

  const clearField = useCallback((key: FieldKey) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const pickCvFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setCvFile(file);
      clearField("cvFile");
    },
    [clearField],
  );

  const onCvInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      pickCvFile(e.target.files?.[0]);
    },
    [pickCvFile],
  );

  const onCvDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setCvDragging(false);
      const f = e.dataTransfer.files?.[0];
      pickCvFile(f);
    },
    [pickCvFile],
  );

  const pickCinFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setCinFile(file);
      clearField("cinFile");
    },
    [clearField],
  );

  const onCinInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      pickCinFile(e.target.files?.[0]);
    },
    [pickCinFile],
  );

  const onCinDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setCinDragging(false);
      pickCinFile(e.dataTransfer.files?.[0]);
    },
    [pickCinFile],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitLock.current || loading) return;
    submitLock.current = true;
    setError("");
    setFieldErrors({});

    const errs = validateInscriptionForm(
      {
        nom,
        email,
        telephone,
        role,
        password,
        confirmPassword,
        isArtisan,
        isExpert,
        isLivreur,
        specialite,
        experienceAnnees,
        domaineExpertise,
        expertExperienceAnnees,
        niveauEtudes,
        linkedinUrl,
        cvFile,
        moyenTransport,
        zoneLivTunisie,
        zoneLivVillesTunisie,
        zoneLivRegion,
        villesLivreur,
        regionLivreur,
        dispoTempsPlein,
        dispoTempsPartiel,
        dispoWeekend,
        cinFile,
        zoneTunisie,
        zoneMonde,
        zoneVillesTunisie,
        zonePays,
        villesTunisie,
        pays,
      },
      parsedVilles,
      parsedPays,
      parsedVillesLivreur,
      parsedRegionsLivreur,
    );

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const first = Object.values(errs)[0];
      if (first) {
        setError("Veuillez corriger les champs indiqués ci-dessous.");
      }
      submitLock.current = false;
      return;
    }

    let zones_travail: WorkZone[] | undefined = undefined;
    if (isArtisan) {
      zones_travail = buildZonesTravail(
        zoneTunisie,
        zoneMonde,
        zoneVillesTunisie,
        zonePays,
        villesTunisie,
        pays,
      );
    }

    let zones_livraison: WorkZone[] | undefined = undefined;
    let livreur_disponibilite: string[] | undefined = undefined;
    if (isLivreur) {
      zones_livraison = buildZonesLivraison(
        zoneLivTunisie,
        zoneLivVillesTunisie,
        zoneLivRegion,
        villesLivreur,
        regionLivreur,
      );
      livreur_disponibilite = buildLivreurDisponibilite(
        dispoTempsPlein,
        dispoTempsPartiel,
        dispoWeekend,
      );
    }

    setLoading(true);

    try {
      let res: Response;
      if (isLivreur) {
        const fd = new FormData();
        fd.append("nom", nom.trim());
        fd.append("email", email.trim().toLowerCase());
        fd.append("mot_de_passe", password);
        const tel = telephone.trim();
        if (tel) fd.append("telephone", tel);
        fd.append("moyen_transport", moyenTransport);
        fd.append("zones_livraison", JSON.stringify(zones_livraison ?? []));
        fd.append(
          "livreur_disponibilite",
          JSON.stringify(livreur_disponibilite ?? []),
        );
        if (cinFile) fd.append("cin_permis", cinFile, cinFile.name);
        res = await fetch(`${API_URL}/users/livreur`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
      } else if (isExpert) {
        const fd = new FormData();
        fd.append("nom", nom.trim());
        fd.append("email", email.trim().toLowerCase());
        fd.append("mot_de_passe", password);
        const tel = telephone.trim();
        if (tel) fd.append("telephone", tel);
        fd.append("domaine_expertise", domaineExpertise.trim());
        fd.append("experience_annees", String(parseInt(expertExperienceAnnees, 10)));
        fd.append("niveau_etudes", niveauEtudes);
        const li = linkedinUrl.trim();
        if (li) fd.append("linkedin_url", li);
        if (cvFile) fd.append("cv", cvFile, cvFile.name);
        res = await fetch(`${API_URL}/users/expert`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
      } else {
        res = await fetch(`${API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: nom.trim(),
            email: email.trim().toLowerCase(),
            telephone: telephone.trim() || undefined,
            role: role,
            mot_de_passe: password,
            ...(isArtisan
              ? {
                  specialite: specialite.trim(),
                  experience_annees: Number(experienceAnnees),
                  zones_travail,
                }
              : {}),
          }),
          credentials: "include",
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(formatApiError(data, "Erreur lors de l'inscription"));
        setLoading(false);
        return;
      }

      const msg =
        typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : "Inscription réussie. Vérifiez votre email.";
      setRegisteredEmail(email.trim().toLowerCase());
      setSuccessMessage(msg);
      setVerificationEmailSent(
        typeof data?.emailSent === "boolean" ? data.emailSent : undefined,
      );
      setDevBypass(data?.devBypass === true);
      setEtherealPreviewUrl(
        typeof data?.etherealPreviewUrl === "string" &&
          data.etherealPreviewUrl.startsWith("http")
          ? data.etherealPreviewUrl
          : null,
      );
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur de connexion au serveur",
      );
    } finally {
      setLoading(false);
      submitLock.current = false;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg text-center">
          <div className="backdrop-blur-2xl bg-white/[0.08] rounded-3xl p-8 sm:p-10 border border-white/15 shadow-2xl">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "rgba(245, 166, 35, 0.18)" }}
            >
              <Mail className="w-9 h-9" style={{ color: "#F5A623" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              {devBypass
                ? "Compte créé (mode développement)"
                : verificationEmailSent === true
                  ? "Presque terminé"
                  : "Inscription"}
            </h1>
            {verificationEmailSent === true && !devBypass && etherealPreviewUrl && (
              <div
                className="rounded-2xl border border-sky-500/35 bg-sky-950/30 px-4 py-3 text-left text-sm mb-6 space-y-3"
                role="status"
              >
                <p className="text-gray-200 leading-relaxed">
                  <span className="text-[#F5A623] font-semibold">E-mail simulé</span>{" "}
                  : le backend utilise Ethereal (test). Rien n&apos;est envoyé dans
                  votre vraie boîte. Pour une livraison réelle : dans{" "}
                  <code className="text-xs text-amber-200/90">backend/.env</code>,{" "}
                  définissez{" "}
                  <code className="text-xs text-amber-200/90">RESEND_API_KEY</code>{" "}
                  (clé sur resend.com) et{" "}
                  <code className="text-xs text-amber-200/90">MAIL_FROM</code>{" "}
                  (ex. expéditeur{" "}
                  <code className="text-xs text-amber-200/90">onboarding@resend.dev</code>
                  ), puis redémarrez le serveur. (Pas besoin de couper{" "}
                  <code className="text-xs text-amber-200/90">
                    USE_ETHEREAL_IN_DEV
                  </code>
                  : Resend est prioritaire.) Alternative : SMTP Gmail avec{" "}
                  <code className="text-xs text-amber-200/90">MAIL_*</code>. Ici,
                  ouvrez le lien pour le test et cliquez sur{" "}
                  <strong>Confirmer mon email</strong>.
                </p>
                <a
                  href={etherealPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-sky-500/20 border border-sky-400/40 px-4 py-2.5 text-sky-100 font-medium text-xs break-all hover:bg-sky-500/30 transition-colors"
                >
                  Ouvrir la prévisualisation Ethereal (e-mail simulé)
                </a>
              </div>
            )}
            {verificationEmailSent === true && !devBypass && !etherealPreviewUrl && (
              <>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-2">
                  <span className="text-[#F5A623] font-semibold">📧</span> Un
                  e-mail de vérification a été envoyé à{" "}
                  <span className="text-white font-medium break-all">
                    {registeredEmail}
                  </span>
                  . Sur Gmail, regardez l&apos;onglet{" "}
                  <strong className="text-gray-200">Principale</strong>, puis{" "}
                  <strong className="text-gray-200">Promotions</strong> et{" "}
                  <strong className="text-gray-200">Indésirables</strong> si besoin.
                  Ouvrez le message puis cliquez sur le lien de confirmation.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Si le mail est dans Promotions, vous pouvez le glisser vers
                  Principale pour les prochains envois. Sans confirmation, la
                  connexion reste bloquée.
                </p>
              </>
            )}
            {devBypass && (
              <div
                className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-left text-amber-100/95 text-sm mb-6"
                role="status"
              >
                <p className="font-medium text-[#F5A623] mb-1">
                  SMTP désactivé volontairement (dev)
                </p>
                <p className="leading-relaxed text-gray-200">
                  Le backend a{" "}
                  <code className="text-xs text-amber-200/90">
                    ALLOW_REGISTRATION_WITHOUT_SMTP=true
                  </code>
                  . Aucun e-mail n&apos;est envoyé et la connexion est autorisée
                  sans vérification. En production, retirez cette variable et
                  configurez{" "}
                  <code className="text-xs text-amber-200/90">MAIL_*</code>.
                </p>
              </div>
            )}
            {verificationEmailSent === undefined && !devBypass && (
              <p className="text-gray-400 text-sm mb-6">{successMessage}</p>
            )}
            {devBypass && (
              <p className="text-gray-500 text-xs text-left mb-6 leading-relaxed">
                {successMessage}
              </p>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-gray-900 font-bold shadow-xl border border-[#F5A623]/40 transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(90deg, #F5A623, #f0c04a)",
              }}
            >
              Aller à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8 sm:mb-10 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg group-hover:shadow-amber-500/50 transition-shadow shrink-0">
            <Building2 className="w-7 h-7 text-gray-900" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-white to-amber-100 bg-clip-text text-transparent">
              BMP.tn
            </span>
            <div className="text-xs text-blue-300/70 font-light tracking-widest mt-0.5">
              INSCRIPTION
            </div>
          </div>
        </Link>

        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
            Créer un compte
          </h1>
          <p className="text-gray-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Rejoignez la plateforme BMP.tn
          </p>

          <form noValidate onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Nom complet <span className="text-red-400/90">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  autoComplete="family-name"
                  maxLength={100}
                  value={nom}
                  onChange={(e) => {
                    setNom(e.target.value);
                    clearField("nom");
                  }}
                  placeholder="Ex. Ben Ali"
                  disabled={loading}
                  aria-invalid={!!fieldErrors.nom}
                  aria-describedby={fieldErrors.nom ? "err-nom" : undefined}
                  className={fieldInputClass(!!fieldErrors.nom, loading, {
                    hasLeftIcon: true,
                  })}
                />
              </div>
              <FieldError id="err-nom" message={fieldErrors.nom} />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                E-mail <span className="text-red-400/90">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField("email");
                  }}
                  placeholder="nom@exemple.tn"
                  disabled={loading}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "err-email" : undefined}
                  className={fieldInputClass(!!fieldErrors.email, loading, {
                    hasLeftIcon: true,
                  })}
                />
              </div>
              <FieldError id="err-email" message={fieldErrors.email} />
            </div>

            <div>
              <label
                htmlFor="telephone"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Téléphone <span className="text-gray-500 text-xs font-normal">(optionnel)</span>
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={24}
                  value={telephone}
                  onChange={(e) => {
                    setTelephone(e.target.value);
                    clearField("telephone");
                  }}
                  placeholder="+216 XX XXX XXX"
                  disabled={loading}
                  aria-invalid={!!fieldErrors.telephone}
                  aria-describedby={
                    fieldErrors.telephone ? "err-telephone" : undefined
                  }
                  className={fieldInputClass(!!fieldErrors.telephone, loading, {
                    hasLeftIcon: true,
                  })}
                />
              </div>
              <FieldError id="err-telephone" message={fieldErrors.telephone} />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Rôle <span className="text-red-400/90">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => {
                  const v = e.target.value as (typeof ROLES)[number]["value"];
                  setRole(v);
                  setFieldErrors({});
                  if (v !== "expert") {
                    setCvFile(null);
                    setDomaineExpertise("");
                    setExpertExperienceAnnees("");
                    setNiveauEtudes("");
                    setLinkedinUrl("");
                  }
                  if (v !== "artisan") {
                    setSpecialite("");
                    setExperienceAnnees("");
                    setZoneTunisie(false);
                    setZoneMonde(false);
                    setZoneVillesTunisie(false);
                    setZonePays(false);
                    setVillesTunisie("");
                    setPays("");
                  }
                  if (v !== "livreur") {
                    setMoyenTransport("");
                    setZoneLivTunisie(false);
                    setZoneLivVillesTunisie(false);
                    setZoneLivRegion(false);
                    setVillesLivreur("");
                    setRegionLivreur("");
                    setDispoTempsPlein(false);
                    setDispoTempsPartiel(false);
                    setDispoWeekend(false);
                    setCinFile(null);
                  }
                }}
                disabled={loading}
                className="w-full min-h-[48px] sm:min-h-[44px] text-base sm:text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right-4 bg-[length:20px] pr-12"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-gray-900 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {isArtisan && (
              <div className="space-y-4 sm:space-y-5 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
                <p className="text-sm font-semibold text-amber-200/90">
                  Profil artisan
                </p>

                <div>
                  <label
                    htmlFor="specialite"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Spécialité <span className="text-red-400/90">*</span>
                  </label>
                  <input
                    id="specialite"
                    name="specialite"
                    type="text"
                    maxLength={160}
                    value={specialite}
                    onChange={(e) => {
                      setSpecialite(e.target.value);
                      clearField("specialite");
                    }}
                    placeholder="Ex. Maçonnerie, Plomberie, Électricité…"
                    disabled={loading}
                    aria-invalid={!!fieldErrors.specialite}
                    aria-describedby={
                      fieldErrors.specialite ? "err-specialite" : undefined
                    }
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-all disabled:opacity-60 ${
                      fieldErrors.specialite
                        ? "border-red-400/55 focus:border-red-400 focus:ring-2 focus:ring-red-500/25"
                        : "border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                  />
                  <FieldError id="err-specialite" message={fieldErrors.specialite} />
                </div>

                <div>
                  <label
                    htmlFor="experience"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Expérience (années) <span className="text-red-400/90">*</span>
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={experienceAnnees}
                    onChange={(e) => {
                      setExperienceAnnees(e.target.value.replace(/\D/g, ""));
                      clearField("experienceAnnees");
                    }}
                    placeholder="0 à 80"
                    disabled={loading}
                    aria-invalid={!!fieldErrors.experienceAnnees}
                    aria-describedby={
                      fieldErrors.experienceAnnees ? "err-experience" : undefined
                    }
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-all disabled:opacity-60 ${
                      fieldErrors.experienceAnnees
                        ? "border-red-400/55 focus:border-red-400 focus:ring-2 focus:ring-red-500/25"
                        : "border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                  />
                  <FieldError
                    id="err-experience"
                    message={fieldErrors.experienceAnnees}
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-gray-300 mb-2 block">
                    Zones de travail <span className="text-red-400/90">*</span>
                  </legend>
                  {fieldErrors.zones ? (
                    <p id="err-zones" className="text-xs text-red-300/95 mb-2" role="alert">
                      {fieldErrors.zones}
                    </p>
                  ) : null}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneTunisie}
                        onChange={(e) => {
                          setZoneTunisie(e.target.checked);
                          clearField("zones");
                        }}
                        disabled={loading}
                        className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                      />
                      <span>Toute la Tunisie</span>
                    </label>

                    <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneVillesTunisie}
                        onChange={(e) => {
                          setZoneVillesTunisie(e.target.checked);
                          clearField("zones");
                          clearField("villesTunisie");
                        }}
                        disabled={loading}
                        className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                      />
                      <span>Villes spécifiques (Tunisie)</span>
                    </label>

                    {zoneVillesTunisie && (
                      <div className="pl-8 sm:pl-9">
                        <input
                          type="text"
                          id="villes-tunisie"
                          aria-label="Liste des villes en Tunisie"
                          value={villesTunisie}
                          onChange={(e) => {
                            setVillesTunisie(e.target.value);
                            clearField("villesTunisie");
                          }}
                          placeholder="Ex. Tunis, Sfax, Sousse"
                          disabled={loading}
                          aria-invalid={!!fieldErrors.villesTunisie}
                          aria-describedby={
                            fieldErrors.villesTunisie ? "err-villes" : undefined
                          }
                          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 outline-none ${
                            fieldErrors.villesTunisie
                              ? "border-red-400/55"
                              : "border-white/20"
                          }`}
                        />
                        <FieldError
                          id="err-villes"
                          message={fieldErrors.villesTunisie}
                        />
                      </div>
                    )}

                    <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zonePays}
                        onChange={(e) => {
                          setZonePays(e.target.checked);
                          clearField("zones");
                          clearField("pays");
                        }}
                        disabled={loading}
                        className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                      />
                      <span>Pays spécifiques (étranger)</span>
                    </label>

                    {zonePays && (
                      <div className="pl-8 sm:pl-9">
                        <input
                          type="text"
                          id="pays-list"
                          aria-label="Liste des pays"
                          value={pays}
                          onChange={(e) => {
                            setPays(e.target.value);
                            clearField("pays");
                          }}
                          placeholder="Ex. France, Italie, Canada"
                          disabled={loading}
                          aria-invalid={!!fieldErrors.pays}
                          aria-describedby={
                            fieldErrors.pays ? "err-pays" : undefined
                          }
                          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 outline-none ${
                            fieldErrors.pays ? "border-red-400/55" : "border-white/20"
                          }`}
                        />
                        <FieldError id="err-pays" message={fieldErrors.pays} />
                      </div>
                    )}

                    <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneMonde}
                        onChange={(e) => {
                          setZoneMonde(e.target.checked);
                          clearField("zones");
                        }}
                        disabled={loading}
                        className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                      />
                      <span>Partout dans le monde</span>
                    </label>
                  </div>

                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    Séparez les villes ou pays par des virgules.
                  </p>
                </fieldset>
              </div>
            )}

            {isExpert && (
              <div className="space-y-4 sm:space-y-5 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
                <p className="text-sm font-semibold text-amber-200/90">
                  Profil expert
                </p>

                <div>
                  <label
                    htmlFor="domaine-expertise"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Domaine d&apos;expertise{" "}
                    <span className="text-red-400/90">*</span>
                  </label>
                  <input
                    id="domaine-expertise"
                    name="domaine_expertise"
                    type="text"
                    maxLength={160}
                    value={domaineExpertise}
                    onChange={(e) => {
                      setDomaineExpertise(e.target.value);
                      clearField("domaineExpertise");
                    }}
                    placeholder="Ex. Finance, Droit, Marketing…"
                    disabled={loading}
                    aria-invalid={!!fieldErrors.domaineExpertise}
                    aria-describedby={
                      fieldErrors.domaineExpertise ? "err-domaine" : undefined
                    }
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-all disabled:opacity-60 ${
                      fieldErrors.domaineExpertise
                        ? "border-red-400/55 focus:border-red-400 focus:ring-2 focus:ring-red-500/25"
                        : "border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                  />
                  <FieldError
                    id="err-domaine"
                    message={fieldErrors.domaineExpertise}
                  />
                </div>

                <div>
                  <label
                    htmlFor="expert-experience"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Années d&apos;expérience{" "}
                    <span className="text-red-400/90">*</span>
                  </label>
                  <input
                    id="expert-experience"
                    name="expert_experience_annees"
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    value={expertExperienceAnnees}
                    onChange={(e) => {
                      setExpertExperienceAnnees(e.target.value);
                      clearField("expertExperienceAnnees");
                    }}
                    placeholder="0 à 50"
                    disabled={loading}
                    aria-invalid={!!fieldErrors.expertExperienceAnnees}
                    aria-describedby={
                      fieldErrors.expertExperienceAnnees
                        ? "err-expert-exp"
                        : undefined
                    }
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-all disabled:opacity-60 [color-scheme:dark] ${
                      fieldErrors.expertExperienceAnnees
                        ? "border-red-400/55 focus:border-red-400 focus:ring-2 focus:ring-red-500/25"
                        : "border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                  />
                  <FieldError
                    id="err-expert-exp"
                    message={fieldErrors.expertExperienceAnnees}
                  />
                </div>

                <div>
                  <label
                    htmlFor="niveau-etudes"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Niveau d&apos;études{" "}
                    <span className="text-red-400/90">*</span>
                  </label>
                  <select
                    id="niveau-etudes"
                    name="niveau_etudes"
                    value={niveauEtudes}
                    onChange={(e) => {
                      setNiveauEtudes(e.target.value as NiveauEtudes | "");
                      clearField("niveauEtudes");
                    }}
                    disabled={loading}
                    className={`w-full min-h-[48px] sm:min-h-[44px] text-base sm:text-sm px-4 py-3 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-2 transition-all disabled:opacity-60 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right-4 bg-[length:20px] pr-12 ${
                      fieldErrors.niveauEtudes
                        ? "border-red-400/55 focus:ring-red-500/25"
                        : "border-white/20 focus:border-amber-500/50 focus:ring-amber-500/20"
                    }`}
                  >
                    <option value="" className="bg-gray-900">
                      Sélectionner…
                    </option>
                    <option value="bac_plus_3" className="bg-gray-900">
                      Bac+3
                    </option>
                    <option value="bac_plus_5" className="bg-gray-900">
                      Bac+5
                    </option>
                    <option value="doctorat" className="bg-gray-900">
                      Doctorat
                    </option>
                    <option value="autre" className="bg-gray-900">
                      Autre
                    </option>
                  </select>
                  <FieldError
                    id="err-niveau"
                    message={fieldErrors.niveauEtudes}
                  />
                </div>

                <div>
                  <p className="block text-sm font-medium text-gray-300 mb-2">
                    CV / Portfolio <span className="text-red-400/90">*</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    PDF ou DOCX — 5 Mo maximum
                  </p>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    aria-label="Fichier CV"
                    onChange={onCvInputChange}
                    disabled={loading}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        cvInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setCvDragging(true);
                    }}
                    onDragLeave={() => setCvDragging(false)}
                    onDrop={onCvDrop}
                    onClick={() => !loading && cvInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                      cvDragging
                        ? "border-amber-400/80 bg-amber-500/10"
                        : fieldErrors.cvFile
                          ? "border-red-400/50 bg-red-500/5"
                          : "border-white/25 bg-white/[0.03] hover:border-amber-500/35"
                    } ${loading ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <Upload
                      className="w-10 h-10 mx-auto mb-3 text-amber-400/80"
                      aria-hidden
                    />
                    <p className="text-sm text-gray-200">
                      Glissez-déposez votre fichier ici ou{" "}
                      <span className="text-amber-400 font-medium">
                        parcourir
                      </span>
                    </p>
                    {cvFile ? (
                      <p className="mt-3 text-sm text-amber-200/95 flex items-center justify-center gap-2 break-all">
                        <FileText className="w-4 h-4 shrink-0" aria-hidden />
                        <span>{cvFile.name}</span>
                      </p>
                    ) : null}
                  </div>
                  <FieldError id="err-cv" message={fieldErrors.cvFile} />
                </div>

                <div>
                  <label
                    htmlFor="linkedin"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    LinkedIn{" "}
                    <span className="text-gray-500 text-xs font-normal">
                      (optionnel)
                    </span>
                  </label>
                  <input
                    id="linkedin"
                    name="linkedin_url"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    maxLength={500}
                    value={linkedinUrl}
                    onChange={(e) => {
                      setLinkedinUrl(e.target.value);
                      clearField("linkedinUrl");
                    }}
                    placeholder="https://www.linkedin.com/in/…"
                    disabled={loading}
                    aria-invalid={!!fieldErrors.linkedinUrl}
                    aria-describedby={
                      fieldErrors.linkedinUrl ? "err-linkedin" : undefined
                    }
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border text-base sm:text-sm text-white placeholder-gray-500 outline-none transition-all disabled:opacity-60 ${
                      fieldErrors.linkedinUrl
                        ? "border-red-400/55 focus:border-red-400 focus:ring-2 focus:ring-red-500/25"
                        : "border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                  />
                  <FieldError
                    id="err-linkedin"
                    message={fieldErrors.linkedinUrl}
                  />
                </div>
              </div>
            )}

            {isLivreur && (
              <div className="space-y-4 sm:space-y-5 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
                <p className="text-sm font-semibold text-amber-200/90">
                  Profil livreur
                </p>

                <div>
                  <label
                    htmlFor="moyen-transport"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Moyen de transport <span className="text-red-400/90">*</span>
                  </label>
                  <select
                    id="moyen-transport"
                    name="moyen_transport"
                    value={moyenTransport}
                    onChange={(e) => {
                      setMoyenTransport(e.target.value as MoyenTransportLivreur | "");
                      clearField("moyenTransport");
                    }}
                    disabled={loading}
                    className={`w-full min-h-[48px] sm:min-h-[44px] text-base sm:text-sm px-4 py-3 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-2 transition-all disabled:opacity-60 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right-4 bg-[length:20px] pr-12 ${
                      fieldErrors.moyenTransport
                        ? "border-red-400/55 focus:ring-red-500/25"
                        : "border-white/20 focus:border-amber-500/50 focus:ring-amber-500/20"
                    }`}
                  >
                    <option value="" className="bg-gray-900">
                      Sélectionner…
                    </option>
                    <option value="velo" className="bg-gray-900">
                      Vélo
                    </option>
                    <option value="moto" className="bg-gray-900">
                      Moto
                    </option>
                    <option value="voiture" className="bg-gray-900">
                      Voiture
                    </option>
                    <option value="camionnette" className="bg-gray-900">
                      Camionnette
                    </option>
                  </select>
                  <FieldError
                    id="err-moyen-transport"
                    message={fieldErrors.moyenTransport}
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-gray-300 mb-2 block">
                    Zones de livraison <span className="text-red-400/90">*</span>
                  </legend>
                  {fieldErrors.zonesLivraison ? (
                    <p
                      id="err-zones-liv"
                      className="text-xs text-red-300/95 mb-2"
                      role="alert"
                    >
                      {fieldErrors.zonesLivraison}
                    </p>
                  ) : null}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneLivTunisie}
                        onChange={(e) => {
                          setZoneLivTunisie(e.target.checked);
                          clearField("zonesLivraison");
                        }}
                        disabled={loading}
                        className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                      />
                      <span>Toute la Tunisie</span>
                    </label>

                    <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneLivVillesTunisie}
                        onChange={(e) => {
                          setZoneLivVillesTunisie(e.target.checked);
                          clearField("zonesLivraison");
                          clearField("villesLivreur");
                        }}
                        disabled={loading}
                        className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                      />
                      <span>Villes spécifiques (Tunisie)</span>
                    </label>

                    {zoneLivVillesTunisie && (
                      <div className="pl-8 sm:pl-9">
                        <input
                          type="text"
                          id="villes-livreur"
                          aria-label="Villes de livraison en Tunisie"
                          value={villesLivreur}
                          onChange={(e) => {
                            setVillesLivreur(e.target.value);
                            clearField("villesLivreur");
                          }}
                          placeholder="Ex. Tunis, Sfax, Sousse"
                          disabled={loading}
                          aria-invalid={!!fieldErrors.villesLivreur}
                          aria-describedby={
                            fieldErrors.villesLivreur ? "err-villes-liv" : undefined
                          }
                          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 outline-none ${
                            fieldErrors.villesLivreur
                              ? "border-red-400/55"
                              : "border-white/20"
                          }`}
                        />
                        <FieldError
                          id="err-villes-liv"
                          message={fieldErrors.villesLivreur}
                        />
                      </div>
                    )}

                    <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneLivRegion}
                        onChange={(e) => {
                          setZoneLivRegion(e.target.checked);
                          clearField("zonesLivraison");
                          clearField("regionLivreur");
                        }}
                        disabled={loading}
                        className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                      />
                      <span>Région spécifique</span>
                    </label>

                    {zoneLivRegion && (
                      <div className="pl-8 sm:pl-9">
                        <input
                          type="text"
                          id="region-livreur"
                          aria-label="Régions de livraison"
                          value={regionLivreur}
                          onChange={(e) => {
                            setRegionLivreur(e.target.value);
                            clearField("regionLivreur");
                          }}
                          placeholder="Ex. Grand Tunis, Sahel…"
                          disabled={loading}
                          aria-invalid={!!fieldErrors.regionLivreur}
                          aria-describedby={
                            fieldErrors.regionLivreur ? "err-region-liv" : undefined
                          }
                          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder-gray-500 outline-none ${
                            fieldErrors.regionLivreur
                              ? "border-red-400/55"
                              : "border-white/20"
                          }`}
                        />
                        <FieldError
                          id="err-region-liv"
                          message={fieldErrors.regionLivreur}
                        />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    Plusieurs valeurs : séparez par des virgules.
                  </p>
                </fieldset>

                <div>
                  <p className="block text-sm font-medium text-gray-300 mb-2">
                    CIN / Permis de conduire{" "}
                    <span className="text-red-400/90">*</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    JPG, PNG ou PDF — 3 Mo maximum
                  </p>
                  <input
                    ref={cinInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="sr-only"
                    aria-label="CIN ou permis"
                    onChange={onCinInputChange}
                    disabled={loading}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        cinInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setCinDragging(true);
                    }}
                    onDragLeave={() => setCinDragging(false)}
                    onDrop={onCinDrop}
                    onClick={() => !loading && cinInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                      cinDragging
                        ? "border-amber-400/80 bg-amber-500/10"
                        : fieldErrors.cinFile
                          ? "border-red-400/50 bg-red-500/5"
                          : "border-white/25 bg-white/[0.03] hover:border-amber-500/35"
                    } ${loading ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <Upload
                      className="w-10 h-10 mx-auto mb-3 text-amber-400/80"
                      aria-hidden
                    />
                    <p className="text-sm text-gray-200">
                      Glissez-déposez ou{" "}
                      <span className="text-amber-400 font-medium">parcourir</span>
                    </p>
                    {cinFile ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-amber-200/95 break-all flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4 shrink-0" aria-hidden />
                          {cinFile.name}
                        </p>
                        {cinPreviewUrl ? (
                          <img
                            src={cinPreviewUrl}
                            alt="Aperçu du document"
                            className="max-h-40 mx-auto rounded-lg border border-white/15 object-contain"
                          />
                        ) : cinFile.name.toLowerCase().endsWith(".pdf") ? (
                          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                            <FileText className="w-8 h-8" />
                            Aperçu PDF : ouvrez le fichier après inscription.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <FieldError id="err-cin" message={fieldErrors.cinFile} />
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-gray-300 mb-2 block">
                    Disponibilité <span className="text-red-400/90">*</span>
                  </legend>
                  {fieldErrors.dispoLivreur ? (
                    <p
                      id="err-dispo-liv"
                      className="text-xs text-red-300/95 mb-2"
                      role="alert"
                    >
                      {fieldErrors.dispoLivreur}
                    </p>
                  ) : null}
                  <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispoTempsPlein}
                      onChange={(e) => {
                        setDispoTempsPlein(e.target.checked);
                        clearField("dispoLivreur");
                      }}
                      disabled={loading}
                      className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                    />
                    <span>Temps plein</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispoTempsPartiel}
                      onChange={(e) => {
                        setDispoTempsPartiel(e.target.checked);
                        clearField("dispoLivreur");
                      }}
                      disabled={loading}
                      className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                    />
                    <span>Temps partiel</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispoWeekend}
                      onChange={(e) => {
                        setDispoWeekend(e.target.checked);
                        clearField("dispoLivreur");
                      }}
                      disabled={loading}
                      className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
                    />
                    <span>Week-end uniquement</span>
                  </label>
                </fieldset>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mot de passe <span className="text-red-400/90">*</span>
                <span className="text-gray-500 text-xs font-normal block sm:inline sm:ml-1">
                  (6 caractères min.)
                </span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearField("password");
                    clearField("confirmPassword");
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    fieldErrors.password ? "err-password" : undefined
                  }
                  className={fieldInputClass(!!fieldErrors.password, loading, {
                    hasLeftIcon: true,
                  })}
                />
              </div>
              <FieldError id="err-password" message={fieldErrors.password} />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirmer le mot de passe <span className="text-red-400/90">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearField("confirmPassword");
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={
                    fieldErrors.confirmPassword ? "err-confirm" : undefined
                  }
                  className={fieldInputClass(!!fieldErrors.confirmPassword, loading, {
                    hasLeftIcon: true,
                  })}
                />
              </div>
              <FieldError
                id="err-confirm"
                message={fieldErrors.confirmPassword}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold text-base shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Inscription…
                </>
              ) : (
                <>S&apos;inscrire</>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
