"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  Hammer,
  Clock,
  CheckCircle2,
  PlusCircle,
  MessageCircle,
  Camera,
  Loader2,
  BadgeCheck,
  ArrowRight,
  AlertCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { bmpAuthHeaders } from "@/lib/api-user-headers";
import { KpiCard } from "@/components/layout/KpiCard";
import { refId } from "@/lib/project-refs";
import { readJsonSafe } from "@/lib/read-json-safe";

const API_URL = getApiBaseUrl();

type OpenProject = {
  _id: string;
  titre: string;
  description: string;
  budget_estime: number;
  date_debut?: string;
  date_fin_prevue?: string;
  clientNom?: string;
  statut: string;
};

type ArtisanApplication = {
  _id: string;
  projet: { _id: string; titre: string };
  statut: "en_attente" | "acceptee" | "refusee";
};

type MemberProject = {
  _id: string;
  titre: string;
  description: string;
  budget_estime: number;
  avancement_global?: number;
  clientNom?: string;
  statut: string;
  clientId?: unknown;
  expertId?: unknown;
};

function ApplicationBadge({ statut }: { statut: string }) {
  if (statut === "acceptee") return <span className="bmp-badge bmp-badge-success">Acceptée</span>;
  if (statut === "refusee") return <span className="bmp-badge bmp-badge-danger">Refusée</span>;
  return <span className="bmp-badge bmp-badge-warning">En attente</span>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="bmp-progress-track mt-2">
      <div className="bmp-progress-fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function ArtisanSpacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [applications, setApplications] = useState<ArtisanApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [memberProjects, setMemberProjects] = useState<MemberProject[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "artisan") return;

    const h = { "x-user-id": user._id };

    const fetchOpen = async () => {
      setLoadingOpen(true);
      try {
        const res = await fetch(`${API_URL}/projects`, { headers: bmpAuthHeaders(user) });
        const data = await readJsonSafe<unknown[]>(res);
        if (res.ok && Array.isArray(data)) {
          setOpenProjects((data as OpenProject[]).filter((p) => p.statut === "En attente"));
        }
      } catch { /* ignore */ } finally { setLoadingOpen(false); }
    };

    const fetchApps = async () => {
      setLoadingApps(true);
      try {
        const res = await fetch(`${API_URL}/applications/me?artisanId=${encodeURIComponent(user._id)}`, { headers: h });
        const data = await readJsonSafe<unknown[]>(res);
        if (res.ok && Array.isArray(data)) setApplications(data as ArtisanApplication[]);
      } catch { /* ignore */ } finally { setLoadingApps(false); }
    };

    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch(`${API_URL}/projects/mine-as-artisan?artisanId=${encodeURIComponent(user._id)}`, { headers: h });
        const data = await readJsonSafe<unknown[]>(res);
        if (res.ok && Array.isArray(data)) setMemberProjects(data as MemberProject[]);
      } catch { /* ignore */ } finally { setLoadingMembers(false); }
    };

    fetchOpen();
    fetchApps();
    fetchMembers();
  }, [user]);

  const handleApply = async (projectId: string) => {
    if (!user) return;
    setError(null);
    setActionLoadingId(projectId);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user._id },
        body: JSON.stringify({ artisanId: user._id }),
      });
      const body = await readJsonSafe<Record<string, unknown>>(res);
      if (!res.ok) {
        const m = body?.message;
        throw new Error(Array.isArray(m) ? m.join(" ") : typeof m === "string" ? m : "Impossible de postuler.");
      }
      if (body?._id) {
        setApplications((prev) => [body as unknown as ArtisanApplication, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally { setActionLoadingId(null); }
  };

  const alreadyApplied = (projectId: string) =>
    applications.some((a) => a.projet?._id === projectId || a.projet === projectId as unknown);

  if (!loadingUser && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Briefcase className="h-10 w-10 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Espace Artisan</h2>
        <p className="text-sm text-gray-400">Connectez-vous pour voir les missions disponibles.</p>
        <button type="button" className="bmp-btn-primary mt-2" onClick={() => router.push("/login")}>
          Se connecter <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!loadingUser && user?.role !== "artisan") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Accès réservé aux artisans</h2>
        <p className="text-sm text-gray-400">Rôle actuel : <span className="text-amber-400">{user?.role}</span></p>
      </div>
    );
  }

  return (
    <div className="bmp-os-page">
      {/* ── Page Header ── */}
      <div className="bmp-os-animate flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="bmp-section-title mb-1">Artisan OS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Missions & Chantiers
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Postulez, suivez vos missions et gérez vos chantiers au quotidien.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/espace/artisan/profil" className="bmp-btn-secondary text-sm">
            <BadgeCheck className="h-4 w-4" /> Mon Profil
          </Link>
          <Link href="/gestion-chantier" className="bmp-btn-primary text-sm">
            <Hammer className="h-4 w-4" /> Gestion Chantier
          </Link>
        </div>
      </div>

      {error && (
        <div className="bmp-os-animate rounded-xl p-4 text-sm text-red-300"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
          {error}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="bmp-kpi-grid bmp-os-animate bmp-os-animate-delay-1">
        <KpiCard label="Missions disponibles" value={loadingOpen ? "—" : openProjects.length} icon={Briefcase} variant="info" description="Projets ouverts" />
        <KpiCard label="Mes candidatures" value={loadingApps ? "—" : applications.length} icon={ClipboardList} variant="amber" description="Total déposées" />
        <KpiCard label="Projets actifs" value={loadingMembers ? "—" : memberProjects.length} icon={Hammer} variant="success" description="Dont je suis membre" />
        <KpiCard
          label="Acceptations"
          value={loadingApps ? "—" : applications.filter(a => a.statut === "acceptee").length}
          icon={CheckCircle2}
          variant="success"
          description="Candidatures validées"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="bmp-os-animate bmp-os-animate-delay-2 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Available Jobs */}
        <div className="bmp-enterprise-panel">
          <div className="bmp-enterprise-panel-header">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Missions disponibles</h2>
              {!loadingOpen && (
                <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-amber-400"
                  style={{ background: "rgba(245,158,11,0.12)" }}>
                  {openProjects.length}
                </span>
              )}
            </div>
            {loadingOpen && <Loader2 className="h-4 w-4 animate-spin text-amber-400/80" />}
          </div>

          <div className="divide-y overflow-y-auto scrollbar-bmp" style={{ maxHeight: "540px", borderColor: "rgba(255,255,255,0.04)" }}>
            {loadingOpen ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => <div key={i} className="bmp-skeleton h-28 rounded-xl" />)}
              </div>
            ) : openProjects.length === 0 ? (
              <div className="p-5">
                <div className="bmp-empty-state">
                  <Briefcase className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">Aucune mission disponible</p>
                    <p className="text-xs text-gray-500">Revenez bientôt pour de nouvelles opportunités</p>
                  </div>
                </div>
              </div>
            ) : (
              openProjects.map((project) => {
                const applied = alreadyApplied(project._id);
                return (
                  <div key={project._id} className="p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-white leading-snug">{project.titre}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {project.clientNom ? `Client : ${project.clientNom}` : "Client BMP.tn"}
                        </p>
                      </div>
                      <span className="bmp-badge bmp-badge-info shrink-0">{project.statut}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-200">
                        {(project.budget_estime ?? 0).toLocaleString("fr-FR")} TND
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.date_debut ? new Date(project.date_debut).toLocaleDateString("fr-FR") : "—"}
                        {" → "}
                        {project.date_fin_prevue ? new Date(project.date_fin_prevue).toLocaleDateString("fr-FR") : "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={applied || actionLoadingId === project._id}
                      onClick={() => !applied && handleApply(project._id)}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                        applied
                          ? "text-gray-500 cursor-not-allowed"
                          : "bmp-btn-primary"
                      }`}
                      style={applied ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" } : {}}
                    >
                      {actionLoadingId === project._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : applied ? (
                        <><CheckCircle2 className="h-4 w-4" /> Candidature déposée</>
                      ) : (
                        <><PlusCircle className="h-4 w-4" /> Postuler à cette mission</>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Applications + Active projects */}
        <div className="flex flex-col gap-5">
          {/* My Applications */}
          <div className="bmp-enterprise-panel">
            <div className="bmp-enterprise-panel-header">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Mes candidatures</h2>
              </div>
              {loadingApps && <Loader2 className="h-4 w-4 animate-spin text-amber-400/60" />}
            </div>
            <div className="divide-y overflow-y-auto" style={{ maxHeight: "220px", borderColor: "rgba(255,255,255,0.04)" }}>
              {loadingApps ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => <div key={i} className="bmp-skeleton h-10 rounded-lg" />)}
                </div>
              ) : applications.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  Aucune candidature. Postulez aux missions à gauche.
                </div>
              ) : (
                applications.slice(0, 8).map((app) => (
                  <div key={app._id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="text-[12px] font-medium text-white truncate">
                      {app.projet?.titre ?? "Projet"}
                    </p>
                    <ApplicationBadge statut={app.statut} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Projects */}
          <div className="bmp-enterprise-panel flex-1">
            <div className="bmp-enterprise-panel-header">
              <div className="flex items-center gap-2">
                <Hammer className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Projets actifs</h2>
              </div>
              {loadingMembers && <Loader2 className="h-4 w-4 animate-spin text-emerald-400/60" />}
            </div>
            <div className="divide-y overflow-y-auto scrollbar-bmp" style={{ maxHeight: "320px", borderColor: "rgba(255,255,255,0.04)" }}>
              {loadingMembers ? (
                <div className="space-y-3 p-4">
                  {[1, 2].map((i) => <div key={i} className="bmp-skeleton h-24 rounded-xl" />)}
                </div>
              ) : memberProjects.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  Pas encore de projet. Une fois accepté, les chantiers apparaîtront ici.
                </div>
              ) : (
                memberProjects.map((project) => {
                  const clientOid = refId(project.clientId);
                  const expertOid = refId(project.expertId);
                  return (
                    <div key={project._id} className="p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-white truncate">{project.titre}</p>
                        {project.statut === "En cours"
                          ? <span className="bmp-badge bmp-badge-info">{project.statut}</span>
                          : <span className="bmp-badge bmp-badge-success">{project.statut}</span>}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Avancement : <span className="font-semibold text-amber-400">{project.avancement_global ?? 0}%</span>
                      </div>
                      <ProgressBar value={project.avancement_global ?? 0} />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {clientOid && (
                          <Link href={`/messages/${clientOid}`}
                            className="bmp-btn-secondary text-[10px] py-1 px-2.5 gap-1">
                            <MessageCircle className="h-3 w-3" /> Client
                          </Link>
                        )}
                        {expertOid && (
                          <Link href={`/messages/${expertOid}`}
                            className="bmp-btn-secondary text-[10px] py-1 px-2.5 gap-1">
                            <MessageCircle className="h-3 w-3" /> Expert
                          </Link>
                        )}
                        <Link href={`/gestion-chantier/${encodeURIComponent(project._id)}`}
                          className="bmp-btn-secondary text-[10px] py-1 px-2.5 gap-1">
                          <Camera className="h-3 w-3" /> Photos
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
