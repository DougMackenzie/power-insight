'use client';

import { useState } from 'react';
import {
    INFRASTRUCTURE_COSTS,
    TIME_PARAMS,
    WORKLOAD_TYPES,
    DEFAULT_UTILITY,
    DEFAULT_DATA_CENTER,
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

    const DC_RATE_STRUCTURE = {
        demandChargePerMWMonth: 9050,
        energyMarginPerMWh: 4.88,
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
                                <span className="font-semibold text-gray-900">2. Demand Charge Revenue (Peak Billing Consistency)</span>
                                <p className="mt-1">
                                    Large customers pay demand charges based on their highest usage during billing periods.
                                    Rate: ${DC_RATE_STRUCTURE.demandChargePerMWMonth.toLocaleString()}/MW-month.
                                </p>
                                <div className="mt-2 pl-4 border-l-2 border-amber-300">
                                    <p><strong>Firm data center behavior:</strong> Hits 100% of interconnected capacity only 1-2 times per year
                                    (typically during extreme summer or winter peaks). Other months may peak at 85-95% due to workload variation.</p>
                                    <p className="mt-2"><strong>Flexible data center behavior:</strong> Can install 33% more IT capacity (because it can
                                    curtail during grid peaks). This higher installed capacity means they hit their interconnect limit more
                                    consistently—potentially every month during shoulder seasons—generating higher average demand charges.</p>
                                    <p className="text-green-700 font-medium mt-1">
                                        More consistent peak billing = more predictable demand charge revenue for the utility
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
                                        <td className="py-2">Demand charge rate</td>
                                        <td className="text-right font-medium">$9,050/MW-mo</td>
                                        <td className="pl-4 text-xs">
                                            <a href="https://www.psoklahoma.com/company/about/rates/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                PSO Rate Schedules - Large Power & Light (LPL) Tariff
                                            </a>
                                            <span className="block text-gray-400"><span className="px-1 bg-amber-100 text-amber-800 rounded">Representative value</span> from PSO large customer tariff</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2">Energy margin (utility spread)</td>
                                        <td className="text-right font-medium">$4.88/MWh</td>
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
                                        <td className="text-right">× 0.85</td>
                                        <td className="pl-4 text-xs text-gray-500">
                                            Model assumption: large loads face prices more directly
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
                            <p className="mt-3 text-sm text-gray-600">
                                <strong>Allocation Method:</strong> ERCOT operates an energy-only market with no capacity payments.
                                Large loads face wholesale price signals more directly through{' '}
                                <a href="https://www.puc.texas.gov/industry/electric/business/retailmkt.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    retail competition
                                </a>. Our model applies
                                an 0.85× multiplier to residential allocation since infrastructure costs are more directly borne by
                                the loads causing them.
                            </p>
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
