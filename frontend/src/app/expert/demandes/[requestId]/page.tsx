"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  User,
  MapPin,
  Calendar,
  ClipboardList,
  BadgeCheck,
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { isExpertAreaUser } from "@/lib/roles";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type PopulatedUser = {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
};

type ProjectDetail = {
  _id?: string;
  titre?: string;
  description?: string;
  ville?: string;
  adresse?: string;
  categorie?: string;
  urgence?: string;
  surface_m2?: number;
  type_batiment?: string;
  budget_estime?: number;
  budget_min?: number;
  budget_max?: number;
  date_debut?: string;
  date_fin_prevue?: string;
  statut?: string;
  requestStatus?: string;
  clientId?: PopulatedUser | string;
  expertId?: PopulatedUser | string;
  createdAt?: string;
};

type RequestDetail = {
  _id: string;
  status: "pending" | "accepted" | "refused";
  matchScore?: number;
  requiredCompetences?: string[];
  sentAt?: string;
  expiresAt?: string;
  respondedAt?: string;
  expertId?: PopulatedUser;
  isExpired?: boolean;
};

type ApiDetail = {
  request: RequestDetail;
  project: ProjectDetail | null;
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function userName(u: PopulatedUser | string | undefined): string {
  if (!u || typeof u === "string") return typeof u === "string" ? u : "—";
  const n = [u.prenom, u.nom].filter(Boolean).join(" ").trim();
  return n || u.email || "—";
}

export default function ExpertDemandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId =
    typeof params?.requestId === "string" ? params.requestId : "";

  const [data, setData] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (!isExpertAreaUser(u.role)) {
      router.replace("/espace");
      return;
    }
    if (!requestId) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${API_URL}/matching/my-requests/${encodeURIComponent(requestId)}`,
          { headers: { "x-user-id": u._id }, cache: "no-store" },
        );
        if (!res.ok) {
          if (res.status === 404) throw new Error("Demande introuvable.");
          throw new Error(`Erreur ${res.status}`);
        }
        setData((await res.json()) as ApiDetail);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erreur");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId, router]);

  const projectId =
    data?.project?._id != null ? String(data.project._id) : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        <Link
          href="/expert/nouveaux-projets"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Invitations
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        ) : data ? (
          <>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {data.project?.titre ?? "Demande de matching"}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Fiche demande · invitation personnalisée
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-amber-200/90 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4" />
                Statut de l&apos;invitation
              </h2>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">État</dt>
                  <dd className="text-white font-medium capitalize">
                    {(() => {
                      const expired =
                        data.request.status === "pending" &&
                        data.request.expiresAt &&
                        new Date(data.request.expiresAt) <= new Date();
                      if (data.request.status === "pending" && expired) {
                        return "Expirée (sans réponse)";
                      }
                      if (data.request.status === "pending") {
                        return "En attente de réponse";
                      }
                      if (data.request.status === "accepted") return "Acceptée";
                      return "Refusée";
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Qui a répondu</dt>
                  <dd className="text-white font-medium">
                    {data.request.status === "accepted" ||
                    data.request.status === "refused" ? (
                      <>
                        {userName(data.request.expertId)}{" "}
                        <span className="text-gray-500 font-normal">
                          (expert invité)
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Envoyée le</dt>
                  <dd className="text-gray-200">{fmtDate(data.request.sentAt)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Expire le</dt>
                  <dd className="text-gray-200">{fmtDate(data.request.expiresAt)}</dd>
                </div>
                {data.request.respondedAt ? (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Réponse le</dt>
                    <dd className="text-gray-200">
                      {fmtDate(data.request.respondedAt)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-gray-500">Score de matching</dt>
                  <dd className="text-gray-200">
                    {typeof data.request.matchScore === "number"
                      ? data.request.matchScore.toFixed(1)
                      : "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Compétences attendues</dt>
                  <dd className="text-gray-200">
                    {(data.request.requiredCompetences ?? []).join(", ") || "—"}
                  </dd>
                </div>
              </dl>
            </section>

            {data.project ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white">Projet</h2>
                {data.project.description ? (
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {data.project.description}
                  </p>
                ) : null}
                <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-gray-500">Lieu</dt>
                      <dd className="text-gray-200">
                        {[data.project.ville, data.project.adresse]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-gray-500">Catégorie / urgence</dt>
                    <dd className="text-gray-200">
                      {[data.project.categorie, data.project.urgence]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Surface / type</dt>
                    <dd className="text-gray-200">
                      {[
                        data.project.surface_m2 != null
                          ? `${data.project.surface_m2} m²`
                          : null,
                        data.project.type_batiment,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <Calendar className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-gray-500">Budget / dates</dt>
                      <dd className="text-gray-200">
                        {[
                          data.project.budget_estime != null
                            ? `${data.project.budget_estime} TND`
                            : null,
                          data.project.date_debut
                            ? `début ${fmtDate(data.project.date_debut)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <User className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-gray-500">Client</dt>
                      <dd className="text-gray-200">
                        {userName(
                          data.project.clientId as PopulatedUser | undefined,
                        )}
                        {typeof data.project.clientId === "object" &&
                        data.project.clientId?.email ? (
                          <span className="text-gray-500">
                            {" "}
                            · {data.project.clientId.email}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  </div>
                  {data.project.expertId &&
                  typeof data.project.expertId === "object" ? (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">
                        Expert assigné sur le projet
                      </dt>
                      <dd className="text-emerald-200 font-medium">
                        {userName(data.project.expertId)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : (
              <p className="text-sm text-gray-500">Projet non chargé.</p>
            )}

            {projectId ? (
              <Link
                href={`/expert/projects/${encodeURIComponent(projectId)}?from=nouveaux`}
                className="inline-flex rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-95"
              >
                Ouvrir le dossier
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
