
import { AppConfig, MapLayerConfig, MapType } from './types';

export const CONFIG: AppConfig = {
  version: '1.2.0',
  apiBase: 'https://tftc.top/apiv2',
  endpoints: {
    by_published: 'by-published',
    by_found: 'by-found',
    by_event: 'by-event',
    by_today: 'by-today',
    by_ftf: 'by-ftf',
    all: 'all'
  },
  links: [
    { name: '2026年徽章活动列表', url: './souvenirs/2026.html', icon: '🎖️' },
    { name: 'Geocaching 官方', url: 'https://www.geocaching.com', icon: '🌐' },
    { name: 'Geodataing 数据统计', url: 'https://geodataing.vercel.app', icon: '📊' },
    { name: 'NanoApe 的新人入门站', url: 'https://geoguide.top', icon: '🏆' },
    { name: 'Geocaching CN', url: 'https://www.geocaching.cn', icon: '🇨🇳' }
  ],
  cacheTypes: {
    2: { name: '传统', color: '#4CAF50' },
    3: { name: '多步', color: '#FF9800' },
    8: { name: '谜题', color: '#2196F3' },
    4: { name: '虚拟', color: '#9C27B0' },
    5: { name: '信箱', color: '#607D8B' },
    6: { name: '活动', color: '#F44336' },
    11: { name: 'Webcam', color: '#FFCDD2' },
    13: { name: 'CITO', color: '#8BC34A' },
    66: { name: 'Wherigo', color: '#0c63a8'},
    69: {name: 'Celebration', color: '#fe70a4'},
    137: { name: '地球', color: '#00BCD4' }
  },
  containerTypes: {
    1: '未知',
    2: 'Micro',
    3: 'Regular',
    4: 'Large',
    5: 'Virtual',
    6: 'Other',
    8: 'Small'
  },
  settingsMenu: [
    { id: 'showCircles', label: '161m Proximity Circles', desc: 'Show exclusion zones around caches' },
    { id: 'customPinsEnabled', label: 'Custom Pins Mode', desc: 'Long press map to drop temporary pins' },
    { id: 'autoSync', label: 'Auto Offline Sync', desc: 'Download full database daily automatically' }
  ],
  aboutText: 'tftc.top, 致力于通过数据描述中国境内 geocaching 的发展现状。'
};

export const MAP_LAYERS: Record<MapType, MapLayerConfig> = {
  gaode: {
    name: '高德 (Amap)',
    url: 'https://wprd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=10&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
    std: 'gcj02'
  },
  tencent: {
    name: '腾讯地图',
    url: 'https://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={-y}&type=vector&styleid=0',
    subdomains:['0','1','2','3'],
    std:'gcj02'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    std: 'wgs84'
  },
  satellite: {
    name: '卫星 (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    std: 'wgs84'
  }
};

export const CLUSTER_CONFIG = {
  maxClusterRadius: 50, 
  disableClusteringAtZoom: 15, 
  spiderfyOnMaxZoom: true,
  // Memphis Style Tiers
  tiers: [
    // Tier 1: Small (<10) -> Green BG, White Text
    { max: 10, bg: '#4ECDC4', color: '#FFFFFF' }, 
    // Tier 2: Medium (<50) -> Yellow BG, Dark Text
    { max: 50, bg: '#FFC900', color: '#1E293B' }, 
    // Tier 3: Large (>=50) -> Pink BG, White Text
    { max: Infinity, bg: '#FF90E8', color: '#FFFFFF' } 
  ],
  baseStyle: {
    size: 40, 
    border: '2px solid #1E293B', // Slate 800
    shadow: '4px 4px 0px 0px rgba(0,0,0,0.45)', // Hard Shadow
    fontSize: '14px',
    fontWeight: '900' // Black weight
  }
};

export const PIN_CREATION_MIN_ZOOM = 12;

export const ICON_URL_TEMPLATE = '//tftc.top/static/icon-{n}.svg';
