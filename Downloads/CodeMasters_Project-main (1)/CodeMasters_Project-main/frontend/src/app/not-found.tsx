"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Home, Search, AlertTriangle, ArrowLeft, Globe, Construction } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    delay: string;
    duration: string;
  }>>([]);

  useEffect(() => {
    // Générer les particules côté client uniquement
    const generatedParticles = [...Array(15)].map((_, i) => {
      const seed = i * 0.1;
      return {
        left: `${(Math.sin(seed * 100) + 1) * 50}%`,
        top: `${(Math.cos(seed * 100) + 1) * 50}%`,
        delay: `${(i * 0.3) % 5}s`,
        duration: `${12 + (i % 8)}s`,
      };
    });
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Effets de fond */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/90 via-blue-950/40 to-gray-950/90"></div>
        
        {/* Grille discrète */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Effets de particules légères */}
        <div className="absolute inset-0">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>

        {/* Formes géométriques flottantes */}
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 20,
            ease: "linear" 
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 border border-amber-500/10 rounded-full opacity-20"
        />
        <motion.div
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [0, -180, -360]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 25,
            ease: "linear" 
          }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-blue-500/10 rounded-3xl opacity-20"
        />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge d'erreur animé */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center justify-center mb-8"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-16 h-16 text-red-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-gray-900 font-bold text-xl">404</span>
              </div>
            </div>
          </motion.div>

          {/* Titre principal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-red-500 bg-clip-text text-transparent">
              Page Introuvable
            </span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Oups ! Il semble que la page que vous cherchez soit en{" "}
            <span className="text-amber-300 font-semibold">construction</span> ou ait été{" "}
            <span className="text-blue-300 font-semibold">déplacée</span>.
          </motion.p>

          {/* Message d'erreur stylisé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-2xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 mb-12 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <Construction className="w-8 h-8 text-amber-400" />
              <span className="text-amber-300 font-medium text-lg">En chantier digital</span>
            </div>
            <p className="text-gray-300 mb-6">
              Notre équipe travaille dur pour construire la plateforme digitale la plus complète pour la construction. 
              Cette section est peut-être encore en développement ou a été réorganisée.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Globe className="w-4 h-4" />
              <span>Code d'erreur : 404 - Resource Not Found</span>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link href="/" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <Home className="w-5 h-5" />
                <span>Retour à l'accueil</span>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link href="/contact" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl backdrop-blur-2xl bg-white/10 border border-amber-500/30 text-white font-semibold hover:border-amber-500/50 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <Search className="w-5 h-5" />
                <span>Demander de l'aide</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Solutions suggérées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span>Solutions suggérées :</span>
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Vérifier l'URL",
                  description: "Assurez-vous que l'adresse est correctement orthographiée",
                  color: "from-blue-500/20 to-cyan-500/20",
                  border: "border-blue-500/30"
                },
                {
                  title: "Explorer nos solutions",
                  description: "Découvrez nos modules de gestion disponibles",
                  color: "from-amber-500/20 to-yellow-500/20",
                  border: "border-amber-500/30"
                },
                {
                  title: "Contactez-nous",
                  description: "Notre équipe vous aidera à trouver ce que vous cherchez",
                  color: "from-emerald-500/20 to-teal-500/20",
                  border: "border-emerald-500/30"
                },
                {
                  title: "Recherche avancée",
                  description: "Utilisez notre moteur de recherche pour trouver",
                  color: "from-purple-500/20 to-pink-500/20",
                  border: "border-purple-500/30"
                }
              ].map((solution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                  whileHover={{ y: -5 }}
                  className={`backdrop-blur-xl ${solution.color} rounded-2xl p-5 border ${solution.border} hover:shadow-lg transition-all duration-300`}
                >
                  <h4 className="text-lg font-semibold text-white mb-2">{solution.title}</h4>
                  <p className="text-gray-300 text-sm">{solution.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Message de pied de page */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 pt-8 border-t border-white/10"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center">
                <Construction className="w-6 h-6 text-gray-900" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                  BMP.tn
                </div>
                <div className="text-blue-300/70 text-sm font-light">
                  Construction Digitale en Évolution
                </div>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Nous travaillons constamment à améliorer notre plateforme. 
              Merci de votre compréhension pendant que nous bâtissons l'avenir digital de la construction.
            </p>
            
            <div className="text-gray-500 text-xs">
              © 2024 BMP.tn – Erreur 404 • Page non trouvée
            </div>
          </motion.div>
        </div>

        {/* Animation de chargement progressif */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, delay: 0.5 }}
          className="fixed bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
        />
      </div>
    </div>
  );
}