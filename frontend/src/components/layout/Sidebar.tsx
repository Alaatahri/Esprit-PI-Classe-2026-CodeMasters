"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  MessageCircle,
  ShoppingBag,
  FileText,
  Users,
  ClipboardList,
  Inbox,
  Briefcase,
  UserCircle,
  Package,
  ShoppingCart,
  BarChart2,
  Zap,
  LogOut,
  HelpCircle,
  ChevronRight,
  HardHat,
  Camera,
  Building2,
} from "lucide-react";
import { clearStoredUser, type BMPUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: BMPUser | null;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function getNavSections(role: string | undefined): NavSection[] {
  switch (role) {
    case "client":
      return [
        {
          title: "Principale",
          items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/espace/client", exact: true },
            { label: "Mes Projets", icon: FolderOpen, href: "/espace/client/suivi" },
            { label: "Nouveau Projet", icon: PlusCircle, href: "/espace/client/nouveau-projet" },
          ],
        },
        {
          title: "Services",
          items: [
            { label: "Marketplace", icon: ShoppingBag, href: "/gestion-marketplace" },
            { label: "Devis & Factures", icon: FileText, href: "/gestion-devis-facturation" },
            { label: "Messages", icon: MessageCircle, href: "/messages" },
          ],
        },
      ];
    case "expert":
      return [
        {
          title: "Principale",
          items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/espace/expert", exact: true },
            { label: "Tous les Projets", icon: FolderOpen, href: "/expert/tous-les-projets" },
            { label: "Mes Projets", icon: ClipboardList, href: "/expert/projets" },
            { label: "Invitations", icon: Inbox, href: "/expert/nouveaux-projets" },
          ],
        },
        {
          title: "Services",
          items: [
            { label: "Marketplace", icon: ShoppingBag, href: "/gestion-marketplace" },
            { label: "Devis & Factures", icon: FileText, href: "/gestion-devis-facturation" },
            { label: "Messages", icon: MessageCircle, href: "/messages" },
          ],
        },
      ];
    case "artisan":
      return [
        {
          title: "Principale",
          items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/espace/artisan", exact: true },
            { label: "Missions disponibles", icon: Briefcase, href: "/espace/artisan" },
            { label: "Gestion Chantier", icon: HardHat, href: "/gestion-chantier" },
            { label: "Photos Chantier", icon: Camera, href: "/gestion-chantier" },
          ],
        },
        {
          title: "Mon Compte",
          items: [
            { label: "Mon Profil", icon: UserCircle, href: "/espace/artisan/profil" },
            { label: "Messages", icon: MessageCircle, href: "/messages" },
          ],
        },
      ];
    case "manufacturer":
      return [
        {
          title: "Principale",
          items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/espace/fournisseur", exact: true },
            { label: "Catalogue Produits", icon: Package, href: "/gestion-marketplace" },
            { label: "Commandes B2B", icon: ShoppingCart, href: "/gestion-marketplace" },
          ],
        },
        {
          title: "Services",
          items: [
            { label: "Marketplace", icon: ShoppingBag, href: "/gestion-marketplace" },
            { label: "Messages", icon: MessageCircle, href: "/messages" },
          ],
        },
      ];
    case "admin":
      return [
        {
          title: "Administration",
          items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/espace/admin", exact: true },
            { label: "Tous les Projets", icon: FolderOpen, href: "/expert/tous-les-projets" },
            { label: "Utilisateurs", icon: Users, href: "/espace/admin" },
            { label: "Matching Expert", icon: Zap, href: "/espace/admin" },
            { label: "Analytics", icon: BarChart2, href: "/espace/admin" },
          ],
        },
        {
          title: "Services",
          items: [
            { label: "Messages", icon: MessageCircle, href: "/messages" },
          ],
        },
      ];
    default:
      return [
        {
          title: "Navigation",
          items: [
            { label: "Accueil", icon: LayoutDashboard, href: "/espace" },
            { label: "Messages", icon: MessageCircle, href: "/messages" },
          ],
        },
      ];
  }
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  client: { label: "Client", color: "text-sky-400", bg: "bg-sky-500/[0.12]" },
  expert: { label: "Expert BTP", color: "text-amber-400", bg: "bg-amber-500/[0.12]" },
  artisan: { label: "Artisan", color: "text-emerald-400", bg: "bg-emerald-500/[0.12]" },
  manufacturer: { label: "Fabricant", color: "text-violet-400", bg: "bg-violet-500/[0.12]" },
  admin: { label: "Administrateur", color: "text-red-400", bg: "bg-red-500/[0.12]" },
};

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = user?.role ?? "";
  const sections = getNavSections(role);
  const rc = roleConfig[role] ?? { label: role, color: "text-gray-400", bg: "bg-white/[0.06]" };

  const handleLogout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = user?.nom
    ? user.nom
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      style={{
        background: "#0d1117",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Brand ── */}
      <div
        className="flex h-[60px] shrink-0 items-center gap-3 px-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30">
          <Building2 className="h-4 w-4 text-gray-900" />
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[15px] font-black tracking-tight text-white">BMP</span>
          <span className="text-[15px] font-black tracking-tight text-amber-400">.tn</span>
        </div>
        <span className="ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-500"
          style={{ background: "rgba(245,158,11,0.12)" }}>
          OS
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-bmp">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label + item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                      active
                        ? "text-amber-300"
                        : "text-gray-400 hover:text-gray-200",
                    )}
                    style={
                      active
                        ? { background: "rgba(245,158,11,0.12)" }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (!active)
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active
                          ? "text-amber-400"
                          : "text-gray-500 group-hover:text-gray-300",
                      )}
                    />
                    <span className="flex-1 leading-none">{item.label}</span>
                    {active && (
                      <ChevronRight className="h-3 w-3 text-amber-500/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Support */}
        <div className="mb-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">
            Support
          </p>
          <Link
            href="/contact"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-400 transition-all hover:text-gray-200"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.04)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "")
            }
          >
            <HelpCircle className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-gray-300" />
            <span>Aide & Contact</span>
          </Link>
        </div>
      </nav>

      {/* ── User ── */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 rounded-xl px-3 py-3"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/80 to-amber-600/50 text-[11px] font-bold text-gray-900">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-none text-white">
              {user?.nom ?? "Utilisateur"}
            </p>
            <div className={cn("mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", rc.color, rc.bg)}>
              {rc.label}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:text-red-400"
            title="Se déconnecter"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(239,68,68,0.12)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "")
            }
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
