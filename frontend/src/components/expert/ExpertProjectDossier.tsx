import { ImageIcon, Paperclip, MapPin } from "lucide-react";

export type ExpertProjectDossierData = {
  titre?: string;
  description?: string;
  ville?: string;
  adresse?: string;
  categorie?: string;
  surface_m2?: number;
  type_batiment?: string;
  urgence?: string;
  budget_estime?: number;
  budget_min?: number;
  budget_max?: number;
  date_debut?: string;
  date_fin_prevue?: string;
  preferences_materiaux?: string;
  exigences_techniques?: string;
  pieces_jointes?: string[];
  photos_site?: string[];
  photosAvant?: string[];
  photosApres?: string[];
};

function fmtMoney(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return `${Math.round(n).toLocaleString("fr-FR")} TND`;
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = {
  project: ExpertProjectDossierData;
  /** Le parent affiche déjà le titre (ex. hub) */
  omitTitle?: boolean;
  className?: string;
};

export function ExpertProjectDossier({ project: p, omitTitle, className }: Props) {
  const hasMeta =
    p.categorie ||
    p.ville ||
    p.adresse ||
    typeof p.surface_m2 === "number" ||
    p.type_batiment ||
    p.urgence ||
    typeof p.budget_estime === "number" ||
    typeof p.budget_min === "number" ||
    typeof p.budget_max === "number" ||
    p.date_debut ||
    p.date_fin_prevue;

  return (
    <div className={className ?? "space-y-5"}>
      {!omitTitle && p.titre ? (
        <h2 className="text-xl font-bold text-white leading-tight">{p.titre}</h2>
      ) : null}

      {hasMeta ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Fiche projet</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {p.categorie ? (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-gray-200">
                {p.categorie}
              </span>
            ) : null}
            {p.ville ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-gray-300">
                <MapPin className="w-3 h-3 text-amber-400/80" />
                {p.ville}
                {p.adresse ? ` · ${p.adresse}` : ""}
              </span>
            ) : p.adresse ? (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-gray-300">
                {p.adresse}
              </span>
            ) : null}
            {typeof p.surface_m2 === "number" ? (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-gray-300">
                {p.surface_m2} m²
              </span>
            ) : null}
            {p.type_batiment ? (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-gray-300">
                {p.type_batiment}
              </span>
            ) : null}
            {p.urgence ? (
              <span className="rounded-full border border-amber-500/25 px-2.5 py-1 text-amber-200/90">
                Urgence : {p.urgence}
              </span>
            ) : null}
            {fmtMoney(p.budget_estime) ? (
              <span className="rounded-full border border-emerald-500/20 px-2.5 py-1 text-emerald-200/90">
                Budget ref. {fmtMoney(p.budget_estime)}
              </span>
            ) : null}
            {(typeof p.budget_min === "number" || typeof p.budget_max === "number") &&
            (fmtMoney(p.budget_min) || fmtMoney(p.budget_max)) ? (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-gray-300">
                Fourchette{" "}
                {fmtMoney(p.budget_min) && fmtMoney(p.budget_max)
                  ? `${fmtMoney(p.budget_min)} – ${fmtMoney(p.budget_max)}`
                  : fmtMoney(p.budget_min) ?? fmtMoney(p.budget_max)}
              </span>
            ) : null}
            {fmtDate(p.date_debut) ? (
              <span className="text-gray-500">Début {fmtDate(p.date_debut)}</span>
            ) : null}
            {fmtDate(p.date_fin_prevue) ? (
              <span className="text-gray-500">Fin prévue {fmtDate(p.date_fin_prevue)}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {p.description ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase text-gray-500 mb-2">Description</p>
          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{p.description}</p>
        </section>
      ) : null}

      {p.preferences_materiaux ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase text-gray-500 mb-2">Préférences matériaux</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{p.preferences_materiaux}</p>
        </section>
      ) : null}

      {p.exigences_techniques ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase text-gray-500 mb-2">Exigences techniques</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{p.exigences_techniques}</p>
        </section>
      ) : null}

      {(p.pieces_jointes?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-amber-300" />
            Pièces jointes
          </h3>
          <ul className="space-y-2 text-sm break-all">
            {(p.pieces_jointes ?? []).map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(p.photos_site?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-300" />
            Photos du site (client)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(p.photos_site ?? []).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {(p.photosAvant?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-sky-300" />
            Photos avant travaux
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(p.photosAvant ?? []).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {(p.photosApres?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-300" />
            Photos après travaux
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(p.photosApres ?? []).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
