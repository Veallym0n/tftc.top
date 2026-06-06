import { Geocache } from '../types';
import { dbService } from './db';

/**
 * Lightweight in-memory search over loaded caches.
 * Matches query against: code, name, ownerUsername (all case-insensitive).
 */
export const cacheSearchService = {
  search(caches: Geocache[], query: string): Geocache[] {
    const q = query.trim().toLowerCase();
    if (!q) return caches;

    return caches.filter(c => {
      // code: support prefix-less GC codes (e.g. "aeyc8" matches "GCAEYC8")
      const code = c.code.toLowerCase();
      const name = c.name.toLowerCase();
      const owner = c.ownerUsername.toLowerCase();

      return code.includes(q) || name.includes(q) || owner.includes(q);
    });
  },

  /** Search all caches in IndexedDB (for global/offline full-database search) */
  async searchGlobal(query: string): Promise<Geocache[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const all = await dbService.getOfflineCaches();
    return this.search(all, q);
  },
};
