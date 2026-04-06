"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Images,
  Loader2,
  Plus,
  Upload,
  AlertCircle,
} from "lucide-react";
import { getStoredUser, normalizeRole, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { FieldError, fieldTextareaClass } from "@/lib/form-ui";
import {
  parseImageUrls,
  validateExpertPhotoUrlsText,
  validateImageFilesList,
} from "@/lib/validators";

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

function expertIdString(p: Project): string | null {
  const e = p.expertId;
  if (!e) return null;
  if (typeof e === "string") return e;
  return e._id ? String(e._id) : null;
}

export default function ExpertProjectPhotosPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const fromQ = searchParams.get("from") ?? "projets";
  const hubHref = `/expert/projects/${encodeURIComponent(projectId)}?from=${encodeURIComponent(fromQ)}`;

  const [user, setUser] = useState<BMPUser | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loadProject, setLoadProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [album, setAlbum] = useState<"apres" | "avant">("apres");
  const [urlsText, setUrlsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [urlsInputError, setUrlsInputError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filesInputError, setFilesInputError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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
      const urlErr = validateExpertPhotoUrlsText(urlsText);
      if (urlErr) {
        setUrlsInputError(urlErr);
        return;
      }
      setUrlsInputError(null);
      const urls = parseImageUrls(urlsText);

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

  const onUpload = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const u = getStoredUser();
      if (!u || normalizeRole(u.role) !== "expert") {
        setUploadError("Session invalide.");
        return;
      }
      const files = uploadFiles ? Array.from(uploadFiles) : [];
      const fileErr = validateImageFilesList(files);
      if (fileErr) {
        setFilesInputError(fileErr);
        return;
      }
      setFilesInputError(null);

      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      try {
        const fd = new FormData();
        fd.append("album", album);
        for (const f of files) fd.append("files", f);

        const res = await fetch(
          `${API_URL}/projects/${projectId}/expert/photos/upload`,
          {
            method: "POST",
            headers: { "x-user-id": u._id },
            body: fd,
          },
        );

        const data = (await res.json().catch(() => null)) as
          | { message?: unknown }
          | Project
          | null;

        if (!res.ok) {
          const raw =
            data && typeof data === "object"
              ? (data as { message?: unknown }).message
              : undefined;
          const msg = Array.isArray(raw)
            ? raw.join(" ")
            : typeof raw === "string"
              ? raw
              : `Erreur ${res.status}`;
          throw new Error(msg);
        }

        setUploadSuccess(
          `${files.length} image(s) uploadée(s) dans « ${album === "avant" ? "Avant travaux" : "Après travaux"} ».`,
        );
        setUploadFiles(null);

        const resP = await fetch(`${API_URL}/projects/${projectId}`, {
          cache: "no-store",
        });
        if (resP.ok) setProject((await resP.json()) as Project);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Échec de l’upload.",
        );
      } finally {
        setUploading(false);
      }
    },
    [album, projectId, uploadFiles],
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
          href={hubHref}
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dossier
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
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/expert/projects/${projectId}/suivi-photo?from=${encodeURIComponent(fromQ)}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                Uploader une photo (avancement)
              </Link>
              <a
                href="#ajout-urls"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-95"
              >
                <Plus className="w-4 h-4" />
                Ajouter à la galerie (URLs)
              </a>
            </div>

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
              noValidate
              onSubmit={onUpload}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4"
            >
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-300" />
                Uploader des images (fichiers)
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Sélectionnez une ou plusieurs images depuis votre appareil. Elles
                seront hébergées par le backend et visibles dans le détail du
                projet.
              </p>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="album-upload"
                    checked={album === "apres"}
                    onChange={() => setAlbum("apres")}
                    className="text-amber-500"
                  />
                  <span className="text-sm text-gray-200">Après travaux</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="album-upload"
                    checked={album === "avant"}
                    onChange={() => setAlbum("avant")}
                    className="text-amber-500"
                  />
                  <span className="text-sm text-gray-200">Avant travaux</span>
                </label>
              </div>

              <input
                id="expert-photos-files"
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                aria-invalid={filesInputError ? "true" : "false"}
                aria-describedby={
                  filesInputError ? "expert-photos-files-err" : undefined
                }
                onChange={(e) => {
                  setFilesInputError(null);
                  setUploadFiles(e.target.files);
                }}
                className={`block w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-2 file:text-amber-100 hover:file:bg-amber-500/30 border ${
                  filesInputError
                    ? "border-red-400/55"
                    : "border-white/10"
                }`}
              />
              <FieldError id="expert-photos-files-err" message={filesInputError ?? undefined} />

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold px-4 py-2.5 text-sm hover:opacity-95 transition disabled:opacity-40 w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Upload…
                  </>
                ) : (
                  "Uploader"
                )}
              </button>

              {uploadError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {uploadError}
                </div>
              ) : null}
              {uploadSuccess ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {uploadSuccess}
                </div>
              ) : null}
            </form>

            <form
              noValidate
              onSubmit={onSubmit}
              id="ajout-urls"
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
                <label
                  htmlFor="expert-photo-urls"
                  className="block text-[11px] text-gray-400 mb-1"
                >
                  URLs des images
                </label>
                <textarea
                  id="expert-photo-urls"
                  value={urlsText}
                  onChange={(e) => {
                    setUrlsInputError(null);
                    setUrlsText(e.target.value);
                  }}
                  rows={5}
                  disabled={submitting}
                  maxLength={50000}
                  aria-invalid={urlsInputError ? "true" : "false"}
                  aria-describedby={
                    urlsInputError ? "expert-photo-urls-err" : undefined
                  }
                  className={`${fieldTextareaClass(!!urlsInputError, submitting)} font-mono text-xs bg-black/40 placeholder:text-gray-600`}
                  placeholder={
                    "https://images.unsplash.com/photo-...\nhttps://..."
                  }
                />
                <FieldError id="expert-photo-urls-err" message={urlsInputError ?? undefined} />
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
                href={`/expert/projects/${projectId}/suivi-photo?from=${encodeURIComponent(fromQ)}`}
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
