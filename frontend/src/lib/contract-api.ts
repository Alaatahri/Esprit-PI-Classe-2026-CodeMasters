/** Contrat client (réponse API contracts/*). */
export type ClientContractRow = {
  _id: string;
  status: string;
  contractText: string;
  clientSignedAt?: string;
  expertSignedAt?: string;
  clientSignedPdfUrl?: string;
  expertSignedPdfUrl?: string;
};

function coerceId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    return coerceId((raw as { _id: unknown })._id);
  }
  const s = String(raw);
  return s && s !== "undefined" ? s : null;
}

/** Réponse POST directe ou document contrat. */
export function parseContractRow(data: unknown): ClientContractRow | null {
  if (data == null) return null;
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const id = coerceId(o._id);
  if (!id) return null;
  return { ...(data as object), _id: id } as ClientContractRow;
}

/**
 * GET /contracts/by-project/:id renvoie `{ contract: ... | null }`.
 * Compat : ancienne forme = document racine.
 */
export function parseContractFromApiBody(data: unknown): ClientContractRow | null {
  if (data == null) return null;
  if (typeof data === "object" && data !== null && "contract" in data) {
    return parseContractRow((data as { contract: unknown }).contract);
  }
  return parseContractRow(data);
}
