/** Formate le corps d’erreur NestJS / class-validator (message string | string[]). */
export function formatApiError(data: unknown, fallback = "Erreur"): string {
  if (!data || typeof data !== "object") return fallback;
  const o = data as { message?: unknown; error?: unknown };
  const m = o.message;
  if (Array.isArray(m)) return m.map(String).join(" ");
  if (typeof m === "string" && m.trim()) return m;
  if (typeof o.error === "string" && o.error === "backend_unreachable") {
    return typeof m === "string" && m.trim()
      ? m
      : "Le serveur API ne répond pas. Démarrez le backend (port 3001) ou vérifiez BACKEND_ORIGIN.";
  }
  return fallback;
}

/**
 * Lit le message d’erreur après un `fetch` échoué (`!res.ok`).
 * À utiliser à la place de `res.json()` pour ne pas consommer le corps deux fois.
 */
export async function readApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const text = await res.text().catch(() => "");
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    const t = text.trim();
    if (t) return t.length > 400 ? `${t.slice(0, 400)}…` : t;
    if (res.status === 502 || res.status === 503) {
      return "Le serveur API ne répond pas. Démarrez le backend (npm run start:dev dans /backend) ou vérifiez BACKEND_ORIGIN.";
    }
    return fallback || `Erreur HTTP ${res.status}`;
  }
  const msg = formatApiError(data, "");
  if (msg && msg !== "Erreur") return msg;
  if (res.status === 502 || res.status === 503) {
    return "Le serveur API ne répond pas. Démarrez le backend (port 3001).";
  }
  return fallback || `Erreur HTTP ${res.status}`;
}
