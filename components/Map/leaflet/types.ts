import type { ReactNode } from 'react';

export interface GCData {
    id: string;
    latitude: number;
    longitude: number;
    type: string;
    [key: string]: any;
}

export interface ClusterOptions {
    maxClusterRadius?: number;
    disableClusteringAtZoom?: number;
    iconCreateFunction?: (cluster: any) => any;
}

export interface GCMapProps {
    data: GCData[];
    center?: [number, number];
    zoom?: number;
    clusterOptions?: ClusterOptions;
    clusterEnabled?: boolean;
    className?: string;
    children?: ReactNode;
    onMapReady?: (map: any) => void;
}
