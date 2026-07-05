import coordtransform from 'coordtransform';

// coordtransform uses [lng, lat]; we maintain [lat, lng] for the rest of the app
export function wgs2gcj(lat: number, lon: number): [number, number] {
  const [lng, latR] = coordtransform.wgs84togcj02(lon, lat);
  return [latR, lng];
}

export function gcj2wgs(lat: number, lon: number): [number, number] {
  const [lng, latR] = coordtransform.gcj02towgs84(lon, lat);
  return [latR, lng];
}

export function wgs2bd(lat: number, lon: number): [number, number] {
  const [lng, latR] = coordtransform.wgs84tobd09(lon, lat);
  return [latR, lng];
}

export function openAppScheme(lat: number, lon: number, name: string, code: string, app: 'amap' | 'baidu') {
  const n = encodeURIComponent(name);
  const c = encodeURIComponent(code);
  
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = isAndroid || isIOS || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (app === 'amap') {
    if (isMobile) {
      const scheme = isAndroid ? 'androidamap' : 'iosamap';
      window.location.href = `${scheme}://viewMap?sourceApplication=TFTCTop&poiname=${n}&poiid=${c}&lat=${lat}&lon=${lon}&dev=1&style=3`;
    } else {
      // PC: Web URL (uses GCJ02)
      const [gLat, gLon] = wgs2gcj(lat, lon);
      window.open(`https://uri.amap.com/marker?position=${gLon},${gLat}&name=${n}&callnative=1`);
    }
  } else if (app === 'baidu') {
    // Input is WGS84, convert to BD09
    const [bLat, bLon] = wgs2bd(lat, lon);

    if (isMobile) {
      // Scheme: baidumap://map/marker?location=[LATITUDE],[LONGITUDE]&title=[NAME]
      window.location.href = `baidumap://map/marker?location=${bLat},${bLon}&title=${n}&content=${c}&src=TFTCTop`;
    } else {
      // PC: Web URL (uses BD09)
      window.open(`https://api.map.baidu.com/marker?location=${bLat},${bLon}&title=${n}&content=${c}&output=html`);
    }
  }
}

export function toDMM(val: number, isLat: boolean) {
  const dir = val >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${dir} ${deg}° ${min.toFixed(3)}'`;
}

export function formatDMM(lat: number, lng: number) {
  return `${toDMM(lat, true)} ${toDMM(lng, false)}`;
}

/**
 * Open a third-party map or Google Street View for a given GC code.
 *
 * Usage (browser console or any JS context):
 *   window.openMap('gaode',        'GC1FB')  // 高德地图（网页版）
 *   window.openMap('baidu',        'GC1FB')  // 百度地图（网页版）
 *   window.openMap('google',       'GC1FB')  // Google Maps
 *   window.openMap('googlestreet', 'GC1FB')  // Google Street View
 *
 * Lookup order:
 *   1. Current map markers (useMapStore.caches)
 *   2. Offline IndexedDB
 *
 * @param app  - One of 'baidu' | 'gaode' | 'google' | 'googlestreet'
 * @param code - GC code, e.g. 'GC1FB'
 */
export async function openMap(
  app: 'baidu' | 'gaode' | 'google' | 'googlestreet',
  code: string,
): Promise<void> {
  const upperCode = code.trim().toUpperCase();

  // 1. Look up from current map markers first
  const { useCacheStore } = await import('../stores/useCacheStore');
  let cache = useCacheStore.getState().caches.find(c => c.code === upperCode);

  // 2. Fallback to offline DB only
  if (!cache) {
    const { dbService } = await import('../services/db');
    cache = await dbService.getCache(upperCode);
  }

  if (!cache) {
    console.warn(`[openMap] Cache not found: ${upperCode}`);
    return;
  }

  const { latitude: wgsLat, longitude: wgsLon, name } = cache;
  const n = encodeURIComponent(name);
  const c = encodeURIComponent(upperCode);

  switch (app) {
    case 'gaode': {
      const [gLat, gLon] = wgs2gcj(wgsLat, wgsLon);
      window.open(`https://uri.amap.com/marker?position=${gLon},${gLat}&name=${n}&callnative=1`);
      break;
    }
    case 'baidu': {
      const [bLat, bLon] = wgs2bd(wgsLat, wgsLon);
      window.open(`https://api.map.baidu.com/marker?location=${bLat},${bLon}&title=${n}&content=${c}&output=html`);
      break;
    }
    case 'google': {
      window.open(`https://www.google.com/maps/search/?api=1&query=${wgsLat},${wgsLon}`);
      break;
    }
    case 'googlestreet': {
      window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${wgsLat},${wgsLon}`);
      break;
    }
    default:
      console.warn(`[openMap] Unknown app: ${app}`);
  }
}
