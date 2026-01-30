'use client';

import { useState } from 'react';
import Link from 'next/link';
import TrajectoryChart from '@/components/TrajectoryChart';
import SummaryCards from '@/components/SummaryCards';
import { useCalculator } from '@/hooks/useCalculator';
import { formatCurrency, formatMW, SUPPLY_CURVE } from '@/lib/constants';
import { getUtilitiesGroupedByState, type TariffStructure } from '@/lib/utilityData';
import { calculateDynamicCapacityPrice, calculateRevenueAdequacy, type CapacityPriceResult } from '@/lib/calculations';
import { MARKET_FORECASTS } from '@/lib/marketForecasts';

// Reserve Margin Indicator - Shows capacity scarcity warning
interface ReserveMarginIndicatorProps {
    utility: {
        systemPeakMW: number;
        totalGenerationCapacityMW?: number;
        currentReserveMargin?: number;
        hasCapacityMarket?: boolean;
        capacityCostPassThrough?: number;
    };
    dcCapacityMW: number;
    peakCoincidence: number;
}

const ReserveMarginIndicator = ({ utility, dcCapacityMW, peakCoincidence }: ReserveMarginIndicatorProps) => {
    // Calculate the impact on reserve margin
    const dcPeakContribution = dcCapacityMW * peakCoincidence;
    const capacityPriceResult = calculateDynamicCapacityPrice(
        utility as Parameters<typeof calculateDynamicCapacityPrice>[0],
        dcPeakContribution
    );

    const { oldReserveMargin, newReserveMargin, isScarcity, isCritical, oldPrice, newPrice, priceIncrease } = capacityPriceResult;

    // Determine warning level
    let bgColor = 'bg-green-50';
    let borderColor = 'border-green-200';
    let textColor = 'text-green-800';
    let iconColor = 'text-green-600';
    let statusText = 'Adequate Reserve Margin';

    if (isCritical) {
        bgColor = 'bg-red-50';
        borderColor = 'border-red-300';
        textColor = 'text-red-900';
        iconColor = 'text-red-600';
        statusText = 'CRITICAL: System Reliability at Risk';
    } else if (isScarcity) {
        bgColor = 'bg-amber-50';
        borderColor = 'border-amber-300';
        textColor = 'text-amber-900';
        iconColor = 'text-amber-600';
        statusText = 'System Scarcity Triggered';
    } else if (newReserveMargin < 0.15) {
        bgColor = 'bg-yellow-50';
        borderColor = 'border-yellow-300';
        textColor = 'text-yellow-900';
        iconColor = 'text-yellow-600';
        statusText = 'Reserve Margin Below Target';
    }

    const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;
    const formatPrice = (val: number) => `$${val.toFixed(0)}/MW-day`;

    return (
        <div className={`mt-3 p-3 rounded-lg border ${bgColor} ${borderColor}`}>
            <div className="flex items-start gap-2">
                {/* Warning Icon */}
                {(isScarcity || isCritical) ? (
                    <svg className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                ) : (
                    <svg className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                <div className="flex-1">
                    <div className={`font-semibold text-sm ${textColor}`}>{statusText}</div>
                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                        <p>Reserve Margin: {formatPercent(oldReserveMargin)} → <span className={isScarcity ? 'font-bold text-red-700' : ''}>{formatPercent(newReserveMargin)}</span></p>
                        <p>Capacity Price: {formatPrice(oldPrice)} → <span className={priceIncrease > 50 ? 'font-bold text-amber-700' : ''}>{formatPrice(newPrice)}</span>
                            {priceIncrease > 0 && <span className="text-red-600"> (+{formatPrice(priceIncrease)})</span>}
                        </p>
                    </div>
                    {(isScarcity || isCritical) && (
                        <div className={`mt-2 text-xs ${textColor} bg-white/50 p-2 rounded`}>
                            <strong>Capacity cost spillover:</strong> This load consumes the reserve margin, triggering higher capacity prices that affect all ratepayers in this market.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Revenue Adequacy Indicator - Shows if DC revenue covers cost-to-serve
interface RevenueAdequacyIndicatorProps {
    utility: Parameters<typeof calculateRevenueAdequacy>[4];
    tariff: TariffStructure | undefined;
    dcCapacityMW: number;
    loadFactor: number;
    peakCoincidence: number;
    onsiteGenerationMW: number;
    scenarioLabel?: string;
}

const RevenueAdequacyIndicator = ({ utility, tariff, dcCapacityMW, loadFactor, peakCoincidence, onsiteGenerationMW, scenarioLabel = "optimized" }: RevenueAdequacyIndicatorProps) => {
    const revenueAdequacy = calculateRevenueAdequacy(
        dcCapacityMW,
        loadFactor,
        peakCoincidence,
        tariff,
        utility,
        onsiteGenerationMW
    );

    const formatCurrencyShort = (val: number) => {
        if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(0)}k`;
        return `$${val.toFixed(0)}`;
    };

    const { surplusOrDeficitPerMW, revenueAdequacyRatio, contributesSurplus } = revenueAdequacy;

    // Format assumption values
    const ciacPercent = ((utility?.interconnection?.ciacRecoveryFraction || 0.60) * 100).toFixed(0);
    const networkCost = ((utility?.interconnection?.networkUpgradeCostPerMW || 140000) / 1000).toFixed(0);
    const wholesaleCost = utility?.marginalEnergyCost || 38;
    const tariffEnergyCost = tariff?.energyCharge || 0;
    const isPassThrough = tariffEnergyCost < wholesaleCost * 1.5;
    const netPeakDemandMW = Math.max(0, dcCapacityMW * peakCoincidence - onsiteGenerationMW);

    return (
        <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Revenue Adequacy <span className="text-xs text-gray-400">({scenarioLabel})</span></p>
            <p className={`text-2xl font-bold ${contributesSurplus ? 'text-green-600' : 'text-amber-600'}`}>
                {contributesSurplus ? '+' : ''}{formatCurrencyShort(surplusOrDeficitPerMW)}/MW
            </p>
            <p className="text-xs text-gray-500">
                {contributesSurplus ? 'surplus' : 'deficit'} per MW ({(revenueAdequacyRatio * 100).toFixed(0)}% coverage)
            </p>
            <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    View calculation assumptions
                </summary>
                <div className="mt-1 text-xs text-gray-500 space-y-1 pl-2 border-l-2 border-gray-200">
                    {/* Scenario Parameters */}
                    <div className="font-medium text-gray-600 pt-1">Scenario Parameters:</div>
                    <p>• Peak Coincidence: {(peakCoincidence * 100).toFixed(0)}%
                       <span className="text-gray-400 ml-1">(% of capacity at system peaks)</span></p>
                    <p>• Load Factor: {(loadFactor * 100).toFixed(0)}%
                       <span className="text-gray-400 ml-1">(average utilization)</span></p>
                    <p>• Onsite Generation: {onsiteGenerationMW.toLocaleString()} MW
                       <span className="text-gray-400 ml-1">(reduces grid peak to {netPeakDemandMW.toLocaleString()} MW)</span></p>

                    {/* Market & Tariff */}
                    <div className="font-medium text-gray-600 pt-2">Market & Tariff:</div>
                    <p>• Market: {utility?.marketType?.toUpperCase() || 'REGULATED'}</p>
                    {tariff && (
                        <>
                            <p>• Peak Demand Charge: ${(tariff.peakDemandCharge / 1000).toFixed(2)}k/MW-mo
                               <span className="text-gray-400 ml-1">(recovers capacity costs)</span></p>
                            {tariff.maxDemandCharge && (
                                <p>• Max Demand Charge: ${(tariff.maxDemandCharge / 1000).toFixed(2)}k/MW-mo</p>
                            )}
                        </>
                    )}

                    {/* Energy Costs */}
                    <div className="font-medium text-gray-600 pt-2">Energy Costs:</div>
                    <p>• Wholesale Energy: ${wholesaleCost}/MWh</p>
                    <p>• Tariff Energy: ${tariffEnergyCost.toFixed(2)}/MWh</p>
                    {isPassThrough && (
                        <p className="text-green-600">• Energy spread nets to zero (wholesale pass-through)</p>
                    )}

                    {/* Infrastructure */}
                    <div className="font-medium text-gray-600 pt-2">Infrastructure Costs:</div>
                    <p>• CIAC Recovery: {ciacPercent}%
                       <span className="text-gray-400 ml-1">(DC pays upfront)</span></p>
                    <p>• Network Upgrades: ${networkCost}k/MW
                       <span className="text-gray-400 ml-1">(socialized portion)</span></p>
                    {utility?.hasCapacityMarket && (
                        <p>• Capacity Price: ${utility.capacityPrice2024?.toFixed(0) || 'N/A'}/MW-day</p>
                    )}

                    {/* Methodology Link */}
                    <a href="/methodology#revenue-adequacy"
                       className="text-blue-600 hover:underline block pt-2">
                        → See detailed methodology
                    </a>
                </div>
            </details>
        </div>
    );
};

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
        selectedUtilityId,
        selectedUtilityProfile,
        selectUtilityProfile,
        utilityProfiles,
        forecastScenario,
        setForecastScenario,
    } = useCalculator();

    const [activeSection, setActiveSection] = useState('utility');
    const [showAssumptions, setShowAssumptions] = useState(false);

    const DC_CAPACITY_RANGE = {
        min: 500,
        max: 30000,  // Increased to accommodate macro-level growth projections
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
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-4">Calculator: Your Community's Numbers</h1>
                <p className="text-lg text-slate-300 max-w-3xl">
                    Adjust the parameters below to match your community's utility and the proposed data
                    center. See how different configurations affect projected electricity costs.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Input panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Location Selector */}
                    <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl border-2 border-slate-200 p-4">
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                            Select Your Utility / Location
                        </label>
                        <select
                            value={selectedUtilityId}
                            onChange={(e) => selectUtilityProfile(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-slate-900 font-medium"
                        >
                            {getUtilitiesGroupedByState().map((group) => (
                                <optgroup key={group.state} label={group.state || 'Other Options'}>
                                    {group.utilities.map((profile) => (
                                        <option key={profile.id} value={profile.id}>
                                            {profile.shortName}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {selectedUtilityProfile && selectedUtilityProfile.id !== 'custom' && (
                            <div className="mt-3 text-xs text-slate-600 space-y-1">
                                <p><strong>{selectedUtilityProfile.residentialCustomers.toLocaleString()}</strong> residential customers in rate base</p>
                            </div>
                        )}

                        {/* Growth Forecast Scenario Toggle */}
                        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-700">Growth Forecast</span>
                                <div className="flex rounded-md overflow-hidden border border-slate-300">
                                    <button
                                        onClick={() => setForecastScenario('conservative')}
                                        className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                                            forecastScenario === 'conservative'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Conservative
                                    </button>
                                    <button
                                        onClick={() => setForecastScenario('aggressive')}
                                        className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                                            forecastScenario === 'aggressive'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Aggressive
                                    </button>
                                </div>
                            </div>

                            {selectedUtilityProfile && selectedUtilityProfile.market?.type && (
                                <div className="text-[10px] text-slate-600 space-y-0.5">
                                    <p className="font-medium text-slate-700">
                                        {MARKET_FORECASTS[selectedUtilityProfile.market.type]?.marketName || selectedUtilityProfile.market.type.toUpperCase()}
                                    </p>
                                    <p>
                                        Projected DC growth: <span className="font-semibold">{(dataCenter.capacityMW / 1000).toFixed(1)} GW</span> by 2035
                                    </p>
                                    <p className="text-slate-400">
                                        Phased 2027-2035 (~{Math.round(dataCenter.capacityMW / 9).toLocaleString()} MW/year)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Scarcity Warning - Hockey Stick Indicator */}
                        {utility.hasCapacityMarket && utility.totalGenerationCapacityMW && (
                            <ReserveMarginIndicator
                                utility={utility}
                                dcCapacityMW={dataCenter.capacityMW}
                                peakCoincidence={dataCenter.firmPeakCoincidence}
                            />
                        )}

                        {/* Market Assumptions Panel */}
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setShowAssumptions(!showAssumptions)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <span className="text-xs font-semibold text-slate-700">Calculation Assumptions</span>
                                <svg
                                    className={`w-4 h-4 text-slate-500 transition-transform ${showAssumptions ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showAssumptions && (
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                                    <p>Market: <span className="font-medium text-slate-800">{utility.marketType?.toUpperCase() || 'REGULATED'}</span></p>
                                    <p>Wholesale Energy: <span className="font-medium text-slate-800">${utility.marginalEnergyCost || 38}/MWh</span></p>
                                    <p>CIAC Recovery: <span className="font-medium text-slate-800">{((utility.interconnection?.ciacRecoveryFraction || 0.60) * 100).toFixed(0)}%</span>
                                        <span className="text-slate-400 ml-1">(DC pays upfront)</span>
                                    </p>
                                    <p>Network Upgrades: <span className="font-medium text-slate-800">${((utility.interconnection?.networkUpgradeCostPerMW || 140000) / 1000).toFixed(0)}k/MW</span>
                                        <span className="text-slate-400 ml-1">(socialized)</span>
                                    </p>
                                    {utility.hasCapacityMarket && (
                                        <p>Capacity Price: <span className="font-medium text-slate-800">${utility.capacityPrice2024?.toFixed(0) || 'N/A'}/MW-day</span></p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

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
                                label="Projected DC Growth by 2035"
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
                                        value={dataCenter.flexPeakCoincidence || 0.75}
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
                                    % of data center capacity
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
                                        residentialCustomers: 100000,
                                        averageMonthlyBill: 125,
                                        systemPeakMW: 1500,
                                    });
                                    updateDataCenter({ capacityMW: 500, onsiteGenerationMW: 100 });
                                }}
                                className="w-full text-left px-3 py-2 text-sm bg-white rounded border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                            >
                                <span className="font-medium">Small Utility</span>
                                <span className="text-gray-500"> - 100k customers, 1.5 GW peak, 500 MW data center</span>
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
                                <span className="text-gray-500"> - 2M customers, 20 GW peak, 5 GW data center</span>
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
                                <span className="text-gray-500"> - Large data center relative to utility (100% of peak)</span>
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
                            Projected impact of {(dataCenter.capacityMW / 1000).toFixed(1)} GW data center growth by 2035
                            <span className="block text-xs text-gray-400 mt-1">
                                For {utility.residentialCustomers.toLocaleString()} residential customers • Growth phased 2027-2035
                            </span>
                        </p>
                        <TrajectoryChart height={350} />
                    </div>

                    {/* Key findings - moved up for prominence */}
                    <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                        <h3 className="font-semibold text-green-900 mb-4">Key Findings for Your Community</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Optimized Data Center vs Baseline</p>
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
                                <p className="text-xs text-gray-500">optimized vs typical data center</p>
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
                            <RevenueAdequacyIndicator
                                utility={utility}
                                tariff={selectedUtilityProfile?.tariff}
                                dcCapacityMW={dataCenter.capacityMW}
                                loadFactor={dataCenter.flexLoadFactor || 0.95}
                                peakCoincidence={dataCenter.flexPeakCoincidence || 0.75}
                                onsiteGenerationMW={dataCenter.onsiteGenerationMW || 0}
                                scenarioLabel="optimized"
                            />
                        </div>
                    </div>

                    {/* Summary stats - compact view */}
                    <SummaryCards compact={true} />
                </div>
            </div>

            {/* Energy View Link */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl border border-slate-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-slate-800">Visualize Grid Impact</h3>
                        <p className="text-sm text-slate-600">
                            See hourly load profiles and load duration curves for each scenario
                        </p>
                    </div>
                    <Link
                        href="/energy-view"
                        className="px-5 py-2.5 text-white bg-slate-700 rounded-lg hover:bg-slate-600 font-medium flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Energy View
                    </Link>
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
                        <Link
                            href="/methodology"
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            View Methodology
                        </Link>
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
