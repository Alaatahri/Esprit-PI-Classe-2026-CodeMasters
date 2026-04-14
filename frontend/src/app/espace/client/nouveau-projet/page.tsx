"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { formatApiError } from "@/lib/api-error";
import { getApiBaseUrl } from "@/lib/api-base";
import { bmpAuthHeaders } from "@/lib/api-user-headers";
import { FieldError, fieldInputClass, fieldTextareaClass } from "@/lib/form-ui";
import { DictationButton } from "@/components/DictationButton";
import {
  validateNewProjectForm,
  type NewProjectFormInput,
} from "@/lib/validators";

const API_URL = getApiBaseUrl();

type NewProjectForm = NewProjectFormInput & {
  urgence: "urgent" | "normal" | "flexible";
};

const initialForm: NewProjectForm = {
  titre: "",
  categorie: "",
  description: "",
  ville: "",
  adresse: "",
  surface_m2: "",
  type_batiment: "",
  urgence: "normal",
  preferences_materiaux: "",
  exigences_techniques: "",
};

export default function NouveauProjetPage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState<NewProjectForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof NewProjectFormInput, string>>
  >({});
  const [success, setSuccess] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [sitePhotos, setSitePhotos] = useState<FileList | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  const handleChange = useCallback(
    (field: keyof NewProjectForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field !== "urgence") {
        setFieldErrors((prev) => {
          const n = { ...prev };
          delete n[field as keyof NewProjectFormInput];
          return n;
        });
      }
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const errs = validateNewProjectForm(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Veuillez corriger les champs indiqués.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        titre: form.titre.trim(),
        categorie: form.categorie.trim() || undefined,
        description: form.description.trim(),
        ville: form.ville.trim() || undefined,
        adresse: form.adresse.trim() || undefined,
        surface_m2: Number(form.surface_m2) || undefined,
        type_batiment: form.type_batiment.trim() || undefined,
        urgence: form.urgence,
        preferences_materiaux: form.preferences_materiaux.trim() || undefined,
        exigences_techniques: form.exigences_techniques.trim() || undefined,
        clientId: user._id,
        // statut non envoyé : le backend mettra "En attente" par défaut
      };

      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...bmpAuthHeaders(user),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          formatApiError(data, "Erreur lors de la création du projet."),
        );
      }

      const created = (await res.json()) as { _id?: string } | null;
      const projectId = created?._id ? String(created._id) : "";
      if (!projectId) {
        throw new Error("Projet créé mais identifiant manquant (réponse API).");
      }

      const uploadBatch = async (
        kind: "attachment" | "site_photo",
        files: FileList | null,
      ) => {
        const list = files ? Array.from(files) : [];
        if (list.length === 0) return;
        const fd = new FormData();
        fd.append("kind", kind);
        for (const f of list) fd.append("files", f);
        const up = await fetch(
          `${API_URL}/projects/${encodeURIComponent(projectId)}/uploads`,
          {
            method: "POST",
            headers: { "x-user-id": user._id },
            body: fd,
          },
        );
        if (!up.ok) {
          const data = await up.json().catch(() => ({}));
          throw new Error(
            data.message || data.error || `Erreur upload (${kind})`,
          );
        }
      };

      await uploadBatch("attachment", attachments);
      await uploadBatch("site_photo", sitePhotos);
      setSuccess("Projet créé avec succès.");
      setForm(initialForm);
      setAttachments(null);
      setSitePhotos(null);
      // Retour à l'espace client après création
      router.push("/espace/client");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du projet."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!loadingUser && !user) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">
          Espace client
        </h1>
        <p className="text-gray-400">
          Connectez-vous pour créer et suivre vos projets.
        </p>
      </div>
    );
  }

  if (!loadingUser && user && user.role !== "client") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Espace réservé aux clients
        </h1>
        <p className="text-gray-400 text-sm">
          Vous êtes connecté en tant que{" "}
          <span className="font-semibold text-amber-300">
            {user.role}
          </span>
          . Cet écran est dédié aux clients qui créent des projets.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">
          Créer un nouveau projet
        </h1>
        <p className="text-sm text-gray-400">
          Décrivez votre besoin (construction, rénovation, extension…) pour que
          les experts et artisans puissent vous accompagner.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="np-titre"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Titre du projet <span className="text-red-400/90">*</span>
          </label>
          <div className="relative">
            <input
              id="np-titre"
              type="text"
              maxLength={200}
              value={form.titre}
              onChange={(e) => handleChange("titre", e.target.value)}
              placeholder="Ex: Construction maison familiale, Extension chambre, Rénovation cuisine…"
              aria-invalid={!!fieldErrors.titre}
              aria-describedby={fieldErrors.titre ? "err-np-titre" : undefined}
              className={`${fieldInputClass(!!fieldErrors.titre, submitting)} pr-12`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <DictationButton
                onResult={(text) =>
                  handleChange("titre", `${form.titre} ${text}`.trim())
                }
                className="!p-2 w-9 h-9"
              />
            </div>
          </div>
          <FieldError id="err-np-titre" message={fieldErrors.titre} />
        </div>

        <div>
          <label
            htmlFor="np-categorie"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Catégorie <span className="text-red-400/90">*</span>
          </label>
          <select
            id="np-categorie"
            value={form.categorie}
            onChange={(e) => handleChange("categorie", e.target.value)}
            aria-invalid={!!fieldErrors.categorie}
            aria-describedby={fieldErrors.categorie ? "err-np-cat" : undefined}
            className={`${fieldInputClass(!!fieldErrors.categorie, submitting)} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right-3 bg-[length:18px] pr-10`}
          >
            <option value="" className="bg-gray-950">
              Choisir une catégorie…
            </option>
            {[
              "Rénovation",
              "Construction neuve",
              "Électricité",
              "Plomberie",
              "Travaux intérieurs",
              "Travaux extérieurs",
              "Peinture",
              "Menuiserie",
            ].map((c) => (
              <option key={c} value={c} className="bg-gray-950">
                {c}
              </option>
            ))}
          </select>
          <FieldError id="err-np-cat" message={fieldErrors.categorie} />
        </div>

        <div>
          <label
            htmlFor="np-desc"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Description <span className="text-red-400/90">*</span>
          </label>
          <div className="relative">
            <textarea
              id="np-desc"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              maxLength={8000}
              placeholder="Décrivez votre besoin, la surface, le budget estimé, les délais souhaités, etc."
              aria-invalid={!!fieldErrors.description}
              aria-describedby={
                fieldErrors.description ? "err-np-desc" : undefined
              }
              className={`${fieldTextareaClass(!!fieldErrors.description, submitting)} pr-12`}
            />
            <div className="absolute right-2 top-3">
              <DictationButton
                onResult={(text) =>
                  handleChange("description", `${form.description} ${text}`.trim())
                }
                className="!p-2 w-9 h-9"
              />
            </div>
          </div>
          <FieldError id="err-np-desc" message={fieldErrors.description} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="np-ville"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Ville <span className="text-red-400/90">*</span>
            </label>
            <input
              id="np-ville"
              type="text"
              maxLength={120}
              value={form.ville}
              onChange={(e) => handleChange("ville", e.target.value)}
              aria-invalid={!!fieldErrors.ville}
              aria-describedby={fieldErrors.ville ? "err-np-ville" : undefined}
              className={fieldInputClass(!!fieldErrors.ville, submitting)}
              placeholder="Ex: Tunis"
            />
            <FieldError id="err-np-ville" message={fieldErrors.ville} />
          </div>
          <div>
            <label
              htmlFor="np-adr"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Adresse exacte <span className="text-red-400/90">*</span>
            </label>
            <input
              id="np-adr"
              type="text"
              maxLength={300}
              value={form.adresse}
              onChange={(e) => handleChange("adresse", e.target.value)}
              aria-invalid={!!fieldErrors.adresse}
              aria-describedby={fieldErrors.adresse ? "err-np-adr" : undefined}
              className={fieldInputClass(!!fieldErrors.adresse, submitting)}
              placeholder="Rue, quartier…"
            />
            <FieldError id="err-np-adr" message={fieldErrors.adresse} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-300">
            Les dates et le budget seront proposés par l&apos;expert après analyse du
            dossier.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Surface (m²) (optionnel)
            </label>
            <input
              id="np-surf"
              type="text"
              inputMode="decimal"
              value={form.surface_m2}
              onChange={(e) => handleChange("surface_m2", e.target.value)}
              aria-invalid={!!fieldErrors.surface_m2}
              aria-describedby={fieldErrors.surface_m2 ? "err-np-surf" : undefined}
              className={fieldInputClass(!!fieldErrors.surface_m2, submitting)}
              placeholder="Ex: 120"
            />
            <FieldError id="err-np-surf" message={fieldErrors.surface_m2} />
          </div>
          <div>
            <label
              htmlFor="np-type"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Type de bâtiment <span className="text-red-400/90">*</span>
            </label>
            <select
              id="np-type"
              value={form.type_batiment}
              onChange={(e) => handleChange("type_batiment", e.target.value)}
              aria-invalid={!!fieldErrors.type_batiment}
              aria-describedby={
                fieldErrors.type_batiment ? "err-np-type" : undefined
              }
              className={`${fieldInputClass(!!fieldErrors.type_batiment, submitting)} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right-3 bg-[length:18px] pr-10`}
            >
              <option value="" className="bg-gray-950">
                Choisir…
              </option>
              {["Maison", "Appartement", "Commercial", "Bureau", "Autre"].map((t) => (
                <option key={t} value={t} className="bg-gray-950">
                  {t}
                </option>
              ))}
            </select>
            <FieldError id="err-np-type" message={fieldErrors.type_batiment} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Urgence
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "urgent", label: "Urgent" },
              { id: "normal", label: "Normal" },
              { id: "flexible", label: "Flexible" },
            ].map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() =>
                  handleChange(
                    "urgence",
                    u.id as "urgent" | "normal" | "flexible",
                  )
                }
                className={`px-4 py-2 rounded-xl border text-sm transition ${
                  form.urgence === u.id
                    ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                    : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="np-pref"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Préférences matériaux{" "}
            <span className="text-gray-500 text-xs">(optionnel)</span>
          </label>
          <textarea
            id="np-pref"
            value={form.preferences_materiaux}
            onChange={(e) => handleChange("preferences_materiaux", e.target.value)}
            rows={2}
            maxLength={4000}
            aria-invalid={!!fieldErrors.preferences_materiaux}
            aria-describedby={
              fieldErrors.preferences_materiaux ? "err-np-pref" : undefined
            }
            className={fieldTextareaClass(
              !!fieldErrors.preferences_materiaux,
              submitting,
            )}
            placeholder="Ex: carrelage grand format, aluminium, PVC…"
          />
          <FieldError
            id="err-np-pref"
            message={fieldErrors.preferences_materiaux}
          />
        </div>

        <div>
          <label
            htmlFor="np-exi"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Exigences techniques{" "}
            <span className="text-gray-500 text-xs">(optionnel)</span>
          </label>
          <textarea
            id="np-exi"
            value={form.exigences_techniques}
            onChange={(e) => handleChange("exigences_techniques", e.target.value)}
            rows={2}
            maxLength={4000}
            aria-invalid={!!fieldErrors.exigences_techniques}
            aria-describedby={
              fieldErrors.exigences_techniques ? "err-np-exi" : undefined
            }
            className={fieldTextareaClass(
              !!fieldErrors.exigences_techniques,
              submitting,
            )}
            placeholder="Ex: isolation phonique, normes, contraintes accès…"
          />
          <FieldError
            id="err-np-exi"
            message={fieldErrors.exigences_techniques}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Fichiers & photos</p>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Plans / documents (PDF, images)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              disabled={submitting}
              onChange={(e) => setAttachments(e.target.files)}
              className="block w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-2 file:text-amber-100 hover:file:bg-amber-500/30"
            />
            <p className="mt-1 text-xs text-gray-500">
              (Optionnel) Aide l’expert à évaluer rapidement.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Photos de l’état actuel (site)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={submitting}
              onChange={(e) => setSitePhotos(e.target.files)}
              className="block w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-2 file:text-amber-100 hover:file:bg-amber-500/30"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center gap-2"
        >
          {submitting ? "Création en cours..." : "Créer le projet"}
        </button>
      </form>
    </div>
  );
}

