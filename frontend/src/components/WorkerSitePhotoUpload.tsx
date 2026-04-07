"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Send, ImagePlus } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-base";
import { FieldError, fieldTextareaClass } from "@/lib/form-ui";
import { fileToBase64 } from "@/lib/imageUtils";
import { validateImageFile, validatePhotoComment } from "@/lib/validators";

const DEFAULT_API = getApiBaseUrl();

type UploadResult =
  | {
      kind: "advancement";
      percent: number;
      previousMax: number;
      reason?: string;
      hasDelay?: boolean;
      delayReason?: string | null;
    }
  | {
      kind: "no_advancement";
      percent: number;
      previousMax: number;
      reason?: string;
      hasDelay?: boolean;
      delayReason?: string | null;
    };

type Props = {
  projectId: string;
  workerId: string;
  apiBaseUrl?: string;
};

/**
 * Formulaire d’envoi de photo de chantier vers `POST /api/suivi/photo`.
 * Affiche chargement, puis message d’avancement ou d’absence de progression.
 *
 * @param projectId Identifiant Mongo du projet
 * @param workerId Identifiant Mongo de l’ouvrier / artisan connecté
 * @param apiBaseUrl Base API (défaut: NEXT_PUBLIC_API_URL)
 */
export function WorkerSitePhotoUpload({
  projectId,
  workerId,
  apiBaseUrl = DEFAULT_API,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const pickFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setFileError(f ? validateImageFile(f) : null);
    setResult(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    setCommentError(null);
    const fe = validateImageFile(file);
    const ce = validatePhotoComment(comment);
    if (fe) setFileError(fe);
    if (ce) setCommentError(ce);
    if (fe || ce) return;
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const base = apiBaseUrl.replace(/\/$/, "");

    try {
      const photoBase64 = await fileToBase64(file);
      const photoUrl = `inline-upload-${Date.now()}`;

      const res = await fetch(`${base}/suivi/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          workerId,
          photoUrl,
          photoBase64,
          comment: comment.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            ai?: {
              percent?: number;
              reason?: string;
              hasProgression?: boolean;
              hasDelay?: boolean;
              delayReason?: string | null;
            };
            currentMaxBefore?: number;
            suivi?: { progressPercent?: number; pourcentage_avancement?: number };
            message?: string;
          }
        | null;

      if (!res.ok) {
        const raw = data && typeof data === "object" ? (data as { message?: unknown }).message : undefined;
        const msg = Array.isArray(raw)
          ? raw.join(" ")
          : typeof raw === "string"
            ? raw
            : `Erreur ${res.status}`;
        throw new Error(msg || "Envoi refusé par le serveur");
      }

      const previous = Number(data?.currentMaxBefore ?? 0);
      const finalPct = Number(
        data?.suivi?.progressPercent ??
          data?.suivi?.pourcentage_avancement ??
          data?.ai?.percent ??
          previous,
      );
      const safeFinal = Number.isFinite(finalPct) ? finalPct : previous;
      const hasDelay = data?.ai?.hasDelay === true;
      const delayReason =
        typeof data?.ai?.delayReason === "string" ? data.ai.delayReason : null;

      if (safeFinal > previous) {
        setResult({
          kind: "advancement",
          percent: safeFinal,
          previousMax: previous,
          reason: data?.ai?.reason,
          hasDelay,
          delayReason,
        });
      } else {
        setResult({
          kind: "no_advancement",
          percent: safeFinal,
          previousMax: previous,
          reason: data?.ai?.reason,
          hasDelay,
          delayReason,
        });
      }

      setFile(null);
      setComment("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l’envoi de la photo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Camera className="w-4 h-4 text-amber-300" />
        Envoyer une photo du chantier
      </div>
      <p className="text-xs text-gray-400">
        L&apos;image est envoyée en JPEG redimensionné (max 1024px) pour l&apos;analyse.
        Avec clé API Anthropic côté serveur : analyse visuelle ; sinon l&apos;avancement
        actuel est conservé sans hausse artificielle. Formats : JPG, PNG, WebP.
      </p>

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
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/20 transition disabled:opacity-50"
        >
          <ImagePlus className="w-4 h-4" />
          Choisir une image
        </button>
        {file ? (
          <span className="text-xs text-gray-300 self-center truncate max-w-[220px]">
            {file.name}
          </span>
        ) : (
          <span className="text-xs text-gray-500 self-center">
            Aucun fichier sélectionné
          </span>
        )}
      </div>
      <FieldError id="err-ws-file" message={fileError ?? undefined} />

      <div>
        <label htmlFor="ws-comment" className="block text-[11px] text-gray-400 mb-1">
          Commentaire (optionnel)
        </label>
        <textarea
          id="ws-comment"
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setCommentError(null);
          }}
          rows={2}
          maxLength={2000}
          disabled={loading}
          placeholder="Ex. : dalle coulée zone salon…"
          aria-invalid={!!commentError}
          aria-describedby={commentError ? "err-ws-comment" : undefined}
          className={fieldTextareaClass(!!commentError, loading)}
        />
        <FieldError id="err-ws-comment" message={commentError ?? undefined} />
      </div>

      <button
        type="submit"
        disabled={loading || !file}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold px-4 py-2.5 text-sm hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en cours…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Envoyer et analyser
          </>
        )}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {result?.kind === "advancement" ? (
        <div
          className={`rounded-xl px-3 py-3 text-sm space-y-1 ${
            result.hasDelay
              ? "border border-red-400/40 bg-red-950/40 text-red-100"
              : "border border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {result.hasDelay ? (
            <p className="font-semibold">⚠️ Retard ou perturbation détecté</p>
          ) : null}
          <p className="font-semibold">
            ✅ Avancement : {Math.round(result.percent)}% atteint sur le projet.
          </p>
          {result.reason ? (
            <p
              className={`text-xs ${
                result.hasDelay ? "text-red-200/90" : "text-emerald-200/80"
              }`}
            >
              {result.reason}
            </p>
          ) : null}
          {result.hasDelay && result.delayReason ? (
            <p className="text-xs text-red-200/90 mt-1">{result.delayReason}</p>
          ) : null}
          {result.hasDelay ? (
            <p className="text-xs text-red-300/80 mt-1">
              Le client et l&apos;admin ont été notifiés automatiquement.
            </p>
          ) : null}
        </div>
      ) : null}

      {result?.kind === "no_advancement" ? (
        <div
          className={`rounded-xl px-3 py-3 text-sm space-y-1 ${
            result.hasDelay
              ? "border border-red-400/40 bg-red-950/40 text-red-100"
              : "border border-amber-500/35 bg-amber-500/10 text-amber-100"
          }`}
        >
          {result.hasDelay ? (
            <p className="font-semibold">⚠️ Retard ou perturbation détecté</p>
          ) : (
            <p className="font-semibold">Analyse IA</p>
          )}
          <p className="font-semibold">
            Avancement inchangé : {Math.round(result.percent)}%.
          </p>
          {result.reason ? (
            <p
              className={`text-xs ${
                result.hasDelay ? "text-red-200/90" : "text-amber-200/80"
              }`}
            >
              {result.reason}
            </p>
          ) : null}
          {result.hasDelay && result.delayReason ? (
            <p className="text-xs text-red-200/90 mt-1">{result.delayReason}</p>
          ) : null}
          {result.hasDelay ? (
            <p className="text-xs text-red-300/80 mt-1">
              Le client et l&apos;admin ont été notifiés automatiquement.
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
