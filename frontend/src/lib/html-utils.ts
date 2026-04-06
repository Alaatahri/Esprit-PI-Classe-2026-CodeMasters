/** Extrait le texte visible d’une chaîne pouvant contenir du HTML (ex. suggestions IA). */
export function stripHtmlToText(s: string): string {
  if (!s.trim()) return "";
  if (typeof document === "undefined") {
    return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const d = document.createElement("div");
  d.innerHTML = s;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}
