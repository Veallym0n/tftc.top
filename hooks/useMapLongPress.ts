import { useEffect, useRef } from 'react';
import { PIN_CREATION_MIN_ZOOM, MAP_LAYERS } from '../constants';
import { gcj2wgs } from '../utils/geo';
import { MapType } from '../types';

interface UseMapLongPressProps {
    map: any;
    isEnabled: boolean;
    mapType: MapType;
    onLongPress: (lat: number, lng: number) => void;
}

export const useMapLongPress = ({ map, isEnabled, mapType, onLongPress }: UseMapLongPressProps) => {
    const timerRef = useRef<number | null>(null);
    const startPosRef = useRef<{ x: number, y: number } | null>(null);
    const isTriggeredRef = useRef(false);

    useEffect(() => {
        if (!map) return;
        const container = map.getContainer();

        const getClientCoords = (e: MouseEvent | TouchEvent) => {
            if (window.TouchEvent && e instanceof TouchEvent) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            const me = e as MouseEvent;
            return { x: me.clientX, y: me.clientY };
        };

        const handleStart = (e: MouseEvent | TouchEvent) => {
            if (!isEnabled) return;
            if (timerRef.current) clearTimeout(timerRef.current);
            if (map.getZoom() < PIN_CREATION_MIN_ZOOM) return;
            if (e instanceof MouseEvent && e.button !== 0) return;

            isTriggeredRef.current = false;
            startPosRef.current = getClientCoords(e);

            timerRef.current = window.setTimeout(() => {
                isTriggeredRef.current = true;
                try {
                    const containerPoint = map.mouseEventToContainerPoint({ clientX: startPosRef.current!.x, clientY: startPosRef.current!.y });
                    const latlng = map.containerPointToLatLng(containerPoint);
                    if (latlng) {
                        if (navigator.vibrate) navigator.vibrate(50);
                        let { lat, lng } = latlng;
                        const layerConfig = MAP_LAYERS[mapType] || MAP_LAYERS['gaode'];
                        if (layerConfig.std === 'gcj02') {
                            [lat, lng] = gcj2wgs(lat, lng);
                        }
                        onLongPress(lat, lng);
                    }
                } catch (err) {
                    console.error("Long press coord error", err);
                }
            }, 800);
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!timerRef.current || !startPosRef.current) return;
            const coords = getClientCoords(e);
            const dx = Math.abs(coords.x - startPosRef.current.x);
            const dy = Math.abs(coords.y - startPosRef.current.y);
            if (dx > 10 || dy > 10) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        const handleEnd = (e: MouseEvent | TouchEvent) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (isTriggeredRef.current && e.cancelable) e.preventDefault();
            startPosRef.current = null;
            isTriggeredRef.current = false;
        };

        const handleContext = (e: Event) => {
            if (isEnabled) e.preventDefault();
        };

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
    }, [map, isEnabled, mapType, onLongPress]);
};
