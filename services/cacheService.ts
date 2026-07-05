/* ================================================================
 * cacheService.ts — Data fetching + GPX (slimmed, was 344 lines)
 *
 * Sync & coord patch moved to syncService.ts
 * ================================================================ */

import { Geocache, StoredGpx } from '../types';
import { dbService } from './db';
import { parseGpx, generateGpx } from '../utils/gpx';
import { latLngToCell, gridDisk } from 'h3-js';
import {
  IDataSource, ByPublishedData, ByFoundData, ByFTFData,
  ByTodayData, ByCurrentEventData, ByAllEventData,
} from './strategies';

const H3_RESOLUTION = 9;

/* ================================================================
 * Strategy registry
 * ================================================================ */

const strategies = new Map<string, IDataSource>();

function register(s: IDataSource) { strategies.set(s.id, s); }

register(new ByPublishedData());
register(new ByFoundData());
register(new ByCurrentEventData());
register(new ByAllEventData());
register(new ByTodayData());
register(new ByFTFData());

/* ================================================================
 * Data fetching
 * ================================================================ */

async function fetchData(type: string): Promise<Geocache[]> {
  const strategy = strategies.get(type);
  if (!strategy) throw new Error(`No data strategy for: ${type}`);
  return strategy.fetch();
}

async function getCacheDetail(code: string): Promise<Geocache | null> {
  return dbService.getCache(code);
}

function searchLocal(caches: Geocache[], query: string): Geocache[] {
  const q = query.trim().toLowerCase();
  if (!q) return caches;
  return caches.filter(c => {
    const code = c.code.toLowerCase();
    const name = c.name.toLowerCase();
    const owner = c.ownerUsername.toLowerCase();
    return code.includes(q) || name.includes(q) || owner.includes(q);
  });
}

async function searchGlobal(query: string): Promise<Geocache[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await dbService.getOfflineCaches();
  return searchLocal(all, q);
}

/* ================================================================
 * Nearby (explore mode, H3-based)
 * ================================================================ */

async function getNearbyCaches(lat: number, lng: number, radiusKm = 3): Promise<Geocache[]> {
  const centerH3 = latLngToCell(lat, lng, H3_RESOLUTION);
  const k = Math.min(Math.ceil(radiusKm / 0.3), 100);
  return dbService.getOfflineCachesByH3(gridDisk(centerH3, k));
}

/* ================================================================
 * Offline cache bulk read
 * ================================================================ */

async function loadOfflineCaches(): Promise<Geocache[]> {
  return dbService.getOfflineCaches();
}

/* ================================================================
 * GPX
 * ================================================================ */

async function exportOfflineGpx(): Promise<void> {
  const caches = await dbService.getOfflineCaches();
  if (!caches.length) throw new Error('No data to export');
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

async function getGpxList(): Promise<StoredGpx[]> {
  return dbService.getGpxFiles();
}

async function deleteGpx(id: number): Promise<void> {
  return dbService.deleteGpx(id);
}

/* ================================================================ */

export const cacheService = {
  fetchData,
  getCacheDetail,
  searchLocal,
  searchGlobal,
  getNearbyCaches,
  loadOfflineCaches,
  exportOfflineGpx,
  getGpxList,
  deleteGpx,
};
