/* ================================================================
 * deeplink.ts — Flat deep-link handler (was: deeplink/ directory)
 *
 * Processes URL search params (?lat=, ?code=, ?pin=, ?datasource=)
 * ================================================================ */

import NiceModal from '@ebay/nice-modal-react';
import { Geocache } from '../types';
import { cacheService } from './cacheService';
import { fetchWithRetry, processStandardResponse } from './strategies';
import SmartCoords from '../components/drawer/Tools/SmartCoords';

/* ================================================================
 * Types
 * ================================================================ */

export interface DeepLinkContext {
  setCaches: (updater: (prev: Geocache[]) => Geocache[]) => void;
  setLoading: (loading: boolean) => void;
  showToast: (msg: string) => void;
  addTempPin: (lat: number, lng: number, note: string) => number;
  flyTo: (lat: number, lng: number, opts?: { code?: string; pinId?: number; zoom?: number }) => void;
}

/* ================================================================
 * Geo utils (ex-geoUtils.ts)
 * ================================================================ */

function zoomForCaches(caches: Geocache[], fallback = 16): number {
  if (caches.length <= 1) return fallback;
  const lats = caches.map(c => c.latitude);
  const lngs = caches.map(c => c.longitude);
  const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
  if (span < 0.003) return 17;
  if (span < 0.008) return 16;
  if (span < 0.02)  return 15;
  if (span < 0.06)  return 14;
  if (span < 0.15)  return 13;
  if (span < 0.4)   return 12;
  if (span < 1.0)   return 11;
  if (span < 2.5)   return 10;
  if (span < 5)     return 9;
  if (span < 12)    return 8;
  if (span < 25)    return 7;
  if (span < 50)    return 6;
  if (span < 100)   return 5;
  return 4;
}

function centroidOfCaches(caches: Geocache[]): { lat: number; lng: number } {
  return {
    lat: caches.reduce((s, c) => s + c.latitude, 0) / caches.length,
    lng: caches.reduce((s, c) => s + c.longitude, 0) / caches.length,
  };
}

/* ================================================================
 * Handlers (ex-handlers/)
 * ================================================================ */

async function handleLatLng(params: URLSearchParams, ctx: DeepLinkContext): Promise<boolean> {
  if (!params.has('lat') || !params.has('lng')) return false;
  const lat = parseFloat(params.get('lat')!);
  const lng = parseFloat(params.get('lng')!);
  const name = params.get('name') || undefined;
  if (isNaN(lat) || isNaN(lng)) return false;
  NiceModal.show(SmartCoords, { externalTarget: { lat, lng, name } });
  setTimeout(() => ctx.flyTo(lat, lng), 1000);
  return true;
}

async function handleCacheCode(params: URLSearchParams, ctx: DeepLinkContext): Promise<boolean> {
  if (!params.has('code')) return false;
  const codes = params.get('code')!.split(',').map(c => c.trim()).filter(Boolean);
  ctx.setLoading(true);
  try {
    const results = await Promise.all(codes.map(c => cacheService.getCacheDetail(c).catch(() => null)));
    const found: Geocache[] = results.filter((c): c is Geocache => c != null);
    const notFound = codes.filter((_, i) => results[i] == null);
    if (found.length === 0) { ctx.showToast('Cache not found.'); return true; }
    ctx.setCaches(prev => {
      const existingCodes = new Set(prev.map(c => c.code));
      const newCaches = found.filter(c => !existingCodes.has(c.code));
      return newCaches.length === 0 ? prev : [...prev, ...newCaches];
    });
    const center = centroidOfCaches(found);
    const zoom = zoomForCaches(found);
    setTimeout(() => {
      ctx.flyTo(center.lat, center.lng, { zoom, code: found.length === 1 ? found[0].code : undefined });
      const msg = notFound.length > 0 ? `Loaded ${found.length} cache(s). Not found: ${notFound.join(', ')}` : `Loaded ${found.length} cache(s)`;
      ctx.showToast(msg);
    }, 1000);
  } finally {
    ctx.setLoading(false);
  }
  return true;
}

async function handlePin(params: URLSearchParams, ctx: DeepLinkContext): Promise<boolean> {
  if (!params.has('pin')) return false;
  const parts = params.get('pin')!.split(',');
  if (parts.length < 2) return true;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  const note = parts.slice(2).join(',');
  if (isNaN(lat) || isNaN(lng)) return true;
  ctx.flyTo(lat, lng);
  setTimeout(() => {
    const id = ctx.addTempPin(lat, lng, note);
    setTimeout(() => { ctx.flyTo(lat, lng, { pinId: id }); ctx.showToast('Temporary pin added'); }, 50);
  }, 1600);
  return true;
}

async function handleDataSource(params: URLSearchParams, ctx: DeepLinkContext): Promise<boolean> {
  if (!params.has('datasource')) return false;
  const value = params.get('datasource')!;
  const centerStr = params.get('center');
  const center = centerStr ? (() => { const p = centerStr.split(','); const lat = parseFloat(p[0]); const lng = parseFloat(p[1]); return (isNaN(lat) || isNaN(lng)) ? null : { lat, lng }; })() : null;
  const zoom = params.has('mapzoom') ? parseInt(params.get('mapzoom')!, 10) : undefined;

  const ALLOWED = ['https://kevinaudio.bjcnc.scs.sohucs.com/', 'https://workapi.myapi.ren/', 'https://tftc.top/'];

  ctx.setLoading(true);
  try {
    let caches: Geocache[];
    if (value.startsWith('ds://')) {
      caches = await cacheService.fetchData(value.slice('ds://'.length));
    } else {
      if (!ALLOWED.some(o => value.startsWith(o)) && !value.startsWith('/')) {
        throw new Error('Data source not in allow-list');
      }
      caches = processStandardResponse(await fetchWithRetry(value));
    }
    if (!caches.length) { ctx.showToast('No valid caches'); return true; }
    ctx.setCaches(() => caches);
    ctx.showToast(`Loaded ${caches.length} caches`);
    const target = center ?? centroidOfCaches(caches);
    setTimeout(() => ctx.flyTo(target.lat, target.lng, { zoom: zoom ?? zoomForCaches(caches) }), 600);
  } catch (e: any) {
    ctx.showToast('Failed: ' + (e.message || e));
  } finally {
    ctx.setLoading(false);
  }
  return true;
}

/* ================================================================
 * Service — simple registry, no factory pattern
 * ================================================================ */

const handlers = [handleLatLng, handleCacheCode, handlePin, handleDataSource];

const hasDeepLink = (search: string = window.location.search): boolean => {
  const params = new URLSearchParams(search);
  return params.has('lat') || params.has('code') || params.has('pin') || params.has('datasource');
};

const process = async (ctx: DeepLinkContext, search: string = window.location.search): Promise<boolean> => {
  const params = new URLSearchParams(search);
  for (const h of handlers) {
    if (await h(params, ctx)) return true;
  }
  return false;
};

export const deepLinkService = { hasDeepLink, process };
