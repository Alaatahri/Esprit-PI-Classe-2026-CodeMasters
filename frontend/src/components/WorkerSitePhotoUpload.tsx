"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Loader2, Send, ImagePlus } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-base";

const DEFAULT_API = getApiBaseUrl();

type UploadResult =
  | {
      kind: "advancement";
      percent: number;
      previousMax: number;
      reason?: string;
    }
  | {
      kind: "no_advancement";
      percent: number;
      previousMax: number;
      reason?: string;
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
  const [result, setResult] = useState<UploadResult | null>(null);

  const pickFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setError(null);
    setResult(null);
  };

  const readBase64 = useCallback((f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        const raw = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve(raw);
      };
      reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
      reader.readAsDataURL(f);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Choisissez une image.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const base = apiBaseUrl.replace(/\/$/, "");

    try {
      const photoBase64 = await readBase64(file);
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
            ai?: { percent?: number; reason?: string };
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
      const proposed = Number(data?.ai?.percent ?? 0);
      const finalPct = Number(
        data?.suivi?.progressPercent ?? data?.suivi?.pourcentage_avancement ?? proposed,
      );

      if (proposed > previous) {
        setResult({
          kind: "advancement",
          percent: Number.isFinite(finalPct) ? finalPct : proposed,
          previousMax: previous,
          reason: data?.ai?.reason,
        });
      } else {
        setResult({
          kind: "no_advancement",
          percent: Number.isFinite(finalPct) ? finalPct : previous,
          previousMax: previous,
          reason: data?.ai?.reason,
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
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Camera className="w-4 h-4 text-amber-300" />
        Envoyer une photo du chantier
      </div>
      <p className="text-xs text-gray-400">
        L&apos;image est analysée automatiquement (gratuit : sans clé API, le serveur
        utilise une estimation locale). Formats courants : JPG, PNG, WebP.
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

      <div>
        <label className="block text-[11px] text-gray-400 mb-1">
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          disabled={loading}
          placeholder="Ex. : dalle coulée zone salon…"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50"
        />
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
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100 space-y-1">
          <p className="font-semibold">
            ✅ Avancement détecté : {Math.round(result.percent)}% d&apos;avancement
            atteint.
          </p>
          {result.reason ? (
            <p className="text-xs text-emerald-200/80">{result.reason}</p>
          ) : null}
        </div>
      ) : null}

      {result?.kind === "no_advancement" ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm text-amber-100 space-y-1">
          <p className="font-semibold">
            ⚠️ Aucune progression détectée (avancement actuel :{" "}
            {Math.round(result.percent)}%).
          </p>
          {result.reason ? (
            <p className="text-xs text-amber-200/80">{result.reason}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
