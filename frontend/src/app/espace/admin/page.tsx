"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Users } from "lucide-react";
import { getStoredUser, normalizeRole, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type PopulatedUser = {
  _id?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  competences?: string[];
  rating?: number;
};

type PopulatedProject = {
  _id?: string;
  titre?: string;
  nom?: string;
  description?: string;
};

export type MatchingRequestRow = {
  _id: string;
  status: string;
  matchScore?: number;
  requiredCompetences?: string[];
  sentAt?: string;
  expiresAt?: string;
  respondedAt?: string;
  isExpired?: boolean;
  projectId?: PopulatedProject | string;
  expertId?: PopulatedUser | string;
};

function refLabel(
  ref: PopulatedUser | PopulatedProject | string | undefined,
  fallback: string,
): string {
  if (!ref) return fallback;
  if (typeof ref === "string") return ref;
  if ("titre" in ref || "nom" in ref) {
    const p = ref as PopulatedProject;
    return p.titre || p.nom || p.description?.slice(0, 40) || fallback;
  }
  const u = ref as PopulatedUser;
  const n = [u.prenom, u.nom].filter(Boolean).join(" ").trim();
  return n || u.email || fallback;
}

export default function AdminSpacePage() {
  const [user, setUser] = useState<BMPUser | null>(null);
  const [rows, setRows] = useState<MatchingRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const load = useCallback(async () => {
    const u = getStoredUser();
    if (!u || normalizeRole(u.role) !== "admin") {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_URL}/admin/matching/requests`, {
        cache: "no-store",
        headers: { "x-user-id": u._id },
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { message?: unknown } | null;
        const raw = j?.message;
        const msg = Array.isArray(raw)
          ? raw.join(" ")
          : typeof raw === "string"
            ? raw
            : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      const data = (await res.json()) as MatchingRequestRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (user && normalizeRole(user.role) !== "admin") {
    return (
      <div className="max-w-2xl mx-auto space-y-4 px-4 py-10">
        <h1 className="text-2xl font-bold text-white">Espace admin</h1>
        <p className="text-sm text-gray-400">Accès réservé aux administrateurs.</p>
        <Link href="/espace" className="text-amber-400 hover:underline text-sm">
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Espace admin</h1>
          <p className="text-sm text-gray-400 mt-1">
            Invitations matching : projets et experts ciblés (scores automatiques).
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualiser
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Users className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Matching & invitations</h2>
          <span className="text-xs text-gray-500 ml-auto">{rows.length} ligne(s)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500 px-4 py-8">Aucune invitation enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase text-gray-500">
                  <th className="px-3 py-2 font-medium">Projet</th>
                  <th className="px-3 py-2 font-medium">Expert invité</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 font-medium">Envoyé</th>
                  <th className="px-3 py-2 font-medium">Expire</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {rows.map((r) => {
                  const pid =
                    typeof r.projectId === "object" && r.projectId && "_id" in r.projectId
                      ? String((r.projectId as { _id: unknown })._id)
                      : typeof r.projectId === "string"
                        ? r.projectId
                        : "";
                  return (
                    <tr key={r._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-3 py-2 align-top">
                        <span className="text-white font-medium">
                          {refLabel(r.projectId as PopulatedProject, "—")}
                        </span>
                        {pid ? (
                          <span className="block text-[10px] text-gray-600 font-mono mt-0.5">
                            {pid}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span>{refLabel(r.expertId as PopulatedUser, "—")}</span>
                        {typeof r.expertId === "object" && r.expertId && "email" in r.expertId ? (
                          <span className="block text-[11px] text-gray-500">
                            {(r.expertId as PopulatedUser).email}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top tabular-nums">
                        {typeof r.matchScore === "number" ? r.matchScore.toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className={
                            r.status === "accepted"
                              ? "text-emerald-400"
                              : r.status === "refused"
                                ? "text-red-400/90"
                                : r.isExpired
                                  ? "text-amber-400"
                                  : "text-gray-300"
                          }
                        >
                          {r.status}
                          {r.isExpired && r.status === "pending" ? " (expiré)" : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-gray-500">
                        {r.sentAt ? new Date(r.sentAt).toLocaleString("fr-FR") : "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-gray-500">
                        {r.expiresAt ? new Date(r.expiresAt).toLocaleString("fr-FR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-gray-600">
        Le matching est déclenché automatiquement à la création du projet (côté backend). Vous pouvez aussi
        relancer manuellement via l&apos;API{" "}
        <code className="text-gray-500">POST /api/admin/matching/trigger/:projectId</code> si besoin.
      </p>
    </div>
  );
}
