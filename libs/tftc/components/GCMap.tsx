import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MapContext } from '../context';
import { MapErrorBoundary } from '../ErrorBoundary';
import { GCMapProps } from '../types';
import { getConstants } from '../constants';

export interface GCMapRef {
    panTo: (lat: number, lng: number) => void;
    setZoom: (level: number) => void;
    getMapInstance: () => any;
}

const GCMapInternal = forwardRef<GCMapRef, GCMapProps>(({
    data,
    center,
    zoom,
    clusterOptions,
    className = '',
    children,
    onMapReady
}, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const constants = getConstants();

    useEffect(() => {
        if (!mapContainerRef.current || mapInstance) return;

        // @ts-ignore
        const L = window.L;
        if (!L) {
            console.error("Leaflet (L) is not available globally.");
            return;
        }

        const initialCenter = center || constants.DEFAULT_CENTER;
        const initialZoom = zoom || constants.DEFAULT_ZOOM;

        const map = L.map(mapContainerRef.current, {
            center: initialCenter,
            zoom: initialZoom,
            zoomControl: false, // 禁用默认控件，方便后续自定义 Memphis 风格控件
            attributionControl: false
        });

        setMapInstance(map);
        if (onMapReady) onMapReady(map);

        return () => {
            map.remove();
            setMapInstance(null);
        };
    }, []);

    // 暴露命令式方法给父组件
    useImperativeHandle(ref, () => ({
        panTo: (lat: number, lng: number) => {
            if (mapInstance) mapInstance.panTo([lat, lng]);
        },
        setZoom: (level: number) => {
            if (mapInstance) mapInstance.setZoom(level);
        },
        getMapInstance: () => mapInstance
    }));

    return (
        <MapContext.Provider value={{ map: mapInstance, data, clusterOptions }}>
            <div ref={mapContainerRef} className={`w-full h-full relative z-0 ${className}`}>
                {mapInstance && children}
            </div>
        </MapContext.Provider>
    );
});

// 包装 ErrorBoundary，彻底消灭深层 try-catch
export const GCMap = forwardRef<GCMapRef, GCMapProps>((props, ref) => (
    <MapErrorBoundary>
        <GCMapInternal {...props} ref={ref} />
    </MapErrorBoundary>
));
