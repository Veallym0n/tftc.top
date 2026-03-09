import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { useMapContext } from '../context';
import { GCData as IGCData } from '../types';

interface GCDataProps {
    data: IGCData;
    icon?: React.ReactElement | string;
    popup?: React.ReactElement;
    hide?: boolean;
    conflictRadius?: number; // 原本的 cycle
    zIndexOffset?: number;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
}

/**
 * 声明式的单点组件 (适用于少量、独立的点位，如用户位置、临时图钉)
 * 注意：海量数据请使用 <GCMap data={...}> 配合 <MarkerTemplate>，以获得最佳性能。
 */
export const GCData: React.FC<GCDataProps> = ({
    data,
    icon,
    popup,
    hide = false,
    conflictRadius,
    zIndexOffset = 0,
    iconSize = [36, 36],
    iconAnchor = [18, 18],
    popupAnchor = [0, -18]
}) => {
    const { map } = useMapContext();
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const popupRootRef = useRef<Root | null>(null);

    useEffect(() => {
        if (!map || hide) {
            if (markerRef.current) map?.removeLayer(markerRef.current);
            if (circleRef.current) map?.removeLayer(circleRef.current);
            return;
        }

        // @ts-ignore
        const L = window.L;
        if (!L) return;

        // 1. 渲染图标
        let customIcon;
        if (icon) {
            const html = typeof icon === 'string' ? icon : renderToString(icon);
            customIcon = L.divIcon({
                html,
                className: 'tftc-custom-icon bg-transparent border-none',
                iconSize,
                iconAnchor,
                popupAnchor
            });
        } else {
            customIcon = new L.Icon.Default();
        }

        // 2. 创建 Marker
        if (!markerRef.current) {
            markerRef.current = L.marker([data.latitude, data.longitude], { 
                icon: customIcon,
                zIndexOffset 
            });
            markerRef.current.addTo(map);
        } else {
            markerRef.current.setLatLng([data.latitude, data.longitude]);
            markerRef.current.setIcon(customIcon);
            if (!map.hasLayer(markerRef.current)) {
                markerRef.current.addTo(map);
            }
        }

        // 3. 绑定弹窗 (动态挂载)
        if (popup) {
            markerRef.current.bindPopup(() => {
                const container = document.createElement('div');
                popupRootRef.current = createRoot(container);
                popupRootRef.current.render(popup);
                return container;
            });

            markerRef.current.on('popupclose', () => {
                if (popupRootRef.current) {
                    setTimeout(() => {
                        popupRootRef.current?.unmount();
                        popupRootRef.current = null;
                    }, 250);
                }
            });
        } else {
            markerRef.current.unbindPopup();
        }

        // 4. 绘制冲突圈 (cycle)
        const updateCircleVisibility = () => {
            if (conflictRadius && conflictRadius > 0 && map.getZoom() >= 14) {
                if (!circleRef.current) {
                    circleRef.current = L.circle([data.latitude, data.longitude], {
                        radius: conflictRadius,
                        color: '#FF90E8', // Memphis Pink
                        weight: 2,
                        fillColor: '#FF90E8',
                        fillOpacity: 0.1,
                        dashArray: '5, 5'
                    });
                    circleRef.current.addTo(map);
                } else {
                    circleRef.current.setLatLng([data.latitude, data.longitude]);
                    circleRef.current.setRadius(conflictRadius);
                    if (!map.hasLayer(circleRef.current)) {
                        circleRef.current.addTo(map);
                    }
                }
            } else if (circleRef.current) {
                map.removeLayer(circleRef.current);
            }
        };

        updateCircleVisibility();
        map.on('zoomend', updateCircleVisibility);

        return () => {
            if (markerRef.current) map.removeLayer(markerRef.current);
            if (circleRef.current) map.removeLayer(circleRef.current);
            if (popupRootRef.current) popupRootRef.current.unmount();
            map.off('zoomend', updateCircleVisibility);
        };
    }, [map, data.latitude, data.longitude, hide, icon, popup, conflictRadius, zIndexOffset]);

    return null; // 纯逻辑组件，不渲染 DOM
};
