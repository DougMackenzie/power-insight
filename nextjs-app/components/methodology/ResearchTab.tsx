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

interface ResearchTabProps {
    /** Initial expanded section ID */
    initialSection?: string;
}

/**
 * Research & Framework Tab
 *
 * Contains the original methodology page content with accordion sections
 * explaining the technical framework, calculations, and data sources.
 */
export default function ResearchTab({ initialSection = 'data-sources' }: ResearchTabProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(initialSection);
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
        <div className="space-y-8">
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

                {/* DATA SOURCES & REVENUE ADEQUACY */}
                <Section
                    id="data-sources"
                    title="Data Sources & Revenue Adequacy Analysis"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                    badge="E3 Methodology"
                    badgeColor="bg-green-100 text-green-800"
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Our revenue adequacy analysis follows the methodology from the E3 Study{' '}
                            <a
                                href="https://www.ethree.com/wp-content/uploads/2024/12/Tailored-for-Scale-Designing-Rates-to-Support-Data-Centers-E3-December-2024.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                "Tailored for Scale: Designing Rates to Support Data Centers"
                            </a>{' '}
                            (December 2024), which established the framework for evaluating whether data center tariffs
                            adequately cover incremental infrastructure costs.
                        </p>

                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="font-semibold text-green-900 mb-3">Revenue Adequacy Framework (E3 Methodology)</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                The E3 study defines <strong>revenue adequacy</strong> as the ratio of data center
                                tariff revenue to the incremental cost of serving that load. A ratio ≥ 100% indicates
                                the tariff fully covers costs; below 100% indicates potential cross-subsidization.
                            </p>
                            <div className="bg-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <p><strong>Revenue Adequacy Ratio = Annual Tariff Revenue / Annual Incremental Cost</strong></p>
                                <p className="text-gray-500 mt-2">Where:</p>
                                <ul className="text-gray-600 mt-1 space-y-1 text-xs">
                                    <li>- Tariff Revenue = Demand Charges + Energy Charges + Fixed Charges</li>
                                    <li>- Incremental Cost = Transmission + Distribution + Generation Capacity</li>
                                </ul>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Infrastructure Costs</h4>
                                <ul className="text-sm space-y-1">
                                    <li><strong>Transmission:</strong> ${INFRASTRUCTURE_COSTS.transmissionCostPerMW.toLocaleString()}/MW</li>
                                    <li><strong>Distribution:</strong> ${INFRASTRUCTURE_COSTS.distributionCostPerMW.toLocaleString()}/MW</li>
                                    <li><strong>Generation:</strong> ${INFRASTRUCTURE_COSTS.capacityCostPerMWYear.toLocaleString()}/MW-year</li>
                                </ul>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Revenue Components</h4>
                                <ul className="text-sm space-y-1">
                                    <li><strong>CP Charge:</strong> ${DC_RATE_STRUCTURE.coincidentPeakChargePerMWMonth.toLocaleString()}/MW-mo</li>
                                    <li><strong>NCP Charge:</strong> ${DC_RATE_STRUCTURE.nonCoincidentPeakChargePerMWMonth.toLocaleString()}/MW-mo</li>
                                    <li><strong>Energy Margin:</strong> Varies by market</li>
                                </ul>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Market Wholesale Costs</h4>
                                <ul className="text-sm space-y-1">
                                    <li><strong>ERCOT:</strong> $45/MWh</li>
                                    <li><strong>PJM:</strong> $42/MWh</li>
                                    <li><strong>MISO:</strong> $35/MWh</li>
                                    <li><strong>NYISO:</strong> $55/MWh</li>
                                </ul>
                            </div>
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
                        </div>
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
                            </p>
                        </div>
                    </div>
                </Section>

                {/* WORKLOAD FLEXIBILITY */}
                <Section
                    id="workload-flexibility"
                    title="Workload Flexibility Model"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Our workload flexibility model is based on the classification of data center workloads
                            by their time-sensitivity and ability to be deferred or curtailed during peak demand periods.
                        </p>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Workload Type</th>
                                        <th className="text-right py-3 px-4 font-medium">Share</th>
                                        <th className="text-right py-3 px-4 font-medium">Flexibility</th>
                                        <th className="text-left py-3 px-4 font-medium">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(WORKLOAD_TYPES).map(([key, workload]) => (
                                        <tr key={key} className="border-t border-gray-100">
                                            <td className="py-2 px-4 font-medium">{workload.name}</td>
                                            <td className="py-2 px-4 text-right">{(workload.percentOfLoad * 100).toFixed(0)}%</td>
                                            <td className="py-2 px-4 text-right">{(workload.flexibility * 100).toFixed(0)}%</td>
                                            <td className="py-2 px-4 text-gray-600 text-xs">{workload.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-2">Aggregate Flexibility Calculation</p>
                            <p className="text-sm text-gray-700">
                                Weighted average flexibility = Σ (share × flexibility) = <strong>{(aggregateFlexibility * 100).toFixed(0)}%</strong>
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                This represents the theoretical maximum load reduction achievable through workload shifting.
                                The model uses 25% as the validated field value from EPRI DCFlex demonstrations.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* CARBON FOOTPRINT */}
                <Section
                    id="carbon"
                    title="Carbon Footprint of This Calculator"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p>
                            This calculator was built with AI assistance. Here's the estimated carbon footprint
                            from the development process:
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-700">{(totalTokens / 1000).toFixed(0)}K</p>
                                <p className="text-xs text-gray-500">Total tokens processed</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-700">{totalKgCO2.toFixed(2)} kg</p>
                                <p className="text-xs text-gray-500">Estimated CO2 emissions</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-700">{hamburgerEquiv.toFixed(1)}</p>
                                <p className="text-xs text-gray-500">Hamburger equivalents</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            Based on {gCO2PerK} gCO2/1000 tokens estimate. A hamburger produces approximately {hamburgerKg} kg CO2.
                        </p>
                    </div>
                </Section>
            </div>
        </div>
    );
}
