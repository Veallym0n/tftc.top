import { useEffect, useRef, useState } from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { useMapStore } from '../stores/useMapStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useSyncStore } from '../stores/useSyncStore';
import { dbService } from '../services/db';
import { cacheService } from '../services/cacheService';
import { eventService } from '../services/eventService';
import { deepLinkFactory } from '../services/deeplink';
import type { DeepLinkContext } from '../services/deeplink';
import { Language } from '../utils/i18n';
import { MapMoveEvent, StoredGpx, Geocache } from '../types';
import { openAppScheme } from '../utils/geo';
import SyncConfirmModal from '../components/AppDrawer/Modals/SyncConfirmModal';

export const useAppController = () => {
  // --- Stores ---
  const {
    settings, setCaches, showToast, setLoading,
    setDrawerOpen, initSettings, loadUserPins, loadGpxList,
    addTempPin, setToast
  } = useMapStore();
  const { setLang } = useLanguageStore();
  const { offlineMeta, status: syncStatus } = useSyncStore();

  // --- Local State ---
  const [isExploreMode, setIsExploreMode] = useState(false);
  const lastSearchRef = useRef<{ lat: number; lng: number } | null>(null);
  const mapCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  // ============================================================
  //  Helpers
  // ============================================================

  const flyTo = (lat: number, lng: number, opts?: { code?: string; pinId?: number; zoom?: number }) => {
    eventService.emit('MAP_FLY_TO', { lat, lng, ...opts });
  };

  const buildDeepLinkCtx = (): DeepLinkContext => ({
    setCaches,
    setLoading,
    showToast,
    addTempPin,
    flyTo,
  });

  // ============================================================
  //  Data Loading
  // ============================================================

  const loadFromCache = async () => {
    setDrawerOpen(false);
    setLoading(true);
    try {
      const cached = await dbService.getOfflineCaches();
      setCaches(cached);
      showToast(`Loaded ${cached.length} cached items`);
    } catch (err: any) {
      showToast('Error loading cache: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const performFetch = async (type: string) => {
    setLoading(true);
    setToast('Updating map data...');
    try {
      const data = type === 'all'
        ? await cacheService.syncAllData()
        : await cacheService.fetchData(type);
      setCaches(data);
      showToast(type === 'all' ? 'Data download complete' : `Found ${data.length} caches`);
      if (type === 'by_today') cacheService.getCacheStatus();
    } catch (err: any) {
      console.error(err);
      showToast('Error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  //  Explore Mode
  // ============================================================

  const performExploreSearch = async (lat: number, lng: number) => {
    if (lastSearchRef.current) {
      const dLat = Math.abs(lat - lastSearchRef.current.lat);
      const dLng = Math.abs(lng - lastSearchRef.current.lng);
      if (dLat < 0.002 && dLng < 0.002) return;
    }
    lastSearchRef.current = { lat, lng };

    try {
      const newData = await cacheService.getNearbyCaches(lat, lng, settings.exploreRadius);
      setCaches((prev) => {
        const existingCodes = new Set(prev.map(c => c.code));
        const uniqueNew = newData.filter(c => !existingCodes.has(c.code));
        return uniqueNew.length === 0 ? prev : [...prev, ...uniqueNew];
      });
    } catch (e) {
      console.error('Explore search failed', e);
    }
  };

  // ============================================================
  //  1. Initialization Effect
  // ============================================================
  useEffect(() => {
    const initApp = async () => {
      // A. Load settings & local data
      await Promise.all([
        initSettings(),
        loadUserPins(),
        loadGpxList(),
        cacheService.getCacheStatus(),
      ]);

      // B. Language
      const savedLang = await dbService.getSetting<Language>('language', 'en');
      setLang(savedLang);

      // C. Deep link detection
      const hasDeepLink = deepLinkFactory.hasDeepLink();

      // D. Default data load only when no deep link
      if (!hasDeepLink) {
        performFetch('by_published');
      }

      // E. Execute matching deep link handler
      await deepLinkFactory.process(buildDeepLinkCtx());
    };

    // Global helpers
    (window as any).openApp = (type: any, lat: any, lng: any, name: any, code: any) =>
      openAppScheme(lat, lng, name, code, type);

    initApp();

    return () => {
      (window as any).openApp = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  //  2. Event Listeners Effect
  // ============================================================
  useEffect(() => {
    const handleMapIdle = async (evt: MapMoveEvent) => {
      mapCenterRef.current = { lat: evt.lat, lng: evt.lng };
      if (isExploreMode && evt.zoom > 10) {
        await performExploreSearch(evt.lat, evt.lng);
      }
    };

    const handleCacheSelected = (cache: Geocache) => {
      setDrawerOpen(false);
      setCaches((prev) => {
        if (prev.some(c => c.code === cache.code)) return prev;
        return [...prev, cache];
      });
      setTimeout(() => flyTo(cache.latitude, cache.longitude, { code: cache.code }), 300);
      showToast(`Jumped to ${cache.code}`);
    };

    eventService.on('MAP_IDLE', handleMapIdle);
    eventService.on('CACHE_SELECTED', handleCacheSelected);

    return () => {
      eventService.off('MAP_IDLE', handleMapIdle);
      eventService.off('CACHE_SELECTED', handleCacheSelected);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExploreMode, settings.exploreRadius]);

  // ============================================================
  //  Public API
  // ============================================================

  const fetchData = async (type: string) => {
    setDrawerOpen(false);
    setIsExploreMode(false);

    if (type === 'all') {
      if (offlineMeta.count > 0) {
        NiceModal.show(SyncConfirmModal, {
          onConfirm: async (shouldUpdate: boolean) => {
            if (shouldUpdate) performFetch('all');
            else loadFromCache();
          },
        });
        return;
      }
      if (!confirm('Download full database from server? (This may take a while)')) return;
      cacheService.syncAllData().catch(e => showToast(e.message));
      return;
    }
    performFetch(type);
  };

  const handleToggleExplore = () => {
    const isSyncing = syncStatus === 'loading cache' || syncStatus === 'processing cache data';
    if (isSyncing) {
      showToast('geocache data is downloading for local cache. please wait...');
      return;
    }

    const newState = !isExploreMode;
    setIsExploreMode(newState);
    eventService.emit('EXPLORE_TOGGLED', newState);

    if (newState) {
      showToast(`Explore Mode: Drag map to search (${settings.exploreRadius}km)`);
      if (mapCenterRef.current) {
        performExploreSearch(mapCenterRef.current.lat, mapCenterRef.current.lng);
      }
    } else {
      lastSearchRef.current = null;
    }
  };

  const handleLoadGpx = (gpx: StoredGpx) => {
    setCaches(gpx.caches);
    setDrawerOpen(false);
    setIsExploreMode(false);
    showToast(`Loaded ${gpx.count} caches from "${gpx.name}"`);
  };

  return {
    isExploreMode,
    fetchData,
    handleToggleExplore,
    handleLoadGpx,
    /** Expose for external custom deep link registration */
    deepLinkFactory,
  };
};
