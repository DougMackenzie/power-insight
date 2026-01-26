'use client';

/**
 * Energy View Page
 * Visualizes hourly load profiles and load duration curves
 *
 * This is an illustrative visualization to articulate the framework.
 * Load shapes are representative of typical utility patterns.
 */

import { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { useCalculator } from '@/hooks/useCalculator';
import { formatMW } from '@/lib/constants';
import Link from 'next/link';

// Colors matching the reference images
const COLORS = {
    baseGrid: '#E5E7EB',        // Light gray
    baseGridStroke: '#9CA3AF',  // Gray stroke
    firmDC: '#86EFAC',          // Light green
    firmDCStroke: '#22C55E',    // Green stroke
    flexBonus: '#166534',       // Dark green
    gridCapacity: '#DC2626',    // Red
    shiftedHatch: '#7C3AED',    // Purple for hatched area
};

/**
 * Generate realistic summer peak day load profile
 *
 * Logic:
 * - DC wants to run at flexLoadFactor (95%) whenever possible
 * - Grid capacity = systemPeakMW + (firmDC baseline allocation)
 * - DC serves as much as grid headroom allows
 * - When DC wants > headroom, the excess becomes "shifted workload"
 * - Solid colors show only what's actually served (below grid capacity)
 * - Hatched area shows what would exceed grid capacity
 */
function generatePeakDayProfile(
    systemPeakMW: number,
    dcCapacityMW: number,
    firmLoadFactor: number,
    flexLoadFactor: number,
) {
    // Typical summer peak day shape based on ERCOT/PJM data
    // Normalized to 1.0 at system peak (usually 3-5 PM)
    const hourlyShape = [
        0.62, 0.58, 0.55, 0.53, 0.52, 0.54, // 12am-6am (overnight low)
        0.60, 0.68, 0.76, 0.84, 0.90, 0.94, // 6am-12pm (morning ramp)
        0.97, 0.99, 1.00, 1.00, 0.99, 0.96, // 12pm-6pm (afternoon peak plateau)
        0.90, 0.82, 0.75, 0.70, 0.66, 0.64, // 6pm-12am (evening decline)
    ];

    // DC operating parameters
    const dcMaxWants = dcCapacityMW * flexLoadFactor;  // 95% - what flex DC wants to draw
    const dcFirmBaseline = dcCapacityMW * firmLoadFactor; // 80% - firm DC baseline for comparison

    // Grid capacity is sized for system peak + firm DC allocation
    // This is the infrastructure constraint
    const gridCapacity = systemPeakMW + dcFirmBaseline;

    return hourlyShape.map((shape, hour) => {
        const hourLabel = hour === 0 ? '12 AM' :
                         hour < 12 ? `${hour} AM` :
                         hour === 12 ? '12 PM' :
                         `${hour - 12} PM`;

        // Base grid load follows the daily shape
        const baseGrid = systemPeakMW * shape;

        // How much headroom is available for DC after serving base grid?
        const headroomForDC = Math.max(0, gridCapacity - baseGrid);

        // DC serves as much as it can, limited by what it wants OR grid headroom
        const dcActuallyServed = Math.min(dcMaxWants, headroomForDC);

        // What gets shifted/curtailed? Only if DC wants more than headroom allows
        const shiftedWorkload = Math.max(0, dcMaxWants - headroomForDC);

        // Break down dcActuallyServed into firm (baseline) vs flex bonus
        // firmDC = up to the 80% baseline that firm DC would have drawn
        // flexBonus = any additional DC served beyond that baseline
        const firmDC = Math.min(dcFirmBaseline, dcActuallyServed);
        const flexBonus = Math.max(0, dcActuallyServed - dcFirmBaseline);

        return {
            hour,
            hourLabel,
            baseGrid,
            firmDC,
            flexBonus,
            shiftedWorkload,
            gridCapacity,
            // For tooltip
            dcActuallyServed,
            dcMaxWants,
            headroomForDC,
        };
    });
}

/**
 * Generate annual load duration curve (8760 hours sorted by BASE GRID load)
 *
 * A proper load duration curve:
 * 1. Generates 8760 hours of base grid load with seasonal/daily variation
 * 2. Sorts BASE GRID values from highest to lowest (creates smooth monotonic curve)
 * 3. For each sorted position, calculates DC service based on headroom
 *
 * This ensures the gray base grid area is a smooth decreasing curve,
 * with DC layers stacked on top based on available headroom.
 */
function generateLoadDurationCurve(
    systemPeakMW: number,
    dcCapacityMW: number,
    firmLoadFactor: number,
    flexLoadFactor: number,
) {
    const hours = 8760;

    // DC parameters
    const dcMaxWants = dcCapacityMW * flexLoadFactor;
    const dcFirmBaseline = dcCapacityMW * firmLoadFactor;
    const gridCapacity = systemPeakMW + dcFirmBaseline;

    // Daily shape (same as peak day - based on ERCOT/PJM patterns)
    const dailyShape = [
        0.62, 0.58, 0.55, 0.53, 0.52, 0.54,
        0.60, 0.68, 0.76, 0.84, 0.90, 0.94,
        0.97, 0.99, 1.00, 1.00, 0.99, 0.96,
        0.90, 0.82, 0.75, 0.70, 0.66, 0.64,
    ];

    // Use seeded random for consistency across renders
    let seed = 12345;
    const seededRandom = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };

    // Step 1: Generate all 8760 hours of BASE GRID load
    const baseGridValues: number[] = [];

    for (let h = 0; h < hours; h++) {
        const dayOfYear = Math.floor(h / 24);
        const hourOfDay = h % 24;

        // Seasonal factor: summer peak around day 180 (late June)
        const dayAngle = (dayOfYear - 180) * Math.PI / 182.5;
        const summerFactor = Math.cos(dayAngle);

        // Winter has secondary peak, spring/fall lowest
        // Range: ~0.65-1.0 with summer peak
        const seasonalFactor = 0.75 + 0.25 * Math.max(summerFactor, summerFactor * 0.3 + 0.2);

        // Daily shape factor
        const dailyFactor = dailyShape[hourOfDay];

        // Weekend reduction (~12% lower)
        const dayOfWeek = dayOfYear % 7;
        const weekendFactor = (dayOfWeek === 5 || dayOfWeek === 6) ? 0.88 : 1.0;

        // Weather-driven random variation (+/- 5%)
        const randomFactor = 0.95 + seededRandom() * 0.10;

        // Combined load factor
        const loadFactor = seasonalFactor * dailyFactor * weekendFactor * randomFactor;
        baseGridValues.push(systemPeakMW * loadFactor);
    }

    // Step 2: Sort BASE GRID values from highest to lowest
    // This creates the smooth monotonically decreasing load duration curve
    const sortedBaseGrid = [...baseGridValues].sort((a, b) => b - a);

    // Step 3: Sample at intervals and calculate DC for each point
    const samples = 200;
    const result = [];

    for (let i = 0; i < samples; i++) {
        const idx = Math.floor((i / samples) * hours);
        const hourNumber = Math.round((i / samples) * hours);

        // Get the sorted base grid value at this position
        const baseGrid = sortedBaseGrid[idx];

        // Calculate DC service based on headroom at this base grid level
        const headroomForDC = Math.max(0, gridCapacity - baseGrid);
        const dcServed = Math.min(dcMaxWants, headroomForDC);
        const shiftedWorkload = Math.max(0, dcMaxWants - headroomForDC);

        // Break down DC into firm baseline vs flex bonus
        const firmDC = Math.min(dcFirmBaseline, dcServed);
        const flexBonus = Math.max(0, dcServed - dcFirmBaseline);

        result.push({
            hourNumber,
            percentile: (i / samples) * 100,
            baseGrid,
            firmDC,
            flexBonus,
            shiftedWorkload,
            gridCapacity,
            dcServed,
        });
    }

    return result;
}

// Custom tooltip for peak day
const PeakDayTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm min-w-[200px]">
            <p className="font-bold text-gray-900 mb-2 border-b pb-1">{label}</p>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-600">Base Grid:</span>
                    <span className="font-medium">{formatMW(data.baseGrid)}</span>
                </div>
                <div className="flex justify-between">
                    <span style={{ color: COLORS.firmDCStroke }}>Firm Data Center:</span>
                    <span className="font-medium" style={{ color: COLORS.firmDCStroke }}>+{formatMW(data.firmDC)}</span>
                </div>
                {data.flexBonus > 0 && (
                    <div className="flex justify-between">
                        <span style={{ color: COLORS.flexBonus }}>Flex Bonus:</span>
                        <span className="font-medium" style={{ color: COLORS.flexBonus }}>+{formatMW(data.flexBonus)}</span>
                    </div>
                )}
                <div className="border-t pt-1 mt-1 text-xs text-gray-500">
                    DC Served: {formatMW(data.dcActuallyServed)} of {formatMW(data.dcMaxWants)} wanted
                </div>
                {data.shiftedWorkload > 0 && (
                    <div className="flex justify-between text-purple-600 font-medium">
                        <span>Shifted:</span>
                        <span>{formatMW(data.shiftedWorkload)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Custom tooltip for load duration curve
const DurationCurveTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm min-w-[200px]">
            <p className="font-bold text-gray-900 mb-2 border-b pb-1">Hour #{data.hourNumber.toLocaleString()}</p>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-600">Base Grid:</span>
                    <span className="font-medium">{formatMW(data.baseGrid)}</span>
                </div>
                <div className="flex justify-between">
                    <span style={{ color: COLORS.firmDCStroke }}>Firm Data Center:</span>
                    <span className="font-medium" style={{ color: COLORS.firmDCStroke }}>+{formatMW(data.firmDC)}</span>
                </div>
                {data.flexBonus > 0 && (
                    <div className="flex justify-between">
                        <span style={{ color: COLORS.flexBonus }}>Flex Bonus:</span>
                        <span className="font-medium" style={{ color: COLORS.flexBonus }}>+{formatMW(data.flexBonus)}</span>
                    </div>
                )}
                {data.shiftedWorkload > 0 && (
                    <div className="flex justify-between text-purple-600 font-medium">
                        <span>Shifted:</span>
                        <span>{formatMW(data.shiftedWorkload)}</span>
                    </div>
                )}
                <div className="border-t pt-1 mt-1 text-xs text-gray-500">
                    Grid Limit: {formatMW(data.gridCapacity)}
                </div>
            </div>
        </div>
    );
};

export default function EnergyViewPage() {
    const { utility, dataCenter } = useCalculator();

    const [activeTab, setActiveTab] = useState<'peak' | 'duration'>('peak');
    const [showShiftedWorkload, setShowShiftedWorkload] = useState(true);

    // Generate chart data
    const peakDayData = useMemo(() => {
        return generatePeakDayProfile(
            utility.systemPeakMW,
            dataCenter.capacityMW,
            dataCenter.firmLoadFactor,
            dataCenter.flexLoadFactor,
        );
    }, [utility.systemPeakMW, dataCenter.capacityMW, dataCenter.firmLoadFactor, dataCenter.flexLoadFactor]);

    const durationCurveData = useMemo(() => {
        return generateLoadDurationCurve(
            utility.systemPeakMW,
            dataCenter.capacityMW,
            dataCenter.firmLoadFactor,
            dataCenter.flexLoadFactor,
        );
    }, [utility.systemPeakMW, dataCenter.capacityMW, dataCenter.firmLoadFactor, dataCenter.flexLoadFactor]);

    // Calculate key metrics
    const metrics = useMemo(() => {
        const dcFirmBaseline = dataCenter.capacityMW * dataCenter.firmLoadFactor;
        const dcMaxWants = dataCenter.capacityMW * dataCenter.flexLoadFactor;
        const gridCapacity = utility.systemPeakMW + dcFirmBaseline;

        // The "flex bonus" is the extra DC we can serve beyond firm baseline
        // when there's grid headroom available
        const maxFlexBonus = dcMaxWants - dcFirmBaseline;

        // Calculate hours where shifting occurs and energy metrics
        const hoursWithShifting = peakDayData.filter(d => d.shiftedWorkload > 0).length;
        const peakShiftedMW = Math.max(...peakDayData.map(d => d.shiftedWorkload));

        // Annual flex bonus energy (hours where flex bonus is captured)
        const annualFlexBonusHours = durationCurveData.filter(d => d.flexBonus > 0).length * (8760 / 200);
        const avgFlexBonus = durationCurveData.reduce((sum, d) => sum + d.flexBonus, 0) / durationCurveData.length;
        const annualFlexBonusMWh = avgFlexBonus * 8760;

        return {
            dcFirmBaseline,
            dcMaxWants,
            gridCapacity,
            maxFlexBonus,
            hoursWithShifting,
            peakShiftedMW,
            annualFlexBonusHours,
            annualFlexBonusMWh,
        };
    }, [utility.systemPeakMW, dataCenter, peakDayData, durationCurveData]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                    <Link href="/calculator" className="hover:text-white">Calculator</Link>
                    <span>/</span>
                    <span>Energy View</span>
                </div>
                <h1 className="text-3xl font-bold mb-4">Energy View: Load Profile Visualization</h1>
                <p className="text-lg text-slate-300 max-w-3xl">
                    Illustrative visualization showing how flexible data center operations affect grid load patterns.
                    These representative profiles demonstrate the framework for understanding capacity benefits.
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Grid Capacity</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMW(metrics.gridCapacity)}</p>
                    <p className="text-xs text-gray-400">System Peak + Firm Data Center</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700">Firm Data Center Baseline</p>
                    <p className="text-2xl font-bold text-green-600">{formatMW(metrics.dcFirmBaseline)}</p>
                    <p className="text-xs text-green-500">{dataCenter.capacityMW} MW @ {(dataCenter.firmLoadFactor * 100).toFixed(0)}% LF</p>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                    <p className="text-sm text-emerald-700">Max Flex Bonus</p>
                    <p className="text-2xl font-bold text-emerald-600">+{formatMW(metrics.maxFlexBonus)}</p>
                    <p className="text-xs text-emerald-500">Additional when headroom exists</p>
                </div>
                <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                    <p className="text-sm text-purple-700">Peak Shifted Load</p>
                    <p className="text-2xl font-bold text-purple-600">{formatMW(metrics.peakShiftedMW)}</p>
                    <p className="text-xs text-purple-500">{metrics.hoursWithShifting} peak hours/day</p>
                </div>
            </div>

            {/* Chart Container */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Tabs and Controls */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('peak')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === 'peak'
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Peak Summer Day
                        </button>
                        <button
                            onClick={() => setActiveTab('duration')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === 'duration'
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Annual Load Curve
                        </button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showShiftedWorkload}
                            onChange={(e) => setShowShiftedWorkload(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-600">Show Shifted Workload</span>
                    </label>
                </div>

                {/* Peak Day Chart */}
                {activeTab === 'peak' && (
                    <div className="p-6">
                        <ResponsiveContainer width="100%" height={450}>
                            <AreaChart data={peakDayData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                <defs>
                                    <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                        <line x1="0" y1="0" x2="0" y2="8" stroke={COLORS.shiftedHatch} strokeWidth="2" />
                                    </pattern>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="hourLabel"
                                    tick={{ fill: '#6B7280', fontSize: 11 }}
                                    interval={1}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                                    domain={[0, 'auto']}
                                    label={{
                                        value: 'Megawatts (MW)',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fill: '#6B7280', fontSize: 12 },
                                        offset: 10,
                                    }}
                                />
                                <Tooltip content={<PeakDayTooltip />} />

                                {/* Base Grid - bottom layer (gray) */}
                                <Area
                                    type="monotone"
                                    dataKey="baseGrid"
                                    name="Base Grid"
                                    stackId="main"
                                    fill={COLORS.baseGrid}
                                    stroke={COLORS.baseGridStroke}
                                    strokeWidth={1}
                                />

                                {/* Firm DC Load - stacked on base (light green) */}
                                <Area
                                    type="monotone"
                                    dataKey="firmDC"
                                    name="Firm DC"
                                    stackId="main"
                                    fill={COLORS.firmDC}
                                    stroke={COLORS.firmDCStroke}
                                    strokeWidth={1}
                                />

                                {/* Flex Bonus - additional DC when headroom exists (dark green) */}
                                <Area
                                    type="monotone"
                                    dataKey="flexBonus"
                                    name="Flex Bonus"
                                    stackId="main"
                                    fill={COLORS.flexBonus}
                                    stroke={COLORS.flexBonus}
                                    strokeWidth={1}
                                />

                                {/* Shifted Workload - load that would exceed grid capacity (hatched purple) */}
                                {showShiftedWorkload && (
                                    <Area
                                        type="monotone"
                                        dataKey="shiftedWorkload"
                                        name="Shifted Workload"
                                        stackId="main"
                                        fill="url(#hatchPattern)"
                                        stroke={COLORS.shiftedHatch}
                                        strokeWidth={2}
                                        strokeDasharray="6 3"
                                    />
                                )}

                                {/* Grid Capacity Line (red dashed) */}
                                <ReferenceLine
                                    y={metrics.gridCapacity}
                                    stroke={COLORS.gridCapacity}
                                    strokeWidth={2}
                                    strokeDasharray="8 4"
                                    label={{
                                        value: 'Grid Capacity',
                                        position: 'right',
                                        fill: COLORS.gridCapacity,
                                        fontSize: 11,
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.baseGrid, border: `1px solid ${COLORS.baseGridStroke}` }}></div>
                                <span className="text-sm text-gray-600">Base Grid Load</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.firmDC, border: `1px solid ${COLORS.firmDCStroke}` }}></div>
                                <span className="text-sm text-gray-600">Firm Data Center ({formatMW(metrics.dcFirmBaseline)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.flexBonus }}></div>
                                <span className="text-sm text-gray-600">Flex Bonus (up to +{formatMW(metrics.maxFlexBonus)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ background: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${COLORS.shiftedHatch} 2px, ${COLORS.shiftedHatch} 4px)` }}></div>
                                <span className="text-sm text-gray-600">Shifted Workload</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-0.5" style={{ borderTop: `2px dashed ${COLORS.gridCapacity}` }}></div>
                                <span className="text-sm text-gray-600">Grid Capacity</span>
                            </div>
                        </div>

                        {/* Annotation */}
                        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-800">
                                <strong>Load Shifting:</strong> During {metrics.hoursWithShifting} afternoon peak hours,
                                flexible data centers shift up to {formatMW(metrics.peakShiftedMW)} of workload to off-peak hours
                                when the combined load (base grid + data center) would exceed grid capacity. This enables the data center to
                                capture {formatMW(metrics.maxFlexBonus)} more energy during off-peak hours.
                            </p>
                        </div>
                    </div>
                )}

                {/* Annual Load Duration Curve */}
                {activeTab === 'duration' && (
                    <div className="p-6">
                        <ResponsiveContainer width="100%" height={450}>
                            <AreaChart data={durationCurveData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                <defs>
                                    <pattern id="hatchPatternDuration" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                        <line x1="0" y1="0" x2="0" y2="8" stroke={COLORS.shiftedHatch} strokeWidth="2" />
                                    </pattern>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="hourNumber"
                                    tick={{ fill: '#6B7280', fontSize: 11 }}
                                    tickFormatter={(v) => v.toLocaleString()}
                                    label={{
                                        value: 'Hours (sorted by load, descending)',
                                        position: 'bottom',
                                        style: { fill: '#6B7280', fontSize: 12 },
                                        offset: 20,
                                    }}
                                />
                                <YAxis
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                                    domain={[0, 'auto']}
                                    label={{
                                        value: 'Megawatts (MW)',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: { fill: '#6B7280', fontSize: 12 },
                                        offset: 10,
                                    }}
                                />
                                <Tooltip content={<DurationCurveTooltip />} />

                                {/* Base Grid (gray) */}
                                <Area
                                    type="monotone"
                                    dataKey="baseGrid"
                                    name="Base Grid"
                                    stackId="main"
                                    fill={COLORS.baseGrid}
                                    stroke={COLORS.baseGridStroke}
                                    strokeWidth={1}
                                />

                                {/* Firm DC (light green) */}
                                <Area
                                    type="monotone"
                                    dataKey="firmDC"
                                    name="Firm DC"
                                    stackId="main"
                                    fill={COLORS.firmDC}
                                    stroke={COLORS.firmDCStroke}
                                    strokeWidth={1}
                                />

                                {/* Flex Bonus - The "Profit Wedge" (dark green) */}
                                <Area
                                    type="monotone"
                                    dataKey="flexBonus"
                                    name="Flex Bonus"
                                    stackId="main"
                                    fill={COLORS.flexBonus}
                                    stroke={COLORS.flexBonus}
                                    strokeWidth={1}
                                />

                                {/* Shifted workload - above grid capacity (hatched purple) */}
                                {showShiftedWorkload && (
                                    <Area
                                        type="monotone"
                                        dataKey="shiftedWorkload"
                                        name="Shifted"
                                        stackId="main"
                                        fill="url(#hatchPatternDuration)"
                                        stroke={COLORS.shiftedHatch}
                                        strokeWidth={2}
                                        strokeDasharray="6 3"
                                    />
                                )}

                                {/* Grid Capacity Line (red dashed) */}
                                <ReferenceLine
                                    y={metrics.gridCapacity}
                                    stroke={COLORS.gridCapacity}
                                    strokeWidth={2}
                                    strokeDasharray="8 4"
                                />
                            </AreaChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.baseGrid, border: `1px solid ${COLORS.baseGridStroke}` }}></div>
                                <span className="text-sm text-gray-600">Base Grid Load</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.firmDC, border: `1px solid ${COLORS.firmDCStroke}` }}></div>
                                <span className="text-sm text-gray-600">Firm Data Center</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.flexBonus }}></div>
                                <span className="text-sm text-gray-600">Flex Bonus ("Profit Wedge")</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ background: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${COLORS.shiftedHatch} 2px, ${COLORS.shiftedHatch} 4px)` }}></div>
                                <span className="text-sm text-gray-600">Shifted Workload</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-0.5" style={{ borderTop: `2px dashed ${COLORS.gridCapacity}` }}></div>
                                <span className="text-sm text-gray-600">Grid Capacity Limit</span>
                            </div>
                        </div>

                        {/* The "Profit Wedge" Annotation */}
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900 mb-1">The "Profit Wedge"</p>
                            <p className="text-sm text-green-800">
                                The dark green area represents additional energy captured when grid headroom allows the data center
                                to run above its firm baseline ({(dataCenter.firmLoadFactor * 100).toFixed(0)}% LF) up to its
                                flexible capacity ({(dataCenter.flexLoadFactor * 100).toFixed(0)}% LF). This unlocks
                                approximately <strong>{(metrics.annualFlexBonusMWh / 1000000).toFixed(2)} million MWh</strong> of
                                additional annual energy sales. The purple hatched area shows load that must be shifted to
                                off-peak hours when grid capacity is constrained.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Methodology Note */}
            <div className="bg-slate-100 rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-3">About This Visualization</h3>
                <p className="text-sm text-slate-700 mb-3">
                    These charts are <strong>illustrative representations</strong> designed to communicate the framework
                    for understanding how flexible data center operations benefit grid capacity. Key assumptions:
                </p>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                    <li>Grid capacity = system peak ({formatMW(utility.systemPeakMW)}) + firm data center baseline ({formatMW(metrics.dcFirmBaseline)})</li>
                    <li>Data center wants to run at {(dataCenter.flexLoadFactor * 100).toFixed(0)}% load factor whenever grid headroom allows</li>
                    <li>When base grid + data center would exceed capacity, data center shifts load to off-peak hours</li>
                    <li>Base grid follows typical summer peak day shape (ERCOT/PJM patterns)</li>
                    <li>Annual curve includes seasonal, daily, weekend, and weather variation</li>
                </ul>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">Continue Exploring</h3>
                        <p className="text-sm text-gray-600">See bill impacts or review detailed methodology</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/calculator"
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Bill Calculator
                        </Link>
                        <Link
                            href="/methodology"
                            className="px-4 py-2 text-white bg-slate-700 rounded-lg hover:bg-slate-600"
                        >
                            View Methodology
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
