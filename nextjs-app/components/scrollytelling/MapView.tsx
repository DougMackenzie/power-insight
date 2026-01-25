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

// Status colors for data centers
const statusColors: Record<string, string> = {
    operational: '#06B6D4',    // Cyan - existing
    construction: '#F59E0B',   // Amber - under construction
    planned: '#22D3EE',        // Light cyan - planned
    announced: '#818CF8',      // Purple - announced/future
    anticipated: '#6366F1',    // Indigo - anticipated growth (2030-35)
};

// Power plant type colors
const plantTypeColors: Record<string, string> = {
    nuclear: '#8B5CF6',
    gas: '#F59E0B',
    coal: '#6B7280',
    solar: '#FBBF24',
    wind: '#34D399',
    hydro: '#3B82F6',
    geothermal: '#EF4444',
};

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
        try {
            console.log('Adding infrastructure layers...');

            // Load ISO regions GeoJSON
            const isoResponse = await fetch('/geojson/iso_regions.geojson');
            if (!isoResponse.ok) {
                console.error('Failed to load ISO regions:', isoResponse.status);
                return;
            }
            const isoData = await isoResponse.json();
            console.log('ISO regions loaded:', isoData.features?.length, 'features');

            // Load transmission lines GeoJSON (230kV+)
            const transResponse = await fetch('/geojson/transmission_230kv_plus.geojson');
            if (!transResponse.ok) {
                console.error('Failed to load transmission lines:', transResponse.status);
                return;
            }
            const transData = await transResponse.json();
            console.log('Transmission lines loaded:', transData.features?.length, 'features');

            // Load data centers GeoJSON (comprehensive with status)
            const dcResponse = await fetch('/geojson/data_centers.geojson');
            let dcData = null;
            if (dcResponse.ok) {
                dcData = await dcResponse.json();
                console.log('Data centers loaded:', dcData.features?.length, 'features');
            }

            // Load new power plants GeoJSON
            const ppResponse = await fetch('/geojson/power_plants_new.geojson');
            let ppData = null;
            if (ppResponse.ok) {
                ppData = await ppResponse.json();
                console.log('New power plants loaded:', ppData.features?.length, 'features');
            }

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

            // Add data center markers from GeoJSON with status-based styling
            if (!map.getSource('data-centers') && dcData) {
                map.addSource('data-centers', {
                    type: 'geojson',
                    data: dcData
                });

                // Glow effect - color by status
                map.addLayer({
                    id: 'data-centers-glow',
                    type: 'circle',
                    source: 'data-centers',
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 500, 6, 1500, 14],
                            8, ['interpolate', ['linear'], ['get', 'capacity'], 500, 12, 1500, 28],
                            12, ['interpolate', ['linear'], ['get', 'capacity'], 500, 18, 1500, 40]
                        ],
                        'circle-color': [
                            'match', ['get', 'status'],
                            'operational', statusColors.operational,
                            'construction', statusColors.construction,
                            'planned', statusColors.planned,
                            'announced', statusColors.announced,
                            'anticipated', statusColors.anticipated,
                            statusColors.operational
                        ],
                        'circle-opacity': [
                            'match', ['get', 'status'],
                            'operational', 0.35,
                            'construction', 0.4,
                            'planned', 0.3,
                            'announced', 0.25,
                            'anticipated', 0.2,
                            0.3
                        ],
                        'circle-blur': 1
                    }
                });

                // Core marker - solid for operational, ring for planned/announced
                map.addLayer({
                    id: 'data-centers-core',
                    type: 'circle',
                    source: 'data-centers',
                    filter: ['in', ['get', 'status'], ['literal', ['operational', 'construction']]],
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 500, 3, 1500, 7],
                            8, ['interpolate', ['linear'], ['get', 'capacity'], 500, 5, 1500, 12],
                            12, ['interpolate', ['linear'], ['get', 'capacity'], 500, 8, 1500, 18]
                        ],
                        'circle-color': [
                            'match', ['get', 'status'],
                            'operational', statusColors.operational,
                            'construction', statusColors.construction,
                            statusColors.operational
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFFFFF'
                    }
                });

                // Planned/announced/anticipated markers - hollow ring style
                map.addLayer({
                    id: 'data-centers-planned',
                    type: 'circle',
                    source: 'data-centers',
                    filter: ['in', ['get', 'status'], ['literal', ['planned', 'announced', 'anticipated']]],
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 500, 3, 1500, 7],
                            8, ['interpolate', ['linear'], ['get', 'capacity'], 500, 5, 1500, 12],
                            12, ['interpolate', ['linear'], ['get', 'capacity'], 500, 8, 1500, 18]
                        ],
                        'circle-color': 'transparent',
                        'circle-stroke-width': [
                            'match', ['get', 'status'],
                            'planned', 2.5,
                            'announced', 2,
                            'anticipated', 1.5,
                            2
                        ],
                        'circle-stroke-color': [
                            'match', ['get', 'status'],
                            'planned', statusColors.planned,
                            'announced', statusColors.announced,
                            'anticipated', statusColors.anticipated,
                            statusColors.planned
                        ],
                        'circle-stroke-opacity': [
                            'match', ['get', 'status'],
                            'planned', 0.9,
                            'announced', 0.7,
                            'anticipated', 0.5,
                            0.8
                        ]
                    }
                });
            }

            // Add NEW power plant markers (only announced/planned plants, not existing)
            if (!map.getSource('power-plants') && ppData) {
                // Add color property to features based on type
                const featuresWithColor = ppData.features.map((f: { properties: { type: string } }) => ({
                    ...f,
                    properties: {
                        ...f.properties,
                        color: plantTypeColors[f.properties.type] || '#6B7280'
                    }
                }));

                map.addSource('power-plants', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: featuresWithColor
                    }
                });

                // Glow effect for new plants
                map.addLayer({
                    id: 'power-plants-glow',
                    type: 'circle',
                    source: 'power-plants',
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 150, 5, 1500, 12],
                            8, ['interpolate', ['linear'], ['get', 'capacity'], 150, 10, 1500, 22],
                            12, ['interpolate', ['linear'], ['get', 'capacity'], 150, 14, 1500, 30]
                        ],
                        'circle-color': ['get', 'color'],
                        'circle-opacity': 0.5,
                        'circle-blur': 1
                    }
                });

                // Core marker - ring style to indicate "new/planned"
                map.addLayer({
                    id: 'power-plants-icon',
                    type: 'circle',
                    source: 'power-plants',
                    paint: {
                        'circle-radius': [
                            'interpolate', ['linear'], ['zoom'],
                            3, ['interpolate', ['linear'], ['get', 'capacity'], 150, 3, 1500, 6],
                            8, ['interpolate', ['linear'], ['get', 'capacity'], 150, 5, 1500, 10],
                            12, ['interpolate', ['linear'], ['get', 'capacity'], 150, 7, 1500, 14]
                        ],
                        'circle-color': ['get', 'color'],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFFFFF'
                    }
                });
            }

            console.log('Infrastructure layers added successfully');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapboxToken]);

    // Add infrastructure layers once map is loaded
    useEffect(() => {
        if (mapRef.current && mapLoaded && !layersAdded) {
            addInfrastructureLayers(mapRef.current);
        }
    }, [mapLoaded, layersAdded, addInfrastructureLayers]);

    // Smooth easing function for camera transitions
    const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    // Fly to new location with seamless animation
    // Use individual location values as dependencies to properly detect changes
    useEffect(() => {
        if (mapRef.current && mapLoaded && location) {
            // Calculate duration based on distance
            const currentZoom = mapRef.current.getZoom();
            const zoomDiff = Math.abs(location.zoom - currentZoom);
            const baseDuration = 2000;
            const duration = baseDuration + (zoomDiff * 400);

            console.log('Flying to:', location.lng, location.lat, 'zoom:', location.zoom);

            mapRef.current.flyTo({
                center: [location.lng, location.lat],
                zoom: location.zoom,
                pitch: location.pitch,
                bearing: location.bearing,
                duration: Math.min(duration, 4000),
                essential: true,
                easing: easeInOutCubic,
            });
        }
    }, [location.lng, location.lat, location.zoom, location.pitch, location.bearing, mapLoaded]);

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
            // Keep transmission lines colored by ISO region (from GeoJSON 'color' property)
            // Don't override with layerColor - the GeoJSON already has ISO-based colors

            // Adjust ISO region visibility based on zoom level
            if (map.getLayer('iso-regions-fill')) {
                map.setPaintProperty('iso-regions-fill', 'fill-opacity',
                    stepId === 'usa' ? 0.25 : 0.15
                );
            }

            // Adjust data center visibility - all layers including planned
            if (map.getLayer('data-centers-core')) {
                map.setLayoutProperty('data-centers-core', 'visibility', 'visible');
                map.setLayoutProperty('data-centers-glow', 'visibility', 'visible');
            }
            if (map.getLayer('data-centers-planned')) {
                map.setLayoutProperty('data-centers-planned', 'visibility', 'visible');
            }

            // Adjust power plant visibility
            if (map.getLayer('power-plants-icon')) {
                map.setLayoutProperty('power-plants-icon', 'visibility', 'visible');
                map.setLayoutProperty('power-plants-glow', 'visibility', 'visible');
            }

        } catch (err) {
            console.log('Layer styling error (layers may not exist yet):', err);
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
 * Map Legend - Enhanced with existing vs planned distinction
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
            <div className="text-gray-400 uppercase tracking-wider mb-2 font-medium text-[10px]">Data Centers</div>
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-white" />
                    <span className="text-gray-300">Existing (500MW+)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                    <span className="text-gray-300">Under Construction</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-cyan-300 bg-transparent" />
                    <span className="text-gray-300">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-purple-400 bg-transparent" style={{ opacity: 0.7 }} />
                    <span className="text-gray-300">Announced</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-400 bg-transparent" style={{ opacity: 0.5, borderStyle: 'dashed' }} />
                    <span className="text-gray-300">Anticipated (2030-35)</span>
                </div>
            </div>

            <div className="text-gray-400 uppercase tracking-wider mb-2 font-medium text-[10px]">New Power Plants</div>
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500 border border-white" />
                    <span className="text-gray-300">Nuclear</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
                    <span className="text-gray-300">Natural Gas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 border border-white" />
                    <span className="text-gray-300">Wind</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white" />
                    <span className="text-gray-300">Solar</span>
                </div>
            </div>

            <div className="text-gray-400 uppercase tracking-wider mb-2 font-medium text-[10px]">Grid</div>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500" />
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
