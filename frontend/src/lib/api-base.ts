/**
 * URL de base pour l'API NestJS.
 *
 * Par défaut : `/api` — le trafic est relayé vers le backend via `rewrites` dans
 * `next.config.ts` (même origine que le frontend → pas de CORS, fonctionne avec
 * `localhost` ou `127.0.0.1`).
 *
 * Surcharge : `NEXT_PUBLIC_API_URL` (ex. `https://api.mondomaine.tn/api` en prod).
 */
export function getApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (typeof env === "string" && env.trim() !== "") {
    return env.replace(/\/$/, "");
  }
  return "/api";
}
