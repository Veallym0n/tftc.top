import { create } from 'zustand';
import { MapType } from '../types';
import { dbService } from '../services/db';
import { getConfig } from '../config';

/* ================================================================
 * useMapStore — 地图视图状态 + 探索模式
 * mapType, 定位, 跟随, flyTo, 探索模式
 * ================================================================ */

// 探索模式 refs（模块私有）
let _lastExploreSearch: { lat: number; lng: number } | null = null;
let _exploreTimer: number | null = null;

interface MapState {
  mapType: MapType;
  isLocating: boolean;
  isFollowing: boolean;
  isExploreMode: boolean;
  /** 递增计数器，每次 flyTo 调用触发 TFTCMap 响应 */
  flySeq: number;
  flyTarget: { lat: number; lng: number; zoom?: number } | null;

  setMapType: (type: MapType) => void;
  setIsLocating: (isLocating: boolean) => void;
  setIsFollowing: (isFollowing: boolean) => void;
  setExploreMode: (v: boolean) => void;
  toggleExplore: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  onMapMoveEnd: (lat: number, lng: number, zoom: number) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  mapType: (getConfig().defaultMapLayer || 'gaode') as MapType,
  isLocating: false,
  isFollowing: true,
  isExploreMode: false,
  flySeq: 0,
  flyTarget: null,

  setMapType: (mapType) => {
    set({ mapType });
    dbService.setSetting('mapType', mapType);
  },

  setIsLocating: (isLocating) => set({ isLocating, isFollowing: isLocating }),

  setIsFollowing: (isFollowing) => set({ isFollowing }),

  flyTo: (lat, lng, zoom) =>
    set((s) => ({ flySeq: s.flySeq + 1, flyTarget: { lat, lng, zoom } })),

  setExploreMode: (v) => set({ isExploreMode: v }),

  toggleExplore: async () => {
    const [{ useCacheStore }, { useAppStore }] = await Promise.all([
      import('./useCacheStore'),
      import('./useAppStore'),
    ]);
    const status = useCacheStore.getState().syncStatus;
    if (status === 'loading cache' || status === 'processing cache data') {
      useAppStore.getState().showToast('数据正在下载中，请稍候...');
      return;
    }
    set((s) => {
      const next = !s.isExploreMode;
      if (next) {
        const r = useAppStore.getState().settings.exploreRadius as number;
        useAppStore.getState().showToast(`探索模式: 拖拽地图搜索 (${r}km)`);
      } else {
        _lastExploreSearch = null;
      }
      return { isExploreMode: next };
    });
  },

  onMapMoveEnd: (lat, lng, zoom) => {
    const { isExploreMode } = get();
    if (!isExploreMode || zoom <= 10) return;
    if (_exploreTimer) clearTimeout(_exploreTimer);
    _exploreTimer = window.setTimeout(async () => {
      if (_lastExploreSearch) {
        const dLat = Math.abs(lat - _lastExploreSearch.lat);
        const dLng = Math.abs(lng - _lastExploreSearch.lng);
        if (dLat < 0.002 && dLng < 0.002) return;
      }
      _lastExploreSearch = { lat, lng };
      const { useCacheStore } = await import('./useCacheStore');
      const { useAppStore } = await import('./useAppStore');
      const r = useAppStore.getState().settings.exploreRadius as number;
      await useCacheStore.getState().exploreNearby(lat, lng, r);
    }, 400);
  },
}));
