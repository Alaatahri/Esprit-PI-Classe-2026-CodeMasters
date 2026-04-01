"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Loader2, ChevronRight, User } from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/auth";
import {
  fetchConversations,
  type ConversationRow,
} from "@/lib/messages-api";

function roleLabel(role?: string): string {
  if (!role) return "";
  const r = normalizeRole(role);
  if (r === "client") return "Client";
  if (r === "expert") return "Expert";
  if (r === "artisan") return "Artisan";
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3">
          <MessageCircle className="w-7 h-7 text-amber-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-sm text-gray-500">
            Vos conversations avec clients, experts et artisans.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400/80" />
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center space-y-3">
          <p className="text-gray-400 text-sm">
            Aucune conversation pour le moment. Ouvrez un projet (ex. espace
            expert) et utilisez « Contacter » pour écrire à un client ou un
            artisan.
          </p>
          <Link
            href="/espace"
            className="inline-flex text-sm text-amber-400 hover:text-amber-300"
          >
            Retour à l&apos;espace
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.partnerId}>
              <Link
                href={`/messages/${c.partnerId}`}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-amber-500/30 hover:bg-white/[0.06]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/10 border border-amber-500/20">
                  <User className="w-6 h-6 text-amber-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white truncate">
                      {c.partnerNom || "Utilisateur"}
                    </p>
                    {c.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-gray-900">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                    {roleLabel(c.partnerRole)}
                  </p>
                  <p className="text-sm text-gray-400 truncate mt-1">
                    {c.lastBody}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
