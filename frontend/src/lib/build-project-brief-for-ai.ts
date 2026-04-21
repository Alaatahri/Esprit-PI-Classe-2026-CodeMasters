import type { ExpertProjectDossierData } from "@/components/expert/ExpertProjectDossier";

/** Contexte texte envoyé à l’IA pour générer un brouillon de proposition. */
export function buildProjectBriefForAi(p: ExpertProjectDossierData): string {
  const parts: string[] = [];
  if (p.titre) parts.push(`Titre : ${p.titre}`);
  if (p.description) parts.push(`Description :\n${p.description}`);
  if (p.categorie) parts.push(`Catégorie : ${p.categorie}`);
  if (p.ville) parts.push(`Ville : ${p.ville}`);
  if (p.adresse) parts.push(`Adresse : ${p.adresse}`);
  if (typeof p.surface_m2 === "number") parts.push(`Surface : ${p.surface_m2} m²`);
  if (p.type_batiment) parts.push(`Type de bâtiment : ${p.type_batiment}`);
  if (p.urgence) parts.push(`Urgence : ${p.urgence}`);
  if (typeof p.budget_estime === "number")
    parts.push(`Budget estimé client : ${p.budget_estime} TND`);
  if (typeof p.budget_min === "number" || typeof p.budget_max === "number") {
    parts.push(
      `Fourchette budget : ${p.budget_min ?? "—"} – ${p.budget_max ?? "—"} TND`,
    );
  }
  if (p.preferences_materiaux) parts.push(`Préférences matériaux : ${p.preferences_materiaux}`);
  if (p.exigences_techniques) parts.push(`Exigences techniques : ${p.exigences_techniques}`);
  return parts.join("\n\n");
}
