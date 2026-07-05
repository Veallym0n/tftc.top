/* ================================================================
 * syncService.ts — Full DB sync + coord patch
 * ================================================================ */

import { Geocache } from '../types';
import { dbService } from './db';
import { getConfig } from '../config';
import { latLngToCell } from 'h3-js';
import { useCacheStore } from '../stores/useCacheStore';

const STORAGE_KEY_LAST_DL = 'last_daily_sync';
const H3_RESOLUTION = 9;

/* ================================================================
 * Coord patch (for premium-only caches with 0,0 coords)
 * ================================================================ */

const COORD_PATCH_URL = 'https://kevinaudio.bjcnc.scs.sohucs.com/gc_premiumOnly.json';

type CoordPatch = Record<string, { latitude?: number; longitude?: number; display?: boolean }>;

let coordPatch: CoordPatch | null = null;
let coordPatchPromise: Promise<CoordPatch> | null = null;

async function getCoordPatch(): Promise<CoordPatch> {
  if (coordPatch) return coordPatch;
  if (!coordPatchPromise) {
    coordPatchPromise = fetch(COORD_PATCH_URL)
      .then(res => res.ok ? res.json() as Promise<CoordPatch> : ({} as CoordPatch))
      .catch(e => { console.warn('Coord patch fetch failed:', e); return {} as CoordPatch; })
      .then(patch => { coordPatch = patch; return patch; });
  }
  return coordPatchPromise;
}

/* ================================================================
 * Sync
 * ================================================================ */

async function hasFreshOfflineData(): Promise<boolean> {
  const lastSync = await dbService.getSetting<string | null>(STORAGE_KEY_LAST_DL, null);
  if (!lastSync) return false;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return lastSync.startsWith(`${yyyy}-${mm}-${dd}`);
}

async function getCacheStatus(): Promise<{ lastSync: string | null; count: number }> {
  const lastSync = await dbService.getSetting<string | null>(STORAGE_KEY_LAST_DL, null);
  const count = await dbService.getOfflineCount();
  useCacheStore.getState().setSyncStatus('idle');
  useCacheStore.getState().setOfflineMeta({ lastSync, count });
  return { lastSync, count };
}

async function clearOfflineData(): Promise<void> {
  await dbService.clearOfflineCaches();
  await dbService.setSetting(STORAGE_KEY_LAST_DL, null);
  await getCacheStatus();
}

async function syncAllData(): Promise<Geocache[]> {
  const notify = (s: 'idle' | 'loading cache' | 'processing cache data') => useCacheStore.getState().setSyncStatus(s);
  try {
    notify('loading cache');

    const url = getConfig().cacheFiles.current;
    if (!url) throw new Error('cacheFiles.current not configured');

    const res = await fetch(url);
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const ds = new DecompressionStream('gzip');
    const json: any[] = await new Response(res.body.pipeThrough(ds)).json();
    if (!Array.isArray(json)) throw new Error('Invalid data format');

    const now = new Date();
    const usedTimestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:00`;

    const patch = await getCoordPatch();
    notify('processing cache data');

    const validCaches: Geocache[] = [];
    const h3Index: Record<string, string[]> = {};

    for (const item of json) {
      if (item.latitude == null || item.longitude == null) continue;
      const p = patch[item.code];
      if (p?.display === false) continue;
      const lat = p?.latitude ?? Number(item.latitude);
      const lng = p?.longitude ?? Number(item.longitude);
      if (lat === 0 && lng === 0) continue;
      const h3hash = latLngToCell(lat, lng, H3_RESOLUTION);
      validCaches.push({ ...item, latitude: lat, longitude: lng, h3hash });
      if (!h3Index[h3hash]) h3Index[h3hash] = [];
      h3Index[h3hash].push(item.code);
    }

    if (validCaches.length > 0) {
      await dbService.saveOfflineCaches(validCaches);
      await dbService.saveH3Index(h3Index);
      await dbService.setSetting(STORAGE_KEY_LAST_DL, usedTimestamp);
    }
    notify('idle');
    return validCaches;
  } catch (e) {
    notify('idle');
    throw e;
  }
}

async function initDailySync(enabled: boolean): Promise<void> {
  if (!enabled) return;
  if (await hasFreshOfflineData()) {
    console.log('Daily cache already up to date.');
    getCacheStatus();
    return;
  }
  console.log('Starting daily background cache download...');
  syncAllData()
    .then(caches => { console.log(`Daily sync complete. ${caches.length} caches.`); getCacheStatus(); })
    .catch(e => console.error('Background sync failed:', e));
}

export const syncService = {
  initDailySync,
  syncAllData,
  getCacheStatus,
  clearOfflineData,
};
