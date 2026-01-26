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
    const [expandedSection, setExpandedSection] = useState<string | null>('model-overview');
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
                <p className="text-lg text-slate-600 max-w-3xl mb-4">
                    This calculator models how large data center loads affect residential electricity bills,
                    with particular attention to <strong>capacity market dynamics</strong> and the "Hockey Stick"
                    effect that can cause cost spillovers to existing ratepayers.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                        Endogenous Capacity Pricing
                    </span>
                    <span className="px-3 py-1 bg-slate-200 text-slate-700 text-sm font-medium rounded-full">
                        3-Year Auction Lag
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Market-Specific Models
                    </span>
                </div>
            </div>

            {/* Executive Summary Card */}
            <div className="bg-white rounded-xl border-2 border-red-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Key Model Innovation: Endogenous Capacity Pricing</h2>
                        <p className="text-gray-600 mb-4">
                            Unlike simpler models that use static capacity prices, our calculator models how capacity prices
                            <strong> respond dynamically</strong> to changes in reserve margin. When massive data center loads
                            consume available reserves, prices spike non-linearly—the "Hockey Stick" effect seen in
                            PJM's 2025/26 auction where prices jumped 10x from the prior year.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">$269.92</p>
                                <p className="text-xs text-gray-500">PJM 2025/26 capacity price ($/MW-day)</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">10x</p>
                                <p className="text-xs text-gray-500">Increase from prior year ($28.92)</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">63%</p>
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

                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-semibold text-amber-900 mb-2">Capacity Market Addition (PJM/NYISO/MISO)</p>
                            <p className="text-sm text-gray-700">
                                For utilities in organized capacity markets, we add a <strong>Socialized Capacity Cost</strong> component
                                that captures the "PJM Effect"—when large loads consume reserve margin, capacity auction prices spike,
                                and this price increase is paid by <em>all</em> existing customers on their existing load.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                This cost is calculated using <strong>Endogenous Capacity Pricing</strong> (see dedicated section below)
                                and applies with a <strong>3-year auction lag</strong> to reflect the time between capacity auction clearing
                                and delivery year. Direct infrastructure costs apply immediately.
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
                                    Utilities earn margin on each MWh sold: ${DC_RATE_STRUCTURE.energyMarginPerMWh}/MWh wholesale-to-retail spread.
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
                            The share of net costs allocated to residential customers depends on the utility's market structure.
                            See the <strong>"Market Structures & Cost Allocation Framework"</strong> section below for detailed
                            allocation factors by market type (regulated, PJM, ERCOT, etc.).
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                            <li><strong>Base allocation:</strong> Varies by market (30-40% typical)</li>
                            <li><strong>Calculation method:</strong> Weighted blend of 40% volumetric (kWh), 40% demand (peak MW), 20% customer count</li>
                            <li><strong>Dynamic adjustment:</strong> As data center adds energy and peak, residential shares shift</li>
                            <li><strong>Regulatory lag:</strong> Changes phase in over ~5 years through rate case proceedings</li>
                            <li><strong>Market multipliers:</strong> ERCOT applies 0.70x (large loads face 4CP transmission costs directly); capacity markets use endogenous pricing model</li>
                        </ul>

                        <p className="mt-4 text-sm text-gray-500">
                            The baseline trajectory includes {(TIME_PARAMS.generalInflation * 100).toFixed(1)}% annual
                            inflation and {(INFRASTRUCTURE_COSTS.annualBaselineUpgradePercent * 100).toFixed(1)}% annual
                            infrastructure replacement costs.
                        </p>
                    </div>
                </Section>

                {/* HOCKEY STICK SUPPLY CURVE */}
                <Section
                    id="hockey-stick"
                    title="The 'Hockey Stick' Supply Curve"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                    badge="Key Innovation"
                    badgeColor="bg-red-100 text-red-800"
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            In organized capacity markets (PJM, NYISO, MISO), capacity prices are determined through auctions
                            that clear based on the <strong>Variable Resource Requirement (VRR) curve</strong>. This curve creates
                            a "hockey stick" price pattern: prices are stable when reserves are abundant, but spike exponentially
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
$1,120 |                                              * Emergency
    |                                           *
 $700 |                                      *    Severe Scarcity
    |                                 *
 $420 |                           *          Scarcity
    |                     *
 $280 |----------------*--------------------- Target (CONE)
    |           *
  $28 |     *                                 Abundant
  $14 | *
    +-----|-----|-----|-----|-----|-----|---> Reserve Margin
          0%    5%   10%   15%   20%   25%
                     ^
                     |
              Target Reserve Margin (15%)`}
                                </pre>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                The curve shows how capacity prices respond to changes in reserve margin.
                                Below 15%, prices rise sharply. Below 10%, the "hockey stick" effect kicks in.
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
                    </div>
                </Section>

                {/* SOCIALIZED SCARCITY */}
                <Section
                    id="socialized-scarcity"
                    title="Socialized Scarcity: The 'PJM Effect'"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                    badge="Critical Concept"
                    badgeColor="bg-red-100 text-red-800"
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            When a data center triggers a capacity price spike, the cost isn't borne by the data center alone.
                            The increased capacity price applies to <strong>all load in the market</strong>, meaning existing
                            residential customers pay higher prices on their existing consumption. This is the "socialization"
                            effect that has drawn regulatory attention in PJM and other markets.
                        </p>

                        {/* The PJM Effect */}
                        <div className="border-2 border-red-200 rounded-lg p-5 bg-red-50">
                            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                The "PJM Effect" - Price Socialization
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                When a large data center adds to system peak, it doesn't just pay higher capacity prices for its own load—
                                the capacity price increase affects <strong>all existing load</strong>. This "socialized" cost impact
                                is a key mechanism by which data center growth can affect residential bills in capacity markets.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-semibold text-red-800 text-sm mb-1">PJM 2025/26 Auction</p>
                                    <p className="text-2xl font-bold text-red-600">$269.92/MW-day</p>
                                    <p className="text-xs text-gray-600">Cleared at 10x previous year prices</p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-semibold text-red-800 text-sm mb-1">Data Center Attribution</p>
                                    <p className="text-2xl font-bold text-red-600">63%</p>
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
                    title="The 3-Year Auction Lag"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                    badge="Timing Model"
                    badgeColor="bg-blue-100 text-blue-800"
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            In PJM and other organized capacity markets, the <strong>Base Residual Auction (BRA)</strong> clears
                            approximately 3 years before the delivery year. This means capacity price impacts from new load
                            don't affect ratepayer bills immediately—there's a lag between when load connects and when the
                            socialized cost flows through.
                        </p>

                        {/* Timeline */}
                        <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                            <h4 className="font-semibold text-blue-900 mb-4 text-center">Capacity Cost Timeline</h4>
                            <div className="relative">
                                <div className="h-2 bg-blue-200 rounded-full mb-8"></div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div>
                                        <div className="w-4 h-4 bg-gray-400 rounded-full mx-auto -mt-11 mb-4 ring-4 ring-blue-50"></div>
                                        <p className="font-semibold text-gray-900">Year 0</p>
                                        <p className="text-xs text-gray-600 mt-1">DC announces project</p>
                                    </div>
                                    <div>
                                        <div className="w-4 h-4 bg-amber-500 rounded-full mx-auto -mt-11 mb-4 ring-4 ring-blue-50"></div>
                                        <p className="font-semibold text-gray-900">Year 2</p>
                                        <p className="text-xs text-gray-600 mt-1">DC comes online</p>
                                        <p className="text-xs text-amber-600 font-medium">Direct costs begin</p>
                                    </div>
                                    <div>
                                        <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto -mt-11 mb-4 ring-4 ring-blue-50"></div>
                                        <p className="font-semibold text-gray-900">Year 2-3</p>
                                        <p className="text-xs text-gray-600 mt-1">BRA reflects new load</p>
                                        <p className="text-xs text-blue-600 font-medium">Auction clears</p>
                                    </div>
                                    <div>
                                        <div className="w-4 h-4 bg-red-500 rounded-full mx-auto -mt-11 mb-4 ring-4 ring-blue-50"></div>
                                        <p className="font-semibold text-gray-900">Year 5+</p>
                                        <p className="text-xs text-gray-600 mt-1">Delivery year</p>
                                        <p className="text-xs text-red-600 font-medium">Socialized costs hit bills</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                                <h4 className="font-semibold text-amber-900 mb-2">Direct Costs (Immediate)</h4>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>- Transmission infrastructure upgrades</li>
                                    <li>- Distribution system investments</li>
                                    <li>- Interconnection costs</li>
                                </ul>
                                <p className="text-xs text-amber-800 mt-2 font-medium">
                                    Apply when data center connects (Year 2)
                                </p>
                            </div>
                            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                <h4 className="font-semibold text-red-900 mb-2">Socialized Costs (3-Year Lag)</h4>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>- Capacity auction price increase</li>
                                    <li>- Applied to all existing load</li>
                                    <li>- Flows through retail rates</li>
                                </ul>
                                <p className="text-xs text-red-800 mt-2 font-medium">
                                    Apply ~3 years after connection (Year 5+)
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Model Implementation</p>
                            <div className="mt-3 font-mono text-xs bg-white p-3 rounded overflow-x-auto">
                                <p className="text-gray-500">// In trajectory calculations:</p>
                                <p>const marketLag = utility.hasCapacityMarket ? 3 : 0;</p>
                                <p className="mt-2">// Direct costs apply immediately</p>
                                <p>if (yearsOnline &gt;= 0) applyDirectCosts();</p>
                                <p className="mt-2">// Socialized costs apply after lag</p>
                                <p>if (yearsOnline &gt;= marketLag) applySocializedCosts();</p>
                            </div>
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
                                        <td className="py-2">Distribution cost per MW</td>
                                        <td className="text-right font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.distributionCostPerMW)}/MW</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://docs.nrel.gov/docs/fy18osti/70710.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                NREL: The Cost of Distribution System Upgrades (2018)
                                            </a>
                                            <span className="block text-gray-400">Substation + feeder costs; <span className="px-1 bg-amber-100 text-amber-800 rounded">$150k inferred from study ranges</span></span>
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
                                        <td className="text-right font-medium">${DC_RATE_STRUCTURE.energyMarginPerMWh}/MWh</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">Model Assumption</span>
                                            <span className="block text-gray-400 mt-1">Utility's wholesale-to-retail spread on energy sales. Industry typical range $3-8/MWh.</span>
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
                                <strong>Allocation Method:</strong> Infrastructure costs allocated through traditional rate base using
                                cost-of-service methodology per{' '}
                                <a href="https://www.ferc.gov/industries-data/electric/industry-activities/open-access-transmission-tariff-oatt-reform" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    FERC open access principles
                                </a>. State PUC sets rates based on embedded costs. Residential share based on
                                weighted blend: 40% volumetric (kWh), 40% demand (peak contribution), 20% customer count.
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
                                This cost applies with a <strong>3-year auction lag</strong>.
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
                                <p className="mb-2">Adjusted Allocation = Base Allocation x Market Multiplier</p>
                                <p className="text-gray-500 text-xs mt-3">Where Market Multiplier:</p>
                                <ul className="text-xs text-gray-500 mt-1 space-y-1">
                                    <li>- Regulated/SPP/PJM/NYISO/MISO: 1.0 (no adjustment)</li>
                                    <li>- ERCOT: 0.70 (large loads face 4CP transmission costs directly)</li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-3">
                                    <strong>Note:</strong> For capacity markets (PJM/NYISO/MISO), socialized capacity costs are calculated
                                    separately via the <em>Endogenous Capacity Pricing</em> model and added to the residential impact.
                                    This avoids double-counting while accurately capturing the "PJM Effect."
                                </p>
                            </div>
                            <p className="mt-3 text-sm text-gray-600">
                                Final allocation clamped to 20-55% range to maintain reasonable bounds. See{' '}
                                <a href="https://www.raponline.org/knowledge-center/electric-cost-allocation-new-era/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    RAP: Electric Cost Allocation for a New Era
                                </a>.
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
                                <strong>Simplified model:</strong> We use linear projections and don't capture
                                all feedback effects, step changes, or non-linear dynamics.
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
                                github.com/DougMackenzie/community-energy
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
