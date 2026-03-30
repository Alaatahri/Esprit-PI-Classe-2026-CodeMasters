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

const modules = [
  {
    href: "/gestion-chantier",
    title: "Gestion de Chantier",
    description: "Planification, suivi des projets et avancement en temps réel.",
    icon: Briefcase,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    color: "from-amber-500 to-orange-600",
    label: "Accéder",
  },
  {
    href: "/gestion-devis-facturation",
    title: "Devis & Facturation",
    description: "Devis et facturation assistés par IA pour vos chantiers.",
    icon: FileText,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    color: "from-blue-500 to-cyan-600",
    label: "Accéder",
  },
  {
    href: "/gestion-marketplace",
    title: "Marketplace",
    description: "Matériaux et équipements de construction. Commandez en ligne.",
    icon: ShoppingCart,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    color: "from-emerald-500 to-teal-600",
    label: "Voir le catalogue",
  },
];

export default function EspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);

    if (stored?.role === "client") {
      router.replace("/espace/client");
    } else if (stored?.role === "expert") {
      router.replace("/espace/expert");
    } else if (stored?.role === "artisan") {
      router.replace("/espace/artisan");
    } else if (stored?.role === "admin") {
      router.replace("/espace/admin");
    }
  }, [router]);

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* Welcome hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl"
      >
        <div className="absolute inset-0">
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
            Accédez à vos outils de gestion de chantier, devis et marketplace depuis un seul espace.
          </p>
        </div>
      </motion.section>

      {/* Module cards */}
      <section>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl font-semibold text-gray-300 mb-8 text-center sm:text-left"
        >
          Nos modules
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Link
                  href={mod.href}
                  className="group block h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:border-amber-500/30 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
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
                    <span className="inline-flex items-center gap-2 text-amber-400 font-medium text-sm group-hover:gap-3 transition-all">
                      {mod.label}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Quick actions strip */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Link
          href="/gestion-chantier"
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all group"
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
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all group"
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
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all group"
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
    </div>
  );
}
