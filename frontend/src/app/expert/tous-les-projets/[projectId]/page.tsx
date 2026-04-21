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
  FileText,
  ImageIcon,
  Paperclip,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { isExpertAreaUser } from "@/lib/roles";
import { getApiBaseUrl } from "@/lib/api-base";
import { readApiErrorMessage } from "@/lib/api-error";
import { resolveMediaUrl } from "@/lib/backend-public-url";

const API_URL = getApiBaseUrl();

type UserBrief = {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  role?: string;
  competences?: string[];
  rating?: number;
  experienceYears?: number;
};

type ProjectReport = {
  _id?: string;
  titre?: string;
  description?: string;
  categorie?: string;
  ville?: string;
  adresse?: string;
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
  avancement_global?: number;
  preferences_materiaux?: string;
  exigences_techniques?: string;
  pieces_jointes?: string[];
  photos_site?: string[];
  clientId?: UserBrief | string;
  expertId?: UserBrief | string;
  expertComment?: string;
  expertFeedback?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MatchingReq = {
  _id: string;
  status: string;
  matchScore?: number;
  requiredCompetences?: string[];
  sentAt?: string;
  expiresAt?: string;
  respondedAt?: string;
  expertId?: UserBrief;
};

type ProposalRow = {
  _id: string;
  proposedPrice: number;
  estimatedDurationDays: number;
  technicalNotes: string;
  materialSuggestions?: string;
  status: string;
  createdAt?: string;
  expertId?: UserBrief;
};

type ReportPayload = {
  project: ProjectReport | null;
  matchingRequests: MatchingReq[];
  proposals: ProposalRow[];
};

function personLabel(u?: UserBrief | string): string {
  if (!u || typeof u === "string") return typeof u === "string" ? u : "—";
  const n = [u.prenom, u.nom].filter(Boolean).join(" ").trim();
  return n || u.email || "—";
}

function roleLabel(role?: string): string {
  if (!role) return "—";
  const r = role.toLowerCase();
  if (r === "admin") return "Administrateur";
  if (r === "expert") return "Expert";
  if (r === "client") return "Client";
  if (r === "artisan") return "Artisan";
  return role;
}

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

export default function ExpertProjetRapportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";

  const [data, setData] = useState<ReportPayload | null>(null);
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
    if (!projectId) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${API_URL}/matching/expert/catalog/${encodeURIComponent(projectId)}`,
          { headers: { "x-user-id": u._id }, cache: "no-store" },
        );
        if (!res.ok) {
          throw new Error(
            await readApiErrorMessage(
              res,
              res.status === 404 ? "Projet introuvable." : `Erreur ${res.status}`,
            ),
          );
        }
        setData((await res.json()) as ReportPayload);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erreur");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, router]);

  const p = data?.project;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
        <Link
          href="/expert/tous-les-projets"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Tous les projets
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            {err}
          </div>
        ) : !p ? (
          <p className="text-gray-400">Aucune donnée.</p>
        ) : (
          <>
            <header className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-amber-400/80">
                Rapport de dossier
              </p>
              <h1 className="text-2xl font-bold text-white">{p.titre}</h1>
              <div className="flex flex-wrap gap-2 text-xs">
                {p.statut ? (
                  <span className="px-2 py-0.5 rounded-full border border-white/15 bg-white/5">
                    {p.statut}
                  </span>
                ) : null}
                {p.requestStatus ? (
                  <span className="px-2 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-200">
                    {p.requestStatus}
                  </span>
                ) : null}
                {typeof p.avancement_global === "number" ? (
                  <span className="px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
                    Avancement {p.avancement_global}%
                  </span>
                ) : null}
              </div>
            </header>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-300" />
                Client
              </h2>
              <dl className="grid gap-2 text-sm">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-gray-500">Nom</dt>
                  <dd className="text-gray-200">
                    {personLabel(
                      typeof p.clientId === "object" ? p.clientId : undefined,
                    )}
                  </dd>
                </div>
                {typeof p.clientId === "object" && p.clientId?.email ? (
                  <div>
                    <span className="text-gray-500">E-mail · </span>
                    <span className="text-gray-300">{p.clientId.email}</span>
                  </div>
                ) : null}
                {typeof p.clientId === "object" && p.clientId?.telephone ? (
                  <div>
                    <span className="text-gray-500">Téléphone · </span>
                    <span className="text-gray-300">{p.clientId.telephone}</span>
                  </div>
                ) : null}
                <div>
                  <span className="text-gray-500">Rôle · </span>
                  <span className="text-gray-200">
                    {typeof p.clientId === "object"
                      ? roleLabel(p.clientId.role)
                      : "—"}
                  </span>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-300" />
                Expert assigné sur la fiche
              </h2>
              {p.expertId ? (
                <dl className="text-sm space-y-2">
                  <div>
                    <span className="text-gray-500">Identité · </span>
                    <span className="text-emerald-200/95">
                      {personLabel(
                        typeof p.expertId === "object" ? p.expertId : undefined,
                      )}
                    </span>
                  </div>
                  {typeof p.expertId === "object" && p.expertId.email ? (
                    <div>
                      <span className="text-gray-500">E-mail · </span>
                      {p.expertId.email}
                    </div>
                  ) : null}
                  <div>
                    <span className="text-gray-500">Rôle · </span>
                    {typeof p.expertId === "object"
                      ? roleLabel(p.expertId.role)
                      : "Expert"}
                  </div>
                  {typeof p.expertId === "object" &&
                  (p.expertId.competences?.length ?? 0) > 0 ? (
                    <div className="text-xs text-gray-400">
                      Compétences :{" "}
                      {(p.expertId.competences ?? []).join(", ")}
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun expert n’est encore assigné sur ce dossier.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Description & besoin</h2>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {p.description ?? "—"}
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-400">
                {p.categorie ? (
                  <div>
                    Catégorie :{" "}
                    <span className="text-gray-200">{p.categorie}</span>
                  </div>
                ) : null}
                {p.urgence ? (
                  <div>
                    Urgence :{" "}
                    <span className="text-gray-200">{p.urgence}</span>
                  </div>
                ) : null}
                {p.ville ? (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {p.ville}
                    {p.adresse ? ` · ${p.adresse}` : ""}
                  </div>
                ) : null}
                {p.type_batiment ? (
                  <div>Type bâtiment : {p.type_batiment}</div>
                ) : null}
                {p.surface_m2 != null ? (
                  <div>Surface : {p.surface_m2} m²</div>
                ) : null}
                <div className="flex items-center gap-1 sm:col-span-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {fmtDate(p.date_debut)} → {fmtDate(p.date_fin_prevue)}
                </div>
                <div className="sm:col-span-2">
                  Budget :{" "}
                  {p.budget_min != null || p.budget_max != null ? (
                    <>
                      {p.budget_min != null
                        ? `${Math.round(p.budget_min).toLocaleString("fr-FR")} `
                        : ""}
                      {p.budget_min != null && p.budget_max != null ? "– " : ""}
                      {p.budget_max != null
                        ? `${Math.round(p.budget_max).toLocaleString("fr-FR")} TND`
                        : p.budget_estime != null
                          ? `${Math.round(p.budget_estime).toLocaleString("fr-FR")} TND (estimé)`
                          : "—"}
                    </>
                  ) : p.budget_estime != null ? (
                    `${Math.round(p.budget_estime).toLocaleString("fr-FR")} TND`
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              {p.preferences_materiaux ? (
                <div>
                  <p className="text-[11px] uppercase text-gray-500 mb-1">
                    Préférences matériaux
                  </p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {p.preferences_materiaux}
                  </p>
                </div>
              ) : null}
              {p.exigences_techniques ? (
                <div>
                  <p className="text-[11px] uppercase text-gray-500 mb-1">
                    Exigences techniques
                  </p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {p.exigences_techniques}
                  </p>
                </div>
              ) : null}
            </section>

            {(p.pieces_jointes?.length ?? 0) > 0 ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-300" />
                  Pièces jointes
                </h2>
                <ul className="space-y-2 text-sm break-all">
                  {(p.pieces_jointes ?? []).map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(p.photos_site?.length ?? 0) > 0 ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-300" />
                  Photos du site (client)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(p.photos_site ?? []).map((url, i) => {
                    const src = resolveMediaUrl(url);
                    return (
                    <a
                      key={i}
                      href={src || url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src || url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </a>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-300" />
                Invitations matching (experts contactés)
              </h2>
              {!data?.matchingRequests?.length ? (
                <p className="text-sm text-gray-500">
                  Aucune invitation envoyée (matching non lancé ou en erreur à la
                  création).
                </p>
              ) : (
                <div className="space-y-3">
                  {data.matchingRequests.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            r.status === "accepted"
                              ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
                              : r.status === "refused"
                                ? "border-red-500/30 bg-red-500/10 text-red-200"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                          }`}
                        >
                          {r.status === "accepted"
                            ? "Acceptée"
                            : r.status === "refused"
                              ? "Refusée"
                              : "En attente"}
                        </span>
                        {typeof r.matchScore === "number" ? (
                          <span className="text-xs text-gray-500">
                            Score {r.matchScore.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-gray-200">
                        {personLabel(r.expertId)}{" "}
                        {r.expertId?.role ? (
                          <span className="text-gray-500">
                            ({roleLabel(r.expertId.role)})
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Envoyé {fmtDate(r.sentAt)}
                        {r.respondedAt
                          ? ` · Réponse ${fmtDate(r.respondedAt)}`
                          : ""}
                      </p>
                      {(r.requiredCompetences?.length ?? 0) > 0 ? (
                        <p className="text-xs text-gray-400 mt-2">
                          Compétences cibles :{" "}
                          {(r.requiredCompetences ?? []).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">
                Propositions commerciales
              </h2>
              {!data?.proposals?.length ? (
                <p className="text-sm text-gray-500">Aucune proposition.</p>
              ) : (
                <div className="space-y-4">
                  {data.proposals.map((pr) => (
                    <div
                      key={pr._id}
                      className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm space-y-2"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="text-amber-200 font-semibold">
                          {Math.round(pr.proposedPrice).toLocaleString("fr-FR")}{" "}
                          TND
                        </span>
                        <span className="text-gray-400">
                          {pr.estimatedDurationDays} j ·{" "}
                          <span className="text-gray-500">{pr.status}</span>
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        Par {personLabel(pr.expertId)}{" "}
                        {pr.expertId?.role
                          ? `(${roleLabel(pr.expertId.role)})`
                          : ""}
                      </p>
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {pr.technicalNotes}
                      </p>
                      {pr.materialSuggestions ? (
                        <p className="text-xs text-gray-500">
                          Matériaux : {pr.materialSuggestions}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {(p.expertComment || p.expertFeedback) && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-2 text-sm">
                {p.expertComment ? (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase mb-1">
                      Commentaire expert (vitrine)
                    </p>
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {p.expertComment}
                    </p>
                  </div>
                ) : null}
                {p.expertFeedback ? (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase mb-1">
                      Retour expert dossier
                    </p>
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {p.expertFeedback}
                    </p>
                  </div>
                ) : null}
              </section>
            )}

            <p className="text-[11px] text-gray-500">
              Création : {fmtDate(p.createdAt)} · Mise à jour :{" "}
              {fmtDate(p.updatedAt)}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/expert/projects/${encodeURIComponent(projectId)}/proposition`}
                className="inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Proposition
              </Link>
              <Link
                href={`/expert/projects/${encodeURIComponent(projectId)}/photos`}
                className="inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Photos projet
              </Link>
              <Link
                href={`/expert/projects/${encodeURIComponent(projectId)}/suivi-photo`}
                className="inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Suivi photo
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
