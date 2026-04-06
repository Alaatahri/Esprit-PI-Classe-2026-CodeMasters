"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Layers,
  Loader2,
  MapPin,
  User,
  BadgeCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { readApiErrorMessage } from "@/lib/api-error";

const API_URL = getApiBaseUrl();

type UserBrief = {
  prenom?: string;
  nom?: string;
  email?: string;
  role?: string;
};

type CatalogRow = {
  project: {
    _id: string;
    titre?: string;
    description?: string;
    ville?: string;
    statut?: string;
    requestStatus?: string;
    createdAt?: string;
    expertId?: UserBrief | string;
    clientId?: UserBrief | string;
  };
  matching: {
    inviteCount: number;
    pending: number;
    refused: number;
    acceptedBy: {
      requestId: string;
      respondedAt?: string;
      expert?: UserBrief;
    } | null;
  };
};

function personLabel(u?: UserBrief | string): string {
  if (!u || typeof u === "string") return typeof u === "string" ? u : "—";
  const n = [u.prenom, u.nom].filter(Boolean).join(" ").trim();
  return n || u.email || "—";
}

function roleLabel(role?: string): string {
  if (!role) return "";
  const r = role.toLowerCase();
  if (r === "admin") return "Administrateur";
  if (r === "expert") return "Expert";
  if (r === "client") return "Client";
  if (r === "artisan") return "Artisan";
  return role;
}

export default function ExpertTousLesProjetsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    const role = normalizeRole(u.role);
    if (role !== "expert" && u.role !== "admin") {
      router.replace("/espace");
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_URL}/matching/expert/catalog`, {
          headers: { "x-user-id": u._id },
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(
            await readApiErrorMessage(
              res,
              "Impossible de charger le catalogue des projets.",
            ),
          );
        }
        const data = (await res.json()) as CatalogRow[];
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erreur");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const counts = useMemo(() => {
    let assigned = 0;
    let withInvite = 0;
    for (const r of rows) {
      if (r.project.expertId) assigned++;
      if (r.matching.inviteCount > 0) withInvite++;
    }
    return { total: rows.length, assigned, withInvite };
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-6">
        <Link
          href="/espace"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Mon espace
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tous les projets</h1>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Vue globale des dossiers créés sur la plateforme : statut,
                client, expert assigné, et résultat des invitations de matching
                (acceptation par un expert).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/expert/nouveaux-projets"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              Mes invitations
            </Link>
            <Link
              href="/expert/projets"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/20"
            >
              Mes projets assignés
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-300 flex flex-wrap gap-x-6 gap-y-2">
          <span>
            Total dossiers :{" "}
            <strong className="text-white">{counts.total}</strong>
          </span>
          <span>
            Avec expert sur la fiche :{" "}
            <strong className="text-emerald-300">{counts.assigned}</strong>
          </span>
          <span>
            Matching envoyé :{" "}
            <strong className="text-amber-300">{counts.withInvite}</strong>
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            {err}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center text-sm text-gray-400">
            Aucun projet en base pour l’instant.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(({ project: p, matching: m }) => {
              const pid = String(p._id);
              const assigned = p.expertId
                ? personLabel(
                    typeof p.expertId === "object" ? p.expertId : undefined,
                  )
                : null;
              const assignedRole =
                typeof p.expertId === "object" && p.expertId?.role
                  ? roleLabel(p.expertId.role)
                  : "";
              const client = personLabel(
                typeof p.clientId === "object" ? p.clientId : undefined,
              );
              const clientRole =
                typeof p.clientId === "object" && p.clientId?.role
                  ? roleLabel(p.clientId.role)
                  : "";

              const acceptedName = m.acceptedBy?.expert
                ? personLabel(m.acceptedBy.expert)
                : null;
              const acceptedRole =
                m.acceptedBy?.expert && typeof m.acceptedBy.expert === "object"
                  ? roleLabel(m.acceptedBy.expert.role)
                  : "";

              return (
                <article
                  key={pid}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 hover:border-amber-500/25 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-white line-clamp-2">
                          {p.titre ?? "Sans titre"}
                        </h2>
                        {p.statut ? (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-gray-300">
                            {p.statut}
                          </span>
                        ) : null}
                        {p.requestStatus ? (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-200/90">
                            {p.requestStatus}
                          </span>
                        ) : null}
                      </div>
                      {p.ville ? (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {p.ville}
                        </p>
                      ) : null}
                      <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-400">
                        <p className="flex items-start gap-2">
                          <User className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-500" />
                          <span>
                            <span className="text-gray-500">Client :</span>{" "}
                            <span className="text-gray-200">{client}</span>
                            {clientRole ? (
                              <span className="text-gray-500">
                                {" "}
                                · {clientRole}
                              </span>
                            ) : null}
                          </span>
                        </p>
                        <p className="flex items-start gap-2">
                          <BadgeCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400/80" />
                          <span>
                            <span className="text-gray-500">
                              Expert sur la fiche :
                            </span>{" "}
                            {assigned ? (
                              <>
                                <span className="text-emerald-200/95">
                                  {assigned}
                                </span>
                                {assignedRole ? (
                                  <span className="text-gray-500">
                                    {" "}
                                    · {assignedRole}
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-gray-500">non assigné</span>
                            )}
                          </span>
                        </p>
                        <p className="flex items-start gap-2 sm:col-span-2">
                          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400/70" />
                          <span>
                            <span className="text-gray-500">Matching :</span>{" "}
                            {m.inviteCount} invitation(s) · {m.pending}{" "}
                            en attente · {m.refused} refus / expiré
                            {acceptedName ? (
                              <>
                                {" "}
                                ·{" "}
                                <span className="text-amber-200/95">
                                  acceptée par {acceptedName}
                                </span>
                                {acceptedRole ? (
                                  <span className="text-gray-500">
                                    {" "}
                                    ({acceptedRole})
                                  </span>
                                ) : null}
                              </>
                            ) : m.inviteCount > 0 ? (
                              <span className="text-gray-500">
                                {" "}
                                · aucune acceptation enregistrée
                              </span>
                            ) : null}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/expert/projects/${encodeURIComponent(pid)}?from=catalog`}
                      className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-95"
                    >
                      Ouvrir
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
