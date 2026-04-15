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
  ClipboardList,
  Mail,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Camera,
  MessageCircle,
  FolderKanban,
  Layers,
  type LucideIcon,
} from "lucide-react";
import {
  getStoredUser,
  clearStoredUser,
  isClientRole,
  normalizeRole,
  AUTH_CHANGE_EVENT,
  type BMPUser,
} from "@/lib/auth";
import { fetchUnreadCount } from "@/lib/messages-api";

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
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const userId = user?._id ?? "";

  useEffect(() => {
    if (!userId) {
      setUnreadMessages(0);
      return;
    }
    const tick = async () => {
      try {
        const n = await fetchUnreadCount(userId);
        setUnreadMessages(typeof n === "number" && n > 0 ? n : 0);
      } catch {
        setUnreadMessages(0);
      }
    };
    void tick();
    const id = window.setInterval(tick, 45_000);
    return () => window.clearInterval(id);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const n = await fetchUnreadCount(userId);
        setUnreadMessages(typeof n === "number" && n > 0 ? n : 0);
      } catch {
        setUnreadMessages(0);
      }
    })();
  }, [pathname, userId]);

  const navItems = useMemo(() => {
    const role = user?.role;
    const canSeeChantier = role === "admin" || role === "artisan" || role === "ouvrier";

    const filteredBase = baseNavItems.filter((item) => {
      if (item.key === "chantier") return canSeeChantier;
      return true;
    });

    const mapped = filteredBase.map((item) => {
      if (item.key !== "home") return item;
      if (!user) return item;

      const roleHref = isClientRole(user.role)
        ? "/espace/client"
        : user.role === "expert"
          ? "/espace/expert"
          : user.role === "artisan"
            ? "/espace/artisan"
            : user.role === "livreur"
              ? "/espace/livreur"
              : user.role === "admin"
                ? "/espace/admin"
                : "/espace";

      return { ...item, href: roleHref };
    });

    return mapped;
  }, [user]);

  const extraClientItems: Array<{
    href: string;
    label: string;
    icon?: LucideIcon;
    title?: string;
  }> = isClientRole(user?.role)
    ? [
        {
          href: "/espace/client/suivi",
          label: "Suivi de mes projets",
          icon: Camera,
          title: "Voir le taux d'avancement et les photos de chantier",
        },
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
    if (href === "/espace/client") {
      return (
        pathname === "/espace/client" ||
        pathname === "/espace/client/nouveau-projet"
      );
    }
    if (href === "/espace/livreur") {
      return pathname === "/espace/livreur" || pathname.startsWith("/espace/livreur/");
    }
    if (href === "/espace/client/suivi") {
      return pathname.startsWith("/espace/client/suivi");
    }
    if (href === "/messages") {
      return pathname.startsWith("/messages");
    }
    if (href === "/expert/projets") {
      return pathname.startsWith("/expert/projets");
    }
    if (href === "/expert/tous-les-projets") {
      return pathname.startsWith("/expert/tous-les-projets");
    }
    return pathname.startsWith(href);
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/90 backdrop-blur-2xl">
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
            <div className="w-10 h-10 rounded-xl border border-white/5 bg-black/30" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/90 backdrop-blur-2xl">
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

          <nav className="hidden lg:flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-bmp">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key ?? item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 whitespace-nowrap ${
                    isActive(item.href)
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {extraClientItems.length > 0 && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/5 shrink-0">
                {extraClientItems.map((it) => {
                  const ExtraIcon = it.icon;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      title={it.title}
                      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                        isActive(it.href)
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
                      }`}
                    >
                      {ExtraIcon ? (
                        <ExtraIcon className="w-4 h-4 shrink-0 opacity-90" />
                      ) : null}
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {user && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/5 shrink-0">
                {(normalizeRole(user.role) === "expert" ||
                  user.role === "admin") && (
                  <Link
                    href="/expert/tous-les-projets"
                    className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                      isActive("/expert/tous-les-projets")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Tous les projets
                  </Link>
                )}
                {normalizeRole(user.role) === "expert" && (
                  <Link
                    href="/expert/projets"
                    className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                      isActive("/expert/projets")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" />
                    Projets
                  </Link>
                )}
                {normalizeRole(user.role) === "expert" && (
                  <Link
                    href="/expert/nouveaux-projets"
                    className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                      isActive("/expert/nouveaux-projets")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Invitations
                  </Link>
                )}
                <Link
                  href="/messages"
                  className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive("/messages")
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
                  {unreadMessages > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-gray-900 text-[10px] font-bold flex items-center justify-center">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-white/5">
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
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 border border-white/5 text-gray-300/80 hover:text-amber-200 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all"
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
              className="lg:hidden p-2 rounded-xl text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer mobile (overlay + panneau latéral) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Fermer le menu"
        />

        {/* Panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-[min(92vw,420px)] border-l border-white/5 bg-gray-950/98 backdrop-blur-2xl shadow-2xl shadow-black/70 transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Building2 className="w-4.5 h-4.5 text-gray-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">
                  BMP.tn
                </p>
                <p className="text-[11px] text-gray-500">
                  Menu
                  {user ? ` · ${user.nom}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="px-3 py-3 flex flex-col gap-1 overflow-y-auto h-[calc(100vh-73px)] scrollbar-bmp">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key ?? item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive(item.href)
                      ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                      : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                </Link>
              );
            })}

            {extraClientItems.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                {extraClientItems.map((it) => {
                  const ExtraIcon = it.icon;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      title={it.title}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                        isActive(it.href)
                          ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                          : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100"
                      }`}
                    >
                      {ExtraIcon ? (
                        <ExtraIcon className="w-5 h-5 shrink-0 opacity-90" />
                      ) : null}
                      {it.label}
                      <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                    </Link>
                  );
                })}
              </div>
            )}

            {user && (
              <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                {(normalizeRole(user.role) === "expert" ||
                  user.role === "admin") && (
                  <Link
                    href="/expert/tous-les-projets"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive("/expert/tous-les-projets")
                        ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                        : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                    Tous les projets
                    <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                  </Link>
                )}
                {normalizeRole(user.role) === "expert" && (
                  <Link
                    href="/expert/projets"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive("/expert/projets")
                        ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                        : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    <FolderKanban className="w-5 h-5" />
                    Mes projets
                    <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                  </Link>
                )}
                {normalizeRole(user.role) === "expert" && (
                  <Link
                    href="/expert/nouveaux-projets"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive("/expert/nouveaux-projets")
                        ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                        : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100"
                    }`}
                  >
                    <ClipboardList className="w-5 h-5" />
                    Invitations
                    <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                  </Link>
                )}
                <Link
                  href="/messages"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive("/messages")
                      ? "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                      : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  Messages
                  {unreadMessages > 0 && (
                    <span className="min-w-[1.25rem] h-6 px-2 rounded-full bg-amber-500 text-gray-900 text-[11px] font-bold flex items-center justify-center">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                </Link>
              </div>
            )}

            <div className="mt-2 pt-3 border-t border-white/5">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-200 border border-white/5 bg-black/20"
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
        </aside>
      </div>
    </header>
  );
}

