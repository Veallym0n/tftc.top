
export interface Geocache {
  code: string;
  name: string;
  geocacheType: number; // 2:Traditional, 3:Multi, 8:Mystery, etc.
  containerType: number; // 2:Micro, 3:Regular, etc.
  difficulty: number;
  terrain: number;
  latitude: number;
  longitude: number;
  placedDate: string;
  lastFoundDate: string;
  ownerUsername: string;
  favoritePoints: number;
  h3?: string; // ClickHouse geoToH3 result (Reference only)
  h3hash?: string; // App Internal Index (Res 9)
}

export interface UserPin {
  id: number;
  lat: number;
  lng: number;
  note: string; // Mandatory now
  create_at: number;
}

export interface StoredGpx {
  id: number;
  name: string;
  timestamp: number;
  count: number;
  caches: Geocache[];
}

export type MapType = 'gaode' | 'tencent' | 'osm' | 'satellite';

export interface MapLayerConfig {
  name: string;
  url: string;
  subdomains?: string[];
  std: 'gcj02' | 'wgs84'; // Coordinate standard
  className?: string;
}

export interface AppConfig {
  version: string;
  apiBase: string;
  endpoints: Record<string, string>;
  links: Array<{ name: string; url: string; icon: string }>;
  cacheTypes: Record<number, { name: string; color: string }>;
  containerTypes: Record<number, string>;
  settingsMenu: Array<{ id: string; label: string; desc: string }>;
  aboutText: string;
}

// --- Event System Types ---

export interface MapMoveEvent {
  lat: number;
  lng: number;
  zoom: number;
}

export interface MapFlyToEvent {
  lat: number;
  lng: number;
  code?: string; // If provided, try to open popup
  pinId?: number; // If provided, try to open user pin popup
}

export interface AppEventMap {
  'MAP_DRAG_START': void;
  'MAP_IDLE': MapMoveEvent;
  'MAP_FLY_TO': MapFlyToEvent;
  'CACHE_SELECTED': Geocache;
  'EXPLORE_TOGGLED': boolean;
  'DATA_REFRESHED': void;
}
