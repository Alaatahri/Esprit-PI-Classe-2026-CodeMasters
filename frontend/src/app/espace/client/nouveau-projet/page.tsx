"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base";

const API_URL = getApiBaseUrl();

type NewProjectForm = {
  titre: string;
  description: string;
  date_debut: string;
  date_fin_prevue: string;
  budget_estime: string;
};

const initialForm: NewProjectForm = {
  titre: "",
  description: "",
  date_debut: "",
  date_fin_prevue: "",
  budget_estime: "",
};

export default function NouveauProjetPage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState<NewProjectForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  const handleChange = (
    field: keyof NewProjectForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim(),
        date_debut: new Date(form.date_debut),
        date_fin_prevue: new Date(form.date_fin_prevue),
        budget_estime: Number(form.budget_estime) || 0,
        clientId: user._id,
        // statut non envoyé : le backend mettra "En attente" par défaut
      };

      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            data.error ||
            "Erreur lors de la création du projet."
        );
      }

      await res.json();
      setSuccess("Projet créé avec succès.");
      setForm(initialForm);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Titre du projet
          </label>
          <input
            type="text"
            value={form.titre}
            onChange={(e) => handleChange("titre", e.target.value)}
            placeholder="Ex: Construction maison familiale, Extension chambre, Rénovation cuisine…"
            required
            className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              handleChange("description", e.target.value)
            }
            rows={4}
            placeholder="Décrivez votre besoin, la surface, le budget estimé, les délais souhaités, etc."
            required
            className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Date de début souhaitée
            </label>
            <input
              type="date"
              value={form.date_debut}
              onChange={(e) =>
                handleChange("date_debut", e.target.value)
              }
              required
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Date de fin prévue
            </label>
            <input
              type="date"
              value={form.date_fin_prevue}
              onChange={(e) =>
                handleChange(
                  "date_fin_prevue",
                  e.target.value
                )
              }
              required
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Budget estimé (TND)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={form.budget_estime}
            onChange={(e) =>
              handleChange("budget_estime", e.target.value)
            }
            placeholder="Ex: 50000"
            required
            className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
          />
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

