"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  FolderOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  AlertCircle,
  BarChart2,
  RefreshCw,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { bmpAuthHeaders } from "@/lib/api-user-headers";
import { readApiErrorMessage } from "@/lib/api-error";
import { KpiCard } from "@/components/layout/KpiCard";

const API_URL = getApiBaseUrl();

type Project = {
  _id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin_prevue: string;
  budget_estime: number;
  statut: string;
  avancement_global: number;
  clientId: string;
  createdAt?: string;
};

function StatusBadge({ statut }: { statut: string }) {
  if (statut === "Terminé")
    return <span className="bmp-badge bmp-badge-success">{statut}</span>;
  if (statut === "En cours")
    return <span className="bmp-badge bmp-badge-info">{statut}</span>;
  return <span className="bmp-badge bmp-badge-neutral">{statut}</span>;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const cls =
    pct >= 100
      ? "bmp-progress-fill-success"
      : pct >= 50
        ? "bmp-progress-fill"
        : "bmp-progress-fill";
  return (
    <div className="bmp-progress-track mt-2">
      <div
        className={`bmp-progress-fill ${cls}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ClientSpacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  const loadClientProjects = useCallback(async () => {
    const me = getStoredUser();
    if (!me || me.role !== "client") return;
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const uid = String(me._id ?? "");
      const res = await fetch(`${API_URL}/projects`, {
        cache: "no-store",
        headers: { ...bmpAuthHeaders(me), "x-user-id": uid },
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res, "Impossible de charger vos projets."));
      const data = (await res.json()) as Project[];
      setProjects(
        data
          .filter((p) => String(p.clientId) === uid)
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
      );
    } catch (e) {
      setProjectsError(e instanceof Error ? e.message : "Erreur de chargement.");
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "client") void loadClientProjects();
  }, [user, loadClientProjects]);

  const stats = useMemo(() => ({
    total: projects.length,
    enCours: projects.filter((p) => p.statut === "En cours").length,
    termines: projects.filter((p) => p.statut === "Terminé").length,
    budgetTotal: projects.reduce((s, p) => s + (p.budget_estime ?? 0), 0),
  }), [projects]);

  if (!loadingUser && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(245,158,11,0.12)" }}>
          <FolderOpen className="h-7 w-7 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Espace Client</h2>
          <p className="mt-1 text-sm text-gray-400">Connectez-vous pour accéder à vos projets.</p>
        </div>
        <button
          type="button"
          className="bmp-btn-primary mt-2"
          onClick={() => router.push("/login")}
        >
          Se connecter <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!loadingUser && user?.role !== "client") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Accès réservé aux clients</h2>
        <p className="text-sm text-gray-400">
          Votre rôle actuel est{" "}
          <span className="font-semibold text-amber-400">{user?.role}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="bmp-os-page">
      {/* ── Page Header ── */}
      <div className="bmp-os-animate flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="bmp-section-title mb-1">Client OS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Bonjour, {user?.nom?.split(" ")[0] ?? "client"} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Pilotez vos chantiers, suivez l&apos;avancement et gérez vos budgets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/espace/client/suivi" className="bmp-btn-secondary text-sm">
            <FolderOpen className="h-4 w-4" />
            Mes Projets
          </Link>
          <button
            type="button"
            className="bmp-btn-primary text-sm"
            onClick={() => router.push("/espace/client/nouveau-projet")}
          >
            <PlusCircle className="h-4 w-4" />
            Nouveau Projet
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="bmp-kpi-grid bmp-os-animate bmp-os-animate-delay-1">
        <KpiCard
          label="Total Projets"
          value={loadingProjects ? "—" : stats.total}
          icon={FolderOpen}
          variant="default"
          description="Tous statuts confondus"
        />
        <KpiCard
          label="En cours"
          value={loadingProjects ? "—" : stats.enCours}
          icon={TrendingUp}
          variant="info"
          description="Chantiers actifs"
        />
        <KpiCard
          label="Terminés"
          value={loadingProjects ? "—" : stats.termines}
          icon={CheckCircle2}
          variant="success"
          description="Projets livrés"
        />
        <KpiCard
          label="Budget Total"
          value={
            loadingProjects
              ? "—"
              : stats.budgetTotal >= 1000
                ? `${(stats.budgetTotal / 1000).toFixed(0)}K`
                : stats.budgetTotal.toString()
          }
          icon={Wallet}
          variant="amber"
          description="Estimé en TND"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="bmp-os-animate bmp-os-animate-delay-2 grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Projects Panel */}
        <div className="bmp-enterprise-panel">
          <div className="bmp-enterprise-panel-header">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Mes Projets</h2>
              {!loadingProjects && (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-amber-400"
                  style={{ background: "rgba(245,158,11,0.12)" }}
                >
                  {stats.total}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadClientProjects()}
                className="bmp-btn-ghost text-xs"
                title="Actualiser"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <Link
                href="/espace/client/suivi"
                className="bmp-btn-ghost text-xs"
              >
                Voir tout <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: "460px" }}>
            {loadingProjects ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bmp-skeleton h-24 rounded-xl" />
                ))}
              </div>
            ) : projectsError ? (
              <div className="p-5">
                <div
                  className="flex items-start gap-3 rounded-xl p-4 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.18)",
                  }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div className="flex-1 text-red-300">
                    <p>{projectsError}</p>
                    <button
                      type="button"
                      onClick={() => void loadClientProjects()}
                      className="mt-2 text-[11px] font-medium underline underline-offset-2"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-5">
                <div className="bmp-empty-state">
                  <FolderOpen className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">Aucun projet</p>
                    <p className="text-xs text-gray-500">
                      Créez votre premier dossier de chantier
                    </p>
                  </div>
                  <button
                    type="button"
                    className="bmp-btn-primary text-xs"
                    onClick={() => router.push("/espace/client/nouveau-projet")}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Nouveau Projet
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="bmp-data-row flex-col items-start gap-2"
                    onClick={() => router.push(`/espace/client/suivi/${project._id}`)}
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-white">
                          {project.titre}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Clock className="h-3 w-3" />
                          {project.date_debut
                            ? new Date(project.date_debut).toLocaleDateString("fr-FR")
                            : "—"}
                          {" → "}
                          {project.date_fin_prevue
                            ? new Date(project.date_fin_prevue).toLocaleDateString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge statut={project.statut} />
                        <span className="text-[11px] text-gray-500">
                          {(project.budget_estime ?? 0).toLocaleString("fr-FR")} TND
                        </span>
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Avancement</span>
                        <span className="font-semibold text-amber-400">
                          {project.avancement_global ?? 0}%
                        </span>
                      </div>
                      <ProgressBar value={project.avancement_global ?? 0} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Quick Actions */}
          <div className="bmp-enterprise-panel">
            <div className="bmp-enterprise-panel-header">
              <span className="text-sm font-semibold text-white">Actions rapides</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {[
                {
                  label: "Nouveau projet",
                  icon: PlusCircle,
                  href: "/espace/client/nouveau-projet",
                  color: "#fbbf24",
                  bg: "rgba(245,158,11,0.1)",
                },
                {
                  label: "Suivi & photos",
                  icon: BarChart2,
                  href: "/espace/client/suivi",
                  color: "#60a5fa",
                  bg: "rgba(59,130,246,0.1)",
                },
                {
                  label: "Marketplace",
                  icon: ShoppingBag,
                  href: "/gestion-marketplace",
                  color: "#34d399",
                  bg: "rgba(16,185,129,0.1)",
                },
                {
                  label: "Messages",
                  icon: ChevronRight,
                  href: "/messages",
                  color: "#a78bfa",
                  bg: "rgba(139,92,246,0.1)",
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-xl p-4 text-center text-xs font-medium transition-all duration-150 hover:scale-[1.02]"
                  style={{ background: action.bg, color: action.color }}
                >
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                  <span style={{ color: "#d1d5db" }}>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Marketplace Spotlight */}
          <div className="bmp-enterprise-panel">
            <div className="bmp-enterprise-panel-header">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Marketplace B2B</span>
              </div>
              <span className="bmp-badge bmp-badge-success text-[9px]">LIVE</span>
            </div>
            <div className="divide-y p-1" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {[
                { nom: "Ciment HP 50kg", prix: "32 TND", cat: "Matériaux" },
                { nom: "Carrelage 60×60 effet pierre", prix: "65 TND/m²", cat: "Revêtements" },
                { nom: "Fenêtre PVC double vitrage", prix: "450 TND", cat: "Menuiserie" },
              ].map((p) => (
                <div
                  key={p.nom}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(16,185,129,0.12)" }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-white">{p.nom}</p>
                    <p className="text-[11px] text-gray-500">{p.cat}</p>
                  </div>
                  <span className="shrink-0 text-[12px] font-bold text-emerald-400">{p.prix}</span>
                </div>
              ))}
            </div>
            <div className="p-3">
              <Link
                href="/gestion-marketplace"
                className="bmp-btn-secondary w-full justify-center text-xs"
              >
                Explorer la Marketplace
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
