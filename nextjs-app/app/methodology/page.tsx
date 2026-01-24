'use client';

import { useState } from 'react';
import {
    INFRASTRUCTURE_COSTS,
    TIME_PARAMS,
    WORKLOAD_TYPES,
    DEFAULT_UTILITY,
    DEFAULT_DATA_CENTER,
    DC_RATE_STRUCTURE,
    formatCurrency,
} from '@/lib/constants';

interface SectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
    expandedSection: string | null;
    toggleSection: (id: string) => void;
}

const Section = ({ id, title, children, expandedSection, toggleSection }: SectionProps) => {
    const isExpanded = expandedSection === id;
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => toggleSection(id)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <h3 className="font-semibold text-gray-900">{title}</h3>
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

export default function MethodologyPage() {
    const [expandedSection, setExpandedSection] = useState<string | null>('overview');

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gray-100 rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Methodology & Data Sources
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl">
                    This tool uses industry-standard methodologies and publicly available data
                    to project electricity cost impacts. Below we explain our models, assumptions,
                    and data sources so you can verify and critique our approach.
                </p>
            </div>

            {/* Model Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Overview</h2>
                <p className="text-gray-600 mb-4">
                    Our model projects residential electricity bills under four scenarios:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-6">
                    <li><strong>Baseline:</strong> Normal cost growth from infrastructure aging and inflation</li>
                    <li><strong>Firm Load:</strong> Data center operates at constant power, adding 100% of capacity to system peak</li>
                    <li><strong>Flexible Load:</strong> Data center reduces load by 25% during peak hours by deferring non-time-sensitive workloads</li>
                    <li><strong>Flex + Dispatchable:</strong> Flexible operation plus onsite generation to further reduce grid draw during peaks</li>
                </ol>
                <p className="text-gray-600 mb-4">
                    For each scenario, we calculate infrastructure costs, revenue contributions, and
                    allocate net impacts to residential customers based on market-specific regulatory methods.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg text-sm">
                    <p className="font-semibold text-gray-900 mb-2">About the Flexibility Assumptions</p>
                    <p className="text-gray-600">
                        The 25% peak reduction capability is based on{' '}
                        <a href="https://dcflex.epri.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            EPRI's DCFlex initiative
                        </a>
                        , a 2024 field demonstration at a major data center that achieved 25% sustained power reduction
                        during 3-hour peak events. While theoretical flexibility from workload analysis suggests up to 42%
                        is possible, the 25% figure represents a conservative, field-validated baseline. See the
                        <strong> Workload Flexibility Model</strong> section for details.
                    </p>
                </div>
            </div>

            {/* Detailed sections */}
            <div className="space-y-4">
                <Section
                    id="overview"
                    title="Core Calculation Logic"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p><strong>Basic Formula:</strong></p>
                        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <p>Monthly Impact = (Infrastructure Costs − DC Revenue Offset) × Residential Allocation / Customers / 12</p>
                        </div>

                        <p className="mt-6"><strong>Key Terms Explained:</strong></p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                            <div>
                                <span className="font-semibold">Load Factor:</span> Average power draw ÷ nameplate capacity.
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
                                <li><strong>Flexible load</strong> (75% peak): Grid supports X ÷ 0.75 = <strong>1.33X MW</strong> of data center capacity</li>
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
                                <span className="font-semibold text-gray-900">1. Energy Revenue (Volume × Margin)</span>
                                <p className="mt-1">
                                    Utilities earn margin on each MWh sold: ${DC_RATE_STRUCTURE.energyMarginPerMWh}/MWh wholesale-to-retail spread.
                                    This margin contributes to the utility's revenue requirement, which is then allocated across all customers.
                                </p>
                                <div className="mt-2 pl-4 border-l-2 border-blue-300">
                                    <p><strong>Firm (80% LF):</strong> 1,000 MW × 80% × 8,760 hrs = 7,008,000 MWh/year</p>
                                    <p><strong>Flexible (95% LF):</strong> 1,000 MW × 95% × 8,760 hrs = 8,322,000 MWh/year</p>
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

                        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm font-semibold text-purple-900 mb-2">When Revenue Exceeds Infrastructure Costs</p>
                            <p className="text-sm text-purple-800">
                                Flexible data centers can generate net benefits to ratepayers when:
                            </p>
                            <ul className="list-disc list-inside text-sm text-purple-800 mt-2 space-y-1">
                                <li>Higher load factor generates significantly more energy revenue</li>
                                <li>25% peak curtailment reduces infrastructure requirements</li>
                                <li>Onsite generation further reduces grid capacity needs</li>
                                <li>Combined revenue contribution exceeds reduced infrastructure costs</li>
                            </ul>
                            <p className="text-sm text-purple-800 mt-2">
                                This is why the "Optimized Data Center" scenario can show <strong>lower bills than baseline</strong>
                                in certain configurations—the data center becomes a net contributor to the system.
                            </p>
                        </div>

                        <p className="mt-6"><strong>Residential Cost Allocation:</strong></p>
                        <p className="text-sm mb-3">
                            The share of net costs allocated to residential customers depends on the utility's market structure.
                            See the <strong>"Market Structures & Cost Allocation Framework"</strong> section below for detailed
                            allocation factors by market type (regulated, PJM, ERCOT, etc.).
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Base allocation:</strong> Varies by market (30-40% typical)</li>
                            <li><strong>Calculation method:</strong> Weighted blend of 40% volumetric (kWh), 40% demand (peak MW), 20% customer count</li>
                            <li><strong>Dynamic adjustment:</strong> As data center adds energy and peak, residential shares shift</li>
                            <li><strong>Regulatory lag:</strong> Changes phase in over ~5 years through rate case proceedings</li>
                            <li><strong>Market multipliers:</strong> ERCOT applies 0.85× (large loads face prices directly); high PJM capacity prices increase allocation</li>
                        </ul>

                        <p className="mt-4 text-sm text-gray-500">
                            The baseline trajectory includes {(TIME_PARAMS.generalInflation * 100).toFixed(1)}% annual
                            inflation and {(INFRASTRUCTURE_COSTS.annualBaselineUpgradePercent * 100).toFixed(1)}% annual
                            infrastructure replacement costs.
                        </p>
                    </div>
                </Section>

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
                                    <span className="block text-xs text-gray-500 ml-0">Data center contribution to load growth by region</span>
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
                            </ul>
                        </div>
                    </div>
                </Section>

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
                                        <td className="text-right">{(wl.flexibility * 100).toFixed(0)}%</td>
                                        <td className="pl-4 text-gray-500 text-xs">{wl.description}</td></tr>
                                ))}
                                <tr className="border-t-2 border-gray-300 font-semibold">
                                    <td className="py-2">Theoretical Aggregate</td>
                                    <td className="text-right">100%</td>
                                    <td className="text-right">~42%</td>
                                    <td className="pl-4 text-gray-500 text-xs">Weighted sum of flexibility by load share</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-900 mb-2">Why We Use 25% (Not 42%)</h4>
                            <p className="text-sm text-amber-800">
                                While the theoretical workload analysis suggests ~42% aggregate flexibility, our model uses
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
                                        <td className="text-right text-red-600">~10× increase</td>
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
                                $269.92/MW-day for 2025/26. Our model increases residential allocation by up to 15% when
                                capacity prices exceed $100/MW-day to reflect cost pressure spreading across customer classes, per
                                analysis in{' '}
                                <a href="https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    PJM auction results
                                </a>.
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
                                        <td className="text-right">× 0.70</td>
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
                                    <tr className="border-b border-green-100">
                                        <td className="py-2 font-medium">DC share of load growth</td>
                                        <td className="text-right">46%</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.ercot.com/gridinfo/load/forecast" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                ERCOT Long-Term Load Forecast
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                <p className="text-sm font-semibold text-green-900 mb-1">ERCOT 4CP Transmission Allocation</p>
                                <p className="text-xs text-green-800">
                                    ERCOT allocates transmission costs based on <strong>Four Coincident Peak (4CP)</strong> methodology.
                                    Transmission charges are based on a customer's load during the 4 highest system peak hours each year
                                    (typically one per season). This creates a <strong>huge incentive for flexible loads</strong>:
                                </p>
                                <ul className="list-disc list-inside text-xs text-green-800 mt-2 space-y-1">
                                    <li><strong>Firm DC:</strong> Pays full 4CP charges (likely operating at high capacity during peaks)</li>
                                    <li><strong>Flexible DC:</strong> Can curtail during the 4 peak hours, reducing transmission allocation by 25%+</li>
                                </ul>
                                <p className="text-xs text-green-800 mt-2">
                                    Our model applies a 0.70× multiplier to residential allocation for ERCOT because the 4CP methodology
                                    ensures data centers pay more directly for their transmission needs.
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
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Typical for vertically integrated utility; based on{' '}
                                                <a href="https://www.psoklahoma.com/company/about/rates/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PSO rate structure</a>
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Capacity Cost Pass-Through</td>
                                        <td className="text-right">40%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Bilateral capacity; flows through vertically integrated rates</span>
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
                            <p className="mt-3 text-sm text-gray-500">
                                <strong>Allocation Method:</strong> SPP operates an energy market but no mandatory capacity market per{' '}
                                <a href="https://www.spp.org/markets-operations/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    SPP Market Operations
                                </a>.
                                Resource adequacy achieved through bilateral contracts. Cost allocation similar to traditional regulated markets.
                            </p>
                        </div>

                        {/* MISO */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                                MISO Capacity Market
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                                (Reference market - lower capacity prices than PJM)
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
                                        <td className="text-right">38%</td>
                                        <td className="pl-4 text-xs">
                                            <span className="px-1 bg-amber-100 text-amber-800 rounded">Model Assumption</span>
                                            <span className="block text-gray-400">Between regulated (40%) and PJM (35%); many utilities still vertically integrated</span>
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
                            <p className="mt-3 text-sm text-gray-500">
                                MISO's Planning Resource Auction clears at significantly lower prices than PJM due to different
                                market design and resource mix. Many vertically integrated utilities still operate within MISO per{' '}
                                <a href="https://www.misoenergy.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    MISO market overview
                                </a>.
                            </p>
                        </div>

                        {/* Allocation Formula */}
                        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3">Market-Adjusted Allocation Formula</h4>
                            <div className="bg-white p-4 rounded font-mono text-sm overflow-x-auto">
                                <p className="mb-2">Adjusted Allocation = Base Allocation × Market Multiplier</p>
                                <p className="text-gray-500 text-xs mt-3">Where Market Multiplier:</p>
                                <ul className="text-xs text-gray-500 mt-1 space-y-1">
                                    <li>• Regulated/SPP: 1.0 (no adjustment)</li>
                                    <li>• PJM with high capacity prices (&gt;$100/MW-day): 1.0 to 1.15</li>
                                    <li>• ERCOT: 0.85 (large loads face prices directly)</li>
                                </ul>
                            </div>
                            <p className="mt-3 text-sm text-gray-600">
                                Final allocation clamped to 20-55% range to maintain reasonable bounds regardless of market conditions.
                                See{' '}
                                <a href="https://www.raponline.org/knowledge-center/electric-cost-allocation-new-era/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    RAP: Electric Cost Allocation for a New Era
                                </a>{' '}
                                for discussion of allocation bounds in utility ratemaking.
                            </p>
                        </div>
                    </div>
                </Section>

                <Section
                    id="tariff-structures"
                    title="Utility-Specific Tariff Structures"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Demand charge structures vary significantly between utilities. Our model uses actual tariff data
                            from major utilities to calculate more accurate demand charge revenue and flexibility benefits.
                        </p>

                        <p className="text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <strong>Why this matters:</strong> The benefit of flexible operation depends heavily on the tariff structure.
                            Utilities with TOU (time-of-use) peak charges or coincident peak-based rates offer greater benefits
                            to data centers that can curtail during peak periods.
                        </p>

                        {/* Tariff Types Overview */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Demand Charge Structure Types</h4>
                            <div className="space-y-4">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="font-semibold text-gray-900">TOU Peak + NCP (PSO, Dominion)</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Separate charges: <strong>Peak Demand</strong> based on usage during on-peak hours (e.g., 2pm-9pm summer)
                                        and <strong>Maximum Demand</strong> based on any-time peak. Flexible loads can dramatically reduce
                                        peak demand charges by curtailing during on-peak windows.
                                    </p>
                                </div>
                                <div className="border-l-4 border-amber-500 pl-4">
                                    <p className="font-semibold text-gray-900">Coincident Peak (Duke, Georgia Power)</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Charges based on contribution during <strong>system coincident peak</strong> hours.
                                        Often includes annual ratchets (e.g., 70% of annual maximum). Benefit depends on
                                        ability to predict and avoid system peaks.
                                    </p>
                                </div>
                                <div className="border-l-4 border-green-500 pl-4">
                                    <p className="font-semibold text-gray-900">4 Coincident Peak / 4CP (ERCOT)</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Transmission costs allocated based on load during <strong>4 specific peak hours per year</strong>
                                        (one per season). <strong>Huge incentive</strong> for flexible loads—curtailing just 4 hours
                                        can reduce transmission costs by 25%+.
                                    </p>
                                </div>
                                <div className="border-l-4 border-purple-500 pl-4">
                                    <p className="font-semibold text-gray-900">1CP/5CP (AEP Ohio/PJM)</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <strong>1CP</strong> for transmission (single annual peak) plus <strong>5CP</strong> for capacity
                                        allocation (5 summer peaks). PJM market overlay adds capacity costs. Flexible loads that
                                        can predict CP hours gain significant advantage.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* PSO Example */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Example: PSO Large Power & Light (LPL) Tariff
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">Schedule 242/244/246, effective 1/30/2025</p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Charge Type</th>
                                        <th className="text-right py-2 font-medium">Rate</th>
                                        <th className="text-left py-2 pl-4 font-medium">Application</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Peak Demand Charge</td>
                                        <td className="text-right font-bold text-blue-700">$7.05/kW</td>
                                        <td className="pl-4 text-xs text-gray-600">On-peak hours: 2pm-9pm Mon-Fri, June 1 - Sept 30</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Maximum Demand Charge</td>
                                        <td className="text-right">$2.47/kW</td>
                                        <td className="pl-4 text-xs text-gray-600">Non-coincident peak (any time highest 15-min avg)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Ratchet Provision</td>
                                        <td className="text-right">90%</td>
                                        <td className="pl-4 text-xs text-gray-600">Peak demand floor = 90% of highest in past 11 months</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                <p className="text-sm text-green-900">
                                    <strong>Flexibility Benefit:</strong> A 1,000 MW data center curtailing from 100% to 75% during on-peak
                                    hours saves approximately <strong>$21M/year</strong> in peak demand charges (250 MW × $7,050/MW × 12 months).
                                    The ratchet provision further rewards consistent flexible operation.
                                </p>
                            </div>

                            {/* PSO Riders */}
                            <div className="mt-4 border-t border-gray-200 pt-4">
                                <h5 className="font-semibold text-gray-800 mb-2">PSO Applicable Riders (Service Level 1 - Transmission)</h5>
                                <p className="text-xs text-gray-500 mb-3">
                                    In addition to base demand and energy charges, PSO applies several riders that significantly affect the all-in rate.
                                    Source:{' '}
                                    <a href="https://www.psoklahoma.com/lib/docs/ratesandtariffs/Oklahoma/PSOLargeCommercialandIndustrialFeb2025.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        PSO Tariff Book (Feb 2025)
                                    </a>
                                </p>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-1 font-medium">Rider</th>
                                            <th className="text-right py-1 font-medium">Rate</th>
                                            <th className="text-left py-1 pl-3 font-medium">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-1">FCA (Fuel Cost Adjustment)</td>
                                            <td className="text-right">$0.0194/kWh</td>
                                            <td className="pl-3 text-gray-500">Passthrough - no ratepayer impact analysis</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-1">SPPTC (SPP Transmission)</td>
                                            <td className="text-right">$0.18/kW</td>
                                            <td className="pl-3 text-gray-500">Demand-based</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-1">RRR (Renewable Resources)</td>
                                            <td className="text-right">$1.95/kW</td>
                                            <td className="pl-3 text-gray-500">Demand-based</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-1">DRR (Dispatchable Resource)</td>
                                            <td className="text-right">$1.73/kW</td>
                                            <td className="pl-3 text-gray-500">Demand-based</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-1">DSM (Demand-Side Mgmt)</td>
                                            <td className="text-right">$0.0065/kWh</td>
                                            <td className="pl-3 text-gray-500">High-volume opt-out available</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-1">TCR (Tax Change)</td>
                                            <td className="text-right">2.614%</td>
                                            <td className="pl-3 text-gray-500">Applied to base charges</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="mt-2 text-xs text-gray-600">
                                    <strong>All-in rate estimate:</strong> ~$43-45/MWh at published tariff rates for transmission-level service,
                                    including base charges plus applicable riders. The base energy charge ($1.71/MWh) is small compared to
                                    demand charges and riders spread over consumed energy.
                                </p>
                            </div>
                        </div>

                        {/* Flexibility Multipliers */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Flexibility Benefit by Utility</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Our model applies utility-specific flexibility benefit multipliers based on tariff structure:
                            </p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Utility/Type</th>
                                        <th className="text-right py-2 font-medium">Multiplier</th>
                                        <th className="text-left py-2 pl-4 font-medium text-xs">Rationale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">ERCOT (4CP)</td>
                                        <td className="text-right font-bold text-green-600">1.8×</td>
                                        <td className="pl-4 text-xs text-gray-600">Curtail 4 hours/year = major transmission savings</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Dominion Virginia</td>
                                        <td className="text-right font-bold text-green-600">1.6×</td>
                                        <td className="pl-4 text-xs text-gray-600">Large on-peak vs off-peak differential ($8.77 vs $0.51)</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">AEP Ohio (1CP/5CP)</td>
                                        <td className="text-right">1.5×</td>
                                        <td className="pl-4 text-xs text-gray-600">CP avoidance reduces transmission + capacity</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">PSO Oklahoma</td>
                                        <td className="text-right">1.4×</td>
                                        <td className="pl-4 text-xs text-gray-600">Peak demand charge {'>'} max demand charge</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Georgia Power</td>
                                        <td className="text-right">1.3×</td>
                                        <td className="pl-4 text-xs text-gray-600">Summer peak avoidance affects 12-month ratchet</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Duke Carolinas</td>
                                        <td className="text-right">1.2×</td>
                                        <td className="pl-4 text-xs text-gray-600">CP-based with moderate benefit from avoidance</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Generic Regulated</td>
                                        <td className="text-right text-gray-500">1.0×</td>
                                        <td className="pl-4 text-xs text-gray-600">Baseline - standard CP/NCP split</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-900">
                                <strong>Note:</strong> These tariff rates are from publicly available utility rate schedules as of early 2025.
                                Rates change through regulatory proceedings and fuel cost adjustments. Always verify current rates
                                with the specific utility for actual project planning.
                            </p>
                        </div>
                    </div>
                </Section>

                <Section
                    id="bill-composition"
                    title="Electricity Bill Composition & Large Load Impacts"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Understanding how electricity bills are composed helps clarify which components are
                            affected when large new loads like data centers connect to the grid.
                        </p>

                        {/* Bill Components */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Typical Residential Bill Components</h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium">Component</th>
                                        <th className="text-right py-2 font-medium">~Share</th>
                                        <th className="text-left py-2 pl-4 font-medium">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Fuel/Operating Costs</td>
                                        <td className="text-right">25%</td>
                                        <td className="pl-4 text-xs text-gray-600">
                                            Variable costs to run power plants (natural gas, coal). Passed through to customers
                                            at cost—utilities don't mark up fuel.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Generation Capacity</td>
                                        <td className="text-right">25%</td>
                                        <td className="pl-4 text-xs text-gray-600">
                                            Capital costs of power plants (construction, financing). Includes capacity market
                                            payments in organized markets. Solar/wind are almost entirely capacity costs.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Transmission</td>
                                        <td className="text-right">12%</td>
                                        <td className="pl-4 text-xs text-gray-600">
                                            High-voltage lines, substations that move power from generators to distribution.
                                            Regulated by FERC; allocated based on peak usage or load share.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Distribution</td>
                                        <td className="text-right">25%</td>
                                        <td className="pl-4 text-xs text-gray-600">
                                            Local poles, wires, transformers that deliver power to homes. Regulated by state PUC;
                                            typically allocated by customer class.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 font-medium">Other (Taxes, Fees)</td>
                                        <td className="text-right">13%</td>
                                        <td className="pl-4 text-xs text-gray-600">
                                            State/local taxes, energy efficiency programs, renewable portfolio standards,
                                            regulatory assessments. Mostly percentage-based.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="mt-3 text-xs text-gray-500">
                                Source: <a href="https://www.eia.gov/tools/faqs/faq.php?id=947&t=3" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    EIA data on electricity cost components
                                </a>. Percentages are representative averages; actual composition varies significantly by utility, state, and market structure.
                            </p>
                        </div>

                        {/* Impact Analysis */}
                        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                            <h4 className="font-semibold text-amber-900 mb-3">Which Components Are Affected by Large New Loads?</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-amber-800 mb-2">Directly Impacted:</p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-600 font-bold">•</span>
                                            <span><strong>Generation Capacity:</strong> New power plants, batteries, or capacity contracts needed to meet increased peak demand</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-600 font-bold">•</span>
                                            <span><strong>Transmission:</strong> New high-voltage lines and substations to deliver power to large loads</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-600 font-bold">•</span>
                                            <span><strong>Distribution:</strong> Local grid upgrades (substations, feeders) for the specific location</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-green-800 mb-2">Less Directly Affected:</p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span><strong>Fuel/Operating:</strong> Passed through at cost; more load = more fuel revenue but neutral margin per customer</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span><strong>Taxes & Fees:</strong> Percentage-based; scale proportionally with bills</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Renewable Energy Note */}
                        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                            <h4 className="font-semibold text-blue-900 mb-2">Note on Solar, Wind, and Battery Storage</h4>
                            <p className="text-sm text-blue-800">
                                Renewable energy sources (solar, wind) and battery storage have <strong>minimal fuel costs</strong>—they're
                                almost entirely <strong>generation capacity costs</strong>. This means when utilities build new solar farms or
                                battery storage to serve data center load, those costs flow into the "Generation Capacity" portion of bills,
                                not the "Fuel/Operating" portion. The cost allocation depends on whether the data center's load actually materializes
                                and whether the generation is well-utilized.
                            </p>
                        </div>
                    </div>
                </Section>

                <Section
                    id="risk-framework"
                    title="Risk Framework: Overbuilding & Stranded Assets"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            A key insight of this model: <strong>the primary risk to residential ratepayers isn't that data centers arrive—it's
                            that utilities build infrastructure for load that never materializes</strong>.
                        </p>

                        {/* The Core Thesis */}
                        <div className="border-2 border-red-200 rounded-lg p-5 bg-red-50">
                            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                The Stranded Asset Problem
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                When utilities build transmission, distribution, and generation capacity for projected data center demand
                                that never fully materializes, those capital costs still need to be recovered. Under traditional cost-of-service
                                regulation, <strong>these costs get spread across all ratepayers</strong>—including residential customers.
                            </p>
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-red-600">$1-2B</p>
                                    <p className="text-xs text-gray-600">Cost per GW of unnecessary capacity</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-red-600">0.2%</p>
                                    <p className="text-xs text-gray-600">Probability of high utility forecasts occurring (SELC study)</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-red-600">$70B+</p>
                                    <p className="text-xs text-gray-600">Potential stranded investment from "phantom" data centers</p>
                                </div>
                            </div>
                        </div>

                        {/* Evidence */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Evidence of Overbuilding Risk</h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>
                                        <strong>Georgia 2025:</strong> The Public Service Commission approved 6+ GW of new gas generation for AI-related load.
                                        Within six months, developers had delayed or withdrawn nearly half of the associated data center projects.
                                        <a href="https://www.aixenergy.io/managing-data-center-uncertainty-part-ii-phantom-data-centers-how-strategic-opacity-drives-overbuild/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">[Source]</a>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>
                                        <strong>Interconnection Queue Analysis:</strong> Only 13% of capacity that submitted interconnection requests
                                        from 2000-2019 reached commercial operations by end of 2024; 77% was withdrawn.
                                        <a href="https://emp.lbl.gov/queues" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">[LBNL]</a>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>
                                        <strong>Southeast Utility Forecasts:</strong> Analysis found utilities are planning for data center demand
                                        that has roughly 0.2% probability of actually occurring.
                                        <a href="https://www.selc.org/press-release/new-report-exposes-inflated-load-growth-projections-from-data-centers-in-the-southeast/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">[SELC]</a>
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Why Flexibility Mitigates Risk */}
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="font-semibold text-green-900 mb-3">Why Flexible Load Reduces This Risk</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Flexible data centers don't just reduce peak demand charges—they fundamentally reduce the
                                risk of overbuilding because they create a more predictable, higher-utilization load profile:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-green-800 mb-2">Downward Pressure on Rates</p>
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span><strong>Higher load factors</strong> (95% vs 80%) mean more kWh sold per MW of capacity built</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span><strong>More revenue per asset</strong> reduces the per-customer cost allocation</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span><strong>Better capacity utilization</strong> means fewer total MW needed</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-green-800 mb-2">Reduced Stranded Asset Risk</p>
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span><strong>Demand response</strong> lets grid scale with actual usage, not forecasts</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span><strong>Curtailment capability</strong> reduces peak infrastructure requirements</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span><strong>Tariff structures</strong> can include minimum take provisions protecting ratepayers</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Regulatory Responses */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Emerging Regulatory Protections</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Some states are implementing protections against stranded asset risk from large load customers:
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span><strong>Oregon POWER Act:</strong> Creates separate rate class for facilities over 20 MW with costs directly assigned and minimum payment requirements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span><strong>AEP Ohio:</strong> New interconnection terms include minimum billing and collateral provisions for data centers</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span><strong>California:</strong> Public Advocates Office advocating for regular reassessment of transmission projects when data center requests are withdrawn</span>
                                </li>
                            </ul>
                        </div>

                        {/* Model Implication */}
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h4 className="font-semibold text-indigo-900 mb-2">Implication for This Model</h4>
                            <p className="text-sm text-indigo-800">
                                Our model assumes the projected data center load <em>does</em> materialize. In practice, the risk to
                                residential ratepayers may be <strong>higher than shown</strong> if load doesn't arrive as planned,
                                or <strong>lower than shown</strong> if flexible operation requirements and proper cost allocation
                                mechanisms are in place. The "optimized" scenario assumes both full load materialization AND flexible
                                operation—representing the best-case outcome for ratepayers.
                            </p>
                        </div>
                    </div>
                </Section>

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
