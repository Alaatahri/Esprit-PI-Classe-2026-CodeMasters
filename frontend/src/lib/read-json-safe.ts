/**
 * Lit le corps d’une Response en JSON sans planter si le corps est vide
 * (ex. 204, proxy, ou anciennes réponses `null` mal sérialisées).
 */
export async function readJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
