import { IDeepLinkHandler, DeepLinkContext } from '../types';

/**
 * Handles ?pin=lat,lng[,note] deep links.
 * Creates a temporary pin and flies to it.
 */
export class PinHandler implements IDeepLinkHandler {
  readonly id = 'pin';

  match(params: URLSearchParams): boolean {
    return params.has('pin');
  }

  async execute(params: URLSearchParams, ctx: DeepLinkContext): Promise<void> {
    const pinStr = params.get('pin')!;
    const parts = pinStr.split(',');
    if (parts.length < 2) return;

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    const note = parts.slice(2).join(',');

    if (isNaN(lat) || isNaN(lng)) return;

    ctx.flyTo(lat, lng);

    // Wait for fly animation, then drop pin
    setTimeout(() => {
      const id = ctx.addTempPin(lat, lng, note);
      setTimeout(() => {
        ctx.flyTo(lat, lng, { pinId: id });
        ctx.showToast('Temporary pin added');
      }, 50);
    }, 1600);
  }
}
