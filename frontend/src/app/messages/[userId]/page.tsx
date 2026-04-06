"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Send,
  User,
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  fetchThread,
  sendMessage,
  type MessageRow,
} from "@/lib/messages-api";
import { FieldError, fieldTextareaClass } from "@/lib/form-ui";
import { validateMessageBody } from "@/lib/validators";

const API_URL = getApiBaseUrl();

type PartnerInfo = { nom?: string; role?: string };

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const otherId = typeof params?.userId === "string" ? params.userId : "";
  const bottomRef = useRef<HTMLDivElement>(null);

  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [textError, setTextError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const scrollBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const load = useCallback(async () => {
    const u = getStoredUser();
    if (!u || !otherId) return;
    setLoading(true);
    setErr(null);
    try {
      const [thread, userRes] = await Promise.all([
        fetchThread(u._id, otherId),
        fetch(`${API_URL}/users/${otherId}`, { cache: "no-store" }),
      ]);
      setMessages(Array.isArray(thread) ? thread : []);
      if (userRes.ok) {
        const ju = (await userRes.json()) as { nom?: string; role?: string };
        setPartner({ nom: ju.nom, role: ju.role });
      } else {
        setPartner({ nom: "Utilisateur" });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [otherId]);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (!otherId) return;
    void load();
  }, [otherId, load, router]);

  useEffect(() => {
    scrollBottom();
  }, [messages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = getStoredUser();
    if (!u) return;
    setTextError(null);
    const v = validateMessageBody(text);
    if (v) {
      setTextError(v);
      return;
    }
    setSending(true);
    setErr(null);
    try {
      await sendMessage(u._id, otherId, text.trim());
      setText("");
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  const u = getStoredUser();
  if (!u) return null;

  const me = u._id;

  return (
    <div className="mx-auto max-w-2xl flex flex-col min-h-[calc(100vh-8rem)] px-4 py-6">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-300 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Conversations
      </Link>

      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
        <div className="rounded-xl bg-amber-500/15 border border-amber-500/25 p-2.5">
          <User className="w-6 h-6 text-amber-200" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">
            {partner?.nom || "…"}
          </h1>
          {partner?.role && (
            <p className="text-xs text-gray-500 capitalize">{partner.role}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400/80" />
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[min(60vh,520px)] pr-1 mb-4">
            {err && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {err}
              </div>
            )}
            {messages.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                Aucun message encore. Écrivez le premier ci-dessous.
              </p>
            ) : (
              messages.map((m) => {
                const mine =
                  String(m.fromUserId) === me ||
                  (m.fromUserId as unknown as { toString(): string })?.toString?.() ===
                    me;
                return (
                  <div
                    key={m._id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        mine
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900"
                          : "bg-white/10 text-gray-100 border border-white/10"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      {m.createdAt && (
                        <p
                          className={`text-[10px] mt-1 ${
                            mine ? "text-gray-800/80" : "text-gray-500"
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form noValidate onSubmit={onSend} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
            <div className="flex-1 min-w-0">
              <textarea
                id="msg-body"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setTextError(null);
                }}
                rows={2}
                maxLength={8000}
                placeholder="Votre message…"
                disabled={sending}
                aria-invalid={!!textError}
                aria-describedby={textError ? "err-msg-body" : undefined}
                className={fieldTextareaClass(!!textError, sending)}
              />
              <FieldError id="err-msg-body" message={textError ?? undefined} />
            </div>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="self-end shrink-0 inline-flex items-center justify-center rounded-xl bg-amber-500 text-gray-900 p-3 hover:bg-amber-400 disabled:opacity-40"
              aria-label="Envoyer"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
