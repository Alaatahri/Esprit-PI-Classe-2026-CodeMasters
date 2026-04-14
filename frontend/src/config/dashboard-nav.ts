import type { LucideIcon } from "lucide-react";
import {
  Home,
  Briefcase,
  FileText,
  ShoppingCart,
  Mail,
  Camera,
  ClipboardList,
  MessageCircle,
  FolderKanban,
  Layers,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";
import {
  isClientRole,
  normalizeRole,
  type BMPUser,
} from "@/lib/auth";
import { canAccessChantierModule } from "@/lib/roles";
import type { TranslationKeys } from "@/components/LanguageProvider";

export type DashboardNavItem = {
  key: string;
  href: string;
  labelKey: TranslationKeys;
  icon: LucideIcon;
  titleKey?: TranslationKeys;
};

const baseNavDefs: DashboardNavItem[] = [
  { key: "home", href: "/espace", labelKey: "mon_espace", icon: Home },
  {
    key: "chantier",
    href: "/gestion-chantier",
    labelKey: "nav_chantier",
    icon: Briefcase,
  },
  {
    key: "devis",
    href: "/gestion-devis-facturation",
    labelKey: "nav_devis",
    icon: FileText,
  },
  {
    key: "marketplace",
    href: "/gestion-marketplace",
    labelKey: "marketplace",
    icon: ShoppingCart,
  },
  { key: "contact", href: "/contact", labelKey: "contact", icon: Mail },
];

/**
 * Navigation dashboard (navbar + sidebar) — une seule source de vérité.
 */
export function getDashboardNav(user: BMPUser | null): {
  navItems: DashboardNavItem[];
  extraClientItems: DashboardNavItem[];
  /** Expert / admin + messages (si connecté) */
  roleSpecificItems: DashboardNavItem[];
} {
  const role = user?.role;
  const canSeeChantier = canAccessChantierModule(role);

  const filteredBase = baseNavDefs.filter((item) => {
    if (item.key === "chantier") return canSeeChantier;
    return true;
  });

  const navItems = filteredBase.map((item) => {
    if (item.key !== "home") return item;
    if (!user) return item;

    const roleHref = isClientRole(user.role)
      ? "/espace/client"
      : user.role === "expert"
        ? "/espace/expert"
        : user.role === "artisan"
          ? "/espace/artisan"
          : user.role === "admin"
            ? "/espace/admin"
            : user.role === "manufacturer"
              ? "/espace/fournisseur"
              : "/espace";

    return { ...item, href: roleHref };
  });

  const extraClientItems: DashboardNavItem[] = isClientRole(user?.role)
    ? [
        {
          key: "suivi",
          href: "/espace/client/suivi",
          labelKey: "nav_suivi_mes_projets",
          icon: Camera,
          titleKey: "title_suivi_photos",
        },
        {
          key: "projets",
          href: "/espace/client",
          labelKey: "mes_projets",
          icon: LayoutDashboard,
        },
        {
          key: "nouveau",
          href: "/espace/client/nouveau-projet",
          labelKey: "nav_plus_nouveau_projet",
          icon: PlusCircle,
        },
      ]
    : [];

  const nr = user ? normalizeRole(user.role) : null;
  const roleSpecificItems: DashboardNavItem[] = [];

  if (user && (nr === "expert" || user.role === "admin")) {
    roleSpecificItems.push({
      key: "tous",
      href: "/expert/tous-les-projets",
      labelKey: "nav_tous_les_projets",
      icon: Layers,
    });
  }
  if (user && nr === "expert") {
    roleSpecificItems.push(
      {
        key: "exp-proj",
        href: "/expert/projets",
        labelKey: "nav_projets",
        icon: FolderKanban,
      },
      {
        key: "invit",
        href: "/expert/nouveaux-projets",
        labelKey: "nav_invitations",
        icon: ClipboardList,
      },
    );
  }
  if (user) {
    roleSpecificItems.push({
      key: "messages",
      href: "/messages",
      labelKey: "nav_messages",
      icon: MessageCircle,
    });
  }

  return { navItems, extraClientItems, roleSpecificItems };
}

/** Indique si le lien doit apparaître comme « actif » (cohérent navbar / sidebar). */
export function isDashboardNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/espace") return pathname === "/espace";
  if (href === "/espace/client") {
    return (
      pathname === "/espace/client" ||
      pathname === "/espace/client/nouveau-projet"
    );
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
  if (href === "/expert/nouveaux-projets") {
    return pathname.startsWith("/expert/nouveaux-projets");
  }
  return pathname.startsWith(href);
}
