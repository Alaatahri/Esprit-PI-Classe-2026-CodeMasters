"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Building2, LogOut, Menu, X, ChevronRight } from "lucide-react";
import {
  getStoredUser,
  clearStoredUser,
  AUTH_CHANGE_EVENT,
  type BMPUser,
} from "@/lib/auth";
import { fetchUnreadCount } from "@/lib/messages-api";
import { useLanguage } from "@/components/LanguageProvider";
import {
  getDashboardNav,
  isDashboardNavActive,
} from "@/config/dashboard-nav";
import { navLinkHorizontalClass } from "@/lib/nav-item-styles";
import { cn } from "@/lib/utils";

export default function GlobalNavbar() {
  const { t } = useLanguage();
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

  const { navItems, extraClientItems, roleSpecificItems } = useMemo(
    () => getDashboardNav(user),
    [user],
  );

  /** Masque la barre horizontale quand le menu latéral (shell) est affiché. */
  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
    setMobileOpen(false);
    router.push("/espace");
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/espace"
            className="group flex shrink-0 items-center gap-3 rounded-xl outline-none transition duration-300 ease-out motion-safe:hover:opacity-95 motion-safe:active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/30 transition duration-300 ease-out motion-safe:group-hover:shadow-amber-500/40">
              <Building2 className="w-5 h-5 text-gray-900" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                BMP.tn
              </span>
              <div className="text-[10px] text-amber-400/80 font-medium tracking-widest">
                {t("tagline_plateforme")}
              </div>
            </div>
          </Link>

          <nav className="hidden min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-bmp lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isDashboardNavActive(pathname, item.href);
              return (
                <Link
                  key={item.key ?? item.href}
                  href={item.href}
                  className={cn(
                    navLinkHorizontalClass(active),
                    "inline-flex shrink-0 whitespace-nowrap",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}

            {extraClientItems.length > 0 && (
              <div className="ml-2 flex shrink-0 items-center gap-1 border-l border-white/5 pl-2">
                {extraClientItems.map((it) => {
                  const ExtraIcon = it.icon;
                  const active = isDashboardNavActive(pathname, it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      title={it.titleKey ? t(it.titleKey) : undefined}
                      className={cn(
                        navLinkHorizontalClass(active),
                        "inline-flex shrink-0 whitespace-nowrap px-3 sm:px-4",
                      )}
                    >
                      <ExtraIcon className="w-4 h-4 shrink-0 opacity-90" />
                      {t(it.labelKey)}
                    </Link>
                  );
                })}
              </div>
            )}

            {user && roleSpecificItems.length > 0 && (
              <div className="ml-2 flex shrink-0 items-center gap-1 border-l border-white/5 pl-2">
                {roleSpecificItems.map((it) => {
                  const Icon = it.icon;
                  const active = isDashboardNavActive(pathname, it.href);
                  const isMessages = it.key === "messages";
                  return (
                    <Link
                      key={it.key}
                      href={it.href}
                      className={cn(
                        navLinkHorizontalClass(active),
                        "inline-flex shrink-0 whitespace-nowrap",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {t(it.labelKey)}
                      {isMessages && unreadMessages > 0 && (
                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-gray-900">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      )}
                    </Link>
                  );
                })}
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
                  title={t("deconnexion")}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t("deconnexion")}</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                {t("connexion")}
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
          aria-label={t("aria_fermer_menu")}
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
                  {t("mobile_menu")}
                  {user ? ` · ${user.nom}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl text-gray-300/80 hover:text-amber-100 hover:bg-amber-500/10"
              aria-label={t("aria_fermer")}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex h-[calc(100vh-73px)] flex-col gap-1 overflow-y-auto px-3 py-3 scrollbar-bmp">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isDashboardNavActive(pathname, item.href);
              return (
                <Link
                  key={item.key ?? item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition",
                    active
                      ? "border border-amber-500/20 bg-amber-500/15 text-amber-200"
                      : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t(item.labelKey)}
                  <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                </Link>
              );
            })}

            {extraClientItems.length > 0 && (
              <div className="mt-2 border-t border-white/5 pt-2">
                {extraClientItems.map((it) => {
                  const ExtraIcon = it.icon;
                  const active = isDashboardNavActive(pathname, it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      title={it.titleKey ? t(it.titleKey) : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 transition",
                        active
                          ? "border border-amber-500/20 bg-amber-500/15 text-amber-200"
                          : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100",
                      )}
                    >
                      <ExtraIcon className="h-5 w-5 shrink-0 opacity-90" />
                      {t(it.labelKey)}
                      <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                    </Link>
                  );
                })}
              </div>
            )}

            {user && roleSpecificItems.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                {roleSpecificItems.map((it) => {
                  const Icon = it.icon;
                  const active = isDashboardNavActive(pathname, it.href);
                  const isMessages = it.key === "messages";
                  return (
                    <Link
                      key={it.key}
                      href={it.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 transition",
                        active
                          ? "border border-amber-500/20 bg-amber-500/15 text-amber-200"
                          : "text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-100",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {t(it.labelKey)}
                      {isMessages && unreadMessages > 0 && (
                        <span className="flex h-6 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-2 text-[11px] font-bold text-gray-900">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      )}
                      <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="mt-2 pt-3 border-t border-white/5">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200/80 hover:bg-amber-500/10 hover:text-amber-200 border border-white/5 bg-black/20"
                >
                  <LogOut className="w-5 h-5" />
                  {t("deconnexion")}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold"
                >
                  {t("connexion")}
                </Link>
              )}
            </div>
          </nav>
        </aside>
      </div>
    </header>
  );
}

