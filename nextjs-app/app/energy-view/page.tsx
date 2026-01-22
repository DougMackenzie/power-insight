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

// Generate realistic summer peak day load profile
// Based on typical utility load shapes (ERCOT, PJM patterns)
function generatePeakDayProfile(
    systemPeakMW: number,
    dcCapacityMW: number,
    firmLoadFactor: number,
    flexLoadFactor: number,
    flexPeakCoincidence: number,
) {
    // Typical summer peak day shape - smoother curve
    // Based on actual utility load patterns
    const hourlyShape = [
        0.62, 0.58, 0.55, 0.53, 0.52, 0.54, // 12am-6am (overnight low)
        0.60, 0.68, 0.76, 0.84, 0.90, 0.94, // 6am-12pm (morning ramp)
        0.97, 0.99, 1.00, 1.00, 0.99, 0.96, // 12pm-6pm (afternoon peak plateau)
        0.90, 0.82, 0.75, 0.70, 0.66, 0.64, // 6pm-12am (evening decline)
    ];

    // Peak hours when curtailment would occur (roughly 12pm-8pm on peak day)
    const peakHours = [12, 13, 14, 15, 16, 17, 18, 19];

    // Data center load is relatively flat (high load factor)
    // Firm DC runs at constant firmLoadFactor
    const firmDCConstant = dcCapacityMW * firmLoadFactor;

    // Flexible DC can run higher (flexLoadFactor) but curtails during peaks
    const flexDCOffPeak = dcCapacityMW * flexLoadFactor;
    const flexDCAtPeak = dcCapacityMW * flexLoadFactor * flexPeakCoincidence;
    const curtailmentMW = flexDCOffPeak - flexDCAtPeak;

    // Calculate the "flex bonus" - additional capacity that can be served
    // Because flex DC only uses 75% at peak, same grid can serve more DC
    const flexBonusCapacity = dcCapacityMW * flexLoadFactor * (1 - flexPeakCoincidence) / flexPeakCoincidence;

    return hourlyShape.map((shape, hour) => {
        const isPeakHour = peakHours.includes(hour);
        const hourLabel = hour === 0 ? '12 AM' :
                         hour < 12 ? `${hour} AM` :
                         hour === 12 ? '12 PM' :
                         `${hour - 12} PM`;

        // Base grid load follows the daily shape
        const baseGrid = systemPeakMW * shape;

        // Firm DC is constant throughout
        const firmDC = firmDCConstant;

        // Flex bonus represents additional capacity unlocked
        // During off-peak: can run at higher load factor
        // During peak: represents the headroom created by curtailment
        const flexBonus = isPeakHour ? 0 : (flexDCOffPeak - firmDCConstant);

        // Shifted workload - only shows during peak hours
        // This is the load that would exceed grid capacity if not curtailed
        const shiftedWorkload = isPeakHour ? curtailmentMW : 0;

        // Grid capacity line (what the grid can handle)
        const gridCapacity = systemPeakMW + firmDCConstant;

        return {
            hour,
            hourLabel,
            baseGrid,
            firmDC,
            flexBonus,
            shiftedWorkload,
            gridCapacity,
            // For tooltip
            totalFirm: baseGrid + firmDC,
            totalFlex: baseGrid + firmDC + flexBonus,
            isPeakHour,
        };
    });
}

// Generate load duration curve (8760 hours sorted by load)
function generateLoadDurationCurve(
    systemPeakMW: number,
    dcCapacityMW: number,
    firmLoadFactor: number,
    flexLoadFactor: number,
    flexPeakCoincidence: number,
) {
    const hours = 8760;
    const hourlyData: { existing: number; withFirmDC: number; withFlexDC: number; curtailed: number }[] = [];

    // Generate synthetic annual load profile
    for (let h = 0; h < hours; h++) {
        const dayOfYear = Math.floor(h / 24);
        const hourOfDay = h % 24;

        // Seasonal factor (summer peak, winter secondary peak, spring/fall lower)
        const dayAngle = (dayOfYear - 172) * Math.PI / 182.5; // Peak around day 172 (late June)
        const seasonalFactor = 0.65 + 0.35 * Math.cos(dayAngle);

        // Daily shape
        const hourlyShape = [
            0.62, 0.58, 0.55, 0.53, 0.52, 0.54,
            0.60, 0.68, 0.76, 0.84, 0.90, 0.94,
            0.97, 0.99, 1.00, 1.00, 0.99, 0.96,
            0.90, 0.82, 0.75, 0.70, 0.66, 0.64,
        ];

        // Weekend reduction
        const dayOfWeek = dayOfYear % 7;
        const weekendFactor = (dayOfWeek === 5 || dayOfWeek === 6) ? 0.88 : 1.0;

        // Random variation (+/- 3%)
        const randomFactor = 0.97 + Math.random() * 0.06;

        const loadFactor = seasonalFactor * hourlyShape[hourOfDay] * weekendFactor * randomFactor;
        const existingLoad = systemPeakMW * loadFactor;

        // DC loads
        const firmDCLoad = dcCapacityMW * firmLoadFactor;
        const flexDCLoad = dcCapacityMW * flexLoadFactor;

        // Determine if this hour requires curtailment (top ~5% of hours)
        const isHighLoadHour = loadFactor > 0.92 && seasonalFactor > 0.85;

        const flexAtThisHour = isHighLoadHour
            ? dcCapacityMW * flexLoadFactor * flexPeakCoincidence
            : flexDCLoad;

        const curtailedAtThisHour = isHighLoadHour
            ? dcCapacityMW * flexLoadFactor * (1 - flexPeakCoincidence)
            : 0;

        hourlyData.push({
            existing: existingLoad,
            withFirmDC: existingLoad + firmDCLoad,
            withFlexDC: existingLoad + flexAtThisHour,
            curtailed: curtailedAtThisHour,
        });
    }

    // Sort by total load (with firm DC) descending to create duration curve
    const sortedByFirm = [...hourlyData].sort((a, b) => b.withFirmDC - a.withFirmDC);

    // Sample at intervals for smooth curve
    const samples = 200;
    const result = [];

    for (let i = 0; i < samples; i++) {
        const idx = Math.floor((i / samples) * hours);
        const hourNumber = Math.round((i / samples) * hours);

        result.push({
            hourNumber,
            percentile: (i / samples) * 100,
            baseGrid: sortedByFirm[idx].existing,
            firmDC: sortedByFirm[idx].withFirmDC - sortedByFirm[idx].existing,
            // Flex bonus: additional capacity that can be served with same grid
            flexBonus: sortedByFirm[idx].withFirmDC < sortedByFirm[0].existing + dcCapacityMW * firmLoadFactor * 0.95
                ? dcCapacityMW * flexLoadFactor * (1 - flexPeakCoincidence) / flexPeakCoincidence * 0.8
                : 0,
            shiftedWorkload: sortedByFirm[idx].curtailed,
            gridCapacity: sortedByFirm[0].existing + dcCapacityMW * firmLoadFactor,
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
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm min-w-[180px]">
            <p className="font-bold text-gray-900 mb-2 border-b pb-1">{label}</p>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-600">Base Grid:</span>
                    <span className="font-medium">{formatMW(data.baseGrid)}</span>
                </div>
                <div className="flex justify-between">
                    <span style={{ color: COLORS.firmDCStroke }}>Firm DC:</span>
                    <span className="font-medium" style={{ color: COLORS.firmDCStroke }}>+{formatMW(data.firmDC)}</span>
                </div>
                {data.flexBonus > 0 && (
                    <div className="flex justify-between">
                        <span style={{ color: COLORS.flexBonus }}>Flex Bonus:</span>
                        <span className="font-medium" style={{ color: COLORS.flexBonus }}>+{formatMW(data.flexBonus)}</span>
                    </div>
                )}
                {data.shiftedWorkload > 0 && (
                    <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-red-600">Curtailed (25%):</span>
                        <span className="font-medium text-red-600">{formatMW(data.shiftedWorkload)}</span>
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
                    <span style={{ color: COLORS.firmDCStroke }}>Standard Firm:</span>
                    <span className="font-medium" style={{ color: COLORS.firmDCStroke }}>+{formatMW(data.firmDC)}</span>
                </div>
                {data.flexBonus > 0 && (
                    <div className="flex justify-between">
                        <span style={{ color: COLORS.flexBonus }}>Flex Bonus:</span>
                        <span className="font-medium" style={{ color: COLORS.flexBonus }}>+{formatMW(data.flexBonus)}</span>
                    </div>
                )}
                {data.shiftedWorkload > 0 && (
                    <div className="flex justify-between text-red-600">
                        <span>Curtailed (25%):</span>
                        <span className="font-medium">{formatMW(data.shiftedWorkload)}</span>
                    </div>
                )}
                <div className="border-t pt-1 mt-1 text-xs text-gray-500">
                    Limit: {formatMW(data.gridCapacity)}
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
            dataCenter.flexPeakCoincidence,
        );
    }, [utility.systemPeakMW, dataCenter]);

    const durationCurveData = useMemo(() => {
        return generateLoadDurationCurve(
            utility.systemPeakMW,
            dataCenter.capacityMW,
            dataCenter.firmLoadFactor,
            dataCenter.flexLoadFactor,
            dataCenter.flexPeakCoincidence,
        );
    }, [utility.systemPeakMW, dataCenter]);

    // Calculate key metrics
    const metrics = useMemo(() => {
        const firmDCMW = dataCenter.capacityMW * dataCenter.firmLoadFactor;
        const flexDCMW = dataCenter.capacityMW * dataCenter.flexLoadFactor;
        const curtailmentMW = flexDCMW * (1 - dataCenter.flexPeakCoincidence);
        const flexBonusMW = curtailmentMW / dataCenter.flexPeakCoincidence;
        const gridCapacity = utility.systemPeakMW + firmDCMW;

        return {
            firmDCMW,
            flexDCMW,
            curtailmentMW,
            flexBonusMW,
            gridCapacity,
            additionalSales: flexBonusMW * 8760 * 0.94, // 94% of year at higher capacity
        };
    }, [utility.systemPeakMW, dataCenter]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Link href="/calculator" className="hover:text-white">Calculator</Link>
                    <span>/</span>
                    <span>Energy View</span>
                </div>
                <h1 className="text-3xl font-bold mb-4">Energy View: Load Profile Visualization</h1>
                <p className="text-lg text-gray-300 max-w-3xl">
                    Illustrative visualization showing how flexible data center operations affect grid load patterns.
                    These representative profiles demonstrate the framework for understanding capacity benefits.
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Grid Capacity</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMW(metrics.gridCapacity)}</p>
                    <p className="text-xs text-gray-400">Base + Firm DC</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700">Firm DC Load</p>
                    <p className="text-2xl font-bold text-green-600">{formatMW(metrics.firmDCMW)}</p>
                    <p className="text-xs text-green-500">{dataCenter.capacityMW} MW @ {(dataCenter.firmLoadFactor * 100).toFixed(0)}% LF</p>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                    <p className="text-sm text-emerald-700">Flex Bonus Capacity</p>
                    <p className="text-2xl font-bold text-emerald-600">+{formatMW(metrics.flexBonusMW)}</p>
                    <p className="text-xs text-emerald-500">Additional MW unlocked</p>
                </div>
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <p className="text-sm text-amber-700">Peak Curtailment</p>
                    <p className="text-2xl font-bold text-amber-600">{formatMW(metrics.curtailmentMW)}</p>
                    <p className="text-xs text-amber-500">25% reduction at peak</p>
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

                                {/* Base Grid - bottom layer */}
                                <Area
                                    type="monotone"
                                    dataKey="baseGrid"
                                    name="Base Grid"
                                    stackId="main"
                                    fill={COLORS.baseGrid}
                                    stroke={COLORS.baseGridStroke}
                                    strokeWidth={1}
                                />

                                {/* Firm DC Load - stacked on base */}
                                <Area
                                    type="monotone"
                                    dataKey="firmDC"
                                    name="Firm DC"
                                    stackId="main"
                                    fill={COLORS.firmDC}
                                    stroke={COLORS.firmDCStroke}
                                    strokeWidth={1}
                                />

                                {/* Flex Bonus - additional capacity unlocked */}
                                <Area
                                    type="monotone"
                                    dataKey="flexBonus"
                                    name="Flex Bonus"
                                    stackId="main"
                                    fill={COLORS.flexBonus}
                                    stroke={COLORS.flexBonus}
                                    strokeWidth={1}
                                />

                                {/* Shifted Workload - hatched pattern during peak */}
                                {showShiftedWorkload && (
                                    <Area
                                        type="monotone"
                                        dataKey="shiftedWorkload"
                                        name="Shifted Workload"
                                        stackId="main"
                                        fill="url(#hatchPattern)"
                                        stroke={COLORS.shiftedHatch}
                                        strokeWidth={1}
                                        strokeDasharray="4 2"
                                    />
                                )}

                                {/* Grid Capacity Line */}
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
                                <span className="text-sm text-gray-600">Base Grid</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.firmDC, border: `1px solid ${COLORS.firmDCStroke}` }}></div>
                                <span className="text-sm text-gray-600">Firm DC ({formatMW(dataCenter.capacityMW)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.flexBonus }}></div>
                                <span className="text-sm text-gray-600">Flex Bonus (+{formatMW(metrics.flexBonusMW)})</span>
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
                                <strong>25% Load Curtailment:</strong> During afternoon peak hours (12pm-8pm),
                                flexible data centers reduce grid draw by {formatMW(metrics.curtailmentMW)} by
                                deferring non-time-sensitive workloads to off-peak hours.
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
                                        <line x1="0" y1="0" x2="0" y2="8" stroke={COLORS.gridCapacity} strokeWidth="2" />
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

                                {/* Base Grid */}
                                <Area
                                    type="monotone"
                                    dataKey="baseGrid"
                                    name="Base Grid"
                                    stackId="main"
                                    fill={COLORS.baseGrid}
                                    stroke={COLORS.baseGridStroke}
                                    strokeWidth={1}
                                />

                                {/* Firm DC */}
                                <Area
                                    type="monotone"
                                    dataKey="firmDC"
                                    name="Firm DC"
                                    stackId="main"
                                    fill={COLORS.firmDC}
                                    stroke={COLORS.firmDCStroke}
                                    strokeWidth={1}
                                />

                                {/* Flex Bonus - The "Profit Wedge" */}
                                <Area
                                    type="monotone"
                                    dataKey="flexBonus"
                                    name="Flex Bonus"
                                    stackId="main"
                                    fill={COLORS.flexBonus}
                                    stroke={COLORS.flexBonus}
                                    strokeWidth={1}
                                />

                                {/* Shifted workload - above grid capacity */}
                                {showShiftedWorkload && (
                                    <Area
                                        type="monotone"
                                        dataKey="shiftedWorkload"
                                        name="Curtailed"
                                        stackId="main"
                                        fill="url(#hatchPatternDuration)"
                                        stroke={COLORS.gridCapacity}
                                        strokeWidth={1}
                                    />
                                )}

                                {/* Grid Capacity Line */}
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
                                <span className="text-sm text-gray-600">Base Grid</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.firmDC, border: `1px solid ${COLORS.firmDCStroke}` }}></div>
                                <span className="text-sm text-gray-600">Firm DC</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.flexBonus }}></div>
                                <span className="text-sm text-gray-600">Flex Bonus ("Profit Wedge")</span>
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
                                The dark green area represents <strong>+{formatMW(metrics.flexBonusMW)} of additional capacity</strong> that
                                can be served on the same grid infrastructure. Because flexible data centers only draw 75% of capacity
                                during peak hours, the grid can support 33% more total data center load. This unlocks approximately{' '}
                                <strong>{(metrics.additionalSales / 1000000).toFixed(1)} million MWh</strong> of additional annual energy sales
                                (running 94% of the year).
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Methodology Note */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3">About This Visualization</h3>
                <p className="text-sm text-blue-800 mb-3">
                    These charts are <strong>illustrative representations</strong> designed to communicate the framework
                    for understanding how flexible data center operations benefit grid capacity. The load shapes are
                    based on typical patterns for large utility service territories:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Base grid follows typical summer peak day shape (higher afternoon, lower overnight)</li>
                    <li>Data center load is relatively flat due to high load factor ({(dataCenter.firmLoadFactor * 100).toFixed(0)}% firm, {(dataCenter.flexLoadFactor * 100).toFixed(0)}% flexible)</li>
                    <li>Peak hours assumed to be 12pm-8pm when grid stress is highest</li>
                    <li>25% curtailment during peaks based on EPRI DCFlex field demonstrations</li>
                    <li>Annual curve generated from 8,760 hours with seasonal and daily variation</li>
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
                            className="px-4 py-2 text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                        >
                            View Methodology
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
