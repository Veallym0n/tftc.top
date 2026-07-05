import { create } from 'zustand';
import { Geocache, UserPin, StoredGpx } from '../types';
import { dbService } from '../services/db';
import { cacheService } from '../services/cacheService';
import { syncService } from '../services/syncService';

/* ================================================================
 * useCacheStore — 缓存数据 + 同步状态
 * caches, userPins, gpxFiles, syncStatus, offlineMeta
 * ================================================================ */

interface CacheState {
  caches: Geocache[];
  userPins: UserPin[];
  gpxFiles: StoredGpx[];

  setCaches: (caches: Geocache[] | ((prev: Geocache[]) => Geocache[])) => void;

  loadUserPins: () => Promise<void>;
  addUserPin: (lat: number, lng: number, note?: string) => Promise<void>;
  addTempPin: (lat: number, lng: number, note: string) => number;
  deleteUserPin: (id: number) => Promise<void>;
  updateUserPin: (id: number, note: string) => Promise<void>;

  loadGpxList: () => Promise<void>;
  deleteGpx: (id: number) => Promise<void>;

  // 同步状态 (原 useSyncStore)
  syncStatus: 'idle' | 'loading cache' | 'processing cache data';
  offlineMeta: { lastSync: string | null; count: number };
  setSyncStatus: (status: 'idle' | 'loading cache' | 'processing cache data') => void;
  setOfflineMeta: (meta: { lastSync: string | null; count: number }) => void;

  // 数据加载动作
  syncAllData: () => Promise<void>;
  fetchByType: (type: string) => Promise<void>;
  loadOfflineCaches: () => Promise<void>;
  loadGpxCaches: (gpx: StoredGpx) => Promise<void>;
  exploreNearby: (lat: number, lng: number, radius: number) => Promise<void>;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  caches: [],
  userPins: [],
  gpxFiles: [],
  syncStatus: 'idle',
  offlineMeta: { lastSync: null, count: 0 },

  setCaches: (updater) =>
    set((s) => ({
      caches: typeof updater === 'function' ? updater(s.caches) : updater,
    })),

  loadUserPins: async () => {
    const pins = await dbService.getAll();
    set({ userPins: pins });
  },

  addUserPin: async (lat, lng, note) => {
    const { useAppStore } = await import('./useAppStore');
    if (!useAppStore.getState().settings.customPinsEnabled) return;
    const newPin: UserPin = { id: Date.now(), lat, lng, note: note || '', create_at: Date.now() };
    await dbService.add(newPin);
    set((s) => ({ userPins: [...s.userPins, newPin] }));
  },

  addTempPin: (lat, lng, note) => {
    const id = Date.now();
    const newPin: UserPin = { id, lat, lng, note, create_at: id };
    set((s) => ({ userPins: [...s.userPins, newPin] }));
    return id;
  },

  deleteUserPin: async (id) => {
    await dbService.delete(id);
    set((s) => ({ userPins: s.userPins.filter((p) => p.id !== id) }));
  },

  updateUserPin: async (id, note) => {
    const pin = get().userPins.find((p) => p.id === id);
    if (!pin) return;
    const updatedPin = { ...pin, note };
    try {
      await dbService.updatePin(updatedPin);
      set((s) => ({ userPins: s.userPins.map((p) => (p.id === id ? updatedPin : p)) }));
      // Show toast via app store
      const { useAppStore } = await import('./useAppStore');
      useAppStore.getState().showToast('Note saved');
    } catch (e) {
      console.error(e);
      const { useAppStore } = await import('./useAppStore');
      useAppStore.getState().showToast('Failed to save note');
    }
  },

  loadGpxList: async () => {
    try {
      const list = await cacheService.getGpxList();
      set({ gpxFiles: list });
    } catch (e: any) {
      const { useAppStore } = await import('./useAppStore');
      useAppStore.getState().showToast('Error:' + e.message);
      console.error(e);
    }
  },

  deleteGpx: async (id) => {
    try {
      await cacheService.deleteGpx(id);
      get().loadGpxList();
      const { useAppStore } = await import('./useAppStore');
      useAppStore.getState().showToast('GPX deleted');
    } catch (e: any) {
      const { useAppStore } = await import('./useAppStore');
      useAppStore.getState().showToast('Error: ' + e.message);
    }
  },

  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setOfflineMeta: (offlineMeta) => set({ offlineMeta }),

  /* ---- 数据加载 ---- */

  syncAllData: async () => {
    const data = await syncService.syncAllData();
    set({ caches: data });
    const app = (await import('./useAppStore')).useAppStore;
    app.getState().showToast('数据下载完成');
  },

  fetchByType: async (type) => {
    const data = await cacheService.fetchData(type);
    set({ caches: data });
    if (type === 'by_today') syncService.getCacheStatus();
    const app = (await import('./useAppStore')).useAppStore;
    app.getState().showToast(`找到 ${data.length} 个藏点`);
  },

  loadOfflineCaches: async () => {
    const cached = await cacheService.loadOfflineCaches();
    set({ caches: cached });
    const app = (await import('./useAppStore')).useAppStore;
    app.getState().showToast(`已加载 ${cached.length} 个缓存项`);
  },

  loadGpxCaches: async (gpx) => {
    set({ caches: gpx.caches });
    const app = (await import('./useAppStore')).useAppStore;
    app.getState().showToast(`已加载 ${gpx.count} 个藏点 "${gpx.name}"`);
  },

  exploreNearby: async (lat, lng, radius) => {
    const newData = await cacheService.getNearbyCaches(lat, lng, radius);
    const prev = get().caches;
    const existingCodes = new Set(prev.map(c => c.code));
    const uniqueNew = newData.filter(c => !existingCodes.has(c.code));
    if (uniqueNew.length > 0) set({ caches: [...prev, ...uniqueNew] });
  },
}));