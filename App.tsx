import React, { useState, useEffect } from 'react';
import NiceModal from '@ebay/nice-modal-react';
import TFTCMap from './components/Map/TFTCMap';
import MapControls from './components/controls/MapControls';
import AppDrawer from './components/drawer/AppDrawer';
import GlobalOverlays from './components/GlobalOverlays';
import SyncConfirmModal from './components/drawer/Modals/SyncConfirmModal';
import { useMapStore } from './stores/useMapStore';
import { useAppStore } from './stores/useAppStore';
import { useCacheStore } from './stores/useCacheStore';
import { getConfig } from './config';
import { useIOSInputScrollLock } from './hooks/useIOSInputScrollLock';
import { useSearch } from './hooks/useSearch';
import { deepLinkService } from './services/deeplink';
import { loadConfig } from './config';
import { openAppScheme } from './utils/geo';

// Detect if running inside an iframe (once, outside component)
const isInIframe = window.self !== window.top;

// Detect ?cluster=false URL param (once, outside component)
const urlClusterDisabled = new URLSearchParams(window.location.search).get('cluster') === 'false';

const App: React.FC = () => {
  useIOSInputScrollLock();

  /* ---- Stores ---- */
  const map = useMapStore();
  const app = useAppStore();
  const cache = useCacheStore();

  /* ---- Search (component-local UI state) ---- */
  const search = useSearch(cache.caches);

  /* ---- Derived ---- */
  const effectiveClusterEnabled = urlClusterDisabled ? false : Boolean(app.settings.clusterEnabled);
  const isSyncing = cache.syncStatus === 'loading cache' || cache.syncStatus === 'processing cache data';
  const [activeTab, setActiveTab] = useState<'data' | 'tools' | 'settings' | 'links' | 'about'>('data');

  /* ---- Init ---- */
  useEffect(() => {
    const init = async () => {
      await loadConfig();
      await Promise.all([
        app.initSettings(),
        cache.loadUserPins(),
        cache.loadGpxList(),
      ]);

      const hasDeepLink = deepLinkService.hasDeepLink();
      if (!hasDeepLink) {
        app.setLoading(true);
        try {
          await cache.fetchByType(getConfig().defaultEndpoint);
        } catch (e) {
          console.error('Default data load failed:', e);
          app.showToast('数据加载失败，请检查网络');
        } finally {
          app.setLoading(false);
        }
      }

      await deepLinkService.process({
        setCaches: cache.setCaches,
        setLoading: app.setLoading,
        showToast: app.showToast,
        addTempPin: cache.addTempPin,
        flyTo: (lat, lng, opts) => map.flyTo(lat, lng, opts?.zoom),
      });
    };
    (window as any).openApp = (type: any, lat: any, lng: any, name: any, code: any) =>
      openAppScheme(lat, lng, name, code, type);
    init();
    return () => { (window as any).openApp = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Data entry (modal coordination — stays in App) ---- */
  const handleFetchData = (type: string) => {
    app.setDrawerOpen(false);
    map.setExploreMode(false);
    if (type === 'all') {
      if (cache.offlineMeta.count > 0) {
        NiceModal.show(SyncConfirmModal, {
          onConfirm: async (shouldUpdate: boolean) => {
            app.setDrawerOpen(false);
            app.setLoading(true);
            try {
              if (shouldUpdate) await cache.syncAllData();
              else await cache.loadOfflineCaches();
            } catch (e: any) {
              app.showToast('错误: ' + (e.message || e));
            } finally {
              app.setLoading(false);
            }
          },
        });
        return;
      }
      if (!confirm('从服务器下载完整数据库？（可能需要一段时间）')) return;
      cache.syncAllData();
      return;
    }
    app.setLoading(true);
    cache.fetchByType(type).finally(() => app.setLoading(false));
  };

  const handleLoadGpx = (gpx: import('./types').StoredGpx) => {
    app.setDrawerOpen(false);
    map.setExploreMode(false);
    cache.loadGpxCaches(gpx);
  };

  /* ---- Map events ---- */
  const handleMapMoveStart = () => {
    if (map.isFollowing) map.setIsFollowing(false);
  };

  const handleToggleLocate = () => {
    if (!map.isLocating) map.setIsLocating(true);
    else if (!map.isFollowing) map.setIsFollowing(true);
    else map.setIsLocating(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans bg-cream">
      <TFTCMap
        mapType={map.mapType}
        caches={search.displayCaches}
        userPins={cache.userPins}
        showCircles={Boolean(app.settings.showCircles)}
        clusterEnabled={effectiveClusterEnabled}
        customPinsEnabled={Boolean(app.settings.customPinsEnabled)}
        onPinAdd={cache.addUserPin}
        onPinDelete={cache.deleteUserPin}
        onPinUpdate={cache.updateUserPin}
        isLocating={map.isLocating}
        onLocationFound={() => {}}
        onMapMoveStart={handleMapMoveStart}
        onMapMoveEnd={map.onMapMoveEnd}
      />

      {!isInIframe && (
        <MapControls
          mapType={map.mapType}
          onSetMapType={map.setMapType}
          onOpenDrawer={() => app.setDrawerOpen(true)}
          isLocating={map.isLocating}
          isFollowing={map.isFollowing}
          onToggleLocate={handleToggleLocate}
          showLayerMenu={app.showLayerMenu}
          setShowLayerMenu={app.setShowLayerMenu}
          showExplore={cache.offlineMeta.count > 0 || isSyncing}
          isExploreMode={map.isExploreMode}
          onToggleExplore={map.toggleExplore}
          isSyncing={isSyncing}
          isSearchOpen={search.searchOpen}
          onToggleSearch={() => search.searchOpen ? search.closeSearch() : search.openSearch()}
          query={search.searchQuery}
          onQueryChange={search.setSearchQuery}
          onGlobalSearch={search.runGlobalSearch}
          isGlobalSearching={search.isGlobalSearching}
          resultCount={search.resultCount}
          onCloseSearch={search.closeSearch}
        />
      )}

      <AppDrawer
        isOpen={app.drawerOpen}
        onClose={() => app.setDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onFetchData={handleFetchData}
        settings={{ ...app.settings, mapType: map.mapType }}
        onToggleSetting={app.toggleSetting}
        onChangeRadius={app.setExploreRadius}
        gpxFiles={cache.gpxFiles}
        onLoadGpx={handleLoadGpx}
        onDeleteGpx={cache.deleteGpx}
      />

      <GlobalOverlays />
    </div>
  );
};

export default App;
