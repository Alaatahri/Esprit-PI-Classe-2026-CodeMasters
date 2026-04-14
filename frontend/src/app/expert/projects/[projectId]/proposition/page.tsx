"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Send, FileText, Sparkles } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { isExpertAreaUser } from "@/lib/roles";
import { getApiBaseUrl } from "@/lib/api-base";
import { FieldError, fieldInputClass, fieldTextareaClass } from "@/lib/form-ui";
import { validateExpertProposal } from "@/lib/validators";
import {
  ExpertProjectDossier,
  type ExpertProjectDossierData,
} from "@/components/expert/ExpertProjectDossier";
import { ProposalRichEditor } from "@/components/expert/ProposalRichEditor";
import { buildProjectBriefForAi } from "@/lib/build-project-brief-for-ai";
import { stripHtmlToText } from "@/lib/html-utils";
import { readJsonSafe } from "@/lib/read-json-safe";
import {
  parseContractFromApiBody,
  type ClientContractRow,
} from "@/lib/contract-api";

const API_URL = getApiBaseUrl();

type Project = ExpertProjectDossierData & {
  _id: string;
  titre: string;
  expertId?: unknown;
};

type ProposalRow = {
  _id: string;
  status?: string;
  proposedPrice: number;
  estimatedDurationDays: number;
  technicalNotes: string;
  materialSuggestions?: string;
  clientCounterPrice?: number;
  clientCounterDurationDays?: number;
  clientCounterMessage?: string;
};

type ProposalDraftRes = {
  estimatedBudgetTnd: number;
  estimatedDurationDays: number;
  technicalNotes: string;
  materialSuggestions: string;
};

function expertRefId(expertId: unknown): string {
  if (!expertId) return "";
  if (typeof expertId === "string") return expertId;
  if (typeof expertId === "object" && expertId !== null && "_id" in expertId) {
    return String((expertId as { _id: unknown })._id);
  }
  return String(expertId);
}

export default function ExpertProposalPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const projectId = typeof params?.projectId === "string" ? params.projectId : "";

  const backHref =
    from === "nouveaux"
      ? `/expert/projects/${encodeURIComponent(projectId)}?from=nouveaux`
      : from === "catalog"
        ? `/expert/projects/${encodeURIComponent(projectId)}?from=catalog`
        : `/expert/projects/${encodeURIComponent(projectId)}?from=projets`;

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [notes, setNotes] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [materials, setMaterials] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"price" | "days" | "notes", string>>
  >({});

  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [contract, setContract] = useState<ClientContractRow | null>(null);

  const user = getStoredUser();
  const isAssignedExpert = useMemo(() => {
    if (!user || !project) return false;
    return expertRefId(project.expertId) === user._id;
  }, [project, user]);

  const counteredProposal = useMemo(
    () => proposals.find((p) => p.status === "countered"),
    [proposals],
  );

  const acceptedProposal = useMemo(
    () => proposals.find((p) => p.status === "accepted"),
    [proposals],
  );

  const contractFullySigned = Boolean(
    contract?.clientSignedAt && contract?.expertSignedAt,
  );

  /** Client a accepté l’offre et/ou contrat signé : plus d’envoi de nouvelle proposition. */
  const proposalLocked =
    Boolean(acceptedProposal) || contractFullySigned;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [resP, resProp, resC] = await Promise.all([
        fetch(`${API_URL}/projects/${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        }),
        fetch(`${API_URL}/proposals/by-project/${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        }),
        fetch(
          `${API_URL}/contracts/by-project/${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        ),
      ]);
      if (!resP.ok) throw new Error("Projet introuvable.");
      const pRaw = await readJsonSafe(resP);
      const p =
        pRaw && typeof pRaw === "object" ? (pRaw as Project) : null;
      if (!p) throw new Error("Réponse projet invalide.");
      setProject(p);

      const raw = resProp.ok ? await readJsonSafe<unknown>(resProp) : null;
      const list = Array.isArray(raw) ? (raw as ProposalRow[]) : [];
      setProposals(list);

      const cRaw = resC.ok ? await readJsonSafe(resC) : null;
      setContract(parseContractFromApiBody(cRaw));

      const countered = list.find((x) => x.status === "countered");
      const accepted = list.find((x) => x.status === "accepted");
      if (!accepted && countered) {
        setPrice(String(Math.round(countered.proposedPrice)));
        setDays(String(countered.estimatedDurationDays));
        setNotes(countered.technicalNotes);
        setMaterials(countered.materialSuggestions ?? "");
        setEditorKey((k) => k + 1);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
      setProject(null);
      setProposals([]);
      setContract(null);
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
    void loadAll();
  }, [loadAll, projectId, router]);

  const runProposalAi = async () => {
    const u = getStoredUser();
    if (!project || !u || proposalLocked) return;
    const text = buildProjectBriefForAi(project).trim();
    if (!text) {
      setAiErr("Pas assez d’informations sur le projet pour l’IA.");
      return;
    }
    setAiLoading(true);
    setAiErr(null);
    try {
      const res = await fetch(`${API_URL}/matching/proposal-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": u._id,
        },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => null)) as
        | ProposalDraftRes
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
      const draft = data as ProposalDraftRes;
      setPrice(String(Math.max(0, Math.round(draft.estimatedBudgetTnd))));
      setDays(String(Math.max(1, Math.round(draft.estimatedDurationDays))));
      setNotes(draft.technicalNotes || "<p></p>");
      setMaterials(stripHtmlToText(draft.materialSuggestions || ""));
      setEditorKey((k) => k + 1);
      setFieldErrors({});
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAiLoading(false);
    }
  };

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const u = getStoredUser();
      if (!u || !isExpertAreaUser(u.role)) return;
      if (!projectId) return;

      setSending(true);
      setErr(null);
      setOk(null);
      setFieldErrors({});

      const fe = validateExpertProposal(price, days, notes);
      if (Object.keys(fe).length > 0) {
        setFieldErrors(fe);
        setErr("Veuillez corriger les champs indiqués.");
        setSending(false);
        return;
      }

      if (proposalLocked) {
        setSending(false);
        return;
      }

      const p = Number(price);
      const d = Number(days);
      const n = notes.trim();

      try {
        const revising =
          counteredProposal && isAssignedExpert && !proposalLocked;
        const url = revising
          ? `${API_URL}/proposals/${encodeURIComponent(counteredProposal._id)}/revise`
          : `${API_URL}/proposals/for-project/${encodeURIComponent(projectId)}`;
        const method = revising ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-user-id": u._id,
          },
          body: JSON.stringify({
            proposedPrice: p,
            estimatedDurationDays: d,
            technicalNotes: n,
            materialSuggestions: materials.trim() || undefined,
          }),
        });
        const data = (await res.json().catch(() => null)) as { message?: unknown } | null;
        if (!res.ok) {
          const raw = data && typeof data === "object" ? data.message : undefined;
          const msg = Array.isArray(raw) ? raw.join(" ") : typeof raw === "string" ? raw : `Erreur ${res.status}`;
          throw new Error(msg);
        }
        setOk(
          revising
            ? "Proposition révisée. Le client peut accepter ou renégocier."
            : "Proposition envoyée au client. Il peut accepter, contre-proposer ou annuler le projet depuis son espace.",
        );
        await loadAll();
      } catch (e2) {
        setErr(e2 instanceof Error ? e2.message : "Erreur");
      } finally {
        setSending(false);
      }
    },
    [
      counteredProposal,
      days,
      isAssignedExpert,
      loadAll,
      materials,
      notes,
      price,
      projectId,
      proposalLocked,
    ],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <nav
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4"
          aria-label="Navigation proposition"
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-400/90 hover:text-amber-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dossier
          </Link>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <Link href="/espace/expert" className="hover:text-amber-400/90">
              Tableau de bord
            </Link>
            <span className="text-gray-600">·</span>
            <Link href="/expert/projets" className="hover:text-amber-400/90">
              Mes projets
            </Link>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Proposition expert</h1>
            <p className="text-sm text-gray-400">
              Générez un brouillon IA (prix, durée, texte structuré), éditez librement, puis validez
              l&apos;envoi au client.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          </div>
        ) : err && !project ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        ) : project ? (
          <>
            {!isAssignedExpert ? (
              <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Vous n&apos;êtes pas encore l&apos;expert assigné sur ce dossier. Acceptez l&apos;invitation
                depuis le hub projet pour envoyer une proposition.
              </div>
            ) : null}

            {proposalLocked ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 space-y-2">
                <p className="font-medium text-white">
                  {contractFullySigned
                    ? "Proposition commerciale verrouillée (contrat signé par le client et vous)."
                    : "Le client a accepté votre proposition commerciale. Aucune nouvelle offre n’est possible depuis cet écran."}
                </p>
                {acceptedProposal ? (
                  <p className="text-xs text-gray-300">
                    Prix retenu :{" "}
                    <span className="text-amber-200 font-semibold">
                      {Math.round(acceptedProposal.proposedPrice ?? 0).toLocaleString("fr-FR")}{" "}
                      TND
                    </span>
                    {typeof acceptedProposal.estimatedDurationDays === "number"
                      ? ` · Durée : ${acceptedProposal.estimatedDurationDays} j`
                      : null}
                  </p>
                ) : null}
                <p className="text-xs text-gray-500">
                  Poursuivez le dossier depuis le hub projet (contrat, photos, suivi).
                </p>
              </div>
            ) : null}

            {!proposalLocked && counteredProposal ? (
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100 space-y-2">
                <p className="font-medium text-white">Contre-proposition du client</p>
                {typeof counteredProposal.clientCounterPrice === "number" ? (
                  <p>
                    Prix souhaité :{" "}
                    <span className="text-amber-200 font-semibold">
                      {Math.round(counteredProposal.clientCounterPrice).toLocaleString("fr-FR")} TND
                    </span>
                    {typeof counteredProposal.clientCounterDurationDays === "number"
                      ? ` · Durée : ${counteredProposal.clientCounterDurationDays} j`
                      : null}
                  </p>
                ) : null}
                {counteredProposal.clientCounterMessage ? (
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {counteredProposal.clientCounterMessage}
                  </p>
                ) : null}
                <p className="text-xs text-gray-500">
                  Ajustez l&apos;éditeur ci-dessous puis enregistrez la révision.
                </p>
              </div>
            ) : null}

            <ExpertProjectDossier project={project} />

            {isAssignedExpert && !proposalLocked ? (
              <section className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Assistance IA (brouillon)
                  </p>
                  <button
                    type="button"
                    disabled={aiLoading || sending}
                    onClick={() => void runProposalAi()}
                    className="text-xs font-semibold text-amber-200 border border-amber-500/35 rounded-lg px-3 py-1.5 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    {aiLoading ? "Génération…" : "Générer un brouillon depuis le dossier"}
                  </button>
                </div>
                {aiErr ? <p className="text-xs text-red-300">{aiErr}</p> : null}
                <p className="text-xs text-gray-500 leading-relaxed">
                  Relisez et modifiez le texte avant envoi — vous restez responsable du contenu final.
                </p>
              </section>
            ) : null}

            {ok ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {ok}
              </div>
            ) : null}

            {err && project ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
              </div>
            ) : null}

            {proposalLocked ? null : (
            <form noValidate onSubmit={submit} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prop-price" className="block text-[11px] text-gray-400 mb-1">
                    Prix proposé (TND) <span className="text-red-400/90">*</span>
                  </label>
                  <input
                    id="prop-price"
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setFieldErrors((f) => {
                        const n = { ...f };
                        delete n.price;
                        return n;
                      });
                    }}
                    aria-invalid={!!fieldErrors.price}
                    aria-describedby={fieldErrors.price ? "err-prop-price" : undefined}
                    className={fieldInputClass(!!fieldErrors.price, sending)}
                  />
                  <FieldError id="err-prop-price" message={fieldErrors.price} />
                </div>
                <div>
                  <label htmlFor="prop-days" className="block text-[11px] text-gray-400 mb-1">
                    Durée estimée (jours) <span className="text-red-400/90">*</span>
                  </label>
                  <input
                    id="prop-days"
                    type="text"
                    inputMode="numeric"
                    value={days}
                    onChange={(e) => {
                      setDays(e.target.value.replace(/\D/g, ""));
                      setFieldErrors((f) => {
                        const n = { ...f };
                        delete n.days;
                        return n;
                      });
                    }}
                    aria-invalid={!!fieldErrors.days}
                    aria-describedby={fieldErrors.days ? "err-prop-days" : undefined}
                    className={fieldInputClass(!!fieldErrors.days, sending)}
                  />
                  <FieldError id="err-prop-days" message={fieldErrors.days} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Notes techniques (éditeur) <span className="text-red-400/90">*</span>
                </label>
                <ProposalRichEditor
                  key={editorKey}
                  initialHtml={notes}
                  onChange={(html) => {
                    setNotes(html);
                    setFieldErrors((f) => {
                      const n = { ...f };
                      delete n.notes;
                      return n;
                    });
                  }}
                  disabled={sending || !isAssignedExpert}
                  placeholder="Méthodologie, planning, hypothèses, visites…"
                />
                <FieldError id="err-prop-notes" message={fieldErrors.notes} />
              </div>

              <div>
                <label htmlFor="prop-mat" className="block text-[11px] text-gray-400 mb-1">
                  Suggestions matériaux (optionnel)
                </label>
                <textarea
                  id="prop-mat"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  rows={3}
                  maxLength={12000}
                  className={fieldTextareaClass(false, sending)}
                />
              </div>

              <button
                type="submit"
                disabled={sending || !isAssignedExpert}
                title={
                  !isAssignedExpert
                    ? "Attribuez-vous le dossier (accepter l’invitation) pour envoyer."
                    : undefined
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold px-4 py-2.5 text-sm hover:opacity-95 transition disabled:opacity-40 w-full sm:w-auto"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {counteredProposal ? "Valider et envoyer la révision au client" : "Valider et envoyer au client"}
                  </>
                )}
              </button>
            </form>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
