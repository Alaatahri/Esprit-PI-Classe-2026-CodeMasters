"use client";

/** Rôle normalisé en minuscules (aligné sur l’API / enum Mongo). */
export function normalizeRole(role: string | undefined | null): string {
  return String(role ?? "").trim().toLowerCase();
}

export function isClientRole(role: string | undefined | null): boolean {
  return normalizeRole(role) === "client";
}

export interface BMPUser {
  _id: string;
  nom: string;
  email: string;
  role: string;
  telephone?: string;
  specialite?: string;
  experience_annees?: number;
  zones_travail?: Array<{ scope: "tn_all" | "tn_city" | "country" | "world"; value?: string }>;
  createdAt?: string;
}

export const AUTH_CHANGE_EVENT = "bmp:auth-change" as const;

const STORAGE_KEY = "bmp_user";

export function getStoredUser(): BMPUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as BMPUser;
    return { ...u, role: normalizeRole(u.role) };
  } catch {
    return null;
  }
}

export function setStoredUser(user: BMPUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  try {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("bmp_token");
  try {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}
