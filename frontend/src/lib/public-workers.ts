import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

export type PublicWorker = {
  _id: string;
  prenom?: string;
  nom: string;
  role: "artisan" | "expert" | string;
  telephone?: string;
  specialite?: string;
  competences?: string[];
  rating?: number;
  experienceYears?: number;
  experience_annees?: number;
  isAvailable?: boolean;
  zones_travail?: Array<{ scope: string; value?: string }>;
  /** Photo de profil (URL) — seed / compte */
  avatarUrl?: string;
  /** Texte de présentation courte */
  bio?: string;
};

export type ShowcaseProjectApi = {
  _id: string;
  titre: string;
  description?: string;
  statut?: string;
  avancement_global?: number;
  clientRating?: number;
  clientComment?: string;
  expertRating?: number;
  artisanRating?: number;
  photosAvant?: string[];
  photosApres?: string[];
  updatedAt?: string;
  createdAt?: string;
};

export type ShowcaseReviewEntry = {
  text: string;
  rating?: number;
  author: string;
  role: string;
};

export type ShowcaseProjectDetailApi = ShowcaseProjectApi & {
  expertComment?: string;
  artisanComment?: string;
  reviews?: ShowcaseReviewEntry[];
  /** Photos issues du suivi de chantier (journal BMP) */
  chantierPhotos?: string[];
};

export function workerDisplayName(w: PublicWorker): string {
  const n = [w.prenom, w.nom].filter(Boolean).join(" ").trim();
  return n || w.nom || "Membre";
}

export function avatarUrlForWorker(w: PublicWorker): string {
  const name = workerDisplayName(w);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=292524&color=fbbf24&size=256`;
}

/**
 * Anciens liens Unsplash encore en base mais retirés du catalogue (404).
 * À enrichir si d’autres IDs cassent — évite les requêtes mortes vers `/_next/image`.
 */
const DEAD_IMAGE_URL_MARKERS = [
  "photo-1600573472592-701b2c0100c7",
  "photo-1600607687644-c7171b42498b",
  "photo-1504257434649-3a7fd3f84f4b",
] as const;

export function isDeadImageUrl(url: string): boolean {
  const u = url.trim();
  return DEAD_IMAGE_URL_MARKERS.some((m) => u.includes(m));
}

/** Photo affichée : image du compte si définie, sinon initiales. */
export function profileImageUrl(w: PublicWorker): string {
  const u = w.avatarUrl?.trim();
  if (u && /^https?:\/\//i.test(u)) {
    if (isDeadImageUrl(u)) return avatarUrlForWorker(w);
    return u;
  }
  return avatarUrlForWorker(w);
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string; error?: string };
    if (j?.message) return j.message;
    if (j?.error) return j.error;
  } catch {
    /* ignore */
  }
  return text || res.statusText || `Erreur ${res.status}`;
}

/** Politique cache HTTP (Cache-Control) renvoyée par le backend — pas de `no-store` pour accélérer les visites répétées. */
export async function fetchPublicWorkers(): Promise<PublicWorker[]> {
  const res = await fetch(`${API_URL}/users/public/workers`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchShowcaseProjects(): Promise<ShowcaseProjectApi[]> {
  const res = await fetch(`${API_URL}/projects/public/showcase`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchShowcaseProjectById(
  id: string,
): Promise<ShowcaseProjectDetailApi> {
  const res = await fetch(`${API_URL}/projects/public/showcase/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Image de secours stable (chantier) — évite les 404 Unsplash si un lien disparaît. */
export const FALLBACK_SHOWCASE_IMAGE =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1600&q=80";

/** Images de secours vitrine (chantiers / rénovation — Unsplash). */
export const SHOWCASE_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
  "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1600&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80",
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1600&q=80",
];

export function pickShowcaseImage(index: number): string {
  return SHOWCASE_IMAGES[index % SHOWCASE_IMAGES.length];
}

/** Garde uniquement les URLs encore valides (hors liste morte). */
export function filterWorkingImageUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.filter((u): u is string => Boolean(u) && !isDeadImageUrl(u));
}

function firstWorkingUrl(urls: string[] | undefined): string | undefined {
  const list = filterWorkingImageUrls(urls);
  return list[0];
}

/** Image de couverture vitrine : préfère « après », sinon « avant », sinon placeholder. */
export function showcaseCoverImage(
  p: Pick<ShowcaseProjectApi, "photosApres" | "photosAvant">,
  fallbackIndex: number,
): string {
  const after = firstWorkingUrl(p.photosApres?.filter(Boolean));
  if (after) return after;
  const before = firstWorkingUrl(p.photosAvant?.filter(Boolean));
  if (before) return before;
  return pickShowcaseImage(fallbackIndex);
}
