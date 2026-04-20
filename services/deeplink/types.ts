import { Geocache } from '../../types';

/**
 * Deep link handler context - provides access to app capabilities
 * that handlers need to perform their actions.
 */
export interface DeepLinkContext {
  setCaches: (updater: (prev: Geocache[]) => Geocache[]) => void;
  setLoading: (loading: boolean) => void;
  showToast: (msg: string) => void;
  addTempPin: (lat: number, lng: number, note: string) => number;
  flyTo: (lat: number, lng: number, opts?: { code?: string; pinId?: number; zoom?: number }) => void;
}

/**
 * Result of parsing URL search params.
 * Each handler decides whether it can handle the current URL.
 */
export interface IDeepLinkHandler {
  /** Unique identifier for this handler */
  readonly id: string;

  /**
   * Check if this handler can process the given URL params.
   * Returns true if this handler claims the deep link.
   */
  match(params: URLSearchParams): boolean;

  /**
   * Execute the deep link action.
   * Called only if match() returned true.
   */
  execute(params: URLSearchParams, ctx: DeepLinkContext): Promise<void>;
}
