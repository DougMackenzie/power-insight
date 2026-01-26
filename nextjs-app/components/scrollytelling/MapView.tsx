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

/**
 * NYT-inspired color palette - muted but high contrast
 * More sophisticated, journalistic aesthetic
 */
const NYT_COLORS = {
    // Backgrounds
    bgDeep: '#0a0a0f',
    bgSurface: '#1a1a24',

    // Text
    textPrimary: '#f0ebe3',      // Warm off-white
    textSecondary: '#a8a29e',     // Warm gray
    textMuted: '#6b6560',         // Muted warm gray

    // Accents
    accentAmber: '#d4a574',       // Muted gold
    accentCyan: '#7dd3c0',        // Soft teal
    accentCoral: '#e8927c',       // Soft coral
    accentBlue: '#7c9cc9',        // Soft blue
};

// Data Centers - Muted blue shades (NYT style)
const dcStatusColors: Record<string, string> = {
    operational: '#4a6a94',    // Muted dark blue - existing
    construction: '#5b7aa6',   // Muted medium blue - under construction
    planned: '#7c9cc9',        // Muted light blue - planned
    announced: '#7c9cc9',      // Same as planned
    anticipated: '#9cb8d9',    // Softest blue - anticipated
};

// Power Plants - Muted green shades (NYT style)
const ppStatusColors: Record<string, string> = {
    operational: '#4a7a5a',    // Muted dark green - operational
    construction: '#5b9a6a',   // Muted medium green - construction
    planned: '#6b9e7a',        // Muted light green - planned
    anticipated: '#8bbaa0',    // Softest green - anticipated
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

            // Add ISO regions - only for data, transmission lines will show ISO colors
            if (!map.getSource('iso-regions')) {
                map.addSource('iso-regions', {
                    type: 'geojson',
                    data: isoData
                });
                // No fill overlay - ISO is identified by transmission line colors only
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

                // Glow effect - blue shades by status
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
                            'operational', dcStatusColors.operational,
                            'construction', dcStatusColors.construction,
                            'planned', dcStatusColors.planned,
                            'announced', dcStatusColors.announced,
                            'anticipated', dcStatusColors.anticipated,
                            dcStatusColors.operational
                        ],
                        'circle-opacity': [
                            'match', ['get', 'status'],
                            'operational', 0.4,
                            'construction', 0.45,
                            'planned', 0.35,
                            'announced', 0.3,
                            'anticipated', 0.25,
                            0.35
                        ],
                        'circle-blur': 1
                    }
                });

                // Core marker - solid for operational, ring for planned/announced
                // Stroke uses warm off-white instead of pure white
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
                            'operational', dcStatusColors.operational,
                            'construction', dcStatusColors.construction,
                            dcStatusColors.operational
                        ],
                        'circle-stroke-width': 1.5,
                        'circle-stroke-color': '#f0ebe3'
                    }
                });

                // Planned/announced/anticipated markers - hollow ring style (blue shades)
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
                            'planned', dcStatusColors.planned,
                            'announced', dcStatusColors.announced,
                            'anticipated', dcStatusColors.anticipated,
                            dcStatusColors.planned
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

            // Add power plant markers - ALL GREEN shades based on status only
            if (!map.getSource('power-plants') && ppData) {
                map.addSource('power-plants', {
                    type: 'geojson',
                    data: ppData
                });

                // Glow effect for power plants - muted GREEN shades by status
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
                        'circle-color': [
                            'match', ['get', 'status'],
                            'operational', ppStatusColors.operational,
                            'construction', ppStatusColors.construction,
                            'announced', ppStatusColors.planned,
                            'planned', ppStatusColors.planned,
                            'anticipated', ppStatusColors.anticipated,
                            ppStatusColors.planned
                        ],
                        'circle-opacity': 0.35,
                        'circle-blur': 1
                    }
                });

                // Core marker - muted GREEN shades by status with warm off-white border
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
                        'circle-color': [
                            'match', ['get', 'status'],
                            'operational', ppStatusColors.operational,
                            'construction', ppStatusColors.construction,
                            'announced', ppStatusColors.planned,
                            'planned', ppStatusColors.planned,
                            'anticipated', ppStatusColors.anticipated,
                            ppStatusColors.planned
                        ],
                        'circle-stroke-width': 1.5,
                        'circle-stroke-color': '#f0ebe3'
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

            // NYT-style darker map with warmer undertones
            // Using dark-v11 as base, will customize with paint properties
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

                // 3D buildings - warm charcoal tone
                map.addLayer({
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 12,
                    paint: {
                        'fill-extrusion-color': '#2a2a35',
                        'fill-extrusion-height': ['get', 'height'],
                        'fill-extrusion-base': ['get', 'min_height'],
                        'fill-extrusion-opacity': 0.65
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
            // Transmission lines are colored by ISO region (from GeoJSON 'color' property)
            // No fill overlay - ISO identification is through transmission line colors only

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

            {/* Loading overlay - NYT-style */}
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: '#0a0a0f' }}>
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: '#7dd3c0', borderTopColor: 'transparent' }} />
                        <p className="text-sm" style={{ color: '#a8a29e' }}>Loading map...</p>
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
 * Map Legend - NYT-style muted colors for data centers and power plants
 */
function MapLegend({ stepId }: { stepId: string }) {
    const showLegend = ['nova', 'ohio', 'oklahoma', 'texas', 'usa'].includes(stepId);
    if (!showLegend) return null;

    return (
        <motion.div
            className="absolute bottom-24 left-4 rounded-lg p-3 text-xs z-20 border"
            style={{
                backgroundColor: 'rgba(10, 10, 15, 0.9)',
                borderColor: 'rgba(107, 101, 96, 0.3)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
            <div className="uppercase tracking-wider mb-2 font-medium text-[10px]" style={{ color: '#a8a29e' }}>Data Centers</div>
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dcStatusColors.operational, border: '1.5px solid #f0ebe3' }} />
                    <span style={{ color: '#f0ebe3' }}>Operational</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dcStatusColors.construction, border: '1.5px solid #f0ebe3' }} />
                    <span style={{ color: '#f0ebe3' }}>Under Construction</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-transparent" style={{ border: `2px solid ${dcStatusColors.planned}` }} />
                    <span style={{ color: '#f0ebe3' }}>Planned / Announced</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-transparent" style={{ border: `2px solid ${dcStatusColors.anticipated}`, opacity: 0.7 }} />
                    <span style={{ color: '#a8a29e' }}>Anticipated (2030-35)</span>
                </div>
            </div>

            <div className="uppercase tracking-wider mb-2 font-medium text-[10px]" style={{ color: '#a8a29e' }}>Power Plants</div>
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ppStatusColors.operational, border: '1.5px solid #f0ebe3' }} />
                    <span style={{ color: '#f0ebe3' }}>Operational</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ppStatusColors.construction, border: '1.5px solid #f0ebe3' }} />
                    <span style={{ color: '#f0ebe3' }}>Under Construction</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ppStatusColors.planned, border: '1.5px solid #f0ebe3' }} />
                    <span style={{ color: '#f0ebe3' }}>Planned</span>
                </div>
            </div>

            <div className="uppercase tracking-wider mb-2 font-medium text-[10px]" style={{ color: '#a8a29e' }}>Grid</div>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5" style={{ background: 'linear-gradient(90deg, #e8927c 0%, #d4a574 50%, #7c9cc9 100%)', opacity: 0.7 }} />
                    <span style={{ color: '#a8a29e' }}>230kV+ Lines (by ISO)</span>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Fallback component when Mapbox token is not available - NYT-style
 */
function MapFallback({ location, layerColor = '#EF4444', stepId, region, powerMetric, errorMessage }: MapViewProps & { errorMessage?: string | null }) {
    // Map bright colors to NYT muted equivalents
    const colorMap: Record<string, string> = {
        '#EF4444': '#e8927c',
        '#F59E0B': '#d4a574',
        '#3B82F6': '#7c9cc9',
        '#10B981': '#7dd3c0',
        '#6366F1': '#8b8ac9',
    };
    const displayColor = colorMap[layerColor] || layerColor;

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)' }}>
            {/* Grid background */}
            <div className="absolute inset-0 opacity-15">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4a4a55" strokeWidth="0.5" />
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
                        className="w-8 h-8 rounded-full shadow-xl"
                        style={{ backgroundColor: displayColor, border: '3px solid #f0ebe3' }}
                    />
                    <motion.div
                        className="absolute inset-0 w-8 h-8 rounded-full"
                        style={{ backgroundColor: displayColor }}
                        animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    />
                </motion.div>
            </div>

            {/* Coordinates */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center z-20">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6b6560' }}>Coordinates</div>
                <div className="font-mono" style={{ color: '#a8a29e' }}>
                    {location.lat.toFixed(2)}°N, {Math.abs(location.lng).toFixed(2)}°W
                </div>
            </div>

            {/* Error prompt */}
            <motion.div
                className="absolute top-20 right-4 rounded-lg px-4 py-3 border max-w-xs z-30"
                style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.9)',
                    borderColor: 'rgba(212, 165, 116, 0.4)'
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
            >
                <div className="text-sm font-medium mb-1" style={{ color: '#d4a574' }}>
                    {errorMessage ? 'Map Error' : 'Map Preview Mode'}
                </div>
                <div className="text-xs" style={{ color: '#a8a29e' }}>
                    {errorMessage || 'Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local for the full experience.'}
                </div>
            </motion.div>

            <RegionIndicator color={layerColor} stepId={stepId} region={region} />
            <LocationLabel stepId={stepId} region={region} powerMetric={powerMetric} />
        </div>
    );
}

/**
 * Region Indicator - NYT-style
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

    // Map bright colors to NYT muted equivalents
    const colorMap: Record<string, string> = {
        '#EF4444': '#e8927c',  // Red -> Muted coral
        '#F59E0B': '#d4a574',  // Amber -> Muted gold
        '#3B82F6': '#7c9cc9',  // Blue -> Muted blue
        '#10B981': '#7dd3c0',  // Green -> Muted teal
        '#6366F1': '#8b8ac9',  // Indigo -> Muted indigo
    };

    const label = region ? marketTypeLabels[region.type] : fallbackLabels[stepId] || 'Regional View';
    const originalColor = region?.color || color;
    const displayColor = colorMap[originalColor] || originalColor;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={stepId}
                className="absolute top-20 left-4 flex items-center gap-3 rounded-lg px-4 py-3 border z-20"
                style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.9)',
                    borderColor: displayColor
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
            >
                <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: displayColor }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="flex flex-col">
                    <span className="text-sm font-medium" style={{ color: '#f0ebe3' }}>{label}</span>
                    {region && (
                        <span className="text-xs" style={{ color: '#a8a29e' }}>{region.name}</span>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Location Label - NYT-style
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

    // Map bright colors to NYT muted equivalents
    const colorMap: Record<string, string> = {
        '#EF4444': '#e8927c',
        '#F59E0B': '#d4a574',
        '#3B82F6': '#7c9cc9',
        '#10B981': '#7dd3c0',
        '#6366F1': '#8b8ac9',
    };

    const name = locationNames[stepId];
    if (!name) return null;

    const originalColor = region?.color || '#7dd3c0';
    const displayColor = colorMap[originalColor] || originalColor;

    return (
        <motion.div
            key={stepId}
            className="absolute bottom-8 right-4 rounded-lg px-4 py-3 z-20 border"
            style={{
                backgroundColor: 'rgba(10, 10, 15, 0.9)',
                borderColor: 'rgba(107, 101, 96, 0.3)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="text-xs uppercase tracking-wider" style={{ color: '#a8a29e' }}>Location</div>
            <div className="font-medium" style={{ color: '#f0ebe3' }}>{name}</div>
            {powerMetric && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(107, 101, 96, 0.3)' }}>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-mono" style={{ color: displayColor }}>
                            {powerMetric.value}
                        </span>
                        <span className="text-sm font-mono" style={{ color: '#f0ebe3' }}>{powerMetric.unit}</span>
                    </div>
                    <div className="text-xs" style={{ color: '#a8a29e' }}>{powerMetric.comparison}</div>
                </div>
            )}
        </motion.div>
    );
}
