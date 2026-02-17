// Simple cache en mémoire pour éviter les requêtes répétées
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 secondes

export const cacheService = {
  get<T>(key: string): T | null {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }
    return cached.data as T;
  },

  set<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  },

  clear(key?: string): void {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  },
};
