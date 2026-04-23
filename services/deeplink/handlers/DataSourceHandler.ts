import { IDeepLinkHandler, DeepLinkContext } from '../types';
import { fetchWithRetry, processStandardResponse } from '../../data/v1/fetchUtils';
import { cacheService } from '../../cacheService';
import { zoomForCaches, centroidOfCaches } from '../geoUtils';
import { Geocache } from '../../../types';

/**
 * Handles ?datasource=<value> deep links.
 *
 * Two modes:
 *
 * 1. Internal strategy  — ds://<strategy_id>
 *    Delegates to a registered CacheService strategy (e.g. by_current_event).
 *    Example: ?datasource=ds://by_current_event
 *
 * 2. External HTTP URL — https://...
 *    Fetches JSON from a pre-approved origin in the allow-list.
 *    Example: ?datasource=https://kevinaudio.bjcnc.scs.sohucs.com/my-caches.json
 *
 * Optional params (both modes):
 *   ?center=lat,lng   — fly to this coordinate instead of data centroid
 *   ?mapzoom=<n>      — set map zoom level after flying
 */
export class DataSourceHandler implements IDeepLinkHandler {
  readonly id = 'datasource';

  /** Allowed origin prefixes for external HTTP data sources */
  private readonly allowedOrigins: string[] = [
    'https://kevinaudio.bjcnc.scs.sohucs.com/',
  ];

  match(params: URLSearchParams): boolean {
    return params.has('datasource');
  }

  async execute(params: URLSearchParams, ctx: DeepLinkContext): Promise<void> {
    const value = params.get('datasource');
    if (!value) return;

    // Optional: ?center=lat,lng  overrides centroid fly-to
    const centerCoords = this.parseCenter(params.get('center'));

    // Optional: ?mapzoom=<number>  overrides default zoom
    const zoom = params.has('mapzoom') ? parseInt(params.get('mapzoom')!, 10) : undefined;

    ctx.setLoading(true);
    try {
      const caches = value.startsWith('ds://')
        ? await this.loadInternal(value)
        : await this.loadExternal(value);

      if (caches === null) return; // error already toasted inside helpers

      if (caches.length === 0) {
        ctx.showToast('Data source returned no valid caches');
        return;
      }

      ctx.setCaches(() => caches);
      ctx.showToast(`Loaded ${caches.length} caches`);

      // Determine fly-to target: explicit center > data centroid
      const target = centerCoords ?? centroidOfCaches(caches);
      // Explicit mapzoom wins; otherwise derive from point spread
      const resolvedZoom = zoom ?? zoomForCaches(caches);

      setTimeout(() => ctx.flyTo(target.lat, target.lng, { zoom: resolvedZoom }), 600);
    } catch (err: any) {
      console.error('DataSourceHandler failed', err);
      ctx.showToast('Failed to load data: ' + (err.message || err));
    } finally {
      ctx.setLoading(false);
    }
  }

  // ---- private helpers ----

  /** Load data from an internal registered strategy, e.g. ds://by_current_event */
  private async loadInternal(value: string): Promise<Geocache[] | null> {
    const strategyId = value.slice('ds://'.length).trim();
    try {
      return await cacheService.fetchData(strategyId);
    } catch (err: any) {
      // Let the caller catch and toast
      throw new Error(`Internal strategy "${strategyId}" failed: ${err.message || err}`);
    }
  }

  /** Load data from an external HTTP URL (must be in allow-list) */
  private async loadExternal(url: string): Promise<Geocache[] | null> {
    if (!this.isAllowed(url)) {
      // Can't toast here (no ctx), rethrow as a recognisable error
      throw new Error('Data source not in allow-list');
    }
    const raw = await fetchWithRetry(url);
    return processStandardResponse(raw);
  }

  private isAllowed(url: string): boolean {
    return this.allowedOrigins.some(origin => url.startsWith(origin));
  }

  private parseCenter(value: string | null): { lat: number; lng: number } | null {
    if (!value) return null;
    const parts = value.split(',');
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  }
}
