import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GCMap, MapLayer, MarkerTemplate, GCData, IGCData, GCMapRef, UserLocation } from '../../libs/tftc';
import { Geocache, UserPin, MapType, MapFlyToEvent } from '../../types';
import { MAP_LAYERS, ICON_URL_TEMPLATE } from '../../constants';
import { wgs2gcj } from '../../utils/geo';
import { eventService } from '../../services/eventService';
import Popup from './Popup';
import PinPopup from './PinPopup';
import { useMapLongPress } from '../../hooks/useMapLongPress';

interface TFTCMapProps {
  mapType: MapType;
  caches: Geocache[];
  userPins: UserPin[];
  showCircles: boolean;
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
  const layerConfig = MAP_LAYERS[mapType] || MAP_LAYERS['gaode'];
  const isGCJ = layerConfig.std === 'gcj02';

  // Custom Hooks
  useMapLongPress({
    map: mapInstance,
    isEnabled: customPinsEnabled,
    mapType,
    onLongPress: onPinAdd
  });

  // 1. Data Mapping (Memoized)
  const gcDataList: IGCData[] = useMemo(() => {
    return caches.map(c => {
      let lat = c.latitude;
      let lng = c.longitude;
      if (isGCJ) {
        [lat, lng] = wgs2gcj(lat, lng);
      }
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

  // 3. FlyTo Event — independent effect so isGCJ is always current
  useEffect(() => {
    const handleFlyTo = (evt: MapFlyToEvent) => {
      let { lat, lng } = evt;
      if (isGCJ) {
        [lat, lng] = wgs2gcj(lat, lng);
      }
      mapRef.current?.setView(lat, lng, evt.zoom ?? 16);
    };
    eventService.on('MAP_FLY_TO', handleFlyTo);
    return () => eventService.off('MAP_FLY_TO', handleFlyTo);
  }, [isGCJ]);

  const renderIcon = useCallback((cache: IGCData) => {
    const iconUrl = ICON_URL_TEMPLATE.replace('{n}', String(cache.geocacheType));
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
