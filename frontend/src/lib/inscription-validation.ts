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
  specialite: string;
  experienceAnnees: string;
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

  return e;
}
