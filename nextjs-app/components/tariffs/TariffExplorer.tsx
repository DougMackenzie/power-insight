'use client';

import { useState, useMemo, lazy, Suspense } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ScatterChart,
    Scatter,
    ZAxis,
    Legend,
} from 'recharts';
import { GENERATED_TARIFFS, TARIFF_STATS, type EnrichedTariff } from '@/lib/generatedTariffData';

// Lazy load the heatmap component for better initial load
const UtilityHeatmap = lazy(() => import('./UtilityHeatmap'));

// Rating colors
const RATING_COLORS = {
    High: '#10B981', // green-500
    Mid: '#F59E0B',  // amber-500
    Low: '#EF4444',  // red-500
};

// ISO/RTO colors
const ISO_COLORS: Record<string, string> = {
    SPP: '#8B5CF6',    // violet-500
    PJM: '#3B82F6',    // blue-500
    MISO: '#10B981',   // green-500
    ERCOT: '#F59E0B',  // amber-500
    CAISO: '#EF4444',  // red-500
    'ISO-NE': '#06B6D4', // cyan-500
    NYISO: '#EC4899',  // pink-500
    None: '#6B7280',   // gray-500
};

// Protection criteria for reference
const PROTECTION_CRITERIA = [
    { name: 'Ratchet %', maxPoints: 3, desc: '≥90% (+3), 80-89% (+2), 60-79% (+1)' },
    { name: 'Contract Term', maxPoints: 3, desc: '≥15yr (+3), 10-14yr (+2), 5-9yr (+1)' },
    { name: 'CIAC', maxPoints: 2, desc: 'Contribution in Aid of Construction' },
    { name: 'Take-or-Pay', maxPoints: 2, desc: 'Minimum revenue guarantee' },
    { name: 'Exit Fee', maxPoints: 2, desc: 'Early termination penalty' },
    { name: 'Demand Ratchet', maxPoints: 1, desc: 'Minimum billing demand' },
    { name: 'Credit Req', maxPoints: 1, desc: 'Credit/financial requirements' },
    { name: 'DC-Specific', maxPoints: 2, desc: 'Data center specific rate' },
    { name: 'Collateral', maxPoints: 1, desc: 'Security deposit required' },
    { name: 'Min Load', maxPoints: 1, desc: 'Minimum load ≥1MW threshold' },
];

interface TariffExplorerProps {
    initialView?: 'overview' | 'table' | 'matrix' | 'compare';
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: EnrichedTariff & { blendedRateCents?: number; annualCostM?: number };
    }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm shadow-lg">
                <p className="font-semibold text-white">{data.utility}</p>
                <p className="text-slate-400">{data.state} • {data.iso_rto}</p>
                <div className="mt-2 space-y-1">
                    <p className="text-white">
                        Rate: <span className="text-blue-400 font-medium">{(data.blendedRatePerKWh * 100).toFixed(2)}¢/kWh</span>
                    </p>
                    <p className="text-white">
                        Annual: <span className="text-green-400 font-medium">${data.annualCostM?.toFixed(1)}M</span>
                    </p>
                    <p className="text-white">
                        Protection: <span className={`font-medium ${
                            data.protectionRating === 'High' ? 'text-green-400' :
                            data.protectionRating === 'Mid' ? 'text-amber-400' : 'text-red-400'
                        }`}>{data.protectionScore}/19 ({data.protectionRating})</span>
                    </p>
                    <p className="text-white">
                        Peak Demand: <span className="text-purple-400">${data.peak_demand_charge?.toFixed(2)}/kW</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function TariffExplorer({ initialView = 'overview' }: TariffExplorerProps) {
    const [viewMode, setViewMode] = useState<'blendedRate' | 'annualCost' | 'scatter' | 'map'>('blendedRate');
    const [sortBy, setSortBy] = useState<'blendedRate' | 'protection' | 'utility'>('blendedRate');
    const [filterISO, setFilterISO] = useState<string>('all');
    const [showTable, setShowTable] = useState(false);

    // Filter and sort data
    const filteredData = useMemo(() => {
        let data = [...GENERATED_TARIFFS];
        if (filterISO !== 'all') {
            data = data.filter(d => d.iso_rto === filterISO);
        }
        data.sort((a, b) => {
            if (sortBy === 'blendedRate') return a.blendedRatePerKWh - b.blendedRatePerKWh;
            if (sortBy === 'protection') return b.protectionScore - a.protectionScore;
            if (sortBy === 'utility') return a.utility.localeCompare(b.utility);
            return 0;
        });
        return data;
    }, [filterISO, sortBy]);

    // Prepare chart data
    const chartData = useMemo(() => {
        return filteredData.map(d => ({
            ...d,
            blendedRateCents: d.blendedRatePerKWh * 100,
            annualCostMCalc: d.annualCostM,
        }));
    }, [filteredData]);

    // Scatter plot data (unfiltered for full view)
    const scatterData = useMemo(() => {
        return GENERATED_TARIFFS.map(d => ({
            ...d,
            x: d.blendedRatePerKWh * 100,
            y: d.protectionScore,
            z: d.peak_demand_charge || 10,
        }));
    }, []);

    // Summary statistics
    const stats = useMemo(() => {
        const data = GENERATED_TARIFFS;
        const rates = data.map(d => d.blendedRatePerKWh);
        const minTariff = data.reduce((min, d) => d.blendedRatePerKWh < min.blendedRatePerKWh ? d : min, data[0]);
        const maxTariff = data.reduce((max, d) => d.blendedRatePerKWh > max.blendedRatePerKWh ? d : max, data[0]);
        return {
            min: Math.min(...rates),
            max: Math.max(...rates),
            avg: rates.reduce((a, b) => a + b, 0) / rates.length,
            minUtility: minTariff?.utility || '',
            maxUtility: maxTariff?.utility || '',
            highProtection: data.filter(d => d.protectionRating === 'High').length,
            midProtection: data.filter(d => d.protectionRating === 'Mid').length,
            lowProtection: data.filter(d => d.protectionRating === 'Low').length,
        };
    }, []);

    // Get unique ISOs for filter
    const uniqueISOs = useMemo(() => {
        const isos = new Set(GENERATED_TARIFFS.map(d => d.iso_rto));
        return Array.from(isos).sort();
    }, []);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="text-slate-500 text-sm">Lowest Rate</div>
                    <div className="text-2xl font-bold text-green-600">
                        {(stats.min * 100).toFixed(2)}¢/kWh
                    </div>
                    <div className="text-slate-500 text-sm truncate">{stats.minUtility}</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="text-slate-500 text-sm">Highest Rate</div>
                    <div className="text-2xl font-bold text-red-600">
                        {(stats.max * 100).toFixed(2)}¢/kWh
                    </div>
                    <div className="text-slate-500 text-sm truncate">{stats.maxUtility}</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="text-slate-500 text-sm">Average Rate</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {(stats.avg * 100).toFixed(2)}¢/kWh
                    </div>
                    <div className="text-slate-500 text-sm">Across {TARIFF_STATS.totalUtilities} utilities</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="text-slate-500 text-sm mb-2">Protection Distribution</div>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            High: {stats.highProtection}
                        </span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                            Mid: {stats.midProtection}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Low: {stats.lowProtection}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                    <label className="text-slate-600 text-sm block mb-1">View Mode</label>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'blendedRate' | 'annualCost' | 'scatter' | 'map')}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="blendedRate">Blended Rate (¢/kWh)</option>
                        <option value="annualCost">Annual Cost ($M)</option>
                        <option value="scatter">Rate vs Protection</option>
                        <option value="map">Geographic Map</option>
                    </select>
                </div>
                <div>
                    <label className="text-slate-600 text-sm block mb-1">Sort By</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'blendedRate' | 'protection' | 'utility')}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="blendedRate">Blended Rate (Low → High)</option>
                        <option value="protection">Protection Score (High → Low)</option>
                        <option value="utility">Utility Name</option>
                    </select>
                </div>
                <div>
                    <label className="text-slate-600 text-sm block mb-1">Filter ISO/RTO</label>
                    <select
                        value={filterISO}
                        onChange={(e) => setFilterISO(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="all">All ISO/RTOs</option>
                        {uniqueISOs.map(iso => (
                            <option key={iso} value={iso}>{iso}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() => setShowTable(!showTable)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            showTable
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {showTable ? 'Hide Table' : 'Show Table'}
                    </button>
                </div>
            </div>

            {/* Chart / Map */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                    {viewMode === 'scatter' ? 'Rate vs Protection Tradeoff' :
                     viewMode === 'annualCost' ? 'Annual Cost by Utility' :
                     viewMode === 'map' ? 'Utility Rates & Protection by State' :
                     'Blended Rate by Utility'}
                    <span className="font-normal text-slate-500 ml-2">({filteredData.length} utilities)</span>
                </h3>

                {viewMode === 'map' ? (
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-96">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    }>
                        <UtilityHeatmap
                            filteredTariffs={filteredData}
                            colorMode="combined"
                        />
                    </Suspense>
                ) : viewMode === 'scatter' ? (
                    <ResponsiveContainer width="100%" height={500}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Rate"
                                unit="¢"
                                domain={[0, 'auto']}
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                label={{ value: 'Blended Rate (¢/kWh)', position: 'bottom', offset: 40, fill: '#64748b' }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Protection"
                                domain={[0, 19]}
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                label={{ value: 'Protection Score', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                            />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Peak Demand" />
                            <Tooltip content={<CustomTooltip />} />
                            <Scatter name="Utilities" data={scatterData}>
                                {scatterData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={RATING_COLORS[entry.protectionRating as keyof typeof RATING_COLORS]}
                                        fillOpacity={0.7}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(400, filteredData.length * 25)}>
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                type="number"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                label={{
                                    value: viewMode === 'annualCost' ? 'Annual Cost ($M)' : 'Blended Rate (¢/kWh)',
                                    position: 'bottom',
                                    fill: '#64748b',
                                }}
                            />
                            <YAxis
                                dataKey="utility"
                                type="category"
                                width={110}
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey={viewMode === 'annualCost' ? 'annualCostM' : 'blendedRateCents'}
                                radius={[0, 4, 4, 0]}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={RATING_COLORS[entry.protectionRating as keyof typeof RATING_COLORS]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Protection Rating</p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm text-slate-600">High (≥14 pts)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-sm text-slate-600">Mid (8-13 pts)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-slate-600">Low (&lt;8 pts)</span>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">ISO/RTO</p>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(ISO_COLORS).map(([iso, color]) => (
                            <div key={iso} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                                <span className="text-xs text-slate-600">{iso}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            {showTable && (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">Utility</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">State</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">ISO</th>
                                    <th className="text-right py-3 px-4 font-medium text-slate-700">Rate (¢/kWh)</th>
                                    <th className="text-right py-3 px-4 font-medium text-slate-700">Annual ($M)</th>
                                    <th className="text-right py-3 px-4 font-medium text-slate-700">Peak ($/kW)</th>
                                    <th className="text-right py-3 px-4 font-medium text-slate-700">Protection</th>
                                    <th className="text-center py-3 px-4 font-medium text-slate-700">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((tariff, idx) => (
                                    <tr
                                        key={tariff.id}
                                        className={`border-b border-slate-100 hover:bg-slate-50 ${
                                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                        }`}
                                    >
                                        <td className="py-3 px-4 font-medium text-slate-900">{tariff.utility}</td>
                                        <td className="py-3 px-4 text-slate-600">{tariff.state}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${ISO_COLORS[tariff.iso_rto] || ISO_COLORS.None}20`,
                                                    color: ISO_COLORS[tariff.iso_rto] || ISO_COLORS.None,
                                                }}
                                            >
                                                {tariff.iso_rto}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            {(tariff.blendedRatePerKWh * 100).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            ${tariff.annualCostM.toFixed(1)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            ${tariff.peak_demand_charge.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            {tariff.protectionScore}/19
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                    tariff.protectionRating === 'High'
                                                        ? 'bg-green-100 text-green-700'
                                                        : tariff.protectionRating === 'Mid'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {tariff.protectionRating}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Protection Scoring Reference */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Protection Scoring Methodology (Max 19 points)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {PROTECTION_CRITERIA.map(criterion => (
                        <div key={criterion.name} className="text-sm">
                            <div className="font-medium text-slate-700">
                                {criterion.name} <span className="text-slate-400">({criterion.maxPoints}pts)</span>
                            </div>
                            <div className="text-xs text-slate-500">{criterion.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
