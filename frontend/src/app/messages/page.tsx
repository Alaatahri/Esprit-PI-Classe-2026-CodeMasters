"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/auth";
import {
  fetchConversations,
  type ConversationRow,
} from "@/lib/messages-api";
import { formatConversationListTime } from "@/lib/format-message-time";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/layout/LoadingState";
import { EmptyState } from "@/components/layout/EmptyState";
import { cn } from "@/lib/utils";

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

export default function MessagesInboxPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchConversations(u._id);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Chargement impossible");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const u = getStoredUser();

  if (!u) {
    return null;
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:max-w-4xl lg:py-12">
      <PageHeader
        eyebrow="Messagerie"
        title="Messages"
        description="Vos échanges avec clients, experts et artisans — tout au même endroit."
      />

      <div className="mt-2">
        {loading ? (
          <LoadingState message="Chargement des conversations…" minHeight="md" />
        ) : err ? (
          <div
            className="rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-4 text-sm leading-relaxed text-red-100"
            role="alert"
          >
            {err}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Aucune conversation"
            description="Lorsqu’un contact vous écrit ou que vous utilisez « Contacter » depuis un projet, la discussion apparaîtra ici."
            action={
              <Link
                href="/espace"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 text-sm font-semibold text-gray-950 shadow-lg shadow-amber-500/20 transition-[box-shadow,transform] duration-300 hover:shadow-amber-500/35 motion-safe:active:scale-[0.99]"
              >
                Retour à l’espace
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((c) => {
              const initial = (c.partnerNom || "?").trim().charAt(0).toUpperCase();
              const timeLabel = c.lastAt
                ? formatConversationListTime(c.lastAt)
                : "";
              return (
                <li key={c.partnerId}>
                  <Link
                    href={`/messages/${c.partnerId}`}
                    className={cn(
                      "group flex min-h-[72px] items-center gap-4 rounded-2xl border border-border/50 bg-card/30 px-4 py-3.5 transition-[border-color,background-color,box-shadow,transform] duration-300",
                      "hover:border-border/75 hover:bg-card/45 hover:shadow-md motion-safe:active:scale-[0.995]",
                      "sm:gap-5 sm:px-5 sm:py-4",
                    )}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/25 to-yellow-500/10 text-lg font-bold text-amber-100 shadow-inner sm:h-14 sm:w-14"
                      aria-hidden
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate font-semibold text-foreground">
                          {c.partnerNom || "Utilisateur"}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          {timeLabel ? (
                            <time
                              className="text-[11px] tabular-nums text-muted-foreground sm:text-xs"
                              dateTime={c.lastAt}
                            >
                              {timeLabel}
                            </time>
                          ) : null}
                          {c.unread > 0 ? (
                            <span className="flex h-6 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-2 text-[11px] font-bold text-gray-900 shadow-sm">
                              {c.unread > 99 ? "99+" : c.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {roleLabel(c.partnerRole)}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {c.lastBody || "—"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-amber-300/90" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <MessageCircle className="h-4 w-4 shrink-0 text-amber-500/70" aria-hidden />
        Les notifications non lues sont aussi visibles dans la barre du haut.
      </p>
    </div>
  );
}
