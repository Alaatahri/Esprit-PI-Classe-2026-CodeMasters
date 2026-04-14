"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { bmpAuthHeaders } from "@/lib/api-user-headers";
import { refId } from "@/lib/project-refs";

const API_URL = getApiBaseUrl();

type Project = {
  _id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin_prevue: string;
  statut: string;
  avancement_global: number;
  clientId: string;
  expertId?: unknown;
  applications?: Array<{
    artisanId?: unknown;
    statut?: string;
  }>;
};

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

export default function ClientSuiviListPage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (u.role !== "client") {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/projects`, {
          cache: "no-store",
          headers: bmpAuthHeaders(u),
        });
        if (!res.ok) throw new Error("Impossible de charger les projets.");
        const data = (await res.json()) as Project[];
        const mine = (Array.isArray(data) ? data : []).filter(
          (p) => String(p.clientId) === String(u._id),
        );
        mine.sort((a, b) => {
          const da = a.date_debut ? new Date(a.date_debut).getTime() : 0;
          const db = b.date_debut ? new Date(b.date_debut).getTime() : 0;
          return db - da;
        });
        setProjects(mine);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Erreur lors du chargement.",
        );
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (user && user.role !== "client") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-16">
        <p className="text-gray-400">Cette page est réservée aux clients.</p>
        <Link href="/espace" className="text-amber-400 hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/espace/client"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;espace client
        </Link>
        <div className="flex items-start gap-3 mt-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
            <Camera className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Suivre l&apos;avancement de mes projets
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Cliquez sur un projet pour voir le taux d&apos;avancement global et
              les photos de suivi enregistrées sur le chantier.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-sm text-gray-500">
          Vous n&apos;avez pas encore de projet. Créez-en un depuis l&apos;espace
          client.
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => {
            const expertOid = refId(p.expertId);
            const accepted = p.applications?.find(
              (a) => a.statut === "acceptee",
            );
            const artisanOid = accepted ? refId(accepted.artisanId) : "";
            const inProgress =
              p.statut === "En cours" ||
              p.statut === "En attente" ||
              p.statut === "Terminé";

            return (
              <li key={p._id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <Link
                  href={`/espace/client/suivi/${p._id}`}
                  className="group flex items-center gap-4 px-4 py-4 transition hover:bg-white/[0.07]"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-medium text-white line-clamp-1 group-hover:text-amber-200">
                      {p.titre}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {p.date_debut
                          ? new Date(p.date_debut).toLocaleDateString("fr-FR")
                          : "—"}{" "}
                        →{" "}
                        {p.date_fin_prevue
                          ? new Date(p.date_fin_prevue).toLocaleDateString("fr-FR")
                          : "—"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          p.statut === "Terminé"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : p.statut === "En cours"
                            ? "bg-blue-500/15 text-blue-300"
                            : "bg-gray-500/15 text-gray-300"
                        }`}
                      >
                        {p.statut}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden max-w-[200px]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                          style={{
                            width: `${clampPct(p.avancement_global ?? 0)}%`,
                          }}
                        />
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {clampPct(p.avancement_global ?? 0)}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 shrink-0" />
                </Link>
                {inProgress && (expertOid || artisanOid) ? (
                  <div className="flex flex-wrap gap-2 px-4 pb-4 pt-0 border-t border-white/5">
                    <span className="text-[10px] text-gray-500 w-full pt-2">
                      Messages
                    </span>
                    {expertOid ? (
                      <Link
                        href={`/messages/${expertOid}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 hover:bg-sky-500/20"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Expert
                      </Link>
                    ) : null}
                    {artisanOid ? (
                      <Link
                        href={`/messages/${artisanOid}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-medium text-violet-200 hover:bg-violet-500/20"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Artisan
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
