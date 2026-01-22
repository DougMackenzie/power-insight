'use client';

import { useState } from 'react';
import TrajectoryChart from '@/components/TrajectoryChart';
import SummaryCards from '@/components/SummaryCards';
import { useCalculator } from '@/hooks/useCalculator';
import { formatCurrency, formatMW } from '@/lib/constants';

// Input field component
interface InputFieldProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    help?: string;
}

const InputField = ({ label, value, onChange, unit, min, max, step = 1, help }: InputFieldProps) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    min={min}
                    max={max}
                    step={step}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {unit && <span className="text-sm text-gray-500 whitespace-nowrap">{unit}</span>}
            </div>
            {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}
        </div>
    );
};

// Slider input component
interface SliderFieldProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    formatValue?: (value: number) => string;
}

const SliderField = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = '',
    formatValue,
}: SliderFieldProps) => {
    const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;
    const minDisplay = formatValue ? formatValue(min) : `${min}${unit}`;
    const maxDisplay = formatValue ? formatValue(max) : `${max}${unit}`;

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <span className="text-sm font-medium text-primary-600">{displayValue}</span>
            </div>
            <input
                type="range"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{minDisplay}</span>
                <span>{maxDisplay}</span>
            </div>
        </div>
    );
};

export default function CalculatorPage() {
    const {
        utility,
        dataCenter,
        projectionYears,
        updateUtility,
        updateDataCenter,
        setProjectionYears,
        resetToDefaults,
        summary,
    } = useCalculator();

    const [activeSection, setActiveSection] = useState('utility');

    const DC_CAPACITY_RANGE = {
        min: 500,
        max: 10000,
        step: 100,
    };

    const UTILITY_PEAK_RANGE = {
        min: 1000,
        max: 50000,
        step: 500,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-4">Calculator: Your Community's Numbers</h1>
                <p className="text-lg text-gray-300 max-w-3xl">
                    Adjust the parameters below to match your community's utility and the proposed data
                    center. See how different configurations affect projected electricity costs.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Input panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Section tabs */}
                    <div className="flex border-b border-gray-200">
                        {[
                            { id: 'utility', label: 'Your Utility' },
                            { id: 'datacenter', label: 'Data Center' },
                            { id: 'projection', label: 'Projection' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === tab.id
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Utility inputs */}
                    {activeSection === 'utility' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                            <h3 className="font-semibold text-gray-900">Community & Utility</h3>

                            <InputField
                                label="Residential Customers"
                                value={utility.residentialCustomers}
                                onChange={(v) => updateUtility({ residentialCustomers: v })}
                                min={1000}
                                max={10000000}
                                step={1000}
                                help="Number of residential electric accounts"
                            />

                            <InputField
                                label="Average Monthly Bill"
                                value={utility.averageMonthlyBill}
                                onChange={(v) => updateUtility({ averageMonthlyBill: v })}
                                unit="$/mo"
                                min={50}
                                max={500}
                                step={5}
                                help="Typical residential electricity bill"
                            />

                            <InputField
                                label="Current System Peak"
                                value={utility.systemPeakMW}
                                onChange={(v) => updateUtility({ systemPeakMW: v })}
                                unit="MW"
                                min={UTILITY_PEAK_RANGE.min}
                                max={UTILITY_PEAK_RANGE.max}
                                step={UTILITY_PEAK_RANGE.step}
                                help="Utility's current peak demand (e.g., PSO ~4 GW)"
                            />

                            <InputField
                                label="Average Monthly Usage"
                                value={utility.averageMonthlyUsage}
                                onChange={(v) => updateUtility({ averageMonthlyUsage: v })}
                                unit="kWh"
                                min={200}
                                max={3000}
                                step={50}
                                help="Average residential monthly consumption"
                            />
                        </div>
                    )}

                    {/* Data center inputs */}
                    {activeSection === 'datacenter' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                            <h3 className="font-semibold text-gray-900">Data Center Parameters</h3>

                            <SliderField
                                label="Data Center Capacity"
                                value={dataCenter.capacityMW}
                                onChange={(v) => {
                                    const currentRatio =
                                        (dataCenter.onsiteGenerationMW || Math.round(dataCenter.capacityMW * 0.2)) /
                                        dataCenter.capacityMW;
                                    const newOnsiteGen = Math.round(v * currentRatio);
                                    updateDataCenter({ capacityMW: v, onsiteGenerationMW: newOnsiteGen });
                                }}
                                min={DC_CAPACITY_RANGE.min}
                                max={DC_CAPACITY_RANGE.max}
                                step={DC_CAPACITY_RANGE.step}
                                unit=" MW"
                                formatValue={(v) => formatMW(v)}
                            />

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-3">Firm Load Scenario</p>
                                <SliderField
                                    label="Firm Load Factor"
                                    value={dataCenter.firmLoadFactor || 0.8}
                                    onChange={(v) => updateDataCenter({ firmLoadFactor: v })}
                                    min={0.6}
                                    max={0.9}
                                    step={0.05}
                                    formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-3">Flexible Load Scenario</p>
                                <SliderField
                                    label="Flex Load Factor"
                                    value={dataCenter.flexLoadFactor || 0.95}
                                    onChange={(v) => updateDataCenter({ flexLoadFactor: v })}
                                    min={0.85}
                                    max={0.98}
                                    step={0.01}
                                    formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                                />

                                <div className="mt-4">
                                    <SliderField
                                        label="Peak Coincidence (Flex)"
                                        value={dataCenter.flexPeakCoincidence || 0.8}
                                        onChange={(v) => updateDataCenter({ flexPeakCoincidence: v })}
                                        min={0.6}
                                        max={0.95}
                                        step={0.05}
                                        formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-3">Dispatchable Generation</p>
                                <SliderField
                                    label="Onsite Generation"
                                    value={dataCenter.onsiteGenerationMW || Math.round(dataCenter.capacityMW * 0.2)}
                                    onChange={(v) => updateDataCenter({ onsiteGenerationMW: v })}
                                    min={0}
                                    max={dataCenter.capacityMW}
                                    step={Math.max(10, Math.round(dataCenter.capacityMW / 100))}
                                    formatValue={(v) => formatMW(v)}
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    {(
                                        ((dataCenter.onsiteGenerationMW || Math.round(dataCenter.capacityMW * 0.2)) /
                                            dataCenter.capacityMW) *
                                        100
                                    ).toFixed(0)}
                                    % of DC capacity
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">Rate Structure</p>
                                <InputField
                                    label="Demand Charge"
                                    value={dataCenter.demandChargeRate}
                                    onChange={(v) => updateDataCenter({ demandChargeRate: v })}
                                    unit="$/MW-mo"
                                    min={5000}
                                    max={15000}
                                    step={500}
                                />
                            </div>
                        </div>
                    )}

                    {/* Projection settings */}
                    {activeSection === 'projection' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                            <h3 className="font-semibold text-gray-900">Projection Settings</h3>

                            <SliderField
                                label="Projection Period"
                                value={projectionYears}
                                onChange={setProjectionYears}
                                min={5}
                                max={30}
                                step={5}
                                unit=" years"
                            />

                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Key Assumptions</h4>
                                <ul className="text-xs text-gray-500 space-y-1">
                                    <li>• General inflation: 2.5%/year</li>
                                    <li>• Transmission cost: $350k/MW peak</li>
                                    <li>• Demand charge: $9,050/MW-month</li>
                                    <li>• Firm LF: 80%, Flex LF: 95%</li>
                                    <li>• Initial residential allocation: 40%</li>
                                    <li>• Allocation calculated from tariff structure</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Reset button */}
                    <button
                        onClick={resetToDefaults}
                        className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Reset to Default Values
                    </button>

                    {/* Quick presets */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    updateUtility({
                                        residentialCustomers: 560000,
                                        averageMonthlyBill: 130,
                                        systemPeakMW: 4000,
                                    });
                                    updateDataCenter({ capacityMW: 2000, onsiteGenerationMW: 400 });
                                }}
                                className="w-full text-left px-3 py-2 text-sm bg-white rounded border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                            >
                                <span className="font-medium">PSO-Sized (Default)</span>
                                <span className="text-gray-500"> - 560k customers, 4 GW peak, 2 GW DC</span>
                            </button>
                            <button
                                onClick={() => {
                                    updateUtility({
                                        residentialCustomers: 100000,
                                        averageMonthlyBill: 125,
                                        systemPeakMW: 1500,
                                    });
                                    updateDataCenter({ capacityMW: 500, onsiteGenerationMW: 100 });
                                }}
                                className="w-full text-left px-3 py-2 text-sm bg-white rounded border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                            >
                                <span className="font-medium">Small Utility</span>
                                <span className="text-gray-500"> - 100k customers, 1.5 GW peak, 500 MW DC</span>
                            </button>
                            <button
                                onClick={() => {
                                    updateUtility({
                                        residentialCustomers: 2000000,
                                        averageMonthlyBill: 150,
                                        systemPeakMW: 20000,
                                    });
                                    updateDataCenter({ capacityMW: 5000, onsiteGenerationMW: 1000 });
                                }}
                                className="w-full text-left px-3 py-2 text-sm bg-white rounded border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                            >
                                <span className="font-medium">Large ISO Region</span>
                                <span className="text-gray-500"> - 2M customers, 20 GW peak, 5 GW DC</span>
                            </button>
                            <button
                                onClick={() => {
                                    updateUtility({
                                        residentialCustomers: 300000,
                                        averageMonthlyBill: 135,
                                        systemPeakMW: 3000,
                                    });
                                    updateDataCenter({ capacityMW: 3000, onsiteGenerationMW: 600 });
                                }}
                                className="w-full text-left px-3 py-2 text-sm bg-white rounded border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                            >
                                <span className="font-medium">High Impact</span>
                                <span className="text-gray-500"> - Large DC relative to utility (100% of peak)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main chart */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Projected Monthly Bill</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            For a {utility.residentialCustomers.toLocaleString()}-customer utility with a{' '}
                            {dataCenter.capacityMW} MW data center
                        </p>
                        <TrajectoryChart height={350} />
                    </div>

                    {/* Summary stats */}
                    <SummaryCards />

                    {/* Key findings */}
                    <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                        <h3 className="font-semibold text-green-900 mb-4">Key Findings for Your Community</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Optimized DC vs Baseline</p>
                                <p
                                    className={`text-2xl font-bold ${summary.finalYearDifference.dispatchable >= 0 ? 'text-red-600' : 'text-green-600'
                                        }`}
                                >
                                    {summary.finalYearDifference.dispatchable >= 0
                                        ? `+$${summary.finalYearDifference.dispatchable.toFixed(2)}/mo`
                                        : `-$${Math.abs(summary.finalYearDifference.dispatchable).toFixed(2)}/mo`}
                                </p>
                                <p className="text-xs text-gray-500">vs no data center (best case)</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Value of Optimization</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${summary.savingsVsUnoptimized.dispatchable.toFixed(2)}/mo
                                </p>
                                <p className="text-xs text-gray-500">optimized vs firm load DC</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Annual Community Benefit</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(
                                        summary.savingsVsUnoptimized.dispatchable * 12 * utility.residentialCustomers
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">optimized vs firm load, all households</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Lifetime Benefit</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(
                                        summary.cumulativeHouseholdCosts.unoptimized -
                                        summary.cumulativeHouseholdCosts.dispatchable
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">per household over {projectionYears} years</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export/share options */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">Share These Results</h3>
                        <p className="text-sm text-gray-600">
                            Download a summary or share with community stakeholders
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="/methodology"
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            View Methodology
                        </a>
                        <button
                            className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                            onClick={() => {
                                alert("PDF export coming soon! For now, use your browser's print function.");
                            }}
                        >
                            Export Summary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
