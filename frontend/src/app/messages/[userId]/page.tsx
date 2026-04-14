"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Send,
} from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  fetchThread,
  sendMessage,
  type MessageRow,
} from "@/lib/messages-api";
import { FieldError, fieldTextareaClass } from "@/lib/form-ui";
import { validateMessageBody } from "@/lib/validators";
import {
  formatDaySeparatorLabel,
  isSameCalendarDay,
} from "@/lib/format-message-time";
import { LoadingState } from "@/components/layout/LoadingState";
import { cn } from "@/lib/utils";

const API_URL = getApiBaseUrl();

type PartnerInfo = { nom?: string; role?: string };

function roleLabel(role?: string): string {
  if (!role) return "";
  const r = normalizeRole(role);
  if (r === "client") return "Client";
  if (r === "expert") return "Expert";
  if (r === "artisan") return "Artisan";
  if (r === "admin") return "Administrateur";
  if (r === "ouvrier") return "Équipe terrain";
  if (r === "fournisseur") return "Fournisseur";
  return role;
}

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
  const partnerInitial = (partner?.nom || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 lg:max-w-4xl lg:py-10">
      <Link
        href="/messages"
        className="mb-6 inline-flex min-h-[44px] max-w-fit items-center gap-2 rounded-xl text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-amber-300"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Toutes les conversations
      </Link>

      <div
        className={cn(
          "bmp-panel flex flex-col overflow-hidden",
          "max-h-[calc(100dvh-10rem)] min-h-[420px] sm:min-h-[520px]",
        )}
      >
        <div className="flex shrink-0 items-center gap-4 border-b border-border/50 px-4 py-4 sm:px-6">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/25 to-yellow-500/10 text-lg font-bold text-amber-100 shadow-inner sm:h-14 sm:w-14"
            aria-hidden
          >
            {partnerInitial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {partner?.nom || "…"}
            </h1>
            {partner?.role ? (
              <p className="mt-0.5 text-xs font-medium capitalize text-muted-foreground">
                {roleLabel(partner.role)}
              </p>
            ) : null}
          </div>
        </div>

        {loading ? (
          <LoadingState
            className="flex-1 py-16"
            message="Chargement de la conversation…"
            minHeight="md"
          />
        ) : (
          <>
            <div
              className="scrollbar-bmp min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5"
              role="log"
              aria-label="Messages de la conversation"
            >
              {err && (
                <div
                  className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                  role="alert"
                >
                  {err}
                </div>
              )}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Aucun message pour l’instant. Écrivez un premier message ci-dessous
                    pour démarrer la conversation.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {messages.map((m, i) => {
                    const mine =
                      String(m.fromUserId) === me ||
                      (m.fromUserId as unknown as { toString(): string })
                        ?.toString?.() === me;
                    const prev = messages[i - 1];
                    const showDay =
                      m.createdAt &&
                      (!prev?.createdAt ||
                        !isSameCalendarDay(m.createdAt, prev.createdAt));

                    return (
                      <Fragment key={m._id}>
                        {showDay && m.createdAt ? (
                          <div className="flex justify-center py-3">
                            <span className="rounded-full border border-border/40 bg-card/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-sm backdrop-blur-sm">
                              {formatDaySeparatorLabel(m.createdAt)}
                            </span>
                          </div>
                        ) : null}
                        <div
                          className={cn(
                            "flex w-full",
                            mine ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[min(100%,22rem)] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[85%] sm:px-4 sm:py-3",
                              mine
                                ? "rounded-br-md bg-gradient-to-r from-amber-500 to-amber-400 text-gray-950 shadow-amber-500/15"
                                : "rounded-bl-md border border-border/50 bg-card/45 text-foreground backdrop-blur-sm",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {m.body}
                            </p>
                            {m.createdAt ? (
                              <time
                                className={cn(
                                  "mt-2 block text-[10px] tabular-nums",
                                  mine
                                    ? "text-gray-900/65"
                                    : "text-muted-foreground",
                                )}
                                dateTime={m.createdAt}
                              >
                                {new Date(m.createdAt).toLocaleString("fr-FR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </time>
                            ) : null}
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              )}
              <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
            </div>

            <form
              noValidate
              onSubmit={onSend}
              className="shrink-0 border-t border-border/50 bg-background/50 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label htmlFor="msg-body" className="sr-only">
                    Votre message
                  </label>
                  <textarea
                    id="msg-body"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setTextError(null);
                    }}
                    rows={3}
                    maxLength={8000}
                    placeholder="Écrivez votre message…"
                    disabled={sending}
                    aria-invalid={!!textError}
                    aria-describedby={textError ? "err-msg-body" : undefined}
                    className={cn(
                      fieldTextareaClass(!!textError, sending),
                      "min-h-[88px] resize-y sm:min-h-[72px]",
                    )}
                  />
                  <FieldError id="err-msg-body" message={textError ?? undefined} />
                </div>
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className={cn(
                    "inline-flex h-12 min-w-[52px] shrink-0 items-center justify-center self-stretch rounded-xl sm:h-[72px] sm:w-14 sm:self-auto",
                    "bg-gradient-to-r from-amber-500 to-amber-400 text-gray-950 shadow-lg shadow-amber-500/20",
                    "transition-[box-shadow,transform,opacity] duration-300",
                    "hover:shadow-amber-500/35 hover:brightness-105",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:pointer-events-none disabled:opacity-45",
                    "motion-safe:active:scale-[0.98]",
                  )}
                  aria-label="Envoyer le message"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {text.length.toLocaleString("fr-FR")} / 8 000 caractères
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
