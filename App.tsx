
import React, { useState } from 'react';
import NiceModal from '@ebay/nice-modal-react';
import TFTCMap from './components/Map/TFTCMap';
import MapControls from './components/MapControl/MapControls';
import AppDrawer from './components/AppDrawer/AppDrawer';
import GlobalOverlays from './components/GlobalOverlays';
import { useMapStore } from './stores/useMapStore';
import { useSyncStore } from './stores/useSyncStore';
import { useAppController } from './hooks/useAppController';
import { eventService } from './services/eventService';
import CacheManagerModal from './components/AppDrawer/Modals/CacheManagerModal';

const App: React.FC = () => {
  // 1. Global State from Zustand
  const { 
      caches, userPins, gpxFiles, mapType, settings, 
      drawerOpen, setDrawerOpen, showLayerMenu, setShowLayerMenu,
      isLocating, isFollowing, setIsLocating, setIsFollowing, setMapType,
      addUserPin, deleteUserPin, updateUserPin, toggleSetting, setExploreRadius,
      deleteGpx, setCaches, loadGpxList
  } = useMapStore();

  const { status: syncStatus, offlineMeta } = useSyncStore();
  const isSyncing = syncStatus === 'loading cache' || syncStatus === 'processing cache data';

  // 2. Logic Controller (Effects & Complex handlers)
  const {
      isExploreMode,
      fetchData,
      handleToggleExplore,
      handleLoadGpx
  } = useAppController();

  // 3. Local UI State
  const [activeTab, setActiveTab] = useState<'data' | 'tools' | 'settings' | 'links' | 'about'>('data');

  // 4. Map Event Handlers (UI -> Service)
  const handleMapMoveStart = () => {
      eventService.emit('MAP_DRAG_START', undefined);
      if (isFollowing) {
          setIsFollowing(false);
      }
  };
  const handleMapMoveEnd = (lat: number, lng: number, zoom: number) => {
      eventService.debounceEmit('MAP_IDLE', { lat, lng, zoom }, 400);
  };

  const handleToggleLocate = () => {
      if (!isLocating) {
          setIsLocating(true);
      } else if (!isFollowing) {
          setIsFollowing(true);
      } else {
          setIsLocating(false);
      }
  };

  const handleOpenCacheManager = () => {
      setDrawerOpen(false);
      NiceModal.show(CacheManagerModal, {
          onCacheCleared: () => {
              setCaches([]);
              loadGpxList();
          }
      });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans bg-cream">
      
      <TFTCMap 
        mapType={mapType}
        caches={caches}
        userPins={userPins}
        showCircles={settings.showCircles}
        clusterEnabled={settings.clusterEnabled}
        customPinsEnabled={settings.customPinsEnabled}
        onPinAdd={addUserPin}
        onPinDelete={deleteUserPin}
        onPinUpdate={updateUserPin}
        isLocating={isLocating}
        onLocationFound={() => {}} // Could be handled by store if needed
        onMapMoveStart={handleMapMoveStart}
        onMapMoveEnd={handleMapMoveEnd}
      />

      <MapControls 
        mapType={mapType}
        onSetMapType={setMapType}
        onOpenDrawer={() => setDrawerOpen(true)}
        isLocating={isLocating}
        isFollowing={isFollowing}
        onToggleLocate={handleToggleLocate}
        showLayerMenu={showLayerMenu}
        setShowLayerMenu={setShowLayerMenu}
        showExplore={offlineMeta.count > 0 || isSyncing}
        isExploreMode={isExploreMode}
        onToggleExplore={handleToggleExplore}
        isSyncing={isSyncing}
      />

      <AppDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onFetchData={fetchData}
        settings={{ ...settings, mapType }}
        onToggleSetting={toggleSetting}
        onChangeRadius={setExploreRadius}
        gpxFiles={gpxFiles}
        onLoadGpx={handleLoadGpx}
        onDeleteGpx={deleteGpx}
        onOpenCacheManager={handleOpenCacheManager}
      />

      <GlobalOverlays />

    </div>
  );
};

export default App;
