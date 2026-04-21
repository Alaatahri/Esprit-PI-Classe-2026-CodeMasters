"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  ShoppingCart,
  ArrowRight,
  HardHat,
  Calculator,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { getHomePathForRole } from "@/lib/roles";
import { GuestLandingShowcase } from "@/components/GuestLandingShowcase";
import { FadeInWhenVisible, SectionDivider } from "@/components/motion";
import { LoadingState } from "@/components/layout/LoadingState";

const modules = [
  {
    href: "/gestion-chantier",
    title: "Gestion de Chantier",
    description: "Planification, suivi des projets et avancement en temps réel.",
    icon: Briefcase,
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
    color: "from-amber-500 to-orange-600",
    label: "Accéder",
  },
  {
    href: "/gestion-devis-facturation",
    title: "Devis & Facturation",
    description: "Devis et facturation assistés par IA pour vos chantiers.",
    icon: FileText,
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    color: "from-blue-500 to-cyan-600",
    label: "Accéder",
  },
  {
    href: "/gestion-marketplace",
    title: "Marketplace",
    description: "Matériaux et équipements de construction. Commandez en ligne.",
    icon: ShoppingCart,
    image:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
    color: "from-emerald-500 to-teal-600",
    label: "Voir le catalogue",
  },
];

export default function EspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);

    if (stored) {
      const target = getHomePathForRole(stored.role);
      if (target !== "/espace") {
        router.replace(target);
      }
    }
    setBootstrapped(true);
  }, [router]);

  const redirecting =
    bootstrapped &&
    user &&
    getHomePathForRole(user.role) !== "/espace";

  if (!bootstrapped || redirecting) {
    return (
      <LoadingState
        message={
          redirecting ? "Redirection vers votre espace…" : "Chargement…"
        }
        minHeight="lg"
      />
    );
  }

  const isGuest = !user;

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20">
      {/* Welcome hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950/90 via-amber-950/50 to-gray-950/90" />
        </div>
        <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mb-6">
            <HardHat className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Bienvenue sur <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">BMP.tn</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-4">
            {isGuest
              ? "La plateforme qui connecte clients, experts et artisans pour des chantiers suivis de bout en bout."
              : "Accédez à vos outils de gestion de chantier, devis et marketplace depuis un seul espace."}
          </p>
          {isGuest && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-7 py-3 text-sm font-semibold text-gray-900 shadow-lg shadow-amber-500/25 transition duration-300 ease-out hover:shadow-lg hover:shadow-amber-500/40 motion-safe:hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-7 py-3 text-sm font-medium text-white transition duration-300 ease-out hover:bg-white/10 motion-safe:hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
              >
                Connexion
              </Link>
            </div>
          )}
        </div>
      </motion.section>

      {isGuest && (
        <>
          <SectionDivider className="my-2" />
          <GuestLandingShowcase />
        </>
      )}

      {/* Module cards */}
      <section className="space-y-6 sm:space-y-8">
        <FadeInWhenVisible>
          <h2 className="mb-0 text-center text-xl font-semibold text-gray-300 sm:text-left">
            {isGuest ? "Découvrez les outils BMP.tn" : "Nos modules"}
          </h2>
        </FadeInWhenVisible>
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <FadeInWhenVisible key={mod.href} delay={i * 0.06} y={20}>
                <Link
                  href={mod.href}
                  className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition duration-300 ease-out hover:border-amber-500/30 hover:bg-white/10 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-black/30"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mod.image}
                      alt={mod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/95 via-gray-950/40 to-transparent" />
                    <div className={`absolute bottom-4 left-4 right-4 flex items-center gap-3`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-bold text-white drop-shadow-lg">{mod.title}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{mod.description}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition-[gap] duration-300 ease-out group-hover:gap-3">
                      {mod.label}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </FadeInWhenVisible>
            );
          })}
        </div>
      </section>

      {/* Quick actions strip */}
      <FadeInWhenVisible>
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
        >
        <Link
          href="/gestion-chantier"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 ease-out hover:border-amber-500/30 hover:bg-amber-500/10 motion-safe:hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-white">Gestion de Chantier</p>
            <p className="text-xs text-gray-500">Projets & suivi</p>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400/50 ml-auto" />
        </Link>
        <Link
          href="/gestion-devis-facturation"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 ease-out hover:border-blue-500/30 hover:bg-blue-500/10 motion-safe:hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calculator className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-white">Devis & Facturation</p>
            <p className="text-xs text-gray-500">Devis IA</p>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-400/50 ml-auto" />
        </Link>
        <Link
          href="/gestion-marketplace"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 ease-out hover:border-emerald-500/30 hover:bg-emerald-500/10 motion-safe:hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-white">Marketplace</p>
            <p className="text-xs text-gray-500">Catalogue B2B</p>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-400/50 ml-auto" />
        </Link>
        </motion.section>
      </FadeInWhenVisible>
    </div>
  );
}
