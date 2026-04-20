import { IDeepLinkHandler, DeepLinkContext } from '../types';
import { fetchWithRetry, processStandardResponse } from '../../data/v1/fetchUtils';
import { Geocache } from '../../../types';

/**
 * Handles ?datasource=<url> deep links.
 *
 * Fetches geocache data from an external URL (must be in the allow-list),
 * using the same format as by_published (array of Geocache objects),
 * and displays them on the map.
 *
 * Example:
 *   ?datasource=https://kevinaudio.bjcnc.scs.sohucs.com/my-caches.json
 */
export class DataSourceHandler implements IDeepLinkHandler {
  readonly id = 'datasource';

  /** Allowed origin prefixes for external data sources */
  private readonly allowedOrigins: string[] = [
    'https://kevinaudio.bjcnc.scs.sohucs.com/',
  ];

  match(params: URLSearchParams): boolean {
    return params.has('datasource');
  }

  async execute(params: URLSearchParams, ctx: DeepLinkContext): Promise<void> {
    const url = params.get('datasource');
    if (!url) return;

    // Security: only allow pre-approved origins
    if (!this.isAllowed(url)) {
      ctx.showToast('Data source not in allow-list');
      return;
    }

    // Optional: ?center=lat,lng  overrides centroid fly-to
    const centerParam = params.get('center');
    const centerCoords = this.parseCenter(centerParam);

    // Optional: ?mapzoom=<number>  overrides default zoom
    const mapzoomParam = params.get('mapzoom');
    const zoom = mapzoomParam ? parseInt(mapzoomParam, 10) : undefined;

    ctx.setLoading(true);
    try {
      const raw = await fetchWithRetry(url);
      const caches: Geocache[] = processStandardResponse(raw);

      if (caches.length === 0) {
        ctx.showToast('Data source returned no valid caches');
        return;
      }

      ctx.setCaches(() => caches);
      ctx.showToast(`Loaded ${caches.length} caches from external source`);

      // Determine fly-to target: explicit center > data centroid
      const target = centerCoords ?? {
        lat: caches.reduce((s, c) => s + c.latitude, 0) / caches.length,
        lng: caches.reduce((s, c) => s + c.longitude, 0) / caches.length,
      };

      setTimeout(() => ctx.flyTo(target.lat, target.lng, { zoom }), 600);
    } catch (err: any) {
      console.error('DataSourceHandler fetch failed', err);
      ctx.showToast('Failed to load external data: ' + (err.message || err));
    } finally {
      ctx.setLoading(false);
    }
  }

  /** Parse "lat,lng" string into a coordinate object, returns null on failure */
  private parseCenter(value: string | null): { lat: number; lng: number } | null {
    if (!value) return null;
    const parts = value.split(',');
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  }

  /** Check if a URL starts with any allowed origin prefix */
  private isAllowed(url: string): boolean {
    return this.allowedOrigins.some(origin => url.startsWith(origin));
  }
}
