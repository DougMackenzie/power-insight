'use client';

import Link from 'next/link';
import { useCalculator } from '@/hooks/useCalculator';
import { formatMW } from '@/lib/constants';
import CarbonFooter from '@/components/CarbonFooter';
import USDataCenterHeatMap from '@/components/USDataCenterHeatMap';

export default function HomePage() {
  const { summary, utility, dataCenter, projectionYears } = useCalculator();

  const baselineFinalBill = summary.finalYearBills.baseline;
  const firmLoadDiff = summary.finalYearBills.unoptimized - baselineFinalBill;
  const dispatchableDiff = summary.finalYearBills.dispatchable - baselineFinalBill;

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section - light blue gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heroGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroGrid)" />
          </svg>
        </div>

        {/* Glowing orb effect - muted */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-amber-300 text-sm font-medium border border-white/10">
                Community Energy Calculator
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              The Scale of AI and Planning for{' '}
              <span className="text-amber-300">
                Responsible Energy Growth
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl">
              The public needs to understand how the rapid expansion of data centers impacts
              electricity costs. Individuals and community leaders can use this website to get
              the real numbers and advocate for responsible development and policy.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/calculator"
                className="px-8 py-4 bg-amber-400 text-slate-900 font-semibold rounded-full hover:bg-amber-300 transition-all duration-200 hover:scale-105"
              >
                Calculate My Electric Costs
              </Link>
              <Link
                href="/methodology"
                className="px-8 py-4 bg-transparent border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-200"
              >
                See Our Data Sources
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Data Center Boom by the Numbers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">
            The Data Center Boom by the Numbers
          </h2>

          <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
            <p>
              Today, data centers make up about <strong className="text-slate-800">4% of total U.S. electricity
              consumption</strong>. By 2030, this share is projected to reach <strong className="text-slate-800">6 to 9%</strong> —
              that's equivalent to building approximately <strong className="text-slate-800">100 nuclear power plants</strong> or
              100 GW of new power generation capacity.
            </p>
            <p>
              This growth, driven by the AI revolution, has led to a backlog of power demand. U.S.
              utilities around the country have received requests for <strong className="text-slate-800">1,000 GW of power</strong>.
              This massive demand creates a supply-constrained market where there isn't enough power
              to meet all of these requests.
            </p>
          </div>

          {/* US Heat Map */}
          <USDataCenterHeatMap className="mb-8" />

          {/* Link to Story page */}
          <div className="text-center">
            <Link
              href="/story"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
            >
              Learn more about the scale of data centers from the chip to community level with the{' '}
              <span className="font-bold text-amber-600 underline decoration-amber-400/50 underline-offset-2">
                AI Energy Explorer
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-6 border-t border-slate-200 pt-4">
            Sources: <a href="https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline">LBNL 2024 Report</a>,
            <a href="https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline ml-1">U.S. DOE</a>,
            <a href="https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline ml-1">Grid Strategies</a>,
            <a href="https://semianalysis.com/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline ml-1">SemiAnalysis</a>.
          </p>
        </div>
      </section>

      {/* Household Costs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Household Costs
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              One large data center uses as much power as <strong className="text-slate-800">300,000 homes</strong>. Here's how costs flow to your bill.
            </p>
          </div>

          {/* Visual Scale Comparison */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-6">
              {/* Data center icon */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="4" width="18" height="4" rx="1" />
                    <rect x="3" y="10" width="18" height="4" rx="1" />
                    <rect x="3" y="16" width="18" height="4" rx="1" />
                  </svg>
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-600 whitespace-nowrap">1 Data Center</span>
              </div>
              <span className="text-2xl font-bold text-slate-400">=</span>
              {/* Houses grid */}
              <div className="relative">
                <div className="grid grid-cols-5 gap-1 p-3 bg-amber-100 rounded-2xl border border-amber-200">
                  {[...Array(15)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5z"/>
                      <rect x="10" y="14" width="4" height="5" />
                    </svg>
                  ))}
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-amber-700 whitespace-nowrap">300,000 Homes</span>
              </div>
            </div>
          </div>

          {/* How Costs Flow - Simplified */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">How Costs Flow to Your Bill</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <line x1="4" y1="9" x2="20" y2="9" />
                    <line x1="4" y1="14" x2="20" y2="14" />
                  </svg>
                </div>
                <span className="text-sm text-slate-700">Data Center Needs Power</span>
              </div>
              <svg className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <span className="text-sm text-slate-700">Utility Builds Infrastructure</span>
              </div>
              <svg className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="4" width="14" height="17" rx="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                  </svg>
                </div>
                <span className="text-sm text-slate-700">Your Bill Changes</span>
              </div>
            </div>
          </div>

          {/* Bill Comparison Cards - The key visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {/* Baseline */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <p className="text-sm font-medium text-slate-500 mb-2">Without Data Center</p>
              <p className="text-4xl font-bold text-slate-600">
                ${baselineFinalBill.toFixed(0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">in {projectionYears} years</p>
              <p className="text-xs text-slate-400 mt-2">Normal rate increases</p>
            </div>

            {/* Typical Data Center */}
            <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-center">
              <p className="text-sm font-medium text-red-600 mb-2">With Typical Data Center</p>
              <p className="text-4xl font-bold text-red-600">
                ${summary.finalYearBills.unoptimized.toFixed(0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">in {projectionYears} years</p>
              <p className={`text-sm font-semibold mt-2 ${firmLoadDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {firmLoadDiff >= 0 ? '+' : ''}{firmLoadDiff.toFixed(2)}/mo vs baseline
              </p>
            </div>

            {/* Optimized Data Center */}
            <div className="p-6 bg-green-50 rounded-xl border-2 border-green-400 text-center ring-2 ring-green-200 ring-offset-2 ring-offset-white">
              <div className="flex items-center justify-center gap-2 mb-2">
                <p className="text-sm font-medium text-green-700">With Optimized Data Center</p>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium border border-green-300">
                  BEST
                </span>
              </div>
              <p className="text-4xl font-bold text-green-700">
                ${summary.finalYearBills.dispatchable.toFixed(0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">in {projectionYears} years</p>
              <p className={`text-sm font-semibold mt-2 ${dispatchableDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dispatchableDiff >= 0 ? '+' : ''}{dispatchableDiff.toFixed(2)}/mo vs baseline
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Based on a {formatMW(dataCenter.capacityMW)} data center serving {utility.residentialCustomers.toLocaleString()} residential customers
          </p>
        </div>
      </section>

      {/* The Path Forward Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">The Path Forward: Equitable Tariffs and Flexible Operations</h2>
              <p className="text-slate-600">
                In a supply-constrained market, the key to responsible data center development is both in (1) the tariffs
                and policies making sure that data center loads cover any increase in marginal costs, and (2) the data
                centers are designed and operated with flexibility in mind.
              </p>
            </div>
          </div>

          {/* Two Column Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h4 className="font-semibold text-slate-700 mb-3">Coordination to Share Costs</h4>
              <p className="text-slate-600 text-sm">
                With coordinated planning, large industrial loads can put <strong className="text-slate-800">downward pressure on rates</strong> because
                more customers share fixed infrastructure costs. Greater grid utilization makes for more efficient use of
                existing assets.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h4 className="font-semibold text-green-700 mb-3">The Smart Design Model</h4>
              <p className="text-slate-600 text-sm mb-3">
                Flexible data center operations rather than size are key to maximizing benefits and minimizing risks:
              </p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Flexibility provides insurance if local supply and demand don't align</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>On-site generation reduces strain on the shared grid</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>During grid emergencies, data centers can shed load and push power back</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Virginia/ERCOT Comparison */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-amber-800 mb-3">Market Structure Matters: Virginia vs. Texas</h4>
            <p className="text-slate-600 text-sm mb-3">
              Virginia electricity bills have increased significantly because the market structure doesn't properly
              allocate costs—data centers don't fully pay for the infrastructure they require.
            </p>
            <p className="text-slate-600 text-sm">
              In contrast, <strong className="text-slate-800">ERCOT's 4CP (Four Coincident Peak) methodology</strong> allocates transmission costs based on
              contribution during the 4 highest system peak hours each year. This incentivizes large loads to reduce consumption
              during critical periods, protecting existing ratepayers while rewarding flexible operations.
            </p>
          </div>

          {/* Data Center Operations - Simplified */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-6 text-center">Data Center Operations in Practice</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-2 border border-red-200">
                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4" />
                  </svg>
                </div>
                <h5 className="font-bold text-red-700 text-sm">Firm Load</h5>
                <p className="text-xs text-slate-500 mt-1">100% on at all times</p>
                <p className="text-xs font-medium text-red-600 mt-1">Maximum infrastructure</p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-2 border border-amber-200">
                  <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v16h16M8 16l4-8 4 4 4-8" />
                  </svg>
                </div>
                <h5 className="font-bold text-amber-700 text-sm">Flexible Load</h5>
                <p className="text-xs text-slate-500 mt-1">25% curtailable</p>
                <p className="text-xs font-medium text-amber-600 mt-1">Reduced infrastructure</p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-2 border border-green-200">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <h5 className="font-bold text-green-700 text-sm">Optimized Load</h5>
                <p className="text-xs text-slate-500 mt-1">Flex + on-site generation</p>
                <p className="text-xs font-medium text-green-600 mt-1">Minimum infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advocate for Your Community */}
      <section className="bg-gradient-to-br from-slate-700 to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            Advocate for Your Community
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Key Messages */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-8 border border-white/20">
              <h3 className="text-xl font-bold text-amber-300 mb-5">Key Messages</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-300">1</span>
                  </div>
                  <span className="text-sm text-slate-200">Peak demand drives infrastructure costs</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-300">2</span>
                  </div>
                  <span className="text-sm text-slate-200">Flexibility can cut impact dramatically</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-300">3</span>
                  </div>
                  <span className="text-sm text-slate-200">Your voice at the Public Utility Commission (PUC) shapes outcomes</span>
                </div>
              </div>
            </div>

            {/* Take Action */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-8 border border-white/20">
              <h3 className="text-xl font-bold text-green-400 mb-5">Take Action</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-sm text-slate-200">Attend utility commission hearings</span>
                </div>
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-sm text-slate-200">Ask about flexibility requirements</span>
                </div>
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-sm text-slate-200">Demand transparent cost allocation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learn More Button */}
          <div className="text-center">
            <Link
              href="/learn-more"
              className="inline-block px-8 py-4 bg-amber-400 text-slate-900 font-semibold rounded-full hover:bg-amber-300 transition-all duration-200 hover:scale-105"
            >
              Learn More About Data Center Development
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Customize for Your Community
            </h3>
            <p className="text-slate-600 mb-6">
              Enter your utility's actual numbers to see a more accurate projection for your
              specific situation.
            </p>
            <Link
              href="/calculator"
              className="inline-block px-6 py-3 bg-slate-700 text-white font-semibold rounded-full hover:bg-slate-600 transition-colors"
            >
              Open Calculator
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Understand the Math
            </h3>
            <p className="text-slate-600 mb-6">
              All our calculations are based on publicly available data. Review our methodology and
              sources.
            </p>
            <Link
              href="/methodology"
              className="inline-block px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-full hover:bg-slate-300 transition-colors"
            >
              View Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-sm border border-slate-200">
          <h3 className="text-3xl font-bold text-slate-800 mb-4">
            Open Source & Community Driven
          </h3>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            This tool is free, open source, and not affiliated with any data center company or
            utility. Our goal is to provide objective information so communities can make informed
            decisions.
          </p>
          <a
            href="https://github.com/DougMackenzie/community-energy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all duration-200 hover:scale-105"
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
