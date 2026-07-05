import { create } from 'zustand';
import { dbService } from '../services/db';
import { syncService } from '../services/syncService';
import { getConfig } from '../config';

/* ================================================================
 * useAppStore — UI 状态 + 设置
 * drawerOpen, toast, loading, settings
 * ================================================================ */

export type AppSettings = Record<string, boolean | number | string>;

interface AppState {
  drawerOpen: boolean;
  showLayerMenu: boolean;
  loading: boolean;
  toastMsg: string | null;
  settings: AppSettings;

  setDrawerOpen: (open: boolean) => void;
  setShowLayerMenu: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setToast: (msg: string | null) => void;
  showToast: (msg: string) => void;

  initSettings: () => Promise<void>;
  toggleSetting: (key: string, val: boolean) => void;
  setExploreRadius: (radius: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  drawerOpen: false,
  showLayerMenu: false,
  loading: false,
  toastMsg: null,
  settings: (() => {
    const s: AppSettings = {};
    for (const item of getConfig().settingsMenu) s[item.id] = item.default ?? false;
    return s;
  })(),

  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setShowLayerMenu: (showLayerMenu) => set({ showLayerMenu }),
  setLoading: (loading) => set({ loading }),

  setToast: (toastMsg) => {
    set({ toastMsg });
    if ((window as any)._toastTimeout) clearTimeout((window as any)._toastTimeout);
  },

  showToast: (msg) => {
    set({ toastMsg: msg });
    if ((window as any)._toastTimeout) clearTimeout((window as any)._toastTimeout);
    (window as any)._toastTimeout = setTimeout(() => set({ toastMsg: null }), 3000);
  },

  initSettings: async () => {
    try {
      const menu = getConfig().settingsMenu;
      const [savedMapType, ...values] = await Promise.all([
        dbService.getSetting<string>('mapType', getConfig().defaultMapLayer),
        ...menu.map((item) => dbService.getSetting(item.id, item.default ?? false) as Promise<boolean | number>),
      ]);
      // Side effect: set mapType in the map store
      const { useMapStore } = await import('./useMapStore');
      useMapStore.setState({ mapType: savedMapType as any });

      const settings: AppSettings = {};
      for (let i = 0; i < menu.length; i++) settings[menu[i].id] = values[i];
      set({ settings });
      syncService.initDailySync(Boolean(settings.autoSync));
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  },

  toggleSetting: (key, val) => {
    set((s) => ({ settings: { ...s.settings, [key]: val } }));
    dbService.setSetting(key, val);
    if (key === 'autoSync' && val) syncService.initDailySync(true);
    if (key === 'customPinsEnabled' && val) get().showToast('Long press on map enabled');
    if (key === 'clusterEnabled') get().showToast(val ? 'Clustering enabled' : 'Clustering disabled');
  },

  setExploreRadius: (val) => {
    set((s) => ({ settings: { ...s.settings, exploreRadius: val } }));
    dbService.setSetting('exploreRadius', val);
  },
}));
