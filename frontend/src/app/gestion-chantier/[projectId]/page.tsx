"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { getStoredUser, normalizeRole, type BMPUser } from "@/lib/auth";
import { WorkerSitePhotoUpload } from "@/components/WorkerSitePhotoUpload";
import { SuiviTimeline } from "@/components/SuiviTimeline";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type Project = {
  _id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin_prevue: string;
  budget_estime: number;
  statut: string;
  avancement_global: number;
  createdAt?: string;
};

function clampPct(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function canAccessChantier(role: string | undefined) {
  const r = normalizeRole(role);
  return r === "admin" || r === "artisan" || r === "ouvrier";
}

export default function GestionChantierProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [user, setUser] = useState<BMPUser | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const run = async () => {
      const u = getStoredUser();
      if (!u || !canAccessChantier(u.role)) {
        setLoading(false);
        setAllowed(false);
        setError("Accès réservé aux équipes chantier (admin, artisan, ouvrier).");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (normalizeRole(u.role) === "admin") {
          const res = await fetch(`${API_URL}/projects/${projectId}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error("Projet introuvable.");
          setProject((await res.json()) as Project);
          setAllowed(true);
          return;
        }

        const [resProject, resList] = await Promise.all([
          fetch(`${API_URL}/projects/${projectId}`, { cache: "no-store" }),
          fetch(`${API_URL}/projects/artisan/${u._id}`, { cache: "no-store" }),
        ]);

        if (!resProject.ok) throw new Error("Projet introuvable.");
        const p = (await resProject.json()) as Project;

        if (!resList.ok) {
          throw new Error("Impossible de vérifier vos projets assignés.");
        }
        const list = (await resList.json()) as Project[];
        const ids = new Set(
          (Array.isArray(list) ? list : []).map((x) => String(x._id)),
        );
        if (!ids.has(String(p._id))) {
          setAllowed(false);
          setError("Ce projet ne fait pas partie de vos chantiers assignés.");
          setProject(null);
          return;
        }

        setProject(p);
        setAllowed(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement.");
        setProject(null);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [projectId]);

  useEffect(() => {
    if (!getStoredUser()) router.replace("/login");
  }, [router]);

  if (!user && loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (user && !canAccessChantier(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-gray-300">Accès non autorisé.</p>
          <Link href="/gestion-chantier" className="text-amber-400 hover:underline">
            Retour gestion chantier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-950/95 via-blue-950/30 to-gray-950/95" />
      <div className="relative z-10 container mx-auto px-4 py-10 sm:py-12 max-w-3xl">
        <Link
          href="/gestion-chantier"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Détail du chantier
            </h1>
            <p className="text-sm text-gray-400">
              Photo de suivi et journal pour votre équipe.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : error && !project ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : project && allowed ? (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white line-clamp-2">
                {project.titre}
              </h2>
              <p className="text-sm text-gray-400 line-clamp-4">
                {project.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-300">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {project.date_debut
                    ? new Date(project.date_debut).toLocaleDateString("fr-FR")
                    : "—"}{" "}
                  →{" "}
                  {project.date_fin_prevue
                    ? new Date(project.date_fin_prevue).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  {clampPct(project.avancement_global)}% avancement
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                  style={{ width: `${clampPct(project.avancement_global)}%` }}
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

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                Journal de suivi
              </h3>
              <SuiviTimeline projectId={project._id} apiBaseUrl={API_URL} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
