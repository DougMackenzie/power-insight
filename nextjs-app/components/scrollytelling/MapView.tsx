'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MapLocation } from './storyData';

// Extended Map type with layer methods
interface ExtendedMap {
    flyTo: (options: {
        center: [number, number];
        zoom: number;
        pitch: number;
        bearing: number;
        duration: number;
        essential: boolean;
        easing?: (t: number) => number;
    }) => void;
    remove: () => void;
    on: (event: string, callback: () => void) => void;
    addSource: (id: string, source: unknown) => void;
    addLayer: (layer: unknown, before?: string) => void;
    getSource: (id: string) => unknown;
    getLayer: (id: string) => unknown;
    removeLayer: (id: string) => void;
    removeSource: (id: string) => void;
    setPaintProperty: (layerId: string, property: string, value: unknown) => void;
    setLayoutProperty: (layerId: string, property: string, value: unknown) => void;
    loaded: () => boolean;
    getZoom: () => number;
}

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

// Data center locations with growth data
const dataCenterLocations = [
    // Northern Virginia cluster - largest market
    { lng: -77.46, lat: 39.03, name: 'Ashburn DC1', capacity: 250, region: 'nova', year: 2015 },
    { lng: -77.52, lat: 39.05, name: 'Ashburn DC2', capacity: 300, region: 'nova', year: 2018 },
    { lng: -77.44, lat: 39.01, name: 'Sterling DC', capacity: 200, region: 'nova', year: 2020 },
    { lng: -77.48, lat: 39.07, name: 'Loudoun DC', capacity: 280, region: 'nova', year: 2022 },
    { lng: -77.40, lat: 39.02, name: 'Digital Realty', capacity: 220, region: 'nova', year: 2019 },
    { lng: -77.54, lat: 39.00, name: 'QTS Ashburn', capacity: 180, region: 'nova', year: 2021 },
    // Ohio cluster - emerging
    { lng: -82.99, lat: 40.10, name: 'Columbus DC1', capacity: 150, region: 'ohio', year: 2023 },
    { lng: -83.05, lat: 40.05, name: 'Columbus DC2', capacity: 120, region: 'ohio', year: 2024 },
    { lng: -82.85, lat: 40.15, name: 'New Albany DC', capacity: 100, region: 'ohio', year: 2025 },
    // Oklahoma
    { lng: -95.99, lat: 36.15, name: 'Tulsa DC', capacity: 80, region: 'oklahoma', year: 2023 },
    { lng: -97.52, lat: 35.47, name: 'OKC DC', capacity: 60, region: 'oklahoma', year: 2024 },
    // Texas cluster
    { lng: -96.79, lat: 32.77, name: 'Dallas DC1', capacity: 180, region: 'texas', year: 2020 },
    { lng: -96.85, lat: 32.82, name: 'Dallas DC2', capacity: 160, region: 'texas', year: 2022 },
    { lng: -97.33, lat: 32.75, name: 'Fort Worth DC', capacity: 140, region: 'texas', year: 2021 },
    { lng: -95.36, lat: 29.76, name: 'Houston DC', capacity: 120, region: 'texas', year: 2023 },
    { lng: -97.74, lat: 30.27, name: 'Austin DC', capacity: 100, region: 'texas', year: 2024 },
];

// Power plant locations
const powerPlantLocations = [
    // Nuclear
    { lng: -76.50, lat: 37.20, name: 'North Anna Nuclear', type: 'nuclear', capacity: 1892 },
    { lng: -78.10, lat: 38.15, name: 'Lake Anna Nuclear', type: 'nuclear', capacity: 1800 },
    { lng: -96.46, lat: 32.38, name: 'Comanche Peak', type: 'nuclear', capacity: 2400 },
    // Gas
    { lng: -77.80, lat: 38.95, name: 'Panda Stonewall', type: 'gas', capacity: 778 },
    { lng: -82.50, lat: 40.20, name: 'Darby Electric', type: 'gas', capacity: 510 },
    { lng: -97.00, lat: 32.30, name: 'Wolf Hollow', type: 'gas', capacity: 720 },
    { lng: -95.50, lat: 36.00, name: 'Redbud Gas', type: 'gas', capacity: 1230 },
    // Wind
    { lng: -101.00, lat: 35.50, name: 'Panhandle Wind', type: 'wind', capacity: 458 },
    { lng: -100.50, lat: 32.00, name: 'Roscoe Wind', type: 'wind', capacity: 782 },
    { lng: -97.50, lat: 36.50, name: 'Cowboy Wind', type: 'wind', capacity: 350 },
    // Solar
    { lng: -98.00, lat: 30.00, name: 'Roadrunner Solar', type: 'solar', capacity: 497 },
    { lng: -99.50, lat: 31.50, name: 'Permian Solar', type: 'solar', capacity: 420 },
];

/**
 * MapView - Enhanced Mapbox GL visualization with real GeoJSON data
 */
export default function MapView({ location, layerColor = '#EF4444', stepId, region, powerMetric }: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<ExtendedMap | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [layersAdded, setLayersAdded] = useState(false);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Load GeoJSON data and add layers
    const addInfrastructureLayers = useCallback(async (map: ExtendedMap) => {
        if (!map.loaded()) return;

        try {
            // Load ISO regions GeoJSON
            const isoResponse = await fetch('/geojson/iso_regions.geojson');
            const isoData = await isoResponse.json();

            // Load transmission lines GeoJSON (230kV+)
            const transResponse = await fetch('/geojson/transmission_230kv_plus.geojson');
            const transData = await transResponse.json();

            // Add ISO regions
            if (!map.getSource('iso-regions')) {
                map.addSource('iso-regions', {
                    type: 'geojson',
                    data: isoData
                });

                map.addLayer({
                    id: 'iso-regions-fill',
                    type: 'fill',
                    source: 'iso-regions',
                    paint: {
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.15
                    }
                });

                map.addLayer({
                    id: 'iso-regions-outline',
                    type: 'line',
                    source: 'iso-regions',
                    paint: {
                        'line-color': ['get', 'color'],
                        'line-width': 2,
                        'line-opacity': 0.6,
                        'line-dasharray': [2, 2]
                    }
                });
            }

            // Add transmission lines (230kV+) colored by ISO region
            if (!map.getSource('transmission-lines')) {
                map.addSource('transmission-lines', {
                    type: 'geojson',
                    data: transData
                });

                // Glow layer - color by ISO region
                map.addLayer({
                    id: 'transmission-lines-glow',
                    type: 'line',
                    source: 'transmission-lines',
                    paint: {
                        'line-color': ['get', 'color'],
                        'line-width': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'v'], 230, 2, 500, 5, 765, 8],
                            8, ['interpolate', ['linear'], ['get', 'v'], 230, 4, 500, 8, 765, 12],
                            12, ['interpolate', ['linear'], ['get', 'v'], 230, 6, 500, 10, 765, 14]
                        ],
                        'line-opacity': 0.25,
                        'line-blur': 3
                    }
                });

                // Core line - color by ISO region, width by voltage
                map.addLayer({
                    id: 'transmission-lines-core',
                    type: 'line',
                    source: 'transmission-lines',
                    paint: {
                        'line-color': ['get', 'color'],
                        'line-width': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'v'], 230, 0.5, 500, 1.5, 765, 2.5],
                            8, ['interpolate', ['linear'], ['get', 'v'], 230, 1, 500, 2, 765, 3],
                            12, ['interpolate', ['linear'], ['get', 'v'], 230, 1.5, 500, 2.5, 765, 4]
                        ],
                        'line-opacity': 0.85
                    }
                });
            }

            // Add data center markers
            if (!map.getSource('data-centers')) {
                map.addSource('data-centers', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: dataCenterLocations.map(dc => ({
                            type: 'Feature' as const,
                            properties: { name: dc.name, capacity: dc.capacity, region: dc.region, year: dc.year },
                            geometry: { type: 'Point' as const, coordinates: [dc.lng, dc.lat] }
                        }))
                    }
                });

                // Glow effect
                map.addLayer({
                    id: 'data-centers-glow',
                    type: 'circle',
                    source: 'data-centers',
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 50, 8, 300, 18],
                            10, ['interpolate', ['linear'], ['get', 'capacity'], 50, 20, 300, 45]
                        ],
                        'circle-color': '#06B6D4',
                        'circle-opacity': 0.3,
                        'circle-blur': 1
                    }
                });

                // Core marker
                map.addLayer({
                    id: 'data-centers-core',
                    type: 'circle',
                    source: 'data-centers',
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 50, 3, 300, 8],
                            10, ['interpolate', ['linear'], ['get', 'capacity'], 50, 8, 300, 20]
                        ],
                        'circle-color': '#06B6D4',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFFFFF'
                    }
                });
            }

            // Add power plant markers
            if (!map.getSource('power-plants')) {
                const plantColors: Record<string, string> = {
                    nuclear: '#8B5CF6',
                    gas: '#F59E0B',
                    coal: '#6B7280',
                    solar: '#FBBF24',
                    wind: '#34D399'
                };

                map.addSource('power-plants', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: powerPlantLocations.map(pp => ({
                            type: 'Feature' as const,
                            properties: {
                                name: pp.name,
                                type: pp.type,
                                capacity: pp.capacity,
                                color: plantColors[pp.type] || '#6B7280'
                            },
                            geometry: { type: 'Point' as const, coordinates: [pp.lng, pp.lat] }
                        }))
                    }
                });

                // Glow effect
                map.addLayer({
                    id: 'power-plants-glow',
                    type: 'circle',
                    source: 'power-plants',
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 200, 6, 2500, 15],
                            10, ['interpolate', ['linear'], ['get', 'capacity'], 200, 15, 2500, 35]
                        ],
                        'circle-color': ['get', 'color'],
                        'circle-opacity': 0.4,
                        'circle-blur': 1
                    }
                });

                // Core marker
                map.addLayer({
                    id: 'power-plants-icon',
                    type: 'circle',
                    source: 'power-plants',
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 200, 3, 2500, 7],
                            10, ['interpolate', ['linear'], ['get', 'capacity'], 200, 7, 2500, 16]
                        ],
                        'circle-color': ['get', 'color'],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#1F2937'
                    }
                });
            }

            setLayersAdded(true);
        } catch (e) {
            console.error('Error adding infrastructure layers:', e);
        }
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (!mapboxToken) {
            setMapError('No Mapbox token found');
            return;
        }
        if (mapRef.current) return;

        import('mapbox-gl').then((mapboxgl) => {
            const mbgl = mapboxgl.default || mapboxgl;

            mbgl.accessToken = mapboxToken;

            const map = new mbgl.Map({
                container: mapContainerRef.current!,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [location.lng, location.lat],
                zoom: location.zoom,
                pitch: location.pitch,
                bearing: location.bearing,
                attributionControl: false,
                fadeDuration: 0,
            }) as unknown as ExtendedMap;

            map.on('load', () => {
                mapRef.current = map;
                setMapLoaded(true);

                // Add 3D building layer for realistic campus view
                const layers = (map as unknown as { getStyle: () => { layers: { id: string }[] } }).getStyle().layers;
                let labelLayerId: string | undefined;
                for (const layer of layers) {
                    if (layer.id.includes('label')) {
                        labelLayerId = layer.id;
                        break;
                    }
                }

                map.addLayer({
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 12,
                    paint: {
                        'fill-extrusion-color': '#1e3a5f',
                        'fill-extrusion-height': ['get', 'height'],
                        'fill-extrusion-base': ['get', 'min_height'],
                        'fill-extrusion-opacity': 0.7
                    }
                }, labelLayerId);

                addInfrastructureLayers(map);
            });

        }).catch((err) => {
            console.error('Mapbox load error:', err);
            setMapError(err.message || 'Failed to load map');
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                setMapLoaded(false);
                setLayersAdded(false);
            }
        };
    }, [mapboxToken, addInfrastructureLayers]);

    // Smooth easing function for camera transitions
    const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    // Fly to new location with seamless animation
    useEffect(() => {
        if (mapRef.current && mapLoaded && location) {
            // Calculate duration based on distance
            const currentZoom = mapRef.current.getZoom();
            const zoomDiff = Math.abs(location.zoom - currentZoom);
            const baseDuration = 2500;
            const duration = baseDuration + (zoomDiff * 500);

            mapRef.current.flyTo({
                center: [location.lng, location.lat],
                zoom: location.zoom,
                pitch: location.pitch,
                bearing: location.bearing,
                duration: Math.min(duration, 5000),
                essential: true,
                easing: easeInOutCubic,
            });
        }
    }, [location, mapLoaded]);

    // Update layer styling based on current step
    useEffect(() => {
        if (!mapRef.current || !layersAdded) return;

        const map = mapRef.current;

        // Highlight the relevant region
        const regionHighlights: Record<string, { dcFilter: string[], opacity: number }> = {
            campus: { dcFilter: ['nova'], opacity: 1.0 },
            nova: { dcFilter: ['nova'], opacity: 1.0 },
            ohio: { dcFilter: ['nova', 'ohio'], opacity: 0.8 },
            oklahoma: { dcFilter: ['nova', 'ohio', 'oklahoma'], opacity: 0.7 },
            texas: { dcFilter: ['nova', 'ohio', 'oklahoma', 'texas'], opacity: 0.6 },
            usa: { dcFilter: ['nova', 'ohio', 'oklahoma', 'texas'], opacity: 0.5 },
        };

        const highlight = regionHighlights[stepId] || regionHighlights.usa;

        try {
            // Adjust transmission line color based on region
            if (map.getLayer('transmission-lines-core')) {
                map.setPaintProperty('transmission-lines-core', 'line-color', layerColor);
                map.setPaintProperty('transmission-lines-glow', 'line-color', layerColor);
            }

            // Adjust ISO region visibility
            if (map.getLayer('iso-regions-fill')) {
                map.setPaintProperty('iso-regions-fill', 'fill-opacity',
                    stepId === 'usa' ? 0.2 : 0.12
                );
            }

        } catch {
            // Layers may not exist yet
        }
    }, [stepId, layersAdded, layerColor]);

    // Load CSS dynamically
    useEffect(() => {
        const existingLink = document.querySelector('link[href*="mapbox-gl.css"]');
        if (existingLink) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
        document.head.appendChild(link);
    }, []);

    // Fallback when no Mapbox token or error
    if (!mapboxToken || mapError) {
        return <MapFallback location={location} layerColor={layerColor} stepId={stepId} region={region} powerMetric={powerMetric} errorMessage={mapError} />;
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Loading overlay */}
            {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Region indicator */}
            <RegionIndicator color={layerColor} stepId={stepId} region={region} />

            {/* Location label */}
            <LocationLabel stepId={stepId} region={region} powerMetric={powerMetric} />

            {/* Legend */}
            {mapLoaded && <MapLegend stepId={stepId} />}
        </div>
    );
}

/**
 * Map Legend
 */
function MapLegend({ stepId }: { stepId: string }) {
    const showLegend = ['nova', 'ohio', 'oklahoma', 'texas', 'usa'].includes(stepId);
    if (!showLegend) return null;

    return (
        <motion.div
            className="absolute bottom-24 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs z-20 border border-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
            <div className="text-gray-400 uppercase tracking-wider mb-2 font-medium text-[10px]">Legend</div>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 border border-white" />
                    <span className="text-gray-300">Data Center</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500 border border-gray-800" />
                    <span className="text-gray-300">Nuclear</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 border border-gray-800" />
                    <span className="text-gray-300">Gas Plant</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 border border-gray-800" />
                    <span className="text-gray-300">Wind/Solar</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-red-500 via-amber-500 to-green-500" />
                    <span className="text-gray-300">230kV+ Lines</span>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Fallback component when Mapbox token is not available
 */
function MapFallback({ location, layerColor = '#EF4444', stepId, region, powerMetric, errorMessage }: MapViewProps & { errorMessage?: string | null }) {
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

            {/* Coordinates */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center z-20">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Coordinates</div>
                <div className="font-mono text-gray-300">
                    {location.lat.toFixed(2)}°N, {Math.abs(location.lng).toFixed(2)}°W
                </div>
            </div>

            {/* Error prompt */}
            <motion.div
                className="absolute top-20 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-amber-500/50 max-w-xs z-30"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
            >
                <div className="text-amber-400 text-sm font-medium mb-1">
                    {errorMessage ? 'Map Error' : 'Map Preview Mode'}
                </div>
                <div className="text-gray-400 text-xs">
                    {errorMessage || 'Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local for the full experience.'}
                </div>
            </motion.div>

            <RegionIndicator color={layerColor} stepId={stepId} region={region} />
            <LocationLabel stepId={stepId} region={region} powerMetric={powerMetric} />
        </div>
    );
}

/**
 * Region Indicator
 */
function RegionIndicator({ color, stepId, region }: {
    color: string;
    stepId: string;
    region?: { name: string; type: 'iso' | 'regulated' | 'deregulated'; color: string };
}) {
    const marketTypeLabels: Record<string, string> = {
        iso: 'Organized Market (ISO)',
        regulated: 'Regulated Utility',
        deregulated: 'Deregulated Market',
    };

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
                className="absolute top-20 left-4 flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 border z-20"
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
 * Location Label
 */
function LocationLabel({ stepId, region, powerMetric }: {
    stepId: string;
    region?: { name: string; type: 'iso' | 'regulated' | 'deregulated'; color: string };
    powerMetric?: { value: string; unit: string; comparison: string };
}) {
    const locationNames: Record<string, string> = {
        campus: 'Data Center Campus',
        nova: 'Northern Virginia',
        ohio: 'Central Ohio',
        oklahoma: 'Oklahoma',
        texas: 'Texas',
        usa: 'United States',
    };

    const name = locationNames[stepId];
    if (!name) return null;

    return (
        <motion.div
            key={stepId}
            className="absolute bottom-8 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 z-20 border border-gray-700"
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
