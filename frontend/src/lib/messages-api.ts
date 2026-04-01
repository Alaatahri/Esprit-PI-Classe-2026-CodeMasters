import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

export type ConversationRow = {
  partnerId: string;
  lastBody: string;
  lastAt: string;
  unread: number;
  partnerNom?: string;
  partnerRole?: string;
};

export type MessageRow = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  readAt?: string;
  createdAt?: string;
};

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: unknown };
    if (Array.isArray(j?.message)) return j.message.join(" ");
    if (typeof j?.message === "string") return j.message;
  } catch {
    /* ignore */
  }
  return text || res.statusText || `Erreur ${res.status}`;
}

export async function fetchConversations(
  userId: string,
): Promise<ConversationRow[]> {
  const res = await fetch(`${API_URL}/messages/conversations`, {
    headers: { "x-user-id": userId },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const res = await fetch(`${API_URL}/messages/unread-count`, {
    headers: { "x-user-id": userId },
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const n = await res.json();
  return typeof n === "number" ? n : 0;
}

export async function fetchThread(
  userId: string,
  otherUserId: string,
): Promise<MessageRow[]> {
  const res = await fetch(`${API_URL}/messages/with/${otherUserId}`, {
    headers: { "x-user-id": userId },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function sendMessage(
  fromUserId: string,
  toUserId: string,
  body: string,
): Promise<unknown> {
  const res = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": fromUserId,
    },
    body: JSON.stringify({ toUserId, body }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
