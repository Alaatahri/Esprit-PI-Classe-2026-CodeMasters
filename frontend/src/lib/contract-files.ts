import { type ClientContractRow, parseContractRow } from "@/lib/contract-api";
import { readJsonSafe } from "@/lib/read-json-safe";

export async function downloadContractPdf(
  apiBase: string,
  contractId: string,
  userId: string,
  filename = "contrat-bmp.pdf",
): Promise<void> {
  const res = await fetch(`${apiBase}/contracts/${encodeURIComponent(contractId)}/pdf`, {
    cache: "no-store",
    headers: { "x-user-id": userId },
  });
  if (!res.ok) {
    const data = await readJsonSafe(res);
    const raw = data && typeof data === "object" ? (data as { message?: unknown }).message : undefined;
    const msg = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadClientSignedPdf(
  apiBase: string,
  contractId: string,
  userId: string,
  file: File,
): Promise<ClientContractRow> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${apiBase}/contracts/${encodeURIComponent(contractId)}/upload-client-pdf`, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: fd,
  });
  const data = await readJsonSafe(res);
  if (!res.ok) {
    const raw = data && typeof data === "object" ? (data as { message?: unknown }).message : undefined;
    const msg = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  const c = parseContractRow(data);
  if (!c) throw new Error("Réponse contrat invalide.");
  return c;
}

export async function uploadExpertSignedPdf(
  apiBase: string,
  contractId: string,
  userId: string,
  file: File,
): Promise<ClientContractRow> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${apiBase}/contracts/${encodeURIComponent(contractId)}/upload-expert-pdf`, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: fd,
  });
  const data = await readJsonSafe(res);
  if (!res.ok) {
    const raw = data && typeof data === "object" ? (data as { message?: unknown }).message : undefined;
    const msg = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  const c = parseContractRow(data);
  if (!c) throw new Error("Réponse contrat invalide.");
  return c;
}
