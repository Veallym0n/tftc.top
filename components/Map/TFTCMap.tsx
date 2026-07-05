import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GCMap, MapLayer, MarkerTemplate, GCData, IGCData, GCMapRef, UserLocation } from './leaflet';
import { Geocache, UserPin, MapType } from '../../types';
import { getConfig } from '../../config';
import { wgs2gcj, gcj2wgs } from '../../utils/geo';
import { useMapStore } from '../../stores/useMapStore';
import Popup from './Popup';
import PinPopup from './PinPopup';


interface TFTCMapProps {
  mapType: MapType;
  caches: Geocache[];
  userPins: UserPin[];
  showCircles: boolean;
  clusterEnabled?: boolean;
  onPinAdd: (lat: number, lng: number) => void;
  onPinDelete: (id: number) => void;
  onPinUpdate: (id: number, note: string) => void;
  isLocating: boolean;
  onLocationFound: (lat: number, lng: number) => void;
  onMapMoveStart?: () => void;
  onMapMoveEnd: (lat: number, lng: number, zoom: number) => void;
  customPinsEnabled: boolean;
}

const PIN_ICON = (
  <div className="marker-pin flex items-center justify-center w-8 h-8 bg-memphis-pink border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.45)] hover:scale-110 transition-transform cursor-pointer">
    <div className="w-2.5 h-2.5 bg-white rounded-full border border-black"></div>
  </div>
);

const TFTCMap: React.FC<TFTCMapProps> = ({
  mapType,
  caches,
  userPins,
  showCircles,
  clusterEnabled = true,
  onPinAdd,
  onPinDelete,
  onPinUpdate,
  isLocating,
  onLocationFound,
  onMapMoveStart,
  onMapMoveEnd,
  customPinsEnabled
}) => {
  const mapRef = useRef<GCMapRef>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const layerConfig = getConfig().mapLayers[mapType] || getConfig().mapLayers['gaode'];
  const isGCJ = layerConfig.std === 'gcj02';

  // Long press to add pin (inlined from useMapLongPress)
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    if (!mapInstance) return;
    const container = mapInstance.getContainer();
    const getClientCoords = (e: MouseEvent | TouchEvent) => {
      if (window.TouchEvent && e instanceof TouchEvent) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      const me = e as MouseEvent;
      return { x: me.clientX, y: me.clientY };
    };
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!customPinsEnabled) return;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (mapInstance.getZoom() < getConfig().pinCreationMinZoom) return;
      if (e instanceof MouseEvent && e.button !== 0) return;
      longPressTriggeredRef.current = false;
      longPressStartRef.current = getClientCoords(e);
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        try {
          const cp = mapInstance.mouseEventToContainerPoint({ clientX: longPressStartRef.current!.x, clientY: longPressStartRef.current!.y });
          const latlng = mapInstance.containerPointToLatLng(cp);
          if (latlng) {
            if (navigator.vibrate) navigator.vibrate(50);
            let { lat, lng } = latlng;
            const cfg = getConfig().mapLayers[mapType] || getConfig().mapLayers['gaode'];
            if (cfg.std === 'gcj02') [lat, lng] = gcj2wgs(lat, lng);
            onPinAdd(lat, lng);
          }
        } catch (err) { console.error('Long press coord error', err); }
      }, 800);
    };
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!longPressTimerRef.current || !longPressStartRef.current) return;
      const c = getClientCoords(e);
      if (Math.abs(c.x - longPressStartRef.current.x) > 10 || Math.abs(c.y - longPressStartRef.current.y) > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
      if (longPressTriggeredRef.current && e.cancelable) e.preventDefault();
      longPressStartRef.current = null;
      longPressTriggeredRef.current = false;
    };
    const handleContext = (e: Event) => { if (customPinsEnabled) e.preventDefault(); };
    container.addEventListener('mousedown', handleStart);
    container.addEventListener('touchstart', handleStart, { passive: true });
    container.addEventListener('mousemove', handleMove);
    container.addEventListener('touchmove', handleMove, { passive: true });
    container.addEventListener('mouseup', handleEnd);
    container.addEventListener('mouseleave', handleEnd);
    container.addEventListener('touchend', handleEnd);
    container.addEventListener('touchcancel', handleEnd);
    container.addEventListener('contextmenu', handleContext);
    return () => {
      container.removeEventListener('mousedown', handleStart);
      container.removeEventListener('touchstart', handleStart);
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('touchmove', handleMove);
      container.removeEventListener('mouseup', handleEnd);
      container.removeEventListener('mouseleave', handleEnd);
      container.removeEventListener('touchend', handleEnd);
      container.removeEventListener('touchcancel', handleEnd);
      container.removeEventListener('contextmenu', handleContext);
    };
  }, [mapInstance, customPinsEnabled, mapType, onPinAdd]);

  // 1. Data Mapping (Memoized)
  const gcDataList: IGCData[] = useMemo(() => {
    return caches.map(c => {
      let lat = c.latitude;
      let lng = c.longitude;
      if (isGCJ) {
        [lat, lng] = wgs2gcj(lat, lng);
      }
      console.log(`Cache ${c.code}: original (${c.latitude}, ${c.longitude}) -> display (${lat}, ${lng})`);
      return {
        ...c,
        id: c.code,
        type: 'gc',
        latitude: lat,
        longitude: lng,
        originalLat: c.latitude,
        originalLng: c.longitude
      };
    });
  }, [caches, isGCJ]);

  // 2. Map Events
  const handleMapReady = useCallback((map: any) => {
    setMapInstance(map);
    map.on('dragstart', () => onMapMoveStart && onMapMoveStart());
    map.on('moveend', () => {
      const center = map.getCenter();
      onMapMoveEnd(center.lat, center.lng, map.getZoom());
    });
  }, [onMapMoveStart, onMapMoveEnd]);

  // 3. FlyTo via store (replaces MAP_FLY_TO event)
  const flySeq = useMapStore((s) => s.flySeq);
  const flyTarget = useMapStore((s) => s.flyTarget);
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    let { lat, lng } = flyTarget;
    if (isGCJ) {
      [lat, lng] = wgs2gcj(lat, lng);
    }
    mapRef.current.setView(lat, lng, flyTarget.zoom ?? 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flySeq]);

  const renderIcon = useCallback((cache: IGCData) => {
    const iconUrl = getConfig().iconUrlTemplate.replace('{n}', String(cache.geocacheType));
    return (
      <div className="marker-drop transition-transform active:scale-90 origin-bottom">
        <img src={iconUrl} className="w-[36px] h-[36px] drop-shadow-md" onError={(e) => e.currentTarget.style.display='none'}/>
      </div>
    );
  }, []);

  const renderPopup = useCallback((cache: IGCData) => (
    <Popup cache={cache as any} lat={cache.originalLat} lng={cache.originalLng} />
  ), []);

  const clusterIconCreateFunction = useCallback((cluster: any) => {
    const count = cluster.getChildCount();
    let tier = { max: Infinity, bg: '#FF90E8', color: '#FFFFFF' };
    if (count < 10) tier = { max: 10, bg: '#4ECDC4', color: '#FFFFFF' };
    else if (count < 50) tier = { max: 50, bg: '#FFC900', color: '#1E293B' };

    const styleString = `
        width: 40px; 
        height: 40px; 
        background-color: ${tier.bg}; 
        color: ${tier.color}; 
        border: 2px solid #1E293B; 
        border-radius: 50%; 
        box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.45); 
        font-size: 14px; 
        font-weight: 900;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: transform 0.2s;
    `.replace(/\n/g, '');

    // @ts-ignore
    return window.L.divIcon({
      html: `<div style="${styleString}">${count}</div>`,
      className: 'cluster-memphis',
      iconSize: [40, 40]
    });
  }, []);

  const clusterOptions = useMemo(() => ({
    maxClusterRadius: 50,
    disableClusteringAtZoom: 15,
    iconCreateFunction: clusterIconCreateFunction
  }), [clusterIconCreateFunction]);

  const userPinsElements = useMemo(() => {
    return userPins.map(pin => {
      let lat = pin.lat;
      let lng = pin.lng;
      if (isGCJ) {
        [lat, lng] = wgs2gcj(lat, lng);
      }
      return (
        <GCData
          key={pin.id}
          data={{ id: String(pin.id), latitude: lat, longitude: lng, type: 'pin' }}
          conflictRadius={showCircles ? 161 : 0}
          iconSize={[32, 32]}
          iconAnchor={[16, 16]}
          icon={PIN_ICON}
          popup={
            <PinPopup 
              pin={pin} 
              onDelete={() => onPinDelete(pin.id)} 
              onUpdate={(note) => onPinUpdate(pin.id, note)} 
            />
          }
        />
      );
    });
  }, [userPins, isGCJ, showCircles, onPinDelete, onPinUpdate]);

  return (
    <GCMap 
      ref={mapRef}
      data={gcDataList} 
      center={[35, 104]} 
      zoom={4}
      onMapReady={handleMapReady}
      clusterOptions={clusterOptions}
      clusterEnabled={clusterEnabled}
    >
      <MapLayer 
        name={layerConfig.name} 
        url={layerConfig.url} 
        isDefault 
        maxZoom={layerConfig.maxZoom ?? 18}
        subdomains={layerConfig.subdomains}
      />

      {/* Geocaches Template */}
      <MarkerTemplate
        matchType="gc"
        conflictRadius={showCircles ? 161 : 0}
        renderIcon={renderIcon}
        renderPopup={renderPopup}
      />

      {/* User Pins (Rendered individually for better state management) */}
      {userPinsElements}

      {/* User Location */}
      <UserLocation 
        isLocating={isLocating}
        onLocationFound={(lat, lng) => {
          onLocationFound(lat, lng);
          // Pan to user location when found
          let displayLat = lat;
          let displayLng = lng;
          if (isGCJ) {
            [displayLat, displayLng] = wgs2gcj(lat, lng);
          }
          mapRef.current?.panTo(displayLat, displayLng);
          mapRef.current?.setZoom(15);
        }}
        transformCoords={isGCJ ? wgs2gcj : undefined}
      />
    </GCMap>
  );
};

export default TFTCMap;
