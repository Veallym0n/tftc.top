import { IDeepLinkHandler, DeepLinkContext } from '../types';
import { cacheService } from '../../cacheService';

/**
 * Handles ?code=GCxxxxx deep links.
 * Loads a single cache by code and flies to it.
 */
export class CacheCodeHandler implements IDeepLinkHandler {
  readonly id = 'cache_code';

  match(params: URLSearchParams): boolean {
    return params.has('code');
  }

  async execute(params: URLSearchParams, ctx: DeepLinkContext): Promise<void> {
    const code = params.get('code')!;
    ctx.setLoading(true);

    try {
      const cache = await cacheService.getCacheDetail(code);
      if (cache) {
        ctx.setCaches(prev => {
          if (prev.some(c => c.code === cache.code)) return prev;
          return [...prev, cache];
        });
        setTimeout(() => {
          ctx.flyTo(cache.latitude, cache.longitude, { code: cache.code });
          ctx.showToast(`Loaded cache ${cache.code}`);
        }, 1000);
      } else {
        ctx.showToast(`Cache ${code} not found.`);
      }
    } finally {
      ctx.setLoading(false);
    }
  }
}
