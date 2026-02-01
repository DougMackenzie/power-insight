'use client';

import { useState, useMemo, useEffect, memo } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from 'react-simple-maps';
import { GENERATED_TARIFFS, type EnrichedTariff } from '@/lib/generatedTariffData';

// GeoJSON URLs
const UTILITY_GEO_URL = '/geojson/utility_territories.geojson';
const STATE_GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS code to state abbreviation mapping (for state fallback)
const FIPS_TO_STATE: Record<string, string> = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
    '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
    '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
    '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
    '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
    '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
    '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
    '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
    '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
    '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
    '56': 'WY',
};

/**
 * Bivariate color matrix for rate (x-axis) vs protection (y-axis)
 */
const BIVARIATE_COLORS: Record<string, Record<string, string>> = {
    'High': {
        'low': '#166534',    // green-800 - best: low rate + high protection
        'mid': '#92400e',    // amber-800
        'high': '#991b1b',   // red-800 - high rate + high protection
    },
    'Mid': {
        'low': '#22c55e',    // green-500
        'mid': '#f59e0b',    // amber-500
        'high': '#ef4444',   // red-500
    },
    'Low': {
        'low': '#86efac',    // green-300 - low rate + low protection
        'mid': '#fcd34d',    // amber-300
        'high': '#fca5a5',   // red-300 - worst: high rate + low protection
    },
};

// Rate thresholds (in $/kWh) for categorization
// Adjusted for better color distribution across utilities
const RATE_THRESHOLDS = {
    low: 0.07,    // Below 7¢/kWh = low rate (green)
    mid: 0.12,    // 7-12¢/kWh = mid rate (amber)
    // Above 12¢ = high rate (red)
};

interface UtilityHeatmapProps {
    filteredTariffs?: EnrichedTariff[];
    colorMode?: 'combined' | 'rate' | 'protection';
    className?: string;
}

interface TooltipData {
    name: string;
    utility?: string;
    rate?: string;
    protection?: 'High' | 'Mid' | 'Low';
    score?: number;
    isUtilityTerritory: boolean;
}

/**
 * Utility Heatmap Component
 *
 * Displays actual utility service territory boundaries from HIFLD data,
 * colored by rate and protection level.
 */
function UtilityHeatmap({
    filteredTariffs = GENERATED_TARIFFS,
    colorMode = 'combined',
    className = '',
}: UtilityHeatmapProps) {
    const [hoveredUtility, setHoveredUtility] = useState<string | null>(null);
    const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
    const [utilityGeoData, setUtilityGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load utility territory GeoJSON
    useEffect(() => {
        fetch(UTILITY_GEO_URL)
            .then(res => res.json())
            .then(data => {
                setUtilityGeoData(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to load utility territories:', err);
                setIsLoading(false);
            });
    }, []);

    // Create tariff lookup by utility name
    const tariffLookup = useMemo(() => {
        const lookup = new Map<string, EnrichedTariff>();
        filteredTariffs.forEach(tariff => {
            lookup.set(tariff.utility, tariff);
        });
        return lookup;
    }, [filteredTariffs]);

    // Get color for a tariff based on rate and protection
    const getTariffColor = (tariff: EnrichedTariff | undefined): string => {
        if (!tariff) return '#e2e8f0'; // slate-200 for no data

        const { blendedRatePerKWh, protectionRating } = tariff;

        // Determine rate category
        let rateCategory: 'low' | 'mid' | 'high';
        if (blendedRatePerKWh <= RATE_THRESHOLDS.low) {
            rateCategory = 'low';
        } else if (blendedRatePerKWh <= RATE_THRESHOLDS.mid) {
            rateCategory = 'mid';
        } else {
            rateCategory = 'high';
        }

        if (colorMode === 'rate') {
            if (rateCategory === 'low') return '#22c55e';
            if (rateCategory === 'mid') return '#f59e0b';
            return '#ef4444';
        }

        if (colorMode === 'protection') {
            if (protectionRating === 'High') return '#166534';
            if (protectionRating === 'Mid') return '#f59e0b';
            return '#fca5a5';
        }

        // Combined bivariate mode
        return BIVARIATE_COLORS[protectionRating][rateCategory];
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading utility territories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Map Container */}
            <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
                <ComposableMap
                    projection="geoAlbersUsa"
                    projectionConfig={{ scale: 1000 }}
                    style={{ width: '100%', height: 'auto' }}
                >
                    <ZoomableGroup center={[-96, 38]} zoom={1}>
                        {/* State boundaries as background */}
                        <Geographies geography={STATE_GEO_URL}>
                            {({ geographies }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={`state-${geo.rsmKey}`}
                                        geography={geo}
                                        fill="#f1f5f9"
                                        stroke="#cbd5e1"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: 'none' },
                                            hover: { outline: 'none' },
                                            pressed: { outline: 'none' },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>

                        {/* Utility territories overlay */}
                        {utilityGeoData && (
                            <Geographies geography={utilityGeoData}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const utilityName = geo.properties?.tariff_utility;
                                        const hifldName = geo.properties?.NAME;
                                        const tariff = utilityName ? tariffLookup.get(utilityName) : undefined;
                                        const fillColor = getTariffColor(tariff);
                                        const isHovered = hoveredUtility === utilityName;
                                        const isSelected = selectedUtility === utilityName;

                                        return (
                                            <Geography
                                                key={`utility-${geo.rsmKey}`}
                                                geography={geo}
                                                fill={fillColor}
                                                stroke={isSelected ? '#1e40af' : isHovered ? '#1e293b' : '#475569'}
                                                strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.75}
                                                style={{
                                                    default: {
                                                        outline: 'none',
                                                        transition: 'all 0.15s',
                                                    },
                                                    hover: {
                                                        outline: 'none',
                                                        filter: 'brightness(0.92)',
                                                        cursor: tariff ? 'pointer' : 'default',
                                                    },
                                                    pressed: {
                                                        outline: 'none',
                                                    },
                                                }}
                                                onMouseEnter={() => {
                                                    setHoveredUtility(utilityName || null);
                                                    if (tariff) {
                                                        setTooltipData({
                                                            name: hifldName || utilityName || 'Unknown',
                                                            utility: tariff.utility,
                                                            rate: (tariff.blendedRatePerKWh * 100).toFixed(2),
                                                            protection: tariff.protectionRating,
                                                            score: tariff.protectionScore,
                                                            isUtilityTerritory: true,
                                                        });
                                                    } else {
                                                        setTooltipData({
                                                            name: hifldName || 'Unknown utility',
                                                            isUtilityTerritory: true,
                                                        });
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredUtility(null);
                                                    setTooltipData(null);
                                                }}
                                                onClick={() => {
                                                    if (tariff && utilityName) {
                                                        setSelectedUtility(selectedUtility === utilityName ? null : utilityName);
                                                    }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        )}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Tooltip */}
                {tooltipData && (
                    <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-xl text-sm max-w-xs z-10">
                        <div className="font-bold text-white text-base mb-2">
                            {tooltipData.utility || tooltipData.name}
                        </div>
                        {tooltipData.rate ? (
                            <div className="space-y-1.5">
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Blended Rate:</span>
                                    <span className="text-blue-400 font-medium">{tooltipData.rate}¢/kWh</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Protection:</span>
                                    <span className={`font-medium ${
                                        tooltipData.protection === 'High' ? 'text-green-400' :
                                        tooltipData.protection === 'Mid' ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                        {tooltipData.score}/19 ({tooltipData.protection})
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-sm">No tariff data available</div>
                        )}
                    </div>
                )}

                {/* Utility count badge */}
                {utilityGeoData && (
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-600 shadow">
                        {utilityGeoData.features.length} utility service territories
                    </div>
                )}
            </div>

            {/* Bivariate Legend */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* 3x3 Color Matrix */}
                    <div className="flex flex-col items-center">
                        <div className="grid grid-cols-3 gap-0.5 relative ml-12">
                            {/* Row labels */}
                            <div className="absolute -left-12 top-0.5 text-xs text-slate-500">High</div>
                            <div className="absolute -left-10 top-[22px] text-xs text-slate-500">Mid</div>
                            <div className="absolute -left-10 top-[44px] text-xs text-slate-500">Low</div>

                            {/* High protection row */}
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.High.low }} title="Low rate + High protection" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.High.mid }} title="Mid rate + High protection" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.High.high }} title="High rate + High protection" />

                            {/* Mid protection row */}
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.Mid.low }} title="Low rate + Mid protection" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.Mid.mid }} title="Mid rate + Mid protection" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.Mid.high }} title="High rate + Mid protection" />

                            {/* Low protection row */}
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.Low.low }} title="Low rate + Low protection" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.Low.mid }} title="Mid rate + Low protection" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: BIVARIATE_COLORS.Low.high }} title="High rate + Low protection" />
                        </div>
                        <div className="flex justify-between w-full mt-1 text-xs text-slate-500 ml-12">
                            <span>Low</span>
                            <span>Rate →</span>
                            <span>High</span>
                        </div>
                    </div>

                    {/* Legend Explanation */}
                    <div className="flex-1 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: BIVARIATE_COLORS.High.low }} />
                            <span className="text-slate-700"><strong>Best:</strong> Low rates + High ratepayer protection</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: BIVARIATE_COLORS.Low.high }} />
                            <span className="text-slate-700"><strong>Caution:</strong> High rates + Low ratepayer protection</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f1f5f9' }} />
                            <span className="text-slate-700"><strong>Gray:</strong> No large load tariff data</span>
                        </div>
                    </div>

                    {/* Rate Thresholds */}
                    <div className="text-xs text-slate-500 space-y-1">
                        <div><strong>Rate thresholds:</strong></div>
                        <div>Low: &lt;7¢/kWh</div>
                        <div>Mid: 7-12¢/kWh</div>
                        <div>High: &gt;12¢/kWh</div>
                    </div>
                </div>
            </div>

            {/* Selected Utility Details */}
            {selectedUtility && tariffLookup.get(selectedUtility) && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">
                            {tariffLookup.get(selectedUtility)?.utility}
                        </h4>
                        <button
                            onClick={() => setSelectedUtility(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {(() => {
                        const tariff = tariffLookup.get(selectedUtility);
                        if (!tariff) return null;
                        return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-500">Blended Rate</div>
                                    <div className="font-semibold text-blue-600">{(tariff.blendedRatePerKWh * 100).toFixed(2)}¢/kWh</div>
                                </div>
                                <div>
                                    <div className="text-slate-500">Annual Cost (100MW)</div>
                                    <div className="font-semibold">${tariff.annualCostM.toFixed(1)}M</div>
                                </div>
                                <div>
                                    <div className="text-slate-500">Protection Score</div>
                                    <div className={`font-semibold ${
                                        tariff.protectionRating === 'High' ? 'text-green-600' :
                                        tariff.protectionRating === 'Mid' ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                        {tariff.protectionScore}/19 ({tariff.protectionRating})
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-500">ISO/RTO</div>
                                    <div className="font-semibold">{tariff.iso_rto || 'None'}</div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

export default memo(UtilityHeatmap);
