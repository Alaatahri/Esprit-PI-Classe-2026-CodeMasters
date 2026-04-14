import type { BMPUser } from "@/lib/auth";

/**
 * En-têtes d'auth côté front pour l'API (dev).
 * Le backend utilise `x-user-id` sur plusieurs endpoints.
 */
export function bmpAuthHeaders(user: BMPUser | null | undefined): HeadersInit {
  const id = user?._id ? String(user._id) : "";
  return id ? { "x-user-id": id } : {};
}
