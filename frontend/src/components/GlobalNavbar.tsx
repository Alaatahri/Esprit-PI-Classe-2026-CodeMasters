"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Home,
  Briefcase,
  ShoppingCart,
  FileText,
  Mail,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { getStoredUser, clearStoredUser, type BMPUser } from "@/lib/auth";

const baseNavItems = [
  { key: "home", href: "/espace", label: "Mon espace", icon: Home },
  { key: "chantier", href: "/gestion-chantier", label: "Chantier", icon: Briefcase },
  { key: "devis", href: "/gestion-devis-facturation", label: "Devis", icon: FileText },
  { key: "marketplace", href: "/gestion-marketplace", label: "Marketplace", icon: ShoppingCart },
  { key: "contact", href: "/contact", label: "Contact", icon: Mail },
];

export default function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  const navItems = useMemo(() => {
    const role = user?.role;
    const canSeeChantier = role === "admin" || role === "artisan" || role === "ouvrier";

    const filteredBase = baseNavItems.filter((item) => {
      if (item.key === "chantier") return canSeeChantier;
      return true;
    });

    return filteredBase.map((item) => {
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
  }, [user]);

  const extraClientItems =
    user?.role === "client"
      ? [
          { href: "/espace/client", label: "Mes projets" },
          { href: "/espace/client/nouveau-projet", label: "+ Nouveau projet" },
        ]
      : [];

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    setMobileOpen(false);
    router.push("/espace");
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/espace") return pathname === "/espace";
    return pathname.startsWith(href);
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Building2 className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                BMP.tn
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-2xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/espace" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Building2 className="w-5 h-5 text-gray-900" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                BMP.tn
              </span>
              <div className="text-[10px] text-amber-400/80 font-medium tracking-widest">
                PLATEFORME
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-gray-300/80 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {extraClientItems.length > 0 && (
              <div className="hidden xl:flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
                {extraClientItems.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(it.href)
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-gray-300/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
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
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-white">{user.nom}</p>
                    <p className="text-xs text-amber-400/80 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300/80 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Déconnexion</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                Connexion
              </Link>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-gray-300/80 hover:text-white hover:bg-white/5"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive(item.href)
                      ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                      : "text-gray-200/80 hover:bg-white/5 hover:text-amber-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                </Link>
              );
            })}

            {extraClientItems.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                {extraClientItems.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive(it.href)
                        ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                        : "text-gray-200/80 hover:bg-white/5 hover:text-amber-300"
                    }`}
                  >
                    {it.label}
                    <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-2 pt-3 border-t border-white/10">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-300 border border-white/10"
                >
                  <LogOut className="w-5 h-5" />
                  Déconnexion
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold"
                >
                  Connexion
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

