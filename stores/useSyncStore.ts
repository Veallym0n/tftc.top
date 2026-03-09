import { create } from 'zustand';

interface SyncState {
  status: 'idle' | 'loading cache' | 'processing cache data';
  offlineMeta: {
    lastSync: string | null;
    count: number;
  };
  setStatus: (status: 'idle' | 'loading cache' | 'processing cache data') => void;
  setOfflineMeta: (meta: { lastSync: string | null; count: number }) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  offlineMeta: { lastSync: null, count: 0 },
  setStatus: (status) => set({ status }),
  setOfflineMeta: (offlineMeta) => set({ offlineMeta }),
}));