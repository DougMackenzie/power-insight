'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MapLocation } from './storyData';

// Type for mapbox-gl Map instance
type MapboxMap = {
    flyTo: (options: {
        center: [number, number];
        zoom: number;
        pitch: number;
        bearing: number;
        duration: number;
        essential: boolean;
    }) => void;
    remove: () => void;
    on: (event: string, callback: () => void) => void;
};

interface MapViewProps {
    location: MapLocation;
    layerColor?: string;
    stepId: string;
    region?: {
        name: string;
        type: 'iso' | 'regulated' | 'deregulated';
        color: string;
    };
    powerMetric?: {
        value: string;
        unit: string;
        comparison: string;
    };
}

/**
 * MapView - Mapbox GL visualization for macro-level story
 * Uses native mapbox-gl for better Turbopack compatibility
 */
export default function MapView({ location, layerColor = '#EF4444', stepId, region, powerMetric }: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapboxMap | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(false);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || !mapboxToken || mapRef.current) return;

        let map: MapboxMap | null = null;

        // Dynamic import of mapbox-gl to avoid SSR issues
        import('mapbox-gl').then((mapboxgl) => {
            // @ts-expect-error - mapbox-gl types
            mapboxgl.accessToken = mapboxToken;

            map = new mapboxgl.Map({
                container: mapContainerRef.current!,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [location.lng, location.lat],
                zoom: location.zoom,
                pitch: location.pitch,
                bearing: location.bearing,
                attributionControl: false,
            });

            map!.on('load', () => {
                mapRef.current = map;
                setMapLoaded(true);
            });
        }).catch(() => {
            setMapError(true);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapboxToken]);

    // Fly to new location when props change
    useEffect(() => {
        if (mapRef.current && mapLoaded && location) {
            mapRef.current.flyTo({
                center: [location.lng, location.lat],
                zoom: location.zoom,
                pitch: location.pitch,
                bearing: location.bearing,
                duration: 2500,
                essential: true,
            });
        }
    }, [location, mapLoaded]);

    // Load CSS dynamically
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // Fallback when no Mapbox token or error
    if (!mapboxToken || mapError) {
        return <MapFallback location={location} layerColor={layerColor} stepId={stepId} region={region} powerMetric={powerMetric} />;
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Loading overlay */}
            {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Region indicator and location label */}
            <RegionIndicator color={layerColor} stepId={stepId} region={region} />
            <LocationLabel stepId={stepId} region={region} powerMetric={powerMetric} />
        </div>
    );
}

/**
 * Fallback component when Mapbox token is not available
 */
function MapFallback({ location, layerColor = '#EF4444', stepId, region, powerMetric }: MapViewProps) {
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-500" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mapGrid)" />
                </svg>
            </div>

            {/* Stylized US outline for context */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center opacity-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
            >
                <svg viewBox="0 0 800 500" className="w-full h-full max-w-4xl">
                    <path
                        d="M 100 200 Q 150 180 200 190 Q 300 160 400 180 Q 500 150 600 180 Q 700 200 720 250 Q 700 300 650 350 Q 550 380 450 370 Q 350 390 250 360 Q 150 330 100 280 Z"
                        fill="none"
                        stroke={layerColor}
                        strokeWidth="2"
                        strokeDasharray="10 5"
                    />
                </svg>
            </motion.div>

            {/* Pulsing location dot */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <div
                        className="w-8 h-8 rounded-full border-4 border-white shadow-xl"
                        style={{ backgroundColor: layerColor }}
                    />
                    <motion.div
                        className="absolute inset-0 w-8 h-8 rounded-full"
                        style={{ backgroundColor: layerColor }}
                        animate={{ scale: [1, 3, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>
            </div>

            {/* Coordinates display */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Coordinates</div>
                <div className="font-mono text-gray-300">
                    {location.lat.toFixed(2)}°N, {Math.abs(location.lng).toFixed(2)}°W
                </div>
            </div>

            {/* Setup prompt */}
            <motion.div
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-amber-500/50 max-w-xs"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
            >
                <div className="text-amber-400 text-sm font-medium mb-1">Map Preview Mode</div>
                <div className="text-gray-400 text-xs">
                    Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local for the full interactive map experience.
                </div>
            </motion.div>

            {/* Region indicator and location label */}
            <RegionIndicator color={layerColor} stepId={stepId} region={region} />
            <LocationLabel stepId={stepId} region={region} powerMetric={powerMetric} />
        </div>
    );
}

/**
 * Region Indicator - Color-coded badge showing market type and region
 */
function RegionIndicator({ color, stepId, region }: {
    color: string;
    stepId: string;
    region?: { name: string; type: 'iso' | 'regulated' | 'deregulated'; color: string };
}) {
    // Market type labels
    const marketTypeLabels: Record<string, string> = {
        iso: 'Organized Market (ISO)',
        regulated: 'Regulated Utility',
        deregulated: 'Deregulated Market',
    };

    // Fallback labels by step ID
    const fallbackLabels: Record<string, string> = {
        campus: 'Grid Infrastructure',
        nova: 'PJM Interconnection',
        ohio: 'PJM Interconnection',
        oklahoma: 'SPP (Regulated)',
        texas: 'ERCOT',
        usa: 'National Grid',
    };

    const label = region ? marketTypeLabels[region.type] : fallbackLabels[stepId] || 'Regional View';
    const displayColor = region?.color || color;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={stepId}
                className="absolute top-8 left-8 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 border"
                style={{ borderColor: displayColor }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
            >
                <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: displayColor }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">{label}</span>
                    {region && (
                        <span className="text-gray-400 text-xs">{region.name}</span>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Location Label - Shows current location name and power metrics
 */
function LocationLabel({ stepId, region, powerMetric }: {
    stepId: string;
    region?: { name: string; type: 'iso' | 'regulated' | 'deregulated'; color: string };
    powerMetric?: { value: string; unit: string; comparison: string };
}) {
    const locationNames: Record<string, string> = {
        campus: 'Data Center Campus',
        nova: 'Northern Virginia (Data Center Alley)',
        ohio: 'Central Ohio',
        oklahoma: 'Oklahoma (PSO Territory)',
        texas: 'Texas (ERCOT)',
        usa: 'United States',
    };

    const name = locationNames[stepId];
    if (!name) return null;

    return (
        <motion.div
            key={stepId}
            className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="text-gray-400 text-xs uppercase tracking-wider">Location</div>
            <div className="text-white font-medium">{name}</div>
            {powerMetric && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-mono" style={{ color: region?.color || '#06b6d4' }}>
                            {powerMetric.value}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">{powerMetric.unit}</span>
                    </div>
                    <div className="text-xs text-gray-500">{powerMetric.comparison}</div>
                </div>
            )}
        </motion.div>
    );
}
