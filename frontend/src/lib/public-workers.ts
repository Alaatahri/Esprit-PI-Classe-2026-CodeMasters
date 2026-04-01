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

/** Photo affichée : image du compte si définie, sinon initiales. */
export function profileImageUrl(w: PublicWorker): string {
  const u = w.avatarUrl?.trim();
  if (u && /^https?:\/\//i.test(u)) return u;
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

export async function fetchPublicWorkers(): Promise<PublicWorker[]> {
  const res = await fetch(`${API_URL}/users/public/workers`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchShowcaseProjects(): Promise<ShowcaseProjectApi[]> {
  const res = await fetch(`${API_URL}/projects/public/showcase`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchShowcaseProjectById(
  id: string,
): Promise<ShowcaseProjectDetailApi> {
  const res = await fetch(`${API_URL}/projects/public/showcase/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export const SHOWCASE_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80",
  "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=900&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=80",
];

export function pickShowcaseImage(index: number): string {
  return SHOWCASE_IMAGES[index % SHOWCASE_IMAGES.length];
}

/** Image de couverture vitrine : préfère « après », sinon « avant », sinon placeholder. */
export function showcaseCoverImage(
  p: Pick<ShowcaseProjectApi, "photosApres" | "photosAvant">,
  fallbackIndex: number,
): string {
  const ap = p.photosApres?.filter(Boolean);
  const av = p.photosAvant?.filter(Boolean);
  if (ap?.length) return ap[0]!;
  if (av?.length) return av[0]!;
  return pickShowcaseImage(fallbackIndex);
}
