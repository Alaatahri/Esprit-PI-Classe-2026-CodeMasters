"use client";

import Link from "next/link";
import { Building2, Mail, Phone, MapPin, ArrowLeft, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-950/95 via-blue-950/30 to-gray-950/95" />
      <div className="relative z-10 container mx-auto px-4 py-16 sm:py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-300 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-gray-900" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                Contactez-nous
              </h1>
              <p className="text-gray-400 mt-1">BMP.tn – Plateforme de construction digitale</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Mail, title: "Email", value: "contact@bmp.tn" },
              { icon: Phone, title: "Téléphone", value: "+216 70 000 000" },
              { icon: MapPin, title: "Siège", value: "Tunis, Tunisie" },
            ].map((item) => (
              <div
                key={item.title}
                className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <item.icon className="w-6 h-6 text-amber-400 mb-3" />
                <div className="text-gray-400 text-sm">{item.title}</div>
                <div className="text-white font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Demander une démonstration</h2>
            <p className="text-gray-400 mb-6">
              Rejoignez les professionnels qui optimisent déjà leurs opérations avec BMP.tn.
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
              Envoyer un message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
