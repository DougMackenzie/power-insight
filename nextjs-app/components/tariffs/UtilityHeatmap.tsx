'use client';

import { useState, useMemo, memo } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
} from 'react-simple-maps';
import { GENERATED_TARIFFS, type EnrichedTariff } from '@/lib/generatedTariffData';

// TopoJSON URL for US states
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS code to state abbreviation mapping
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

// Multi-state utility mapping
const MULTI_STATE_UTILITIES: Record<string, string[]> = {
    'TVA': ['TN', 'AL', 'KY', 'MS', 'GA', 'NC', 'VA'],
    'Entergy': ['LA', 'AR', 'MS', 'TX'],
    'Duke Energy': ['NC', 'SC', 'FL', 'IN', 'OH', 'KY'],
    'AEP': ['OH', 'TX', 'WV', 'VA', 'IN', 'MI', 'KY', 'TN', 'OK'],
    'Dominion Energy': ['VA', 'NC', 'SC'],
    'Southern Company': ['GA', 'AL', 'MS', 'FL'],
    'FirstEnergy': ['OH', 'PA', 'NJ', 'WV', 'MD'],
    'Xcel Energy': ['MN', 'CO', 'TX', 'NM', 'WI', 'ND', 'SD', 'MI'],
};

/**
 * Bivariate color matrix for rate (x-axis) vs protection (y-axis)
 *
 * Rate →        Low            Mid            High
 * Protection ↓
 * High        Dark Green     Dark Amber     Dark Red
 * Mid         Med Green      Med Amber      Med Red
 * Low         Light Green    Light Amber    Light Red
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
const RATE_THRESHOLDS = {
    low: 0.06,    // Below 6¢/kWh = low rate
    mid: 0.10,    // 6-10¢/kWh = mid rate
    // Above 10¢ = high rate
};

interface StateData {
    state: string;
    bestRate: number;
    bestProtection: 'High' | 'Mid' | 'Low';
    bestProtectionScore: number;
    utilities: EnrichedTariff[];
    bestUtility: EnrichedTariff;
}

interface UtilityHeatmapProps {
    filteredTariffs?: EnrichedTariff[];
    colorMode?: 'combined' | 'rate' | 'protection';
    onStateClick?: (stateData: StateData) => void;
    className?: string;
}

/**
 * Utility Heatmap Component
 *
 * Displays a bivariate choropleth map showing utility rates and protection levels
 * by state. Uses the best available utility in each state for coloring.
 */
function UtilityHeatmap({
    filteredTariffs = GENERATED_TARIFFS,
    colorMode = 'combined',
    onStateClick,
    className = '',
}: UtilityHeatmapProps) {
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);

    // Aggregate tariff data by state
    const stateData = useMemo(() => {
        const stateMap = new Map<string, EnrichedTariff[]>();

        filteredTariffs.forEach(tariff => {
            // Handle multi-state utilities
            const states = tariff.state.split('/').map(s => s.trim());

            // Check if it's a known multi-state utility
            const multiStates = MULTI_STATE_UTILITIES[tariff.utility];
            const allStates = multiStates || states;

            allStates.forEach(state => {
                if (!stateMap.has(state)) {
                    stateMap.set(state, []);
                }
                stateMap.get(state)!.push(tariff);
            });
        });

        // Convert to StateData objects
        const result: Record<string, StateData> = {};

        stateMap.forEach((utilities, state) => {
            // Find best utility (lowest rate with reasonable protection)
            // Sort by: protection score descending, then rate ascending
            const sortedUtilities = [...utilities].sort((a, b) => {
                // Prioritize lower rates
                const rateDiff = a.blendedRatePerKWh - b.blendedRatePerKWh;
                if (Math.abs(rateDiff) > 0.01) return rateDiff;
                // If rates are similar, prioritize higher protection
                return b.protectionScore - a.protectionScore;
            });

            const bestUtility = sortedUtilities[0];

            result[state] = {
                state,
                bestRate: bestUtility.blendedRatePerKWh,
                bestProtection: bestUtility.protectionRating,
                bestProtectionScore: bestUtility.protectionScore,
                utilities,
                bestUtility,
            };
        });

        return result;
    }, [filteredTariffs]);

    // Get color for a state based on rate and protection
    const getStateColor = (stateAbbr: string): string => {
        const data = stateData[stateAbbr];
        if (!data) return '#e2e8f0'; // slate-200 for no data

        const { bestRate, bestProtection } = data;

        // Determine rate category
        let rateCategory: 'low' | 'mid' | 'high';
        if (bestRate <= RATE_THRESHOLDS.low) {
            rateCategory = 'low';
        } else if (bestRate <= RATE_THRESHOLDS.mid) {
            rateCategory = 'mid';
        } else {
            rateCategory = 'high';
        }

        if (colorMode === 'rate') {
            // Rate-only mode: green gradient
            if (rateCategory === 'low') return '#22c55e';
            if (rateCategory === 'mid') return '#f59e0b';
            return '#ef4444';
        }

        if (colorMode === 'protection') {
            // Protection-only mode
            if (bestProtection === 'High') return '#166534';
            if (bestProtection === 'Mid') return '#f59e0b';
            return '#fca5a5';
        }

        // Combined bivariate mode
        return BIVARIATE_COLORS[bestProtection][rateCategory];
    };

    // Get tooltip content for a state
    const getTooltipContent = (stateAbbr: string) => {
        const data = stateData[stateAbbr];
        if (!data) return null;

        return {
            state: stateAbbr,
            utility: data.bestUtility.utility,
            rate: (data.bestRate * 100).toFixed(2),
            protection: data.bestProtection,
            score: data.bestProtectionScore,
            utilityCount: data.utilities.length,
        };
    };

    const tooltipData = hoveredState ? getTooltipContent(hoveredState) : null;

    return (
        <div className={`relative ${className}`}>
            {/* Map Container */}
            <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
                <ComposableMap
                    projection="geoAlbersUsa"
                    projectionConfig={{ scale: 1000 }}
                    style={{ width: '100%', height: 'auto' }}
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const fips = geo.id;
                                const stateAbbr = FIPS_TO_STATE[fips] || '';
                                const isHovered = hoveredState === stateAbbr;
                                const isSelected = selectedState === stateAbbr;
                                const hasData = stateData[stateAbbr] !== undefined;
                                const fillColor = getStateColor(stateAbbr);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={fillColor}
                                        stroke={isSelected ? '#1e40af' : isHovered ? '#475569' : '#94a3b8'}
                                        strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.5}
                                        style={{
                                            default: {
                                                outline: 'none',
                                                transition: 'all 0.2s',
                                            },
                                            hover: {
                                                outline: 'none',
                                                filter: 'brightness(0.9)',
                                                cursor: hasData ? 'pointer' : 'default',
                                            },
                                            pressed: {
                                                outline: 'none',
                                            },
                                        }}
                                        onMouseEnter={() => setHoveredState(stateAbbr)}
                                        onMouseLeave={() => setHoveredState(null)}
                                        onClick={() => {
                                            if (hasData) {
                                                setSelectedState(stateAbbr === selectedState ? null : stateAbbr);
                                                if (onStateClick && stateData[stateAbbr]) {
                                                    onStateClick(stateData[stateAbbr]);
                                                }
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ComposableMap>

                {/* Tooltip */}
                {tooltipData && (
                    <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-xl text-sm max-w-xs">
                        <div className="font-bold text-white text-base mb-2">
                            {tooltipData.state}
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Best Utility:</span>
                                <span className="text-white font-medium truncate max-w-[120px]">{tooltipData.utility}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Best Rate:</span>
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
                            {tooltipData.utilityCount > 1 && (
                                <div className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-700">
                                    +{tooltipData.utilityCount - 1} more utilities in this state
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bivariate Legend */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* 3x3 Color Matrix */}
                    <div className="flex flex-col items-center">
                        <div className="text-xs text-slate-500 mb-1 -rotate-90 absolute -left-8 top-1/2 transform -translate-y-1/2 hidden md:block">
                            Protection →
                        </div>
                        <div className="grid grid-cols-3 gap-0.5 relative">
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
                        <div className="flex justify-between w-full mt-1 text-xs text-slate-500">
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
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e2e8f0' }} />
                            <span className="text-slate-700"><strong>No data:</strong> No large load tariffs in database</span>
                        </div>
                    </div>

                    {/* Rate Thresholds */}
                    <div className="text-xs text-slate-500 space-y-1">
                        <div><strong>Rate thresholds:</strong></div>
                        <div>Low: &lt;6¢/kWh</div>
                        <div>Mid: 6-10¢/kWh</div>
                        <div>High: &gt;10¢/kWh</div>
                    </div>
                </div>
            </div>

            {/* Selected State Details */}
            {selectedState && stateData[selectedState] && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">
                            Utilities in {selectedState}
                        </h4>
                        <button
                            onClick={() => setSelectedState(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-2">
                        {stateData[selectedState].utilities
                            .sort((a, b) => a.blendedRatePerKWh - b.blendedRatePerKWh)
                            .map((utility, idx) => (
                                <div
                                    key={utility.id}
                                    className={`flex items-center justify-between p-2 rounded ${
                                        idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                                    }`}
                                >
                                    <div>
                                        <span className="font-medium text-slate-900">{utility.utility}</span>
                                        {idx === 0 && (
                                            <span className="ml-2 text-xs text-green-600 font-medium">Best Rate</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-blue-600 font-medium">
                                            {(utility.blendedRatePerKWh * 100).toFixed(2)}¢/kWh
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            utility.protectionRating === 'High' ? 'bg-green-100 text-green-700' :
                                            utility.protectionRating === 'Mid' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {utility.protectionScore}/19
                                        </span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(UtilityHeatmap);
