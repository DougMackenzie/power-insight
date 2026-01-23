'use client';

import { SCENARIOS, formatCurrency } from '@/lib/constants';
import { useCalculator } from '@/hooks/useCalculator';

interface StatCardProps {
    label: string;
    value: string;
    subtext?: string;
    color: string;
    highlight?: boolean;
}

const StatCard = ({ label, value, subtext, color, highlight = false }: StatCardProps) => {
    return (
        <div
            className={`p-4 rounded-lg border-2 ${highlight ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
            style={{
                borderColor: color,
                backgroundColor: highlight ? `${color}10` : 'white',
            }}
        >
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color: color }}>
                {value}
            </p>
            {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
    );
};

interface ComparisonRowProps {
    scenario: string;
    finalBill: number;
    baselineBill: number;
    isBest: boolean;
}

const ComparisonRow = ({ scenario, finalBill, baselineBill, isBest }: ComparisonRowProps) => {
    const scenarioInfo = SCENARIOS[scenario as keyof typeof SCENARIOS];
    const difference = finalBill - baselineBill;
    const isNegative = difference < 0;
    const isBaseline = scenario === 'baseline';

    return (
        <div
            className={`flex items-center justify-between p-3 rounded-lg ${isBest ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: scenarioInfo.color }} />
                <div>
                    <p className="font-medium text-gray-900">{scenarioInfo.name}</p>
                    <p className="text-xs text-gray-500">{scenarioInfo.description}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg" style={{ color: scenarioInfo.color }}>
                    ${finalBill.toFixed(2)}/mo
                </p>
                <p
                    className={`text-xs ${isBaseline
                            ? 'text-gray-500'
                            : isNegative
                                ? 'text-green-600'
                                : difference > 0
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                        }`}
                >
                    {isBaseline ? '(baseline)' : `${isNegative ? '' : '+'}$${difference.toFixed(2)} vs baseline`}
                </p>
            </div>
        </div>
    );
};

export default function SummaryCards({ compact = false }: { compact?: boolean }) {
    const { summary, utility, projectionYears } = useCalculator();

    const baselineFinal = summary.finalYearBills.baseline;
    const firmLoadDiff = summary.finalYearBills.unoptimized - baselineFinal;
    const flexLoadDiff = summary.finalYearBills.flexible - baselineFinal;
    const dispatchableDiff = summary.finalYearBills.dispatchable - baselineFinal;

    if (compact) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label={`Baseline (${projectionYears}yr)`}
                    value={`$${baselineFinal.toFixed(0)}/mo`}
                    subtext="Without data center"
                    color={SCENARIOS.baseline.color}
                />
                <StatCard
                    label={`Firm Load (${projectionYears}yr)`}
                    value={`$${summary.finalYearBills.unoptimized.toFixed(0)}/mo`}
                    subtext={
                        firmLoadDiff >= 0
                            ? `+$${firmLoadDiff.toFixed(2)} vs baseline`
                            : `-$${Math.abs(firmLoadDiff).toFixed(2)} vs baseline`
                    }
                    color={SCENARIOS.unoptimized.color}
                />
                <StatCard
                    label={`Flexible (${projectionYears}yr)`}
                    value={`$${summary.finalYearBills.flexible.toFixed(0)}/mo`}
                    subtext={
                        flexLoadDiff >= 0
                            ? `+$${flexLoadDiff.toFixed(2)} vs baseline`
                            : `-$${Math.abs(flexLoadDiff).toFixed(2)} vs baseline`
                    }
                    color={SCENARIOS.flexible.color}
                />
                <StatCard
                    label={`Optimized (${projectionYears}yr)`}
                    value={`$${summary.finalYearBills.dispatchable.toFixed(0)}/mo`}
                    subtext={
                        dispatchableDiff >= 0
                            ? `+$${dispatchableDiff.toFixed(2)} vs baseline`
                            : `-$${Math.abs(dispatchableDiff).toFixed(2)} vs baseline`
                    }
                    color={SCENARIOS.dispatchable.color}
                    highlight={true}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Monthly Bill: Now vs {projectionYears} Years
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                        <p className="text-sm text-gray-600 mb-1">Baseline ({projectionYears} years)</p>
                        <p className="text-4xl font-bold text-gray-700">${baselineFinal.toFixed(0)}</p>
                        <p className="text-sm text-gray-500">without data center</p>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Best Case ({projectionYears} years)</p>
                        <p className="text-4xl font-bold text-green-600">
                            ${summary.finalYearBills.dispatchable.toFixed(0)}
                        </p>
                        <p className="text-sm text-gray-500">with optimized data center</p>
                        <p
                            className={`text-sm font-medium mt-1 ${dispatchableDiff >= 0 ? 'text-red-600' : 'text-green-600'
                                }`}
                        >
                            {dispatchableDiff >= 0 ? '+' : ''}
                            {dispatchableDiff.toFixed(2)} vs baseline
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                        All Scenarios (Compared to Baseline)
                    </h4>
                    {(['baseline', 'unoptimized', 'flexible', 'dispatchable'] as const).map((scenario) => (
                        <ComparisonRow
                            key={scenario}
                            scenario={scenario}
                            finalBill={summary.finalYearBills[scenario]}
                            baselineBill={baselineFinal}
                            isBest={scenario === 'dispatchable'}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cumulative Cost Over {projectionYears} Years
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Total electricity costs per household over the projection period
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['baseline', 'unoptimized', 'flexible', 'dispatchable'] as const).map((scenario) => {
                        const cost = summary.cumulativeHouseholdCosts[scenario];
                        const baselineCost = summary.cumulativeHouseholdCosts.baseline;
                        const diff = cost - baselineCost;
                        const scenarioInfo = SCENARIOS[scenario];
                        const isBaseline = scenario === 'baseline';
                        return (
                            <div
                                key={scenario}
                                className="p-4 rounded-lg text-center"
                                style={{ backgroundColor: scenarioInfo.colorLight }}
                            >
                                <p className="text-xs text-gray-600 mb-1">{scenarioInfo.shortName}</p>
                                <p className="text-xl font-bold" style={{ color: scenarioInfo.color }}>
                                    {formatCurrency(cost)}
                                </p>
                                {!isBaseline && (
                                    <p className={`text-xs mt-1 ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {diff >= 0 ? '+' : ''}
                                        {formatCurrency(diff)} vs baseline
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                        <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span className="font-medium text-green-800">Potential Community Savings</span>
                    </div>
                    <p className="text-sm text-green-700">
                        Each household could save{' '}
                        <span className="font-bold">
                            {formatCurrency(
                                summary.cumulativeHouseholdCosts.unoptimized -
                                summary.cumulativeHouseholdCosts.dispatchable
                            )}
                        </span>{' '}
                        over {projectionYears} years if the utility and regulators require flexible operations
                        with dispatchable generation instead of allowing unoptimized firm load.
                    </p>
                </div>
            </div>
        </div>
    );
}
