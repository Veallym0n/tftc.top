/* ================================================================
 * strategies.ts — All data-fetching strategies + shared fetch utils
 *
 * Merged from: services/data/DataSource.ts
 *               services/data/v1/ByPublishedData.ts
 *               services/data/v2/ByTodayData.ts
 *               services/data/v2/ByFoundData.ts
 *               services/data/v2/ByFTFData.ts
 *               services/data/v2/ByCurrentEventData.ts
 *               services/data/v2/ByAllEventData.ts
 *               services/data/v1/fetchUtils.ts
 * ================================================================ */

import { Geocache } from '../types';
import { getConfig } from '../config';
import { dbService } from './db';

/* ================================================================
 * IDataSource interface (ex-DataSource.ts)
 * ================================================================ */

export interface IDataSource {
  readonly id: string;
  fetch(): Promise<Geocache[]>;
}

/* ================================================================
 * Fetch utilities (ex-fetchUtils.ts)
 * ================================================================ */

export async function fetchWithRetry(url: string, retries = 3, backoff = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const contentType = res.headers.get('content-type') ?? '';
      const hasGzipContentEncoding = res.headers.get('content-encoding')?.includes('gzip');
      const isRawGzip = url.endsWith('.gz') && !hasGzipContentEncoding;
      const isGzipJson =
        contentType.includes('gzip') ||
        contentType.includes('application/x-gzip');

      if (isRawGzip || isGzipJson) {
        const ds = new DecompressionStream('gzip');
        const decompressed = res.body!.pipeThrough(ds);
        const text = await new Response(decompressed).text();
        return JSON.parse(text);
      }
      return await res.json();
    } catch (err) {
      console.warn(`Fetch attempt ${i + 1} failed for ${url}`, err);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
    }
  }
}

export function processStandardResponse(data: any): any[] {
  if (Array.isArray(data)) {
    return data
      .filter((d: any) => {
        return (d.latitude != null && d.longitude != null) ||
               (d.postedCoordinates?.latitude != null && d.postedCoordinates?.longitude != null);
      })
      .map((d: any) => {
        const lat = d.latitude ?? d.postedCoordinates?.latitude;
        const lng = d.longitude ?? d.postedCoordinates?.longitude;
        return {
          ...d,
          latitude: Number(lat),
          longitude: Number(lng),
        };
      });
  }
  throw new Error('Invalid data format received from API');
}

/* ================================================================
 * Strategy: ByPublishedData (ex-v1/ByPublishedData.ts)
 * ================================================================ */

export class ByPublishedData implements IDataSource {
  readonly id = 'by_published';

  async fetch(): Promise<Geocache[]> {
    const url = getConfig().cacheFiles.newpublish;
    if (!url) return [];
    const data = await fetchWithRetry(url);
    return processStandardResponse(data);
  }
}

/* ================================================================
 * Strategy: ByTodayData (ex-v2/ByTodayData.ts)
 * ================================================================ */

export class ByTodayData implements IDataSource {
  readonly id = 'by_today';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const matchStr = `-${mm}-${dd}`;
    return allCaches.filter(cache =>
      cache.placedDate && cache.placedDate.includes(matchStr)
    );
  }
}

/* ================================================================
 * Strategy: ByFoundData (ex-v2/ByFoundData.ts)
 * ================================================================ */

export class ByFoundData implements IDataSource {
  readonly id = 'by_found';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return allCaches.filter(cache =>
      cache.lastFoundDate && cache.lastFoundDate.startsWith(todayStr)
    );
  }
}

/* ================================================================
 * Strategy: ByFTFData (ex-v2/ByFTFData.ts)
 * ================================================================ */

export class ByFTFData implements IDataSource {
  readonly id = 'by_ftf';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    return allCaches.filter(cache => {
      return !cache.lastFoundDate || cache.lastFoundDate.startsWith('1970');
    });
  }
}

/* ================================================================
 * Strategy: ByCurrentEventData (ex-v2/ByCurrentEventData.ts)
 * ================================================================ */

export class ByCurrentEventData implements IDataSource {
  readonly id = 'by_current_event';

  private string2timestamp(dateStr: string): number {
    try {
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, second).getTime();
    } catch {
      return 0;
    }
  }

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    const currentTime = new Date();
    const eventTypes = new Set([6, 13, 69]);
    return allCaches.filter(cache =>
      eventTypes.has(cache.geocacheType) &&
      this.string2timestamp(cache.placedDate) > currentTime.getTime()
    );
  }
}

/* ================================================================
 * Strategy: ByAllEventData (ex-v2/ByAllEventData.ts)
 * ================================================================ */

export class ByAllEventData implements IDataSource {
  readonly id = 'by_event';

  async fetch(): Promise<Geocache[]> {
    const allCaches = await dbService.getOfflineCaches();
    const eventTypes = new Set([6, 13, 69]);
    return allCaches.filter(cache =>
      eventTypes.has(cache.geocacheType)
    );
  }
}
