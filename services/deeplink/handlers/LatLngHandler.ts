import { IDeepLinkHandler, DeepLinkContext } from '../types';
import NiceModal from '@ebay/nice-modal-react';
import SmartCoords from '../../../components/AppDrawer/Tools/SmartCoords';

/**
 * Handles ?lat=xxx&lng=xxx[&name=xxx] deep links.
 * Opens SmartCoords tool and flies to the coordinate.
 */
export class LatLngHandler implements IDeepLinkHandler {
  readonly id = 'latlng';

  match(params: URLSearchParams): boolean {
    return params.has('lat') && params.has('lng');
  }

  async execute(params: URLSearchParams, ctx: DeepLinkContext): Promise<void> {
    const lat = parseFloat(params.get('lat')!);
    const lng = parseFloat(params.get('lng')!);
    const name = params.get('name') || undefined;

    if (isNaN(lat) || isNaN(lng)) return;

    NiceModal.show(SmartCoords, { externalTarget: { lat, lng, name } });
    setTimeout(() => ctx.flyTo(lat, lng), 1000);
  }
}
