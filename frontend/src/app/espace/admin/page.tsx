"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  RefreshCw,
  Shield,
  Users,
  FolderOpen,
  Zap,
  BarChart2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Activity,
} from "lucide-react";
import { getStoredUser, normalizeRole, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { KpiCard } from "@/components/layout/KpiCard";
import { useRouter } from "next/navigation";

const API_URL = getApiBaseUrl();

type PopulatedUser = { _id?: string; prenom?: string; nom?: string; email?: string; competences?: string[]; rating?: number };
type PopulatedProject = { _id?: string; titre?: string; nom?: string; description?: string };

type MatchingRequestRow = {
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

function refLabel(ref: PopulatedUser | PopulatedProject | string | undefined, fallback: string): string {
  if (!ref) return fallback;
  if (typeof ref === "string") return ref;
  if ("titre" in ref || "nom" in ref) {
    const p = ref as PopulatedProject;
    return p.titre || p.nom || p.description?.slice(0, 40) || fallback;
  }
  const u = ref as PopulatedUser;
  return [u.prenom, u.nom].filter(Boolean).join(" ").trim() || u.email || fallback;
}

function StatusBadge({ status, isExpired }: { status: string; isExpired?: boolean }) {
  if (isExpired) return <span className="bmp-badge bmp-badge-danger">Expiré</span>;
  if (status === "sent") return <span className="bmp-badge bmp-badge-info">Envoyé</span>;
  if (status === "accepted") return <span className="bmp-badge bmp-badge-success">Accepté</span>;
  if (status === "declined") return <span className="bmp-badge bmp-badge-danger">Décliné</span>;
  return <span className="bmp-badge bmp-badge-neutral">{status}</span>;
}

export default function AdminSpacePage() {
  const router = useRouter();
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
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = (await res.json()) as MatchingRequestRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur de chargement.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = {
    total: rows.length,
    sent: rows.filter((r) => r.status === "sent" && !r.isExpired).length,
    accepted: rows.filter((r) => r.status === "accepted").length,
    expired: rows.filter((r) => r.isExpired).length,
  };

  if (!user && !loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Shield className="h-10 w-10 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Administration BMP.tn</h2>
        <p className="text-sm text-gray-400">Accès réservé aux administrateurs.</p>
        <button type="button" className="bmp-btn-primary mt-2" onClick={() => router.push("/login")}>
          Se connecter <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (user && normalizeRole(user.role) !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Accès non autorisé</h2>
        <p className="text-sm text-gray-400">
          Rôle actuel : <span className="text-amber-400">{user.role}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bmp-os-page">
      {/* ── Header ── */}
      <div className="bmp-os-animate flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="bmp-section-title mb-1">Admin OS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tableau de bord système
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Supervision complète · Matching expert · Gestion utilisateurs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/expert/tous-les-projets" className="bmp-btn-secondary text-sm">
            <FolderOpen className="h-4 w-4" /> Tous les projets
          </Link>
          <button type="button" className="bmp-btn-primary text-sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="bmp-kpi-grid bmp-os-animate bmp-os-animate-delay-1">
        <KpiCard label="Invitations totales" value={loading ? "—" : stats.total} icon={Zap} variant="amber" />
        <KpiCard label="En attente" value={loading ? "—" : stats.sent} icon={Clock} variant="info" description="Invitations envoyées" />
        <KpiCard label="Acceptées" value={loading ? "—" : stats.accepted} icon={CheckCircle2} variant="success" />
        <KpiCard label="Expirées" value={loading ? "—" : stats.expired} icon={XCircle} variant="danger" />
      </div>

      {err && (
        <div className="bmp-os-animate rounded-xl p-4 text-sm text-red-300"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <p>{err}</p>
          <button type="button" className="mt-2 text-[11px] font-medium underline" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="bmp-os-animate bmp-os-animate-delay-2 grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Matching requests table */}
        <div className="bmp-enterprise-panel">
          <div className="bmp-enterprise-panel-header">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Matching Expert-Projet</h2>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-amber-400/80" />}
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="bmp-skeleton h-16 rounded-xl" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5">
              <div className="bmp-empty-state">
                <Activity className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Aucune invitation de matching</p>
                  <p className="text-xs text-gray-500">Le système générera des invitations automatiquement</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Projet", "Expert", "Score", "Compétences", "Envoyé", "Statut"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-[0.1em] text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {rows.map((row) => (
                    <tr key={row._id} className="transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white line-clamp-1">
                          {refLabel(row.projectId, "Projet")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {refLabel(row.expertId, "Expert")}
                      </td>
                      <td className="px-4 py-3">
                        {typeof row.matchScore === "number" ? (
                          <div className="flex items-center gap-2">
                            <div className="bmp-progress-track w-16">
                              <div
                                className="bmp-progress-fill"
                                style={{ width: `${Math.round(row.matchScore * 100)}%` }}
                              />
                            </div>
                            <span className="text-amber-400 font-semibold">
                              {Math.round(row.matchScore * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(row.requiredCompetences ?? []).slice(0, 2).map((c) => (
                            <span key={c} className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                              {c}
                            </span>
                          ))}
                          {(row.requiredCompetences ?? []).length > 2 && (
                            <span className="text-gray-500">+{(row.requiredCompetences?.length ?? 0) - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {row.sentAt ? new Date(row.sentAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} isExpired={row.isExpired} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          {/* System status */}
          <div className="bmp-enterprise-panel">
            <div className="bmp-enterprise-panel-header">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">État du système</h2>
              </div>
              <span className="bmp-badge bmp-badge-success text-[9px]">LIVE</span>
            </div>
            <div className="divide-y p-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {[
                { label: "API Backend", status: "Opérationnel", ok: true },
                { label: "Base de données", status: "Connectée", ok: true },
                { label: "Matching Engine", status: "Actif", ok: true },
                { label: "Messagerie", status: "Opérationnelle", ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3">
                  <p className="text-[12px] text-gray-300">{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${item.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className={`text-[11px] font-medium ${item.ok ? "text-emerald-400" : "text-red-400"}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick nav */}
          <div className="bmp-enterprise-panel">
            <div className="bmp-enterprise-panel-header">
              <span className="text-sm font-semibold text-white">Accès rapide</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                { label: "Utilisateurs", icon: Users, href: "/espace/admin", color: "#60a5fa" },
                { label: "Projets", icon: FolderOpen, href: "/expert/tous-les-projets", color: "#fbbf24" },
                { label: "Analytics", icon: BarChart2, href: "/espace/admin", color: "#34d399" },
                { label: "Messages", icon: Zap, href: "/messages", color: "#a78bfa" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  <span className="text-[11px] font-medium text-gray-300">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
