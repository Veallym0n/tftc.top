
import { useEffect, useRef, useState } from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { useMapStore } from '../stores/useMapStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { useSyncStore } from '../stores/useSyncStore';
import { dbService } from '../services/db';
import { cacheService } from '../services/cacheService';
import { eventService } from '../services/eventService';
import { Language } from '../utils/i18n';
import { MapMoveEvent, StoredGpx, Geocache } from '../types';
import { openAppScheme } from '../utils/geo';
import SyncConfirmModal from '../components/AppDrawer/Modals/SyncConfirmModal';
import SmartCoords from '../components/AppDrawer/Tools/SmartCoords';

export const useAppController = () => {
  // Access Stores
  const { 
      settings, setCaches, showToast, setLoading, 
      setDrawerOpen, initSettings, loadUserPins, loadGpxList,
      addTempPin
  } = useMapStore();
  const { setLang } = useLanguageStore();
  const { offlineMeta, status: syncStatus } = useSyncStore();

  // Local Controller State
  const [isExploreMode, setIsExploreMode] = useState(false);

  // Refs for Logic
  const lastSearchRef = useRef<{lat: number, lng: number} | null>(null);
  const mapCenterRef = useRef<{lat: number, lng: number} | null>(null);

  // --- 1. Initialization Effect ---
  useEffect(() => {
    // Define async init function to ensure sequential loading
    const initApp = async () => {
        // A. Load Settings & Database Data First
        await Promise.all([
            initSettings(),
            loadUserPins(),
            loadGpxList(),
            cacheService.getCacheStatus()
        ]);

        // B. Language
        const savedLang = await dbService.getSetting<Language>('language', 'en');
        setLang(savedLang);

        // C. URL Params Parsing (TFTC Tool Mode)
        const params = new URLSearchParams(window.location.search);
        const latStr = params.get('lat');
        const lngStr = params.get('lng');
        const nameStr = params.get('name') || undefined;
        const codeStr = params.get('code'); 
        const pinStr = params.get('pin');

        const hasDeepLink = (latStr && lngStr) || codeStr || pinStr;

        // D. Initial Data Fetch - Only if NOT in deep link mode
        if (!hasDeepLink) {
            performFetch('by_published');
        }

        // Mode A: Direct Lat/Lng target
        if (latStr && lngStr) {
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
                NiceModal.show(SmartCoords, { externalTarget: { lat, lng, name: nameStr } });
                setTimeout(() => {
                    eventService.emit('MAP_FLY_TO', { lat, lng });
                }, 1000);
            }
        } 
        // Mode B: Cache Code Lookup
        else if (codeStr) {
            setLoading(true);
            cacheService.getCacheDetail(codeStr).then(cache => {
                setLoading(false);
                if (cache) {
                    // Add to map store
                    setCaches(prev => {
                         if (prev.some(c => c.code === cache.code)) return prev;
                         return [...prev, cache];
                    });
                    
                    // Fly to cache
                    setTimeout(() => {
                         eventService.emit('MAP_FLY_TO', { 
                            lat: cache.latitude, 
                            lng: cache.longitude, 
                            code: cache.code 
                         });
                         showToast(`Loaded cache ${cache.code}`);
                    }, 1000);
                } else {
                    showToast(`Cache ${codeStr} not found.`);
                }
            });
        }
        // Mode C: Temporary Pin (pin=lat,lng,note)
        else if (pinStr) {
            const parts = pinStr.split(',');
            if (parts.length >= 2) {
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                const note = parts.slice(2).join(','); // Re-join description
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    // 1. Fly to location first (Map moves)
                    eventService.emit('MAP_FLY_TO', { lat, lng });
                    
                    // 2. Wait for fly animation (1.6s) to finish, THEN drop pin
                    setTimeout(() => {
                        const id = addTempPin(lat, lng, note);
                        
                        // 3. Open Popup for the newly created pin (Using same coords ensures popup location is correct)
                        // Allow small tick for React state update to propagate to PinLayer
                        setTimeout(() => {
                            eventService.emit('MAP_FLY_TO', { lat, lng, pinId: id });
                            showToast('Temporary pin added');
                        }, 50);
                    }, 1600);
                }
            }
        }
    };

    // Global Helpers assignment
    (window as any).openApp = (type: any, lat: any, lng: any, name: any, code: any) => 
        openAppScheme(lat, lng, name, code, type);

    // Run Init
    initApp();

    return () => { (window as any).openApp = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. Event Listeners Effect ---
  useEffect(() => {
      const handleMapIdle = async (evt: MapMoveEvent) => {
          mapCenterRef.current = { lat: evt.lat, lng: evt.lng };
          // Explore Logic
          if (isExploreMode && evt.zoom > 10) {
              await performExploreSearch(evt.lat, evt.lng);
          }
      };

      const handleCacheSelected = (cache: Geocache) => {
          setDrawerOpen(false);
          // Add to map data if missing
          setCaches((prev) => {
              if (prev.some(c => c.code === cache.code)) return prev;
              return [...prev, cache];
          });
          
          setTimeout(() => {
              eventService.emit('MAP_FLY_TO', { 
                  lat: cache.latitude, 
                  lng: cache.longitude, 
                  code: cache.code 
              });
          }, 300);
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

  // --- Logic Functions ---

  const performFetch = async (type: string) => {
    setLoading(true);
    showToast('Updating map data...');
    try {
      const data = type === 'all' 
          ? await cacheService.syncAllData() 
          : await cacheService.fetchData(type);
      setCaches(data);
      
      if (type === 'all') {
          showToast('Data download complete');
      } else {
          showToast(`Found ${data.length} caches`);
      }
      
      if (type === 'by_today') cacheService.getCacheStatus();
    } catch (err: any) {
      console.error(err);
      showToast('Error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncConfirm = async (shouldUpdate: boolean) => {
      if (shouldUpdate) {
          performFetch('all');
      } 
  };

  const fetchData = async (type: string) => {
    setDrawerOpen(false);
    setIsExploreMode(false);

    if (type === 'all') {
        if (offlineMeta.count > 0) {
            NiceModal.show(SyncConfirmModal, { onConfirm: handleSyncConfirm });
            return;
        }
        if (!confirm('Download full database from server? (This may take a while)')) return;
        
        cacheService.syncAllData().catch(e => showToast(e.message));
        return; 
    }
    performFetch(type);
  };

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
              if (uniqueNew.length === 0) return prev;
              return [...prev, ...uniqueNew];
          });
      } catch (e) {
          console.error("Explore search failed", e);
      }
  };

  const handleToggleExplore = () => {
      const isSyncing = syncStatus === 'loading cache' || syncStatus === 'processing cache data';
      if (isSyncing) {
          showToast("geocache data is downloading for local cache. please wait...");
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
      handleLoadGpx
  };
};
