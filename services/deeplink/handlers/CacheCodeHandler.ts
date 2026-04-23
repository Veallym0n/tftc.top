import { IDeepLinkHandler, DeepLinkContext } from '../types';
import { cacheService } from '../../cacheService';
import { zoomForCaches, centroidOfCaches } from '../geoUtils';
import { Geocache } from '../../../types';

/**
 * Handles ?code=GCxxxxx[,GCyyyyy,...] deep links.
 * Supports one or multiple comma-separated cache codes.
 * Loads all found caches, adds them to the map,
 * and flies to their geographic centroid.
 */
export class CacheCodeHandler implements IDeepLinkHandler {
  readonly id = 'cache_code';

  match(params: URLSearchParams): boolean {
    return params.has('code');
  }

  async execute(params: URLSearchParams, ctx: DeepLinkContext): Promise<void> {
    const codes = params.get('code')!
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    ctx.setLoading(true);

    try {
      // Fetch all codes in parallel
      const results = await Promise.all(
        codes.map(code => cacheService.getCacheDetail(code).catch(() => null))
      );

      const found: Geocache[] = results.filter((c): c is Geocache => c !== null);
      const notFound = codes.filter((_, i) => results[i] === null);

      if (found.length === 0) {
        ctx.showToast(`Cache${codes.length > 1 ? 's' : ''} not found.`);
        return;
      }

      // Add all found caches to the map (skip duplicates)
      ctx.setCaches(prev => {
        const existingCodes = new Set(prev.map(c => c.code));
        const newCaches = found.filter(c => !existingCodes.has(c.code));
        return newCaches.length === 0 ? prev : [...prev, ...newCaches];
      });

      // Fly to geographic centroid, zoom auto-derived from point spread
      const center = centroidOfCaches(found);
      const zoom = zoomForCaches(found);
      const singleCode = found.length === 1 ? found[0].code : undefined;

      setTimeout(() => {
        ctx.flyTo(center.lat, center.lng, { zoom, code: singleCode });
        const msg = notFound.length > 0
          ? `Loaded ${found.length} cache(s). Not found: ${notFound.join(', ')}`
          : `Loaded ${found.length} cache(s)`;
        ctx.showToast(msg);
      }, 1000);
    } finally {
      ctx.setLoading(false);
    }
  }
}
