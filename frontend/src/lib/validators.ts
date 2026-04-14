/**
 * Validations front alignées sur les DTOs Nest (class-validator) + règles UX.
 */

const NOM_MIN = 2;
const NOM_MAX = 100;
const NOM_REGEX = /^[\p{L}][\p{L}\s'\-.]*$/u;

export const EMAIL_MAX = 254;
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const TEL_MAX = 24;
export const PASS_MIN = 6;
export const PASS_MAX = 128;

/** Connexion : mot de passe requis (backend MinLength(1)). */
export function validateLoginPassword(value: string): string | null {
  if (!value || value.length < 1) {
    return "Saisissez votre mot de passe.";
  }
  if (value.length > PASS_MAX) {
    return `Maximum ${PASS_MAX} caractères.`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const t = value.trim().toLowerCase();
  if (!t) {
    return "L’adresse e-mail est obligatoire.";
  }
  if (t.length > EMAIL_MAX) {
    return "E-mail trop long.";
  }
  if (!EMAIL_REGEX.test(t)) {
    return "Format d’e-mail invalide (ex. nom@domaine.tn).";
  }
  return null;
}

export function validateTelephone(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (t.length > TEL_MAX) {
    return `Maximum ${TEL_MAX} caractères.`;
  }
  const digits = t.replace(/\D/g, "");
  if (digits.length < 8) {
    return "Le numéro doit contenir au moins 8 chiffres.";
  }
  if (digits.length > 15) {
    return "Numéro trop long.";
  }
  if (!/^[\d\s+().-]+$/.test(t)) {
    return "Caractères non autorisés dans le numéro.";
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < PASS_MIN) {
    return `Au moins ${PASS_MIN} caractères.`;
  }
  if (value.length > PASS_MAX) {
    return `Maximum ${PASS_MAX} caractères.`;
  }
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirm: string,
): string | null {
  if (confirm !== password) {
    return "Les deux mots de passe ne correspondent pas.";
  }
  return null;
}

export function validateNom(value: string): string | null {
  const t = value.trim();
  if (t.length < NOM_MIN) {
    return `Indiquez au moins ${NOM_MIN} caractères.`;
  }
  if (t.length > NOM_MAX) {
    return `Maximum ${NOM_MAX} caractères.`;
  }
  if (!NOM_REGEX.test(t)) {
    return "Utilisez uniquement des lettres, espaces, tirets ou apostrophes.";
  }
  return null;
}

const MSG_MIN = 1;
const MSG_MAX = 8000;

export function validateMessageBody(value: string): string | null {
  const t = value.trim();
  if (t.length < MSG_MIN) {
    return "Écrivez un message avant d’envoyer.";
  }
  if (t.length > MSG_MAX) {
    return `Message trop long (max. ${MSG_MAX} caractères).`;
  }
  return null;
}

const COMMENT_MAX = 4000;

export function validateOptionalLongText(
  value: string,
  maxLen: number,
  label: string,
): string | null {
  if (value.length > maxLen) {
    return `${label} : maximum ${maxLen} caractères.`;
  }
  return null;
}

export function validateClientRatingComment(value: string): string | null {
  if (value.length > COMMENT_MAX) {
    return `Commentaire : maximum ${COMMENT_MAX} caractères.`;
  }
  return null;
}

/** Proposition expert (CreateProposalDto). */
export function validateExpertProposal(
  priceStr: string,
  daysStr: string,
  notes: string,
): Partial<Record<"price" | "days" | "notes", string>> {
  const e: Partial<Record<"price" | "days" | "notes", string>> = {};
  const p = Number(priceStr);
  if (!Number.isFinite(p) || p < 0) {
    e.price = "Indiquez un prix valide (TND).";
  }
  const d = Number(daysStr);
  if (
    !Number.isFinite(d) ||
    d < 1 ||
    !Number.isInteger(d)
  ) {
    e.days = "Indiquez une durée d’au moins 1 jour (nombre entier).";
  }
  const n = notes.trim();
  const plain = n.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length < 1) {
    e.notes = "Les notes techniques sont obligatoires.";
  } else if (plain.length < 10) {
    e.notes = "Détaillez un peu plus votre proposition (au moins quelques phrases).";
  } else if (n.length > 50000) {
    e.notes = "Texte trop long (max. 50 000 caractères).";
  }
  return e;
}

export type NewProjectFormInput = {
  titre: string;
  categorie: string;
  description: string;
  ville: string;
  adresse: string;
  surface_m2: string;
  type_batiment: string;
  preferences_materiaux: string;
  exigences_techniques: string;
};

export type NewProjectFieldKey = keyof NewProjectFormInput | "urgence";

export function validateNewProjectForm(
  form: NewProjectFormInput,
): Partial<Record<keyof NewProjectFormInput, string>> {
  const e: Partial<Record<keyof NewProjectFormInput, string>> = {};

  if (!form.titre.trim()) {
    e.titre = "Le titre du projet est obligatoire.";
  } else if (form.titre.trim().length > 200) {
    e.titre = "Maximum 200 caractères.";
  }

  if (!form.categorie.trim()) {
    e.categorie = "Choisissez une catégorie.";
  }

  if (!form.description.trim()) {
    e.description = "La description est obligatoire.";
  } else if (form.description.trim().length > 8000) {
    e.description = "Maximum 8000 caractères.";
  }

  if (!form.ville.trim()) {
    e.ville = "La ville est obligatoire.";
  } else if (form.ville.trim().length > 120) {
    e.ville = "Maximum 120 caractères.";
  }

  if (!form.adresse.trim()) {
    e.adresse = "L’adresse est obligatoire.";
  } else if (form.adresse.trim().length > 300) {
    e.adresse = "Maximum 300 caractères.";
  }

  if (!form.type_batiment.trim()) {
    e.type_batiment = "Indiquez le type de bâtiment.";
  }

  const surf = form.surface_m2.trim();
  if (surf) {
    const n = Number(surf);
    if (!Number.isFinite(n) || n < 0) {
      e.surface_m2 = "Surface invalide (nombre positif).";
    } else if (n > 1_000_000) {
      e.surface_m2 = "Valeur trop grande.";
    }
  }

  const pm = form.preferences_materiaux;
  if (pm.length > 4000) {
    e.preferences_materiaux = "Maximum 4000 caractères.";
  }
  const ex = form.exigences_techniques;
  if (ex.length > 4000) {
    e.exigences_techniques = "Maximum 4000 caractères.";
  }

  return e;
}

const IMAGE_MAX_BYTES = 15 * 1024 * 1024;

export function validateImageFile(file: File | null): string | null {
  if (!file) {
    return "Choisissez une image.";
  }
  if (!file.type.startsWith("image/")) {
    return "Le fichier doit être une image (JPG, PNG, WebP…).";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return "Image trop volumineuse (max. 15 Mo).";
  }
  if (file.size < 256) {
    return "Fichier trop petit ou corrompu.";
  }
  return null;
}

const PHOTO_COMMENT_MAX = 2000;

export function validatePhotoComment(value: string): string | null {
  const t = value.trim();
  if (t.length > PHOTO_COMMENT_MAX) {
    return `Commentaire trop long (max. ${PHOTO_COMMENT_MAX} caractères).`;
  }
  return null;
}

const URLS_TEXT_MAX = 50_000;

/** URLs d’images (une par ligne ou séparées par virgule / point-virgule). */
export function parseImageUrls(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

export function validateExpertPhotoUrlsText(value: string): string | null {
  if (value.length > URLS_TEXT_MAX) {
    return `Texte trop long (max. ${URLS_TEXT_MAX.toLocaleString("fr-FR")} caractères).`;
  }
  const urls = parseImageUrls(value);
  if (urls.length === 0) {
    return "Indiquez au moins une URL commençant par http:// ou https:// (une par ligne).";
  }
  return null;
}

export function validateImageFilesList(files: File[]): string | null {
  if (files.length === 0) {
    return "Choisissez au moins une image.";
  }
  for (const f of files) {
    const err = validateImageFile(f);
    if (err) return err;
  }
  return null;
}
