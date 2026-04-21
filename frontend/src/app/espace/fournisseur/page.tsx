"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Factory,
  Package,
  Truck,
  ShoppingCart,
  BarChart2,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  MessageCircle,
} from "lucide-react";
import { getStoredUser, type BMPUser } from "@/lib/auth";
import { KpiCard } from "@/components/layout/KpiCard";

export default function FournisseurSpacePage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoadingUser(false);
  }, []);

  if (!loadingUser && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Factory className="h-10 w-10 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Espace Fabricant</h2>
        <p className="text-sm text-gray-400">Connectez-vous pour accéder à votre espace fournisseur.</p>
        <button type="button" className="bmp-btn-primary mt-2" onClick={() => router.push("/login")}>
          Se connecter <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!loadingUser && user && user.role !== "manufacturer") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Accès réservé aux fabricants</h2>
        <p className="text-sm text-gray-400">
          Rôle actuel : <span className="text-amber-400">{user?.role}</span>
        </p>
      </div>
    );
  }

  // Sample catalog data
  const catalog = [
    { id: "p1", nom: "Ciment haute performance CEM I 52.5", ref: "CEM-001", cat: "Liants", stock: 450, prix: "32 TND/sac", statut: "Disponible" },
    { id: "p2", nom: "Carrelage grès cérame 60×60 effet béton", ref: "CAR-102", cat: "Revêtements", stock: 1200, prix: "65 TND/m²", statut: "Disponible" },
    { id: "p3", nom: "Fenêtre PVC double vitrage 120×140", ref: "PVC-034", cat: "Menuiserie", stock: 28, prix: "450 TND/u", statut: "Stock faible" },
    { id: "p4", nom: "Enduit façade monocouche 25kg", ref: "END-009", cat: "Façade", stock: 0, prix: "28 TND/sac", statut: "Rupture" },
  ];

  const orders = [
    { id: "c1", ref: "#BMP-2024-089", client: "Expert Karim B.", produit: "Ciment HP ×20 sacs", montant: "640 TND", date: "12/04/2024", statut: "Livré" },
    { id: "c2", ref: "#BMP-2024-088", client: "Client Sonia M.", produit: "Carrelage 60×60 ×40m²", montant: "2 600 TND", date: "10/04/2024", statut: "En transit" },
    { id: "c3", ref: "#BMP-2024-087", client: "Artisan Ahmed T.", produit: "Enduit façade ×10 sacs", montant: "280 TND", date: "08/04/2024", statut: "Préparation" },
  ];

  function StockBadge({ statut }: { statut: string }) {
    if (statut === "Disponible") return <span className="bmp-badge bmp-badge-success">{statut}</span>;
    if (statut === "Stock faible") return <span className="bmp-badge bmp-badge-warning">{statut}</span>;
    return <span className="bmp-badge bmp-badge-danger">{statut}</span>;
  }

  function OrderBadge({ statut }: { statut: string }) {
    if (statut === "Livré") return <span className="bmp-badge bmp-badge-success">{statut}</span>;
    if (statut === "En transit") return <span className="bmp-badge bmp-badge-info">{statut}</span>;
    return <span className="bmp-badge bmp-badge-warning">{statut}</span>;
  }

  return (
    <div className="bmp-os-page">
      {/* ── Header ── */}
      <div className="bmp-os-animate flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="bmp-section-title mb-1">Manufacturer OS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Catalogue & Supply Chain
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Gérez votre catalogue, les commandes B2B et le pipeline de livraison.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/messages" className="bmp-btn-secondary text-sm">
            <MessageCircle className="h-4 w-4" /> Messages
          </Link>
          <Link href="/gestion-marketplace" className="bmp-btn-primary text-sm">
            <Package className="h-4 w-4" /> Marketplace
          </Link>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="bmp-kpi-grid bmp-os-animate bmp-os-animate-delay-1">
        <KpiCard
          label="Produits catalogue"
          value={catalog.length}
          icon={Package}
          variant="amber"
          description="Références actives"
        />
        <KpiCard
          label="Commandes"
          value={orders.length}
          icon={ShoppingCart}
          variant="info"
          description="Ce mois"
          trend={{ value: 12, label: "vs mois dernier" }}
        />
        <KpiCard
          label="Chiffre mensuel"
          value="3.5K"
          icon={BarChart2}
          variant="success"
          description="TND · estimé"
          trend={{ value: 8, label: "vs mois dernier" }}
        />
        <KpiCard
          label="En rupture"
          value={catalog.filter((p) => p.statut === "Rupture").length}
          icon={AlertCircle}
          variant="danger"
          description="Références à réapprovisionner"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="bmp-os-animate bmp-os-animate-delay-2 grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Catalog */}
        <div className="bmp-enterprise-panel">
          <div className="bmp-enterprise-panel-header">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Catalogue Produits</h2>
            </div>
            <button className="bmp-btn-secondary text-[11px] py-1 px-3 gap-1">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Produit", "Réf.", "Catégorie", "Stock", "Prix", "Statut"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-[0.1em] text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {catalog.map((product) => (
                  <tr key={product.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white line-clamp-1 max-w-[180px]">{product.nom}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{product.ref}</td>
                    <td className="px-4 py-3 text-gray-300">{product.cat}</td>
                    <td className="px-4 py-3">
                      <span className={product.stock === 0 ? "text-red-400 font-semibold" : product.stock < 50 ? "text-orange-400 font-semibold" : "text-gray-200"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-400">{product.prix}</td>
                    <td className="px-4 py-3">
                      <StockBadge statut={product.statut} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3">
            <Link href="/gestion-marketplace" className="bmp-btn-secondary w-full justify-center text-xs">
              Gérer le catalogue complet <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Orders + logistics */}
        <div className="flex flex-col gap-5">
          {/* Orders */}
          <div className="bmp-enterprise-panel">
            <div className="bmp-enterprise-panel-header">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">Commandes récentes</h2>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {orders.map((order) => (
                <div key={order.id} className="px-4 py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-amber-400">{order.ref}</span>
                    <OrderBadge statut={order.statut} />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-white">{order.produit}</p>
                    <p className="text-[11px] text-gray-500">{order.client}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-400">{order.montant}</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      {order.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics module */}
          <div className="bmp-enterprise-panel">
            <div className="bmp-enterprise-panel-header">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-white">Pipeline livraisons</h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "En préparation", count: 1, color: "#fbbf24" },
                { label: "En transit", count: 1, color: "#60a5fa" },
                { label: "Livré ce mois", count: 1, color: "#34d399" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${item.color}18` }}>
                    <span className="text-[13px] font-bold" style={{ color: item.color }}>{item.count}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-300">{item.label}</p>
                    <div className="bmp-progress-track mt-1">
                      <div className="bmp-progress-fill" style={{ width: `${(item.count / 3) * 100}%`, background: item.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-center text-[11px] text-gray-500">
                Module logistique avancé — bientôt disponible
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
