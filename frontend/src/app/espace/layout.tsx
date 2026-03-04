"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Home,
  Briefcase,
  ShoppingCart,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Mail,
} from "lucide-react";
import { getStoredUser, clearStoredUser, type BMPUser } from "@/lib/auth";

const baseNavItems = [
  { key: "home", href: "/espace", label: "Mon espace", icon: Home },
  { key: "chantier", href: "/gestion-chantier", label: "Gestion de Chantier", icon: Briefcase },
  { key: "devis", href: "/gestion-devis-facturation", label: "Devis & Facturation", icon: FileText },
  { key: "marketplace", href: "/gestion-marketplace", label: "Marketplace", icon: ShoppingCart },
  { key: "contact", href: "/contact", label: "Contact", icon: Mail },
];

export default function EspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = baseNavItems.map((item) => {
    if (item.key !== "home") return item;

    if (!user) return item;

    const roleHref =
      user.role === "client"
        ? "/espace/client"
        : user.role === "expert"
        ? "/espace/expert"
        : user.role === "artisan"
        ? "/espace/artisan"
        : user.role === "admin"
        ? "/espace/admin"
        : "/espace";

    return { ...item, href: roleHref };
  });

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setUser(getStoredUser());
  }, [mounted]);

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    router.push("/espace");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl border-2 border-amber-500/50 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Top bar - face entreprise */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/90 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 lg:h-18 items-center justify-between gap-4">
            <Link href="/espace" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Building2 className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                  BMP.tn
                </span>
                <div className="text-[10px] text-amber-400/80 font-medium tracking-widest">
                  MON ESPACE
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/espace"
                    ? pathname === "/espace"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {user?.role === "client" && (
                <>
                  <Link
                    href="/espace/client"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname?.startsWith("/espace/client") &&
                      !pathname?.startsWith("/espace/client/nouveau-projet")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Mes projets
                  </Link>
                  <Link
                    href="/espace/client/nouveau-projet"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname?.startsWith("/espace/client/nouveau-projet")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    + Nouveau projet
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                      <span className="text-sm font-bold text-amber-300">
                        {user.nom?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.nom}</p>
                      <p className="text-xs text-amber-400/80 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all"
                    title="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  Connexion
                </Link>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                aria-label="Menu"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-xl">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 hover:text-amber-300"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                  </Link>
                );
              })}
              {user?.role === "client" && (
                <>
                  <Link
                    href="/espace/client"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 hover:text-amber-300"
                  >
                    Mes projets
                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                  </Link>
                  <Link
                    href="/espace/client/nouveau-projet"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 hover:text-amber-300"
                  >
                    + Nouveau projet
                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
