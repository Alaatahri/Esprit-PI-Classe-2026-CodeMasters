"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import {
  ClipboardList,
  Briefcase,
  Clock,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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
  projet: {
    _id: string;
    titre: string;
  };
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
};

export default function ArtisanSpacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [loadingOpenProjects, setLoadingOpenProjects] = useState(false);

  const [applications, setApplications] = useState<ArtisanApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const [memberProjects, setMemberProjects] = useState<MemberProject[]>([]);
  const [loadingMemberProjects, setLoadingMemberProjects] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "artisan") return;

    const fetchOpenProjects = async () => {
      setLoadingOpenProjects(true);
      try {
        const res = await fetch(`${API_URL}/projects`);
        if (!res.ok) return;
        const data = (await res.json()) as OpenProject[];
        // Montrer les projets en attente (non démarrés) comme "disponibles"
        const filtered = data.filter((p) => p.statut === "En attente");
        setOpenProjects(filtered);
      } catch {
        // silencieux : l'artisan verra au moins ses projets existants
      } finally {
        setLoadingOpenProjects(false);
      }
    };

    const fetchApplications = async () => {
      setLoadingApplications(true);
      try {
        const res = await fetch(
          `${API_URL}/applications/me?artisanId=${encodeURIComponent(user._id)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as ArtisanApplication[];
        setApplications(data);
      } catch {
        // silencieux
      } finally {
        setLoadingApplications(false);
      }
    };

    const fetchMemberProjects = async () => {
      setLoadingMemberProjects(true);
      try {
        const res = await fetch(
          `${API_URL}/projects/mine-as-artisan?artisanId=${encodeURIComponent(
            user._id
          )}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as MemberProject[];
        setMemberProjects(data);
      } catch {
        // silencieux
      } finally {
        setLoadingMemberProjects(false);
      }
    };

    fetchOpenProjects();
    fetchApplications();
    fetchMemberProjects();
  }, [user]);

  const handleApply = async (projectId: string) => {
    if (!user) return;
    setError(null);
    setActionLoadingId(projectId);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artisanId: user._id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            data.error ||
            "Impossible de postuler à ce projet."
        );
      }
      const created = (await res.json()) as ArtisanApplication;
      setApplications((prev) => [created, ...prev]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la candidature au projet."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!loadingUser && !user) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Espace artisan</h1>
        <p className="text-gray-400 text-sm">
          Connectez-vous en tant qu&apos;artisan pour voir les projets ouverts,
          postuler et suivre vos missions.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold shadow-lg shadow-amber-500/30"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  if (!loadingUser && user && user.role !== "artisan") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Espace réservé aux artisans
        </h1>
        <p className="text-gray-400 text-sm">
          Vous êtes connecté en tant que{" "}
          <span className="font-semibold text-amber-300">{user.role}</span>.
          Cet écran est dédié aux artisans.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
            <Briefcase className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Espace artisan</h1>
            <p className="text-xs text-gray-400">
              Consultez les projets ouverts, postulez et suivez les chantiers dont
              vous faites partie.
            </p>
          </div>
        </div>
        <Link
          href="/espace/artisan/profil"
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-amber-500/30 hover:bg-amber-500/10 transition-all"
        >
          Voir mon profil
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Colonne projets ouverts */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm font-semibold text-white">
              Projets disponibles
            </h2>
          </div>

          {loadingOpenProjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
            </div>
          ) : openProjects.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucun projet ouvert pour le moment. Les nouveaux projets
              disponibles apparaîtront ici.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {openProjects.map((project) => (
                <div
                  key={project._id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white line-clamp-1">
                        {project.titre}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">
                        {project.clientNom
                          ? `Client : ${project.clientNom}`
                          : "Projet client BMP.tn"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium bg-blue-500/15 text-blue-300">
                      {project.statut}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>
                      Budget estimé :{" "}
                      <span className="text-gray-200">
                        {project.budget_estime.toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}{" "}
                        TND
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {project.date_debut
                        ? new Date(project.date_debut).toLocaleDateString()
                        : "-"}
                      {" → "}
                      {project.date_fin_prevue
                        ? new Date(
                            project.date_fin_prevue
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoadingId === project._id}
                    onClick={() => handleApply(project._id)}
                    className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 text-xs font-semibold px-4 py-2 shadow-md shadow-amber-500/30 disabled:opacity-60"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Postuler à ce projet
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Colonne candidatures & projets membres */}
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-300" />
              <h2 className="text-sm font-semibold text-white">
                Mes candidatures
              </h2>
            </div>

            {loadingApplications ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <p className="text-xs text-gray-400">
                Vous n&apos;avez pas encore postulé à un projet. Sélectionnez un
                projet à gauche pour envoyer votre candidature.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-auto pr-1">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-3 py-2 text-[11px]"
                  >
                    <div>
                      <p className="font-medium text-white line-clamp-1">
                        {app.projet.titre}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        app.statut === "acceptee"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : app.statut === "refusee"
                          ? "bg-red-500/15 text-red-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {app.statut === "en_attente"
                        ? "En attente"
                        : app.statut === "acceptee"
                        ? "Acceptée"
                        : "Refusée"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-300" />
              <h2 className="text-sm font-semibold text-white">
                Projets dont je suis membre
              </h2>
            </div>

            {loadingMemberProjects ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-500/40 border-t-emerald-300 animate-spin" />
              </div>
            ) : memberProjects.length === 0 ? (
              <p className="text-xs text-gray-400">
                Dès qu&apos;un expert vous affecte à un projet, il apparaîtra
                ici avec son avancement.
              </p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-auto pr-1">
                {memberProjects.map((project) => (
                  <div
                    key={project._id}
                    className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 text-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white line-clamp-1">
                          {project.titre}
                        </p>
                        <p className="text-[11px] text-gray-300 line-clamp-1">
                          {project.clientNom
                            ? `Client : ${project.clientNom}`
                            : "Client BMP.tn"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium ${
                          project.statut === "En cours"
                            ? "bg-amber-500/15 text-amber-300"
                            : project.statut === "Terminé"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-gray-500/15 text-gray-300"
                        }`}
                      >
                        {project.statut}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {project.avancement_global ?? 0}% avancement
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Actif dans le chantier
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

