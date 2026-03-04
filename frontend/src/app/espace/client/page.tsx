"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import {
  PlusCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  Star,
  ShoppingCart,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Project = {
  _id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin_prevue: string;
  budget_estime: number;
  statut: string;
  avancement_global: number;
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
};

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

const exampleProjects: Array<{
  id: string;
  titre: string;
  type: string;
  description: string;
  budget: string;
  duree: string;
  note: number;
  avis: string;
}> = [
  {
    id: "ex1",
    titre: "Construction maison familiale 2 étages",
    type: "Construction neuve",
    description:
      "Maison 220 m² avec salon ouvert, 3 chambres, suite parentale et garage.",
    budget: "~ 380 000 TND",
    duree: "10 mois",
    note: 5,
    avis:
      "Travail très propre, délais respectés et excellente communication avec l'expert et les artisans.",
  },
  {
    id: "ex2",
    titre: "Extension d'une chambre + dressing",
    type: "Extension",
    description:
      "Ajout de 18 m² sur une maison existante avec isolation renforcée.",
    budget: "~ 60 000 TND",
    duree: "3 mois",
    note: 4,
    avis:
      "Résultat conforme au plan 3D, petit retard de 2 semaines mais bien géré.",
  },
  {
    id: "ex3",
    titre: "Rénovation complète d'une cuisine",
    type: "Rénovation",
    description:
      "Remplacement des revêtements, nouveaux meubles, électricité et plomberie refaites.",
    budget: "~ 35 000 TND",
    duree: "6 semaines",
    note: 5,
    avis:
      "Artisans très soigneux, finitions au top. L'expert a bien suivi le chantier.",
  },
];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < value
              ? "w-3.5 h-3.5 text-amber-400 fill-amber-400"
              : "w-3.5 h-3.5 text-gray-700 fill-gray-800"
          }
        />
      ))}
    </div>
  );
}

export default function ClientSpacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "client") return;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`${API_URL}/projects`);
        if (!res.ok) {
          throw new Error("Impossible de charger vos projets.");
        }
        const data = (await res.json()) as Project[];
        setProjects(
          data.filter((p) => p.clientId === user._id).sort((a, b) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da;
          })
        );
      } catch (err) {
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user]);

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

      const created = (await res.json()) as Project;
      setProjects((prev) => [created, ...prev]);
      setForm(initialForm);
      setSuccess("Projet créé avec succès.");
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
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold shadow-lg shadow-amber-500/30"
        >
          Aller à la connexion
        </button>
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
    <div className="grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8 lg:gap-10">
      {/* Colonne gauche: accueil client avec exemples & produits populaires */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
              <PlusCircle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                Bonjour {user?.nom || "client"}
              </h1>
              <p className="text-xs text-gray-400">
                Inspirez-vous de projets déjà réalisés et découvrez des idées de
                produits pour vos travaux.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/espace/client/nouveau-projet")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 text-xs font-semibold shadow-md shadow-amber-500/30 hover:shadow-amber-500/50"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau projet
          </button>
        </div>

        {/* Exemples de projets réalisés */}
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-sm font-semibold text-white">
                Projets réalisés via BMP.tn
              </h2>
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.18em]">
              Inspiration
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Quelques projets menés avec des experts et artisans via BMP.tn, avec
            leur budget, durée et avis.
          </p>

          <div className="space-y-3 max-h-72 overflow-auto pr-1 pt-1">
            {exampleProjects.map((ex) => (
              <div
                key={ex.id}
                className="rounded-2xl border border-white/10 bg-black/30 px-3.5 py-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white line-clamp-1">
                      {ex.titre}
                    </p>
                    <p className="text-[11px] text-amber-300">
                      {ex.type}
                    </p>
                  </div>
                  <Stars value={ex.note} />
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2">
                  {ex.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{ex.budget}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {ex.duree}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 italic">
                  “{ex.avis}”
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Colonne droite: historique des projets du client */}
      <section className="space-y-6">
        {/* Historique des projets du client */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm font-semibold text-white">
              Mes projets récents
            </h2>
          </div>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-400">
              Vous n'avez pas encore créé de projet. Remplissez le
              formulaire à gauche pour commencer.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-auto pr-1">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white line-clamp-1">
                      {project.titre}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium ${
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
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {project.date_debut
                        ? new Date(
                            project.date_debut
                          ).toLocaleDateString()
                        : "-"}{" "}
                      →{" "}
                      {project.date_fin_prevue
                        ? new Date(
                            project.date_fin_prevue
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      {project.avancement_global ?? 0}% avancement
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produits populaires du marketplace (démo statique) */}
        <div className="space-y-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-300" />
              <h2 className="text-sm font-semibold text-white">
                Produits populaires du marketplace
              </h2>
            </div>
            <span className="text-[10px] text-emerald-300 uppercase tracking-[0.18em]">
              Marketplace
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Quelques produits fréquemment commandés pour les projets de
            construction et rénovation.
          </p>

          <div className="space-y-3 max-h-72 overflow-auto pr-1 pt-1">
            {[
              {
                id: "p1",
                nom: "Ciment haute performance 50kg",
                prix: "32,000 TND",
                categorie: "Matériaux",
              },
              {
                id: "p2",
                nom: "Carrelage sol 60x60 effet pierre",
                prix: "65,000 TND / m²",
                categorie: "Revêtements",
              },
              {
                id: "p3",
                nom: "Fenêtre PVC double vitrage",
                prix: "450,000 TND",
                categorie: "Menuiserie",
              },
            ].map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-black/30 px-3.5 py-3 text-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                  <ShoppingCart className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-white line-clamp-1">
                    {product.nom}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-300">
                    <span>{product.prix}</span>
                    <span className="text-emerald-300/80">
                      {product.categorie}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

