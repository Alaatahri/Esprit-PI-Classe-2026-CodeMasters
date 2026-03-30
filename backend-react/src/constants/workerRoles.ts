/** Rôles avec profil terrain (matching IA) — aligné backend */
export const FIELD_WORKER_ROLES = [
  'artisan',
  'ouvrier',
  'electricien',
  'expert',
  'architecte',
] as const;

export type FieldWorkerRole = (typeof FIELD_WORKER_ROLES)[number];

export function isFieldWorkerRole(role: string | undefined): boolean {
  if (!role) return false;
  return (FIELD_WORKER_ROLES as readonly string[]).includes(role);
}
