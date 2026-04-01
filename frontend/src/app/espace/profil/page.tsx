"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { Star, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type RatedProject = {
  _id: string;
  titre: string;
  description: string;
  statut: string;
  avancement_global: number;
  clientRating?: number;
  clientComment?: string;
  expertRating?: number;
  artisanRating?: number;
  createdAt?: string;
  updatedAt?: string;
};

type RatingFormState = {
  clientRating: number;
  expertRating?: number;
  artisanRating?: number;
  clientComment: string;
};

const defaultRatingForm: RatingFormState = {
  clientRating: 5,
  expertRating: undefined,
  artisanRating: undefined,
  clientComment: "",
};

function Stars({ value }: { value: number }) {
  const stars = [];
  const rounded = Math.round(value * 2) / 2;
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={
          i <= rounded
            ? "w-4 h-4 text-amber-400 fill-amber-400 drop-shadow"
            : "w-4 h-4 text-gray-700 fill-gray-800"
        }
      />
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<RatedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState<RatingFormState>(defaultRatingForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      setUser(null);
      setLoading(false);
      return;
    }
    setUser(stored);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/projects/client/${user._id}/completed`
        );
        if (!res.ok) {
          throw new Error("Impossible de charger vos projets terminés");
        }
        const data = (await res.json()) as RatedProject[];
        setProjects(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des projets"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleSelectProject = (project: RatedProject) => {
    setSelectedProjectId(project._id);
    setSuccess(null);
    setError(null);
    setForm({
      clientRating: project.clientRating ?? 5,
      expertRating: project.expertRating,
      artisanRating: project.artisanRating,
      clientComment: project.clientComment ?? "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/projects/${selectedProjectId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientRating: form.clientRating,
          clientComment: form.clientComment.trim() || undefined,
          expertRating: form.expertRating,
          artisanRating: form.artisanRating,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            data.error ||
            "Erreur lors de l'enregistrement de la note"
        );
      }

      const updated = (await res.json()) as RatedProject;
      setProjects((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
      setSuccess("Votre avis a bien été enregistré.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi de la note"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !user) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Espace réservé</h1>
        <p className="text-gray-400">
          Connectez-vous pour accéder à votre profil, votre historique de
          projets et laisser une note à vos artisans et experts.
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

  return (
    <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-8 lg:gap-10">
      {/* Colonne profil + résumé */}
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
              <span className="text-xl font-bold text-amber-300">
                {user?.nom?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {user?.nom || "Mon profil"}
              </h1>
              <p className="text-xs text-amber-300/80 uppercase tracking-[0.2em]">
                {user?.role || "client"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-gray-500">Projets terminés</p>
              <p className="text-2xl font-semibold text-white">
                {projects.length}
              </p>
            </div>
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-gray-500">Dernière activité</p>
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <Clock className="w-4 h-4 text-amber-300" />
                {projects[0]?.updatedAt
                  ? new Date(projects[0].updatedAt).toLocaleDateString()
                  : "-"}
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-500 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
            <span>
              Vos avis aident à mieux valoriser les artisans et experts qui ont
              travaillé sur vos projets.
            </span>
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-amber-300">
            <MessageCircle className="w-4 h-4" />
            <p className="font-medium">Comment fonctionne la notation ?</p>
          </div>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>
              Vous ne pouvez noter que vos projets marqués comme « Terminé ».
            </li>
            <li>La note va de 1 à 5 étoiles.</li>
            <li>Vous pouvez modifier votre avis à tout moment.</li>
          </ul>
        </div>
      </section>

      {/* Colonne historique & formulaire de rating */}
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white">
              Projets terminés
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucun projet terminé pour le moment. Une fois vos projets
              clôturés, vous pourrez laisser une note ici.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-auto pr-1">
              {projects.map((project) => {
                const isSelected = project._id === selectedProjectId;
                return (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => handleSelectProject(project)}
                    className={`w-full text-left rounded-2xl border px-4 py-3 text-sm transition-all ${
                      isSelected
                        ? "border-amber-400/60 bg-amber-500/15 shadow-inner shadow-amber-500/20"
                        : "border-white/10 bg-black/30 hover:border-amber-500/40 hover:bg-amber-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-medium text-white line-clamp-1">
                        {project.titre}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300">
                        Terminé
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      {typeof project.clientRating === "number" ? (
                        <>
                          <Stars value={project.clientRating} />
                          <span>Votre note actuelle</span>
                        </>
                      ) : (
                        <span className="text-amber-300">
                          Cliquez pour donner une note
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7">
          <h2 className="text-lg font-semibold text-white mb-4">
            {selectedProjectId
              ? "Donner ou modifier votre avis"
              : "Sélectionnez un projet pour noter"}
          </h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          {selectedProjectId ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Note globale du projet
                </label>
                <div className="flex items-center gap-2">
                  <Stars value={form.clientRating} />
                  <select
                    value={form.clientRating}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        clientRating: Number(e.target.value) || 1,
                      }))
                    }
                    className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-400/60"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} étoile{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={form.clientComment}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientComment: e.target.value }))
                  }
                  rows={4}
                  placeholder="Décrivez votre expérience avec les artisans et l'expert (qualité du travail, délais, communication...) "
                  className="w-full rounded-2xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? "Enregistrement..." : "Enregistrer mon avis"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-400">
              Choisissez d&apos;abord un projet terminé dans la liste ci-dessus pour
              laisser une note et un commentaire.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

