"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  Quote,
  Award,
  ShieldCheck,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SafeImageFill } from "@/components/SafeImageFill";
import {
  fetchPublicWorkers,
  fetchShowcaseProjects,
  profileImageUrl,
  workerDisplayName,
  showcaseCoverImage,
  FALLBACK_SHOWCASE_IMAGE,
  avatarUrlForWorker,
  filterWorkingImageUrls,
  type PublicWorker,
  type ShowcaseProjectApi,
} from "@/lib/public-workers";

function Stars({ value }: { value: number }) {
  const v = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < v
              ? "w-3.5 h-3.5 text-amber-400 fill-amber-400"
              : "w-3.5 h-3.5 text-white/20"
          }
        />
      ))}
    </div>
  );
}

function zoneLabel(z: { scope: string; value?: string }): string {
  if (z.scope === "tn_all") return "Toute la Tunisie";
  if (z.scope === "tn_city" && z.value) return z.value;
  if (z.scope === "country" && z.value) return z.value;
  if (z.scope === "world") return "International";
  return z.value || "";
}

/** Nombre d’éléments visibles avant « Voir tout » */
const PREVIEW_COUNT = 6;

function showcasePhotoCount(p: ShowcaseProjectApi): number {
  const av = filterWorkingImageUrls(p.photosAvant?.filter(Boolean));
  const ap = filterWorkingImageUrls(p.photosApres?.filter(Boolean));
  return av.length + ap.length;
}

/** Intervalle de rafraîchissement automatique (ms) */
const AUTO_REFRESH_MS = 45_000;

export function GuestLandingShowcase() {
  const [workers, setWorkers] = useState<PublicWorker[]>([]);
  const [projects, setProjects] = useState<ShowcaseProjectApi[]>([]);
  const [dataState, setDataState] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [retryCount, setRetryCount] = useState(0);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllArtisans, setShowAllArtisans] = useState(false);
  const [showAllExperts, setShowAllExperts] = useState(false);

  const loadData = useCallback(async () => {
    setDataState("loading");
    setErrorDetail(null);
    try {
      const [w, p] = await Promise.all([
        fetchPublicWorkers(),
        fetchShowcaseProjects(),
      ]);
      setWorkers(Array.isArray(w) ? w : []);
      setProjects(Array.isArray(p) ? p : []);
      setDataState("ready");
    } catch (e) {
      setDataState("error");
      setErrorDetail(
        e instanceof Error ? e.message : "Erreur de chargement",
      );
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [retryCount, loadData]);

  /** Rafraîchissement automatique en arrière-plan (sans indicateur visuel) */
  useEffect(() => {
    if (dataState !== "ready") return;
    const id = window.setInterval(async () => {
      try {
        const [w, p] = await Promise.all([
          fetchPublicWorkers(),
          fetchShowcaseProjects(),
        ]);
        setWorkers(Array.isArray(w) ? w : []);
        setProjects(Array.isArray(p) ? p : []);
      } catch {
        /* conserve les données affichées */
      }
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [dataState]);

  const artisansAll = useMemo(
    () => workers.filter((u) => u.role === "artisan"),
    [workers],
  );
  const expertsAll = useMemo(
    () => workers.filter((u) => u.role === "expert"),
    [workers],
  );

  const projectsVisible = showAllProjects
    ? projects
    : projects.slice(0, PREVIEW_COUNT);
  const artisansVisible = showAllArtisans
    ? artisansAll
    : artisansAll.slice(0, PREVIEW_COUNT);
  const expertsVisible = showAllExperts
    ? expertsAll
    : expertsAll.slice(0, PREVIEW_COUNT);

  if (dataState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400/80" />
        <p className="text-sm">Chargement des profils et projets…</p>
      </div>
    );
  }

  if (dataState === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-amber-950/25 px-6 py-10 text-center space-y-4">
        <p className="text-amber-100 font-medium">
          Impossible de joindre l&apos;API BMP.tn
        </p>
        {errorDetail && (
          <p className="text-left text-xs text-gray-400 leading-relaxed break-words rounded-lg bg-black/30 p-3 font-mono">
            {errorDetail}
          </p>
        )}
        <p className="text-sm text-gray-400 leading-relaxed">
          1) Terminal 1 — backend :{" "}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-amber-200/90">
            cd backend
          </code>{" "}
          puis{" "}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-amber-200/90">
            npm run start:dev
          </code>
          <br />
          2) MongoDB doit tourner (variable{" "}
          <code className="rounded bg-black/40 px-1">MONGODB_URI</code> dans{" "}
          <code className="rounded bg-black/40 px-1">backend/.env</code> si
          besoin).
          <br />
          3) Si le backend est sur une autre adresse, créez{" "}
          <code className="rounded bg-black/40 px-1">
            frontend/.env.local
          </code>{" "}
          avec :{" "}
          <code className="block mt-2 text-left break-all rounded bg-black/40 px-2 py-1.5 text-amber-200/90">
            BACKEND_ORIGIN=http://localhost:3001
          </code>
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((n) => n + 1)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-2.5 text-sm font-semibold text-gray-900"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16 sm:space-y-20 lg:space-y-28 w-full min-w-0">
      {/* Réalisations (projets terminés réels) */}
      <section className="space-y-6 sm:space-y-8 min-w-0">
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Réalisations
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
            Projets terminés sur BMP.tn
          </h2>
          <p className="text-sm text-gray-400">
            Extraits de la base — avis clients lorsqu&apos;ils sont renseignés.
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            Aucun projet terminé à afficher pour le moment.
          </p>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {projectsVisible.map((p, i) => (
              <motion.article
                key={String(p._id)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-amber-500/25 transition-colors"
              >
                <Link
                  href={`/realisations/${p._id}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-2xl"
                >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <SafeImageFill
                    src={showcaseCoverImage(p, i)}
                    fallbackSrc={FALLBACK_SHOWCASE_IMAGE}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                  <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-medium text-amber-200 border border-white/10">
                    {p.statut || "Terminé"}
                  </span>
                  {showcasePhotoCount(p) > 0 && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-black/55 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium text-white/95 border border-white/15">
                      {showcasePhotoCount(p)} photos · avant / après
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
                      {p.titre}
                    </h3>
                    {typeof p.clientRating === "number" && (
                      <Stars value={p.clientRating} />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {p.description || "—"}
                  </p>
                  {p.clientComment && (
                    <p className="text-[11px] text-gray-300 italic line-clamp-3 border-t border-white/5 pt-2">
                      &ldquo;{p.clientComment}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-white/5">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {p.updatedAt
                        ? new Date(p.updatedAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                    <span className="text-emerald-400/80">
                      {p.avancement_global ?? 100}% terminé
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 font-medium pt-1">
                    Voir les photos avant / après →
                  </p>
                </div>
                </Link>
              </motion.article>
            ))}
          </div>
          {projects.length > PREVIEW_COUNT && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowAllProjects((v) => !v)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-6 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20 w-full max-w-md sm:w-auto"
              >
                {showAllProjects ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Afficher moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Voir tout les projets ({projects.length - PREVIEW_COUNT}{" "}
                    de plus)
                  </>
                )}
              </button>
            </div>
          )}
          </>
        )}
      </section>

      {/* Artisans */}
      <section className="relative rounded-2xl sm:rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-gray-950/80 to-gray-950 overflow-hidden min-w-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative px-4 py-8 sm:px-8 sm:py-12 lg:px-12 space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Artisans
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
              Équipes sur la plateforme
            </h2>
            <p className="text-sm text-gray-400 max-w-xl">
              Profils réels — cliquez pour voir l&apos;historique et les avis
              liés aux projets.
            </p>
          </div>

          {artisansAll.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun artisan inscrit pour le moment.</p>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {artisansVisible.map((a, i) => {
                const href = `/profil/${a._id}`;
                const zones = (a.zones_travail || [])
                  .map(zoneLabel)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(" · ");
                const r =
                  typeof a.rating === "number" && a.rating > 0
                    ? a.rating
                    : null;
                return (
                  <motion.div
                    key={a._id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={href}
                      className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-amber-500/35 hover:bg-black/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-2 ring-amber-500/30 shrink-0">
                          <SafeImageFill
                            src={profileImageUrl(a)}
                            fallbackSrc={avatarUrlForWorker(a)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">
                            {workerDisplayName(a)}
                          </p>
                          <p className="text-[11px] text-amber-200/80 truncate">
                            {a.specialite || "Artisan"}
                          </p>
                          {a.bio && (
                            <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-snug">
                              {a.bio}
                            </p>
                          )}
                          {zones && (
                            <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {zones}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        {r != null ? (
                          <Stars value={Math.round(r)} />
                        ) : (
                          <span className="text-gray-600">Note —</span>
                        )}
                        <span className="text-amber-400/90 text-[10px] font-medium">
                          Voir le profil →
                        </span>
                      </div>
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/25">
                        <Award className="w-3 h-3" />
                        Membre vérifié
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            {artisansAll.length > PREVIEW_COUNT && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllArtisans((v) => !v)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-black/20 px-6 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-black/35 w-full max-w-md sm:w-auto"
                >
                  {showAllArtisans ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Afficher moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Voir tous les artisans (
                      {artisansAll.length - PREVIEW_COUNT} de plus)
                    </>
                  )}
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </section>

      {/* Experts */}
      <section className="space-y-6 sm:space-y-8 min-w-0 px-0">
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Experts
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
            Experts inscrits
          </h2>
          <p className="text-sm text-gray-400">
            Compétences et notes issues du profil — détail des projets sur la
            fiche.
          </p>
        </div>

        {expertsAll.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            Aucun expert inscrit pour le moment.
          </p>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {expertsVisible.map((ex, i) => {
              const href = `/profil/${ex._id}`;
              const comps = (ex.competences || []).slice(0, 5);
              const r =
                typeof ex.rating === "number" && ex.rating > 0
                  ? ex.rating
                  : null;
              return (
                <motion.div
                  key={ex._id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={href}
                    className="flex h-full flex-col rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-950/30 to-white/[0.03] p-4 sm:p-6 gap-3 sm:gap-4 transition hover:border-sky-500/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-[4.5rem] w-[4.5rem] rounded-2xl overflow-hidden ring-2 ring-sky-500/30 shrink-0">
                        <SafeImageFill
                          src={profileImageUrl(ex)}
                          fallbackSrc={avatarUrlForWorker(ex)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="72px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">
                          {workerDisplayName(ex)}
                        </p>
                        <p className="text-xs text-sky-300/90">
                          Expert BMP.tn
                        </p>
                        {ex.bio && (
                          <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-snug">
                            {ex.bio}
                          </p>
                        )}
                        <div className="mt-1">
                          {r != null ? (
                            <Stars value={Math.round(r)} />
                          ) : (
                            <span className="text-[11px] text-gray-600">
                              Note —
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ul className="flex flex-wrap gap-1.5 min-h-[2rem]">
                      {comps.map((c) => (
                        <li
                          key={c}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300"
                        >
                          {c}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-sky-300/90 flex gap-2 items-start mt-auto pt-2 border-t border-white/10">
                      <Quote className="w-4 h-4 text-sky-500/50 shrink-0" />
                      Cliquez pour l&apos;historique des dossiers et les avis
                      projet.
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          {expertsAll.length > PREVIEW_COUNT && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllExperts((v) => !v)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-sky-500/35 bg-sky-950/30 px-6 py-2.5 text-sm font-medium text-sky-200 transition hover:bg-sky-950/50 w-full max-w-md sm:w-auto"
              >
                {showAllExperts ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Afficher moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Voir tous les experts ({expertsAll.length - PREVIEW_COUNT}{" "}
                    de plus)
                  </>
                )}
              </button>
            </div>
          )}
          </>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 max-w-lg mx-auto sm:max-w-none">
          <Link
            href="/inscription"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold px-8 py-3 text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-shadow w-full sm:w-auto"
          >
            Créer un compte
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-white font-medium px-8 py-3 text-sm hover:bg-white/10 transition-colors w-full sm:w-auto"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>
    </div>
  );
}
