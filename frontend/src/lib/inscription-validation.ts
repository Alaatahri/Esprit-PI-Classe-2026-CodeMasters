/**
 * Formulaire inscription — règles métier artisan + composition.
 * Validations de base : `@/lib/validators`
 */

import {
  validateConfirmPassword,
  validateEmail,
  validateNom,
  validatePassword,
  validateTelephone,
} from "./validators";

export type WorkZoneScope =
  | "tn_all"
  | "tn_city"
  | "tn_region"
  | "country"
  | "world";
export type WorkZone = { scope: WorkZoneScope; value?: string };

export type NiveauEtudes = "bac_plus_3" | "bac_plus_5" | "doctorat" | "autre";

export type MoyenTransportLivreur = "velo" | "moto" | "voiture" | "camionnette";

export type InscriptionFormState = {
  nom: string;
  email: string;
  telephone: string;
  role: string;
  password: string;
  confirmPassword: string;
  isArtisan: boolean;
  isExpert: boolean;
  isLivreur: boolean;
  specialite: string;
  experienceAnnees: string;
  domaineExpertise: string;
  expertExperienceAnnees: string;
  niveauEtudes: NiveauEtudes | "";
  linkedinUrl: string;
  cvFile: File | null;
  moyenTransport: MoyenTransportLivreur | "";
  zoneLivTunisie: boolean;
  zoneLivVillesTunisie: boolean;
  zoneLivRegion: boolean;
  villesLivreur: string;
  regionLivreur: string;
  dispoTempsPlein: boolean;
  dispoTempsPartiel: boolean;
  dispoWeekend: boolean;
  cinFile: File | null;
  zoneTunisie: boolean;
  zoneMonde: boolean;
  zoneVillesTunisie: boolean;
  zonePays: boolean;
  villesTunisie: string;
  pays: string;
};

export type FieldKey =
  | "nom"
  | "email"
  | "telephone"
  | "specialite"
  | "experienceAnnees"
  | "domaineExpertise"
  | "expertExperienceAnnees"
  | "niveauEtudes"
  | "cvFile"
  | "linkedinUrl"
  | "moyenTransport"
  | "villesLivreur"
  | "regionLivreur"
  | "zonesLivraison"
  | "dispoLivreur"
  | "cinFile"
  | "villesTunisie"
  | "pays"
  | "zones"
  | "password"
  | "confirmPassword";

const SPEC_MIN = 2;
const SPEC_MAX = 160;
const EXP_MAX = 80;
const EXPERT_EXP_MAX = 50;
const CV_MAX_BYTES = 5 * 1024 * 1024;
const CIN_MAX_BYTES = 3 * 1024 * 1024;

export { validateNom, validateEmail, validateTelephone, validatePassword, validateConfirmPassword };

export function validateSpecialite(value: string): string | null {
  const t = value.trim();
  if (t.length < SPEC_MIN) {
    return `Décrivez votre spécialité (${SPEC_MIN} caractères minimum).`;
  }
  if (t.length > SPEC_MAX) {
    return `Maximum ${SPEC_MAX} caractères.`;
  }
  return null;
}

export function validateExperienceAnnees(raw: string): string | null {
  const t = raw.trim();
  if (!t) {
    return "Indiquez votre expérience en années.";
  }
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return "Entrez un nombre entier d’années.";
  }
  if (n < 0) {
    return "L’expérience ne peut pas être négative.";
  }
  if (n > EXP_MAX) {
    return `Valeur plafonnée à ${EXP_MAX} ans.`;
  }
  return null;
}

export function validateDomaineExpertise(value: string): string | null {
  const t = value.trim();
  if (t.length < SPEC_MIN) {
    return `Indiquez votre domaine (${SPEC_MIN} caractères minimum).`;
  }
  if (t.length > SPEC_MAX) {
    return `Maximum ${SPEC_MAX} caractères.`;
  }
  return null;
}

export function validateExpertExperienceAnnees(raw: string): string | null {
  const t = raw.trim();
  if (!t) {
    return "Indiquez vos années d’expérience.";
  }
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return "Entrez un nombre entier d’années.";
  }
  if (n < 0 || n > EXPERT_EXP_MAX) {
    return `Valeur entre 0 et ${EXPERT_EXP_MAX}.`;
  }
  return null;
}

export function validateNiveauEtudes(v: string): string | null {
  const ok = ["bac_plus_3", "bac_plus_5", "doctorat", "autre"].includes(v);
  if (!ok) return "Sélectionnez un niveau d’études.";
  return null;
}

function isPdfOrDocx(file: File): boolean {
  const n = file.name.toLowerCase();
  const t = (file.type || "").toLowerCase();
  if (n.endsWith(".pdf")) return t === "" || t === "application/pdf" || t === "application/x-pdf";
  if (n.endsWith(".docx"))
    return (
      t === "" ||
      t ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  return false;
}

export function validateCvFile(file: File | null): string | null {
  if (!file) return "Ajoutez votre CV (PDF ou DOCX, max 5 Mo).";
  if (file.size > CV_MAX_BYTES) {
    return "Le fichier dépasse 5 Mo.";
  }
  if (!isPdfOrDocx(file)) {
    return "Formats acceptés : PDF ou DOCX uniquement.";
  }
  return null;
}

export function validateLinkedinOptional(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (!/^https?:$/i.test(u.protocol)) {
      return "Utilisez une URL commençant par https://";
    }
    const hn = u.hostname.toLowerCase();
    if (hn !== "linkedin.com" && !hn.endsWith(".linkedin.com")) {
      return "Indiquez une URL de profil LinkedIn.";
    }
  } catch {
    return "URL LinkedIn invalide.";
  }
  return null;
}

export function validateVillesTunisie(
  enabled: boolean,
  _villesTunisie: string,
  parsedCount: number,
): string | null {
  if (!enabled) return null;
  if (parsedCount === 0) {
    return "Ajoutez au moins une ville, ou décochez l’option.";
  }
  return null;
}

export function validatePays(enabled: boolean, parsedCount: number): string | null {
  if (!enabled) return null;
  if (parsedCount === 0) {
    return "Ajoutez au moins un pays, ou décochez l’option.";
  }
  return null;
}

export function validateZonesArtisan(
  zoneTunisie: boolean,
  zoneMonde: boolean,
  zoneVillesTunisie: boolean,
  zonePays: boolean,
): string | null {
  if (zoneTunisie || zoneMonde || zoneVillesTunisie || zonePays) {
    return null;
  }
  return "Sélectionnez au moins une zone de travail.";
}

export function validateMoyenTransport(v: string): string | null {
  const ok = ["velo", "moto", "voiture", "camionnette"].includes(v);
  if (!ok) return "Sélectionnez un moyen de transport.";
  return null;
}

export function validateZonesLivraison(
  zTn: boolean,
  zVilles: boolean,
  zRegion: boolean,
): string | null {
  if (zTn || zVilles || zRegion) return null;
  return "Sélectionnez au moins une zone de livraison.";
}

export function validateVillesLivreur(
  enabled: boolean,
  parsedCount: number,
): string | null {
  if (!enabled) return null;
  if (parsedCount === 0) {
    return "Ajoutez au moins une ville, ou décochez l’option.";
  }
  return null;
}

export function validateRegionLivreur(
  enabled: boolean,
  parsedCount: number,
): string | null {
  if (!enabled) return null;
  if (parsedCount === 0) {
    return "Indiquez au moins une région, ou décochez l’option.";
  }
  return null;
}

export function validateDispoLivreur(
  plein: boolean,
  partiel: boolean,
  weekend: boolean,
): string | null {
  if (plein || partiel || weekend) return null;
  return "Indiquez au moins une disponibilité.";
}

function isJpgPngPdf(file: File): boolean {
  const n = file.name.toLowerCase();
  const t = (file.type || "").toLowerCase();
  if (n.endsWith(".pdf")) return t === "" || t === "application/pdf";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) {
    return t === "" || t === "image/jpeg";
  }
  if (n.endsWith(".png")) return t === "" || t === "image/png";
  return false;
}

export function validateCinPermisFile(file: File | null): string | null {
  if (!file) return "Ajoutez votre CIN ou permis (JPG, PNG ou PDF, max 3 Mo).";
  if (file.size > CIN_MAX_BYTES) return "Le fichier dépasse 3 Mo.";
  if (!isJpgPngPdf(file)) {
    return "Formats acceptés : JPG, PNG ou PDF uniquement.";
  }
  return null;
}

export function buildZonesLivraison(
  zoneTunisie: boolean,
  zoneVillesTunisie: boolean,
  zoneRegion: boolean,
  villesTunisie: string,
  regionText: string,
): WorkZone[] {
  const zones: WorkZone[] = [];
  if (zoneTunisie) zones.push({ scope: "tn_all" });
  if (zoneVillesTunisie) {
    for (const v of villesTunisie
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      zones.push({ scope: "tn_city", value: v });
    }
  }
  if (zoneRegion) {
    for (const r of regionText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      zones.push({ scope: "tn_region", value: r });
    }
  }
  return zones;
}

export function buildLivreurDisponibilite(
  plein: boolean,
  partiel: boolean,
  weekend: boolean,
): string[] {
  const out: string[] = [];
  if (plein) out.push("temps_plein");
  if (partiel) out.push("temps_partiel");
  if (weekend) out.push("weekend");
  return out;
}

export function buildZonesTravail(
  zoneTunisie: boolean,
  zoneMonde: boolean,
  zoneVillesTunisie: boolean,
  zonePays: boolean,
  villesTunisie: string,
  pays: string,
): WorkZone[] {
  const zones: WorkZone[] = [];
  if (zoneTunisie) zones.push({ scope: "tn_all" });
  if (zoneMonde) zones.push({ scope: "world" });
  if (zoneVillesTunisie) {
    for (const v of villesTunisie
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      zones.push({ scope: "tn_city", value: v });
    }
  }
  if (zonePays) {
    for (const c of pays
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      zones.push({ scope: "country", value: c });
    }
  }
  return zones;
}

export function validateInscriptionForm(
  s: InscriptionFormState,
  parsedVilles: string[],
  parsedPays: string[],
  parsedVillesLivreur: string[],
  parsedRegionsLivreur: string[],
): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};

  const errNom = validateNom(s.nom);
  if (errNom) e.nom = errNom;

  const errEmail = validateEmail(s.email);
  if (errEmail) e.email = errEmail;

  const errTel = validateTelephone(s.telephone);
  if (errTel) e.telephone = errTel;

  const errPw = validatePassword(s.password);
  if (errPw) e.password = errPw;

  const errConf = validateConfirmPassword(s.password, s.confirmPassword);
  if (errConf) e.confirmPassword = errConf;

  if (s.isArtisan) {
    const errS = validateSpecialite(s.specialite);
    if (errS) e.specialite = errS;

    const errE = validateExperienceAnnees(s.experienceAnnees);
    if (errE) e.experienceAnnees = errE;

    const errZ = validateZonesArtisan(
      s.zoneTunisie,
      s.zoneMonde,
      s.zoneVillesTunisie,
      s.zonePays,
    );
    if (errZ) e.zones = errZ;

    const errV = validateVillesTunisie(
      s.zoneVillesTunisie,
      s.villesTunisie,
      parsedVilles.length,
    );
    if (errV) e.villesTunisie = errV;

    const errP = validatePays(s.zonePays, parsedPays.length);
    if (errP) e.pays = errP;
  }

  if (s.isExpert) {
    const errD = validateDomaineExpertise(s.domaineExpertise);
    if (errD) e.domaineExpertise = errD;

    const errEx = validateExpertExperienceAnnees(s.expertExperienceAnnees);
    if (errEx) e.expertExperienceAnnees = errEx;

    const errN = validateNiveauEtudes(s.niveauEtudes);
    if (errN) e.niveauEtudes = errN;

    const errCv = validateCvFile(s.cvFile);
    if (errCv) e.cvFile = errCv;

    const errLi = validateLinkedinOptional(s.linkedinUrl);
    if (errLi) e.linkedinUrl = errLi;
  }

  if (s.isLivreur) {
    const errM = validateMoyenTransport(s.moyenTransport);
    if (errM) e.moyenTransport = errM;

    const errZ = validateZonesLivraison(
      s.zoneLivTunisie,
      s.zoneLivVillesTunisie,
      s.zoneLivRegion,
    );
    if (errZ) e.zonesLivraison = errZ;

    const errV = validateVillesLivreur(
      s.zoneLivVillesTunisie,
      parsedVillesLivreur.length,
    );
    if (errV) e.villesLivreur = errV;

    const errR = validateRegionLivreur(
      s.zoneLivRegion,
      parsedRegionsLivreur.length,
    );
    if (errR) e.regionLivreur = errR;

    const errD = validateDispoLivreur(
      s.dispoTempsPlein,
      s.dispoTempsPartiel,
      s.dispoWeekend,
    );
    if (errD) e.dispoLivreur = errD;

    const errC = validateCinPermisFile(s.cinFile);
    if (errC) e.cinFile = errC;
  }

  return e;
}
