/**
 * Runtime configuration loader.
 * Fetches ./assets/config.json (or remote fallback) at app startup and validates the schema.
 * This allows modifying map layers, links, cluster styles etc. without rebuilding.
 */
import type { MapLayerConfig, MapType } from './types';

// ── Shape of ./assets/config.json ──

export interface RuntimeConfig {
  version: string;
  cacheFiles: { current: string; newpublish: string };
  defaultEndpoint: string;
  defaultMapLayer: string;
  links: { name: string; url: string; icon: string }[];
  settingsMenu: { id: string; label: string; desc: string; default?: boolean | number }[];
  aboutText: string;
  iconUrlTemplate: string;
  pinCreationMinZoom: number;
  mapLayers: Record<MapType, MapLayerConfig>;
  clusterConfig: {
    maxClusterRadius: number;
    disableClusteringAtZoom: number;
    tiers: { max: number; bg: string; color: string }[];
    baseStyle: {
      size: number;
      border: string;
      shadow: string;
      fontSize: string;
      fontWeight: string;
    };
  };
}

// ── Fallback used while loading or on error ──

const FALLBACK_CONFIG: RuntimeConfig = {
  version: '0.0.0',
  cacheFiles: { current: '', newpublish: '' },
  defaultEndpoint: 'by_published',
  defaultMapLayer: 'gaode',
  links: [],
  settingsMenu: [
    { id: 'showCircles', label: '161m Proximity Circles', desc: 'Show exclusion zones around caches', default: true },
    { id: 'customPinsEnabled', label: 'Custom Pins Mode', desc: 'Long press map to drop temporary pins', default: false },
    { id: 'autoSync', label: 'Auto Offline Sync', desc: 'Download full database daily automatically', default: true },
    { id: 'clusterEnabled', label: 'Marker Clustering', desc: 'Group nearby markers into clusters', default: true },
    { id: 'exploreRadius', label: '默认搜索半径', desc: '设置默认搜索半径，单位为公里', default: 3 },
    { id: 'openInApp', label: 'Open in App', desc: 'Open cache links with coord.info to launch the Geocaching app', default: false },
  ],
  aboutText: '',
  iconUrlTemplate: '',
  pinCreationMinZoom: 12,
  mapLayers: {
    gaode: { name: '高德', url: '', std: 'gcj02', maxZoom: 18, subdomains: ['1','2','3','4'] },
    gaodeHQ: { name: '高德 高清', url: '', std: 'gcj02', maxZoom: 18, subdomains: ['1','2','3','4'] },
    osm: { name: 'OSM', url: '', std: 'wgs84' },
    satellite: { name: '卫星', url: '', std: 'wgs84' },
    googlesat: { name: 'Google卫星', url: '', std: 'wgs84', subdomains: ['0','1','2','3'] },
    googlemap: { name: 'Google地图', url: '', std: 'gcj02', subdomains: ['0','1','2','3'] },
    tencent: { name: '腾讯', url: '', std: 'gcj02', subdomains: ['0','1','2','3'] },
  },
  clusterConfig: {
    maxClusterRadius: 50,
    disableClusteringAtZoom: 15,
    tiers: [
      { max: 10, bg: '#4ECDC4', color: '#FFFFFF' },
      { max: 50, bg: '#FFC900', color: '#1E293B' },
      { max: 999999, bg: '#FF90E8', color: '#FFFFFF' },
    ],
    baseStyle: { size: 40, border: '2px solid #1E293B', shadow: '4px 4px 0px 0px rgba(0,0,0,0.45)', fontSize: '14px', fontWeight: '900' },
  },
};

// ── Singleton ──

let _config: RuntimeConfig = FALLBACK_CONFIG;
let _loaded = false;

/** Load & validate runtime config. Safe to call multiple times — only fetches once. */
const REMOTE_CONFIG_URL = 'https://kevinaudio.bjcnc.scs.sohucs.com/tftc_config.json';

export async function loadConfig(): Promise<RuntimeConfig> {
  if (_loaded) return _config;
  try {
    let res = await fetch('./assets/config.json');
    if (!res.ok) throw new Error(`./assets/config.json fetch failed: ${res.status}`);
    const json = await res.json();
    _config = validate(json);
  } catch (e) {
    console.warn('Failed to load ./assets/config.json, trying remote fallback:', e);
    try {
      const res = await fetch(REMOTE_CONFIG_URL);
      if (!res.ok) throw new Error(`remote config fetch failed: ${res.status}`);
      const json = await res.json();
      _config = validate(json);
    } catch (e2) {
      console.warn('Failed to load remote config, using fallback:', e2);
    }
  }
  _loaded = true;
  return _config;
}

/** Synchronous accessor — returns fallback until loadConfig() resolves. */
export function getConfig(): RuntimeConfig {
  return _config;
}

// ── Lightweight validation ──

function validate(raw: any): RuntimeConfig {
  if (!raw || typeof raw !== 'object') throw new Error('config.json is not an object');
  if (!raw.mapLayers || !raw.mapLayers.osm) throw new Error('config.json missing mapLayers.osm');
  // Basic merge to handle missing fields gracefully
  return deepMerge(FALLBACK_CONFIG, raw) as RuntimeConfig;
}

function deepMerge(a: any, b: any): any {
  const result = { ...a };
  for (const key of Object.keys(b)) {
    if (b[key] && typeof b[key] === 'object' && !Array.isArray(b[key])) {
      result[key] = deepMerge(a[key] || {}, b[key]);
    } else {
      result[key] = b[key];
    }
  }
  return result;
}
