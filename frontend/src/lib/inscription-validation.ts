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

export type WorkZoneScope = "tn_all" | "tn_city" | "country" | "world";
export type WorkZone = { scope: WorkZoneScope; value?: string };

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
  expertDomaine: string;
  expertNiveauEtudes: string;
  expertCvSelected: boolean;
  livreurTransport: string;
  livreurZoneTunisie: boolean;
  livreurZoneVillesTunisie: boolean;
  livreurZoneRegion: boolean;
  livreurVillesTunisie: string;
  livreurRegion: string;
  livreurDisponibilites: string[];
  livreurCinSelected: boolean;
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
  | "expertDomaine"
  | "expertNiveauEtudes"
  | "expertCv"
  | "livreurTransport"
  | "livreurZones"
  | "livreurVillesTunisie"
  | "livreurRegion"
  | "livreurCin"
  | "livreurDisponibilites"
  | "villesTunisie"
  | "pays"
  | "zones"
  | "password"
  | "confirmPassword";

const SPEC_MIN = 2;
const SPEC_MAX = 160;
const EXP_MAX = 80;

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

export function validateExpertDomaine(value: string): string | null {
  const t = value.trim();
  if (t.length < 2) {
    return "Domaine d’expertise trop court.";
  }
  return null;
}

export function validateExpertNiveauEtudes(value: string): string | null {
  const v = (value || "").trim();
  const allowed = ["bac_plus_3", "bac_plus_5", "doctorat", "autre"];
  if (!allowed.includes(v)) {
    return "Niveau d’études invalide.";
  }
  return null;
}

export function validateLivreurTransport(value: string): string | null {
  const v = (value || "").trim();
  const allowed = ["velo", "moto", "voiture", "camionnette"];
  if (!allowed.includes(v)) {
    return "Choisissez un moyen de transport.";
  }
  return null;
}

export function validateLivreurZones(
  zoneTunisie: boolean,
  zoneVillesTunisie: boolean,
  zoneRegion: boolean,
): string | null {
  if (zoneTunisie || zoneVillesTunisie || zoneRegion) return null;
  return "Sélectionnez au moins une zone de livraison.";
}

export function validateLivreurVillesTunisie(
  enabled: boolean,
  parsedCount: number,
): string | null {
  if (!enabled) return null;
  if (parsedCount === 0) return "Ajoutez au moins une ville, ou décochez l’option.";
  return null;
}

export function validateLivreurRegion(enabled: boolean, value: string): string | null {
  if (!enabled) return null;
  if (!value.trim()) return "Indiquez une région, ou décochez l’option.";
  return null;
}

export function validateLivreurDisponibilites(values: string[]): string | null {
  const allowed = new Set(["temps_plein", "temps_partiel", "weekend"]);
  const v = Array.isArray(values) ? values.filter((x) => allowed.has(x)) : [];
  if (v.length === 0) return "Choisissez au moins une disponibilité.";
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
    const errD = validateExpertDomaine(s.expertDomaine);
    if (errD) e.expertDomaine = errD;

    const errE = validateExperienceAnnees(s.experienceAnnees);
    if (errE) e.experienceAnnees = errE;

    const errN = validateExpertNiveauEtudes(s.expertNiveauEtudes);
    if (errN) e.expertNiveauEtudes = errN;

    if (!s.expertCvSelected) {
      e.expertCv = "CV obligatoire (PDF ou DOCX).";
    }
  }

  if (s.isLivreur) {
    const errT = validateLivreurTransport(s.livreurTransport);
    if (errT) e.livreurTransport = errT;

    const errZ = validateLivreurZones(
      s.livreurZoneTunisie,
      s.livreurZoneVillesTunisie,
      s.livreurZoneRegion,
    );
    if (errZ) e.livreurZones = errZ;

    const parsedLivreurVilles = s.livreurVillesTunisie
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const errLV = validateLivreurVillesTunisie(
      s.livreurZoneVillesTunisie,
      parsedLivreurVilles.length,
    );
    if (errLV) e.livreurVillesTunisie = errLV;

    const errLR = validateLivreurRegion(s.livreurZoneRegion, s.livreurRegion);
    if (errLR) e.livreurRegion = errLR;

    const errDisp = validateLivreurDisponibilites(s.livreurDisponibilites);
    if (errDisp) e.livreurDisponibilites = errDisp;

    if (!s.livreurCinSelected) {
      e.livreurCin = "CIN / Permis obligatoire (JPG, PNG ou PDF).";
    }
  }

  return e;
}
