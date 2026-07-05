import React, { useEffect, useState, useRef } from 'react';
import { GCData } from './GCData';
import { useMapStore } from '../../../stores/useMapStore';

interface UserLocationProps {
    isLocating: boolean;
    onLocationFound?: (lat: number, lng: number) => void;
    icon?: React.ReactElement | string;
    zIndexOffset?: number;
    // Optional coordinate transformer (e.g., wgs84 to gcj02)
    transformCoords?: (lat: number, lng: number) => [number, number];
    iconSize?: [number, number];
    iconAnchor?: [number, number];
}

export const UserLocation: React.FC<UserLocationProps> = ({
    isLocating,
    onLocationFound,
    icon,
    zIndexOffset = 1000,
    transformCoords,
    iconSize = [40, 40],
    iconAnchor = [20, 20]
}) => {
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const { isFollowing } = useMapStore();
    const isFollowingRef = useRef(isFollowing);
    const rawLocationRef = useRef<{ lat: number, lng: number } | null>(null);
    const onLocationFoundRef = useRef(onLocationFound);

    useEffect(() => {
        onLocationFoundRef.current = onLocationFound;
    }, [onLocationFound]);

    useEffect(() => {
        isFollowingRef.current = isFollowing;
        if (isFollowing && rawLocationRef.current && onLocationFoundRef.current) {
            onLocationFoundRef.current(rawLocationRef.current.lat, rawLocationRef.current.lng);
        }
    }, [isFollowing]);

    useEffect(() => {
        let watchId: number | null = null;
        if (isLocating) {
            if (!navigator.geolocation) {
                console.error('Geolocation not supported');
                return;
            }
            watchId = navigator.geolocation.watchPosition((pos) => {
                let { latitude, longitude } = pos.coords;
                rawLocationRef.current = { lat: latitude, lng: longitude };
                
                if (onLocationFoundRef.current && isFollowingRef.current) {
                    onLocationFoundRef.current(latitude, longitude);
                }

                if (transformCoords) {
                    [latitude, longitude] = transformCoords(latitude, longitude);
                }
                
                setUserLocation({ lat: latitude, lng: longitude });
            }, console.error, { enableHighAccuracy: true });
        } else {
            setUserLocation(null);
        }
        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [isLocating, transformCoords]);

    if (!userLocation) return null;

    const defaultIcon = (
        <div className="relative flex items-center justify-center w-10 h-10">
            <div className="user-pulse absolute w-full h-full bg-blue-400 rounded-full opacity-50"></div>
            <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full z-10 shadow-lg"></div>
        </div>
    );

    return (
        <GCData
            data={{ id: 'user-loc', latitude: userLocation.lat, longitude: userLocation.lng, type: 'user' }}
            zIndexOffset={zIndexOffset}
            icon={icon || defaultIcon}
            iconSize={iconSize}
            iconAnchor={iconAnchor}
        />
    );
};
