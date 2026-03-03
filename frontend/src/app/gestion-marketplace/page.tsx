"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  ArrowLeft,
  Search,
  ShoppingBag,
  Star,
  Filter,
} from "lucide-react";

const PRODUCTS = [
  {
    id: "1",
    name: "Ciment Portland CPJ 42.5",
    description: "Ciment pour béton et mortier. Sac 50 kg. NF.",
    price: 18.5,
    unit: "sac",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80",
    category: "Ciments & liants",
    rating: 4.8,
    stock: "En stock",
  },
  {
    id: "2",
    name: "Briques rouges 20x10x5 cm",
    description: "Briques pleines terre cuite. Palette 500 pièces.",
    price: 420,
    unit: "palette",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    category: "Gros œuvre",
    rating: 4.6,
    stock: "En stock",
  },
  {
    id: "3",
    name: "Acier laminé Tôle 1.5 mm",
    description: "Tôle galvanisée 1x2 m. Épaisseur 1.5 mm.",
    price: 85,
    unit: "feuille",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80",
    category: "Métallerie",
    rating: 4.7,
    stock: "En stock",
  },
  {
    id: "4",
    name: "Sable 0/4 alluvionnaire",
    description: "Sable pour béton et enduits. Big bag 1 m³.",
    price: 65,
    unit: "m³",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    category: "Granulats",
    rating: 4.5,
    stock: "En stock",
  },
  {
    id: "5",
    name: "Carrelage sol 60x60 grès cérame",
    description: "Carrelage imitation bois. 1.44 m²/boîte. 8 boîtes/palette.",
    price: 42,
    unit: "m²",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    category: "Revêtements",
    rating: 4.9,
    stock: "En stock",
  },
  {
    id: "6",
    name: "Peinture acrylique blanche mate",
    description: "Peinture pour murs et plafonds. 10 L. Couvrance 12 m²/L.",
    price: 78,
    unit: "pot 10 L",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80",
    category: "Peinture",
    rating: 4.7,
    stock: "En stock",
  },
  {
    id: "7",
    name: "Tuyau PVC Ø 100 mm",
    description: "Tuyau évacuation eaux usées. Longueur 2 m. NF.",
    price: 22,
    unit: "ml",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80",
    category: "Plomberie",
    rating: 4.4,
    stock: "En stock",
  },
  {
    id: "8",
    name: "Parpaing creux 20x20x50 cm",
    description: "Bloc béton pour murs. 10 pièces/m². Palette 80 pièces.",
    price: 2.8,
    unit: "pièce",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    category: "Gros œuvre",
    rating: 4.6,
    stock: "En stock",
  },
  {
    id: "9",
    name: "Treillis soudé 2.40x6 m",
    description: "Treillis pour dalles et chapes. Maille 15x15. Ø 7 mm.",
    price: 95,
    unit: "panneau",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
    category: "Métallerie",
    rating: 4.8,
    stock: "En stock",
  },
];

const CATEGORIES = [
  "Tous",
  "Ciments & liants",
  "Gros œuvre",
  "Métallerie",
  "Granulats",
  "Revêtements",
  "Peinture",
  "Plomberie",
];

export default function GestionMarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");

  const filtered = PRODUCTS.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Tous" || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-950/95 via-amber-950/20 to-gray-950/95" />
      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Accueil
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <ShoppingBag className="w-7 h-7 text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Marketplace B2B
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Matériaux et équipements de construction
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search & filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-10"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter className="w-5 h-5 text-gray-500 shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product, i) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:border-amber-500/30 hover:bg-white/10 transition-all duration-300"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-800/50">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-900/80 text-xs text-gray-300">
                    {product.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-gray-900/80 px-2 py-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-white">{product.rating}</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-medium">{product.stock}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-amber-200 transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-2xl font-bold text-amber-400">
                      {product.price.toFixed(2)} <span className="text-sm font-normal text-gray-500">TND</span>
                    </span>
                    <span className="text-xs text-gray-500 block">/ {product.unit}</span>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">Acheter</span>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun produit ne correspond à votre recherche.</p>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-14 text-center"
        >
          <p className="text-gray-500 text-sm mb-4">
            Vous êtes professionnel ? Connectez-vous pour passer des commandes en volume.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 hover:border-amber-500/30 transition-all"
          >
            Se connecter
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
