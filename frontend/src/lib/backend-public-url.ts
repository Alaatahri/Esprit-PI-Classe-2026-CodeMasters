/**
 * Fichiers servis par le backend Nest (ex. /uploads/...) — pas via le proxy Next /api.
 */
export function getBackendOriginForPublicFiles(): string {
  const explicit = process.env.NEXT_PUBLIC_BACKEND_ORIGIN;
  if (typeof explicit === "string" && explicit.trim() !== "") {
    return explicit.replace(/\/$/, "");
  }
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (typeof api === "string" && api.trim() !== "") {
    const t = api.replace(/\/$/, "");
    if (t.startsWith("http") && t.endsWith("/api")) return t.slice(0, -4);
    if (t.startsWith("http")) return t;
  }
  // Plus fiable que `localhost` sur Windows (évite les cas IPv6 ::1 vs IPv4).
  return "http://127.0.0.1:3001";
}

export function publicFileUrl(path: string | undefined | null): string | null {
  if (!path || typeof path !== "string") return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = getBackendOriginForPublicFiles();
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Photos / fichiers stockés sur le backend (`/uploads/...`) ou URLs absolues. */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  const t = url.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return publicFileUrl(t) ?? t;
}

/**
 * URLs servies par le backend sur loopback — `next/image` renvoie souvent 400 en dev
 * (l’optimiseur refetch l’URL depuis le serveur Next). Utiliser `unoptimized` pour ces `src`.
 */
export function isBackendLocalMediaUrl(src: string): boolean {
  const t = src.trim();
  if (!t) return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(t);
}
