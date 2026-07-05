import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { UserPin, StoredGpx, Geocache } from '../types';

const DB_NAME = 'GeoMapCN_DB';
const DB_VERSION = 6;

interface GeoDB extends DBSchema {
  userPins: { key: number; value: UserPin };
  gpxFiles: { key: number; value: StoredGpx };
  offlineCaches: { key: string; value: Geocache };
  h3Index: { key: string; value: { h3: string; codes: string[] } };
  settings: { key: string; value: { key: string; value: any } };
}

let _db: IDBPDatabase<GeoDB> | null = null;

async function db(): Promise<IDBPDatabase<GeoDB>> {
  if (!_db) {
    _db = await openDB<GeoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('userPins')) db.createObjectStore('userPins', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('gpxFiles')) db.createObjectStore('gpxFiles', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('offlineCaches')) db.createObjectStore('offlineCaches', { keyPath: 'code' });
        if (!db.objectStoreNames.contains('h3Index')) db.createObjectStore('h3Index', { keyPath: 'h3' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
  }
  return _db;
}

export const dbService = {
  // --- Settings (KV) ---

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const entry = await (await db()).get('settings', key);
    return entry ? (entry.value as T) : defaultValue;
  },

  async setSetting(key: string, value: any): Promise<void> {
    await (await db()).put('settings', { key, value });
  },

  // --- User Pins ---

  async getAll(): Promise<UserPin[]> {
    const pins = await (await db()).getAll('userPins');
    return pins.map(p => ({ ...p, note: p.note || '' }));
  },

  async add(pin: UserPin): Promise<void> {
    await (await db()).add('userPins', pin);
  },

  async updatePin(pin: UserPin): Promise<void> {
    await (await db()).put('userPins', pin);
  },

  async delete(id: number): Promise<void> {
    await (await db()).delete('userPins', id);
  },

  // --- GPX Files ---

  async saveGpx(gpx: StoredGpx): Promise<void> {
    await (await db()).put('gpxFiles', gpx);
  },

  async getGpxFiles(): Promise<StoredGpx[]> {
    const files = await (await db()).getAll('gpxFiles');
    return files.sort((a, b) => b.timestamp - a.timestamp);
  },

  async deleteGpx(id: number): Promise<void> {
    await (await db()).delete('gpxFiles', id);
  },

  // --- Offline Daily Cache ---

  async saveOfflineCaches(caches: Geocache[]): Promise<void> {
    const d = await db();
    const tx = d.transaction('offlineCaches', 'readwrite');
    await tx.store.clear();
    for (const c of caches) await tx.store.put(c);
    await tx.done;
  },

  async saveH3Index(indexMap: Record<string, string[]>): Promise<void> {
    const d = await db();
    const tx = d.transaction('h3Index', 'readwrite');
    await tx.store.clear();
    for (const [h3, codes] of Object.entries(indexMap)) {
      await tx.store.put({ h3, codes });
    }
    await tx.done;
  },

  async getOfflineCaches(): Promise<Geocache[]> {
    return (await db()).getAll('offlineCaches');
  },

  async getCache(code: string): Promise<Geocache | undefined> {
    return (await db()).get('offlineCaches', code);
  },

  async getOfflineCachesByH3(h3Hashes: string[]): Promise<Geocache[]> {
    if (h3Hashes.length === 0) return [];
    const d = await db();
    const tx = d.transaction(['h3Index', 'offlineCaches'], 'readonly');

    const uniqueCodes = new Set<string>();
    for (const h3 of h3Hashes) {
      const entry = await tx.objectStore('h3Index').get(h3);
      if (entry?.codes) entry.codes.forEach(c => uniqueCodes.add(c));
    }

    const codes = Array.from(uniqueCodes);
    if (codes.length === 0) return [];

    const results = await Promise.all(codes.map(code => tx.objectStore('offlineCaches').get(code)));
    return results.filter(Boolean) as Geocache[];
  },

  async getOfflineCount(): Promise<number> {
    return (await db()).count('offlineCaches');
  },

  async clearOfflineCaches(): Promise<void> {
    const d = await db();
    const tx = d.transaction(['offlineCaches', 'h3Index'], 'readwrite');
    await tx.objectStore('offlineCaches').clear();
    await tx.objectStore('h3Index').clear();
    await tx.done;
  },
};
