"use client";

import Link from "next/link";
import { Briefcase, ArrowLeft, ChevronRight } from "lucide-react";

export default function GestionChantierPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-950/95 via-blue-950/30 to-gray-950/95" />
      <div className="relative z-10 container mx-auto px-4 py-16 sm:py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-300 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Accueil
        </Link>
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center mx-auto mb-8">
            <Briefcase className="w-10 h-10 text-gray-900" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Gestion de Chantier</h1>
          <p className="text-gray-400 mb-8">
            Planification et suivi en temps réel de vos chantiers avec des outils avancés. Cette section sera bientôt disponible.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold"
          >
            Accéder au tableau de bord
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
