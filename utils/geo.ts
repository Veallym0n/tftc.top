
const PI = 3.14159265358979324;
const a = 6378245.0;
const ee = 0.00669342162296594323;

function outOfChina(lat: number, lon: number): boolean {
  if (lon < 72.004 || lon > 137.8347) return true;
  if (lat < 0.8293 || lat > 55.8271) return true;
  return false;
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}

export function wgs2gcj(lat: number, lon: number): [number, number] {
  if (outOfChina(lat, lon)) {
    return [lat, lon];
  }
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  return [lat + dLat, lon + dLon];
}

export function gcj2wgs(lat: number, lon: number): [number, number] {
  if (outOfChina(lat, lon)) {
    return [lat, lon];
  }
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  return [lat - dLat, lon - dLon];
}

export function wgs2bd(lat: number, lon: number): [number, number] {
  const [gcjLat, gcjLon] = wgs2gcj(lat, lon);
  const z = Math.sqrt(gcjLon * gcjLon + gcjLat * gcjLat) + 0.00002 * Math.sin(gcjLat * PI * 3000.0 / 180.0);
  const theta = Math.atan2(gcjLat, gcjLon) + 0.000003 * Math.cos(gcjLon * PI * 3000.0 / 180.0);
  const bdLon = z * Math.cos(theta) + 0.0065;
  const bdLat = z * Math.sin(theta) + 0.006;
  return [bdLat, bdLon];
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
