
import { UserPin, StoredGpx, Geocache } from '../types';

const DB_NAME = 'GeoMapCN_DB';
const DB_VERSION = 6; // Bumped to force any potential upgrade logic
const STORE_PINS = 'userPins';
const STORE_GPX = 'gpxFiles';
const STORE_OFFLINE = 'offlineCaches';
const STORE_H3 = 'h3Index';
const STORE_SETTINGS = 'settings'; // New KV Store

export const dbService = {
  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_PINS)) {
          db.createObjectStore(STORE_PINS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORE_GPX)) {
          db.createObjectStore(STORE_GPX, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_OFFLINE)) {
            db.createObjectStore(STORE_OFFLINE, { keyPath: 'code' });
        }

        if (!db.objectStoreNames.contains(STORE_H3)) {
            db.createObjectStore(STORE_H3, { keyPath: 'h3' });
        }

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
            // KV Store: { key: string, value: any }
            db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };
    });
  },

  // --- Settings (KV) ---

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };
      request.onerror = () => resolve(defaultValue); // Fallback on error
    });
  },

  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- User Pins ---

  async getAll(): Promise<UserPin[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PINS, 'readonly');
      const store = tx.objectStore(STORE_PINS);
      const request = store.getAll();
      request.onsuccess = () => {
          // Ensure all pins have the note field, even if they come from old DB version
          const pins = (request.result || []).map((p: any) => ({
              ...p,
              note: p.note || ''
          }));
          resolve(pins);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async add(pin: UserPin): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PINS, 'readwrite');
      const store = tx.objectStore(STORE_PINS);
      const request = store.add(pin);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async updatePin(pin: UserPin): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PINS, 'readwrite');
      const store = tx.objectStore(STORE_PINS);
      const request = store.put(pin); // put updates if key exists
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(id: number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PINS, 'readwrite');
      const store = tx.objectStore(STORE_PINS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- GPX Files ---

  async saveGpx(gpx: StoredGpx): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_GPX, 'readwrite');
      const store = tx.objectStore(STORE_GPX);
      const request = store.put(gpx);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getGpxFiles(): Promise<StoredGpx[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_GPX, 'readonly');
      const store = tx.objectStore(STORE_GPX);
      const request = store.getAll();
      request.onsuccess = () => {
        const res = request.result as StoredGpx[];
        resolve(res.sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteGpx(id: number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_GPX, 'readwrite');
      const store = tx.objectStore(STORE_GPX);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- Offline Daily Cache (Bulk Operations) ---

  async saveOfflineCaches(caches: Geocache[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE, 'readwrite');
        const store = tx.objectStore(STORE_OFFLINE);

        // 1. Clear old data
        const clearReq = store.clear();
        
        clearReq.onsuccess = () => {
            // 2. Bulk Insert
            caches.forEach(cache => {
                store.put(cache);
            });
        };

        clearReq.onerror = () => reject(clearReq.error);
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  },

  async saveH3Index(indexMap: Record<string, string[]>): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_H3, 'readwrite');
        const store = tx.objectStore(STORE_H3);

        const clearReq = store.clear();
        clearReq.onsuccess = () => {
            Object.entries(indexMap).forEach(([h3, codes]) => {
                store.put({ h3, codes });
            });
        };

        clearReq.onerror = () => reject(clearReq.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  },

  async getOfflineCaches(): Promise<Geocache[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE, 'readonly');
        const store = tx.objectStore(STORE_OFFLINE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  },

  async getCache(code: string): Promise<Geocache | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OFFLINE, 'readonly');
        const store = tx.objectStore(STORE_OFFLINE);
        const request = store.get(code);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  },

  // NEW: Search by prefix using IDB KeyRange
  async searchCachesByPrefix(prefix: string, limit: number = 10): Promise<Geocache[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE, 'readonly');
      const store = tx.objectStore(STORE_OFFLINE);
      
      // 'GC' -> 'GC' to 'GC' + '\uffff'
      const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
      const request = store.openCursor(range);
      
      const results: Geocache[] = [];

      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          results.push(cursor.value);
          if (results.length < limit) {
            cursor.continue();
          } else {
            resolve(results);
          }
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getOfflineCachesByH3(h3Hashes: string[]): Promise<Geocache[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_H3, STORE_OFFLINE], 'readonly');
        const storeH3 = tx.objectStore(STORE_H3);
        const storeOffline = tx.objectStore(STORE_OFFLINE);
        
        const uniqueCodes = new Set<string>();
        const caches: Geocache[] = [];

        // 1. Get Codes from H3 Index
        let h3Processed = 0;
        const totalH3 = h3Hashes.length;

        if (totalH3 === 0) {
             resolve([]);
             return;
        }

        const fetchCaches = () => {
            const codes = Array.from(uniqueCodes);
            let codesProcessed = 0;
            const totalCodes = codes.length;

            if (totalCodes === 0) {
                resolve([]);
                return;
            }
            
            codes.forEach(code => {
                const req = storeOffline.get(code);
                req.onsuccess = () => {
                    if (req.result) caches.push(req.result);
                    codesProcessed++;
                    if (codesProcessed === totalCodes) {
                        resolve(caches);
                    }
                };
                req.onerror = () => {
                    codesProcessed++;
                    if (codesProcessed === totalCodes) resolve(caches);
                };
            });
        };

        h3Hashes.forEach(h3 => {
            const req = storeH3.get(h3);
            req.onsuccess = () => {
                if (req.result && req.result.codes) {
                    req.result.codes.forEach((c: string) => uniqueCodes.add(c));
                }
                h3Processed++;
                if (h3Processed === totalH3) {
                    fetchCaches();
                }
            };
            req.onerror = () => {
                 h3Processed++;
                 if (h3Processed === totalH3) fetchCaches();
            };
        });

        tx.onerror = () => reject(tx.error);
    });
  },

  async getOfflineCount(): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE, 'readonly');
      const store = tx.objectStore(STORE_OFFLINE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clearOfflineCaches(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OFFLINE, STORE_H3], 'readwrite');
      const storeOffline = tx.objectStore(STORE_OFFLINE);
      const storeH3 = tx.objectStore(STORE_H3);
      
      storeOffline.clear();
      storeH3.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
