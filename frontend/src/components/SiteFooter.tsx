import Link from "next/link";
import {
  Building2,
  Mail,
  MapPin,
  HardHat,
  FileText,
  ShoppingCart,
  LogIn,
  UserPlus,
  Home,
  Phone,
} from "lucide-react";

const footerLinkClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-gray-200 transition duration-200 ease-out hover:border-amber-500/35 hover:bg-amber-500/10 hover:text-amber-100 motion-safe:active:scale-[0.99]";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 bg-gradient-to-b from-background to-black text-muted-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30">
                <Building2 className="h-6 w-6 text-amber-400" aria-hidden />
              </div>
              <span className="text-lg font-semibold text-white">BMP.tn</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              La plateforme qui connecte clients, experts et artisans pour des
              chantiers suivis de bout en bout — suivi, devis et marketplace au
              même endroit.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/60" />
                Tunisie · projets partout sur le territoire
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-amber-500/60" />
                <a
                  href="mailto:contact@bmp.tn"
                  className="text-amber-200/80 hover:text-amber-300"
                >
                  contact@bmp.tn
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-amber-500/60" />
                <span>Support du lundi au vendredi</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Compte & accès
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/espace" className={footerLinkClass}>
                <Home className="h-4 w-4 text-amber-400/80" />
                Mon espace
              </Link>
              <Link href="/login" className={footerLinkClass}>
                <LogIn className="h-4 w-4 text-amber-400/80" />
                Connexion
              </Link>
              <Link href="/inscription" className={footerLinkClass}>
                <UserPlus className="h-4 w-4 text-amber-400/80" />
                Inscription
              </Link>
              <Link href="/contact" className={footerLinkClass}>
                <Mail className="h-4 w-4 text-amber-400/80" />
                Contact
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Outils BMP.tn
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/gestion-chantier" className={footerLinkClass}>
                <HardHat className="h-4 w-4 text-sky-400/80" />
                Chantier
              </Link>
              <Link href="/gestion-devis-facturation" className={footerLinkClass}>
                <FileText className="h-4 w-4 text-blue-400/80" />
                Devis
              </Link>
              <Link href="/gestion-marketplace" className={footerLinkClass}>
                <ShoppingCart className="h-4 w-4 text-emerald-400/80" />
                Marketplace
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600">
            © {year} BMP.tn — Construction digitale. Tous droits réservés.
          </p>
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
            aria-label="Informations légales"
          >
            <span className="text-gray-500">Mentions légales</span>
            <span className="text-gray-700" aria-hidden>
              ·
            </span>
            <span className="text-gray-500">Politique de confidentialité</span>
            <span className="text-gray-700" aria-hidden>
              ·
            </span>
            <span className="text-gray-500">Cookies</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
