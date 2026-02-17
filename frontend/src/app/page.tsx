"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link"; // Ajouter l'import de Link
import { 
  Building2, 
  ShoppingCart, 
  FileText, 
  BarChart3,
  Globe,
  Database,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Play,
  Target,
  Zap,
  Shield,
  Briefcase,
  Code,
  Star,
  Twitter,
  Instagram,
  Facebook,
  ChevronRight
} from "lucide-react";

// ==================== COMPOSANT PROFILE CARD ====================
const ProfileCard = ({ 
  name, 
  role, 
  module, 
  avatarUrl, 
  color = "from-amber-500 to-yellow-300" 
}: {
  name: string;
  role: string;
  module: string;
  avatarUrl: string;
  color?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -15, scale: 1.02 }}
      viewport={{ once: true }}
      className="relative group"
    >
      <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 p-8 transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-500/20">
        {/* Avatar Section */}
        <div className="relative mb-8">
          <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${color} mx-auto flex items-center justify-center overflow-hidden border-4 border-white/30 group-hover:border-amber-300/50 transition-all duration-500`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="text-4xl font-bold text-white">
                {name.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Badge Online */}
          <div className="absolute bottom-2 right-1/4 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
        </div>
        
        {/* Info Section */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
            {name}
          </h3>
          <div className="text-amber-300 font-medium text-lg">{role}</div>
          <div className="text-blue-300 text-sm font-light tracking-wide">{module}</div>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">5+</div>
              <div className="text-gray-300 text-xs">Ans Exp</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">50+</div>
              <div className="text-gray-300 text-xs">Projets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">98%</div>
              <div className="text-gray-300 text-xs">Satisf.</div>
            </div>
          </div>
          
          {/* Contact Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/30 to-amber-500/10 hover:from-amber-500/40 hover:to-amber-500/20 border border-amber-500/30 text-amber-300 font-medium transition-all duration-300 w-full group/btn"
          >
            <Mail className="w-4 h-4 inline mr-2 group-hover/btn:translate-x-1 transition-transform" />
            Contacter
          </motion.button>
        </div>
        
        {/* Hover Effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
      </div>
    </motion.div>
  );
};

// ==================== PAGE PRINCIPALE ====================
export default function PremiumHomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    delay: string;
    duration: string;
  }>>([]);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.9;
    }
    
    // Générer les particules côté client uniquement
    const generatedParticles = [...Array(20)].map((_, i) => {
      const seed = i * 0.05;
      return {
        left: `${(Math.sin(seed * 100) + 1) * 50}%`,
        top: `${(Math.cos(seed * 100) + 1) * 50}%`,
        delay: `${(i * 0.25) % 5}s`,
        duration: `${15 + (i % 10)}s`,
      };
    });
    setParticles(generatedParticles);
  }, []);

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "Gestion de Chantier", href: "/gestion-chantier" },
    { label: "Devis & Facturation IA", href: "/gestion-devis-facturation" },
    { label: "Marketplace", href: "/gestion-marketplace" },
    { label: "Contact", href: "/contact" },
  ];

  const team = [
    {
      name: "Alaa Tahri",
      role: "Directeur Technique",
      module: "Architecture & Stratégie",
      color: "from-amber-600 to-yellow-400",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3087&auto=format&fit=crop"
    },
    {
      name: "Syrine Jedidi",
      role: "Lead Frontend",
      module: "Module Gestion de Chantier",
      color: "from-blue-900 to-blue-600",
      avatarUrl: "https://i.pinimg.com/originals/ea/b9/2c/eab92c9626961550bd4cf661f032771f.jpg"
    },
    {
      name: "Ibtihel Mechergui",
      role: "Lead Backend & IA",
      module: "Module Devis & Facturation IA",
      color: "from-purple-700 to-pink-500",
      avatarUrl: "https://i.pinimg.com/originals/e7/27/6b/e7276b09fcc02fa5d81f57baa564274b.jpg"
    },
    {
      name: "Wale Rezgui",
      role: "Full-Stack Architect",
      module: "Module Marketplace",
      color: "from-cyan-700 to-blue-500",
      avatarUrl: "https://cdn.pixabay.com/photo/2023/01/22/11/49/girl-7736189_1280.jpg"
    },
  ];

  const features = [
    {
      icon: <Briefcase className="w-10 h-10" />,
      title: "Gestion de Projet",
      description: "Planification et suivi en temps réel de vos chantiers avec des outils IA avancés",
      color: "from-amber-500 to-yellow-300",
      delay: 0.1
    },
    {
      icon: <ShoppingCart className="w-10 h-10" />,
      title: "Marketplace B2B",
      description: "Catalogue digital de matériaux et équipements avec réalité augmentée",
      color: "from-blue-600 to-cyan-400",
      delay: 0.2
    },
    {
      icon: <Code className="w-10 h-10" />,
      title: "Intelligence Artificielle",
      description: "Devis et facturation automatisés par IA avec analyse prédictive",
      color: "from-purple-600 to-pink-400",
      delay: 0.3
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Analytics Avancés",
      description: "Tableaux de bord interactifs et analyses prédictives en temps réel",
      color: "from-emerald-600 to-teal-400",
      delay: 0.4
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-x-hidden">
      {/* Vidéo de fond principale */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute w-full h-full object-cover"
            src="/videos/VD.mp4"
            onError={() => setVideoError(true)}
          />
        )}
        {/* Overlay gradient (toujours visible; masque la vidéo si absente) */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/85 via-blue-950/50 to-gray-950/85"></div>
        {/* Effets de particules légères */}
        <div className="absolute inset-0">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation Premium */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-700 ${
          isScrolled 
            ? "bg-white/10 backdrop-blur-2xl py-4 border-b border-white/20 shadow-2xl" 
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Building2 className="w-7 h-7 text-gray-900" />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-white to-amber-100 bg-clip-text text-transparent">
                    BMP.tn
                  </span>
                  <div className="text-xs text-blue-300/70 font-light tracking-widest mt-0.5">
                    CONSTRUCTION DIGITALE
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              {navItems.map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link
                    href={item.href}
                    className="relative text-gray-200 hover:text-amber-300 transition-all duration-300 font-medium group/nav"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-300 group-hover/nav:w-full transition-all duration-500"></span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/login"
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all duration-300 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Login
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-gray-200 hover:text-amber-300 p-2 transition-colors"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-6 backdrop-blur-2xl bg-white/10 rounded-2xl border border-white/20 p-6 space-y-4"
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-gray-200 hover:text-amber-300 py-3 border-b border-white/10 last:border-0 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold shadow-lg mt-4 text-center block"
              >
                Login
              </Link>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 lg:pt-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-40">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto text-center"
          >
            {/* Badge élégant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-amber-500/30 mb-12"
            >
              
            </motion.div>

            {/* Titre principal */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-amber-300 via-white to-amber-100 bg-clip-text text-transparent">
                CONSTRUIRE
              </span>
              <br />
              <span className="text-white text-4xl sm:text-5xl lg:text-7xl">
                L'AVENIR NUMÉRIQUE
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                DE LA CONSTRUCTION
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl lg:text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed"
            >
              La première plateforme intelligente qui <span className="text-amber-300 font-semibold">connecte</span>,{" "}
              <span className="text-blue-300 font-semibold">automatise</span> et{" "}
              <span className="text-cyan-300 font-semibold">optimise</span>
              <br className="hidden sm:block" />
              l'ensemble de la chaîne de valeur du secteur.
            </motion.p>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/gestion-chantier"
                  className="px-10 sm:px-12 py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold text-lg shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all duration-300 flex items-center justify-center gap-4 group"
                >
                  <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Démarrer un projet</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 sm:px-12 py-5 sm:py-6 rounded-2xl backdrop-blur-2xl bg-white/10 border border-amber-500/30 text-white font-semibold text-lg hover:border-amber-500/50 hover:bg-white/20 transition-all duration-300"
              >
                Explorer les fonctionnalités
              </motion.button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              {[
                { 
                  value: "+95%", 
                  label: "Satisfaction Client", 
                  icon: <Star className="w-6 h-6 sm:w-8 sm:h-8" />,
                  description: "Taux de recommandation",
                  color: "text-amber-400"
                },
                { 
                  value: "24/7", 
                  label: "Disponibilité", 
                  icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
                  description: "Support technique",
                  color: "text-blue-400"
                },
                { 
                  value: "3x", 
                  label: "Plus Rapide", 
                  icon: <Target className="w-6 h-6 sm:w-8 sm:h-8" />,
                  description: "Gestion des projets",
                  color: "text-green-400"
                },
                { 
                  value: "40%", 
                  label: "Économies", 
                  icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8" />,
                  description: "Rentabilité accrue",
                  color: "text-purple-400"
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                  whileHover={{ y: -10 }}
                  className="backdrop-blur-2xl bg-white/10 rounded-2xl p-6 border border-white/20 hover:border-amber-500/30 transition-all duration-500 group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`mb-4 ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-lg font-semibold text-white mb-2">{stat.label}</div>
                    <div className="text-gray-300 text-sm">{stat.description}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30"
        >
          <div className="flex flex-col items-center">
            <div className="text-amber-300/50 text-sm mb-2 tracking-widest">EXPLORER</div>
            <div className="w-1 h-12 bg-gradient-to-b from-amber-400/50 to-transparent rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-transparent"></div>
        <div className="container mx-auto relative z-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-block bg-gradient-to-r from-amber-500/10 to-blue-500/10 backdrop-blur-xl px-6 sm:px-8 py-3 rounded-2xl border border-white/20 mb-8">
              <span className="text-amber-300 font-light tracking-widest text-sm sm:text-base">
                SOLUTIONS INNOVANTES
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
                Une Plateforme
              </span>
              <span className="text-amber-300"> Complète</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Découvrez comment BMP.tn transforme chaque aspect de votre activité avec des outils puissants et intuitifs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: feature.delay }}
                whileHover={{ y: -15 }}
                className="backdrop-blur-2xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 hover:border-amber-500/30 transition-all duration-500 group"
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg mx-auto`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-center text-sm sm:text-base">
                  {feature.description}
                </p>
                
                <div className="mt-8 pt-6 border-t border-white/20">
                  <Link
                    href={
                      feature.title === "Gestion de Projet" ? "/gestion-chantier" :
                      feature.title === "Marketplace B2B" ? "/gestion-marketplace" :
                      feature.title === "Intelligence Artificielle" ? "/gestion-devis-facturation" :
                      "/contact"
                    }
                    className="text-amber-300 hover:text-amber-200 font-medium flex items-center justify-center gap-2 group/link mx-auto"
                  >
                    En savoir plus
                    <ChevronRight className="w-4 h-4 group-hover/link:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-gray-900/30 to-transparent">
        <div className="container mx-auto relative z-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-block bg-gradient-to-r from-amber-500/10 to-blue-500/10 backdrop-blur-xl px-6 sm:px-8 py-3 rounded-2xl border border-white/20 mb-8">
              <span className="text-amber-300 font-light tracking-widest text-sm sm:text-base">
                NOTRE ÉQUIPE D'EXPERTS
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
                Les Artisans
              </span>
              <span className="text-amber-300"> du Digital</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Rencontrez l'équipe de passionnés qui donne vie à la révolution digitale de la construction.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <ProfileCard
                key={index}
                name={member.name}
                role={member.role}
                module={member.module}
                avatarUrl={member.avatarUrl}
                color={member.color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/40 to-transparent"></div>
        <div className="container mx-auto relative z-40">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 sm:mb-20"
            >
              <div className="inline-block bg-gradient-to-r from-amber-500/10 to-blue-500/10 backdrop-blur-xl px-6 sm:px-8 py-3 rounded-2xl border border-white/20 mb-8">
                <span className="text-amber-300 font-light tracking-widest text-sm sm:text-base">
                  PRÊT À TRANSFORMER VOTRE ENTREPRISE ?
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                  Contactez-nous
                </span>
                <span className="text-blue-300"> dès aujourd'hui</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Rejoignez les centaines de professionnels qui optimisent déjà leurs opérations avec BMP.tn
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
              {[
                { icon: <Mail className="w-6 h-6 sm:w-8 sm:h-8" />, title: "Email", info: "contact@bmp.tn", action: "Envoyer un message" },
                { icon: <Phone className="w-6 h-6 sm:w-8 sm:h-8" />, title: "Téléphone", info: "+216 70 000 000", action: "Nous appeler" },
                { icon: <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />, title: "Siège Social", info: "Tunis, Tunisie", action: "Visiter" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="backdrop-blur-2xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 hover:border-amber-500/30 transition-all duration-300"
                >
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 border border-white/20">
                    {item.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 text-center">{item.title}</h3>
                  <p className="text-amber-300 text-xl sm:text-2xl mb-6 text-center">{item.info}</p>
                  <button className="text-blue-300 hover:text-amber-300 font-medium transition-colors duration-300 flex items-center justify-center gap-2 mx-auto group/link">
                    {item.action}
                    <ChevronRight className="w-4 h-4 group-hover/link:translate-x-2 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* CTA Final */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 sm:px-16 py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold text-lg sm:text-xl shadow-2xl shadow-amber-500/50 hover:shadow-amber-500/70 transition-all duration-300"
                >
                  Demander une démonstration personnalisée
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent"></div>
        <div className="container mx-auto relative z-40">
          <div className="grid lg:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-16">
            {/* Logo et description */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-900" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                    BMP.tn
                  </div>
                  <div className="text-blue-300/70 font-light text-sm sm:text-base mt-1">
                    La révolution digitale de la construction
                  </div>
                </div>
              </Link>
              <p className="text-gray-400 max-w-md leading-relaxed text-sm sm:text-base">
                BMP.tn est la plateforme digitale de référence pour les professionnels de la construction. 
                Nous connectons les experts, artisans et fabricants dans un écosystème unifié et innovant.
              </p>
            </div>
            
            {/* Liens rapides */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-6">Navigation</h3>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-gray-400 hover:text-amber-300 transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Social et contact */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-6">Connectez-vous</h3>
              <div className="flex space-x-4 mb-8">
                {[
                  { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn", color: "hover:bg-blue-600" },
                  { icon: <Github className="w-5 h-5" />, label: "GitHub", color: "hover:bg-gray-800" },
                  { icon: <Twitter className="w-5 h-5" />, label: "Twitter", color: "hover:bg-sky-500" },
                  { icon: <Facebook className="w-5 h-5" />, label: "Facebook", color: "hover:bg-blue-700" },
                  { icon: <Instagram className="w-5 h-5" />, label: "Instagram", color: "hover:bg-pink-600" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className={`w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-300 ${social.color}`}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              <div className="text-gray-400 text-sm">
                <p className="mb-2">📧 contact@bmp.tn</p>
                <p>📍 Tunis, Tunisie</p>
              </div>
            </div>
          </div>
          
          {/* Copyright et mentions */}
          <div className="pt-8 border-t border-white/10 text-center">
            <div className="text-gray-500 text-sm mb-4">
              © 2024 BMP.tn – Plateforme Digitale pour la Construction. Tous droits réservés.
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-gray-500 text-xs">
              <a href="#" className="hover:text-amber-300 transition-colors">Mentions légales</a>
              <span>•</span>
              <a href="#" className="hover:text-amber-300 transition-colors">Politique de confidentialité</a>
              <span>•</span>
              <a href="#" className="hover:text-amber-300 transition-colors">Conditions d'utilisation</a>
              <span>•</span>
              <a href="#" className="hover:text-amber-300 transition-colors">Cookies</a>
            </div>
            <div className="mt-6 text-gray-600 text-xs">
              Conçu avec ❤️ pour transformer le secteur de la construction
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}