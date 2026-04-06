"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FolderKanban,
  Loader2,
  MessageCircle,
  ClipboardList,
  Send,
} from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type ProjectRow = {
  _id: string;
  titre: string;
  description?: string;
  statut?: string;
  avancement_global?: number;
  expertFeedback?: string;
  clientId?: string | { _id?: string };
  applications?: Array<{
    _id?: string;
    artisanId?: string | { _id?: string };
    statut?: string;
  }>;
};

function refId(ref: unknown): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && ref !== null && "_id" in ref) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
}

export default function ExpertProjetsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [feedbackByProject, setFeedbackByProject] = useState<
    Record<string, string>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const user = getStoredUser();

  const load = useCallback(async () => {
    const u = getStoredUser();
    if (!u || normalizeRole(u.role) !== "expert") return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `${API_URL}/projects/expert/${encodeURIComponent(u._id)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Impossible de charger les projets.");
      const data = (await res.json()) as ProjectRow[];
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      const fb: Record<string, string> = {};
      for (const p of list) {
        if (p.expertFeedback) fb[p._id] = p.expertFeedback;
      }
      setFeedbackByProject(fb);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (normalizeRole(u.role) !== "expert") {
      router.replace("/espace");
      return;
    }
    void load();
  }, [load, router]);

  const saveFeedback = async (projectId: string) => {
    const u = getStoredUser();
    if (!u) return;
    const text = (feedbackByProject[projectId] ?? "").trim();
    if (!text) return;
    setSavingId(projectId);
    setSaveOk(null);
    try {
      const res = await fetch(
        `${API_URL}/projects/${projectId}/expert/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": u._id,
          },
          body: JSON.stringify({ text }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          typeof j.message === "string" ? j.message : `Erreur ${res.status}`,
        );
      }
      setSaveOk(projectId);
      setTimeout(() => setSaveOk(null), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSavingId(null);
    }
  };

  if (!user || normalizeRole(user.role) !== "expert") {
    return (
      <div className="max-w-lg mx-auto text-center py-16 text-gray-400">
        Accès réservé aux experts.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-500/15 border border-amber-500/35 p-3">
            <FolderKanban className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mes projets</h1>
            <p className="text-sm text-gray-500 mt-1">
              Ouvrez un dossier pour proposition, photos et suivi.
            </p>
          </div>
        </div>
        <Link
          href="/espace/expert"
          className="text-sm text-amber-400/90 hover:text-amber-300"
        >
          ← Espace expert
        </Link>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-amber-400/80" />
        </div>
      ) : projects.length === 0 ? (
        <p className="text-center text-gray-500 py-16">
          Aucun projet ne vous est encore assigné en tant qu&apos;expert.
        </p>
      ) : (
        <ul className="space-y-6">
          {projects.map((p) => {
            const clientId = refId(p.clientId);
            const acceptedApp = p.applications?.find(
              (a) => a.statut === "acceptee",
            );
            const artisanId = acceptedApp
              ? refId(acceptedApp.artisanId)
              : "";

            return (
              <li
                key={p._id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/expert/projects/${encodeURIComponent(p._id)}?from=projets`}
                        className="text-lg font-semibold text-white hover:text-amber-200 transition"
                      >
                        {p.titre}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.statut ?? "—"} · Avancement{" "}
                        {p.avancement_global ?? 0}%
                      </p>
                      <Link
                        href={`/expert/projects/${encodeURIComponent(p._id)}?from=projets`}
                        className="mt-2 inline-flex text-xs font-medium text-amber-300/90 hover:underline"
                      >
                        Ouvrir le dossier →
                      </Link>
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {p.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {clientId && (
                      <Link
                        href={`/messages/${clientId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-500/20"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contacter le client
                      </Link>
                    )}
                    {artisanId && (
                      <Link
                        href={`/messages/${artisanId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                      >
                        <Send className="w-4 h-4" />
                        Contacter l&apos;artisan
                      </Link>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <ClipboardList className="w-4 h-4" />
                      Feedback / note de suivi (visible côté données projet)
                    </div>
                    <textarea
                      value={feedbackByProject[p._id] ?? ""}
                      onChange={(e) =>
                        setFeedbackByProject((prev) => ({
                          ...prev,
                          [p._id]: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Synthèse, points d’attention, recommandations…"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => saveFeedback(p._id)}
                        disabled={
                          savingId === p._id ||
                          !(feedbackByProject[p._id] ?? "").trim()
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-medium text-amber-100 hover:bg-amber-500/30 disabled:opacity-40"
                      >
                        {savingId === p._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        Enregistrer le feedback
                      </button>
                      {saveOk === p._id && (
                        <span className="text-xs text-emerald-400">
                          Enregistré.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
