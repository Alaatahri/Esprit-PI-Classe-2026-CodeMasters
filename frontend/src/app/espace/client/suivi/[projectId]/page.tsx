"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ImageIcon,
  Loader2,
  Percent,
  MessageCircle,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { refId } from "@/lib/project-refs";

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
  expertId?: unknown;
  applications?: Array<{
    artisanId?: unknown;
    statut?: string;
  }>;
};

type SuiviEntry = {
  _id: string;
  date_suivi: string;
  description_progression: string;
  pourcentage_avancement: number;
  photo_url?: string;
  photoUrl?: string;
  progressPercent?: number;
  progressIndex?: number;
  createdAt?: string;
};

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

export default function ClientSuiviDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [user, setUser] = useState<BMPUser | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [suivis, setSuivis] = useState<SuiviEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const run = async () => {
      const u = getStoredUser();
      if (!u || u.role !== "client") {
        setLoading(false);
        setError("Accès réservé aux clients connectés.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const resP = await fetch(`${API_URL}/projects/${projectId}`, {
          cache: "no-store",
        });
        if (!resP.ok) {
          throw new Error("Projet introuvable.");
        }
        const p = (await resP.json()) as Project;
        if (String(p.clientId) !== String(u._id)) {
          setError("Ce projet ne fait pas partie de vos chantiers.");
          setProject(null);
          setSuivis([]);
          return;
        }
        setProject(p);

        const resS = await fetch(
          `${API_URL}/suivi-projects?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        const raw = resS.ok ? ((await resS.json()) as SuiviEntry[]) : [];
        const list = Array.isArray(raw) ? raw : [];
        list.sort((a, b) => {
          const ta = new Date(a.date_suivi || a.createdAt || 0).getTime();
          const tb = new Date(b.date_suivi || b.createdAt || 0).getTime();
          return tb - ta;
        });
        setSuivis(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement.");
        setProject(null);
        setSuivis([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [projectId]);

  useEffect(() => {
    if (user === null && typeof window !== "undefined") {
      const u = getStoredUser();
      if (!u) router.replace("/login");
    }
  }, [user, router]);

  if (!user && loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (user && user.role !== "client") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-16">
        <p className="text-gray-400">Cette page est réservée aux clients.</p>
        <Link
          href="/espace"
          className="text-amber-400 hover:underline"
        >
          Retour à l&apos;espace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/espace/client/suivi"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au suivi de mes projets
        </Link>
        <Link
          href="/espace/client"
          className="block text-xs text-gray-500 hover:text-gray-400 mb-2"
        >
          ← Espace client
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : project ? (
        <>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-white">{project.titre}</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {project.date_debut
                  ? new Date(project.date_debut).toLocaleDateString("fr-FR")
                  : "—"}{" "}
                →{" "}
                {project.date_fin_prevue
                  ? new Date(project.date_fin_prevue).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${
                  project.statut === "Terminé"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : project.statut === "En cours"
                    ? "bg-blue-500/15 text-blue-300"
                    : "bg-gray-500/15 text-gray-300"
                }`}
              >
                {project.statut}
              </span>
            </div>
          </header>

          {(() => {
            const expertOid = refId(project.expertId);
            const accepted = project.applications?.find(
              (a) => a.statut === "acceptee",
            );
            const artisanOid = accepted ? refId(accepted.artisanId) : "";
            if (!expertOid && !artisanOid) return null;
            return (
              <section className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                  Échanger avec l&apos;équipe
                </h2>
                <p className="text-xs text-gray-500">
                  Ouvrez une conversation avec votre expert ou l&apos;artisan
                  assigné au chantier.
                </p>
                <div className="flex flex-wrap gap-2">
                  {expertOid ? (
                    <Link
                      href={`/messages/${expertOid}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-200 hover:bg-sky-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message à l&apos;expert
                    </Link>
                  ) : null}
                  {artisanOid ? (
                    <Link
                      href={`/messages/${artisanOid}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message à l&apos;artisan
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          })()}

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                Avancement global du chantier
              </h2>
              <span className="text-2xl font-bold text-amber-300 tabular-nums">
                {clampPct(project.avancement_global ?? 0)}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all"
                style={{
                  width: `${clampPct(project.avancement_global ?? 0)}%`,
                }}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              Photos et points de suivi
            </h2>
            {suivis.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucune photo de suivi enregistrée pour ce projet pour le moment.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-1">
                {suivis.map((s) => {
                  const pct =
                    typeof s.progressPercent === "number"
                      ? s.progressPercent
                      : s.pourcentage_avancement;
                  const photo = s.photoUrl || s.photo_url;
                  const dateStr = s.date_suivi
                    ? new Date(s.date_suivi).toLocaleString("fr-FR")
                    : "—";
                  return (
                    <article
                      key={s._id}
                      className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden"
                    >
                      <div className="aspect-video sm:aspect-[21/9] bg-gray-900 relative">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt="Suivi chantier"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                            Aucune image
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{dateStr}</span>
                            <span className="font-semibold text-amber-300">
                              {pct ?? "—"}%
                              {typeof s.progressIndex === "number" && (
                                <span className="text-gray-500 font-normal ml-1">
                                  (#{s.progressIndex})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {s.description_progression}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
