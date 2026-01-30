'use client';

import { useState, useEffect } from 'react';
import {
    INFRASTRUCTURE_COSTS,
    TIME_PARAMS,
    WORKLOAD_TYPES,
    DEFAULT_UTILITY,
    DEFAULT_DATA_CENTER,
    DC_RATE_STRUCTURE,
    SUPPLY_CURVE,
    formatCurrency,
    calculateAggregateFlexibility,
} from '@/lib/constants';
import { MARKET_FORECASTS, getNationalGrowthProjection } from '@/lib/marketForecasts';

interface SectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
    expandedSection: string | null;
    toggleSection: (id: string) => void;
    badge?: string;
    badgeColor?: string;
}

const Section = ({ id, title, children, expandedSection, toggleSection, badge, badgeColor = 'bg-blue-100 text-blue-800' }: SectionProps) => {
    const isExpanded = expandedSection === id;
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => toggleSection(id)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    {badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${badgeColor}`}>
                            {badge}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && (
                <div className="px-6 py-4 bg-white">
                    {children}
                </div>
            )}
        </div>
    );
};

interface CarbonData {
    development: {
        totalInputTokens: number;
        totalOutputTokens: number;
        totalTokens: number;
        sessions: number;
        lastUpdated: string;
    };
    carbonMetrics: {
        gCO2PerThousandTokens: number;
        totalKgCO2: number;
        hamburgerEquivalentKg: number;
    };
}

export default function MethodologyPage() {
    // Default to 'data-sources' so Revenue Adequacy section is visible
    const [expandedSection, setExpandedSection] = useState<string | null>('data-sources');
    const [carbonData, setCarbonData] = useState<CarbonData | null>(null);

    useEffect(() => {
        fetch('/api/carbon')
            .then(res => res.json())
            .then(data => setCarbonData(data))
            .catch(err => console.error('Failed to fetch carbon data:', err));
    }, []);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Derived carbon values
    const totalTokens = carbonData?.development?.totalTokens ?? 400000;
    const gCO2PerK = carbonData?.carbonMetrics?.gCO2PerThousandTokens ?? 1.0;
    const totalKgCO2 = carbonData?.carbonMetrics?.totalKgCO2 ?? 0.4;
    const hamburgerKg = carbonData?.carbonMetrics?.hamburgerEquivalentKg ?? 3.5;
    const hamburgerEquiv = totalKgCO2 / hamburgerKg;

    // Calculate aggregate flexibility
    const aggregateFlexibility = calculateAggregateFlexibility(WORKLOAD_TYPES);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-8 border border-slate-200">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                    Methodology & Technical Documentation
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl">
                    This calculator models how large data center loads affect residential electricity bills,
                    with particular attention to <strong>capacity market dynamics</strong> and the supply curve
                    effects that can cause cost spillovers to existing ratepayers.
                </p>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                        <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Endogenous Capacity Pricing</h2>
                        <p className="text-gray-600 mb-4">
                            This calculator models how capacity prices respond dynamically to changes in reserve margin.
                            When large data center loads consume available reserves, prices can spike non-linearly.
                            The PJM 2025/26 auction provides a real-world example of this dynamic.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-700">$269.92</p>
                                <p className="text-xs text-gray-500">PJM 2025/26 capacity price ($/MW-day)</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-700">10x</p>
                                <p className="text-xs text-gray-500">Increase from prior year ($28.92)</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-700">63%</p>
                                <p className="text-xs text-gray-500">Attributed to data center load growth</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Sections */}
            <div className="space-y-4">
                {/* MODEL OVERVIEW */}
                <Section
                    id="model-overview"
                    title="Model Overview"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Our model projects residential electricity bills under four scenarios, each representing
                            different data center operational strategies:
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                    <h4 className="font-semibold text-gray-900">Baseline</h4>
                                </div>
                                <p className="text-sm">
                                    Normal cost growth from infrastructure aging, inflation, and baseline system upgrades.
                                    No data center load added.
                                </p>
                            </div>
                            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <h4 className="font-semibold text-gray-900">Typical Data Center (Firm Load)</h4>
                                </div>
                                <p className="text-sm">
                                    Data center operates at {(DEFAULT_DATA_CENTER.firmLoadFactor * 100).toFixed(0)}% load factor,
                                    adding 100% of capacity to system peak. Maximum infrastructure and capacity market impact.
                                </p>
                            </div>
                            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <h4 className="font-semibold text-gray-900">Flexible Data Center</h4>
                                </div>
                                <p className="text-sm">
                                    Data center curtails {((1 - DEFAULT_DATA_CENTER.flexPeakCoincidence) * 100).toFixed(0)}% during peaks
                                    (validated by EPRI DCFlex). Runs at {(DEFAULT_DATA_CENTER.flexLoadFactor * 100).toFixed(0)}% load factor
                                    by shifting workloads to off-peak hours.
                                </p>
                            </div>
                            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <h4 className="font-semibold text-gray-900">Optimized (Flex + Dispatchable)</h4>
                                </div>
                                <p className="text-sm">
                                    Flexible operation plus onsite generation during peaks. Minimizes grid draw and
                                    can actually <em>reduce</em> system peak contribution.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-2">About the 25% Flexibility Assumption</p>
                            <p className="text-sm text-gray-700">
                                The 25% peak reduction capability is based on{' '}
                                <a href="https://dcflex.epri.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    EPRI's DCFlex initiative
                                </a>
                                —a 2024 field demonstration at a major data center that achieved 25% sustained power reduction
                                during 3-hour peak events. While theoretical analysis suggests up to {(aggregateFlexibility * 100).toFixed(0)}% is possible,
                                we use the field-validated 25% as a conservative baseline. See the{' '}
                                <strong>Workload Flexibility Model</strong> section for details.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* CORE CALCULATION LOGIC */}
                <Section
                    id="core-logic"
                    title="Core Calculation Logic"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p><strong>Basic Formula:</strong></p>
                        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <p>Monthly Impact = (Infrastructure Costs - DC Revenue Offset) x Residential Allocation / Customers / 12</p>
                            <p className="mt-2 text-gray-500">+ Socialized Capacity Cost / Customers / 12 <span className="text-xs">(capacity markets only)</span></p>
                        </div>

                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900 mb-2">Revenue Flow-Through (Cost Causation Principle)</p>
                            <p className="text-sm text-gray-700 mb-2">
                                Data center tariff payments offset infrastructure costs. The flow-through rate varies by market structure:
                            </p>
                            <table className="w-full text-sm mb-2">
                                <thead>
                                    <tr className="border-b border-green-200">
                                        <th className="text-left py-1 font-medium">Market Type</th>
                                        <th className="text-right py-1 font-medium">Demand Charges</th>
                                        <th className="text-right py-1 font-medium">Energy Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600">
                                    <tr className="border-b border-green-100">
                                        <td className="py-1">Regulated (cost-of-service)</td>
                                        <td className="text-right font-medium">90%</td>
                                        <td className="text-right font-medium">85%</td>
                                    </tr>
                                    <tr className="border-b border-green-100">
                                        <td className="py-1">ERCOT (energy-only)</td>
                                        <td className="text-right">70%</td>
                                        <td className="text-right">65%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1">Capacity Markets (PJM/MISO)</td>
                                        <td className="text-right">60%</td>
                                        <td className="text-right">50%</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-500">
                                In regulated markets, PUC-approved tariffs are designed to recover the utility's cost of serving each customer class.
                                When a data center pays its industrial tariff rates, those costs are considered "recovered"—not shifted to residential customers.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Note: These flow-through rates determine how DC tariff revenue offsets infrastructure costs.
                                This is separate from the residential allocation percentage (30-42% by market),
                                which determines what share of remaining net costs residential customers bear.
                            </p>
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-semibold text-amber-900 mb-2">Capacity Market Addition (PJM/NYISO/MISO)</p>
                            <p className="text-sm text-gray-700">
                                For utilities in organized capacity markets, we add a <strong>Socialized Capacity Cost</strong> component.
                                When large loads consume reserve margin, capacity auction prices can spike,
                                and this price increase is paid by <em>all</em> existing customers on their existing load.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                This cost is calculated using <strong>endogenous capacity pricing</strong> (see dedicated section below).
                                Due to recent auction timeline compression (auctions now clear 11-18 months ahead rather than 3 years),
                                capacity costs apply immediately when data centers connect—current prices already reflect demand growth.
                            </p>
                        </div>

                        <p className="mt-6"><strong>Key Terms Explained:</strong></p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                            <div>
                                <span className="font-semibold">Load Factor:</span> Average power draw / nameplate capacity.
                                A 2,000 MW data center at 80% load factor draws 1,600 MW on average.
                            </div>
                            <div>
                                <span className="font-semibold">Peak Coincidence:</span> Fraction of capacity drawing power during system peak hours.
                                100% means full contribution to peak; 75% means the facility reduces load by 25% during peaks.
                            </div>
                            <div>
                                <span className="font-semibold">Curtailable:</span> The portion of load that can be temporarily reduced during grid stress events
                                by pausing or deferring non-time-sensitive workloads (e.g., AI training, batch processing).
                            </div>
                        </div>

                        <p className="mt-6"><strong>Firm vs Flexible Load Scenarios:</strong></p>
                        <table className="w-full text-sm mt-2">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 font-medium">Parameter</th>
                                    <th className="text-right py-2 font-medium">Firm Load</th>
                                    <th className="text-right py-2 font-medium">Flexible Load</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-2">Load Factor</td>
                                    <td className="text-right">{(DEFAULT_DATA_CENTER.firmLoadFactor * 100).toFixed(0)}%</td>
                                    <td className="text-right">{(DEFAULT_DATA_CENTER.flexLoadFactor * 100).toFixed(0)}%</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-2">Peak Coincidence</td>
                                    <td className="text-right">{(DEFAULT_DATA_CENTER.firmPeakCoincidence * 100).toFixed(0)}%</td>
                                    <td className="text-right">{(DEFAULT_DATA_CENTER.flexPeakCoincidence * 100).toFixed(0)}%</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-2">Curtailable During Peaks</td>
                                    <td className="text-right">0%</td>
                                    <td className="text-right">{((1 - DEFAULT_DATA_CENTER.flexPeakCoincidence) * 100).toFixed(0)}%</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm">
                                <strong>Why 95% load factor for flexible?</strong> By shifting deferrable workloads (AI training, batch jobs)
                                to off-peak hours, data centers can run at higher average utilization while reducing peak contribution.
                            </p>
                            <p className="text-sm mt-2">
                                <strong>Note on firm load behavior:</strong> Firm data centers don't run at a constant 80%—they fluctuate
                                between roughly 70-100% of interconnected capacity based on IT workload demands. The key difference is that
                                they <em>cannot coordinate</em> their load reductions with grid stress events. When the grid needs relief during
                                peak hours, a firm data center may happen to be running at 90% or 100%, while a flexible data center can
                                deliberately curtail to 75% of capacity.
                            </p>
                        </div>

                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900 mb-2">Grid Capacity Math: Why 33% More?</p>
                            <p className="text-sm text-green-800">
                                If a grid has X MW of available capacity for new load:
                            </p>
                            <ul className="list-disc list-inside text-sm text-green-800 mt-2 space-y-1">
                                <li><strong>Firm load</strong> (100% peak): Grid supports X MW of data center capacity</li>
                                <li><strong>Flexible load</strong> (75% peak): Grid supports X / 0.75 = <strong>1.33X MW</strong> of data center capacity</li>
                            </ul>
                            <p className="text-sm text-green-800 mt-2">
                                Result: <strong>33% more data center capacity</strong> can connect to the same grid infrastructure
                                when operating flexibly, because each MW only adds 0.75 MW to the system peak.
                            </p>
                        </div>

                        <p className="mt-6"><strong>Revenue Offset (DC Revenue Contribution):</strong></p>
                        <p className="text-sm mb-3">
                            Data centers generate significant revenue for utilities, which offsets infrastructure costs before
                            any net impact flows to residential customers. In some scenarios, revenue can exceed infrastructure
                            costs, resulting in a net benefit to ratepayers.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-4 text-sm">
                            <div>
                                <span className="font-semibold text-gray-900">1. Energy Revenue (Volume x Margin)</span>
                                <p className="mt-1">
                                    Utilities earn margin on each MWh sold, calculated dynamically as <code className="text-xs bg-gray-200 px-1 rounded">tariff energy rate - wholesale cost</code>.
                                    Wholesale costs vary by market: ERCOT $45, PJM $42, MISO $35, TVA $32, SPP $28, NYISO $55, Regulated $38/MWh.
                                    This margin contributes to the utility's revenue requirement, which is then allocated across all customers.
                                </p>
                                <div className="mt-2 pl-4 border-l-2 border-blue-300">
                                    <p><strong>Firm (80% LF):</strong> 1,000 MW x 80% x 8,760 hrs = 7,008,000 MWh/year</p>
                                    <p><strong>Flexible (95% LF):</strong> 1,000 MW x 95% x 8,760 hrs = 8,322,000 MWh/year</p>
                                    <p className="text-green-700 font-medium mt-1">
                                        Flexible generates 19% more energy revenue (~$6.4M more annually at same capacity)
                                    </p>
                                </div>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-900">2. Demand Charge Revenue (Coincident vs Non-Coincident Peak)</span>
                                <p className="mt-1">
                                    Large customer demand charges typically have <strong>two components</strong>:
                                </p>
                                <div className="mt-2 pl-4 border-l-2 border-amber-300 space-y-3">
                                    <div>
                                        <p><strong>Coincident Peak (CP) Charges</strong> (~${DC_RATE_STRUCTURE.coincidentPeakChargePerMWMonth.toLocaleString()}/MW-month)</p>
                                        <p className="text-gray-600 text-xs mt-1">
                                            Based on usage during <em>system</em> peak hours. Flexible DCs pay <strong>less</strong> because
                                            they curtail during these critical periods.
                                        </p>
                                    </div>
                                    <div>
                                        <p><strong>Non-Coincident Peak (NCP) Charges</strong> (~${DC_RATE_STRUCTURE.nonCoincidentPeakChargePerMWMonth.toLocaleString()}/MW-month)</p>
                                        <p className="text-gray-600 text-xs mt-1">
                                            Based on the customer's own monthly peak (any time). Both firm and flexible DCs pay
                                            similar NCP charges based on their installed capacity.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                                    <p className="text-sm text-amber-900">
                                        <strong>Important nuance:</strong> When comparing "same interconnection" scenarios, flexible DCs
                                        generate <strong>less</strong> CP demand revenue (they curtail during peaks) but similar NCP revenue.
                                        The net benefit to ratepayers comes primarily from reduced infrastructure costs, not increased demand charges.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-6"><strong>Residential Cost Allocation:</strong></p>
                        <p className="text-sm mb-3">
                            The share of net costs allocated to residential customers depends on the utility's market structure
                            and how well the data center's tariff payments cover its cost of service.
                            See the <strong>"Market Structures & Cost Allocation Framework"</strong> section below for detailed
                            allocation factors by market type (regulated, PJM, ERCOT, etc.).
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                            <li><strong>Base allocation:</strong> Varies by market (30-40% typical)</li>
                            <li><strong>Cost causation adjustment:</strong> In regulated markets, allocation reduced based on DC cost recovery ratio (formula: Base × √(1 - Cost Recovery))</li>
                            <li><strong>Rate spreading benefit:</strong> High load factor (≥80%) industrial loads spread fixed costs over more kWh, benefiting all ratepayers</li>
                            <li><strong>Regulatory lag:</strong> Changes phase in over ~5 years through rate case proceedings</li>
                            <li><strong>Market multipliers:</strong> ERCOT uses dynamic allocation based on DC penetration; capacity markets use endogenous pricing model</li>
                        </ul>

                        <p className="mt-4 text-sm text-gray-500">
                            The baseline trajectory includes optional escalation factors: {(TIME_PARAMS.generalInflation * 100).toFixed(1)}% annual
                            inflation and {(INFRASTRUCTURE_COSTS.annualBaselineUpgradePercent * 100).toFixed(1)}% annual
                            infrastructure replacement costs. Toggle these in the calculator to see their effect on future bills.
                        </p>
                    </div>
                </Section>

                {/* SUPPLY CURVE */}
                <Section
                    id="hockey-stick"
                    title="Capacity Market Supply Curve"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            In organized capacity markets (PJM, NYISO, MISO), capacity prices are determined through auctions
                            that clear based on the <strong>Variable Resource Requirement (VRR) curve</strong>. This curve creates
                            a non-linear price pattern: prices are stable when reserves are abundant, but spike exponentially
                            as reserve margins decline below the target level.
                        </p>

                        {/* Supply Curve Diagram */}
                        <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-4 text-center">Capacity Price vs. Reserve Margin (VRR Curve)</h4>
                            <div className="bg-white p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                <pre className="text-gray-600">
{`Price ($/MW-day)
    ^
    |
$1,120 | *  Emergency
    |   *
 $700 |      *                                Severe Scarcity
    |           *
 $420 |                *                      Scarcity
    |                     *
 $280 |---------------------*---------------- Target (CONE)
    |                           *
  $28 |                                *      Abundant
  $14 |                                    *
    +-----|-----|-----|-----|-----|-----|---> Reserve Margin
          0%    5%   10%   15%   20%   25%
                     ^
                     |
              Target Reserve Margin (15%)`}
                                </pre>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                The curve shows how capacity prices respond to changes in reserve margin.
                                Below 15%, prices rise sharply. Below 10%, prices spike exponentially.
                            </p>
                        </div>

                        {/* VRR Curve Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Reserve Margin</th>
                                        <th className="text-right py-3 px-4 font-medium">Price Multiplier</th>
                                        <th className="text-right py-3 px-4 font-medium">Capacity Price</th>
                                        <th className="text-left py-3 px-4 font-medium">Condition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {SUPPLY_CURVE.slopes.map((slope, idx) => {
                                        let rowClass = 'border-t border-gray-100';
                                        let condition = 'Abundant';
                                        if (slope.margin < 0.05) {
                                            rowClass += ' bg-red-100';
                                            condition = 'Emergency';
                                        } else if (slope.margin < 0.10) {
                                            rowClass += ' bg-red-50';
                                            condition = 'Severe Scarcity';
                                        } else if (slope.margin < 0.15) {
                                            rowClass += ' bg-amber-50';
                                            condition = 'Scarcity';
                                        } else if (slope.margin === 0.15) {
                                            rowClass += ' bg-blue-50';
                                            condition = 'Target (CONE)';
                                        }
                                        return (
                                            <tr key={idx} className={rowClass}>
                                                <td className="py-2 px-4 font-medium">{(slope.margin * 100).toFixed(0)}%</td>
                                                <td className="py-2 px-4 text-right">{slope.priceMultiplier.toFixed(2)}x</td>
                                                <td className="py-2 px-4 text-right font-medium">
                                                    ${(SUPPLY_CURVE.costOfNewEntry * slope.priceMultiplier).toFixed(0)}/MW-day
                                                </td>
                                                <td className="py-2 px-4 text-gray-600">{condition}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-2">What is CONE?</p>
                            <p className="text-sm text-gray-700">
                                <strong>CONE (Cost of New Entry)</strong> = ${SUPPLY_CURVE.costOfNewEntry}/MW-day — the estimated cost
                                at which new generation capacity becomes economically viable. When reserve margins hit the target (15%),
                                capacity prices clear at CONE. Our model uses this as the anchor point for the VRR curve.
                                Source:{' '}
                                <a href="https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-resource-demand-doc/variable-resource-requirement-curve.ashx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    PJM VRR Curve Documentation
                                </a>
                            </p>
                        </div>

                        {/* Reserve Margin Calculation */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Reserve Margin Calculation</h4>
                            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm overflow-x-auto space-y-2">
                                <p><strong>Reserve Margin = (Total Capacity - Peak Load) / Peak Load</strong></p>
                                <p className="text-gray-500 mt-2">Example for AEP Ohio:</p>
                                <p>Old Reserve Margin = (13,200 MW - 12,000 MW) / 12,000 MW = <strong>10%</strong></p>
                                <p className="mt-2">After 1,000 MW data center (100% peak coincidence):</p>
                                <p>New Peak = 12,000 MW + 1,000 MW = 13,000 MW</p>
                                <p>New Reserve Margin = (13,200 MW - 13,000 MW) / 13,000 MW = <strong>1.5%</strong></p>
                                <p className="text-red-600 mt-2">Result: Reserve margin drops from 10% to 1.5% - Capacity prices spike</p>
                            </div>
                        </div>

                        {/* ISO-Level vs Utility-Level Calculations */}
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="font-semibold text-green-900 mb-3">ISO-Level vs Utility-Level Reserve Margin</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Capacity markets (PJM, MISO, NYISO) operate at the <strong>ISO/RTO level</strong>, not individual utility level.
                                Reserve margin calculations must reflect this regional scope to accurately model price impacts.
                            </p>
                            <table className="w-full text-sm mb-3">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Market Type</th>
                                        <th className="text-left py-2 font-medium">Reserve Margin Scope</th>
                                        <th className="text-left py-2 font-medium">System Peak Used</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-blue-700 font-medium">PJM</td>
                                        <td className="text-xs">ISO-level (PJM-wide)</td>
                                        <td className="text-xs">~150 GW total PJM peak</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-purple-700 font-medium">MISO</td>
                                        <td className="text-xs">ISO-level (MISO-wide)</td>
                                        <td className="text-xs">~127 GW total MISO peak</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-indigo-700 font-medium">NYISO</td>
                                        <td className="text-xs">ISO-level (NYISO-wide)</td>
                                        <td className="text-xs">~32 GW total NYISO peak</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-amber-700 font-medium">ERCOT</td>
                                        <td className="text-xs">ISO-level (energy-only market)</td>
                                        <td className="text-xs">~90 GW total ERCOT peak</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-green-700 font-medium">Regulated/SPP/TVA</td>
                                        <td className="text-xs">Utility-level</td>
                                        <td className="text-xs">Individual utility peak (no shared capacity market)</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-600">
                                <strong>Why this matters:</strong> A 10 GW data center added to a 5 GW utility in PJM impacts the
                                ~150 GW PJM reserve margin (~7% increase), not the utility's margin alone. The price
                                increase is then borne by that utility's customers at their share of the ISO-wide impact.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* CAPACITY COST SPILLOVERS */}
                <Section
                    id="socialized-scarcity"
                    title="Capacity Cost Spillovers to Existing Customers"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            When a data center triggers a capacity price increase, the cost isn't borne by the data center alone.
                            The increased capacity price applies to <strong>all load in the market</strong>, meaning existing
                            residential customers pay higher prices on their existing consumption. This spillover effect
                            has drawn regulatory attention in organized capacity markets.
                        </p>

                        {/* PJM Case Study */}
                        <div className="border border-amber-200 rounded-lg p-5 bg-amber-50">
                            <h4 className="font-semibold text-amber-900 mb-3">
                                Case Study: PJM 2025/26 Capacity Auction
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                PJM's 2025/26 capacity auction illustrates how rapid load growth can affect prices for all customers.
                                When a large data center adds to system peak, it doesn't just pay higher capacity prices for its own load—
                                the capacity price increase affects <strong>all existing load</strong>.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-semibold text-amber-800 text-sm mb-1">2025/26 Auction Result</p>
                                    <p className="text-2xl font-bold text-slate-700">$269.92/MW-day</p>
                                    <p className="text-xs text-gray-600">Up from $28.92 the prior year</p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-semibold text-amber-800 text-sm mb-1">Data Center Attribution</p>
                                    <p className="text-2xl font-bold text-slate-700">63%</p>
                                    <p className="text-xs text-gray-600">Of price increase attributed to DC load growth</p>
                                </div>
                            </div>
                        </div>

                        {/* Socialized Cost Calculation */}
                        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                            <h4 className="font-semibold text-amber-900 mb-3">Socialized Cost Impact Formula</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                When the data center causes capacity prices to rise, existing customers pay the higher
                                price on their <strong>existing load</strong>. This is the "socialization" effect:
                            </p>
                            <div className="bg-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <p><strong>Socialized Cost = Existing Residential Peak x (New Price - Old Price) x 365 days</strong></p>
                                <p className="text-gray-500 mt-3">Where:</p>
                                <ul className="text-gray-600 mt-2 space-y-1">
                                    <li>- Existing Residential Peak = System Peak x 35% residential share</li>
                                    <li>- Price difference from VRR curve interpolation</li>
                                    <li>- Applied to capacity market utilities only</li>
                                </ul>
                            </div>
                            <p className="text-sm text-amber-800 mt-3">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium text-xs">Model Assumption</span>
                                {' '}We assume 35% of system peak is residential load.
                                This share varies by utility but is consistent with typical embedded cost allocation studies.
                            </p>
                        </div>

                        {/* How Flexibility Helps */}
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="font-semibold text-green-900 mb-3">How Flexible Data Centers Reduce Price Spikes</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Flexible data centers that curtail during peak hours add less to system peak, which means:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">✓</span>
                                    <span><strong>Smaller reserve margin impact:</strong> 75% peak coincidence = 25% less contribution to peak</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">✓</span>
                                    <span><strong>Lower capacity price increase:</strong> Less reserve margin erosion = smaller price multiplier on VRR curve</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">✓</span>
                                    <span><strong>Reduced socialized cost:</strong> Existing ratepayers face smaller price increase on their existing load</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">✓</span>
                                    <span><strong>Onsite generation:</strong> Further reduces net peak draw and capacity market impact</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* AUCTION LAG */}
                <Section
                    id="auction-lag"
                    title="Capacity Auction Timing and Rate Impacts"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            In PJM and other organized capacity markets, the <strong>Base Residual Auction (BRA)</strong> historically
                            cleared approximately 3 years before the delivery year. However, recent schedule changes and accelerated
                            proceedings have compressed this timeline significantly.
                        </p>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-900 mb-2">Recent PJM Auction Timeline (Actual)</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• <strong>2025/26 delivery year:</strong> Auction held July 2024 (11 months ahead)</li>
                                <li>• <strong>2026/27 delivery year:</strong> Auction held July 2025 (11 months ahead)</li>
                                <li>• <strong>2027/28 delivery year:</strong> Auction held December 2025 (18 months ahead)</li>
                            </ul>
                            <p className="text-sm text-amber-800 mt-3">
                                Because data center load growth was already factored into these recent auctions, capacity costs
                                are already elevated and flowing through to customer bills. Our model applies capacity costs <strong>immediately</strong> when
                                data centers connect, rather than using a forward auction lag, since current prices already reflect demand growth.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                                <h4 className="font-semibold text-amber-900 mb-2">Direct Infrastructure Costs</h4>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>- Transmission infrastructure upgrades</li>
                                    <li>- Distribution system investments</li>
                                    <li>- Interconnection costs</li>
                                </ul>
                                <p className="text-xs text-amber-800 mt-2 font-medium">
                                    Apply when data center connects
                                </p>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                <h4 className="font-semibold text-slate-900 mb-2">Capacity Costs (Immediate)</h4>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>- Capacity auction price impacts</li>
                                    <li>- Applied to all existing load</li>
                                    <li>- Already reflected in current prices</li>
                                </ul>
                                <p className="text-xs text-slate-700 mt-2 font-medium">
                                    Apply when data center connects
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Model Implementation</p>
                            <div className="mt-3 font-mono text-xs bg-white p-3 rounded overflow-x-auto">
                                <p className="text-gray-500">// In trajectory calculations:</p>
                                <p>const marketLag = 0; // Capacity costs apply immediately</p>
                                <p className="mt-2">// Both direct and capacity costs apply when DC connects</p>
                                <p>if (yearsOnline &gt;= 0) {`{`}</p>
                                <p className="pl-4">applyDirectCosts();</p>
                                <p className="pl-4">applyCapacityCosts();</p>
                                <p>{`}`}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Note: We previously modeled a lag for capacity costs, but recent auction timing changes mean
                                current prices already reflect data center demand growth.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* DATA SOURCES */}
                <Section
                    id="data-sources"
                    title="Data Sources & Specific Values Used"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p className="text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <strong>Transparency Note:</strong> Below we document data sources where available.
                            Values marked with <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-medium">Model Assumption</span> are
                            based on industry understanding or selected from published ranges, but not directly cited from a specific source.
                            You can substitute your own values in the calculator.
                        </p>

                        {/* EIA Data */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Energy Information Administration (EIA)
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">U.S. Department of Energy - Electricity Data</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Data Point</th>
                                        <th className="text-right py-2 font-medium">Value</th>
                                        <th className="text-left py-2 pl-4 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Average residential monthly bill</td>
                                        <td className="text-right font-medium">${DEFAULT_UTILITY.averageMonthlyBill}</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                EIA Table 5A - Average Monthly Bill by State
                                            </a>
                                            <span className="block text-gray-400">National average: ~$138/month (2023)</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Residential share of total sales</td>
                                        <td className="text-right font-medium">{(DEFAULT_UTILITY.residentialEnergyShare * 100).toFixed(0)}%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.eia.gov/electricity/annual/html/epa_01_02.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                EIA Electric Power Annual, Table 1.2
                                            </a>
                                            <span className="block text-gray-400">2023: Residential 1,468 TWh of 4,178 TWh total = 35.1%</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Electricity price inflation</td>
                                        <td className="text-right font-medium">{(TIME_PARAMS.electricityInflation * 100).toFixed(1)}%/yr</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.eia.gov/electricity/annual/html/epa_01_01.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                EIA Electric Power Annual, Table 1.1
                                            </a>
                                            <span className="block text-gray-400">10-year CAGR (2013-2023) for residential rates</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">General inflation rate</td>
                                        <td className="text-right font-medium">{(TIME_PARAMS.generalInflation * 100).toFixed(1)}%/yr</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.bls.gov/cpi/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Bureau of Labor Statistics CPI Data
                                            </a>
                                            <span className="block text-gray-400">Federal Reserve 2% target + utility capital cost premium</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Infrastructure Costs */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Transmission & Distribution Infrastructure Costs
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">Based on utility rate cases and regional transmission planning studies</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Data Point</th>
                                        <th className="text-right py-2 font-medium">Value</th>
                                        <th className="text-left py-2 pl-4 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Transmission cost per MW</td>
                                        <td className="text-right font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.transmissionCostPerMW)}/MW</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://cdn.misoenergy.org/MTEP23%20Executive%20Summary630586.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                MISO MTEP23 Transmission Expansion Plan
                                            </a>
                                            <span className="block text-gray-400">Range: $200k-$500k/MW; <span className="px-1 bg-amber-100 text-amber-800 rounded">$350k selected as median</span></span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Distribution cost per MW (base)</td>
                                        <td className="text-right font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.distributionCostPerMW)}/MW</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://docs.nrel.gov/docs/fy18osti/70710.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                NREL: The Cost of Distribution System Upgrades (2018)
                                            </a>
                                            <span className="block text-gray-400">Substation + feeder costs; <span className="px-1 bg-amber-100 text-amber-800 rounded">$150k inferred from study ranges</span></span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Distribution cost multiplier</td>
                                        <td className="text-right font-medium">10-100%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">Model Assumption</span>
                                            <span className="block text-gray-400 mt-1">Large DCs (&gt;20 MW) connect at transmission voltage: 10%. Medium (10-20 MW): 40%. Small (&lt;10 MW): 100%</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Annual infrastructure upgrade rate</td>
                                        <td className="text-right font-medium">{(INFRASTRUCTURE_COSTS.annualBaselineUpgradePercent * 100).toFixed(1)}%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.brattle.com/wp-content/uploads/2021/10/2021-10-12-Brattle-GridStrategies-Transmission-Planning-Report_v2.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Brattle/Grid Strategies: Transmission Planning (2021)
                                            </a>
                                            <span className="block text-gray-400">Report cites 1-2% range; <span className="px-1 bg-amber-100 text-amber-800 rounded">1.5% selected as midpoint</span></span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Capacity cost per MW-year</td>
                                        <td className="text-right font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.capacityCostPerMWYear)}/MW-yr</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://atb.nrel.gov/electricity/2024/fossil_energy_technologies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                NREL ATB 2024: Fossil Energy Technologies
                                            </a>
                                            <span className="block text-gray-400">Range: $98k-$175k/MW-yr; <span className="px-1 bg-amber-100 text-amber-800 rounded">$150k selected as representative</span></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Interconnection Cost Treatment */}
                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">
                                Interconnection Cost Treatment (CIAC vs Network Upgrades)
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Based on E3's "Tailored for Scale" methodology: costs for infrastructure exclusive to the data center
                                facility that are paid upfront via CIAC (Contribution in Aid of Construction) are excluded from
                                ratepayer impact calculations, as these are "simply passed through and would not have a ratepayer impact."
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">CIAC-Recovered (DC Pays Upfront)</p>
                                    <ul className="text-xs text-gray-600 space-y-0.5">
                                        <li>• Dedicated distribution substations</li>
                                        <li>• Interconnection lines to facility</li>
                                        <li>• Metering and protection equipment</li>
                                        <li>• Local transformer upgrades</li>
                                    </ul>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Network Upgrades (Potentially Socialized)</p>
                                    <ul className="text-xs text-gray-600 space-y-0.5">
                                        <li>• Transmission system reinforcement</li>
                                        <li>• Generation interconnection facilities</li>
                                        <li>• Regional grid upgrades</li>
                                        <li>• Congestion-driven improvements</li>
                                    </ul>
                                </div>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Market Type</th>
                                        <th className="text-right py-2 font-medium">CIAC Recovery</th>
                                        <th className="text-right py-2 font-medium">Network Cost/MW</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">SPP / Regulated (PSO-like)</td>
                                        <td className="text-right font-medium">95%</td>
                                        <td className="text-right font-medium">$100,000/MW</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">PJM (Dominion, AEP Ohio)</td>
                                        <td className="text-right font-medium">95%</td>
                                        <td className="text-right font-medium">$250,000/MW</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">ERCOT (4CP allocation)</td>
                                        <td className="text-right font-medium">70%</td>
                                        <td className="text-right font-medium">$105,000/MW</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">MISO / Other Regulated</td>
                                        <td className="text-right font-medium">55-60%</td>
                                        <td className="text-right font-medium">$140,000-165,000/MW</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-500 mt-2">
                                Source: E3 "Tailored for Scale" (Dec 2025), utility tariff analysis. CIAC recovery fractions
                                vary by utility policy and interconnection agreement terms.
                            </p>
                        </div>

                        {/* Revenue Adequacy */}
                        <div id="revenue-adequacy" className="border border-green-200 bg-green-50 rounded-lg p-4 scroll-mt-20">
                            <h4 className="font-semibold text-green-900 mb-2">
                                Revenue Adequacy Calculation
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Following E3 "Tailored for Scale" methodology, we calculate whether data center revenue (what they pay through tariffs)
                                covers their marginal cost-to-serve. A ratio above 1.0 indicates surplus revenue that can
                                benefit other ratepayers.
                            </p>
                            <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                                <p className="text-xs font-mono text-gray-700">
                                    Revenue Adequacy Ratio = Total DC Revenue / Marginal Cost to Serve
                                </p>
                                <p className="text-xs font-mono text-gray-700 mt-2">
                                    Surplus (or Deficit) = Total DC Revenue − Marginal Cost to Serve
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Where: Revenue = Demand Charges + Energy Charges + Customer Charges
                                </p>
                                <p className="text-xs text-gray-500">
                                    Cost = Marginal Capacity + Marginal Energy + Network Upgrades (annualized)
                                </p>
                            </div>

                            {/* Fuel Rider Revenue Treatment */}
                            <h5 className="font-medium text-gray-800 mt-4 mb-2">Fuel Rider Revenue Treatment</h5>
                            <p className="text-xs text-gray-600 mb-2">
                                Some utility tariffs (like PSO&apos;s LPL) use a &quot;fuel rider&quot; structure where the base
                                energy rate is low and wholesale energy costs are passed through separately:
                            </p>
                            <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                                <p className="text-xs font-mono text-gray-700">
                                    Total Energy Revenue = Base Tariff Rate + Fuel Rider (≈ Wholesale Cost)
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Detection: If tariff energy charge &lt; 80% of wholesale cost → fuel rider structure
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                For fuel rider tariffs, both the fuel rider revenue collection AND the wholesale energy cost
                                are included in the Revenue Adequacy calculation. This ensures the model correctly captures
                                that fuel costs are a straight pass-through with no margin impact.
                            </p>

                            {/* Market-Specific Capacity Cost Treatment */}
                            <h5 className="font-medium text-gray-800 mt-4 mb-2">Capacity Cost by Market Structure</h5>
                            <p className="text-xs text-gray-600 mb-2">
                                Different market structures have fundamentally different capacity cost mechanisms. Our model aligns
                                Revenue Adequacy calculations with the Bill Forecast to ensure consistent results:
                            </p>
                            <table className="w-full text-sm mb-4">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Market</th>
                                        <th className="text-left py-2 font-medium">Capacity Cost Method</th>
                                        <th className="text-left py-2 font-medium">Rationale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-amber-700 font-medium">ERCOT</td>
                                        <td className="text-xs text-gray-600">50% of embedded capacity cost (scarcity pricing risk premiums)</td>
                                        <td className="text-xs text-gray-500">Energy-only market - scarcity pricing and risk premiums flow through to ratepayers via retail providers</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-blue-700 font-medium">PJM / NYISO</td>
                                        <td className="text-xs text-gray-600">Capacity market price × peak demand × 365</td>
                                        <td className="text-xs text-gray-500">Capacity markets set explicit prices for reliability (~$60-150/MW-day)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-green-700 font-medium">SPP / Regulated</td>
                                        <td className="text-xs text-gray-600">Embedded cost minus demand charge recovery</td>
                                        <td className="text-xs text-gray-500">Demand charges ARE the capacity recovery mechanism in cost-of-service ratemaking</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-purple-700 font-medium">MISO</td>
                                        <td className="text-xs text-gray-600">Mix of capacity market and embedded costs</td>
                                        <td className="text-xs text-gray-500">Smaller capacity market with regulated utilities</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* CIAC Recovery Explanation */}
                            <h5 className="font-medium text-gray-800 mt-4 mb-2">CIAC Recovery Percentages</h5>
                            <p className="text-xs text-gray-600 mb-2">
                                <strong>CIAC (Contribution in Aid of Construction)</strong> represents the upfront payment data centers make
                                for interconnection infrastructure. Based on E3 study cost-causation principles, the percentage varies by market:
                            </p>
                            <table className="w-full text-sm mb-3">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Market</th>
                                        <th className="text-left py-2 font-medium">CIAC %</th>
                                        <th className="text-left py-2 font-medium">Explanation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">SPP / Regulated (PSO-like)</td>
                                        <td className="text-xs font-medium text-green-600">95%</td>
                                        <td className="text-xs text-gray-500">Vertically integrated, minimal interconnection queue, DC pays nearly full cost</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">PJM (Dominion, AEP Ohio)</td>
                                        <td className="text-xs font-medium text-green-600">95%</td>
                                        <td className="text-xs text-gray-500">DCs pay for own substations; &quot;Deep Grid&quot; transmission upgrades ($250k/MW)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">ERCOT</td>
                                        <td className="text-xs font-medium text-amber-600">70%</td>
                                        <td className="text-xs text-gray-500">Competitive market, moderate queue costs, some network upgrades socialized</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">MISO / Traditional Regulated</td>
                                        <td className="text-xs font-medium text-purple-600">55-60%</td>
                                        <td className="text-xs text-gray-500">Moderate queue, mix of direct assignment and socialization; varies by utility policy</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-500 mb-3">
                                The remaining percentage (non-CIAC) represents network upgrades that benefit multiple users and are
                                socialized across ratepayers over a 20-year recovery period.
                            </p>

                            {/* Original Cost Components Table */}
                            <h5 className="font-medium text-gray-800 mt-4 mb-2">Cost Components</h5>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Cost Component</th>
                                        <th className="text-left py-2 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Marginal Capacity Cost</td>
                                        <td className="text-xs text-gray-600">Market-specific (see table above)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Marginal Energy Cost</td>
                                        <td className="text-xs text-gray-600">Wholesale LMP (ERCOT $45, PJM $42, MISO $35, TVA $32/MWh)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Network Upgrade Cost</td>
                                        <td className="text-xs text-gray-600">Annualized over 20-year recovery period (non-CIAC portion only)</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-500 mt-3">
                                E3's analysis found typical data centers generate $33,500-$60,650/MW annual surplus when paying
                                standard industrial tariffs with appropriate demand charges.
                            </p>
                        </div>

                        {/* Cost Allocation */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Residential Cost Allocation Methodology
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">Based on standard ratemaking principles and utility tariff structures</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Data Point</th>
                                        <th className="text-right py-2 font-medium">Value</th>
                                        <th className="text-left py-2 pl-4 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Base residential allocation</td>
                                        <td className="text-right font-medium">{(DEFAULT_UTILITY.baseResidentialAllocation * 100).toFixed(0)}%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.raponline.org/wp-content/uploads/2023/09/rap-lazar-chernick-marcus-lebel-electric-cost-allocation-new-era-2020-january.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                RAP: Electric Cost Allocation for a New Era (2020)
                                            </a>
                                            <span className="block text-gray-400">Typical residential class allocation: 35-45% of revenue requirement</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Allocation weighting method</td>
                                        <td className="text-right font-medium">40/40/20</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">Model Assumption</span>
                                            <span className="block text-gray-400 mt-1">Simplified blend: 40% volumetric, 40% demand, 20% customer count. Actual utility methods vary.</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Total demand charge rate</td>
                                        <td className="text-right font-medium">${DC_RATE_STRUCTURE.demandChargePerMWMonth.toLocaleString()}/MW-mo</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.psoklahoma.com/company/about/rates/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                PSO Rate Schedules - Large Power & Light (LPL) Tariff
                                            </a>
                                            <span className="block text-gray-400"><span className="px-1 bg-amber-100 text-amber-800 rounded">Representative value</span> derived from PSO peak ($7.05/kW) + max ($2.47/kW) demand charges</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">- Coincident peak portion</td>
                                        <td className="text-right font-medium">${DC_RATE_STRUCTURE.coincidentPeakChargePerMWMonth.toLocaleString()}/MW-mo</td>
                                        <td className="pl-4 text-xs text-gray-500">
                                            ~60% of total - based on usage during system peak hours
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">- Non-coincident peak portion</td>
                                        <td className="text-right font-medium">${DC_RATE_STRUCTURE.nonCoincidentPeakChargePerMWMonth.toLocaleString()}/MW-mo</td>
                                        <td className="pl-4 text-xs text-gray-500">
                                            ~40% of total - based on customer's own monthly peak
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Energy margin (utility spread)</td>
                                        <td className="text-right font-medium">Calculated</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-medium">Dynamic</span>
                                            <span className="block text-gray-400 mt-1">
                                                Formula: <code className="bg-gray-200 px-1 rounded">tariff energy rate - wholesale cost</code>.
                                                Wholesale costs by market: ERCOT $45, PJM $42, MISO $35, TVA $32, SPP $28, NYISO $55, Regulated $38/MWh.
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Data Center Specific */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Data Center Load Characteristics
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">Based on EPRI DCFlex research and industry publications</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Data Point</th>
                                        <th className="text-right py-2 font-medium">Value</th>
                                        <th className="text-left py-2 pl-4 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Firm load factor</td>
                                        <td className="text-right font-medium">{(DEFAULT_DATA_CENTER.firmLoadFactor * 100).toFixed(0)}%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                LBNL: U.S. Data Center Energy Usage Report (2024)
                                            </a>
                                            <span className="block text-gray-400">Typical hyperscale facilities operate 75-85% avg utilization</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Flexible load factor</td>
                                        <td className="text-right font-medium">{(DEFAULT_DATA_CENTER.flexLoadFactor * 100).toFixed(0)}%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">Model Assumption</span>
                                            <span className="block text-gray-400 mt-1">Inferred: shifting peak workloads to off-peak enables higher avg utilization. Not directly measured.</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Peak curtailment capability</td>
                                        <td className="text-right font-medium">{((1 - DEFAULT_DATA_CENTER.flexPeakCoincidence) * 100).toFixed(0)}%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://spectrum.ieee.org/dcflex-data-center-flexibility" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                IEEE Spectrum: Big Tech Tests Data Center Flexibility (2025)
                                            </a>
                                            <span className="block text-gray-400">Field-validated: 25% sustained reduction during 3-hour peak events</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Additional References */}
                        <div className="mt-4 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Additional Industry References</h4>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <a href="https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        PJM 2025/26 Base Residual Auction Report
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">Clearing price $269.92/MW-day RTO; higher in constrained zones</span>
                                </li>
                                <li>
                                    <a href="https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        Grid Strategies: National Load Growth Report (Dec 2024)
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">Data center contribution to load growth by region; 63% attribution</span>
                                </li>
                                <li>
                                    <a href="https://atb.nrel.gov/electricity/2024/index" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        NREL Annual Technology Baseline 2024
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">Generation technology capital and operating costs</span>
                                </li>
                                <li>
                                    <a href="https://dcflex.epri.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        EPRI DCFlex Initiative
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">45+ industry collaborators validating data center flexibility</span>
                                </li>
                                <li>
                                    <a href="https://www.nerc.com/pa/RAPA/ra/Reliability%20Assessments%20DL/NERC_LTRA_2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        NERC Long-Term Reliability Assessment 2024
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">Regional reserve margin projections and reliability assessments</span>
                                </li>
                                <li>
                                    <a href="https://www.semianalysis.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        SemiAnalysis Large Load Queue Analysis (2025)
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">Primary source for data center queue data by market; ERCOT 200+ GW, PJM 60+ GW</span>
                                </li>
                                <li>
                                    <a href="https://www.dominionenergy.com/projects-and-facilities/electric-projects/integrated-resource-plan" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        Dominion Energy Integrated Resource Plan (2024)
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">Virginia data center growth forecast: 9+ GW by 2035</span>
                                </li>
                                <li>
                                    <a href="https://www.ercot.com/gridinfo/load/forecast" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        ERCOT Long-Term Load Forecast
                                    </a>
                                    <span className="block text-xs text-gray-500 ml-0">Texas grid planning and large load interconnection data</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* RESEARCH LITERATURE REVIEW */}
                <Section
                    id="research-literature"
                    title="Research Literature Review"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                    badge="2024-2025 Studies"
                    badgeColor="bg-purple-100 text-purple-800"
                >
                    <div className="space-y-6 text-gray-600">
                        {/* Introduction */}
                        <p>
                            The question of whether large data center loads benefit or harm existing ratepayers
                            is actively debated in academic and policy circles. Below we summarize key research
                            from <strong>2024-2025</strong>, presenting both supporting and contradicting evidence.
                        </p>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-2">
                                How to Read This Section
                            </p>
                            <p className="text-sm text-gray-700">
                                This research review <strong>does not change our calculator&apos;s model</strong>—it provides
                                context for the assumptions we&apos;ve made. Studies are organized by conclusion
                                (supporting vs. contradicting the premise that flexible data centers benefit ratepayers).
                                We note methodology differences and acknowledge that this is an evolving area of research.
                            </p>
                        </div>

                        {/* Balanced Evidence Summary - Side by Side */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Supporting Evidence Summary */}
                            <div className="border-2 border-green-200 rounded-lg p-5 bg-green-50">
                                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Supporting Evidence
                                </h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    Multiple studies find that <strong>flexible, high-load-factor</strong> data centers
                                    can reduce costs for existing ratepayers through:
                                </p>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 font-bold">1.</span>
                                        <span>Fixed cost spreading over more kWh</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 font-bold">2.</span>
                                        <span>Demand response reducing capacity needs</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 font-bold">3.</span>
                                        <span>Accelerated renewable deployment</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Contradicting Evidence Summary */}
                            <div className="border-2 border-amber-200 rounded-lg p-5 bg-amber-50">
                                <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Contradicting Evidence
                                </h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    Other studies raise concerns about cost-shifting, particularly for
                                    <strong> firm loads in constrained regions</strong>:
                                </p>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">1.</span>
                                        <span>Capacity market price spikes (PJM 10x)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">2.</span>
                                        <span>Regional bill impacts up to 25%</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">3.</span>
                                        <span>Infrastructure cost socialization</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Supporting Evidence Table */}
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50/30">
                            <h4 className="font-semibold text-gray-900 mb-3">
                                Studies Supporting Flexible Load Benefits
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-green-200">
                                            <th className="text-left py-2 font-medium">Study</th>
                                            <th className="text-left py-2 font-medium">Key Finding</th>
                                            <th className="text-left py-2 pl-4 font-medium">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-green-100">
                                            <td className="py-2 font-medium">E3/Amazon (Dec 2025)</td>
                                            <td className="py-2">$3.4M-$6.1M surplus revenue per 100MW facility; PG&E customers could see 1-2% bill reduction per GW</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.ethree.com/ratepayer-study/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    E3 Ratepayer Study
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-green-100">
                                            <td className="py-2 font-medium">LBNL/Brattle (Oct 2025)</td>
                                            <td className="py-2">Fixed cost spreading over more kWh reduces per-unit costs; states with demand growth saw falling rates</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.pbs.org/newshour/show/how-data-center-power-demand-could-help-lower-electricity-prices" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    PBS NewsHour
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-green-100">
                                            <td className="py-2 font-medium">GridCARE (Dec 2025)</td>
                                            <td className="py-2">1 GW flexible DC could reduce costs 5% across all customer classes or unlock $1.35B in capital</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.utilitydive.com/news/grid-operators-ratepayers-shouldnt-fear-flexible-data-centers-gridcare/808032/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Utility Dive
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-green-100">
                                            <td className="py-2 font-medium">Camus/Princeton/ZERO Lab</td>
                                            <td className="py-2">500MW flexible DC connects 3-5 years sooner than inflexible; nearly eliminates incremental supply costs</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.utilitydive.com/news/grid-operators-ratepayers-shouldnt-fear-flexible-data-centers-gridcare/808032/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Utility Dive
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-green-100">
                                            <td className="py-2 font-medium">MIT Sloan/CEEPR (Oct 2025)</td>
                                            <td className="py-2">Flexibility to shift workload always reduces costs; can encourage renewable investment</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://mitsloan.mit.edu/ideas-made-to-matter/flexible-data-centers-can-reduce-costs-if-not-emissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    MIT Sloan
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-green-100">
                                            <td className="py-2 font-medium">RMI (Jul 2025)</td>
                                            <td className="py-2">DC operators ready to invest in flexible, low-cost sources that mitigate stranded asset risks</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://rmi.org/fast-flexible-solutions-for-data-centers/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    RMI
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-green-100">
                                            <td className="py-2 font-medium">Power Policy (Jul 2025)</td>
                                            <td className="py-2">PJM could accommodate 13 GW without new capacity if loads are flexible 0.25% of uptime</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.powerpolicy.net/p/data-centers-could-make-or-break" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Power Policy
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Contradicting Evidence Table */}
                        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/30">
                            <h4 className="font-semibold text-gray-900 mb-3">
                                Studies Raising Cost-Shift Concerns
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-amber-200">
                                            <th className="text-left py-2 font-medium">Study</th>
                                            <th className="text-left py-2 font-medium">Key Finding</th>
                                            <th className="text-left py-2 pl-4 font-medium">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-amber-100">
                                            <td className="py-2 font-medium">Harvard ELI (Mar 2025)</td>
                                            <td className="py-2">Concerns about utilities passing infrastructure costs to general ratepayers; regulatory capture risks</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://eelp.law.harvard.edu/wp-content/uploads/2025/03/Harvard-ELI-Extracting-Profits-from-the-Public.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Harvard Law
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-amber-100">
                                            <td className="py-2 font-medium">Carnegie Mellon (Jul 2025)</td>
                                            <td className="py-2">DC growth could increase bills 8% nationally and up to 25% in some regional markets</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.law.georgetown.edu/environmental-law-review/blog/consumers-end-up-paying-for-the-energy-demands-of-data-centers-how-can-regulators-fight-back/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Georgetown Law Review
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-amber-100">
                                            <td className="py-2 font-medium">Virginia JLARC (2024)</td>
                                            <td className="py-2">Unconstrained growth could increase bills $14-37/month by 2040 (independent of inflation)</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.datacenterdynamics.com/en/news/some-amazon-data-centers-are-driving-down-utility-costs-amazon-commissioned-report-finds/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    DCD Coverage
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-amber-100">
                                            <td className="py-2 font-medium">IEEFA/PJM Analysis (2025)</td>
                                            <td className="py-2">Projected DC growth spurs PJM capacity prices by factor of 10 (from $28 to $270/MW-day)</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://ieefa.org/resources/projected-data-center-growth-spurs-pjm-capacity-prices-factor-10" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    IEEFA
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-amber-100">
                                            <td className="py-2 font-medium">Brattle Load Growth (Apr 2025)</td>
                                            <td className="py-2">Peak loads to increase 175 GW by 2030 (24%); risk of over-forecasting leading to stranded costs</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.brattle.com/wp-content/uploads/2025/04/Meeting-Unprecedented-Load-Growth-Challenges-Opportunities.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Brattle Group
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Cost-Shift Study Assumptions Detail */}
                        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/20">
                            <h4 className="font-semibold text-gray-900 mb-3">
                                What Drives Higher Cost Estimates in These Studies?
                            </h4>
                            <p className="text-sm text-gray-600 mb-4">
                                Understanding the key assumptions in each study helps explain the variation in projected cost impacts:
                            </p>

                            {/* Study-specific assumptions */}
                            <div className="space-y-4 mb-4">
                                <div className="p-3 bg-white rounded-lg border border-amber-100">
                                    <p className="font-medium text-gray-900 text-sm mb-2">Virginia JLARC (E3 modeling)</p>
                                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                        <li><strong>Load factor:</strong> 82% (Dominion&apos;s 2024 assumption for large data centers)</li>
                                        <li><strong>Load type:</strong> Modeled as &quot;flat, inflexible/non-interruptible load&quot;</li>
                                        <li><strong>Capacity market:</strong> Dominion is in PJM; study includes capacity market price impacts</li>
                                        <li><strong>Growth scenario:</strong> &quot;Unconstrained&quot; growth through 2040</li>
                                        <li><strong>Key driver:</strong> New generation and transmission infrastructure built for data centers creates fixed costs socialized across all ratepayers</li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-white rounded-lg border border-amber-100">
                                    <p className="font-medium text-gray-900 text-sm mb-2">Carnegie Mellon (TEMOA model)</p>
                                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                        <li><strong>Growth scenario:</strong> 350% increase in data center/crypto demand by 2030</li>
                                        <li><strong>Cost metric:</strong> Wholesale electricity costs (demand-weighted marginal generation costs)</li>
                                        <li><strong>Generation mix:</strong> Rapid growth forces system to run more expensive, aging coal generators</li>
                                        <li><strong>Regional variation:</strong> Virginia at 25% because it relies more on expensive generation sources vs. 8% nationally</li>
                                        <li><strong>Key driver:</strong> Data center growth outpaces new generation buildout, forcing reliance on higher-cost existing plants</li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-white rounded-lg border border-amber-100">
                                    <p className="font-medium text-gray-900 text-sm mb-2">Harvard ELI (Regulatory analysis)</p>
                                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                        <li><strong>Methodology:</strong> Qualitative analysis of ~50 utility rate proceedings (not a quantitative model)</li>
                                        <li><strong>Cost-shifting mechanisms:</strong> Special contracts, transmission/retail disconnect, colocation effects</li>
                                        <li><strong>Key concern:</strong> Infrastructure costs built in anticipation of growth; if demand doesn&apos;t materialize, ratepayers bear stranded costs</li>
                                        <li><strong>Regulatory capture:</strong> Utilities may over-build infrastructure and recover costs from all ratepayers before DC-specific tariffs mature</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Common factors */}
                            <div className="p-3 bg-amber-100/50 rounded-lg border border-amber-200">
                                <p className="font-medium text-amber-900 text-sm mb-2">Common Factors Driving Higher Estimates</p>
                                <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                                    <li><strong>Inflexible load assumption:</strong> Studies assume firm/non-interruptible operations (no demand response credit)</li>
                                    <li><strong>Capacity market exposure:</strong> In PJM, large loads trigger capacity price spikes that affect all existing load</li>
                                    <li><strong>Infrastructure anticipation:</strong> Utilities build generation/transmission before demand materializes</li>
                                    <li><strong>Long time horizons:</strong> 15-25 year projections allow cost impacts to compound</li>
                                </ul>
                            </div>
                        </div>

                        {/* Policy Mechanisms Table */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Emerging Policy Mechanisms for Large Load Management
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                                Several states and utilities have developed specialized frameworks to address cost allocation:
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 font-medium">Mechanism</th>
                                            <th className="text-left py-2 font-medium">Jurisdiction</th>
                                            <th className="text-left py-2 font-medium">Key Feature</th>
                                            <th className="text-left py-2 pl-4 font-medium">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 font-medium">GS-5 Rate Class</td>
                                            <td className="py-2">Virginia (Dominion)</td>
                                            <td className="py-2">95% CIAC recovery; dedicated large load rate schedule with &quot;Deep Grid&quot; transmission upgrades</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://eta-publications.lbl.gov/sites/default/files/2025-01/electricity_rate_designs_for_large_loads_evolving_practices_and_opportunities_final.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    DOE/LBNL Brief
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 font-medium">SB6</td>
                                            <td className="py-2">Texas</td>
                                            <td className="py-2">Large load interconnection study requirements; grid emergency curtailment</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.utilitydive.com/news/data-center-load-growth-markets-ratepayer/749715/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Utility Dive
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 font-medium">Industrial Power Tariff</td>
                                            <td className="py-2">Indiana Michigan Power</td>
                                            <td className="py-2">12-year minimum contract term after load ramp; protects against stranded costs</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://indianacapitalchronicle.com/2024/11/26/ratepayer-advocates-hail-landmark-settlement-with-data-centers-utility-company/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    IN Capital Chronicle
                                                </a>
                                            </td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 font-medium">Data Center Tariff</td>
                                            <td className="py-2">AEP Ohio</td>
                                            <td className="py-2">85% minimum demand for 12 years (4-year ramp to 90%); approved July 2025</td>
                                            <td className="pl-4 text-xs">
                                                <a href="https://www.aepohio.com/company/about/rates/data-center-tariff/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    AEP Ohio
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Synthesis Callout */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="font-semibold text-purple-900 mb-2">
                                How This Research Informs Our Model
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Our calculator&apos;s assumptions align with the research consensus that:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">✓</span>
                                    <span>
                                        <strong>Flexibility matters:</strong> The difference between firm and flexible
                                        load is significant (supporting E3, LBNL, GridCARE findings). Our model uses
                                        25% curtailment based on EPRI DCFlex field validation—see the{' '}
                                        <button
                                            onClick={() => toggleSection('flexibility')}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            Workload Flexibility Model
                                        </button>
                                        {' '}section.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">✓</span>
                                    <span>
                                        <strong>Capacity markets amplify impacts:</strong> PJM price spikes validate
                                        our endogenous capacity pricing model—see the{' '}
                                        <button
                                            onClick={() => toggleSection('socialized-scarcity')}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            Capacity Cost Spillovers
                                        </button>
                                        {' '}section.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">✓</span>
                                    <span>
                                        <strong>Regional variation is significant:</strong> Virginia JLARC and regional
                                        studies inform our market-specific allocation factors in the{' '}
                                        <button
                                            onClick={() => toggleSection('market-structures')}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            Market Structures
                                        </button>
                                        {' '}section.
                                    </span>
                                </li>
                            </ul>
                            <p className="text-sm text-purple-800 mt-3 font-medium">
                                Bottom Line: The research supports the <em>possibility</em> of rate decreases under optimal
                                conditions, but demonstrates the downside risks are equally real. Our model helps users
                                explore both scenarios.
                            </p>
                        </div>

                        {/* Model Assumptions callout */}
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-900 mb-2">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium text-xs mr-2">Research Notes</span>
                                Limitations of Available Evidence
                            </h4>
                            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                                <li><strong>Industry funding:</strong> E3 study was commissioned by Amazon (though E3 stated analysis was independent)</li>
                                <li><strong>Facility vs. system-level:</strong> Most supporting studies analyze individual facility costs, not system-wide effects</li>
                                <li><strong>Forward-looking projections:</strong> Few retrospective case studies exist showing actual rate decreases after large load additions</li>
                                <li><strong>Contested methodology:</strong> Studies use different assumptions about load flexibility, timeline, and cost allocation</li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* REGIONAL DEMAND FORECASTS */}
                <Section
                    id="demand-forecasts"
                    title="Regional Data Center Demand Forecasts"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                    badge="2027-2035"
                    badgeColor="bg-blue-100 text-blue-800"
                >
                    <div className="space-y-6 text-gray-600">
                        {/* Introduction */}
                        <p>
                            Our calculator models data center growth at the <strong>market level</strong>, not individual projects.
                            This macro-level approach reflects how grid planners and utilities forecast capacity needs across their
                            entire service territory. Growth is phased annually from 2027-2035 (with a 12-month construction lag from 2026).
                        </p>

                        <p className="text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <strong>Two Scenarios:</strong> The calculator offers <strong>Conservative</strong> (utility IRP-based) and{' '}
                            <strong>Aggressive</strong> (queue data with realistic completion rates) forecasts.
                            <span className="font-medium"> Aggressive is the default</span>, reflecting the rapid growth in interconnection
                            queues observed by SemiAnalysis and other market analysts.
                        </p>

                        {/* Market Forecast Table */}
                        <div className="border border-gray-200 rounded-lg p-4 overflow-x-auto">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Market-Level Growth Projections (2027-2035)
                            </h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Market</th>
                                        <th className="text-right py-2 font-medium">Current</th>
                                        <th className="text-right py-2 font-medium">Conservative</th>
                                        <th className="text-right py-2 font-medium">Aggressive</th>
                                        <th className="text-left py-2 pl-4 font-medium">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(MARKET_FORECASTS).map(([key, market]) => (
                                        <tr key={key} className="border-b border-gray-100">
                                            <td className="py-2 font-medium">{market.marketName}</td>
                                            <td className="text-right">{market.currentCapacityGW.toFixed(1)} GW</td>
                                            <td className="text-right">{market.conservativeGrowthGW} GW</td>
                                            <td className="text-right font-semibold text-blue-700">{market.aggressiveGrowthGW} GW</td>
                                            <td className="pl-4 text-xs text-gray-500">{market.notes}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-gray-300 font-semibold bg-gray-50">
                                        <td className="py-2">National Total</td>
                                        <td className="text-right">~20 GW</td>
                                        <td className="text-right">{getNationalGrowthProjection('conservative').totalGrowthGW} GW</td>
                                        <td className="text-right text-blue-700">{getNationalGrowthProjection('aggressive').totalGrowthGW} GW</td>
                                        <td className="pl-4 text-xs">Sum of market projections</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Methodology */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Growth Allocation Methodology</h4>
                            <ul className="space-y-2 text-sm">
                                <li><strong>Utility Share Calculation:</strong> Utility Peak MW ÷ Market Total Peak MW × Market Growth</li>
                                <li><strong>Annual Growth Rate:</strong> Total Growth ÷ 9 years (2027-2035)</li>
                                <li><strong>Phase-In Model:</strong> Linear cumulative ramp starting Year 2 (2027) through Year 10 (2035)</li>
                                <li><strong>Construction Lag:</strong> 12-month lag from 2026 to account for interconnection and construction timelines</li>
                            </ul>
                        </div>

                        {/* Sources with hyperlinks */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Data Sources & References</h4>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <a href="https://www.semianalysis.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        SemiAnalysis Large Load Queue Reports (2025)
                                    </a>
                                    <span className="block text-xs text-gray-500">Primary source for queue data. ERCOT 200+ GW in queue (46% from data centers).</span>
                                </li>
                                <li>
                                    <a href="https://www.dominionenergy.com/projects-and-facilities/electric-projects/integrated-resource-plan" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        Dominion Energy IRP 2024
                                    </a>
                                    <span className="block text-xs text-gray-500">Virginia data center forecast: 9+ GW by 2035 in Northern Virginia alone.</span>
                                </li>
                                <li>
                                    <a href="https://www.ercot.com/gridinfo/load/forecast" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        ERCOT Long-Term Load Forecast (2024)
                                    </a>
                                    <span className="block text-xs text-gray-500">Texas grid planning documents and large load analysis.</span>
                                </li>
                                <li>
                                    <a href="https://www.psoklahoma.com/company/about/rates/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        PSO Oklahoma IRP & Rate Filings
                                    </a>
                                    <span className="block text-xs text-gray-500">6+ GW in large load queue; 31% power deficit projected by 2031.</span>
                                </li>
                                <li>
                                    <a href="https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        Grid Strategies: National Load Growth Report (Dec 2024)
                                    </a>
                                    <span className="block text-xs text-gray-500">63% of PJM load growth attributed to data centers.</span>
                                </li>
                                <li>
                                    <a href="https://www.nerc.com/pa/RAPA/ra/Reliability%20Assessments%20DL/NERC_LTRA_2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        NERC Long-Term Reliability Assessment 2024
                                    </a>
                                    <span className="block text-xs text-gray-500">Regional reserve margin and reliability projections.</span>
                                </li>
                                <li>
                                    <a href="https://cdn.misoenergy.org/MTEP23%20Executive%20Summary630586.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        MISO MTEP23 Transmission Expansion Plan
                                    </a>
                                    <span className="block text-xs text-gray-500">Midwest transmission planning and load forecasts.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Model Assumptions */}
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-900 mb-2">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium text-xs mr-2">Model Assumptions</span>
                                Forecast Methodology Notes
                            </h4>
                            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                                <li><strong>Aggressive default rationale:</strong> Queue data from SemiAnalysis suggests higher growth than utility IRPs capture</li>
                                <li><strong>Conservative scenario:</strong> Based on utility IRPs and formal load forecasts filed with regulators</li>
                                <li><strong>Regional concentration:</strong> NoVA (Dominion), Texas (ERCOT), and Oklahoma (SPP) have disproportionate growth</li>
                                <li><strong>Uncertainty:</strong> Forecasts are estimates; actual buildout depends on financing, permits, power availability, and interconnection timelines</li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* WORKLOAD FLEXIBILITY */}
                <Section
                    id="flexibility"
                    title="Workload Flexibility Model"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p>
                            Data center flexibility varies by workload type. The table below shows the theoretical
                            flexibility potential based on typical workload mix:
                        </p>

                        <p className="text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium text-xs">Model Assumptions</span>
                            <span className="ml-2">The workload percentages and flexibility values below are illustrative estimates based on industry understanding
                            of AI/cloud workloads. Actual values vary significantly by data center operator and workload mix.</span>
                        </p>

                        <table className="w-full mt-4 text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 font-medium">Workload Type</th>
                                    <th className="text-right py-2 font-medium">% of Load</th>
                                    <th className="text-right py-2 font-medium">Flexibility</th>
                                    <th className="text-left py-2 pl-4 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(WORKLOAD_TYPES).map(([key, wl]) => (
                                    <tr key={key} className="border-b border-gray-100">
                                        <td className="py-2">{wl.name}</td>
                                        <td className="text-right">{(wl.percentOfLoad * 100).toFixed(0)}%</td>
                                        <td className="text-right">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                wl.flexibility >= 0.6 ? 'bg-green-100 text-green-800' :
                                                wl.flexibility >= 0.3 ? 'bg-amber-100 text-amber-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {(wl.flexibility * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                        <td className="pl-4 text-gray-500 text-xs">{wl.description}</td>
                                    </tr>
                                ))}
                                <tr className="border-t-2 border-gray-300 font-semibold">
                                    <td className="py-2">Theoretical Aggregate</td>
                                    <td className="text-right">100%</td>
                                    <td className="text-right">~{(aggregateFlexibility * 100).toFixed(0)}%</td>
                                    <td className="pl-4 text-gray-500 text-xs">Weighted sum of flexibility by load share</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-900 mb-2">Why We Use 25% (Not {(aggregateFlexibility * 100).toFixed(0)}%)</h4>
                            <p className="text-sm text-amber-800">
                                While the theoretical workload analysis suggests ~{(aggregateFlexibility * 100).toFixed(0)}% aggregate flexibility, our model uses
                                a more conservative <strong>25% curtailable</strong> assumption based on:
                            </p>
                            <ul className="list-disc list-inside text-sm text-amber-800 mt-2 space-y-1">
                                <li>Field-validated results from EPRI DCFlex demonstration (see below)</li>
                                <li>Real-world constraints (coordination overhead, workload queuing, IT operations)</li>
                                <li>Reliability margin for grid operators to depend on</li>
                                <li>Conservative baseline that most data centers could achieve without major changes</li>
                            </ul>
                        </div>

                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-900 mb-2">EPRI DCFlex Field Demonstration (2024)</h4>
                            <p className="text-sm text-green-800 mb-2">
                                The EPRI DCFlex demonstration at a major hyperscale data center in Phoenix achieved:
                            </p>
                            <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                                <li><strong>25% sustained power reduction</strong> during 3-hour peak grid events</li>
                                <li><strong>Up to 40% reduction</strong> demonstrated while maintaining AI quality of service</li>
                                <li><strong>~90% of workloads</strong> on representative clusters can be preempted (paused/delayed)</li>
                            </ul>
                            <p className="text-sm text-green-800 mt-2">
                                This validates that 25% curtailment is achievable in real-world conditions, with potential
                                for higher reductions as data center operators gain experience with demand response programs.
                            </p>
                        </div>

                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Data Sources:</p>
                            <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                                <li>
                                    <a href="https://spectrum.ieee.org/dcflex-data-center-flexibility" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        IEEE Spectrum: Big Tech Tests Data Center Flexibility (2025)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://arxiv.org/abs/2507.00909" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        arXiv: Turning AI Data Centers into Grid-Interactive Assets - Phoenix Field Demonstration
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.latitudemedia.com/news/catalyst-the-mechanics-of-data-center-flexibility/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Latitude Media: The Mechanics of Data Center Flexibility
                                    </a>
                                    {' '}- includes 90% preemptible workload finding
                                </li>
                                <li>
                                    <a href="https://cloud.google.com/blog/products/infrastructure/using-demand-response-to-reduce-data-center-power-consumption" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Google Cloud: Using Demand Response to Reduce Data Center Power Consumption
                                    </a>
                                </li>
                                <li>
                                    <a href="https://dcflex.epri.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        EPRI DCFlex Initiative
                                    </a>
                                    {' '}- 45+ industry collaborators including major cloud and AI companies
                                </li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* MARKET STRUCTURES */}
                <Section
                    id="market-structures"
                    title="Market Structures & Cost Allocation Framework"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Cost allocation to residential customers varies significantly based on the market structure
                            in which a utility operates. Our model adjusts allocation factors based on five distinct market types.
                            Each value below is linked to its source documentation.
                        </p>

                        {/* Regulated Markets */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                Regulated / Vertically Integrated Markets
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                                Duke Energy Carolinas, Georgia Power, APS Arizona, NV Energy, Xcel Colorado
                            </p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Parameter</th>
                                        <th className="text-right py-2 font-medium">Value</th>
                                        <th className="text-left py-2 pl-4 font-medium text-xs">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Base Residential Allocation</td>
                                        <td className="text-right">40%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.raponline.org/wp-content/uploads/2023/09/rap-lazar-chernick-marcus-lebel-electric-cost-allocation-new-era-2020-january.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                RAP: Electric Cost Allocation for a New Era (2020)
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Revenue Flow-Through</td>
                                        <td className="text-right">90%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-green-100 text-green-800 rounded">Cost Causation</span>
                                            <span className="block text-gray-400">Cost-of-service tariffs designed to recover costs directly</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Capacity Cost Pass-Through</td>
                                        <td className="text-right">40%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Embedded in rate base; assumed equal to residential revenue share</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Utility Owns Generation</td>
                                        <td className="text-right">Yes</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.eia.gov/electricity/data/eia861/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                EIA-861 Annual Electric Power Data
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="mt-3 text-sm text-gray-500">
                                <strong>Cost Causation Principle:</strong> In regulated markets, PUC-approved tariffs are designed to recover
                                the utility's cost of serving each customer class. When a data center pays its industrial tariff rates
                                (demand charges + energy charges), those costs are considered "recovered"—not shifted to residential customers.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                <strong>Allocation Formula:</strong> Residential Allocation = Base × (1 - Cost Recovery Ratio)<sup>0.5</sup>
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                <strong>Rate Spreading Benefit:</strong> High load factor industrial loads (≥80%) spread fixed system costs
                                over more kWh, reducing average costs for all customers (5-10% additional reduction).
                            </p>
                        </div>

                        {/* PJM Markets */}
                        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                PJM Capacity Market
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                                Dominion Virginia, AEP Ohio, AEP I&M, Appalachian Power
                            </p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-amber-200">
                                        <th className="text-left py-2 font-medium">Parameter</th>
                                        <th className="text-right py-2 font-medium">Value</th>
                                        <th className="text-left py-2 pl-4 font-medium text-xs">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-amber-100">
                                        <td className="py-2 font-medium">Base Residential Allocation</td>
                                        <td className="text-right">35%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Lower than regulated due to deregulated retail market structure</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-amber-100">
                                        <td className="py-2 font-medium">Capacity Cost Pass-Through</td>
                                        <td className="text-right">50%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Retail supplier pass-through of RPM costs; higher due to market structure</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-amber-100">
                                        <td className="py-2 font-medium">2025/26 Capacity Price</td>
                                        <td className="text-right font-bold text-amber-700">$269.92/MW-day</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                PJM 2025/26 BRA Report
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-amber-100">
                                        <td className="py-2 font-medium">Price vs 2024/25</td>
                                        <td className="text-right text-red-600">~10x increase</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2024-2025/2024-2025-base-residual-auction-report.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Prior auction: $28.92/MW-day
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-amber-100">
                                        <td className="py-2 font-medium">Data center load attribution</td>
                                        <td className="text-right">63%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Grid Strategies Load Growth Report
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="mt-3 text-sm text-gray-600">
                                <strong>Allocation Method:</strong> PJM's Reliability Pricing Model (RPM) capacity auction cleared at
                                $269.92/MW-day for 2025/26. Our model uses <em>Endogenous Capacity Pricing</em> to calculate the
                                "socialized cost" impact when large loads consume reserve margin and trigger capacity price spikes.
                                Due to recent auction timeline compression (auctions now clear 11-18 months ahead rather than 3 years),
                                this cost applies <strong>immediately</strong> when data centers connect—current prices already reflect demand growth.
                            </p>
                        </div>

                        {/* ERCOT */}
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                ERCOT Energy-Only Market
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                                Texas Grid (ERCOT)
                            </p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-green-200">
                                        <th className="text-left py-2 font-medium">Parameter</th>
                                        <th className="text-right py-2 font-medium">Value</th>
                                        <th className="text-left py-2 pl-4 font-medium text-xs">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-green-100">
                                        <td className="py-2 font-medium">Base Residential Allocation</td>
                                        <td className="text-right">30%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Lower allocation reflects competitive retail market; large loads face prices directly</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-green-100">
                                        <td className="py-2 font-medium">Capacity Cost Pass-Through</td>
                                        <td className="text-right">25%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">No capacity market; only transmission CREZ costs flow through</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-green-100">
                                        <td className="py-2 font-medium">Capacity Market</td>
                                        <td className="text-right">None</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.potomaceconomics.com/wp-content/uploads/2024/05/2023-State-of-the-Market-Report_Final.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Potomac Economics: ERCOT State of the Market 2023
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-green-100">
                                        <td className="py-2 font-medium">Allocation Adjustment</td>
                                        <td className="text-right">x 0.70</td>
                                        <td className="pl-4 text-xs text-gray-500">
                                            4CP methodology: large loads pay for transmission based on peak usage
                                        </td>
                                    </tr>
                                    <tr className="border-b border-green-100">
                                        <td className="py-2 font-medium">4CP Transmission Rate</td>
                                        <td className="text-right font-bold text-green-700">~${DC_RATE_STRUCTURE.ercot4CPTransmissionRate}/kW-mo</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.ercot.com/services/rq/re/4cp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                ERCOT 4CP Program
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                <p className="text-sm font-semibold text-green-900 mb-1">ERCOT 4CP Transmission Allocation</p>
                                <p className="text-xs text-green-800">
                                    ERCOT allocates transmission costs based on <strong>Four Coincident Peak (4CP)</strong> methodology.
                                    Transmission charges are based on a customer's load during the 4 highest system peak hours each year.
                                    This creates a <strong>huge incentive for flexible loads</strong>: curtailing just 4 hours can reduce transmission costs by 25%+.
                                </p>
                            </div>
                        </div>

                        {/* SPP */}
                        <div className="border border-purple-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                SPP (Southwest Power Pool)
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                                PSO Oklahoma, SWEPCO
                            </p>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Base Residential Allocation</td>
                                        <td className="text-right">40%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Based on{' '}
                                                <a href="https://www.psoklahoma.com/company/about/rates/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PSO rate structure</a>
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Capacity Market</td>
                                        <td className="text-right">None</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.spp.org/markets-operations/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                SPP Markets & Operations
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* MISO */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                                MISO Capacity Market
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                                Entergy Arkansas, Entergy Mississippi
                            </p>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Base Residential Allocation</td>
                                        <td className="text-right">38%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Between regulated (40%) and PJM (35%)</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">2024/25 Capacity Price</td>
                                        <td className="text-right">$30/MW-day</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.misoenergy.org/markets-and-operations/resource-adequacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                MISO Resource Adequacy
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Allocation Formula */}
                        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3">Market-Adjusted Allocation Formula</h4>
                            <div className="bg-white p-4 rounded font-mono text-sm overflow-x-auto">
                                <p className="mb-2">Adjusted Allocation = Base Allocation × Market Adjustment</p>
                                <p className="text-gray-500 text-xs mt-3">Market-specific adjustments:</p>
                                <ul className="text-xs text-gray-500 mt-1 space-y-2">
                                    <li><strong>Regulated/SPP/TVA (cost-of-service):</strong> Cost Causation Adjustment
                                        <br/>Formula: Base × √(1 − Cost Recovery Ratio) × Load Factor Benefit
                                        <br/>At 100% cost recovery → allocation approaches 5% of base
                                        <br/>High load factor (≥80%) provides additional 5-10% reduction
                                    </li>
                                    <li><strong>PJM/NYISO/MISO (capacity markets):</strong> 1.0 (no allocation adjustment)
                                        <br/>Capacity cost spillovers captured via endogenous pricing model
                                    </li>
                                    <li><strong>ERCOT (energy-only):</strong> Dynamic penetration-based scaling
                                        <br/>Scales from 30% → ~26% as DC grows from 0 → 45 GW
                                    </li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-3">
                                    <strong>Note:</strong> For capacity markets (PJM/NYISO/MISO), socialized capacity costs are calculated
                                    separately via the endogenous capacity pricing model and added to the residential impact.
                                    This avoids double-counting while accurately capturing capacity cost spillovers.
                                </p>
                            </div>
                            <p className="mt-3 text-sm text-gray-600">
                                Final allocation clamped to 5-50% range to maintain reasonable bounds. See{' '}
                                <a href="https://www.raponline.org/knowledge-center/electric-cost-allocation-new-era/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    RAP: Electric Cost Allocation for a New Era
                                </a>.
                            </p>
                        </div>

                        {/* ERCOT Dynamic Allocation */}
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-900 mb-3">ERCOT Dynamic Residential Allocation</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                For ERCOT, residential allocation scales dynamically based on data center penetration
                                as a percentage of total ERCOT system capacity (~90 GW). As DC capacity grows, the
                                residential share of system load decreases proportionally.
                            </p>
                            <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                                <p className="text-xs font-mono text-gray-700">DC Penetration = DC Capacity / 90,000 MW</p>
                                <p className="text-xs font-mono text-gray-700 mt-1">Scale Factor = 1 − (Penetration × 0.3)</p>
                                <p className="text-xs font-mono text-gray-700 mt-1">Allocation = Base × max(0.5, Scale Factor)</p>
                            </div>
                            <table className="w-full text-sm mt-3">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">DC Capacity</th>
                                        <th className="text-left py-2 font-medium">Penetration</th>
                                        <th className="text-left py-2 font-medium">Residential Allocation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">0 GW</td>
                                        <td className="text-xs">0%</td>
                                        <td className="text-xs">30% (base)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">9 GW</td>
                                        <td className="text-xs">10%</td>
                                        <td className="text-xs">~27%</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">25 GW</td>
                                        <td className="text-xs">~28%</td>
                                        <td className="text-xs">~22%</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">45 GW</td>
                                        <td className="text-xs">50%</td>
                                        <td className="text-xs">~26%</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-500 mt-2">
                                This reflects that as data centers become a larger portion of total system load,
                                they bear more of the infrastructure costs, reducing the residential allocation.
                                The floor (50% of base = 15%) only applies at theoretical penetration levels above 167%.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* LIMITATIONS */}
                <Section
                    id="limitations"
                    title="Limitations & Caveats"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p>
                            This model provides order-of-magnitude estimates, not precise predictions.
                            Key limitations include:
                        </p>

                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>
                                <strong>Regional variation:</strong> Infrastructure costs vary by 2-3x depending
                                on location, terrain, and existing grid conditions.
                            </li>
                            <li>
                                <strong>Regulatory uncertainty:</strong> Actual cost allocation depends on
                                state regulatory decisions which vary widely.
                            </li>
                            <li>
                                <strong>Technology change:</strong> Battery costs, renewable prices, and
                                grid technology are evolving rapidly.
                            </li>
                            <li>
                                <strong>Market dynamics:</strong> Wholesale electricity prices fluctuate
                                based on fuel costs, weather, and demand patterns.
                            </li>
                            <li>
                                <strong>Simplified model:</strong> We use linear projections and don&apos;t capture
                                all feedback effects, step changes, or non-linear dynamics.
                            </li>
                            <li>
                                <strong>Demand forecast uncertainty:</strong> Queue data represents interconnection
                                requests, not firm commitments. Historical completion rates (10-15%) are applied,
                                but actual buildout depends on financing, permits, land availability, and utility
                                interconnection capacity.
                            </li>
                            <li>
                                <strong>VRR curve simplified:</strong> Actual ISO implementations have more complex formulations.
                            </li>
                            <li>
                                <strong>Zonal constraints not modeled:</strong> E.g., NYC vs upstate NY have different dynamics.
                            </li>
                        </ul>

                        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                            <p className="text-sm text-amber-800">
                                <strong>Use appropriately:</strong> This tool is designed for educational purposes
                                and initial analysis. Actual utility planning and rate-making involves much more
                                detailed engineering and economic modeling.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* OPEN SOURCE */}
                <Section
                    id="contribute"
                    title="Open Source & Contributing"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p>
                            This tool is open source and we welcome contributions:
                        </p>

                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Report bugs or suggest improvements via GitHub issues</li>
                            <li>Submit pull requests with enhanced models or features</li>
                            <li>Share utility-specific data to improve regional accuracy</li>
                            <li>Help translate to make accessible to more communities</li>
                        </ul>

                        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                            <p className="font-mono text-sm text-gray-700">
                                github.com/DougMackenzie/power-insight
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Licensed under MIT License
                            </p>
                        </div>
                    </div>
                </Section>

                {/* AI CARBON */}
                <Section
                    id="ai-carbon"
                    title="AI Development Carbon Footprint"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p>
                            This tool was developed with the assistance of agentic AI (Claude). In the interest of
                            transparency, we estimate and disclose the carbon footprint of that development process.
                        </p>

                        {/* Calculation */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                Carbon Calculation
                                {carbonData?.development?.lastUpdated && (
                                    <span className="text-xs text-gray-400 font-normal ml-auto">
                                        Updated: {carbonData.development.lastUpdated}
                                    </span>
                                )}
                            </h4>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">Tokens used in development</td>
                                        <td className="py-2 text-right font-medium">{totalTokens.toLocaleString()} tokens</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">CO2 per 1,000 tokens (Claude Opus)</td>
                                        <td className="py-2 text-right font-medium">~{gCO2PerK} g CO2</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">Total estimated emissions</td>
                                        <td className="py-2 text-right font-bold text-gray-900">~{(totalKgCO2 * 1000).toFixed(0)} g CO2 ({totalKgCO2.toFixed(1)} kg)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">Carbon footprint of one beef hamburger</td>
                                        <td className="py-2 text-right font-medium">~{hamburgerKg} kg CO2</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-gray-600">Hamburger equivalent</td>
                                        <td className="py-2 text-right font-bold text-green-600">~{hamburgerEquiv.toFixed(1)} hamburgers</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Methodology */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Methodology & Sources</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">-</span>
                                    <span>
                                        <strong>Token emissions:</strong> Based on{' '}
                                        <a href="https://www.launchbot.app/ai-offset-calculator" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            Launchbot AI Emissions Calculator
                                        </a>
                                        . Claude Opus: ~1.2 gCO2/1k tokens.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">-</span>
                                    <span>
                                        <strong>Hamburger footprint:</strong> Based on{' '}
                                        <a href="https://www.co2everything.com/co2e-of/beef" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            CO2 Everything
                                        </a>
                                        {' '}and Poore & Nemecek (2018). Beef burger: ~3-4 kg CO2e.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-800">
                                <strong>Context:</strong> The carbon cost of developing this tool is roughly equivalent to
                                driving a car {Math.round(totalKgCO2 * 2.5)}-{Math.round(totalKgCO2 * 5)} miles. We believe the potential
                                value of helping communities understand energy cost allocation significantly outweighs
                                this modest environmental cost.
                            </p>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Contact */}
            <div className="bg-gray-800 text-white rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Questions or Feedback?</h3>
                <p className="text-gray-300 mb-4">
                    If you have questions about the methodology, want to report an error,
                    or have suggestions for improvement, we'd love to hear from you.
                </p>
                <a
                    href="/"
                    className="inline-block px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
                >
                    Back to Calculator
                </a>
            </div>
        </div>
    );
}
