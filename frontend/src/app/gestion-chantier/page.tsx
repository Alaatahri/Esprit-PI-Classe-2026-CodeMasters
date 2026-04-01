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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

        const res = await fetch(endpoint, { cache: "no-store" });
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-950/95 via-blue-950/30 to-gray-950/95" />
      <div className="relative z-10 container mx-auto px-4 py-12 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-300 mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Accueil
        </Link>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center mx-auto mb-5">
            <Briefcase className="w-10 h-10 text-gray-900" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Gestion de Chantier
            </h1>
            <p className="text-gray-300/80 text-sm sm:text-base max-w-2xl mx-auto">
              Vue d’ensemble de vos projets et de leur avancement.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 space-y-6">
            {!mounted ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-10 h-10 rounded-xl border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
              </div>
            ) : !user ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center">
                <p className="text-white font-semibold mb-2">
                  Connectez-vous pour accéder à la gestion de chantier.
                </p>
                <p className="text-sm text-gray-300/70">
                  Cette page est réservée aux administrateurs et ouvriers.
                </p>
              </div>
            ) : user.role !== "admin" &&
              user.role !== "artisan" &&
              user.role !== "ouvrier" ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center">
                <p className="text-white font-semibold mb-2">
                  Accès non autorisé.
                </p>
                <p className="text-sm text-gray-300/70">
                  Seuls les administrateurs peuvent voir tous les projets. Les ouvriers voient uniquement leurs projets affectés.
                </p>
              </div>
            ) : (
              <>
            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.18em]">
                  Total projets
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{stats.total}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Progression moyenne:{" "}
                  <span className="text-amber-300 font-semibold">
                    {stats.avgProgress}%
                  </span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.18em]">
                  En cours
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-200">
                  {stats.enCours}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Chantiers actifs
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.18em]">
                  En attente
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-100">
                  {stats.enAttente}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  À démarrer / valider
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.18em]">
                  Terminés
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-200">
                  {stats.termine}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Projets clôturés
                </p>
              </div>
            </div>

            {/* Liste */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {inProgress.length > 0 && statusFilter === "all" && query.trim() === ""
                      ? "Projets en cours"
                      : "Projets existants"}
                  </h2>
                  <p className="text-xs text-gray-300/70 mt-1">
                    Recherchez, filtrez et triez pour retrouver rapidement un projet.
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.18em]">
                  Live
                </span>
              </div>

              {/* Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un projet (titre, description, statut)..."
                    className="w-full rounded-2xl border border-white/10 bg-black/35 pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "En cours", "En attente", "Terminé"] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-2 rounded-2xl text-xs border transition ${
                        statusFilter === s
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                          : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      {s === "all" ? "Tous" : s}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-300" />
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="bg-transparent text-xs text-gray-200 focus:outline-none"
                    >
                      <option value="newest">Plus récents</option>
                      <option value="budget_desc">Budget ↓</option>
                      <option value="progress_desc">Avancement ↓</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-10 h-10 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : existingProjects.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucun projet trouvé pour le moment.
              </p>
            ) : highlighted.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-gray-300">
                Aucun résultat pour{" "}
                <span className="text-amber-200 font-semibold">
                  {query.trim() || (statusFilter === "all" ? "vos filtres" : statusFilter)}
                </span>
                .
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {highlighted.map((p) => (
                  <div
                    key={p._id}
                    className="group rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3 transition hover:border-white/20 hover:bg-black/25 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white line-clamp-1">
                          {p.titre}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${statusPillClass(p.statut)}`}
                      >
                        {p.statut}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-300">
                      <span className="inline-flex items-center gap-1 text-gray-400">
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

                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${clampPct(p.avancement_global)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Budget estimé</span>
                      <span className="text-white font-semibold">
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
