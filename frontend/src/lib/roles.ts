import { normalizeRole } from "@/lib/auth";

export type BMPRole =
  | "client"
  | "expert"
  | "artisan"
  | "admin"
  | "fournisseur"
  | "ouvrier"
  | "manufacturer";

export function getHomePathForRole(role: string | undefined | null): string {
  const r = normalizeRole(role);
  if (r === "admin") return "/espace/admin";
  if (r === "artisan" || r === "ouvrier") return "/espace/artisan";
  if (r === "client") return "/espace/client";
  if (r === "expert") return "/espace/expert";
  if (r === "manufacturer" || r === "fournisseur") return "/espace/fournisseur";
  return "/espace";
}

export function canAccessChantierModule(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "artisan" || r === "manufacturer" || r === "ouvrier";
}

export function isExpertAreaUser(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === "expert" || r === "admin";
}
