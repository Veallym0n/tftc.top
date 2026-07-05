/**
 * Compile-time constants — data that rarely changes.
 * Runtime-configurable items (map layers, links, cluster styles, etc.)
 * live in public/config.json and are accessed via config.ts.
 */

export const CACHE_TYPES: Record<number, { name: string; color: string }> = {
  2: { name: '传统', color: '#4CAF50' },
  3: { name: '多步', color: '#FF9800' },
  8: { name: '谜题', color: '#2196F3' },
  4: { name: '虚拟', color: '#9C27B0' },
  5: { name: '信箱', color: '#607D8B' },
  6: { name: '活动', color: '#F44336' },
  11: { name: 'Webcam', color: '#a9a9a9ff' },
  13: { name: 'CITO', color: '#8BC34A' },
  66: { name: 'Wherigo', color: '#0c63a8' },
  69: { name: 'Celebration', color: '#fe70a4' },
  137: { name: '地球', color: '#00BCD4' },
};

export const CONTAINER_TYPES: Record<number, string> = {
  1: '未知',
  2: 'Micro',
  3: 'Regular',
  4: 'Large',
  5: 'Virtual',
  6: 'Other',
  8: 'Small',
};
