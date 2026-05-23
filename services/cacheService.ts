
import { Geocache, StoredGpx } from '../types';
import { dbService } from './db';
import { parseGpx, generateGpx } from '../utils/gpx';
import { latLngToCell, gridDisk } from 'h3-js';
import { useSyncStore } from '../stores/useSyncStore';
import { IDataSource } from './data/DataSource';

// Import independent data classes
import { ByPublishedData } from './data/v1/ByPublishedData';
import { fetchWithRetry, processStandardResponse } from './data/v1/fetchUtils';
import { CONFIG } from '../constants';

// v2 classes
import { ByFoundData } from './data/v2/ByFoundData';
import { ByFTFData } from './data/v2/ByFTFData';
import { ByTodayData } from './data/v2/ByTodayData';
import { ByCurrentEventData } from './data/v2/ByCurrentEventData';
import { ByAllEventData } from './data/v2/ByAllEventData';

const STORAGE_KEY_LAST_DL = 'last_daily_sync';
const H3_RESOLUTION = 9;
const COORD_PATCH_URL = 'https://kevinaudio.bjcnc.scs.sohucs.com/gc_premiumOnly.json';

type CoordPatch = Record<string, { latitude?: number; longitude?: number; display?: boolean }>;

class CacheService {
  private strategies: Map<string, IDataSource> = new Map();
  /** Cached coordinate patch, loaded once per session */
  private coordPatch: CoordPatch | null = null;
  private coordPatchPromise: Promise<CoordPatch> | null = null;

  /** Fetch (or return cached) coordinate patch */
  async getCoordPatch(): Promise<CoordPatch> {
    if (this.coordPatch) return this.coordPatch;
    if (!this.coordPatchPromise) {
      this.coordPatchPromise = fetch(COORD_PATCH_URL)
        .then(res => res.ok ? res.json() as Promise<CoordPatch> : ({} as CoordPatch))
        .catch(e => { console.warn('Coord patch fetch failed:', e); return {} as CoordPatch; })
        .then(patch => { this.coordPatch = patch; return patch; });
    }
    return this.coordPatchPromise;
  }

  /** Apply coordinate patch to a list of caches (mutates latitude/longitude in-place) */
  applyPatch(caches: Geocache[], patch: CoordPatch): Geocache[] {
    if (!patch || Object.keys(patch).length === 0) return caches;
    return caches
      .filter(c => patch[c.code]?.display !== false)
      .map(c => {
        const p = patch[c.code];
        if (!p || p.latitude == null || p.longitude == null) return c;
        return { ...c, latitude: p.latitude, longitude: p.longitude };
      });
  }

  constructor() {
    this.register(new ByPublishedData());
    this.register(new ByFoundData());
    this.register(new ByCurrentEventData());
    this.register(new ByAllEventData());
    this.register(new ByTodayData());
    this.register(new ByFTFData());
  }

  public register(strategy: IDataSource) {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Main entry point for fetching data via strategies
   */
  async fetchData(type: string): Promise<Geocache[]> {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`No data strategy found for type: ${type}`);
    }
    const caches = await strategy.fetch();
    const patch = await this.getCoordPatch();
    return this.applyPatch(caches, patch);
  }

  /**
   * Fetch details for a specific cache code.
   * 1. Try Local DB
   * 2. If not found, Try Server API
   */
  async getCacheDetail(code: string): Promise<Geocache | null> {
    // 1. Try Local
    const local = await dbService.getCache(code);
    if (local) return local;

    // 2. Try Server
    try {
        const url = `${CONFIG.apiBase}/caches/${CONFIG.endpoints.all}?code=${code}`;
        console.log(`Searching server for ${code}: ${url}`);
        const res = await fetchWithRetry(url);
        const list = processStandardResponse(res);
        if (list.length > 0) return list[0];
    } catch (e) {
        console.warn("Server lookup failed for", code, e);
    }
    return null;
  }

  // --- H3 & Offline Utils (Kept in Service for now as they are utilities) ---

  async hasFreshOfflineData(): Promise<boolean> {
      const lastSync = await dbService.getSetting<string | null>(STORAGE_KEY_LAST_DL, null);
      if (!lastSync) return false;

      // Check against current hour
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const currentHourStr = `${yyyy}-${mm}-${dd} ${hh}:00`;

      return lastSync === currentHourStr;
  }

  async getCacheStatus(): Promise<{ lastSync: string | null; count: number }> {
    const lastSync = await dbService.getSetting<string | null>(STORAGE_KEY_LAST_DL, null);
    const count = await dbService.getOfflineCount();
    useSyncStore.getState().setOfflineMeta({ lastSync, count });
    return { lastSync, count };
  }

  async clearOfflineData(): Promise<void> {
    await dbService.clearOfflineCaches();
    await dbService.setSetting(STORAGE_KEY_LAST_DL, null);
    await this.getCacheStatus();
  }

  // --- Explore Mode (H3) ---

  async getNearbyCaches(lat: number, lng: number, radiusKm: number = 3): Promise<Geocache[]> {
      const centerH3 = latLngToCell(lat, lng, H3_RESOLUTION);
      const k = Math.ceil(radiusKm / 0.3);
      const safeK = Math.min(k, 100); 
      const h3Neighbors = gridDisk(centerH3, safeK);
      return await dbService.getOfflineCachesByH3(h3Neighbors);
  }

  // --- Search Utils ---

  async searchOfflineCache(code: string): Promise<Geocache | undefined> {
      return await dbService.getCache(code);
  }

  async searchOfflineCachesByPrefix(prefix: string): Promise<Geocache[]> {
      return await dbService.searchCachesByPrefix(prefix);
  }

  // --- Daily Auto Sync Trigger ---

  async syncAllData(): Promise<Geocache[]> {
    const notifyStatus = (status: 'idle' | 'loading cache' | 'processing cache data') => {
        useSyncStore.getState().setStatus(status);
    };

    try {
        notifyStatus('loading cache');
        
        let rawData: any[] = [];
        let usedTimestamp = '';
        
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

        const getUrl = (d: Date) => {
             const yyyy = d.getFullYear();
             const mm = String(d.getMonth() + 1).padStart(2, '0');
             const dd = String(d.getDate()).padStart(2, '0');
             const hh = String(d.getHours()).padStart(2, '0');
             return `//kevinaudio.bjcnc.scs.sohucs.com/geocaches_${yyyy}-${mm}-${dd}_${hh}.gz`;
        };

        const candidates = [
            { d: now, url: getUrl(now) },
            { d: oneHourAgo, url: getUrl(oneHourAgo) }
        ];

        let success = false;

        for (const candidate of candidates) {
            try {
                console.log(`Downloading full data: ${candidate.url}`);
                const res = await fetch(candidate.url);
                if (res.ok && res.body) {
                    // Use Native DecompressionStream
                    const ds = new DecompressionStream('gzip');
                    const decompressedStream = res.body.pipeThrough(ds);
                    const json = await new Response(decompressedStream).json();

                    if (Array.isArray(json)) {
                         rawData = json;
                         
                         // Generate timestamp string for storage
                         const d = candidate.d;
                         const yyyy = d.getFullYear();
                         const mm = String(d.getMonth() + 1).padStart(2, '0');
                         const dd = String(d.getDate()).padStart(2, '0');
                         const hh = String(d.getHours()).padStart(2, '0');
                         usedTimestamp = `${yyyy}-${mm}-${dd} ${hh}:00`;
                         
                         success = true;
                         break;
                    }
                }
            } catch (e) {
                console.warn(`Failed to fetch/parse ${candidate.url}`, e);
            }
        }

        if (!success) {
            throw new Error('Could not download cache data (tried current and previous hour).');
        }

        // 2. Load coordinate patch (best-effort, non-blocking)
        const coordPatch = await this.getCoordPatch();

        // 3. Process Data (Clean & H3)
        notifyStatus('processing cache data');
        
        const validCaches: Geocache[] = [];
        const h3Index: Record<string, string[]> = {};
        
        for (const item of rawData) {
            if (item.latitude != null && item.longitude != null) {
                // Apply coordinate patch if available
                const patch = coordPatch[item.code];

                // Hidden by patch — skip entirely
                if (patch?.display === false) continue;

                const lat = (patch?.latitude != null) ? patch.latitude : Number(item.latitude);
                const lng = (patch?.longitude != null) ? patch.longitude : Number(item.longitude);

                // Skip items that still have no valid coordinates after patching
                if (lat === 0 && lng === 0) continue;
                
                // Calculate H3 locally
                const h3Res9 = latLngToCell(lat, lng, H3_RESOLUTION);
                
                const cache: Geocache = {
                    ...item,
                    latitude: lat,
                    longitude: lng,
                    h3: item.h3 ? String(item.h3) : undefined,
                    h3hash: h3Res9
                };
                validCaches.push(cache);

                if (!h3Index[h3Res9]) h3Index[h3Res9] = [];
                h3Index[h3Res9].push(cache.code);
            }
        }

        // 3. Store in DB
        if (validCaches.length > 0) {
            await dbService.saveOfflineCaches(validCaches);
            await dbService.saveH3Index(h3Index);
            await dbService.setSetting(STORAGE_KEY_LAST_DL, usedTimestamp);
            
            notifyStatus('idle');
            return validCaches;
        } else {
            notifyStatus('idle');
            return [];
        }

    } catch (error) {
        console.error('Error during hourly sync:', error);
        notifyStatus('idle');
        throw error;
    }
  }

  async initDailySync(enabled: boolean): Promise<void> {
    if (!enabled) return;

    if (await this.hasFreshOfflineData()) {
        console.log('Daily cache already up to date.');
        this.getCacheStatus();
        return;
    }

    console.log('Starting daily background cache download...');
    // Execute the Sync Strategy without waiting
    this.syncAllData()
        .then((caches) => {
            console.log(`Daily sync complete. ${caches.length} caches.`);
            this.getCacheStatus();
        })
        .catch(err => {
            console.error('Background sync failed:', err);
        });
  }

  // --- GPX Utilities ---

  async exportOfflineGpx(): Promise<void> {
    const caches = await dbService.getOfflineCaches();
    if (caches.length === 0) throw new Error('No data to export');
    
    const gpxString = generateGpx(caches);
    
    const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeoMapCN_Offline_${new Date().toISOString().slice(0, 10)}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importGpx(file: File): Promise<StoredGpx> {
    const text = await file.text();
    const caches = parseGpx(text);
    
    if (caches.length === 0) throw new Error('No valid caches found in GPX');

    const cachesWithH3 = caches.map(c => ({
        ...c,
        h3hash: latLngToCell(c.latitude, c.longitude, H3_RESOLUTION)
    }));

    const newGpx: StoredGpx = {
      id: Date.now(),
      name: file.name.replace(/\.gpx$/i, ''),
      timestamp: Date.now(),
      count: cachesWithH3.length,
      caches: cachesWithH3
    };

    await dbService.saveGpx(newGpx);
    return newGpx;
  }

  async getGpxList(): Promise<StoredGpx[]> {
    return dbService.getGpxFiles();
  }

  async deleteGpx(id: number): Promise<void> {
    return dbService.deleteGpx(id);
  }
}

export const cacheService = new CacheService();
