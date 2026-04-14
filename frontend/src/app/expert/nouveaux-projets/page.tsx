"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ClipboardList, ChevronRight } from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/auth";
import { isExpertAreaUser } from "@/lib/roles";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type ExpertBrief = { prenom?: string; nom?: string; email?: string };

type MatchingRow = {
  _id: string;
  status: "pending" | "accepted" | "refused";
  isExpired?: boolean;
  sentAt?: string;
  expiresAt?: string;
  respondedAt?: string;
  matchScore?: number;
  requiredCompetences?: string[];
  expertId?: ExpertBrief | string;
  projectId?: {
    _id?: string;
    titre?: string;
    description?: string;
    ville?: string;
    expertId?: ExpertBrief | string;
  };
};

function expertLabel(e?: ExpertBrief | string): string {
  if (!e || typeof e === "string") return typeof e === "string" ? e : "—";
  const n = [e.prenom, e.nom].filter(Boolean).join(" ").trim();
  return n || e.email || "—";
}

export default function ExpertNouveauxProjetsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<MatchingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<{ _id: string; nom: string; role: string } | null>(
    null,
  );

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (!isExpertAreaUser(u.role)) {
      router.replace("/espace");
      return;
    }
    setMe({ _id: u._id, nom: u.nom, role: normalizeRole(u.role) });

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_URL}/matching/my-requests`, {
          headers: { "x-user-id": u._id },
          cache: "no-store",
        });
        if (!res.ok) {
          const status = res.status;
          if (status === 403) {
            throw new Error(
              "Accès interdit (vérifie que tu es connecté avec un compte `expert`).",
            );
          }
          throw new Error("Impossible de charger les demandes.");
        }
        const data = (await res.json()) as MatchingRow[];
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erreur");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const pending = useMemo(
    () => rows.filter((r) => r.status === "pending" && !r.isExpired),
    [rows],
  );

  const sortedRows = useMemo(() => {
    const rank = (r: MatchingRow) => {
      if (r.status === "pending" && !r.isExpired) return 0;
      if (r.status === "accepted") return 1;
      if (r.status === "pending" && r.isExpired) return 2;
      return 3;
    };
    return [...rows].sort((a, b) => {
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0;
      const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0;
      return tb - ta;
    });
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Invitations</h1>
            </div>
          </div>
          <Link
            href="/expert/projets"
            className="hidden sm:inline-flex rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            Mes projets
          </Link>
        </div>

        {me ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-400">
            <span className="text-gray-200 font-medium">{me.nom || "Expert"}</span>
            {" · "}
            {rows.length} invitation{rows.length > 1 ? "s" : ""}
            {pending.length > 0 ? (
              <>
                {" · "}
                <span className="text-emerald-300">{pending.length} en attente</span>
              </>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400 space-y-4">
            <p>Aucune invitation pour l’instant.</p>
            <Link
              href="/expert/tous-les-projets"
              className="inline-flex rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/20"
            >
              Tous les projets
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {sortedRows.map((r) => {
              const p = r.projectId;
              const pid = p?._id ? String(p._id) : "";
              const statusLabel =
                r.status === "accepted"
                  ? "Acceptée"
                  : r.status === "refused"
                    ? "Refusée"
                    : r.isExpired
                      ? "Expirée"
                      : "En attente";
              const statusClass =
                r.status === "accepted"
                  ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                  : r.status === "refused"
                    ? "bg-red-500/10 text-red-200 border-red-500/25"
                    : r.isExpired
                      ? "bg-white/10 text-gray-300 border-white/15"
                      : "bg-amber-500/15 text-amber-200 border-amber-500/30";

              if (!pid) {
                return (
                  <li
                    key={r._id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-500"
                  >
                    Projet indisponible
                  </li>
                );
              }

              return (
                <li key={r._id}>
                  <Link
                    href={`/expert/projects/${encodeURIComponent(pid)}?from=nouveaux`}
                    className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-amber-500/30 hover:bg-white/[0.06]"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                        {p?.ville ? (
                          <span className="text-[11px] text-gray-500">{p.ville}</span>
                        ) : null}
                      </div>
                      <h2 className="text-base font-semibold text-white group-hover:text-amber-100 transition line-clamp-2">
                        {p?.titre ?? "Projet"}
                      </h2>
                      {p?.description ? (
                        <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                      ) : null}
                      {r.status === "accepted" || r.status === "refused" ? (
                        <p className="text-[11px] text-gray-600">
                          {r.status === "accepted" ? "Acceptée" : "Refusée"} par{" "}
                          <span className="text-gray-400">{expertLabel(r.expertId)}</span>
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0 text-gray-600 group-hover:text-amber-400 mt-1" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
