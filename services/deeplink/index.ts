import { IDeepLinkHandler, DeepLinkContext } from './types';
import { LatLngHandler } from './handlers/LatLngHandler';
import { CacheCodeHandler } from './handlers/CacheCodeHandler';
import { PinHandler } from './handlers/PinHandler';
import { DataSourceHandler } from './handlers/DataSourceHandler';

/**
 * DeepLinkFactory - manages a registry of deep link handlers.
 * 
 * Parses window.location.search and dispatches to the first matching handler.
 * 
 * Usage:
 *   // Register built-in + custom handlers
 *   deepLinkFactory.register(new MyCustomHandler());
 * 
 *   // Process current URL
 *   const handled = await deepLinkFactory.process(ctx);
 *   // handled === true means a deep link was found and executed
 */
class DeepLinkFactory {
  private handlers: IDeepLinkHandler[] = [];

  constructor() {
    // Register built-in handlers (order matters - first match wins)
    this.register(new LatLngHandler());
    this.register(new CacheCodeHandler());
    this.register(new PinHandler());
    this.register(new DataSourceHandler());
  }

  /**
   * Register a custom deep link handler.
   * Handlers registered later are checked after built-in ones unless
   * you use `prepend: true`.
   */
  register(handler: IDeepLinkHandler, prepend = false): void {
    if (prepend) {
      this.handlers.unshift(handler);
    } else {
      this.handlers.push(handler);
    }
  }

  /**
   * Remove a handler by id.
   */
  unregister(id: string): void {
    this.handlers = this.handlers.filter(h => h.id !== id);
  }

  /**
   * Check if any handler matches the current URL search params.
   */
  hasDeepLink(search: string = window.location.search): boolean {
    const params = new URLSearchParams(search);
    return this.handlers.some(h => h.match(params));
  }

  /**
   * Process the URL search params. Runs the first matching handler.
   * Returns true if a handler was executed.
   */
  async process(ctx: DeepLinkContext, search: string = window.location.search): Promise<boolean> {
    const params = new URLSearchParams(search);

    for (const handler of this.handlers) {
      if (handler.match(params)) {
        await handler.execute(params, ctx);
        return true;
      }
    }
    return false;
  }
}

/** Singleton instance */
export const deepLinkFactory = new DeepLinkFactory();

export type { IDeepLinkHandler, DeepLinkContext } from './types';
