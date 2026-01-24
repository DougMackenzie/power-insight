'use client';

import Link from 'next/link';
import { useCalculator } from '@/hooks/useCalculator';
import { formatCurrency, formatMW } from '@/lib/constants';
import CarbonFooter from '@/components/CarbonFooter';

export default function HomePage() {
  const { summary, utility, dataCenter, projectionYears } = useCalculator();

  const baselineFinalBill = summary.finalYearBills.baseline;
  const firmLoadDiff = summary.finalYearBills.unoptimized - baselineFinalBill;
  const dispatchableDiff = summary.finalYearBills.dispatchable - baselineFinalBill;

  return (
    <div className="bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-4xl animate-fade-in">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              What Does a Data Center Mean for{' '}
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Your Electric Bill?
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              A new data center has been proposed in your community. As a homeowner or community
              leader, you deserve to understand how this could affect the electricity costs for you
              and your neighbors. This tool shows you the real numbers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/calculator"
                className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Calculate My Impact →
              </Link>
              <Link
                href="/methodology"
                className="px-8 py-4 bg-blue-600/80 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-blue-500 transition-all duration-200 border-2 border-white/20 hover:border-white/40"
              >
                See Our Data Sources
              </Link>
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-12 md:h-20 fill-white">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Data Center Growth Context */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex-1">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                The Data Center Boom Is Real
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Data centers currently represent approximately <strong className="text-white">50 GW</strong> of
                U.S. electricity demand. Projections suggest <strong className="text-white">40-80 GW of new capacity</strong> by
                2030—though supply constraints (interconnection queues, equipment backlogs, permitting) will likely
                limit actual growth. For context, <strong className="text-white">1 GW is roughly the output of a nuclear power plant</strong>.
              </p>
              <p className="text-slate-300 leading-relaxed">
                This means data centers could grow from <strong className="text-white">~4% to 6-9%</strong> of
                total U.S. electricity consumption within the next decade. Every major utility is planning for this growth.
              </p>
            </div>
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                  <p className="text-3xl md:text-4xl font-bold text-blue-400">~50 GW</p>
                  <p className="text-xs text-slate-400 mt-1">current DC<br/>capacity (2024)</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                  <p className="text-3xl md:text-4xl font-bold text-amber-400">40-80 GW</p>
                  <p className="text-xs text-slate-400 mt-1">new capacity<br/>by 2030</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                  <p className="text-3xl md:text-4xl font-bold text-green-400">~4%</p>
                  <p className="text-xs text-slate-400 mt-1">share of US<br/>electricity today</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                  <p className="text-3xl md:text-4xl font-bold text-purple-400">6-9%</p>
                  <p className="text-xs text-slate-400 mt-1">projected share<br/>by 2030</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-6 border-t border-slate-700 pt-4">
            Sources: <a href="https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white underline">LBNL 2024 Report</a>,
            <a href="https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white underline ml-1">U.S. DOE</a>,
            <a href="https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white underline ml-1">Grid Strategies</a>.
            Range reflects supply constraints per <a href="https://www.goldmansachs.com/insights/articles/ai-to-drive-165-increase-in-data-center-power-demand-by-2030" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white underline ml-1">Goldman Sachs</a>.
          </p>
        </div>
      </section>

      {/* Bottom Line Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-slide-up">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Bottom Line for Your Household
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Based on a {formatMW(dataCenter.capacityMW)} data center in a utility territory that
              serves {utility.residentialCustomers.toLocaleString()} residential customers, here's
              what your monthly bill could look like in {projectionYears} years:
            </p>
          </div>

          {/* Bill Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {/* Baseline */}
            <div className="p-6 bg-gray-100 rounded-xl border-2 border-gray-300 text-center transform transition-all duration-200 hover:scale-105">
              <p className="text-sm font-medium text-gray-500 mb-2">Without Data Center</p>
              <p className="text-4xl font-bold text-gray-700">
                ${baselineFinalBill.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">in {projectionYears} years</p>
              <p className="text-xs text-gray-400 mt-2">Normal rate increases</p>
            </div>

            {/* Typical Data Center */}
            <div className="p-6 bg-red-50 rounded-xl border-2 border-red-200 text-center transform transition-all duration-200 hover:scale-105">
              <p className="text-sm font-medium text-red-700 mb-2">With Typical Data Center</p>
              <p className="text-4xl font-bold text-red-600">
                ${summary.finalYearBills.unoptimized.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">in {projectionYears} years</p>
              <p
                className={`text-sm font-semibold mt-2 ${firmLoadDiff >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
              >
                {firmLoadDiff >= 0 ? '+' : ''}
                {firmLoadDiff.toFixed(2)}/mo vs baseline
              </p>
            </div>

            {/* Optimized Data Center */}
            <div className="p-6 bg-green-50 rounded-xl border-2 border-green-300 text-center ring-4 ring-green-200 ring-offset-2 transform transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-center gap-1 mb-2">
                <p className="text-sm font-medium text-green-700">With Optimized Data Center</p>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                  BEST
                </span>
              </div>
              <p className="text-4xl font-bold text-green-600">
                ${summary.finalYearBills.dispatchable.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">in {projectionYears} years</p>
              <p
                className={`text-sm font-semibold mt-2 ${dispatchableDiff >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
              >
                {dispatchableDiff >= 0 ? '+' : ''}
                {dispatchableDiff.toFixed(2)}/mo vs baseline
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Energy Bill Breakdown Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="card">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
            What Your Energy Bill Includes
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Understanding where your money goes helps you see how new large loads like data centers affect costs.
          </p>

          {/* Stacked Bar Chart */}
          <div className="mb-6">
            <div className="flex rounded-xl overflow-hidden h-14 shadow-inner">
              {/* Fuel/Operating Costs - 25% */}
              <div className="bg-blue-400 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '25%' }}>
                <span className="hidden sm:inline">Fuel Costs</span>
                <span className="sm:hidden">Fuel</span>
                <span className="ml-1 opacity-75">25%</span>
              </div>
              {/* Generation Capacity - 25% */}
              <div className="bg-blue-600 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '25%' }}>
                <span className="hidden sm:inline">Gen Capacity</span>
                <span className="sm:hidden">Cap</span>
                <span className="ml-1 opacity-75">25%</span>
              </div>
              {/* Transmission - 12% */}
              <div className="bg-amber-500 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '12%' }}>
                <span className="hidden md:inline">Trans</span>
                <span className="opacity-75 ml-0.5">12%</span>
              </div>
              {/* Distribution - 25% */}
              <div className="bg-orange-500 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '25%' }}>
                <span className="hidden sm:inline">Distribution</span>
                <span className="sm:hidden">Dist</span>
                <span className="ml-1 opacity-75">25%</span>
              </div>
              {/* Other - 13% */}
              <div className="bg-gray-400 flex items-center justify-center text-white text-xs font-semibold" style={{ width: '13%' }}>
                <span className="opacity-75">13%</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-400 flex-shrink-0"></div>
              <span className="text-sm text-gray-700">Fuel/Operating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600 flex-shrink-0"></div>
              <span className="text-sm text-gray-700">Generation Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500 flex-shrink-0"></div>
              <span className="text-sm text-gray-700">Transmission</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500 flex-shrink-0"></div>
              <span className="text-sm text-gray-700">Distribution</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400 flex-shrink-0"></div>
              <span className="text-sm text-gray-700">Other (Taxes, Fees)</span>
            </div>
          </div>

          {/* Impact Highlight */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              How Data Centers Affect Your Bill
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-amber-800 mb-2">Components Impacted by Large New Loads:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-3 h-3 rounded bg-blue-600 flex-shrink-0 mt-1"></div>
                    <span><strong>Generation Capacity</strong> — New power plants built for peak demand (gas peakers, solar, wind, batteries)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-3 h-3 rounded bg-amber-500 flex-shrink-0 mt-1"></div>
                    <span><strong>Transmission</strong> — New high-voltage lines & substations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-3 h-3 rounded bg-orange-500 flex-shrink-0 mt-1"></div>
                    <span><strong>Distribution</strong> — Local grid upgrades to deliver power</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">Components Less Directly Affected:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-3 h-3 rounded bg-blue-400 flex-shrink-0 mt-1"></div>
                    <span><strong>Fuel/Operating Costs</strong> — Passed through; more load = more fuel revenue (neutral to ratepayers)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-3 h-3 rounded bg-gray-400 flex-shrink-0 mt-1"></div>
                    <span><strong>Taxes & Fees</strong> — Percentage-based, scales with usage</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200 text-sm text-gray-600">
              <strong>Key insight:</strong> Solar, wind, and battery projects have minimal fuel costs—they're almost entirely capacity costs.
              This means new renewable generation built for data centers adds to the "Generation Capacity" portion of your bill, not fuel costs.
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Note: Actual bill composition varies by utility, state, and market structure. These are representative averages.
              See <a href="https://www.eia.gov/tools/faqs/faq.php?id=947&t=3" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">EIA data on electricity cost components</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Infographic Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Visual Scale Comparison */}
        <div className="card mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* Data center icon */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="4" width="18" height="4" rx="1" />
                    <rect x="3" y="10" width="18" height="4" rx="1" />
                    <rect x="3" y="16" width="18" height="4" rx="1" />
                    <circle cx="6" cy="6" r="1" className="text-green-400" fill="currentColor" />
                    <circle cx="6" cy="12" r="1" className="text-green-400" fill="currentColor" />
                    <circle cx="6" cy="18" r="1" className="text-green-400" fill="currentColor" />
                  </svg>
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-700 whitespace-nowrap">1 Data Center</span>
              </div>
              <span className="text-3xl font-bold text-gray-400">=</span>
              {/* Houses grid */}
              <div className="relative">
                <div className="grid grid-cols-5 gap-1 p-3 bg-amber-100 rounded-2xl">
                  {[...Array(15)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5z"/>
                      <rect x="10" y="14" width="4" height="5" />
                    </svg>
                  ))}
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-amber-700 whitespace-nowrap">300,000 Homes</span>
              </div>
            </div>
            <div className="text-center md:text-right mt-6 md:mt-0">
              <h2 className="font-display text-2xl font-bold text-gray-900">The Scale</h2>
              <p className="text-gray-600 text-sm">One large data center uses as much power as <strong>300,000 homes</strong></p>
            </div>
          </div>
        </div>

        {/* How It Works - Simplified Flow */}
        <div className="card mb-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 text-center">How Costs Flow to Your Bill</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg mb-2">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <line x1="4" y1="9" x2="20" y2="9" />
                  <line x1="4" y1="14" x2="20" y2="14" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Data Center Needs Power</span>
            </div>
            {/* Arrow */}
            <svg className="w-8 h-8 text-gray-300 rotate-90 md:rotate-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mb-2">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Utility Builds</span>
            </div>
            {/* Arrow */}
            <svg className="w-8 h-8 text-gray-300 rotate-90 md:rotate-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg mb-2">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v4l2 2" />
                  <path d="M8 12h.01M16 12h.01" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Costs Shared</span>
            </div>
            {/* Arrow */}
            <svg className="w-8 h-8 text-gray-300 rotate-90 md:rotate-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg mb-2">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="4" width="14" height="17" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="12" y2="17" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Your Bill</span>
            </div>
          </div>
        </div>

        {/* Scenario Spectrum */}
        <div className="card mb-8">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2 text-center">Design Determines Impact</h2>
          <p className="text-gray-500 text-center mb-6 text-sm">How a data center operates matters more than its size</p>

          {/* Spectrum bar */}
          <div className="relative mb-8">
            <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-orange-400 via-50% to-green-500 shadow-inner"></div>
            <div className="absolute -top-1 left-0 w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg"></div>
            <div className="absolute -top-1 left-1/3 -translate-x-1/2 w-6 h-6 bg-orange-500 rounded-full border-4 border-white shadow-lg"></div>
            <div className="absolute -top-1 right-0 w-6 h-6 bg-green-600 rounded-full border-4 border-white shadow-lg"></div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-2">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4" />
                </svg>
              </div>
              <h4 className="font-bold text-red-700 text-sm">Firm Load</h4>
              <p className="text-xs text-gray-500 mt-1">Always on, no flex</p>
              <p className="text-xs font-semibold text-red-600 mt-1">Highest cost</p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-2">
                <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v16h16M8 16l4-8 4 4 4-8" />
                </svg>
              </div>
              <h4 className="font-bold text-orange-700 text-sm">Flexible</h4>
              <p className="text-xs text-gray-500 mt-1">Reduces at peaks</p>
              <p className="text-xs font-semibold text-orange-600 mt-1">Lower cost</p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-2">
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <h4 className="font-bold text-green-700 text-sm">Optimized</h4>
              <p className="text-xs text-gray-500 mt-1">Flex + onsite gen</p>
              <p className="text-xs font-semibold text-green-600 mt-1">Lowest cost</p>
            </div>
          </div>
        </div>

        {/* Building It Right Section */}
        <div className="card mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-8 py-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">The Key: Building It Right</h2>
              <p className="text-gray-600">The AI revolution is coming. The question is whether it's built in a way that protects—or burdens—existing ratepayers.</p>
            </div>
          </div>

          {/* The 1,000 GW callout */}
          <div className="bg-white rounded-xl p-6 mb-6 border border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-center md:text-left flex-shrink-0">
                <p className="text-4xl md:text-5xl font-bold text-blue-600">1,000 GW</p>
                <p className="text-sm text-gray-500 mt-1">requested from U.S. utilities</p>
              </div>
              <div className="flex-1 text-gray-700">
                <p className="mb-2">
                  This massive demand means we're <strong>supply constrained</strong>—there isn't enough power to meet all requests.
                </p>
                <p className="text-sm text-gray-600">
                  That's why <strong>how</strong> this infrastructure gets built matters. With coordinated planning, large loads can actually benefit everyone.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">Why This Matters to You</h4>
              <p className="text-gray-700 mb-4">
                Done right, large industrial loads can actually put <strong>downward pressure on your rates</strong>:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>More customers sharing fixed infrastructure costs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Higher grid utilization = more efficient use of existing assets</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-800 mb-3">How Smart Design Protects You</h4>
              <p className="text-gray-700 mb-4">
                Data centers with <strong>flexible operations</strong> maximize benefits and minimize risks:
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Flexibility provides insurance if local supply and demand don't align</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>On-site generation reduces strain on the shared grid</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Risk Context Statement */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <p className="text-sm text-gray-600 mb-3">
              <strong className="text-gray-700">What about overbuilding risk?</strong> The theoretical risk is that utilities build infrastructure for demand that never materializes.
              But given current power deficits and multi-year interconnection backlogs, this is unlikely over the next 5-10 years.
              Requiring <strong>flexible load agreements and hybrid models</strong> provides additional insurance against localized mismatches.
            </p>
            <p className="text-xs text-gray-500">
              <Link href="/methodology#risk-framework" className="text-blue-700 hover:underline font-medium">
                See detailed analysis and sources →
              </Link>
            </p>
          </div>
        </div>

        {/* Key Insight + Action */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* What Matters */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8">
            <h3 className="font-display text-xl font-bold mb-5">What Matters Most</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <span className="text-sm leading-relaxed">Peak demand drives infrastructure costs</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <span className="text-sm leading-relaxed">Flexibility can cut impact dramatically</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">3</span>
                </div>
                <span className="text-sm leading-relaxed">Your voice at the PUC shapes outcomes</span>
              </div>
            </div>
          </div>

          {/* Take Action */}
          <div className="rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 text-white p-8">
            <h3 className="font-display text-xl font-bold mb-5">Take Action</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span className="text-sm leading-relaxed">Attend utility commission hearings</span>
              </div>
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span className="text-sm leading-relaxed">Ask about flexibility requirements</span>
              </div>
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span className="text-sm leading-relaxed">Demand transparent cost allocation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card hover:shadow-lg transition-shadow">
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">
              Customize for Your Community
            </h3>
            <p className="text-gray-600 mb-6">
              Enter your utility's actual numbers to see a more accurate projection for your
              specific situation.
            </p>
            <Link
              href="/calculator"
              className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
            >
              Open Calculator →
            </Link>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">
              Understand the Math
            </h3>
            <p className="text-gray-600 mb-6">
              All our calculations are based on publicly available data. Review our methodology and
              sources.
            </p>
            <Link
              href="/methodology"
              className="inline-block px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors shadow-sm hover:shadow-md"
            >
              View Methodology →
            </Link>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8 md:p-12 text-center border-2 border-gray-200">
          <h3 className="font-display text-3xl font-bold text-gray-900 mb-4">
            Open Source & Community Driven
          </h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            This tool is free, open source, and not affiliated with any data center company or
            utility. Our goal is to provide objective information so communities can make informed
            decisions.
          </p>
          <a
            href="https://github.com/DougMackenzie/community-energy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">View on GitHub</span>
          </a>

          {/* AI Carbon Footprint Statement - Dynamic */}
          <CarbonFooter />
        </div>
      </section>
    </div>
  );
}
