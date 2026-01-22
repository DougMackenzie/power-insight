'use client';

/**
 * TrajectoryChart Component
 * Main visualization showing cost trajectories over time
 */

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { SCENARIOS } from '@/lib/constants';
import { useCalculator } from '@/hooks/useCalculator';

interface TooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <p className="font-semibold text-gray-900 mb-2">{label}</p>
            {payload.map((entry, index) => {
                const scenario = Object.values(SCENARIOS).find((s) => s.id === entry.dataKey);
                return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600">{scenario?.name || entry.dataKey}:</span>
                        <span className="font-medium" style={{ color: entry.color }}>
                            ${entry.value.toFixed(2)}/mo
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const ScenarioLegend = ({
    selectedScenarios,
    onToggle,
}: {
    selectedScenarios: string[];
    onToggle: (id: string) => void;
}) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {Object.values(SCENARIOS).map((scenario) => {
                const isSelected = selectedScenarios.includes(scenario.id);
                return (
                    <button
                        key={scenario.id}
                        onClick={() => onToggle(scenario.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${isSelected ? 'border-current shadow-sm' : 'border-gray-200 opacity-50'
                            }`}
                        style={{
                            borderColor: isSelected ? scenario.color : undefined,
                            backgroundColor: isSelected ? scenario.colorLight : '#f9fafb',
                        }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.color }} />
                            <span className="font-medium text-sm text-gray-900">{scenario.shortName}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{scenario.description}</p>
                    </button>
                );
            })}
        </div>
    );
};

interface TrajectoryChartProps {
    height?: number;
    showLegend?: boolean;
    showTooltip?: boolean;
    interactive?: boolean;
}

const TrajectoryChart = ({
    height = 400,
    showLegend = true,
    showTooltip = true,
    interactive = true,
}: TrajectoryChartProps) => {
    const { chartData, selectedScenarios, toggleScenario, utility } = useCalculator();

    const yDomain = useMemo(() => {
        if (!chartData.length) return [0, 200];

        let min = Infinity;
        let max = -Infinity;

        chartData.forEach((point) => {
            selectedScenarios.forEach((scenario) => {
                const value = point[scenario];
                if (value !== undefined) {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                }
            });
        });

        const padding = (max - min) * 0.1;
        return [Math.max(0, min - padding), max + padding];
    }, [chartData, selectedScenarios]);

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="year"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                        domain={yDomain as [number, number]}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                        label={{
                            value: 'Monthly Bill',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: '#6b7280', fontSize: 12 },
                        }}
                    />

                    {showTooltip && <Tooltip content={<CustomTooltip />} />}

                    <ReferenceLine
                        y={utility.averageMonthlyBill}
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                        label={{
                            value: 'Current',
                            position: 'right',
                            style: { fill: '#9ca3af', fontSize: 11 },
                        }}
                    />

                    {Object.values(SCENARIOS).map((scenario) => {
                        if (!selectedScenarios.includes(scenario.id)) return null;
                        return (
                            <Line
                                key={scenario.id}
                                type="monotone"
                                dataKey={scenario.id}
                                stroke={scenario.color}
                                strokeWidth={scenario.id === 'baseline' ? 2 : 3}
                                strokeDasharray={scenario.id === 'baseline' ? '5 5' : undefined}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>

            {showLegend && interactive && (
                <ScenarioLegend selectedScenarios={selectedScenarios} onToggle={toggleScenario} />
            )}
        </div>
    );
};

export default TrajectoryChart;
