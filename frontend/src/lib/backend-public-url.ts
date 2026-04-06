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
  return "http://localhost:3001";
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
