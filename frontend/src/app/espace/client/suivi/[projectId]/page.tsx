"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ImageIcon,
  Loader2,
  Percent,
  MessageCircle,
  FileText,
  CheckCircle2,
  Download,
  Upload,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";
import { refId } from "@/lib/project-refs";
import {
  type ClientContractRow,
  parseContractFromApiBody,
  parseContractRow,
} from "@/lib/contract-api";
import { readJsonSafe } from "@/lib/read-json-safe";
import { publicFileUrl, resolveMediaUrl } from "@/lib/backend-public-url";
import { downloadContractPdf, uploadClientSignedPdf } from "@/lib/contract-files";

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
  clientId: string | { _id?: string };
  expertId?: unknown;
  applications?: Array<{
    artisanId?: unknown;
    statut?: string;
  }>;
};

type SuiviEntry = {
  _id: string;
  date_suivi: string;
  description_progression: string;
  pourcentage_avancement: number;
  photo_url?: string;
  photoUrl?: string;
  progressPercent?: number;
  progressIndex?: number;
  createdAt?: string;
};

type ProposalRow = {
  _id: string;
  proposedPrice: number;
  estimatedDurationDays: number;
  technicalNotes: string;
  materialSuggestions?: string;
  status: string;
  createdAt?: string;
};

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

function clientIdFromProject(p: Project): string {
  const c = p.clientId;
  if (c && typeof c === "object" && "_id" in c) return String((c as { _id: unknown })._id);
  return String(c ?? "");
}

export default function ClientSuiviDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [user, setUser] = useState<BMPUser | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [suivis, setSuivis] = useState<SuiviEntry[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [contract, setContract] = useState<ClientContractRow | null>(null);
  const [contractErr, setContractErr] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [pendingClientPdf, setPendingClientPdf] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const run = async () => {
      const u = getStoredUser();
      if (!u || u.role !== "client") {
        setLoading(false);
        setError("Accès réservé aux clients connectés.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const resP = await fetch(`${API_URL}/projects/${projectId}`, {
          cache: "no-store",
        });
        if (!resP.ok) {
          throw new Error("Projet introuvable.");
        }
        const pRaw = await readJsonSafe(resP);
        const p = pRaw && typeof pRaw === "object" ? (pRaw as Project) : null;
        if (!p) {
          throw new Error("Réponse projet invalide.");
        }
        if (clientIdFromProject(p) !== String(u._id)) {
          setError("Ce projet ne fait pas partie de vos chantiers.");
          setProject(null);
          setSuivis([]);
          return;
        }
        setProject(p);

        // Propositions + contrat (best effort)
        try {
          const [resProp, resContract] = await Promise.all([
            fetch(`${API_URL}/proposals/by-project/${encodeURIComponent(projectId)}`, { cache: "no-store" }),
            fetch(`${API_URL}/contracts/by-project/${encodeURIComponent(projectId)}`, { cache: "no-store" }),
          ]);
          const propsRaw = await readJsonSafe(resProp);
          const props =
            resProp.ok && Array.isArray(propsRaw) ? (propsRaw as ProposalRow[]) : [];
          setProposals(props);
          if (resContract.ok) {
            const raw = await readJsonSafe(resContract);
            setContract(parseContractFromApiBody(raw));
            setContractErr(null);
          } else {
            setContract(null);
            setContractErr(null);
          }
        } catch {
          setProposals([]);
          setContract(null);
          setContractErr(null);
        }

        const resS = await fetch(
          `${API_URL}/suivi-projects?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        const suiviRaw = await readJsonSafe(resS);
        const raw = resS.ok && Array.isArray(suiviRaw) ? (suiviRaw as SuiviEntry[]) : [];
        const list = Array.isArray(raw) ? raw : [];
        list.sort((a, b) => {
          const ta = new Date(a.date_suivi || a.createdAt || 0).getTime();
          const tb = new Date(b.date_suivi || b.createdAt || 0).getTime();
          return tb - ta;
        });
        setSuivis(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement.");
        setProject(null);
        setSuivis([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [projectId]);

  const signContract = async () => {
    const u = getStoredUser();
    if (!u || u.role !== "client" || !contract?._id) return;
    setContractErr(null);
    try {
      const res = await fetch(
        `${API_URL}/contracts/${encodeURIComponent(contract._id)}/sign`,
        { method: "POST", headers: { "x-user-id": u._id } },
      );
      const data = await readJsonSafe(res);
      if (!res.ok) {
        const raw = data && typeof data === "object" ? (data as { message?: unknown }).message : undefined;
        const msg = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      const c = parseContractRow(data);
      if (c) setContract(c);
    } catch (e) {
      setContractErr(e instanceof Error ? e.message : "Erreur");
    }
  };

  const handleDownloadPdf = async () => {
    const u = getStoredUser();
    if (!u || !contract?._id) return;
    setPdfBusy(true);
    setContractErr(null);
    try {
      await downloadContractPdf(API_URL, contract._id, u._id);
    } catch (e) {
      setContractErr(e instanceof Error ? e.message : "Erreur PDF.");
    } finally {
      setPdfBusy(false);
    }
  };

  const confirmClientUploadPdf = async () => {
    const u = getStoredUser();
    const file = pendingClientPdf;
    if (!file || !contract?._id || !u) return;
    setUploadBusy(true);
    setContractErr(null);
    try {
      const c = await uploadClientSignedPdf(API_URL, contract._id, u._id, file);
      setContract(c);
      setPendingClientPdf(null);
    } catch (e2) {
      setContractErr(e2 instanceof Error ? e2.message : "Erreur envoi.");
    } finally {
      setUploadBusy(false);
    }
  };

  const clientPdfHref = contract?.clientSignedPdfUrl
    ? publicFileUrl(contract.clientSignedPdfUrl)
    : null;
  const canSignDigital = Boolean(contract && !contract.clientSignedAt);

  useEffect(() => {
    if (user === null && typeof window !== "undefined") {
      const u = getStoredUser();
      if (!u) router.replace("/login");
    }
  }, [user, router]);

  if (!user && loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (user && user.role !== "client") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-16">
        <p className="text-gray-400">Cette page est réservée aux clients.</p>
        <Link
          href="/espace"
          className="text-amber-400 hover:underline"
        >
          Retour à l&apos;espace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/espace/client/suivi"
          className="inline-flex items-center gap-2 text-sm text-amber-400/90 hover:text-amber-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au suivi de mes projets
        </Link>
        <Link
          href="/espace/client"
          className="block text-xs text-gray-500 hover:text-gray-400 mb-2"
        >
          ← Espace client
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : project ? (
        <>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-white">{project.titre}</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {project.date_debut
                  ? new Date(project.date_debut).toLocaleDateString("fr-FR")
                  : "—"}{" "}
                →{" "}
                {project.date_fin_prevue
                  ? new Date(project.date_fin_prevue).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${
                  project.statut === "Terminé"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : project.statut === "En cours"
                    ? "bg-blue-500/15 text-blue-300"
                    : "bg-gray-500/15 text-gray-300"
                }`}
              >
                {project.statut}
              </span>
            </div>
          </header>

          {(() => {
            const expertOid = refId(project.expertId);
            const accepted = project.applications?.find(
              (a) => a.statut === "acceptee",
            );
            const artisanOid = accepted ? refId(accepted.artisanId) : "";
            if (!expertOid && !artisanOid) return null;
            return (
              <section className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                  Échanger avec l&apos;équipe
                </h2>
                <p className="text-xs text-gray-500">
                  Ouvrez une conversation avec votre expert ou l&apos;artisan
                  assigné au chantier.
                </p>
                <div className="flex flex-wrap gap-2">
                  {expertOid ? (
                    <Link
                      href={`/messages/${expertOid}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-200 hover:bg-sky-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message à l&apos;expert
                    </Link>
                  ) : null}
                  {artisanOid ? (
                    <Link
                      href={`/messages/${artisanOid}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message à l&apos;artisan
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          })()}

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Proposition & contrat
              </h2>
              <Link
                href={`/espace/client/acceptation/${encodeURIComponent(projectId)}`}
                className="text-xs font-semibold text-amber-300 hover:underline"
              >
                Ouvrir la page d&apos;acceptation
              </Link>
            </div>

            {contractErr ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {contractErr}
              </div>
            ) : null}

            {contract ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Contrat: {contract.status}
                  </span>
                  <span className="text-gray-500">
                    Client signé: {contract.clientSignedAt ? "oui" : "non"} · Expert signé:{" "}
                    {contract.expertSignedAt ? "oui" : "non"}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap text-[11px] text-gray-200/90 rounded-xl border border-white/10 bg-black/30 p-3 max-h-56 overflow-auto scrollbar-bmp">
{contract.contractText}
                </pre>
                <p className="text-[11px] text-gray-500">
                  PDF officiel, envoi du scan signé, ou signature électronique ci-dessous.
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    disabled={pdfBusy}
                    onClick={() => void handleDownloadPdf()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40"
                  >
                    {pdfBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    PDF
                  </button>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 cursor-pointer hover:bg-emerald-500/20">
                    <input
                      type="file"
                      accept="application/pdf,.pdf,application/octet-stream"
                      className="hidden"
                      disabled={uploadBusy}
                      onChange={(ev) => {
                        setPendingClientPdf(ev.target.files?.[0] ?? null);
                      }}
                    />
                    <Upload className="w-3.5 h-3.5" />
                    Choisir PDF
                  </label>
                  <button
                    type="button"
                    disabled={!pendingClientPdf || uploadBusy}
                    onClick={() => void confirmClientUploadPdf()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/90 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
                  >
                    {uploadBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Valider
                  </button>
                </div>
                {pendingClientPdf ? (
                  <p className="text-[11px] text-gray-500">{pendingClientPdf.name}</p>
                ) : null}
                {clientPdfHref ? (
                  <p className="text-[11px] text-gray-500">
                    Fichier signé :{" "}
                    <a href={clientPdfHref} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline">
                      ouvrir
                    </a>
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={!canSignDigital}
                  onClick={() => void signContract()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-xs font-semibold text-gray-900 hover:opacity-95 disabled:opacity-40"
                >
                  Signer électroniquement (client)
                </button>
              </div>
            ) : proposals.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  Résumé des propositions — pour accepter, contre-proposer ou annuler le projet, utilisez la page
                  dédiée (bouton ci-dessus).
                </p>
                {proposals.slice(0, 5).map((p) => (
                  <div
                    key={p._id}
                    className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        Prix:{" "}
                        <span className="text-amber-200 font-semibold">
                          {Math.round(p.proposedPrice).toLocaleString("fr-FR")} TND
                        </span>{" "}
                        · Durée:{" "}
                        <span className="text-gray-200 font-semibold">
                          {p.estimatedDurationDays} j
                        </span>
                      </span>
                      <span className="text-gray-500">{p.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.status === "countered"
                        ? "Négociation en cours — en attente de l’expert."
                        : p.status === "sent"
                          ? "En attente de votre réponse sur la page d’acceptation."
                          : `Statut : ${p.status}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Aucune proposition pour le moment. Dès que l’expert envoie une proposition, elle apparaîtra ici.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                Avancement global du chantier
              </h2>
              <span className="text-2xl font-bold text-amber-300 tabular-nums">
                {clampPct(project.avancement_global ?? 0)}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all"
                style={{
                  width: `${clampPct(project.avancement_global ?? 0)}%`,
                }}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              Photos et points de suivi
            </h2>
            {suivis.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucune photo de suivi enregistrée pour ce projet pour le moment.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-1">
                {suivis.map((s) => {
                  const pct =
                    typeof s.progressPercent === "number"
                      ? s.progressPercent
                      : s.pourcentage_avancement;
                  const photoRaw = s.photoUrl || s.photo_url;
                  const photo = photoRaw ? resolveMediaUrl(photoRaw) : "";
                  const dateStr = s.date_suivi
                    ? new Date(s.date_suivi).toLocaleString("fr-FR")
                    : "—";
                  return (
                    <article
                      key={s._id}
                      className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden"
                    >
                      <div className="aspect-video sm:aspect-[21/9] bg-gray-900 relative">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt="Suivi chantier"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                            Aucune image
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{dateStr}</span>
                            <span className="font-semibold text-amber-300">
                              {pct ?? "—"}%
                              {typeof s.progressIndex === "number" && (
                                <span className="text-gray-500 font-normal ml-1">
                                  (#{s.progressIndex})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {s.description_progression}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
