"use client";

import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-base";

const DEFAULT_API = getApiBaseUrl();

export type SuiviEntry = {
  _id: string;
  date_suivi: string;
  description_progression: string;
  pourcentage_avancement: number;
  cout_actuel?: number;
  photo_url?: string;
  photoUrl?: string;
  progressPercent?: number;
  progressIndex?: number;
  createdAt?: string;
};

type Props = {
  projectId: string;
  apiBaseUrl?: string;
  className?: string;
};

/**
 * Bloc repliable : charge et affiche les entrées `suiviprojects` pour un projet.
 */
export function SuiviTimeline({
  projectId,
  apiBaseUrl = DEFAULT_API,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<SuiviEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${apiBaseUrl.replace(/\/$/, "")}/suivi-projects?projectId=${encodeURIComponent(projectId)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Chargement impossible");
      const data = (await res.json()) as SuiviEntry[];
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => {
        const ta = new Date(a.date_suivi || a.createdAt || 0).getTime();
        const tb = new Date(b.date_suivi || b.createdAt || 0).getTime();
        return tb - ta;
      });
      setEntries(list);
    } catch {
      setError("Impossible de charger le journal de suivi.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, projectId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && entries === null) {
      void load();
    }
  };

  return (
    <div className={`rounded-xl border border-white/10 bg-black/25 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-xs text-amber-200/90 hover:bg-white/5 rounded-xl transition"
      >
        <span className="inline-flex items-center gap-2 font-medium">
          {open ? (
            <ChevronDown className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0" />
          )}
          Journal de suivi (points de contrôle)
        </span>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/10">
          {error && (
            <p className="text-[11px] text-red-300/90 px-1">{error}</p>
          )}
          {!loading && !error && entries && entries.length === 0 && (
            <p className="text-[11px] text-gray-500 px-1">Aucune entrée pour l’instant.</p>
          )}
          {entries && entries.length > 0 && (
            <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {entries.map((s) => {
                const pct =
                  typeof s.progressPercent === "number"
                    ? s.progressPercent
                    : s.pourcentage_avancement;
                const photo = s.photoUrl || s.photo_url;
                return (
                  <li
                    key={s._id}
                    className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-gray-300">
                      <span>
                        {s.date_suivi
                          ? new Date(s.date_suivi).toLocaleString("fr-FR")
                          : "—"}
                      </span>
                      <span className="text-amber-200 font-semibold">
                        {pct ?? "—"}%
                        {typeof s.progressIndex === "number" && (
                          <span className="text-gray-500 font-normal">
                            {" "}
                            · #{s.progressIndex}
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-gray-400 leading-snug line-clamp-3">
                      {s.description_progression}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>
                        Coût:{" "}
                        {typeof s.cout_actuel === "number"
                          ? `${s.cout_actuel.toLocaleString("fr-FR")} TND`
                          : "—"}
                      </span>
                      {photo ? (
                        <a
                          href={photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400/90 hover:underline"
                        >
                          Photo
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
