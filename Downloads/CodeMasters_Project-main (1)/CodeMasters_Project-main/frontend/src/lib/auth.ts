"use client";

export interface BMPUser {
  _id: string;
  nom: string;
  email: string;
  role: string;
  telephone?: string;
  createdAt?: string;
}

const STORAGE_KEY = "bmp_user";

export function getStoredUser(): BMPUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BMPUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: BMPUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("bmp_token");
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}
