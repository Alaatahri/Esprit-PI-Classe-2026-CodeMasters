"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Star,
  Clock,
  X,
  ZoomIn,
  ArrowLeftRight,
  Sparkles,
  MessageCircle,
  Camera,
} from "lucide-react";
import {
  fetchShowcaseProjectById,
  type ShowcaseProjectDetailApi,
  type ShowcaseReviewEntry,
} from "@/lib/public-workers";

function reviewRoleLabel(role: string): string {
  switch (role) {
    case "client":
      return "Client";
    case "expert":
      return "Expert BMP.tn";
    case "artisan":
      return "Équipe artisan";
    case "visiteur":
      return "Visiteur";
    default:
      return role;
  }
}

function reviewCardStyles(role: string): string {
  switch (role) {
    case "client":
      return "border-amber-500/25 bg-gradient-to-br from-amber-950/35 to-gray-950/90";
    case "expert":
      return "border-sky-500/25 bg-gradient-to-br from-sky-950/35 to-gray-950/90";
    case "artisan":
      return "border-emerald-500/25 bg-gradient-to-br from-emerald-950/35 to-gray-950/90";
    default:
      return "border-violet-500/20 bg-gradient-to-br from-violet-950/25 to-gray-950/90";
  }
}

function Stars({ value }: { value: number }) {
  const v = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < v
              ? "w-4 h-4 text-amber-400 fill-amber-400"
              : "w-4 h-4 text-white/15"
          }
        />
      ))}
    </div>
  );
}

export default function RealisationDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [project, setProject] = useState<ShowcaseProjectDetailApi | null>(
    null,
  );
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setState("error");
      setErr("Identifiant manquant");
      return;
    }
    let cancelled = false;
    setState("loading");
    setErr(null);
    void (async () => {
      try {
        const p = await fetchShowcaseProjectById(id);
        if (!cancelled) {
          setProject(p);
          setState("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setState("error");
          setErr(e instanceof Error ? e.message : "Chargement impossible");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setLightbox(null);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightbox, onKeyDown]);

  if (state === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl" />
          <Loader2 className="relative h-11 w-11 animate-spin text-amber-400/90" />
        </div>
        <p className="text-sm tracking-wide">Chargement de la réalisation…</p>
      </div>
    );
  }

  if (state === "error" || !project) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-950/40 to-gray-950/80 px-8 py-12 text-center space-y-5 shadow-2xl shadow-black/40">
        <p className="text-lg font-semibold text-white">Réalisation introuvable</p>
        {err && (
          <p className="text-xs text-gray-500 font-mono break-words rounded-lg bg-black/40 px-3 py-2">
            {err}
          </p>
        )}
        <Link
          href="/espace"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/35 px-6 py-3 text-sm font-medium text-amber-100 hover:bg-amber-500/25 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la vitrine
        </Link>
      </div>
    );
  }

  const avant = project.photosAvant?.filter(Boolean) ?? [];
  const apres = project.photosApres?.filter(Boolean) ?? [];
  const hero = apres[0] ?? avant[0] ?? null;
  const pairCount = Math.min(avant.length, apres.length);
  const extraAvant = avant.slice(pairCount);
  const extraApres = apres.slice(pairCount);
  const reviews = project.reviews ?? [];
  const chantier = project.chantierPhotos?.filter(Boolean) ?? [];

  return (
    <>
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            href="/espace"
            className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-200 transition-colors"
          >
            <span className="rounded-lg bg-white/5 p-1.5 ring-1 ring-white/10 group-hover:ring-amber-500/30 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </span>
            Retour à la vitrine
          </Link>
        </motion.div>

        {hero && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50"
          >
            <div className="relative aspect-[2/1] min-h-[200px] max-h-[380px] sm:aspect-[21/9]">
              <Image
                src={hero}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-gray-950/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 backdrop-blur-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-200 border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Réalisation BMP.tn
                </span>
                <span className="inline-flex rounded-full bg-black/45 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white/90 border border-white/10">
                  {project.statut || "Terminé"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-[1.15] tracking-tight max-w-3xl">
                {project.titre}
              </h1>
            </div>
          </motion.div>
        )}

        {!hero && (
          <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
              <Sparkles className="w-3.5 h-3.5" />
              Réalisation BMP.tn
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {project.titre}
            </h1>
          </motion.header>
        )}

        {project.description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-base text-gray-300 leading-relaxed max-w-3xl border-l-2 border-amber-500/40 pl-5"
          >
            {project.description}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-sm"
        >
          {typeof project.clientRating === "number" && (
            <div className="flex flex-1 min-w-[200px] items-center gap-3 rounded-xl bg-black/25 px-4 py-3 ring-1 ring-white/5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Avis client
              </span>
              <Stars value={project.clientRating} />
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            {typeof project.expertRating === "number" && (
              <span className="rounded-xl bg-sky-950/40 px-4 py-3 ring-1 ring-sky-500/20 text-sky-100/90">
                Expert <strong className="text-white">{project.expertRating}/5</strong>
              </span>
            )}
            {typeof project.artisanRating === "number" && (
              <span className="rounded-xl bg-emerald-950/40 px-4 py-3 ring-1 ring-emerald-500/20 text-emerald-100/90">
                Artisan{" "}
                <strong className="text-white">{project.artisanRating}/5</strong>
              </span>
            )}
          </div>
          {project.updatedAt && (
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-gray-500 self-center">
              <Clock className="w-4 h-4 text-gray-600" />
              {new Date(project.updatedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </motion.div>

        {reviews.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-400/90 shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Avis et retours
                </h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
                  {reviews.length}
                </span>
              </div>
              <p className="text-sm text-gray-500 max-w-xl">
                Client, équipes BMP.tn et retours de visiteurs sur cette
                réalisation.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((r: ShowcaseReviewEntry, i: number) => (
                <motion.article
                  key={`rev-${i}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className={`rounded-2xl border p-5 sm:p-6 ${reviewCardStyles(r.role)}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {r.author}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-gray-500 mt-0.5">
                        {reviewRoleLabel(r.role)}
                      </p>
                    </div>
                    {typeof r.rating === "number" && (
                      <Stars value={r.rating} />
                    )}
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    &ldquo;{r.text}&rdquo;
                  </p>
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {chantier.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-sky-400/90" />
                  Sur le chantier
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Photos du journal de suivi (avancement, contrôles, livraison).
                </p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
              {chantier.map((url, i) => (
                <button
                  key={`chantier-${i}`}
                  type="button"
                  onClick={() => setLightbox(url)}
                  className="group relative shrink-0 w-[min(85vw,320px)] aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80"
                >
                  <Image
                    src={url}
                    alt={`Chantier — photo ${i + 1}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="320px"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-90" />
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90">
                    {i + 1}/{chantier.length}
                  </span>
                  <ZoomIn className="pointer-events-none absolute bottom-2 right-2 w-4 h-4 text-white/70" />
                </button>
              ))}
            </div>
          </section>
        )}

        {pairCount > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-amber-400/80" />
                  Avant / après
                </h2>
                <p className="text-sm text-gray-500">
                  Comparez les photos jumelées — cliquez pour agrandir.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {Array.from({ length: pairCount }).map((_, i) => (
                <motion.div
                  key={`pair-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-0 md:rounded-2xl md:overflow-hidden md:border md:border-white/10 md:bg-black/20"
                >
                  <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl md:rounded-none border border-white/10 md:border-0">
                    <button
                      type="button"
                      onClick={() => setLightbox(avant[i]!)}
                      className="absolute inset-0 z-10 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset"
                      aria-label={`Agrandir photo avant ${i + 1}`}
                    />
                    <Image
                      src={avant[i]!}
                      alt={`Avant travaux — vue ${i + 1}`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80" />
                    <figcaption className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4">
                      <span className="rounded-md bg-black/55 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200/95 border border-white/10">
                        Avant
                      </span>
                      <ZoomIn className="w-4 h-4 text-white/70" />
                    </figcaption>
                  </figure>
                  <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl md:rounded-none border border-emerald-500/25 md:border-0 md:border-l md:border-l-white/10">
                    <button
                      type="button"
                      onClick={() => setLightbox(apres[i]!)}
                      className="absolute inset-0 z-10 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-inset"
                      aria-label={`Agrandir photo après ${i + 1}`}
                    />
                    <Image
                      src={apres[i]!}
                      alt={`Après travaux — vue ${i + 1}`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/40 to-transparent opacity-90" />
                    <figcaption className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4">
                      <span className="rounded-md bg-emerald-950/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100 border border-emerald-400/25">
                        Après
                      </span>
                      <ZoomIn className="w-4 h-4 text-emerald-200/80" />
                    </figcaption>
                  </figure>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {(extraAvant.length > 0 || extraApres.length > 0) && (
          <div className="grid gap-10 sm:grid-cols-2">
            {extraAvant.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-200/80">
                  Autres vues — avant
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {extraAvant.map((url, i) => (
                    <button
                      key={`xav-${i}`}
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <Image
                        src={url}
                        alt={`Avant ${pairCount + i + 1}`}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="25vw"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
            {extraApres.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200/80">
                  Autres vues — après
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {extraApres.map((url, i) => (
                    <button
                      key={`xap-${i}`}
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <Image
                        src={url}
                        alt={`Après ${pairCount + i + 1}`}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="25vw"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {pairCount === 0 && avant.length === 0 && apres.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">
            Aucune photo pour cette fiche pour le moment.
          </p>
        )}

        {pairCount === 0 && (avant.length > 0 || apres.length > 0) && (
          <div className="grid gap-10 md:grid-cols-2">
            {avant.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-amber-200/90">
                  Avant travaux
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {avant.map((url, i) => (
                    <button
                      key={`av-${i}`}
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <Image
                        src={url}
                        alt={`Avant ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
            {apres.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-emerald-200/90">
                  Après travaux
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {apres.map((url, i) => (
                    <button
                      key={`ap-${i}`}
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <Image
                        src={url}
                        alt={`Après ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Aperçu photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <motion.button
              type="button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-4 right-4 z-[110] rounded-full bg-white/10 p-3 text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </motion.button>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative max-h-[90vh] max-w-[min(1200px,96vw)] w-full aspect-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[min(85vh,800px)]">
                <Image
                  src={lightbox}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              <p className="mt-3 text-center text-xs text-gray-500">
                Échap ou clic en dehors pour fermer
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
