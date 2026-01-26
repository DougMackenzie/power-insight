'use client';

import { useState } from 'react';
import Link from 'next/link';

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
                <div className="px-6 py-5 bg-white border-t border-gray-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function LearnMorePage() {
    const [expandedSection, setExpandedSection] = useState<string | null>('bill-basics');

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-8 border border-slate-200">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                    Learn More
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl">
                    This guide explains the basics of electricity costs and how large industrial loads like data centers
                    can affect your bill. No technical background required—just the essentials for informed community members.
                </p>
                <p className="text-sm text-slate-500 mt-4">
                    Looking for detailed methodology and data sources? See our{' '}
                    <Link href="/methodology" className="text-amber-600 hover:underline font-medium">
                        full methodology documentation
                    </Link>.
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                <Section
                    id="bill-basics"
                    title="Understanding Your Electric Bill"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Your monthly electric bill isn't just paying for the electricity you use—it covers an entire
                            system of power plants, transmission lines, and local infrastructure. Here's where your money goes:
                        </p>

                        {/* Stacked Bar Chart */}
                        <div>
                            <div className="flex rounded-xl overflow-hidden h-12 shadow-inner">
                                <div className="bg-blue-400 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '25%' }}>
                                    <span className="hidden sm:inline">Fuel</span>
                                    <span className="ml-1 opacity-75">25%</span>
                                </div>
                                <div className="bg-blue-600 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '25%' }}>
                                    <span className="hidden sm:inline">Capacity</span>
                                    <span className="ml-1 opacity-75">25%</span>
                                </div>
                                <div className="bg-amber-500 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '12%' }}>
                                    <span className="opacity-75">12%</span>
                                </div>
                                <div className="bg-orange-500 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '25%' }}>
                                    <span className="hidden sm:inline">Dist</span>
                                    <span className="ml-1 opacity-75">25%</span>
                                </div>
                                <div className="bg-gray-400 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '13%' }}>
                                    <span className="opacity-75">13%</span>
                                </div>
                            </div>
                        </div>

                        {/* Components Explained */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded bg-blue-400 flex-shrink-0 mt-1"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Fuel & Operating Costs (~25%)</p>
                                        <p className="text-sm">The cost of natural gas, coal, or other fuels to run power plants.
                                            Utilities pass these through at cost—they don't mark up fuel.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded bg-blue-600 flex-shrink-0 mt-1"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Generation Capacity (~25%)</p>
                                        <p className="text-sm">The cost of building and maintaining power plants. Solar and wind
                                            are almost entirely capacity costs since they have no fuel expenses.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded bg-amber-500 flex-shrink-0 mt-1"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Transmission (~12%)</p>
                                        <p className="text-sm">High-voltage power lines and substations that move electricity
                                            from power plants to your region. Regulated by FERC.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded bg-orange-500 flex-shrink-0 mt-1"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Distribution (~25%)</p>
                                        <p className="text-sm">Local poles, wires, and transformers that deliver power to your home.
                                            Regulated by your state's Public Utility Commission.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded bg-gray-400 flex-shrink-0 mt-1"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Other (~13%)</p>
                                        <p className="text-sm">Taxes, fees, energy efficiency programs, and renewable energy mandates.
                                            These vary significantly by state.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                            <span className="font-semibold text-amber-800">Model Assumption:</span>
                            <span className="text-gray-600"> These percentages are representative estimates. Actual composition varies
                                by utility, state, and market structure. EIA reports delivery costs have risen from 31% to 46%
                                of total costs over the past decade.</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Reference:{' '}
                            <a href="https://www.eia.gov/todayinenergy/detail.php?id=32812" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                EIA - Electricity prices reflect rising delivery costs (2017)
                            </a>
                        </p>
                    </div>
                </Section>

                <Section
                    id="data-center-impact"
                    title="How Data Centers Affect Your Bill"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            When a large data center connects to the grid, it doesn't affect all parts of your bill equally.
                            Understanding which components are impacted helps you evaluate proposals in your community.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border-2 border-amber-200 rounded-lg p-4 bg-amber-50">
                                <h4 className="font-semibold text-amber-900 mb-3">Components Most Affected</h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    These infrastructure investments are driven by <strong>peak demand</strong>—the maximum amount
                                    of power needed at any moment:
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-blue-600 flex-shrink-0 mt-1"></div>
                                        <span><strong>Generation Capacity</strong> — New power plants built to meet peak demand</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-amber-500 flex-shrink-0 mt-1"></div>
                                        <span><strong>Transmission</strong> — New high-voltage lines and substations</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-orange-500 flex-shrink-0 mt-1"></div>
                                        <span><strong>Distribution</strong> — Local grid upgrades for the new load</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                                <h4 className="font-semibold text-green-900 mb-3">Components Less Affected</h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    These costs scale more directly with <strong>energy consumption</strong> rather than peak demand:
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-blue-400 flex-shrink-0 mt-1"></div>
                                        <span><strong>Fuel Costs</strong> — More load means more fuel revenue; roughly neutral to ratepayers</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-gray-400 flex-shrink-0 mt-1"></div>
                                        <span><strong>Taxes & Fees</strong> — Usually percentage-based, scale with total usage</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">Why Renewables Are Different</h4>
                            <p className="text-sm text-gray-700">
                                Solar, wind, and battery projects have minimal fuel costs—they're almost entirely <strong>capacity costs</strong>.
                                When new renewable generation is built to serve data centers, it adds to the "Generation Capacity"
                                portion of everyone's bill, not the fuel costs. This is why how infrastructure is allocated matters.
                            </p>
                        </div>

                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-red-900 mb-2">Capacity Markets Can Amplify Impact</h4>
                            <p className="text-sm text-gray-700">
                                In regions with <strong>capacity markets</strong> (PJM, NYISO, MISO), large new loads can trigger
                                price spikes that affect <em>all</em> ratepayers—not just through infrastructure costs, but through
                                higher capacity prices paid by everyone. See the "Capacity Markets" section below for details.
                            </p>
                        </div>
                    </div>
                </Section>

                <Section
                    id="peak-demand"
                    title="What is Peak Demand and Why Does It Matter?"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            <strong>Peak demand</strong> is the maximum amount of electricity being used at any single moment.
                            Utilities must build enough infrastructure to handle peak demand—even if that peak only happens
                            a few hours per year.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Think of it like a highway</h4>
                                <p className="text-sm mb-3">
                                    A highway must have enough lanes to handle rush hour traffic, even though most of the day it's
                                    not crowded. Similarly, the electric grid must be built for the hottest summer afternoon when
                                    everyone runs their AC—even though demand is much lower at 3 AM.
                                </p>
                                <p className="text-sm">
                                    The cost of those "extra lanes" gets spread across all customers, whether they use them or not.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Key Numbers</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <span>A typical utility might see peak demand only <strong>100-200 hours per year</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <span>Infrastructure built for peak may sit <strong>underutilized 90%+ of the time</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <span>Each GW of generation capacity costs <strong>$1-2 billion</strong> to build</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-900 mb-2">Why This Matters for Data Centers</h4>
                            <p className="text-sm text-gray-700">
                                A 500 MW data center that runs 24/7 at full power adds 500 MW to peak demand. But a "flexible"
                                data center that can reduce power during peak hours might only add 300 MW to peak—requiring
                                <strong> 40% less infrastructure investment</strong> while using nearly the same amount of energy over the year.
                            </p>
                        </div>
                    </div>
                </Section>

                <Section
                    id="flexible-load"
                    title="What is Flexible Load?"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            <strong>Flexible load</strong> refers to electricity customers who can adjust when and how much
                            power they use based on grid conditions. This flexibility has significant value for the grid
                            and can reduce costs for everyone.
                        </p>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Type</th>
                                        <th className="text-left py-3 px-4 font-medium">Description</th>
                                        <th className="text-left py-3 px-4 font-medium">Grid Impact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-gray-200">
                                        <td className="py-3 px-4 font-medium text-red-700">Firm Load</td>
                                        <td className="py-3 px-4">Always on, no flexibility—must be served regardless of grid conditions</td>
                                        <td className="py-3 px-4">Highest infrastructure requirement</td>
                                    </tr>
                                    <tr className="border-t border-gray-200 bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-amber-700">Curtailable Load</td>
                                        <td className="py-3 px-4">Can reduce or shut off during grid emergencies</td>
                                        <td className="py-3 px-4">Moderate infrastructure savings</td>
                                    </tr>
                                    <tr className="border-t border-gray-200">
                                        <td className="py-3 px-4 font-medium text-green-700">Dispatchable Load</td>
                                        <td className="py-3 px-4">Can adjust power up/down based on price signals or grid needs</td>
                                        <td className="py-3 px-4">Significant infrastructure savings</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">How Data Centers Can Be Flexible</h4>
                                <ul className="space-y-2 text-sm">
                                    <li>• Shift computing workloads to off-peak hours</li>
                                    <li>• Use on-site batteries to reduce grid demand during peaks</li>
                                    <li>• Run backup generators during grid emergencies</li>
                                    <li>• Adjust cooling systems based on grid signals</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <h4 className="font-semibold text-green-900 mb-2">Benefits to Ratepayers</h4>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li>✓ Less infrastructure needed to serve the same energy</li>
                                    <li>✓ Better utilization of existing grid assets</li>
                                    <li>✓ Reduced risk of overbuilding</li>
                                    <li>✓ Can help integrate more renewable energy</li>
                                </ul>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            Reference:{' '}
                            <a href="https://www.epri.com/research/products/3002028787" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                EPRI - Data Center Flexibility for Grid Services (2024)
                            </a>
                        </p>
                    </div>
                </Section>

                <Section
                    id="utility-rates"
                    title="How Utility Rates Are Set"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            Understanding how utility rates are set helps you see why large industrial customers
                            can affect residential bills—and how proper rate design can protect homeowners.
                        </p>

                        <div className="space-y-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">The Rate Case Process</h4>
                                <ol className="space-y-2 text-sm list-decimal list-inside">
                                    <li>Utilities calculate their total costs (infrastructure, fuel, operations)</li>
                                    <li>They project how much electricity each customer class will use</li>
                                    <li>Costs are allocated across customer classes (residential, commercial, industrial)</li>
                                    <li>The Public Utility Commission (PUC) reviews and approves or modifies rates</li>
                                    <li>Rates typically stay fixed for 1-3 years until the next rate case</li>
                                </ol>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                    <h4 className="font-semibold text-blue-900 mb-2">Cost Allocation Methods</h4>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li><strong>Demand-based:</strong> Costs allocated based on peak demand contribution</li>
                                        <li><strong>Energy-based:</strong> Costs allocated based on total kWh consumed</li>
                                        <li><strong>Customer-based:</strong> Fixed costs spread per customer</li>
                                    </ul>
                                </div>
                                <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                                    <h4 className="font-semibold text-amber-900 mb-2">Why It Matters</h4>
                                    <p className="text-sm text-gray-700">
                                        If a large data center gets a special rate that doesn't fully cover its share of
                                        infrastructure costs, other customers (including residential) may pay more. Proper
                                        rate design ensures each customer class pays its fair share.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">Your State's Public Utility Commission</h4>
                            <p className="text-sm mb-2">
                                Every state has a regulatory body (called PUC, PSC, or similar) that oversees utility rates.
                                These are public proceedings where community members can:
                            </p>
                            <ul className="space-y-1 text-sm">
                                <li>• Review proposed rate changes and new customer agreements</li>
                                <li>• Submit comments during public comment periods</li>
                                <li>• Attend public hearings (often available virtually)</li>
                                <li>• Request information about how costs are allocated</li>
                            </ul>
                        </div>
                    </div>
                </Section>

                <Section
                    id="capacity-markets"
                    title="Capacity Markets: The 'PJM Effect'"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            In some regions, utilities participate in <strong>capacity markets</strong>—auctions where power plants
                            bid to be available when needed. These markets can amplify the impact of large new loads like data centers.
                        </p>

                        <div className="border-2 border-red-200 rounded-lg p-5 bg-red-50">
                            <h4 className="font-semibold text-red-900 mb-3">What is the "PJM Effect"?</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                When massive new loads (like data centers) connect to the grid, they consume available <strong>reserve margin</strong>—the
                                cushion of extra generation capacity that ensures reliability. As reserve margins shrink, capacity prices
                                spike non-linearly in a "hockey stick" pattern.
                            </p>
                            <div className="bg-white rounded-lg p-4 mt-3">
                                <p className="text-sm font-medium text-gray-900 mb-2">The key insight:</p>
                                <p className="text-sm text-gray-700">
                                    When a data center causes capacity prices to rise, it doesn't just pay higher prices for its own load—<strong>all
                                    existing customers</strong> also pay the higher price on their existing load. This "socialized" cost is why
                                    data center growth in PJM has drawn regulatory attention.
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Regions with Capacity Markets</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span><strong>PJM</strong> — Mid-Atlantic, Ohio Valley (13 states)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span><strong>NYISO</strong> — New York State</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span><strong>ISO-NE</strong> — New England</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span><strong>MISO</strong> — Midwest (15 states)</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Regions Without Capacity Markets</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span><strong>ERCOT</strong> — Texas (energy-only market)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span><strong>SPP</strong> — Plains states (energy-only)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        <span><strong>Vertically Integrated</strong> — Traditional utilities</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">The 3-Year Auction Lag</h4>
                            <p className="text-sm text-gray-700">
                                Capacity auctions clear about <strong>3 years before delivery</strong>. This means when a data center
                                connects today, its impact on capacity prices won't hit ratepayer bills for roughly 3 years.
                                Our calculator models this lag—infrastructure costs hit immediately, but socialized capacity costs
                                are delayed.
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-900 mb-2">How Flexible Load Helps</h4>
                            <p className="text-sm text-gray-700">
                                Data centers that can <strong>curtail during peak hours</strong> add less to system peak, which means
                                they consume less reserve margin and trigger smaller capacity price increases. A 25% curtailable load
                                can significantly reduce the socialized cost impact on existing ratepayers.
                            </p>
                        </div>

                        <p className="text-xs text-gray-500">
                            Reference:{' '}
                            <a href="https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Grid Strategies - National Load Growth Report (Dec 2024)
                            </a>
                        </p>
                    </div>
                </Section>

                <Section
                    id="questions-to-ask"
                    title="Questions to Ask About Data Center Proposals"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            When a data center is proposed in your community, here are key questions to help you
                            understand the potential impact on electricity costs:
                        </p>

                        <div className="space-y-4">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h4 className="font-semibold text-gray-900">About the Load Profile</h4>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>• What is the planned capacity (in MW)?</li>
                                    <li>• Will the load be firm or flexible?</li>
                                    <li>• Can operations be curtailed during grid emergencies?</li>
                                    <li>• Is on-site generation or storage included?</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-green-500 pl-4">
                                <h4 className="font-semibold text-gray-900">About Cost Allocation</h4>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>• What rate schedule will the data center be on?</li>
                                    <li>• Will they pay standard demand charges or a negotiated rate?</li>
                                    <li>• Are there minimum purchase requirements to protect against stranded assets?</li>
                                    <li>• Who pays for any grid upgrades needed to serve the facility?</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-amber-500 pl-4">
                                <h4 className="font-semibold text-gray-900">About Infrastructure</h4>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>• What new transmission or distribution infrastructure is required?</li>
                                    <li>• How will those infrastructure costs be recovered?</li>
                                    <li>• What happens if the data center closes or reduces load?</li>
                                    <li>• Is the proposal part of the utility's integrated resource plan?</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-purple-500 pl-4">
                                <h4 className="font-semibold text-gray-900">About Regulatory Process</h4>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>• When is the public comment period?</li>
                                    <li>• Will there be public hearings?</li>
                                    <li>• Has the PUC approved similar arrangements before?</li>
                                    <li>• Are there consumer advocates reviewing the proposal?</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-red-500 pl-4">
                                <h4 className="font-semibold text-gray-900">About Capacity Markets (PJM, NYISO, MISO regions)</h4>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>• What is the current reserve margin in this utility's region?</li>
                                    <li>• How will this load affect capacity auction prices?</li>
                                    <li>• Will the data center participate in demand response programs?</li>
                                    <li>• Has the impact on existing ratepayers been analyzed?</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-2">Where to Find Information</h4>
                            <ul className="space-y-2 text-sm text-slate-700">
                                <li>• <strong>State PUC website:</strong> Docket filings, rate cases, and public notices</li>
                                <li>• <strong>Utility annual reports:</strong> Infrastructure plans and customer statistics</li>
                                <li>• <strong>Local news coverage:</strong> Often covers major economic development proposals</li>
                                <li>• <strong>Consumer advocate offices:</strong> Many states have offices that represent ratepayers</li>
                            </ul>
                        </div>
                    </div>
                </Section>

                <Section
                    id="glossary"
                    title="Glossary of Key Terms"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-4 text-gray-600">
                        <p className="text-sm">
                            Common terms you'll encounter when reading about electricity costs and data centers:
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Megawatt (MW)</p>
                                    <p className="text-sm">A unit of power equal to 1 million watts. A large data center might use 100-500 MW.
                                        For context, 1 MW can power about 750-1,000 homes.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Gigawatt (GW)</p>
                                    <p className="text-sm">1,000 megawatts. Roughly the output of one large nuclear power plant or
                                        enough to power a city of 750,000-1,000,000 homes.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Load Factor</p>
                                    <p className="text-sm">The ratio of average demand to peak demand. A 90% load factor means the facility
                                        uses 90% of its maximum capacity on average. Higher is better for grid efficiency.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Demand Charge</p>
                                    <p className="text-sm">A fee based on the highest power demand (in kW or MW) during a billing period,
                                        not total energy used. Pays for infrastructure capacity.</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Coincident Peak (CP)</p>
                                    <p className="text-sm">Your demand at the exact time the entire grid hits its peak. Important because
                                        this is when infrastructure is most stressed.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Transmission</p>
                                    <p className="text-sm">High-voltage power lines (69 kV and above) that move electricity long distances
                                        from power plants to local distribution systems.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Distribution</p>
                                    <p className="text-sm">Lower-voltage lines that deliver power from substations to homes and businesses.
                                        The poles and wires you see in your neighborhood.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Rate Base</p>
                                    <p className="text-sm">The total value of a utility's assets (plants, lines, etc.) on which they're
                                        allowed to earn a return. Paid for by all customers over time.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Capacity Market</p>
                                    <p className="text-sm">An auction where power plants bid to be available when needed. Prices reflect
                                        the cost of keeping enough generation ready to meet peak demand. PJM, NYISO, and MISO operate capacity markets.</p>
                                </div>
                                <div className="border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">Reserve Margin</p>
                                    <p className="text-sm">The "cushion" of extra generation capacity above peak demand. Typically 15-20%.
                                        When large loads consume reserve margin, capacity prices can spike dramatically.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 text-white">
                <h3 className="text-xl font-bold mb-3">Ready to Calculate Impact?</h3>
                <p className="text-slate-300 mb-6">
                    Use our calculator to see how a specific data center scenario might affect electricity costs in your community.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/calculator"
                        className="px-6 py-3 bg-amber-400 text-slate-900 font-semibold rounded-lg hover:bg-amber-300 transition-colors"
                    >
                        Open Calculator →
                    </Link>
                    <Link
                        href="/methodology"
                        className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors border border-slate-500"
                    >
                        View Full Methodology
                    </Link>
                </div>
            </div>
        </div>
    );
}
