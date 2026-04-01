"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { SuiviTimeline } from "@/components/SuiviTimeline";
import {
  PlusCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  Star,
  ShoppingCart,
  Camera,
  ChevronRight,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
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
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
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
  image: string;
  imageAlt: string;
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
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    imageAlt: "Maison neuve contemporaine",
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
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    imageAlt: "Extension maison avec terrasse",
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
    image:
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&q=80",
    imageAlt: "Cuisine rénovée moderne",
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
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user]);

  const projectStats = useMemo(() => {
    const total = projects.length;
    const enCours = projects.filter((p) => p.statut === "En cours").length;
    const termines = projects.filter((p) => p.statut === "Terminé").length;
    return { total, enCours, termines };
  }, [projects]);

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
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Bandeau d'accueil */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/[0.08] via-white/[0.04] to-transparent p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/15">
              <LayoutDashboard className="h-7 w-7 text-amber-300" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
                Espace client
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Bonjour, {user?.nom || "client"}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-gray-400">
                Pilotez vos chantiers, suivez l&apos;avancement et trouvez
                l&apos;inspiration dans des projets déjà réalisés sur BMP.tn.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <button
              type="button"
              onClick={() => router.push("/espace/client/nouveau-projet")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/40"
            >
              <PlusCircle className="h-4 w-4" />
              Nouveau projet
            </button>
            <Link
              href="/espace/client/suivi"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              <Camera className="h-4 w-4 text-amber-300" />
              Suivi &amp; photos
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-4 text-center sm:px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Projets
            </p>
            <p className="mt-1 text-2xl font-bold text-white tabular-nums">
              {projectStats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-4 text-center sm:px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              En cours
            </p>
            <p className="mt-1 inline-flex items-center justify-center gap-1.5 text-2xl font-bold text-sky-300 tabular-nums">
              <TrendingUp className="h-5 w-5 opacity-80" />
              {projectStats.enCours}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-4 text-center sm:px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Terminés
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-300 tabular-nums">
              {projectStats.termines}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:gap-10">
        {/* Inspiration */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Inspiration — projets réalisés
              </h2>
              <p className="text-xs text-gray-500">
                Budgets, durées et retours clients (exemples).
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-400">
              BMP.tn
            </span>
          </div>

          <div className="space-y-4">
            {exampleProjects.map((ex) => (
              <article
                key={ex.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-amber-500/25"
              >
                <div className="relative aspect-[21/9] sm:aspect-[2.4/1]">
                  <Image
                    src={ex.image}
                    alt={ex.imageAlt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1280px) 100vw, 55vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-amber-200 backdrop-blur-sm">
                    {ex.type}
                  </span>
                </div>
                <div className="space-y-2 p-4 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug text-white">
                      {ex.titre}
                    </p>
                    <Stars value={ex.note} />
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {ex.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                    <span>{ex.budget}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ex.duree}
                    </span>
                  </div>
                  <p className="border-t border-white/5 pt-2 text-xs italic text-gray-300">
                    &ldquo;{ex.avis}&rdquo;
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Projets + marketplace */}
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-300" />
                <h2 className="text-lg font-semibold text-white">
                  Mes projets
                </h2>
              </div>
              <Link
                href="/espace/client/suivi"
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
              >
                Vue suivi complète
                <ChevronRight className="h-3.5 w-3.5 opacity-80" />
              </Link>
            </div>

            {loadingProjects ? (
              <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
                <p className="text-sm text-gray-400">
                  Vous n&apos;avez pas encore de projet. Cliquez sur{" "}
                  <span className="font-medium text-amber-200">
                    Nouveau projet
                  </span>{" "}
                  pour décrire votre besoin et lancer un dossier.
                </p>
              </div>
            ) : (
              <div className="max-h-[min(28rem,70vh)] space-y-3 overflow-auto pr-1">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Ouvrir le suivi détaillé : ${project.titre}`}
                    className="cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-3 text-sm shadow-sm transition hover:border-amber-500/35 hover:from-white/[0.08]"
                    onClick={() =>
                      router.push(`/espace/client/suivi/${project._id}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/espace/client/suivi/${project._id}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="line-clamp-1 font-medium text-white">
                        {project.titre}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium ${
                          project.statut === "Terminé"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : project.statut === "En cours"
                              ? "bg-sky-500/15 text-sky-300"
                              : "bg-gray-500/15 text-gray-300"
                        }`}
                      >
                        {project.statut}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                      {project.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.date_debut
                          ? new Date(project.date_debut).toLocaleDateString()
                          : "-"}{" "}
                        →{" "}
                        {project.date_fin_prevue
                          ? new Date(project.date_fin_prevue).toLocaleDateString()
                          : "-"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-300/90">
                        <CheckCircle2 className="h-3 w-3" />
                        {project.avancement_global ?? 0}%
                      </span>
                    </div>
                    <div
                      className="pt-2"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <SuiviTimeline
                        projectId={project._id}
                        apiBaseUrl={API_URL}
                      />
                    </div>
                    <p className="pt-1 text-center text-[10px] text-amber-400/70">
                      Cliquez pour le détail, l&apos;avancement et les photos
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 to-transparent p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-300" />
                <h2 className="text-base font-semibold text-white">
                  Marketplace — tendances
                </h2>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-400/80">
                B2B
              </span>
            </div>
            <p className="mb-4 text-xs text-gray-400">
              Matériaux souvent commandés pour vos chantiers (aperçu).
            </p>
            <div className="space-y-3">
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
                  className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-black/25 px-3 py-3 text-xs"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15">
                    <ShoppingCart className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-semibold text-white line-clamp-1">
                      {product.nom}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                      <span>{product.prix}</span>
                      <span className="text-emerald-300/90">
                        {product.categorie}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

