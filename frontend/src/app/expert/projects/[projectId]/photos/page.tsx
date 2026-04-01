"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Images,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { getStoredUser, normalizeRole, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type Project = {
  _id: string;
  titre: string;
  description?: string;
  statut?: string;
  expertId?: string | { _id?: string };
  photosAvant?: string[];
  photosApres?: string[];
};

function parseUrls(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

function expertIdString(p: Project): string | null {
  const e = p.expertId;
  if (!e) return null;
  if (typeof e === "string") return e;
  return e._id ? String(e._id) : null;
}

export default function ExpertProjectPhotosPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [user, setUser] = useState<BMPUser | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loadProject, setLoadProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [album, setAlbum] = useState<"apres" | "avant">("apres");
  const [urlsText, setUrlsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const u = getStoredUser();
    if (!u || normalizeRole(u.role) !== "expert") {
      setLoadProject(false);
      setProjectError("Accès réservé aux experts connectés.");
      return;
    }

    (async () => {
      setLoadProject(true);
      setProjectError(null);
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Projet introuvable.");
        const data = (await res.json()) as Project;
        const exp = expertIdString(data);
        if (!exp) {
          setProjectError(
            "Ce projet n’a pas d’expert assigné — impossible d’ajouter des photos depuis cette fiche.",
          );
          setProject(null);
          return;
        }
        if (exp !== u._id) {
          setProjectError(
            "Vous n’êtes pas l’expert assigné à ce projet — ajout de photos impossible.",
          );
          setProject(null);
          return;
        }
        setProject(data);
      } catch (e) {
        setProjectError(
          e instanceof Error ? e.message : "Impossible de charger le projet.",
        );
        setProject(null);
      } finally {
        setLoadProject(false);
      }
    })();
  }, [projectId]);

  useEffect(() => {
    if (!getStoredUser()) router.replace("/login");
  }, [router]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const u = getStoredUser();
      if (!u || normalizeRole(u.role) !== "expert") {
        setSubmitError("Session invalide.");
        return;
      }
      const urls = parseUrls(urlsText);
      if (urls.length === 0) {
        setSubmitError(
          "Indiquez au moins une URL commençant par http:// ou https:// (une par ligne).",
        );
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      setSuccess(null);

      try {
        const res = await fetch(`${API_URL}/projects/${projectId}/expert/photos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": u._id,
          },
          body: JSON.stringify({ urls, album }),
        });

        const data = (await res.json().catch(() => null)) as
          | { message?: unknown }
          | null;

        if (!res.ok) {
          const raw = data && typeof data === "object" ? data.message : undefined;
          const msg = Array.isArray(raw)
            ? raw.join(" ")
            : typeof raw === "string"
              ? raw
              : `Erreur ${res.status}`;
          throw new Error(msg);
        }

        setUrlsText("");
        setSuccess(
          `${urls.length} photo(s) ajoutée(s) à l’album « ${album === "avant" ? "Avant travaux" : "Après travaux"} ».`,
        );
        const resP = await fetch(`${API_URL}/projects/${projectId}`, {
          cache: "no-store",
        });
        if (resP.ok) {
          setProject((await resP.json()) as Project);
        }
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Échec de l’enregistrement.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [album, projectId, urlsText],
  );

  if (user && normalizeRole(user.role) !== "expert") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <p className="text-gray-400">Accès réservé aux experts.</p>
      </div>
    );
  }

  const avant = project?.photosAvant?.filter(Boolean) ?? [];
  const apres = project?.photosApres?.filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link
          href="/espace/expert"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;espace expert
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Images className="w-7 h-7 text-amber-400" />
          Photos du projet
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Ajoutez des images à la fiche projet (galerie avant / après), visibles
          sur la vitrine lorsque le projet est terminé.
        </p>

        {loadProject ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : projectError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            {projectError}
          </div>
        ) : project ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-8 space-y-2">
              <p className="text-lg font-semibold text-white">{project.titre}</p>
              <p className="text-xs text-gray-500">
                Statut :{" "}
                <span className="text-gray-300">{project.statut ?? "—"}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-amber-200/80">
                  Avant
                </p>
                <p className="text-lg font-semibold text-white">{avant.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-200/80">
                  Après
                </p>
                <p className="text-lg font-semibold text-white">{apres.length}</p>
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4"
            >
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-300" />
                Ajouter des photos (URLs)
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Utilisez des liens https vers des images déjà hébergées (ex. votre
                stockage ou CDN). Une URL par ligne.
              </p>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="album"
                    checked={album === "apres"}
                    onChange={() => setAlbum("apres")}
                    className="text-amber-500"
                  />
                  <span className="text-sm text-gray-200">Après travaux</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="album"
                    checked={album === "avant"}
                    onChange={() => setAlbum("avant")}
                    className="text-amber-500"
                  />
                  <span className="text-sm text-gray-200">Avant travaux</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  URLs des images
                </label>
                <textarea
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  rows={5}
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono text-xs"
                  placeholder={
                    "https://images.unsplash.com/photo-...\nhttps://..."
                  }
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold px-4 py-2.5 text-sm hover:opacity-95 transition disabled:opacity-40 w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Ajouter à la galerie"
                )}
              </button>

              {submitError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {submitError}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {success}
                </div>
              ) : null}
            </form>

            {(avant.length > 0 || apres.length > 0) && (
              <div className="mt-10 space-y-6">
                {apres.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-emerald-200/90 mb-3">
                      Aperçu — après travaux
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {apres.slice(0, 6).map((url, i) => (
                        <div
                          key={`ap-${i}`}
                          className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {avant.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-amber-200/90 mb-3">
                      Aperçu — avant travaux
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {avant.slice(0, 6).map((url, i) => (
                        <div
                          key={`av-${i}`}
                          className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="mt-8 text-xs text-gray-500">
              Pour envoyer une photo depuis votre appareil avec analyse
              d&apos;avancement, utilisez aussi{" "}
              <Link
                href={`/expert/projects/${projectId}/suivi-photo`}
                className="text-amber-400/90 hover:underline"
              >
                Suivi photo chantier
              </Link>
              .
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
