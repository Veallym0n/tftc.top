import React, { createContext, useContext } from 'react';
import { GCData, ClusterOptions } from './types';

interface MapContextValue {
    map: any | null; // Leaflet map instance
    data: GCData[];
    clusterOptions?: ClusterOptions;
    clusterEnabled?: boolean;
}

export const MapContext = createContext<MapContextValue>({ map: null, data: [] });

export const useMapContext = () => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('TFTC components (like MapLayer, MarkerTemplate) must be used within a <GCMap> component.');
    }
    return context;
};
