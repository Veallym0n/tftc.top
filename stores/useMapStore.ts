
import { create } from 'zustand';
import { Geocache, UserPin, StoredGpx, MapType } from '../types';
import { dbService } from '../services/db';
import { cacheService } from '../services/cacheService';

interface MapState {
  // --- Data ---
  caches: Geocache[];
  userPins: UserPin[];
  gpxFiles: StoredGpx[];
  
  // --- UI State ---
  mapType: MapType;
  drawerOpen: boolean;
  showLayerMenu: boolean;
  loading: boolean;
  toastMsg: string | null;
  isLocating: boolean;

  // --- Settings ---
  settings: {
    showCircles: boolean;
    customPinsEnabled: boolean;
    autoSync: boolean;
    exploreRadius: number;
  };

  // --- Actions ---
  setCaches: (caches: Geocache[] | ((prev: Geocache[]) => Geocache[])) => void;
  setMapType: (type: MapType) => void;
  setDrawerOpen: (open: boolean) => void;
  setShowLayerMenu: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setToast: (msg: string | null) => void;
  showToast: (msg: string) => void; // Helper with timeout
  setIsLocating: (isLocating: boolean) => void;
  
  // Settings Actions
  initSettings: () => Promise<void>;
  toggleSetting: (key: 'showCircles' | 'customPinsEnabled' | 'autoSync', val: boolean) => void;
  setExploreRadius: (radius: number) => void;

  // Data Actions (Async with DB)
  loadUserPins: () => Promise<void>;
  addUserPin: (lat: number, lng: number) => Promise<void>;
  addTempPin: (lat: number, lng: number, note: string) => number; // Returns ID
  deleteUserPin: (id: number) => Promise<void>;
  updateUserPin: (id: number, note: string) => Promise<void>;
  
  loadGpxList: () => Promise<void>;
  deleteGpx: (id: number) => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial State
  caches: [],
  userPins: [],
  gpxFiles: [],
  mapType: 'gaode',
  drawerOpen: false,
  showLayerMenu: false,
  loading: false,
  toastMsg: null,
  isLocating: false,
  settings: {
    showCircles: false,
    customPinsEnabled: false,
    autoSync: true,
    exploreRadius: 3,
  },

  // --- Basic Setters ---
  setCaches: (updater) => set((state) => ({ 
      caches: typeof updater === 'function' ? updater(state.caches) : updater 
  })),
  
  setMapType: (mapType) => {
      set({ mapType });
      dbService.setSetting('mapType', mapType); // Save to DB
  },

  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setShowLayerMenu: (showLayerMenu) => set({ showLayerMenu }),
  setLoading: (loading) => set({ loading }),
  setToast: (toastMsg) => {
    set({ toastMsg });
    if ((window as any)._toastTimeout) {
      clearTimeout((window as any)._toastTimeout);
    }
  },
  setIsLocating: (isLocating) => set({ isLocating }),

  showToast: (msg) => {
    set({ toastMsg: msg });
    if ((window as any)._toastTimeout) {
      clearTimeout((window as any)._toastTimeout);
    }
    (window as any)._toastTimeout = setTimeout(() => set({ toastMsg: null }), 3000);
  },

  // --- Settings Logic ---
  initSettings: async () => {
    try {
        const [circles, pins, sync, radius, savedMapType] = await Promise.all([
            dbService.getSetting('showCircles', false),
            dbService.getSetting('customPinsEnabled', false),
            dbService.getSetting('autoSync', true),
            dbService.getSetting('exploreRadius', 3),
            dbService.getSetting<MapType>('mapType', 'gaode') // Load mapType, default to gaode
        ]);
        
        set({ 
            mapType: savedMapType,
            settings: { 
                showCircles: circles, 
                customPinsEnabled: pins, 
                autoSync: sync, 
                exploreRadius: radius 
            } 
        });

        // Trigger side effects
        cacheService.initDailySync(sync);
    } catch (e) {
        console.error("Failed to load settings", e);
    }
  },

  toggleSetting: (key, val) => {
    set((state) => ({ settings: { ...state.settings, [key]: val } }));
    dbService.setSetting(key, val);
    
    // Side effects
    if (key === 'autoSync' && val) cacheService.initDailySync(true);
    if (key === 'customPinsEnabled' && val) get().showToast('Long press on map enabled');
  },

  setExploreRadius: (val) => {
    set((state) => ({ settings: { ...state.settings, exploreRadius: val } }));
    dbService.setSetting('exploreRadius', val);
  },

  // --- Data Logic (DB Interactions) ---
  
  loadUserPins: async () => {
      const pins = await dbService.getAll();
      set({ userPins: pins });
  },

  addUserPin: async (lat, lng) => {
      if (!get().settings.customPinsEnabled) return;
      const newPin: UserPin = { 
          id: Date.now(), 
          lat, 
          lng, 
          note: '', 
          create_at: Date.now() 
      };
      await dbService.add(newPin);
      set((state) => ({ userPins: [...state.userPins, newPin] }));
  },

  addTempPin: (lat, lng, note) => {
      const id = Date.now();
      const newPin: UserPin = {
          id,
          lat,
          lng,
          note,
          create_at: id
      };
      set((state) => ({ userPins: [...state.userPins, newPin] }));
      return id;
  },

  deleteUserPin: async (id) => {
      await dbService.delete(id);
      set((state) => ({ userPins: state.userPins.filter(p => p.id !== id) }));
  },

  updateUserPin: async (id, note) => {
      const pin = get().userPins.find(p => p.id === id);
      if (!pin) return;
      const updatedPin = { ...pin, note };
      
      try {
          await dbService.updatePin(updatedPin);
          set((state) => ({ 
              userPins: state.userPins.map(p => p.id === id ? updatedPin : p) 
          }));
          get().showToast('Note saved');
      } catch (e) {
          console.error(e);
          get().showToast('Failed to save note');
      }
  },

  loadGpxList: async () => {
      try {
          const list = await cacheService.getGpxList();
          set({ gpxFiles: list });
      } catch (e: any) {
          get().showToast('Error:' + e.message)
          console.error(e);
      }
  },

  deleteGpx: async (id) => {
      try {
          await cacheService.deleteGpx(id);
          get().loadGpxList(); // Refresh list
          get().showToast('GPX deleted');
      } catch (e: any) {
          get().showToast('Error: ' + e.message);
      }
  }
}));
