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
                <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-[#a69340]/10 rounded-full text-[#a69340] text-sm font-medium border border-[#a69340]/20">
                        Community Guide
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                    Understanding Data Centers & Your Electric Bill
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl">
                    Data centers are coming to communities across America. Research shows that with the right policies,
                    this growth can mean <strong className="text-slate-800">lower bills</strong> and a more reliable grid.
                    This guide gives you the essentials—no technical background required.
                </p>
                <p className="text-sm text-slate-500 mt-4">
                    Want to explore interactively?{' '}
                    <Link href="/story" className="text-[#a69340] hover:underline font-medium">
                        Try the AI Energy Explorer
                    </Link>
                    {' '}or see our{' '}
                    <Link href="/methodology" className="text-[#a69340] hover:underline font-medium">
                        full methodology
                    </Link>.
                </p>
            </div>

            {/* Key Stats Banner */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-slate-800">4% → 9%</div>
                        <div className="text-sm text-slate-600 mt-1">Share of U.S. electricity from data centers by 2030</div>
                    </div>
                    <div className="text-center md:border-x md:border-slate-200">
                        <div className="text-3xl font-bold text-slate-800">50-65 GW</div>
                        <div className="text-sm text-slate-600 mt-1">New capacity expected (equal to 50-65 nuclear plants)</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600">1-5%</div>
                        <div className="text-sm text-slate-600 mt-1">Potential bill reduction with responsible development</div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center border-t border-slate-100 pt-4">
                    Sources: LBNL, DOE, Grid Strategies, EPRI, E3 Ratepayer Study (2025)
                </p>
            </div>

            {/* What Research Shows - New Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl p-8 border border-emerald-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                    What Research Shows
                </h2>
                <p className="text-slate-600 text-center max-w-3xl mx-auto mb-6">
                    Independent studies show that when data centers pay fair rates, they can actually help
                    <strong className="text-slate-800"> lower bills for everyone</strong> by bringing new revenue to the grid.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm text-slate-700">
                            <a href="https://www.ethree.com/ratepayer-study/" target="_blank" rel="noopener noreferrer" className="text-[#a69340] hover:underline font-medium">E3 Study (2025)</a>
                            {' '}— A single data center can bring millions in extra revenue, lowering nearby bills by 1-2%
                        </p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm text-slate-700">
                            <a href="https://www.pbs.org/newshour/show/how-data-center-power-demand-could-help-lower-electricity-prices" target="_blank" rel="noopener noreferrer" className="text-[#a69340] hover:underline font-medium">LBNL / Brattle (2025)</a>
                            {' '}— States with growing demand actually saw rates go down
                        </p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm text-slate-700">
                            <a href="https://www.utilitydive.com/news/grid-operators-ratepayers-shouldnt-fear-flexible-data-centers-gridcare/808032/" target="_blank" rel="noopener noreferrer" className="text-[#a69340] hover:underline font-medium">GridCARE (2025)</a>
                            {' '}— Flexible data centers could cut costs by 5% for all customers
                        </p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm text-slate-700">
                            <a href="https://mitsloan.mit.edu/ideas-made-to-matter/flexible-data-centers-can-reduce-costs-if-not-emissions" target="_blank" rel="noopener noreferrer" className="text-[#a69340] hover:underline font-medium">MIT Sloan (2025)</a>
                            {' '}— Shifting work to off-peak times saves money for the whole grid
                        </p>
                    </div>
                </div>
            </div>

            {/* Common Questions Section */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    What Communities Are Asking
                </h2>
                <p className="text-slate-300 text-center mb-6">
                    These questions deserve honest, evidence-based answers.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Question 1 */}
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#a69340]/20 border border-[#a69340]/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#a69340]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">&quot;Will my electric bill go up?&quot;</h3>
                                <p className="text-sm text-[#a69340] mb-2">With the right policy, data centers apply downward pressure on rates.</p>
                                <p className="text-xs text-slate-300">
                                    Large customers bring new revenue that helps cover shared infrastructure costs.
                                    The E3 study found data centers can lower nearby bills by 1-2%.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Question 2 */}
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#a69340]/20 border border-[#a69340]/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#a69340]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">&quot;Who pays for new infrastructure?&quot;</h3>
                                <p className="text-sm text-[#a69340] mb-2">Industrial tariffs ensure data centers pay their full cost of service.</p>
                                <p className="text-xs text-slate-300">
                                    Utilities are creating dedicated rate classes with demand charges that recover
                                    transmission and distribution costs directly from large loads.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Question 3 */}
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#a69340]/20 border border-[#a69340]/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#a69340]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">&quot;What if the data center leaves?&quot;</h3>
                                <p className="text-sm text-[#a69340] mb-2">Tariff structures include minimum contract terms for full cost recovery.</p>
                                <p className="text-xs text-slate-300">
                                    Policies like AEP Ohio&apos;s 12-year minimum demand requirements and exit fees
                                    protect ratepayers from stranded asset risk.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Question 4 */}
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#a69340]/20 border border-[#a69340]/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-[#a69340]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">&quot;Will I have power outages?&quot;</h3>
                                <p className="text-sm text-[#a69340] mb-2">Modern data centers actually help stabilize the grid during emergencies.</p>
                                <p className="text-xs text-slate-300">
                                    Data centers can reduce operations and activate on-site generators during peak demand,
                                    helping prevent brownouts. Many include battery storage for grid backup.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Dive Sections Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Deep Dive Topics</h2>
                <p className="text-slate-600">Click any topic below to learn more about how electricity costs work.</p>
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
                                <div className="bg-[#a69340] flex items-center justify-center text-white text-xs font-semibold" style={{ width: '12%' }}>
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
                                    <div className="w-4 h-4 rounded bg-[#a69340] flex-shrink-0 mt-1"></div>
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

                        <div className="p-3 bg-[#a69340]/10 border border-[#a69340]/30 rounded-lg text-sm">
                            <span className="font-semibold text-[#857628]">Model Assumption:</span>
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
                            When a large data center connects to the grid, it brings both costs and revenue.
                            Understanding how these balance out helps you evaluate proposals in your community.
                        </p>

                        {/* Key insight box */}
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <h4 className="font-semibold text-emerald-800 mb-2">The Revenue Side of the Equation</h4>
                            <p className="text-sm text-gray-700">
                                Data centers pay utility rates just like everyone else—but on a massive scale. A single 100 MW
                                data center can bring <strong>$50-100+ million per year</strong> in new revenue to the utility.
                                This revenue helps pay for shared infrastructure, which can <strong>lower costs for existing customers</strong>.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border-2 border-[#a69340]/30 rounded-lg p-4 bg-[#a69340]/10">
                                <h4 className="font-semibold text-[#6b5d20] mb-3">Infrastructure Investments Needed</h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    These are driven by <strong>peak demand</strong>—but proper tariffs ensure data centers pay their share:
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-blue-600 flex-shrink-0 mt-1"></div>
                                        <span><strong>Generation Capacity</strong> — New power plants to meet demand</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-[#a69340] flex-shrink-0 mt-1"></div>
                                        <span><strong>Transmission</strong> — High-voltage lines and substations</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-3 h-3 rounded bg-orange-500 flex-shrink-0 mt-1"></div>
                                        <span><strong>Distribution</strong> — Local grid upgrades</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                                <h4 className="font-semibold text-green-900 mb-3">How Good Policy Protects You</h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    Utilities are creating special tariffs that make data centers pay for what they use:
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 font-bold">✓</span>
                                        <span><strong>Demand charges</strong> based on peak usage</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 font-bold">✓</span>
                                        <span><strong>Minimum commitments</strong> to prevent stranded costs</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 font-bold">✓</span>
                                        <span><strong>Exit fees</strong> if they leave early</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">Flexible Data Centers Provide Extra Benefits</h4>
                            <p className="text-sm text-gray-700">
                                Data centers that can reduce power during peak hours require less infrastructure while providing
                                the same revenue. They can also help stabilize the grid during emergencies by activating backup
                                generators or reducing load—providing value that benefits all customers.
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
                                        <td className="py-3 px-4 font-medium text-[#a69340]">Curtailable Load</td>
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
                                <div className="border border-[#a69340]/30 rounded-lg p-4 bg-[#a69340]/10">
                                    <h4 className="font-semibold text-[#6b5d20] mb-2">Why It Matters</h4>
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
                    title="Capacity Markets and Cost Spillovers"
                    expandedSection={expandedSection}
                    toggleSection={toggleSection}
                >
                    <div className="space-y-6 text-gray-600">
                        <p>
                            In some regions, utilities participate in <strong>capacity markets</strong>—auctions where power plants
                            bid to be available when needed. These markets can amplify the impact of large new loads like data centers.
                        </p>

                        <div className="border border-[#a69340]/30 rounded-lg p-5 bg-[#a69340]/10">
                            <h4 className="font-semibold text-[#6b5d20] mb-3">How Capacity Cost Spillovers Work</h4>
                            <p className="text-sm text-gray-700 mb-3">
                                When massive new loads (like data centers) connect to the grid, they consume available <strong>reserve margin</strong>—the
                                cushion of extra generation capacity that ensures reliability. As reserve margins shrink, capacity prices
                                can spike non-linearly.
                            </p>
                            <div className="bg-white rounded-lg p-4 mt-3">
                                <p className="text-sm font-medium text-gray-900 mb-2">Why this matters:</p>
                                <p className="text-sm text-gray-700">
                                    When a data center causes capacity prices to rise, it doesn't just pay higher prices for its own load—<strong>all
                                    existing customers</strong> also pay the higher price on their existing load. This "spillover" cost is why
                                    data center growth in regions like PJM has drawn regulatory attention.
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
                            <h4 className="font-semibold text-blue-900 mb-2">Capacity Costs Apply Quickly</h4>
                            <p className="text-sm text-gray-700">
                                While capacity auctions historically cleared 3 years ahead, recent PJM schedule changes have compressed
                                this timeline significantly. The 2025/26 auction cleared just 11 months ahead, and data center load growth
                                is already reflected in current elevated capacity prices. Our calculator models both infrastructure costs
                                and capacity costs applying when data centers connect, since the market has already priced in current demand.
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

                            <div className="border-l-4 border-[#a69340] pl-4">
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
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 text-white">
                    <h3 className="text-xl font-bold mb-3">Ready to Calculate Impact?</h3>
                    <p className="text-slate-300 mb-6">
                        Enter your utility's numbers to see projections specific to your community.
                    </p>
                    <Link
                        href="/calculator"
                        className="inline-block px-6 py-3 bg-[#a69340] text-slate-900 font-semibold rounded-lg hover:bg-[#b8a54d] transition-colors"
                    >
                        Open Calculator →
                    </Link>
                </div>
                <div className="bg-white rounded-2xl p-8 border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Explore Interactively</h3>
                    <p className="text-slate-600 mb-6">
                        See the scale of AI data centers from a single GPU chip to the national grid.
                    </p>
                    <Link
                        href="/story"
                        className="inline-block px-6 py-3 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        AI Energy Explorer →
                    </Link>
                </div>
            </div>

            {/* Resources Footer */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-1">Want to share this information?</h4>
                        <p className="text-sm text-slate-600">Download our printable community guide to share at meetings.</p>
                    </div>
                    <Link
                        href="/share/community-guide"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Community Guide
                    </Link>
                </div>
            </div>
        </div>
    );
}
