import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { useMapContext } from '../context';
import { GCData } from '../types';

interface MarkerTemplateProps {
    matchType: string | ((data: GCData) => boolean);
    conflictRadius?: number;
    renderIcon: (data: GCData) => React.ReactElement | string;
    renderPopup?: (data: GCData) => React.ReactElement;
    onMarkerClick?: (data: GCData) => void;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
}

export const MarkerTemplate: React.FC<MarkerTemplateProps> = ({
    matchType,
    conflictRadius,
    renderIcon,
    renderPopup,
    onMarkerClick,
    iconSize = [36, 36],
    iconAnchor = [18, 18],
    popupAnchor = [0, -18]
}) => {
    const { map, data, clusterOptions, clusterEnabled = true } = useMapContext();
    const clusterGroupRef = useRef<any>(null);
    const circlesLayerRef = useRef<any>(null);
    const popupRootsRef = useRef<Map<string, Root>>(new Map());

    useEffect(() => {
        if (!map) return;

        // @ts-ignore
        const L = window.L;
        if (!L) return;

        // 1. 创建 marker 容器（聚合模式 or 普通图层）
        let markerContainer: any;
        if (clusterEnabled && L.markerClusterGroup) {
            markerContainer = L.markerClusterGroup({
                maxClusterRadius: clusterOptions?.maxClusterRadius || 50,
                disableClusteringAtZoom: clusterOptions?.disableClusteringAtZoom,
                iconCreateFunction: clusterOptions?.iconCreateFunction,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            });
        } else {
            markerContainer = L.layerGroup();
        }
        clusterGroupRef.current = markerContainer;
        map.addLayer(markerContainer);

        const circlesLayer = L.layerGroup();
        circlesLayerRef.current = circlesLayer;
        map.addLayer(circlesLayer);

        const clusterGroup = markerContainer;
        const circlesLayer2 = circlesLayer;

        // 2. 过滤属于当前 Template 的数据
        const filteredData = data.filter(item => 
            typeof matchType === 'function' ? matchType(item) : item.type === matchType
        );

        // 3. 批量生成 Marker
        const markers = filteredData.map(item => {
            // 图标渲染：支持直接返回 HTML 字符串或 React 组件 (转为静态 HTML 以保证极致性能)
            const iconContent = renderIcon(item);
            const html = typeof iconContent === 'string' ? iconContent : renderToString(iconContent);
            
            const customIcon = L.divIcon({
                html,
                className: 'tftc-custom-icon bg-transparent border-none', // 清除 Leaflet 默认样式
                iconSize,
                iconAnchor,
                popupAnchor
            });

            const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });

            // 绘制冲突圈
            if (conflictRadius && conflictRadius > 0 && item.geocacheType === 2) {
                const circle = L.circle([item.latitude, item.longitude], {
                    radius: conflictRadius,
                    stroke: true,
                    color: '#4CAF50',
                    weight: 1,
                    fillOpacity: 0.1,
                    interactive: false
                });
                (marker as any).circle = circle;
                
                // 只有当 marker 实际显示在地图上时（未被聚合），才添加冲突圈
                marker.on('add', () => {
                    circlesLayer2.addLayer(circle);
                });
                marker.on('remove', () => {
                    circlesLayer2.removeLayer(circle);
                });
            }

            // 事件绑定
            if (onMarkerClick) {
                marker.on('click', () => onMarkerClick(item));
            }

            // 弹窗渲染：使用 React 18 createRoot 动态挂载，支持复杂的交互组件
            if (renderPopup) {
                marker.bindPopup(() => {
                    const container = document.createElement('div');
                    const root = createRoot(container);
                    root.render(renderPopup(item));
                    
                    // 记录 root 实例，防止内存泄漏
                    popupRootsRef.current.set(item.id, root);
                    return container;
                });

                // 弹窗关闭时卸载 React 组件
                marker.on('popupclose', () => {
                    const root = popupRootsRef.current.get(item.id);
                    if (root) {
                        setTimeout(() => {
                            root.unmount();
                            popupRootsRef.current.delete(item.id);
                        }, 250); // 等待关闭动画完成
                    }
                });
            }

            return marker;
        });

        if (clusterEnabled && L.markerClusterGroup) {
            clusterGroup.addLayers(markers);
        } else {
            markers.forEach((m: any) => clusterGroup.addLayer(m));
        }

        // 卸载清理
        return () => {
            map.removeLayer(markerContainer);
            map.removeLayer(circlesLayer);
            clusterGroupRef.current = null;
            circlesLayerRef.current = null;
            popupRootsRef.current.forEach(root => root.unmount());
            popupRootsRef.current.clear();
        };
    }, [map, data, clusterEnabled, matchType, renderIcon, renderPopup, onMarkerClick, conflictRadius]);

    // 控制冲突圈的显示与隐藏 (只在 zoom >= 14 时显示)
    useEffect(() => {
        if (!map || !circlesLayerRef.current) return;
        
        const updateVisibility = () => {
            if (conflictRadius && conflictRadius > 0 && map.getZoom() >= 14) {
                if (!map.hasLayer(circlesLayerRef.current)) {
                    map.addLayer(circlesLayerRef.current);
                }
            } else {
                if (map.hasLayer(circlesLayerRef.current)) {
                    map.removeLayer(circlesLayerRef.current);
                }
            }
        };

        map.on('zoomend', updateVisibility);
        updateVisibility(); // 初始化检查

        return () => {
            map.off('zoomend', updateVisibility);
        };
    }, [map, conflictRadius]);

    return null;
};
