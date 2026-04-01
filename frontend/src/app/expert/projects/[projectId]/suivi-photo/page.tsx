"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  Send,
  ImagePlus,
} from "lucide-react";
import { getStoredUser, normalizeRole, type BMPUser } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Project = {
  _id: string;
  titre: string;
  description?: string;
  avancement_global?: number;
  statut?: string;
};

function clampPct(n: unknown) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return 0;
  return Math.min(100, Math.max(0, x));
}

export default function ExpertSuiviPhotoPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<BMPUser | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loadProject, setLoadProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultAdvancement, setResultAdvancement] = useState<{
    kind: "yes" | "no";
    percent: number;
    reason?: string;
  } | null>(null);

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
        setProject((await res.json()) as Project);
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

  const pickFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setSubmitError(null);
    setResultAdvancement(null);
  };

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const u = getStoredUser();
      if (!u || normalizeRole(u.role) !== "expert") {
        setSubmitError("Session invalide.");
        return;
      }
      if (!file) {
        setSubmitError("Choisissez une image.");
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      setResultAdvancement(null);

      const fd = new FormData();
      fd.append("projectId", projectId);
      fd.append("workerId", u._id);
      fd.append("photo", file);
      if (comment.trim()) fd.append("comment", comment.trim());

      try {
        const res = await fetch(`${API_URL}/suivi/photo`, {
          method: "POST",
          body: fd,
        });

        const data = (await res.json().catch(() => null)) as
          | {
              ai?: { percent?: number; reason?: string };
              currentMaxBefore?: number;
              suivi?: {
                progressPercent?: number;
                pourcentage_avancement?: number;
              };
              message?: unknown;
            }
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

        const previous = Number(data?.currentMaxBefore ?? 0);
        const proposed = Number(data?.ai?.percent ?? 0);
        const finalPct = Number(
          data?.suivi?.progressPercent ??
            data?.suivi?.pourcentage_avancement ??
            proposed,
        );

        if (proposed > previous) {
          setResultAdvancement({
            kind: "yes",
            percent: clampPct(finalPct),
            reason:
              typeof data?.ai?.reason === "string" ? data.ai.reason : undefined,
          });
        } else {
          setResultAdvancement({
            kind: "no",
            percent: clampPct(finalPct),
            reason:
              typeof data?.ai?.reason === "string" ? data.ai.reason : undefined,
          });
        }

        setFile(null);
        setComment("");
        if (inputRef.current) inputRef.current.value = "";

        const resP = await fetch(`${API_URL}/projects/${projectId}`, {
          cache: "no-store",
        });
        if (resP.ok) {
          setProject((await resP.json()) as Project);
        }
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Échec de l’envoi. Vérifiez que l’API accepte le multipart (étape backend).",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [comment, file, projectId],
  );

  if (user && normalizeRole(user.role) !== "expert") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <p className="text-gray-400">Accès réservé aux experts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Link
          href="/espace/expert"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;espace expert
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">
          Suivi photo du chantier
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Envoyez une photo pour analyse automatique de l&apos;avancement.
        </p>

        {loadProject ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : projectError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {projectError}
          </div>
        ) : project ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-8 space-y-3">
              <p className="text-lg font-semibold text-white">{project.titre}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Avancement global
                </span>
                <span className="text-amber-300 font-semibold tabular-nums">
                  {clampPct(project.avancement_global)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all"
                  style={{
                    width: `${clampPct(project.avancement_global)}%`,
                  }}
                />
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Camera className="w-4 h-4 text-amber-300" />
                📷 Envoyer une photo du chantier
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={pickFile}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/20 transition disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  Choisir une image
                </button>
                {file ? (
                  <span className="text-xs text-gray-300 self-center truncate">
                    {file.name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 self-center">
                    Aucun fichier sélectionné
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50"
                  placeholder="Ex. : finitions salon, zone humide…"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !file}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold px-4 py-2.5 text-sm hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    🔍 Analyse en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer et analyser
                  </>
                )}
              </button>

              {submitError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {submitError}
                </div>
              ) : null}

              {resultAdvancement?.kind === "yes" ? (
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100 space-y-1">
                  <p className="font-semibold">
                    ✅ Avancement détecté : {Math.round(resultAdvancement.percent)}%
                  </p>
                  {resultAdvancement.reason ? (
                    <p className="text-xs text-emerald-200/80">
                      {resultAdvancement.reason}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {resultAdvancement?.kind === "no" ? (
                <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm text-amber-100 space-y-1">
                  <p className="font-semibold">
                    ⚠️ Aucune progression détectée (avancement actuel :{" "}
                    {Math.round(resultAdvancement.percent)}%).
                  </p>
                  {resultAdvancement.reason ? (
                    <p className="text-xs text-amber-200/80">
                      {resultAdvancement.reason}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
