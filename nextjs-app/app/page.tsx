'use client';

import Link from 'next/link';
import { useCalculator } from '@/hooks/useCalculator';
import USDataCenterHeatMap from '@/components/USDataCenterHeatMap';

export default function HomePage() {
  // Calculator context is still available if needed for future enhancements
  useCalculator();

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
                Power Insight — Open Data for Smarter Energy Decisions
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              The Scale of AI and Planning for{' '}
              <span className="text-amber-300">
                Responsible Energy Growth
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl">
              New data centers are reshaping our energy landscape. With the right policies, this
              growth can mean lower bills, a more reliable grid, and breakthroughs in science and
              medicine. Explore the data and help shape better outcomes for your community.
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

      {/* Why This Matters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-4">
        <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl p-8 md:p-10 border border-emerald-100">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
              Energy Growth Has Always Driven Progress
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              From electrification to the internet, new demands on our energy system have preceded
              breakthroughs that improved daily life. AI-powered data centers are accelerating research
              in medicine, materials science, and clean energy itself.
            </p>
            <p className="text-slate-600 leading-relaxed">
              The question isn't whether to build — it's <strong className="text-slate-800">how to build responsibly</strong> so
              that communities benefit and household bills stay affordable. This site gives you the
              real numbers so you can be part of that conversation.
            </p>
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
              Today, data centers make up about <strong className="text-slate-800">4.4% of total U.S. electricity
              consumption</strong> (176 TWh in 2023). By 2030, this share is projected to reach <strong className="text-slate-800">6 to 9%</strong>,
              adding an estimated <strong className="text-slate-800">50 to 65 GW</strong> of new electricity demand — equivalent
              to building 50 to 65 nuclear power plants.
            </p>
            <p>
              This growth, driven by the AI revolution, has led to a backlog of power demand. U.S.
              utilities have received interconnection requests totaling over <strong className="text-slate-800">1,000 GW</strong> —
              though historically only about 13% of such requests reach commercial operation. Even so,
              the scale creates a supply-constrained market where infrastructure planning is critical.
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
            <a href="https://www.epri.com/about/media-resources/press-release/q5vu86fr8tkxatfx8ihf1u48vw4r1dzf" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline ml-1">EPRI</a>,
            <a href="https://emp.lbl.gov/queues" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline ml-1">LBNL Queued Up</a>.
          </p>
        </div>
      </section>

      {/* Household Costs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              What This Means for Your Electric Bill
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              One large data center campus uses as much power as <strong className="text-slate-800">300,000 homes</strong>. Here's how costs flow to your bill.
            </p>
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

          {/* Cost Impact Range Message */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
              The Impact on Your Bill Varies Widely
            </h3>
            <p className="text-slate-600 text-center max-w-3xl mx-auto mb-6">
              The impact of data center growth on your electricity costs depends on where you live and how your utility manages new large loads.
            </p>

            {/* Range Visualization */}
            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mb-6">
              {/* Best Case */}
              <div className="flex-1 max-w-sm p-6 bg-green-50 rounded-xl border border-green-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3 border border-green-200">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700 mb-2">Well-Managed Growth</p>
                <p className="text-3xl font-bold text-green-700 mb-2">-$5 to $0</p>
                <p className="text-xs text-slate-600">per month change</p>
                <p className="text-xs text-slate-500 mt-3 italic">
                  When data centers pay their fair share and operate flexibly, they add revenue to the grid — which can reduce costs for households
                </p>
              </div>

              {/* Worst Case */}
              <div className="flex-1 max-w-sm p-6 bg-red-50 rounded-xl border border-red-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3 border border-red-200">
                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-700 mb-2">Poorly Managed Growth</p>
                <p className="text-3xl font-bold text-red-700 mb-2">+$20 to $35</p>
                <p className="text-xs text-slate-600">per month increase</p>
                <p className="text-xs text-slate-500 mt-3 italic">
                  Rapid growth without proper cost allocation or operational requirements
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-700">
                <strong className="text-amber-800">The difference between these outcomes comes down to policy and operational design</strong> — and communities have a voice in both.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Use our <Link href="/calculator" className="text-amber-600 hover:underline font-medium">calculator</Link> to see projections specific to your utility and community.
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
              <h2 className="text-2xl font-bold text-slate-800 mb-2">How Responsible Development Lowers Your Bills</h2>
              <p className="text-slate-600">
                When data centers are built with proper cost allocation and flexible operations, they bring new
                revenue to the grid, fund infrastructure upgrades, and can reduce what households pay. Here's how that works.
              </p>
            </div>
          </div>

          {/* Two Column Cards - Integrated with extended content */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Policy */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-3">Fair Cost Allocation Through Good Policy</h4>
                <p className="text-slate-600 text-sm mb-3">
                  A single large data center can contribute tens of millions in annual grid payments — revenue
                  that offsets costs for all ratepayers when allocated properly.
                  <strong className="text-slate-800"> The critical question is: who pays for new infrastructure?</strong>
                </p>
                <ul className="space-y-2 text-slate-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500">→</span>
                    <span>With good policy, data centers pay their fair share of the costs they create</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500">→</span>
                    <span>Without good policy, existing customers may subsidize data center infrastructure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500">→</span>
                    <span>When done right, more customers sharing the grid can lower costs for everyone</span>
                  </li>
                </ul>
              </div>

              {/* Why Rate Structure Matters - Integrated */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <p className="text-slate-600 text-sm mb-2">
                  <strong className="text-amber-800">Example:</strong> In Virginia, electricity bills have been rising in part because data centers aren't fully covering
                  the infrastructure costs they create.
                </p>
                <p className="text-slate-600 text-sm">
                  In contrast, some states charge data centers based on how much they contribute to peak demand—giving them a financial reason to operate in ways that benefit everyone.
                </p>
              </div>
            </div>

            {/* Right Column: Flexibility */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="font-semibold text-green-700 mb-3">Flexible Data Centers Maximize Benefits</h4>
                <p className="text-slate-600 text-sm mb-3">
                  How a data center operates matters as much as how big it is. Flexible operations can protect communities:
                </p>
                <ul className="space-y-2 text-slate-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Flexible loads can reduce power use during peak demand, avoiding costly infrastructure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>On-site generators reduce reliance on the shared power grid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>During emergencies (like heat waves or storms), data centers can cut back so homes have power</span>
                  </li>
                </ul>
              </div>

              {/* Data Center Design Types - Integrated */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-center flex-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg mb-1 border border-red-200">
                      <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-red-700">Always-On</p>
                    <p className="text-[10px] text-slate-500">Highest cost</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <div className="text-center flex-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 rounded-lg mb-1 border border-amber-200">
                      <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v16h16M8 16l4-8 4 4 4-8" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-amber-700">Flexible</p>
                    <p className="text-[10px] text-slate-500">Lower impact</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <div className="text-center flex-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-1 border border-green-200">
                      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-green-700">Optimized</p>
                    <p className="text-[10px] text-slate-500">Minimal cost</p>
                  </div>
                </div>
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
            {/* What's Driving Better Outcomes */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-8 border border-white/20">
              <h3 className="text-xl font-bold text-amber-300 mb-5">What's Driving Better Outcomes</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-amber-300">1</span>
                  </div>
                  <div>
                    <span className="text-sm text-white font-medium">Separate rate classes for large loads</span>
                    <p className="text-xs text-slate-400 mt-1">Virginia's new GS-5 rate class requires data centers to pay minimum demand charges of 85% for transmission and distribution</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-amber-300">2</span>
                  </div>
                  <div>
                    <span className="text-sm text-white font-medium">Incentivized flexibility and curtailment</span>
                    <p className="text-xs text-slate-400 mt-1">Texas SB6 requires large loads to curtail during grid emergencies and reevaluates transmission cost allocation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-amber-300">3</span>
                  </div>
                  <div>
                    <span className="text-sm text-white font-medium">Public pressure and regulatory oversight</span>
                    <p className="text-xs text-slate-400 mt-1">60+ bills in 22 states focused on ratepayer protection; voter concerns are reshaping utility elections</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How You Can Take Action */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-8 border border-white/20">
              <h3 className="text-xl font-bold text-green-400 mb-5">How You Can Take Action</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <div>
                    <span className="text-sm text-white font-medium">Comment on utility rate cases</span>
                    <p className="text-xs text-slate-400 mt-1">Advocate for large loads to pay their fair share of infrastructure costs they create</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <div>
                    <span className="text-sm text-white font-medium">Support state ratepayer protection bills</span>
                    <p className="text-xs text-slate-400 mt-1">Contact your state legislators about data center cost allocation legislation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <div>
                    <span className="text-sm text-white font-medium">Ask about flexibility requirements</span>
                    <p className="text-xs text-slate-400 mt-1">Advocate for incentive structures that promote load flexibility during grid stress events</p>
                  </div>
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
            href="https://github.com/DougMackenzie/power-insight"
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
        </div>
      </section>
    </div>
  );
}
