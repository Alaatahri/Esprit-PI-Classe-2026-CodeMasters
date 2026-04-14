"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { SuiviTimeline } from "@/components/SuiviTimeline";
import { LoadingState } from "@/components/layout/LoadingState";
import { getApiBaseUrl } from "@/lib/api-base";
import { bmpAuthHeaders } from "@/lib/api-user-headers";
import { canAccessChantierModule } from "@/lib/roles";

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
  createdAt?: string;
};

type StatusFilter = "all" | "En cours" | "En attente" | "Terminé";
type SortMode = "newest" | "budget_desc" | "progress_desc";

function clampPct(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function statusPillClass(statut: string) {
  if (statut === "Terminé") return "bg-emerald-500/15 text-emerald-300";
  if (statut === "En cours") return "bg-blue-500/15 text-blue-300";
  return "bg-gray-500/15 text-gray-300";
}

export default function GestionChantierPage() {
  const [user, setUser] = useState<BMPUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const role = user?.role;
        const canAccess =
          role === "admin" || role === "artisan" || role === "ouvrier";
        if (!canAccess) {
          setProjects([]);
          return;
        }

        const endpoint =
          role === "admin"
            ? `${API_URL}/projects`
            : `${API_URL}/projects/artisan/${user?._id}`;

        const res = await fetch(endpoint, {
          cache: "no-store",
          headers: bmpAuthHeaders(user),
        });
        if (!res.ok) {
          throw new Error("Impossible de charger les projets en cours.");
        }
        const data = (await res.json()) as Project[];
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    if (!mounted) return;
    fetchProjects();
  }, [mounted, user]);

  const inProgress = useMemo(() => {
    return projects
      .filter((p) => p.statut === "En cours")
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
  }, [projects]);

  const existingProjects = useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
  }, [projects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const enCours = projects.filter((p) => p.statut === "En cours").length;
    const enAttente = projects.filter((p) => p.statut === "En attente").length;
    const termine = projects.filter((p) => p.statut === "Terminé").length;
    const avgProgress =
      total > 0
        ? Math.round(
            projects.reduce((sum, p) => sum + clampPct(p.avancement_global), 0) /
              total
          )
        : 0;
    return { total, enCours, enAttente, termine, avgProgress };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = normalizeText(query);
    const base = existingProjects.filter((p) => {
      const statusOk = statusFilter === "all" ? true : p.statut === statusFilter;
      if (!statusOk) return false;
      if (!q) return true;
      const hay = `${p.titre} ${p.description} ${p.statut}`;
      return normalizeText(hay).includes(q);
    });

    const sorted = base.slice().sort((a, b) => {
      if (sortMode === "budget_desc") return (b.budget_estime ?? 0) - (a.budget_estime ?? 0);
      if (sortMode === "progress_desc") return clampPct(b.avancement_global) - clampPct(a.avancement_global);
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return sorted;
  }, [existingProjects, query, sortMode, statusFilter]);

  const highlighted = useMemo(() => {
    // Si l’utilisateur n’a pas choisi de filtre, on met en avant les “En cours”
    if (statusFilter === "all" && inProgress.length > 0 && query.trim() === "") {
      return inProgress;
    }
    return filteredProjects;
  }, [filteredProjects, inProgress, query, statusFilter]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="bmp-app-vignette" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-4xl bmp-page">
        <Link
          href="/"
          className="mb-10 inline-flex min-h-[44px] items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-amber-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Accueil
        </Link>
        <div>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 sm:h-[4.5rem] sm:w-[4.5rem]">
            <Briefcase className="h-10 w-10 text-gray-900" />
          </div>
          <div className="text-center">
            <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Gestion de Chantier
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Vue d’ensemble de vos projets et de leur avancement.
            </p>
          </div>

          <div className="mt-10 space-y-8 sm:mt-12">
            {!mounted ? (
              <LoadingState message="Préparation de l’interface…" minHeight="md" />
            ) : !user ? (
              <div className="bmp-panel p-8 text-center">
                <p className="mb-2 font-semibold text-foreground">
                  Connectez-vous pour accéder à la gestion de chantier.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Réservé aux équipes terrain : administrateurs, artisans et
                  fabricants.
                </p>
              </div>
            ) : !canAccessChantierModule(user.role) ? (
              <div className="bmp-panel p-8 text-center">
                <p className="mb-2 font-semibold text-foreground">
                  Accès non autorisé.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Les administrateurs voient tous les projets ; artisans et
                  fabricants voient les dossiers qui leur sont associés.
                </p>
              </div>
            ) : (
              <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bmp-stat-tile">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Total projets
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Progression moyenne:{" "}
                  <span className="font-semibold text-amber-300">
                    {stats.avgProgress}%
                  </span>
                </p>
              </div>
              <div className="bmp-stat-tile">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  En cours
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-200">
                  {stats.enCours}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chantiers actifs
                </p>
              </div>
              <div className="bmp-stat-tile">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  En attente
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {stats.enAttente}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  À démarrer / valider
                </p>
              </div>
              <div className="bmp-stat-tile">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Terminés
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-200">
                  {stats.termine}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Projets clôturés
                </p>
              </div>
            </div>

            {/* Liste */}
            <div className="bmp-panel p-6 sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {inProgress.length > 0 && statusFilter === "all" && query.trim() === ""
                      ? "Projets en cours"
                      : "Projets existants"}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    Recherchez, filtrez et triez pour retrouver rapidement un projet.
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Live
                </span>
              </div>

              {/* Controls */}
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un projet (titre, description, statut)..."
                    className="w-full min-h-[48px] rounded-2xl border border-border/60 bg-card/30 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "En cours", "En attente", "Terminé"] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`min-h-[40px] rounded-2xl border px-3 py-2 text-xs font-medium transition-[background-color,border-color,color] duration-200 ${
                        statusFilter === s
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                          : "border-border/50 bg-card/20 text-muted-foreground hover:bg-card/35 hover:text-foreground"
                      }`}
                    >
                      {s === "all" ? "Tous" : s}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex min-h-[40px] items-center gap-2 rounded-2xl border border-border/50 bg-card/25 px-3 py-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="bg-transparent text-xs text-foreground focus:outline-none"
                    >
                      <option value="newest">Plus récents</option>
                      <option value="budget_desc">Budget ↓</option>
                      <option value="progress_desc">Avancement ↓</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
              <LoadingState message="Chargement des projets…" minHeight="sm" />
            ) : error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : existingProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun projet trouvé pour le moment.
              </p>
            ) : highlighted.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card/20 px-5 py-8 text-sm text-muted-foreground">
                Aucun résultat pour{" "}
                <span className="font-semibold text-amber-200">
                  {query.trim() || (statusFilter === "all" ? "vos filtres" : statusFilter)}
                </span>
                .
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {highlighted.map((p) => (
                  <div
                    key={p._id}
                    className="group space-y-3 rounded-2xl border border-border/55 bg-card/25 p-4 shadow-sm transition-[border-color,background-color,transform,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-border/80 motion-safe:hover:bg-card/35 motion-safe:hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="line-clamp-1 font-semibold text-foreground">
                          {p.titre}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${statusPillClass(p.statut)}`}
                      >
                        {p.statut}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {p.date_debut
                          ? new Date(p.date_debut).toLocaleDateString("fr-FR")
                          : "-"}{" "}
                        →{" "}
                        {p.date_fin_prevue
                          ? new Date(p.date_fin_prevue).toLocaleDateString(
                              "fr-FR"
                            )
                          : "-"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        {p.avancement_global ?? 0}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-border/40">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${clampPct(p.avancement_global)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Budget estimé</span>
                      <span className="font-semibold text-foreground">
                        {(p.budget_estime ?? 0).toLocaleString("fr-FR")} TND
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <Link
                        href={`/gestion-chantier/${p._id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/20 transition"
                      >
                        Envoyer une photo du chantier
                      </Link>
                      <SuiviTimeline projectId={p._id} apiBaseUrl={API_URL} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
