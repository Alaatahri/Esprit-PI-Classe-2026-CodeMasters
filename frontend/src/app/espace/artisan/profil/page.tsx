"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import {
  Star,
  MapPin,
  Briefcase,
  CheckCircle2,
  MessageCircle,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type WorkZoneScope = "tn_all" | "tn_city" | "country" | "world";
type WorkZone = { scope: WorkZoneScope; value?: string };

type ArtisanDetails = BMPUser & {
  specialite?: string;
  experience_annees?: number;
  zones_travail?: WorkZone[];
};

type CompletedProject = {
  _id: string;
  titre: string;
  description: string;
  statut: string;
  budget_estime?: number;
  artisanRating?: number;
  clientComment?: string;
  updatedAt?: string;
};

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= rounded;
        return (
          <Star
            key={idx}
            className={
              filled
                ? "w-4 h-4 text-amber-400 fill-amber-400 drop-shadow"
                : "w-4 h-4 text-gray-700 fill-gray-800"
            }
          />
        );
      })}
    </div>
  );
}

function formatZone(z: WorkZone): string {
  if (z.scope === "tn_all") return "Toute la Tunisie";
  if (z.scope === "world") return "Partout dans le monde";
  if (z.scope === "tn_city") return z.value ? `Tunisie: ${z.value}` : "Ville (Tunisie)";
  if (z.scope === "country") return z.value ? `Pays: ${z.value}` : "Pays";
  return "Zone";
}

export default function ArtisanProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [details, setDetails] = useState<ArtisanDetails | null>(null);
  const [completed, setCompleted] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "artisan") return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resUser, resCompleted] = await Promise.all([
          fetch(`${API_URL}/users/${user._id}`),
          fetch(`${API_URL}/projects/artisan/${user._id}/completed`),
        ]);

        if (resUser.ok) {
          const u = (await resUser.json()) as ArtisanDetails;
          setDetails(u);
        } else {
          setDetails(user as ArtisanDetails);
        }

        if (resCompleted.ok) {
          const data = (await resCompleted.json()) as CompletedProject[];
          setCompleted(data);
        } else {
          setCompleted([]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du profil artisan."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  const zones = useMemo(() => {
    const z = (details?.zones_travail || []) as WorkZone[];
    return z.map(formatZone);
  }, [details]);

  const rated = useMemo(() => {
    return completed.filter((p) => typeof p.artisanRating === "number");
  }, [completed]);

  const avgRating = useMemo(() => {
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, p) => acc + (p.artisanRating || 0), 0);
    return sum / rated.length;
  }, [rated]);

  const feedbacks = useMemo(() => {
    return completed
      .filter((p) => (p.clientComment || "").trim().length > 0)
      .map((p) => ({
        projectId: p._id,
        titre: p.titre,
        artisanRating: p.artisanRating,
        clientComment: p.clientComment || "",
        updatedAt: p.updatedAt,
      }));
  }, [completed]);

  if (!loadingUser && !user) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Profil artisan</h1>
        <p className="text-gray-400 text-sm">
          Connectez-vous en tant qu&apos;artisan pour accéder à votre profil,
          vos notes et votre historique.
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
        </p>
      </div>
    );
  }

  const d = (details || user) as ArtisanDetails | null;

  if (!d) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 rounded-xl border-2 border-amber-500/50 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/espace/artisan"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-amber-500/30 hover:bg-amber-500/10 transition-all"
            title="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Mon profil artisan</h1>
            <p className="text-xs text-gray-400">
              Détails, notes et feedbacks des clients.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Profil */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                <span className="text-xl font-bold text-amber-300">
                  {d.nom?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{d.nom}</h2>
                <p className="text-xs text-amber-300/80 uppercase tracking-[0.2em]">
                  artisan
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-amber-300" />
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-200">{d.email}</span>
              </div>
              {d.telephone && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-amber-300" />
                  <span className="text-gray-400">Téléphone:</span>
                  <span className="text-gray-200">{d.telephone}</span>
                </div>
              )}
              {d.specialite && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Briefcase className="w-4 h-4 text-emerald-300" />
                  <span className="text-gray-400">Spécialité:</span>
                  <span className="text-gray-200">{d.specialite}</span>
                </div>
              )}
              {typeof d.experience_annees === "number" && (
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-gray-400">Expérience:</span>
                  <span className="text-gray-200">
                    {d.experience_annees} an{d.experience_annees > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300">
                <MapPin className="w-4 h-4" />
                <p className="font-medium text-sm">Zones de travail</p>
              </div>
              {zones.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Aucune zone renseignée.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {zones.map((label, idx) => (
                    <span
                      key={`${label}-${idx}`}
                      className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-gray-200"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-gray-500">Projets terminés</p>
              <p className="text-2xl font-semibold text-white">{completed.length}</p>
            </div>
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-gray-500">Note moyenne</p>
              {avgRating === null ? (
                <p className="text-sm text-gray-400">—</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-white">
                    {avgRating.toFixed(1)}
                  </p>
                  <Stars value={avgRating} />
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-gray-500">Feedbacks</p>
              <p className="text-2xl font-semibold text-white">{feedbacks.length}</p>
            </div>
          </div>
        </section>

        {/* Historique + feedbacks */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-4 text-amber-300">
              <MessageCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-white">
                Avis & feedbacks des clients
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
              </div>
            ) : feedbacks.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucun feedback pour le moment. Quand un client note un projet
                terminé, il apparaîtra ici.
              </p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {feedbacks.map((f) => (
                  <div
                    key={f.projectId}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white line-clamp-1">
                        {f.titre}
                      </p>
                      {typeof f.artisanRating === "number" ? (
                        <div className="flex items-center gap-2">
                          <Stars value={f.artisanRating} />
                          <span className="text-[11px] text-gray-400">
                            {f.artisanRating}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-500">
                          Pas de note
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-line">
                      {f.clientComment}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {f.updatedAt
                        ? `Mis à jour: ${new Date(f.updatedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-4 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-white">
                Projets terminés (historique)
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/40 border-t-emerald-300 animate-spin" />
              </div>
            ) : completed.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucun projet terminé associé à votre compte pour l’instant.
              </p>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                {completed.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white line-clamp-1">
                        {p.titre}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300">
                        Terminé
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {p.description}
                    </p>
                    {typeof p.budget_estime === "number" && (
                      <p className="text-[11px] text-gray-400">
                        Budget:{" "}
                        <span className="text-gray-200">
                          {p.budget_estime.toLocaleString("fr-FR")} TND
                        </span>
                      </p>
                    )}
                    {typeof p.artisanRating === "number" && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Stars value={p.artisanRating} />
                        <span>Note artisan</span>
                      </div>
                    )}
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

