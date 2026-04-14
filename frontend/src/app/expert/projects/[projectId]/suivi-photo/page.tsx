"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { isExpertAreaUser } from "@/lib/roles";
import { getApiBaseUrl } from "@/lib/api-base";
import { WorkerSitePhotoUpload } from "@/components/WorkerSitePhotoUpload";
import { SuiviTimeline } from "@/components/SuiviTimeline";

const API_URL = getApiBaseUrl();

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
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const fromQ = searchParams.get("from") ?? "projets";
  const hubHref = `/expert/projects/${encodeURIComponent(projectId)}?from=${encodeURIComponent(fromQ)}`;

  const [user, setUser] = useState<BMPUser | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loadProject, setLoadProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const u = getStoredUser();
    if (!u || !isExpertAreaUser(u.role)) {
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

  if (user && !isExpertAreaUser(user.role)) {
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
          href={hubHref}
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dossier
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
            <Link
              href={`/expert/projects/${projectId}/photos?from=${encodeURIComponent(fromQ)}`}
              className="mb-4 inline-flex text-xs font-medium text-emerald-400/90 hover:text-emerald-300 hover:underline"
            >
              + Ajouter des photos à la galerie avant / après du projet
            </Link>

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

            {user ? (
              <WorkerSitePhotoUpload
                projectId={project._id}
                workerId={user._id}
                apiBaseUrl={API_URL}
              />
            ) : null}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white mb-2">
                Journal de suivi
              </h3>
              <SuiviTimeline projectId={project._id} apiBaseUrl={API_URL} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
