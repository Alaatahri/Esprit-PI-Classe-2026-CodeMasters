"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MessageCircle,
  Users,
  ImageIcon,
  Download,
  Upload,
  FileText,
  UserCircle,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { isExpertAreaUser } from "@/lib/roles";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  ExpertProjectDossier,
  type ExpertProjectDossierData,
} from "@/components/expert/ExpertProjectDossier";
import { refId as refIdLib } from "@/lib/project-refs";
import { SafeHtml, isProbablyHtml } from "@/components/SafeHtml";
import {
  type ClientContractRow,
  parseContractFromApiBody,
  parseContractRow,
} from "@/lib/contract-api";
import { readJsonSafe } from "@/lib/read-json-safe";
import { publicFileUrl, resolveMediaUrl } from "@/lib/backend-public-url";
import { downloadContractPdf, uploadExpertSignedPdf } from "@/lib/contract-files";

const API_URL = getApiBaseUrl();

type Project = ExpertProjectDossierData & {
  _id: string;
  titre: string;
  description?: string;
  statut?: string;
  requestStatus?: string;
  avancement_global?: number;
  clientId?: string | { _id?: string };
  expertId?: string | { _id?: string };
  applications?: Array<{
    _id?: unknown;
    artisanId?: unknown;
    statut?: string;
  }>;
};

type ArtisanApplicationRow = {
  applicationId: string;
  artisanId: string;
  label: string;
  statut: string;
};

type MatchingRow = {
  _id: string;
  status: "pending" | "accepted" | "refused";
  isExpired?: boolean;
  expiresAt?: string;
  matchScore?: number;
  projectId?: { _id?: string };
};

type SuiviRow = {
  photo_url?: string;
  photoUrl?: string;
  pourcentage_avancement?: number;
  date_suivi?: string;
  createdAt?: string;
};

type ProposalRow = {
  _id: string;
  status?: string;
  proposedPrice?: number;
  estimatedDurationDays?: number;
  technicalNotes?: string;
  materialSuggestions?: string;
  createdAt?: string;
  clientCounterPrice?: number;
  clientCounterDurationDays?: number;
  clientCounterMessage?: string;
  lastClientCounterSnapshot?: {
    proposedPrice: number;
    estimatedDurationDays: number;
    message: string;
    counteredAt?: string;
  };
};

type UserBrief = { nom?: string; email?: string };

function expertRefId(expertId: unknown): string {
  if (!expertId) return "";
  if (typeof expertId === "string") return expertId;
  if (typeof expertId === "object" && expertId !== null && "_id" in expertId) {
    return String((expertId as { _id: unknown })._id);
  }
  return String(expertId);
}

async function fetchUserBrief(id: string): Promise<UserBrief | null> {
  if (!id) return null;
  try {
    const res = await fetch(`${API_URL}/users/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as UserBrief;
  } catch {
    return null;
  }
}

export default function ExpertProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";

  const projectId =
    typeof params?.projectId === "string" ? params.projectId : "";

  const backHref = useMemo(() => {
    if (from === "nouveaux") return "/expert/nouveaux-projets";
    if (from === "catalog") return "/expert/tous-les-projets";
    return "/expert/projets";
  }, [from]);

  const backLabel = useMemo(() => {
    if (from === "nouveaux") return "Invitations";
    if (from === "catalog") return "Tous les projets";
    return "Mes projets";
  }, [from]);

  const subLink = useCallback(
    (path: string) => {
      const q = from ? `?from=${encodeURIComponent(from)}` : "";
      return `${path}${q}`;
    },
    [from],
  );

  const [project, setProject] = useState<Project | null>(null);
  const [matchingRows, setMatchingRows] = useState<MatchingRow[]>([]);
  const [suivis, setSuivis] = useState<SuiviRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [expertLabel, setExpertLabel] = useState<string | null>(null);
  const [artisanApplications, setArtisanApplications] = useState<
    ArtisanApplicationRow[]
  >([]);
  const [appActionLoadingId, setAppActionLoadingId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [user, setUser] = useState<BMPUser | null>(null);

  const [manualPct, setManualPct] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  const [contract, setContract] = useState<ClientContractRow | null>(null);
  const [contractErr, setContractErr] = useState<string | null>(null);
  const [signingContract, setSigningContract] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [pendingExpertPdf, setPendingExpertPdf] = useState<File | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const load = useCallback(async () => {
    const u = getStoredUser();
    if (!u || !isExpertAreaUser(u.role) || !projectId) return;
    setLoading(true);
    setErr(null);
    setProgressMsg(null);
    try {
      const [resP, resM, resS, resProp, resContract] = await Promise.all([
        fetch(`${API_URL}/projects/${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        }),
        fetch(`${API_URL}/matching/my-requests`, {
          headers: { "x-user-id": u._id },
          cache: "no-store",
        }),
        fetch(
          `${API_URL}/suivi-projects?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        ),
        fetch(
          `${API_URL}/proposals/by-project/${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        ),
        fetch(
          `${API_URL}/contracts/by-project/${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        ),
      ]);
      if (!resP.ok) throw new Error("Projet introuvable.");
      const projRaw = await readJsonSafe(resP);
      const proj =
        projRaw && typeof projRaw === "object" ? (projRaw as Project) : null;
      if (!proj) throw new Error("Réponse projet invalide.");
      setProject(proj);

      if (resM.ok) {
        const rowsRaw = await readJsonSafe(resM);
        const rows = Array.isArray(rowsRaw) ? (rowsRaw as MatchingRow[]) : [];
        setMatchingRows(rows);
      } else {
        setMatchingRows([]);
      }

      const rawSR = await readJsonSafe(resS);
      const rawS = resS.ok && Array.isArray(rawSR) ? (rawSR as SuiviRow[]) : [];
      setSuivis(Array.isArray(rawS) ? rawS : []);

      const rawPR = await readJsonSafe(resProp);
      const rawP =
        resProp.ok && Array.isArray(rawPR) ? (rawPR as ProposalRow[]) : [];
      setProposals(Array.isArray(rawP) ? rawP : []);

      if (resContract.ok) {
        const cRaw = await readJsonSafe(resContract);
        setContract(parseContractFromApiBody(cRaw));
      } else {
        setContract(null);
      }
      setContractErr(null);

      const eid = expertRefId(proj.expertId);
      const expertU = eid ? await fetchUserBrief(eid) : null;
      setExpertLabel(
        expertU ? expertU.nom || expertU.email || eid : eid ? eid : null,
      );
      const apps = proj.applications ?? [];
      const artisanRows: ArtisanApplicationRow[] = [];
      for (const app of apps) {
        const aid = refIdLib(app.artisanId);
        const applicationId = refIdLib(app._id);
        if (!aid || !applicationId) continue;
        const usr = await fetchUserBrief(aid);
        const st = String(app.statut ?? "");
        const label = usr?.nom || usr?.email || aid;
        artisanRows.push({
          applicationId,
          artisanId: aid,
          label,
          statut: st,
        });
      }
      setArtisanApplications(artisanRows);

      setManualPct(
        typeof proj.avancement_global === "number"
          ? String(Math.round(proj.avancement_global))
          : "",
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
      setProject(null);
      setMatchingRows([]);
      setSuivis([]);
      setProposals([]);
      setContract(null);
      setArtisanApplications([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
    void load();
  }, [load, projectId, router]);

  const myRequest = useMemo(() => {
    return matchingRows.find((r) => {
      const pid = r.projectId as { _id?: string } | string | undefined;
      const id =
        typeof pid === "object" && pid && "_id" in pid
          ? String(pid._id)
          : String(pid ?? "");
      return id === projectId;
    });
  }, [matchingRows, projectId]);

  const isAssigned =
    user && project ? expertRefId(project.expertId) === user._id : false;

  const canRespond =
    myRequest?.status === "pending" && !myRequest?.isExpired;

  const counteredProposal = useMemo(
    () => proposals.find((p) => p.status === "countered"),
    [proposals],
  );

  const acceptedProposal = useMemo(
    () => proposals.find((p) => p.status === "accepted"),
    [proposals],
  );

  const sortedProposalsDesc = useMemo(
    () =>
      [...proposals].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [proposals],
  );

  const latestProposal = sortedProposalsDesc[0];

  const handleApplicationDecision = async (
    applicationId: string,
    action: "accept" | "decline",
  ) => {
    const u = getStoredUser();
    if (!u || !isAssigned) return;
    setAppActionLoadingId(applicationId);
    setErr(null);
    try {
      const path = action === "accept" ? "accept" : "decline";
      const res = await fetch(
        `${API_URL}/applications/${encodeURIComponent(applicationId)}/${path}`,
        {
          method: "POST",
          headers: { "x-user-id": u._id },
        },
      );
      const data = await readJsonSafe(res);
      if (!res.ok) {
        const raw =
          data && typeof data === "object"
            ? (data as { message?: unknown }).message
            : undefined;
        const msg = Array.isArray(raw)
          ? raw.join(" ")
          : typeof raw === "string"
            ? raw
            : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur candidature");
    } finally {
      setAppActionLoadingId(null);
    }
  };

  const respond = async (response: "accepted" | "refused") => {
    const u = getStoredUser();
    if (!myRequest || !u) return;
    setResponding(true);
    setErr(null);
    try {
      const res = await fetch(
        `${API_URL}/matching/respond/${encodeURIComponent(myRequest._id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": u._id,
          },
          body: JSON.stringify({ response }),
        },
      );
      const data = (await res.json().catch(() => null)) as
        | { message?: unknown }
        | null;
      if (!res.ok) {
        const raw =
          data && typeof data === "object"
            ? (data as { message?: unknown }).message
            : undefined;
        const msg = Array.isArray(raw)
          ? raw.join(" ")
          : typeof raw === "string"
            ? raw
            : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setResponding(false);
    }
  };

  const submitManualProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = getStoredUser();
    if (!u || !isAssigned || !projectId) return;
    const pct = Number(manualPct.replace(/\D/g, ""));
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setProgressMsg("Indiquez un pourcentage entre 0 et 100.");
      return;
    }
    setSavingProgress(true);
    setProgressMsg(null);
    try {
      const res = await fetch(
        `${API_URL}/projects/${encodeURIComponent(projectId)}/expert/manual-progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": u._id,
          },
          body: JSON.stringify({
            avancement: pct,
            note: manualNote.trim() || undefined,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as
        | { message?: unknown }
        | null;
      if (!res.ok) {
        const raw =
          data && typeof data === "object"
            ? (data as { message?: unknown }).message
            : undefined;
        const msg = Array.isArray(raw)
          ? raw.join(" ")
          : typeof raw === "string"
            ? raw
            : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      setManualNote("");
      setProgressMsg("Avancement enregistré.");
      await load();
    } catch (e2) {
      setProgressMsg(e2 instanceof Error ? e2.message : "Erreur");
    } finally {
      setSavingProgress(false);
    }
  };

  const expertSignContract = async () => {
    const u = getStoredUser();
    if (!u || !contract?._id || !isAssigned) return;
    setSigningContract(true);
    setContractErr(null);
    try {
      const res = await fetch(
        `${API_URL}/contracts/${encodeURIComponent(contract._id)}/sign`,
        { method: "POST", headers: { "x-user-id": u._id } },
      );
      const data = await readJsonSafe(res);
      if (!res.ok) {
        const raw =
          data && typeof data === "object"
            ? (data as { message?: unknown }).message
            : undefined;
        const msg = Array.isArray(raw)
          ? raw.join(" ")
          : typeof raw === "string"
            ? raw
            : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      const c = parseContractRow(data);
      if (c) setContract(c);
    } catch (e) {
      setContractErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSigningContract(false);
    }
  };

  const handleExpertDownloadPdf = async () => {
    const u = getStoredUser();
    if (!u || !contract?._id) return;
    setPdfBusy(true);
    setContractErr(null);
    try {
      await downloadContractPdf(API_URL, contract._id, u._id);
    } catch (e) {
      setContractErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPdfBusy(false);
    }
  };

  const confirmExpertUploadPdf = async () => {
    const u = getStoredUser();
    const file = pendingExpertPdf;
    if (!file || !contract?._id || !u) return;
    setUploadBusy(true);
    setContractErr(null);
    try {
      const c = await uploadExpertSignedPdf(API_URL, contract._id, u._id, file);
      setContract(c);
      setPendingExpertPdf(null);
    } catch (e2) {
      setContractErr(e2 instanceof Error ? e2.message : "Erreur");
    } finally {
      setUploadBusy(false);
    }
  };

  const clientPdfHref = contract?.clientSignedPdfUrl
    ? publicFileUrl(contract.clientSignedPdfUrl)
    : null;
  const expertPdfHref = contract?.expertSignedPdfUrl
    ? publicFileUrl(contract.expertSignedPdfUrl)
    : null;
  const canSignExpertDigital = Boolean(
    contract && !contract.expertSignedAt && isAssigned,
  );

  const clientId = project ? refIdLib(project.clientId) : "";

  const suiviPhotoUrls = useMemo(() => {
    const urls: string[] = [];
    for (const s of suivis) {
      const raw = s.photoUrl || s.photo_url;
      if (typeof raw === "string" && raw.trim()) {
        const resolved = resolveMediaUrl(raw);
        if (resolved) urls.push(resolved);
      }
    }
    return urls.slice(0, 12);
  }, [suivis]);

  const avPct = Math.min(
    100,
    Math.max(0, Math.round(Number(project?.avancement_global ?? 0))),
  );

  /** Contrat signé par le client et l’expert : dossier figé côté négociation. */
  const contractFullySigned = Boolean(
    contract?.clientSignedAt && contract?.expertSignedAt,
  );
  /** Offre commerciale acceptée par le client (proposition statut accepted). */
  const commercialOfferAccepted = Boolean(acceptedProposal);
  /** Plus d’édition de proposition ni de recrutement « pré-contrat » ambigu. */
  const dossierCommercialClos =
    commercialOfferAccepted || contractFullySigned;

  const canRecruitArtisan =
    isAssigned &&
    !contractFullySigned &&
    project?.statut !== "Terminé";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <nav
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4"
          aria-label="Fil d’Ariane expert"
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-400/90 hover:text-amber-300"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <Link
              href="/espace/expert"
              className="hover:text-amber-400/90 transition"
            >
              Tableau de bord
            </Link>
            <span className="text-gray-600" aria-hidden>
              ·
            </span>
            <Link href="/expert/projets" className="hover:text-amber-400/90 transition">
              Mes projets
            </Link>
            <span className="text-gray-600" aria-hidden>
              ·
            </span>
            <Link
              href="/expert/nouveaux-projets"
              className="hover:text-amber-400/90 transition"
            >
              Invitations
            </Link>
          </div>
        </nav>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : err && !project ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        ) : project ? (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-bold leading-tight">{project.titre}</h1>
              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                {project.ville ? <span>{project.ville}</span> : null}
                {project.statut ? (
                  <span className="text-gray-500">· {project.statut}</span>
                ) : null}
                {project.requestStatus ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-gray-300">
                    {project.requestStatus}
                  </span>
                ) : null}
              </div>
            </header>

            {err ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {err}
              </div>
            ) : null}

            {isAssigned && (proposals.length > 0 || contract) ? (
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-300" />
                  <p className="text-sm font-medium text-white">Propositions & contrat</p>
                </div>
                <p className="text-xs text-gray-500">
                  {acceptedProposal
                    ? "Proposition acceptée par le client : seule cette offre fait foi. Le contrat ci-dessous en découle."
                    : "Négociation : vous voyez la demande du client (en cours ou archivée) et votre proposition actuelle."}
                </p>

                {contractErr ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {contractErr}
                  </div>
                ) : null}

                {acceptedProposal ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-black/25 p-4 space-y-3">
                    <p className="text-[11px] uppercase text-emerald-200/90 font-semibold">
                      Proposition retenue (acceptée)
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>
                        Prix:{" "}
                        <span className="text-amber-200 font-semibold">
                          {Math.round(acceptedProposal.proposedPrice ?? 0).toLocaleString("fr-FR")} TND
                        </span>
                      </span>
                      <span>
                        Durée:{" "}
                        <span className="text-gray-200 font-semibold">
                          {acceptedProposal.estimatedDurationDays ?? "—"} j
                        </span>
                      </span>
                      {acceptedProposal.createdAt ? (
                        <span className="text-gray-500">
                          {new Date(acceptedProposal.createdAt).toLocaleString("fr-FR")}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-300 rounded-xl border border-white/5 bg-black/20 p-3">
                      {acceptedProposal.technicalNotes && isProbablyHtml(acceptedProposal.technicalNotes) ? (
                        <SafeHtml html={acceptedProposal.technicalNotes} />
                      ) : (
                        <p className="whitespace-pre-wrap">{acceptedProposal.technicalNotes ?? "—"}</p>
                      )}
                    </div>
                    {acceptedProposal.materialSuggestions ? (
                      <div className="text-xs text-gray-400">
                        <span className="text-gray-500">Matériaux : </span>
                        {isProbablyHtml(acceptedProposal.materialSuggestions) ? (
                          <SafeHtml
                            html={acceptedProposal.materialSuggestions}
                            className="prose prose-invert prose-sm max-w-none inline text-gray-300"
                          />
                        ) : (
                          acceptedProposal.materialSuggestions
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : proposals.length > 0 ? (
                  <div className="space-y-4">
                    {counteredProposal &&
                    counteredProposal.clientCounterPrice != null &&
                    counteredProposal.clientCounterDurationDays != null ? (
                      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 space-y-2">
                        <p className="text-[11px] uppercase text-amber-200 font-semibold">
                          Contre-proposition du client (en cours)
                        </p>
                        <p className="text-xs text-gray-300">
                          Prix souhaité :{" "}
                          <span className="text-amber-200 font-semibold">
                            {Math.round(counteredProposal.clientCounterPrice).toLocaleString("fr-FR")} TND
                          </span>{" "}
                          · Durée :{" "}
                          <span className="text-gray-200 font-semibold">
                            {counteredProposal.clientCounterDurationDays} j
                          </span>
                        </p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {counteredProposal.clientCounterMessage ?? ""}
                        </p>
                      </div>
                    ) : null}

                    {!counteredProposal &&
                    latestProposal?.lastClientCounterSnapshot &&
                    latestProposal.status === "sent" ? (
                      <div className="rounded-xl border border-amber-500/25 bg-black/20 p-4 space-y-2">
                        <p className="text-[11px] uppercase text-amber-200/80 font-semibold">
                          Dernière demande client (archivée après votre révision)
                        </p>
                        <p className="text-xs text-gray-300">
                          Prix :{" "}
                          <span className="text-amber-200 font-semibold">
                            {Math.round(
                              latestProposal.lastClientCounterSnapshot.proposedPrice,
                            ).toLocaleString("fr-FR")}{" "}
                            TND
                          </span>{" "}
                          · Durée :{" "}
                          <span className="text-gray-200 font-semibold">
                            {latestProposal.lastClientCounterSnapshot.estimatedDurationDays} j
                          </span>
                        </p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {latestProposal.lastClientCounterSnapshot.message}
                        </p>
                      </div>
                    ) : null}

                    {latestProposal ? (
                      <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2">
                        <p className="text-[11px] uppercase text-gray-400 font-semibold">
                          Votre proposition affichée au client
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span>
                            Statut :{" "}
                            <span className="text-amber-200/90">{latestProposal.status ?? "—"}</span>
                          </span>
                          {typeof latestProposal.proposedPrice === "number" ? (
                            <span>
                              Prix :{" "}
                              <span className="text-amber-200 font-semibold">
                                {Math.round(latestProposal.proposedPrice).toLocaleString("fr-FR")} TND
                              </span>
                            </span>
                          ) : null}
                          {typeof latestProposal.estimatedDurationDays === "number" ? (
                            <span>
                              Durée :{" "}
                              <span className="text-gray-200 font-semibold">
                                {latestProposal.estimatedDurationDays} j
                              </span>
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm text-gray-300 rounded-xl border border-white/5 bg-black/20 p-3">
                          {latestProposal.technicalNotes && isProbablyHtml(latestProposal.technicalNotes) ? (
                            <SafeHtml html={latestProposal.technicalNotes} />
                          ) : (
                            <p className="whitespace-pre-wrap">{latestProposal.technicalNotes ?? "—"}</p>
                          )}
                        </div>
                        {latestProposal.materialSuggestions ? (
                          <div className="text-xs text-gray-400">
                            <span className="text-gray-500">Matériaux : </span>
                            {isProbablyHtml(latestProposal.materialSuggestions) ? (
                              <SafeHtml
                                html={latestProposal.materialSuggestions}
                                className="prose prose-invert prose-sm max-w-none inline text-gray-300"
                              />
                            ) : (
                              latestProposal.materialSuggestions
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <ul className="space-y-2 text-xs text-gray-500 border-t border-white/10 pt-3">
                      {sortedProposalsDesc.map((pr) => (
                        <li key={pr._id} className="flex flex-wrap gap-x-2">
                          <span className="text-amber-200/80">{pr.status ?? "—"}</span>
                          {typeof pr.proposedPrice === "number"
                            ? `${Math.round(pr.proposedPrice).toLocaleString("fr-FR")} TND`
                            : ""}
                          {pr.createdAt
                            ? ` · ${new Date(pr.createdAt).toLocaleString("fr-FR")}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {contract ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3 mt-2">
                    <p className="text-xs font-semibold text-white inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      Contrat généré
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Client signé : {contract.clientSignedAt ? "oui" : "non"} · Expert signé :{" "}
                      {contract.expertSignedAt ? "oui" : "non"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pdfBusy}
                        onClick={() => void handleExpertDownloadPdf()}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40"
                      >
                        {pdfBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Télécharger PDF
                      </button>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 cursor-pointer hover:bg-emerald-500/20">
                        <input
                          type="file"
                          accept="application/pdf,.pdf,application/octet-stream"
                          className="hidden"
                          disabled={uploadBusy}
                          onChange={(ev) => {
                            const f = ev.target.files?.[0] ?? null;
                            setPendingExpertPdf(f);
                          }}
                        />
                        <Upload className="w-3.5 h-3.5" />
                        Choisir le PDF signé
                      </label>
                      <button
                        type="button"
                        disabled={!pendingExpertPdf || uploadBusy}
                        onClick={() => void confirmExpertUploadPdf()}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/90 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
                      >
                        {uploadBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Valider l&apos;envoi
                      </button>
                    </div>
                    {pendingExpertPdf ? (
                      <p className="text-[11px] text-gray-500">
                        Fichier sélectionné : {pendingExpertPdf.name}
                      </p>
                    ) : null}
                    <div className="text-[11px] text-gray-500 space-y-1">
                      {clientPdfHref ? (
                        <p>
                          PDF client :{" "}
                          <a
                            href={clientPdfHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-300 hover:underline"
                          >
                            ouvrir
                          </a>
                        </p>
                      ) : (
                        <p>PDF client : non reçu pour l’instant.</p>
                      )}
                      {expertPdfHref ? (
                        <p>
                          Votre PDF signé :{" "}
                          <a
                            href={expertPdfHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-300 hover:underline"
                          >
                            ouvrir
                          </a>
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={!canSignExpertDigital || signingContract}
                      onClick={() => void expertSignContract()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-xs font-semibold text-gray-900 hover:opacity-95 disabled:opacity-40"
                    >
                      {signingContract ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signature…
                        </>
                      ) : (
                        "Signer électroniquement (expert)"
                      )}
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <p className="text-sm font-medium text-white inline-flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-300" />
                Équipe & avancement
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[11px] uppercase text-gray-500 mb-1">Expert référent</p>
                  <p className="text-gray-200">
                    {expertLabel ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-gray-500 mb-1">Avancement</p>
                  <p className="text-amber-200 font-semibold tabular-nums">{avPct}%</p>
                  <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden max-w-[220px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                      style={{ width: `${avPct}%` }}
                    />
                  </div>
                </div>
              </div>
              {artisanApplications.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase text-gray-500 mb-1">
                    Candidatures & artisans
                  </p>
                  <ul className="space-y-3">
                    {artisanApplications.map((row) => (
                      <li
                        key={row.applicationId}
                        className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="text-sm text-gray-200 font-medium">
                            {row.label}
                          </span>
                          <span
                            className={`shrink-0 text-[10px] rounded-full px-2 py-0.5 font-medium ${
                              row.statut === "acceptee"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : row.statut === "refusee"
                                  ? "bg-red-500/15 text-red-300"
                                  : "bg-amber-500/15 text-amber-200"
                            }`}
                          >
                            {row.statut === "en_attente"
                              ? "En attente"
                              : row.statut === "acceptee"
                                ? "Acceptée"
                                : row.statut === "refusee"
                                  ? "Refusée"
                                  : row.statut}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/profil/${encodeURIComponent(row.artisanId)}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/35 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-100 hover:bg-sky-500/20"
                          >
                            <UserCircle className="w-3.5 h-3.5" />
                            Voir le profil
                          </Link>
                          {isAssigned &&
                          row.statut === "en_attente" &&
                          canRecruitArtisan ? (
                            <>
                              <button
                                type="button"
                                disabled={appActionLoadingId === row.applicationId}
                                onClick={() =>
                                  void handleApplicationDecision(
                                    row.applicationId,
                                    "accept",
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1.5 text-[11px] font-semibold text-gray-950 hover:opacity-95 disabled:opacity-50"
                              >
                                {appActionLoadingId === row.applicationId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                Accepter
                              </button>
                              <button
                                type="button"
                                disabled={appActionLoadingId === row.applicationId}
                                onClick={() =>
                                  void handleApplicationDecision(
                                    row.applicationId,
                                    "decline",
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Refuser
                              </button>
                            </>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Aucune candidature artisan pour le moment.
                </p>
              )}

              {suiviPhotoUrls.length > 0 ? (
                <div>
                  <p className="text-[11px] uppercase text-gray-500 mb-2 inline-flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Photos de suivi chantier
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {suiviPhotoUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Aucune photo de suivi pour l’instant (utilisez le suivi photo pour analyse IA
                  automatique).
                </p>
              )}
            </section>

            <ExpertProjectDossier project={project} omitTitle />

            {canRespond ? (
              <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 space-y-4">
                <p className="text-sm text-gray-300">
                  Cette invitation vous est destinée. Vous pouvez l&apos;accepter
                  pour être l&apos;expert référent du dossier, ou la refuser.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => respond("accepted")}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-gray-950 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accepter
                  </button>
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => respond("refused")}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-100 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                </div>
              </section>
            ) : null}

            {counteredProposal && isAssigned && !dossierCommercialClos ? (
              <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Le client a envoyé une contre-proposition. Mettez à jour votre proposition dans{" "}
                <Link
                  href={subLink(
                    `/expert/projects/${encodeURIComponent(projectId)}/proposition`,
                  )}
                  className="underline font-medium"
                >
                  Proposition
                </Link>
                .
              </div>
            ) : null}

            {isAssigned ? (
              <>
                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
                  <p className="text-sm font-medium text-white">
                    {contractFullySigned
                      ? "Suivi du chantier"
                      : dossierCommercialClos
                        ? "Suivi & chantier"
                        : "Négociation & proposition"}
                  </p>
                  {dossierCommercialClos ? (
                    <p className="text-xs text-gray-500">
                      {contractFullySigned
                        ? "Contrat signé par le client et vous : la proposition commerciale est verrouillée. Poursuivez le suivi via les accès ci-dessous."
                        : "Le client a accepté votre proposition commerciale. Vous pouvez encore signer le contrat dans la section ci-dessus si besoin, puis utilisez les accès chantier."}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-2 text-sm">
                    {!dossierCommercialClos ? (
                      <Link
                        href={subLink(
                          `/expert/projects/${encodeURIComponent(projectId)}/proposition`,
                        )}
                        className="inline-flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100 hover:bg-amber-500/15"
                      >
                        Proposition (prix, durée, notes)
                        <ChevronRight className="w-4 h-4 opacity-70" />
                      </Link>
                    ) : null}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400 pt-1">
                      <Link
                        href={subLink(
                          `/expert/projects/${encodeURIComponent(projectId)}/photos`,
                        )}
                        className="text-amber-300/90 hover:underline"
                      >
                        Photos galerie
                      </Link>
                      <span className="text-gray-600">·</span>
                      <Link
                        href={subLink(
                          `/expert/projects/${encodeURIComponent(projectId)}/suivi-photo`,
                        )}
                        className="text-amber-300/90 hover:underline"
                      >
                        Suivi photo (IA chantier)
                      </Link>
                      {clientId ? (
                        <>
                          <span className="text-gray-600">·</span>
                          <Link
                            href={`/messages/${encodeURIComponent(clientId)}`}
                            className="inline-flex items-center gap-1 text-sky-300/90 hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Messages client
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-3">
                  <p className="text-sm font-medium text-white">Avancement manuel</p>
                  <p className="text-xs text-gray-500">
                    Sans photo : indiquez un pourcentage et une note (les photos avec analyse IA
                    restent sur « Suivi photo »).
                  </p>
                  <form onSubmit={submitManualProgress} className="space-y-3">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          % avancement (0–100)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={manualPct}
                          onChange={(e) =>
                            setManualPct(e.target.value.replace(/\D/g, "").slice(0, 3))
                          }
                          className="w-28 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingProgress}
                        className="rounded-xl bg-amber-500/90 text-gray-950 font-semibold px-4 py-2 text-sm disabled:opacity-40"
                      >
                        {savingProgress ? "…" : "Enregistrer"}
                      </button>
                    </div>
                    <textarea
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      placeholder="Note courte (optionnel)"
                      rows={2}
                      className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                    />
                    {progressMsg ? (
                      <p className="text-xs text-gray-400">{progressMsg}</p>
                    ) : null}
                  </form>
                </section>
              </>
            ) : null}

            <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-6 text-[11px] text-gray-500">
              <Link
                href={subLink(
                  `/expert/tous-les-projets/${encodeURIComponent(projectId)}`,
                )}
                className="text-gray-400 hover:text-amber-400/90 transition"
              >
                Vue dossier étendue
              </Link>
              <span className="text-gray-600" aria-hidden>
                ·
              </span>
              <Link
                href="/expert/projets"
                className="text-gray-400 hover:text-amber-400/90 transition"
              >
                Liste des projets
              </Link>
            </footer>
          </>
        ) : null}
      </div>
    </div>
  );
}
