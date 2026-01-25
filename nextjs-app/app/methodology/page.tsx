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

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8 border border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Methodology & Technical Documentation
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mb-4">
                    This calculator models how large data center loads affect residential electricity bills,
                    with particular attention to <strong>capacity market dynamics</strong> and the "Hockey Stick"
                    effect that can cause cost spillovers to existing ratepayers.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                        Endogenous Capacity Pricing
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
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
                            PJM's 2025/26 auction where prices jumped 10× from the prior year.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">$269.92</p>
                                <p className="text-xs text-gray-500">PJM 2025/26 capacity price ($/MW-day)</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">10×</p>
                                <p className="text-xs text-gray-500">Increase from prior year</p>
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
                {/* ============================================ */}
                {/* MODEL OVERVIEW */}
                {/* ============================================ */}
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
                                during 3-hour peak events. While theoretical analysis suggests up to 42% is possible,
                                we use the field-validated 25% as a conservative baseline.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* CORE FORMULA */}
                {/* ============================================ */}
                <Section
                    id="core-formula"
                    title="Core Calculation Formula"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            The calculator computes residential bill impacts using a two-part formula that separates
                            <strong> direct infrastructure costs</strong> from <strong>socialized capacity costs</strong>:
                        </p>

                        <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                            <p className="text-gray-400 mb-2"># Part 1: Direct Infrastructure Impact</p>
                            <p>Direct_Impact = (Transmission + Distribution + Capacity_Credit - Revenue_Offset)</p>
                            <p className="ml-16">× Residential_Allocation / Customers / 12</p>
                            <p className="text-gray-400 mt-4 mb-2"># Part 2: Socialized Capacity Cost (Capacity Markets Only)</p>
                            <p>Socialized_Impact = Socialized_Capacity_Cost / Customers / 12</p>
                            <p className="text-gray-400 mt-4 mb-2"># Total Monthly Bill Impact</p>
                            <p className="text-green-400">Monthly_Impact = Direct_Impact + Socialized_Impact</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Direct Infrastructure Costs</h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    Costs incurred to serve the new data center load:
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span>Transmission upgrades:</span>
                                        <span className="font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.transmissionCostPerMW)}/MW</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Distribution upgrades:</span>
                                        <span className="font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.distributionCostPerMW)}/MW</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Capacity cost (if applicable):</span>
                                        <span className="font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.capacityCostPerMWYear)}/MW-yr</span>
                                    </li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-3">
                                    These costs apply immediately when data center connects (Year 2 in projections).
                                </p>
                            </div>
                            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                                <h4 className="font-semibold text-red-900 mb-3">Socialized Capacity Cost</h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    The "PJM Effect"—when the data center causes capacity prices to rise, ALL existing
                                    customers pay higher prices on their existing load:
                                </p>
                                <div className="bg-white p-3 rounded font-mono text-xs overflow-x-auto">
                                    <p>Socialized_Cost = Existing_Residential_Peak_MW</p>
                                    <p className="ml-16">× (New_Price - Old_Price)</p>
                                    <p className="ml-16">× 365 days</p>
                                    <p className="ml-16">× Pass_Through_Rate</p>
                                </div>
                                <p className="text-xs text-red-800 mt-3 font-medium">
                                    Applies with 3-year lag in capacity markets (PJM, NYISO, MISO).
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-semibold text-amber-900 mb-2">Why Two Parts?</p>
                            <p className="text-sm text-gray-700">
                                Direct infrastructure costs are <strong>specific to the data center</strong>—they're caused by
                                the physical need to serve the new load. Socialized capacity costs are <strong>market-wide</strong>—they
                                affect all existing customers because the capacity auction clearing price rises for everyone.
                                Separating these allows us to model the timing correctly (immediate vs. 3-year lag) and
                                show how flexible operation reduces both components differently.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* HOCKEY STICK SUPPLY CURVE */}
                {/* ============================================ */}
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

                            {/* ASCII-style diagram */}
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
                                                <td className="py-2 px-4 text-right">{slope.priceMultiplier.toFixed(2)}×</td>
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
                            </p>
                        </div>

                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm font-semibold text-red-900 mb-2">Why This Matters for Data Centers</p>
                            <p className="text-sm text-gray-700 mb-3">
                                A 1,000 MW data center in a utility with 15% reserve margin can push the system into scarcity.
                                Example calculation:
                            </p>
                            <div className="bg-white p-3 rounded font-mono text-xs overflow-x-auto">
                                <p>System Peak: 10,000 MW | Total Capacity: 11,500 MW</p>
                                <p>Reserve Margin = (11,500 - 10,000) / 10,000 = <strong>15%</strong> (at target)</p>
                                <p className="mt-2">After 1,000 MW data center (100% peak coincidence):</p>
                                <p>New Peak: 11,000 MW</p>
                                <p>New Reserve = (11,500 - 11,000) / 11,000 = <strong>4.5%</strong></p>
                                <p className="text-red-600 mt-2">Result: Reserve drops from 15% → 4.5%, capacity price jumps from $280 → ~$800/MW-day</p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* SOCIALIZED SCARCITY */}
                {/* ============================================ */}
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

                        {/* How Socialization Works */}
                        <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                            <h4 className="font-semibold text-red-900 mb-4">How Cost Socialization Works</h4>

                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-white rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">1</div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">Data Center Connects</p>
                                    <p className="text-xs text-gray-600">1,000 MW added to system peak</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">2</div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">Reserve Margin Drops</p>
                                    <p className="text-xs text-gray-600">15% → 5% triggers hockey stick</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">3</div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">ALL Customers Pay More</p>
                                    <p className="text-xs text-gray-600">Higher capacity price × existing load</p>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-900 mb-2">Socialized Cost Formula:</p>
                                <div className="font-mono text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                                    <p>Socialized_Cost = Existing_Residential_Peak × (New_Price - Old_Price) × 365</p>
                                    <p className="text-gray-500 mt-2">Where:</p>
                                    <ul className="text-gray-600 ml-4 mt-1 space-y-1">
                                        <li>• Existing_Residential_Peak = System_Peak × 35% (residential share)</li>
                                        <li>• Price difference from VRR curve interpolation</li>
                                        <li>• 365 days converts $/MW-day to annual cost</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Example Calculation */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Example: AEP Ohio (PJM)</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 mb-2">Before Data Center:</p>
                                    <ul className="text-sm space-y-1">
                                        <li>System Peak: 12,000 MW</li>
                                        <li>Total Capacity: 13,200 MW</li>
                                        <li>Reserve Margin: 10%</li>
                                        <li>Capacity Price: ~$420/MW-day (scarcity)</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 mb-2">After 1,000 MW DC (firm):</p>
                                    <ul className="text-sm space-y-1">
                                        <li>New Peak: 13,000 MW</li>
                                        <li>New Reserve Margin: 1.5%</li>
                                        <li>New Capacity Price: ~$1,050/MW-day</li>
                                        <li className="text-red-600 font-medium">Price Increase: +$630/MW-day</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
                                <p className="text-sm text-amber-900">
                                    <strong>Socialized cost to residential customers:</strong><br />
                                    12,000 MW × 35% × $630/MW-day × 365 days × 50% pass-through = <strong>~$484M/year</strong><br />
                                    With 1.4M residential customers: <strong>~$29/month per household</strong>
                                </p>
                            </div>
                        </div>

                        {/* How Flexibility Helps */}
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="font-semibold text-green-900 mb-3">How Flexible Data Centers Reduce Socialized Costs</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                A flexible data center with 75% peak coincidence adds only 750 MW to system peak instead of 1,000 MW:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-medium text-red-600 mb-1">Firm Load (100% coincidence)</p>
                                    <p className="text-sm">+1,000 MW to peak → Reserve drops to 1.5%</p>
                                    <p className="text-sm text-red-600">Capacity price: ~$1,050/MW-day</p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="font-medium text-green-600 mb-1">Flexible Load (75% coincidence)</p>
                                    <p className="text-sm">+750 MW to peak → Reserve at 3.7%</p>
                                    <p className="text-sm text-green-600">Capacity price: ~$850/MW-day</p>
                                </div>
                            </div>
                            <p className="text-sm text-green-800 mt-3 font-medium">
                                Result: ~24% lower socialized cost impact through flexibility alone.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* AUCTION LAG */}
                {/* ============================================ */}
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

                        {/* Timeline Diagram */}
                        <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                            <h4 className="font-semibold text-blue-900 mb-4 text-center">Capacity Cost Timeline</h4>

                            <div className="relative">
                                {/* Timeline bar */}
                                <div className="h-2 bg-blue-200 rounded-full mb-8"></div>

                                {/* Timeline points */}
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
                                    <li>• Transmission infrastructure upgrades</li>
                                    <li>• Distribution system investments</li>
                                    <li>• Interconnection costs</li>
                                </ul>
                                <p className="text-xs text-amber-800 mt-2 font-medium">
                                    Apply when data center connects (Year 2)
                                </p>
                            </div>
                            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                <h4 className="font-semibold text-red-900 mb-2">Socialized Costs (3-Year Lag)</h4>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>• Capacity auction price increase</li>
                                    <li>• Applied to all existing load</li>
                                    <li>• Flows through retail rates</li>
                                </ul>
                                <p className="text-xs text-red-800 mt-2 font-medium">
                                    Apply ~3 years after connection (Year 5+)
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Model Implementation</p>
                            <p className="text-sm text-gray-600">
                                Our trajectory projections separate these timing effects:
                            </p>
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

                {/* ============================================ */}
                {/* MARKET COMPARISON: PJM vs ERCOT */}
                {/* ============================================ */}
                <Section
                    id="market-comparison"
                    title="Market Comparison: PJM vs ERCOT"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Our model treats different market structures differently because the mechanisms for cost
                            allocation vary significantly. The two primary models are <strong>capacity markets</strong> (PJM, NYISO, MISO)
                            and <strong>energy-only markets</strong> (ERCOT).
                        </p>

                        {/* Side-by-side comparison */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* PJM Column */}
                            <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                                <div className="bg-blue-600 text-white px-4 py-3">
                                    <h4 className="font-semibold">PJM / NYISO / MISO</h4>
                                    <p className="text-sm text-blue-100">Capacity Market Model</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">How Costs Flow:</p>
                                        <ul className="text-sm space-y-1">
                                            <li>✓ Capacity auctions set prices 3 years ahead</li>
                                            <li>✓ Large loads affect auction clearing price</li>
                                            <li>✓ Price increase socialized to ALL load</li>
                                            <li>✓ Infrastructure costs via traditional riders</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">Cost Spillover Mechanism:</p>
                                        <div className="bg-red-50 p-2 rounded text-sm">
                                            <span className="font-medium text-red-700">Hockey Stick + Socialization</span>
                                            <p className="text-xs text-gray-600 mt-1">
                                                When reserve margin drops, capacity prices spike for everyone
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">Model Parameters:</p>
                                        <ul className="text-sm space-y-1 text-gray-600">
                                            <li>Allocation multiplier: <span className="font-medium">1.0×</span></li>
                                            <li>Auction lag: <span className="font-medium">3 years</span></li>
                                            <li>Pass-through rate: <span className="font-medium">50%</span></li>
                                            <li>Endogenous pricing: <span className="font-medium text-green-600">Yes</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* ERCOT Column */}
                            <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                                <div className="bg-green-600 text-white px-4 py-3">
                                    <h4 className="font-semibold">ERCOT (Texas)</h4>
                                    <p className="text-sm text-green-100">Energy-Only Market</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">How Costs Flow:</p>
                                        <ul className="text-sm space-y-1">
                                            <li>✓ No capacity market or auctions</li>
                                            <li>✓ 4CP transmission allocation</li>
                                            <li>✓ Large loads pay directly for transmission</li>
                                            <li>✓ Energy prices can spike during scarcity</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">Cost Spillover Mechanism:</p>
                                        <div className="bg-green-50 p-2 rounded text-sm">
                                            <span className="font-medium text-green-700">Direct Assignment (4CP)</span>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Large loads assigned transmission costs based on usage during 4 peak hours
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">Model Parameters:</p>
                                        <ul className="text-sm space-y-1 text-gray-600">
                                            <li>Allocation multiplier: <span className="font-medium">0.70×</span></li>
                                            <li>Auction lag: <span className="font-medium">N/A</span></li>
                                            <li>4CP rate: <span className="font-medium">$5.50/kW-mo</span></li>
                                            <li>Endogenous pricing: <span className="font-medium text-gray-400">No</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Differences Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Aspect</th>
                                        <th className="text-center py-3 px-4 font-medium">PJM/NYISO/MISO</th>
                                        <th className="text-center py-3 px-4 font-medium">ERCOT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-2 px-4 font-medium">Capacity Pricing</td>
                                        <td className="py-2 px-4 text-center">Auction-based, 3-year forward</td>
                                        <td className="py-2 px-4 text-center">Energy-only (scarcity pricing)</td>
                                    </tr>
                                    <tr className="border-t border-gray-100 bg-gray-50">
                                        <td className="py-2 px-4 font-medium">Socialization Risk</td>
                                        <td className="py-2 px-4 text-center text-red-600">High (hockey stick)</td>
                                        <td className="py-2 px-4 text-center text-green-600">Low (direct assignment)</td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-2 px-4 font-medium">Transmission Cost</td>
                                        <td className="py-2 px-4 text-center">Socialized via rates</td>
                                        <td className="py-2 px-4 text-center">4CP direct assignment</td>
                                    </tr>
                                    <tr className="border-t border-gray-100 bg-gray-50">
                                        <td className="py-2 px-4 font-medium">Price Volatility</td>
                                        <td className="py-2 px-4 text-center">Low (hedged 3 years ahead)</td>
                                        <td className="py-2 px-4 text-center text-amber-600">High (real-time)</td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-2 px-4 font-medium">Flexibility Benefit</td>
                                        <td className="py-2 px-4 text-center">Reduces capacity price spike</td>
                                        <td className="py-2 px-4 text-center">Avoids 4CP charges + energy spikes</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-semibold text-amber-900 mb-2">Why the Allocation Multiplier Differs</p>
                            <p className="text-sm text-gray-700">
                                In ERCOT, we apply a <strong>0.70×</strong> multiplier to residential allocation because large loads
                                pay directly for their transmission usage through the 4CP methodology. This reduces cost spillover
                                to residential customers compared to capacity markets where costs are socialized.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* WORKLOAD FLEXIBILITY */}
                {/* ============================================ */}
                <Section
                    id="flexibility"
                    title="Workload Flexibility Model"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Data center flexibility is modeled based on workload composition. Different workload types
                            have varying degrees of deferability, which determines how much peak reduction is achievable.
                        </p>

                        {/* Workload Breakdown */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Workload Type</th>
                                        <th className="text-right py-3 px-4 font-medium">% of Load</th>
                                        <th className="text-right py-3 px-4 font-medium">Flexibility</th>
                                        <th className="text-left py-3 px-4 font-medium">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(WORKLOAD_TYPES).map(([key, workload]) => (
                                        <tr key={key} className="border-t border-gray-100">
                                            <td className="py-2 px-4 font-medium">{workload.name}</td>
                                            <td className="py-2 px-4 text-right">{(workload.percentOfLoad * 100).toFixed(0)}%</td>
                                            <td className="py-2 px-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                    workload.flexibility >= 0.6 ? 'bg-green-100 text-green-800' :
                                                    workload.flexibility >= 0.3 ? 'bg-amber-100 text-amber-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {(workload.flexibility * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 text-gray-600 text-xs">{workload.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="font-semibold text-gray-900 mb-2">Theoretical Maximum Flexibility</p>
                                <p className="text-sm mb-2">
                                    Weighted sum: {Object.values(WORKLOAD_TYPES).reduce((sum, w) => sum + w.percentOfLoad * w.flexibility, 0).toFixed(0) + '%'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Based on workload composition analysis. Represents upper bound if all deferrable work is shifted.
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="font-semibold text-green-900 mb-2">Field-Validated (DCFlex)</p>
                                <p className="text-sm mb-2">
                                    25% sustained reduction during 3-hour peaks
                                </p>
                                <p className="text-xs text-green-800">
                                    Conservative baseline used in model. Accounts for coordination overhead and operational constraints.
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* DATA SOURCES */}
                {/* ============================================ */}
                <Section
                    id="data-sources"
                    title="Data Sources & References"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p className="text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <strong>Transparency Note:</strong> Values marked with{' '}
                            <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-medium">
                                Model Assumption
                            </span>{' '}
                            are based on industry understanding or selected from published ranges.
                            You can substitute your own values in the calculator.
                        </p>

                        {/* Key Parameters Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2">
                                <h4 className="font-semibold text-gray-900">Key Model Parameters</h4>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-2 px-4 font-medium">Parameter</th>
                                        <th className="text-right py-2 px-4 font-medium">Value</th>
                                        <th className="text-left py-2 px-4 font-medium">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-2 px-4">CONE (Cost of New Entry)</td>
                                        <td className="py-2 px-4 text-right font-medium">${SUPPLY_CURVE.costOfNewEntry}/MW-day</td>
                                        <td className="py-2 px-4 text-xs">
                                            <a href="https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                PJM BRA Reports
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100 bg-gray-50">
                                        <td className="py-2 px-4">Target Reserve Margin</td>
                                        <td className="py-2 px-4 text-right font-medium">{(SUPPLY_CURVE.targetReserveMargin * 100).toFixed(0)}%</td>
                                        <td className="py-2 px-4 text-xs">
                                            <a href="https://www.nerc.com/pa/RAPA/ra/Reliability%20Assessments%20DL/NERC_LTRA_2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                NERC Reliability Assessments
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-2 px-4">Transmission Cost</td>
                                        <td className="py-2 px-4 text-right font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.transmissionCostPerMW)}/MW</td>
                                        <td className="py-2 px-4 text-xs">
                                            <a href="https://cdn.misoenergy.org/MTEP23%20Executive%20Summary630586.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                MISO MTEP23
                                            </a>
                                            <span className="ml-1 px-1 bg-amber-100 text-amber-800 rounded text-xs">Median</span>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100 bg-gray-50">
                                        <td className="py-2 px-4">Distribution Cost</td>
                                        <td className="py-2 px-4 text-right font-medium">{formatCurrency(INFRASTRUCTURE_COSTS.distributionCostPerMW)}/MW</td>
                                        <td className="py-2 px-4 text-xs">
                                            <a href="https://docs.nrel.gov/docs/fy18osti/70710.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                NREL Distribution Study
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-2 px-4">Firm Load Factor</td>
                                        <td className="py-2 px-4 text-right font-medium">{(DEFAULT_DATA_CENTER.firmLoadFactor * 100).toFixed(0)}%</td>
                                        <td className="py-2 px-4 text-xs">
                                            <a href="https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                LBNL DC Energy Report
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100 bg-gray-50">
                                        <td className="py-2 px-4">Peak Curtailment Capability</td>
                                        <td className="py-2 px-4 text-right font-medium">{((1 - DEFAULT_DATA_CENTER.flexPeakCoincidence) * 100).toFixed(0)}%</td>
                                        <td className="py-2 px-4 text-xs">
                                            <a href="https://dcflex.epri.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                EPRI DCFlex (field-validated)
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-2 px-4">Demand Charge (Total)</td>
                                        <td className="py-2 px-4 text-right font-medium">${DC_RATE_STRUCTURE.demandChargePerMWMonth.toLocaleString()}/MW-mo</td>
                                        <td className="py-2 px-4 text-xs">
                                            <a href="https://www.psoklahoma.com/company/about/rates/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                PSO LPL Tariff
                                            </a>
                                            <span className="ml-1 px-1 bg-amber-100 text-amber-800 rounded text-xs">Representative</span>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100 bg-gray-50">
                                        <td className="py-2 px-4">Energy Margin</td>
                                        <td className="py-2 px-4 text-right font-medium">${DC_RATE_STRUCTURE.energyMarginPerMWh}/MWh</td>
                                        <td className="py-2 px-4 text-xs">
                                            <span className="px-1.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">Model Assumption</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Additional References */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Additional References</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a href="https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        Grid Strategies: National Load Growth Report (Dec 2024)
                                    </a>
                                    <span className="block text-xs text-gray-500">Data center contribution to load growth; 63% attribution figure</span>
                                </li>
                                <li>
                                    <a href="https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-resource-demand-doc/variable-resource-requirement-curve.ashx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        PJM Variable Resource Requirement Curve Documentation
                                    </a>
                                    <span className="block text-xs text-gray-500">Official VRR curve methodology; basis for our hockey stick model</span>
                                </li>
                                <li>
                                    <a href="https://www.raponline.org/knowledge-center/electric-cost-allocation-new-era/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        RAP: Electric Cost Allocation for a New Era
                                    </a>
                                    <span className="block text-xs text-gray-500">Residential allocation methodology and cost-causation principles</span>
                                </li>
                                <li>
                                    <a href="https://atb.nrel.gov/electricity/2024/index" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                        NREL Annual Technology Baseline 2024
                                    </a>
                                    <span className="block text-xs text-gray-500">Generation technology capital and operating costs</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* MODEL LIMITATIONS */}
                {/* ============================================ */}
                <Section
                    id="limitations"
                    title="Model Limitations & Assumptions"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            This model makes simplifying assumptions to provide directional estimates. It should be used
                            for educational purposes and initial analysis, not for precise cost projections.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                                <h4 className="font-semibold text-amber-900 mb-3">Key Assumptions</h4>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li>• VRR curve is simplified from actual ISO implementations</li>
                                    <li>• CONE value (${SUPPLY_CURVE.costOfNewEntry}/MW-day) is representative; actual varies by zone</li>
                                    <li>• 3-year auction lag applied uniformly; actual timing varies</li>
                                    <li>• Reserve margin data based on public filings; fluctuates seasonally</li>
                                    <li>• 35% residential share of peak is consistent estimate across utilities</li>
                                    <li>• 50% capacity cost pass-through rate is a model estimate</li>
                                </ul>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Not Modeled</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Zonal constraints (e.g., NYC vs upstate NY dynamics)</li>
                                    <li>• Seasonal variation in reserve margins</li>
                                    <li>• Generation retirements/additions over projection period</li>
                                    <li>• Fuel cost volatility effects</li>
                                    <li>• Multi-data-center interactions</li>
                                    <li>• State-specific regulatory decisions</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-2">Use Appropriately</p>
                            <p className="text-sm text-gray-700">
                                This tool is designed for educational purposes and initial analysis. Actual utility planning
                                and rate-making involves much more detailed engineering and economic modeling. Results should
                                be interpreted as directional indicators, not precise forecasts.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ============================================ */}
                {/* OPEN SOURCE */}
                {/* ============================================ */}
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

                {/* ============================================ */}
                {/* AI CARBON FOOTPRINT */}
                {/* ============================================ */}
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
