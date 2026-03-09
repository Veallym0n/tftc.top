import React, { useEffect } from 'react';
import { useMapContext } from '../context';

interface MapLayerProps {
    name: string;
    url: string;
    isDefault?: boolean;
    maxZoom?: number;
    attribution?: string;
    subdomains?: string | string[];
}

export const MapLayer: React.FC<MapLayerProps> = ({ url, isDefault, maxZoom = 18, attribution = '', subdomains }) => {
    const { map } = useMapContext();

    useEffect(() => {
        if (!map) return;
        
        // @ts-ignore - 假设 L 存在于全局 (index.html 引入)
        const L = window.L;
        if (!L) return;

        const options: any = { maxZoom, attribution };
        if (subdomains) {
            options.subdomains = subdomains;
        }

        const layer = L.tileLayer(url, options);
        
        if (isDefault) {
            layer.addTo(map);
        }

        return () => {
            map.removeLayer(layer);
        };
    }, [map, url, isDefault, maxZoom, attribution, subdomains]);

    // 声明式组件，不渲染任何 DOM
    return null; 
};
