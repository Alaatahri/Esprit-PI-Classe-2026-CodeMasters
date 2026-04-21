"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  FolderOpen,
  Inbox,
  Star,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2,
  UserCircle,
  ChevronRight,
  Briefcase,
  BarChart2,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { KpiCard } from "@/components/layout/KpiCard";
import { refId } from "@/lib/project-refs";
import { readJsonSafe } from "@/lib/read-json-safe";

const API_URL = getApiBaseUrl();

type Artisan = {
  _id: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
  competences?: string[];
  ratingMoyen?: number;
  nbProjets?: number;
};

type ArtisanApplication = {
  _id: string;
  artisan?: { _id: string; nom: string; ratingMoyen?: number; competences?: string[] };
  artisanId?: string | { _id?: string };
  statut: "en_attente" | "acceptee" | "refusee";
};

type ExpertProject = {
  _id: string;
  titre: string;
  description: string;
  budget_estime: number;
  statut: string;
  clientNom?: string;
  date_debut?: string;
  date_fin_prevue?: string;
  avancement_global?: number;
  requestStatus?: string;
  applications?: ArtisanApplication[];
};

function projectAllowsRecruitment(p: ExpertProject): boolean {
  if (p.statut === "Terminé") return false;
  const rs = p.requestStatus;
  if (rs && ["contract_pending_signatures","active","completed","cancelled","rejected"].includes(rs)) return false;
  return true;
}

function StatusBadge({ statut }: { statut: string }) {
  if (statut === "Terminé") return <span className="bmp-badge bmp-badge-success">{statut}</span>;
  if (statut === "En cours") return <span className="bmp-badge bmp-badge-info">{statut}</span>;
  if (statut === "Ouvert") return <span className="bmp-badge bmp-badge-amber">{statut}</span>;
  return <span className="bmp-badge bmp-badge-neutral">{statut}</span>;
}

export default function ExpertSpacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loadingArtisans, setLoadingArtisans] = useState(false);
  const [projects, setProjects] = useState<ExpertProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "expert") return;

    const fetchArtisans = async () => {
      setLoadingArtisans(true);
      try {
        const res = await fetch(`${API_URL}/users/public/workers`);
        if (res.ok) {
          const data = (await res.json()) as Artisan[];
          setArtisans(data.filter((u) => u.role === "artisan"));
        }
      } catch { /* ignore */ } finally { setLoadingArtisans(false); }
    };

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`${API_URL}/projects/expert/${encodeURIComponent(user._id)}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as ExpertProject[];
          setProjects(data.filter((p) => ["En attente","En cours","Terminé","Ouvert"].includes(p.statut)));
        } else {
          setError("Impossible de charger vos projets.");
        }
      } catch { setError("Erreur réseau."); } finally { setLoadingProjects(false); }
    };

    fetchArtisans();
    fetchProjects();
  }, [user]);

  const handleApplicationAction = async (applicationId: string, action: "accept" | "decline") => {
    const u = getStoredUser();
    if (!u || u.role !== "expert") return;
    setActionError(null);
    setActionLoadingId(applicationId);
    try {
      const endpoint = action === "accept"
        ? `${API_URL}/applications/${applicationId}/accept`
        : `${API_URL}/applications/${applicationId}/decline`;
      const res = await fetch(endpoint, { method: "POST", headers: { "x-user-id": u._id } });
      const data = await readJsonSafe<{ message?: string | string[] }>(res);
      if (!res.ok) {
        const raw = data?.message;
        throw new Error(Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : "Erreur de mise à jour.");
      }
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          applications: project.applications?.map((app) =>
            app._id === applicationId ? { ...app, statut: action === "accept" ? "acceptee" : "refusee" } : app
          ) ?? [],
        }))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur.");
    } finally { setActionLoadingId(null); }
  };

  const pendingCount = useMemo(() =>
    projects.reduce((acc, p) => acc + (p.applications ?? []).filter((a) => a.statut === "en_attente").length, 0),
    [projects]
  );

  const resolveArtisanForApp = (app: ArtisanApplication) => {
    if (app.artisan) return app.artisan;
    const rawId = typeof app.artisanId === "string" ? app.artisanId : app.artisanId?._id;
    if (!rawId) return undefined;
    return artisans.find((a) => a._id === rawId);
  };

  if (!loadingUser && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Users className="h-10 w-10 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Espace Expert</h2>
        <p className="text-sm text-gray-400">Connectez-vous pour gérer vos projets.</p>
        <button type="button" className="bmp-btn-primary mt-2" onClick={() => router.push("/login")}>
          Se connecter <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!loadingUser && user?.role !== "expert") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Accès réservé aux experts</h2>
        <p className="text-sm text-gray-400">Rôle actuel : <span className="text-amber-400">{user?.role}</span></p>
      </div>
    );
  }

  return (
    <div className="bmp-os-page">
      {/* ── Page Header ── */}
      <div className="bmp-os-animate flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="bmp-section-title mb-1">Expert OS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Intelligence Projet</h1>
          <p className="mt-1 text-sm text-gray-400">
            Gérez les artisans, les candidatures et coordonnez vos chantiers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/expert/nouveaux-projets" className="bmp-btn-secondary text-sm">
            <Inbox className="h-4 w-4" /> Invitations
          </Link>
          <Link href="/expert/tous-les-projets" className="bmp-btn-primary text-sm">
            <FolderOpen className="h-4 w-4" /> Tous les projets
          </Link>
        </div>
      </div>

      {/* ── Errors ── */}
      {(error || actionError) && (
        <div className="bmp-os-animate rounded-xl p-4 text-sm text-red-300"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
          {error || actionError}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="bmp-kpi-grid bmp-os-animate bmp-os-animate-delay-1">
        <KpiCard label="Mes Projets" value={loadingProjects ? "—" : projects.length} icon={FolderOpen} variant="info" />
        <KpiCard label="Candidatures en attente" value={loadingProjects ? "—" : pendingCount} icon={Inbox} variant="warning" />
        <KpiCard label="Artisans disponibles" value={loadingArtisans ? "—" : artisans.length} icon={Users} variant="amber" />
        <KpiCard label="Taux d&apos;occupation" value={projects.length > 0 ? `${Math.round((projects.filter(p=>p.statut==="En cours").length/projects.length)*100)}%` : "0%"} icon={BarChart2} variant="success" />
      </div>

      {/* ── Main Grid ── */}
      <div className="bmp-os-animate bmp-os-animate-delay-2 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Projects & Applications */}
        <div className="bmp-enterprise-panel">
          <div className="bmp-enterprise-panel-header">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Projets & Candidatures</h2>
            </div>
            {loadingProjects && <Loader2 className="h-4 w-4 animate-spin text-amber-400/80" />}
          </div>

          <div className="divide-y overflow-y-auto scrollbar-bmp" style={{ maxHeight: "560px", borderColor: "rgba(255,255,255,0.04)" }}>
            {loadingProjects ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => <div key={i} className="bmp-skeleton h-32 rounded-xl" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="p-5">
                <div className="bmp-empty-state">
                  <FolderOpen className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">Aucun projet</p>
                    <p className="text-xs text-gray-500">Les dossiers clients apparaîtront ici</p>
                  </div>
                </div>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project._id} className="p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-white">{project.titre}</p>
                        <StatusBadge statut={project.statut} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {project.clientNom ? `Client : ${project.clientNom}` : "Projet client"}
                        {" · "}
                        {(project.budget_estime ?? 0).toLocaleString("fr-FR")} TND
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/expert/projects/${encodeURIComponent(project._id)}?from=projets`}
                      className="bmp-btn-primary text-[11px] py-1.5 px-3">
                      Dossier
                    </Link>
                    <Link href={`/expert/projects/${encodeURIComponent(project._id)}/photos?from=projets`}
                      className="bmp-btn-secondary text-[11px] py-1.5 px-3">
                      Galerie
                    </Link>
                    <Link href={`/expert/projects/${encodeURIComponent(project._id)}/suivi-photo?from=projets`}
                      className="bmp-btn-secondary text-[11px] py-1.5 px-3">
                      Suivi photo
                    </Link>
                  </div>

                  {/* Applications */}
                  {(project.applications ?? []).length > 0 && (
                    <div className="mt-2 rounded-lg p-3 space-y-2"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="bmp-section-title">
                        Candidatures · {(project.applications ?? []).length}
                      </p>
                      {(project.applications ?? []).map((app) => {
                        const resolved = resolveArtisanForApp(app);
                        const name = resolved?.nom ?? "Artisan";
                        const rating = resolved?.ratingMoyen;
                        const profileId = typeof app.artisan?._id === "string" ? app.artisan._id : refId(app.artisanId);
                        return (
                          <div key={app._id} className="flex items-center gap-3 rounded-lg p-2.5"
                            style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                              style={{ background: "rgba(245,158,11,0.15)" }}>
                              <span className="text-[10px] font-bold text-amber-400">
                                {name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-white">{name}</p>
                              {rating && (
                                <p className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {rating.toFixed(1)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {app.statut === "en_attente" && (
                                <span className="bmp-badge bmp-badge-warning text-[9px]">En attente</span>
                              )}
                              {app.statut === "acceptee" && (
                                <span className="bmp-badge bmp-badge-success text-[9px]">Acceptée</span>
                              )}
                              {app.statut === "refusee" && (
                                <span className="bmp-badge bmp-badge-danger text-[9px]">Refusée</span>
                              )}
                              {profileId && (
                                <Link href={`/profil/${encodeURIComponent(profileId)}`}
                                  className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:text-sky-400"
                                  style={{ background: "rgba(59,130,246,0.1)" }}>
                                  <UserCircle className="h-3.5 w-3.5" />
                                </Link>
                              )}
                              {app.statut === "en_attente" && projectAllowsRecruitment(project) && (
                                <>
                                  <button type="button" disabled={actionLoadingId === app._id}
                                    onClick={() => handleApplicationAction(app._id, "accept")}
                                    className="flex h-6 items-center gap-1 rounded px-2 text-[10px] font-bold text-gray-900 disabled:opacity-50"
                                    style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}>
                                    {actionLoadingId === app._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                    OK
                                  </button>
                                  <button type="button" disabled={actionLoadingId === app._id}
                                    onClick={() => handleApplicationAction(app._id, "decline")}
                                    className="flex h-6 items-center gap-1 rounded px-2 text-[10px] font-medium disabled:opacity-50"
                                    style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <XCircle className="h-3 w-3" /> Non
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Artisan Directory */}
        <div className="bmp-enterprise-panel">
          <div className="bmp-enterprise-panel-header">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Artisans</h2>
              {!loadingArtisans && (
                <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-amber-400"
                  style={{ background: "rgba(245,158,11,0.12)" }}>
                  {artisans.length}
                </span>
              )}
            </div>
            {loadingArtisans && <Loader2 className="h-4 w-4 animate-spin text-amber-400/60" />}
          </div>

          <div className="divide-y overflow-y-auto scrollbar-bmp" style={{ maxHeight: "500px", borderColor: "rgba(255,255,255,0.04)" }}>
            {loadingArtisans ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="bmp-skeleton h-20 rounded-xl" />)}
              </div>
            ) : artisans.length === 0 ? (
              <div className="p-5">
                <div className="bmp-empty-state">
                  <Users className="h-7 w-7 text-gray-600" />
                  <p className="text-xs text-gray-500">Aucun artisan inscrit</p>
                </div>
              </div>
            ) : (
              artisans.map((artisan) => (
                <div key={artisan._id} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(245,158,11,0.12)" }}>
                    <span className="text-[11px] font-bold text-amber-400">
                      {artisan.nom.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">{artisan.nom}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {artisan.competences?.join(", ") ?? "Artisan"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-gray-300">{artisan.ratingMoyen?.toFixed(1) ?? "—"}</span>
                    </div>
                    <Link href={`/messages/${artisan._id}`}
                      className="text-[10px] font-medium text-sky-400 hover:underline">
                      Message
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
