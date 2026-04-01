"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { SuiviTimeline } from "@/components/SuiviTimeline";
import {
  Users,
  Star,
  Phone,
  Mail,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Artisan = {
  _id: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
  competences?: string[];
  specialites?: string[];
  ratingMoyen?: number;
  nbProjets?: number;
};

type ArtisanApplication = {
  _id: string;
  artisan?: {
    _id: string;
    nom: string;
    ratingMoyen?: number;
    competences?: string[];
  };
  artisanId?: string | { _id?: string };
  statut: "en_attente" | "acceptee" | "refusee";
  createdAt?: string;
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
  applications?: ArtisanApplication[];
};

const exampleArtisans: Artisan[] = [
  {
    _id: "a1",
    nom: "Ali Ben Salah",
    email: "ali.artisan@example.com",
    telephone: "+216 20 123 456",
    role: "artisan",
    competences: ["Maçonnerie", "Gros œuvre"],
    specialites: ["Maisons individuelles", "Extensions"],
    ratingMoyen: 4.8,
    nbProjets: 12,
  },
  {
    _id: "a2",
    nom: "Meriem Trabelsi",
    email: "meriem.peintre@example.com",
    telephone: "+216 24 654 321",
    role: "artisan",
    competences: ["Peinture", "Finitions"],
    specialites: ["Rénovation intérieure"],
    ratingMoyen: 4.6,
    nbProjets: 8,
  },
];

const exampleExpertProjects: ExpertProject[] = [
  {
    _id: "p1",
    titre: "Rénovation appartement centre-ville",
    description:
      "Rénovation complète d'un F3 : sols, murs, cuisine et salle de bain.",
    budget_estime: 55000,
    statut: "Ouvert",
    clientNom: "Karim H.",
    date_debut: new Date().toISOString(),
    date_fin_prevue: new Date(
      new Date().setMonth(new Date().getMonth() + 2)
    ).toISOString(),
    applications: [
      {
        _id: "ap1",
        statut: "en_attente",
        artisan: {
          _id: "a1",
          nom: "Ali Ben Salah",
          ratingMoyen: 4.8,
          competences: ["Maçonnerie", "Gros œuvre"],
        },
      },
      {
        _id: "ap2",
        statut: "en_attente",
        artisan: {
          _id: "a2",
          nom: "Meriem Trabelsi",
          ratingMoyen: 4.6,
          competences: ["Peinture", "Finitions"],
        },
      },
    ],
  },
];

export default function ExpertSpacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [artisans, setArtisans] = useState<Artisan[]>(exampleArtisans);
  const [loadingArtisans, setLoadingArtisans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] =
    useState<ExpertProject[]>(exampleExpertProjects);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) {
          throw new Error("Impossible de charger les artisans.");
        }
        const data = (await res.json()) as Artisan[];
        setArtisans(data.filter((u) => u.role === "artisan"));
      } catch (err) {
      } finally {
        setLoadingArtisans(false);
      }
    };

    const fetchProjectsForExpert = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`${API_URL}/projects`);
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as ExpertProject[];
        // Garder uniquement les projets en attente ou en cours
        const filtered = data
          .filter((p) => ["En attente", "En cours"].includes(p.statut))
          .map((p) => ({
            ...p,
            applications: p.applications ?? [],
          }));
        setProjects(filtered);
      } catch {
        // Silencieux : l'expert verra au moins la liste des artisans
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchArtisans();
    fetchProjectsForExpert();
  }, [user]);

  const handleApplicationAction = async (
    applicationId: string,
    action: "accept" | "decline"
  ) => {
    setActionError(null);
    setActionLoadingId(applicationId);
    try {
      const endpoint =
        action === "accept"
          ? `${API_URL}/applications/${applicationId}/accept`
          : `${API_URL}/applications/${applicationId}/decline`;
      const res = await fetch(endpoint, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            data.error ||
            "Impossible de mettre à jour la candidature."
        );
      }
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          applications: project.applications?.map((app) =>
            app._id === applicationId
              ? {
                  ...app,
                  statut: action === "accept" ? "acceptee" : "refusee",
                }
              : app
          ) ?? [],
        }))
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de la candidature."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const resolveArtisanForApplication = (app: ArtisanApplication) => {
    if (app.artisan) {
      return app.artisan;
    }

    const rawArtisanId =
      typeof app.artisanId === "string"
        ? app.artisanId
        : app.artisanId?._id;

    if (!rawArtisanId) {
      return undefined;
    }

    return artisans.find((artisan) => artisan._id === rawArtisanId);
  };

  if (!loadingUser && !user) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Espace expert</h1>
        <p className="text-gray-400">
          Connectez-vous en tant qu&apos;expert pour voir la liste des
          artisans disponibles.
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

  if (!loadingUser && user && user.role !== "expert") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Espace réservé aux experts
        </h1>
        <p className="text-gray-400 text-sm">
          Vous êtes connecté en tant que{" "}
          <span className="font-semibold text-amber-300">
            {user.role}
          </span>
          . Cet écran est dédié aux experts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
            <Users className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Espace expert</h1>
            <p className="text-xs text-gray-400">
              Visualisez les artisans, les projets ouverts et affectez les
              bons profils aux bons chantiers.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
          {actionError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Colonne artisans */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm font-semibold text-white">
              Artisans disponibles
            </h2>
          </div>

          {loadingArtisans ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
            </div>
          ) : artisans.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucun artisan trouvé pour le moment. Une fois les artisans
              inscrits, vous les verrez ici.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {artisans.map((artisan) => (
                <div
                  key={artisan._id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white line-clamp-1">
                        {artisan.nom}
                      </p>
                      <p className="text-[11px] text-amber-300 uppercase tracking-[0.18em]">
                        Artisan
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-300">
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>
                        {artisan.ratingMoyen?.toFixed(1) ?? "4.5"}
                      </span>
                      {typeof artisan.nbProjets === "number" && (
                        <span className="text-gray-500">
                          ({artisan.nbProjets})
                        </span>
                      )}
                    </div>
                  </div>
                  {artisan.competences && artisan.competences.length > 0 && (
                    <p className="text-[11px] text-gray-300">
                      Compétences :{" "}
                      <span className="text-gray-200">
                        {artisan.competences.join(", ")}
                      </span>
                    </p>
                  )}
                  {artisan.specialites && artisan.specialites.length > 0 && (
                    <p className="text-[11px] text-gray-300">
                      Spécialités :{" "}
                      <span className="text-gray-200">
                        {artisan.specialites.join(", ")}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {artisan.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {artisan.telephone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Colonne projets & candidatures */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm font-semibold text-white">
              Projets des clients & candidatures
            </h2>
          </div>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucun projet ouvert avec des candidatures pour le moment. Les
              projets éligibles apparaîtront ici.
            </p>
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white line-clamp-1">
                        {project.titre}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">
                        {project.clientNom
                          ? `Client : ${project.clientNom}`
                          : "Projet client"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium ${
                        project.statut === "Ouvert"
                          ? "bg-blue-500/15 text-blue-300"
                          : project.statut === "En cours"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-gray-500/15 text-gray-300"
                      }`}
                    >
                      {project.statut}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2">
                    {project.description}
                  </p>

                  <Link
                    href={`/expert/projects/${project._id}/suivi-photo`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/20 transition w-full sm:w-auto"
                  >
                    📷 Suivi photo
                  </Link>

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

                  <SuiviTimeline projectId={project._id} apiBaseUrl={API_URL} />

                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-gray-200">
                        Candidatures des artisans
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {(project.applications ?? []).length} candidature
                        {(project.applications ?? []).length > 1 ? "s" : ""}
                      </p>
                    </div>

                    {(project.applications ?? []).length === 0 ? (
                      <p className="text-[11px] text-gray-500">
                        Aucun artisan n&apos;a encore postulé sur ce projet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(project.applications ?? []).map((app) => {
                          const resolvedArtisan =
                            resolveArtisanForApplication(app);
                          const artisanName =
                            resolvedArtisan?.nom || "Artisan inconnu";
                          const artisanRating =
                            typeof resolvedArtisan?.ratingMoyen === "number"
                              ? resolvedArtisan.ratingMoyen
                              : typeof app.artisan?.ratingMoyen === "number"
                              ? app.artisan.ratingMoyen
                              : undefined;
                          const artisanCompetences =
                            resolvedArtisan?.competences ||
                            app.artisan?.competences ||
                            [];

                          return (
                            <div
                              key={app._id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-3 py-2 text-[11px]"
                            >
                              <div className="space-y-0.5">
                                <p className="font-medium text-white">
                                  {artisanName}
                                </p>
                                <div className="flex items-center gap-2 text-gray-400">
                                  {typeof artisanRating === "number" ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                                      {artisanRating.toFixed(1)}
                                    </span>
                                  ) : null}
                                  {artisanCompetences.length > 0 && (
                                    <span className="line-clamp-1">
                                      {artisanCompetences.join(", ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
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
                                {app.statut === "en_attente" && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={actionLoadingId === app._id}
                                      onClick={() =>
                                        handleApplicationAction(
                                          app._id,
                                          "accept"
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 w-7 h-7 disabled:opacity-60"
                                      title="Accepter"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={actionLoadingId === app._id}
                                      onClick={() =>
                                        handleApplicationAction(
                                          app._id,
                                          "decline"
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25 w-7 h-7 disabled:opacity-60"
                                      title="Refuser"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

