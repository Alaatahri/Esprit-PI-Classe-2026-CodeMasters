/**
 * URL de base pour l'API NestJS.
 *
 * Par défaut : `/api` — relais via `src/app/api/[...path]/route.ts` ou rewrites.
 *
 * Surcharge : `NEXT_PUBLIC_API_URL` — doit pointer vers la **racine API** Nest
 * (suffixe `/api`), ex. `http://127.0.0.1:3001/api`. Si vous ne mettez que
 * l’origine (`http://127.0.0.1:3001`), le suffixe `/api` est ajouté automatiquement.
 */
export function getApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (typeof env === "string" && env.trim() !== "") {
    const trimmed = env.trim().replace(/\/+$/, "");
    try {
      const u = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`);
      if (u.pathname === "/" || u.pathname === "") {
        return `${trimmed}/api`;
      }
      return trimmed;
    } catch {
      return `${trimmed}/api`;
    }
  }
  return "/api";
}
