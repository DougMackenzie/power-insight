'use client';

import Link from 'next/link';
import { useCalculator } from '@/hooks/useCalculator';
import USDataCenterHeatMap from '@/components/USDataCenterHeatMap';
import ShareButton from '@/components/ShareButton';

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
              See how new data centers could change{' '}
              <span className="text-amber-300">
                your electric bill
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl">
              Pick your utility, set the size of the data center, and get a plain-English answer in under
              a minute. Free, open-source, and built on tariff data from 88 US utilities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/calculator"
                className="px-8 py-4 bg-amber-400 text-slate-900 font-semibold rounded-full hover:bg-amber-300 transition-all duration-200 hover:scale-105"
              >
                Open the Calculator
              </Link>
              <Link
                href="/methodology"
                className="px-8 py-4 bg-transparent border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-200"
              >
                How the math works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Plain-English summary — Grade 8-9 reading level */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mb-3">
                <span className="font-bold text-amber-700">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">A new data center wants power</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A single large data center can use as much electricity as 300,000 homes. That means new
                power lines, new substations, and sometimes new power plants.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mb-3">
                <span className="font-bold text-amber-700">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">The utility builds &mdash; and someone pays</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Building infrastructure costs money. Whether households pay more or less depends on what
                rate the data center is charged and how much spare grid capacity already exists.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mb-3">
                <span className="font-bold text-amber-700">3</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">The calculator shows you the math</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pick your utility and set the data center size. The tool uses your utility&rsquo;s actual
                tariff to estimate the impact on a typical residential bill &mdash; up or down.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/calculator"
              className="inline-block px-6 py-3 bg-slate-800 text-white font-semibold rounded-full hover:bg-slate-700 transition-colors"
            >
              Try it for your utility &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
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
              utilities have received interconnection requests totaling over <strong className="text-slate-800">1,000 GW</strong>.
              The scale creates a supply-constrained market where infrastructure planning is critical.
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
            <a href="https://emp.lbl.gov/queues" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline ml-1">LBNL Queued Up</a>,
            <a href="https://newsletter.semianalysis.com/p/how-ai-labs-are-solving-the-power" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 underline ml-1">SemiAnalysis</a>.
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

          {/* How Costs Flow - With Revenue Recovery */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">How Costs Flow to Your Bill</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
              {/* Step 1: Data Center Needs Power */}
              <div className="flex flex-col items-center text-center max-w-[100px]">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <line x1="4" y1="9" x2="20" y2="9" />
                    <line x1="4" y1="14" x2="20" y2="14" />
                  </svg>
                </div>
                <span className="text-xs text-slate-700 leading-tight">Data Center Requests Power</span>
              </div>
              <svg className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {/* Step 2: Utility Builds */}
              <div className="flex flex-col items-center text-center max-w-[100px]">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-700 leading-tight">Utility Builds Infrastructure</span>
              </div>
              <svg className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {/* Step 3: Data Center Pays */}
              <div className="flex flex-col items-center text-center max-w-[100px]">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <span className="text-xs text-slate-700 leading-tight">Data Center Pays Utility</span>
              </div>
              <svg className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {/* Step 4: Costs Shared */}
              <div className="flex flex-col items-center text-center max-w-[100px]">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8M12 8v8" />
                  </svg>
                </div>
                <span className="text-xs text-slate-700 leading-tight">Revenue Offsets Costs</span>
              </div>
              <svg className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {/* Step 5: Your Bill */}
              <div className="flex flex-col items-center text-center max-w-[100px]">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="4" width="14" height="17" rx="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                  </svg>
                </div>
                <span className="text-xs text-slate-700 leading-tight">Your Bill Reflects Net</span>
              </div>
            </div>
          </div>

          {/* What Research Shows */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
              What Research Shows About Data Center Impacts
            </h3>
            <p className="text-slate-600 text-center max-w-3xl mx-auto mb-6">
              Independent studies show that when data centers pay fair rates, they can actually help
              <strong className="text-slate-800"> lower bills for everyone</strong> by bringing new revenue to the grid.
            </p>

            {/* Three Key Findings Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Tariff Protection */}
              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3 border border-green-200">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700 mb-2">Utility Tariffs Can Protect You</p>
                <p className="text-sm text-slate-600">
                  Electric companies are creating special rates for data centers that make them pay
                  their fair share — so homeowners don't get stuck with the bill for new power lines
                  and equipment.
                </p>
              </div>

              {/* Revenue Adequacy */}
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3 border border-blue-200">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-blue-700 mb-2">More Customers Can Mean Lower Costs</p>
                <p className="text-sm text-slate-600">
                  When large customers like data centers join the grid, they help pay for
                  shared infrastructure. This spreads fixed costs across more users,
                  which can reduce the cost per household.
                </p>
              </div>

              {/* Flexible Load Revenue */}
              <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-3 border border-amber-200">
                  <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v16h16M8 16l4-8 4 4 4-8" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-amber-700 mb-2">Flexible Load Increases Revenue</p>
                <p className="text-sm text-slate-600">
                  When data centers reduce usage during peak times, they help avoid expensive
                  infrastructure upgrades and can generate ancillary revenue for the grid.
                </p>
              </div>
            </div>

            {/* Consolidated Research Box */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-sm font-medium text-slate-700 mb-3">Key Research Findings:</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <a href="https://www.ethree.com/ratepayer-study/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">E3 Study (2025)</a>
                    {' '}— A single data center can bring millions in extra revenue, lowering nearby bills by 1-2%
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <a href="https://www.pbs.org/newshour/show/how-data-center-power-demand-could-help-lower-electricity-prices" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LBNL / Brattle (2025)</a>
                    {' '}— States with growing demand actually saw rates go down
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <a href="https://www.utilitydive.com/news/grid-operators-ratepayers-shouldnt-fear-flexible-data-centers-gridcare/808032/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GridCARE (2025)</a>
                    {' '}— Flexible data centers could cut costs by 5% for all customers
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <a href="https://mitsloan.mit.edu/ideas-made-to-matter/flexible-data-centers-can-reduce-costs-if-not-emissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MIT Sloan (2025)</a>
                    {' '}— Shifting work to off-peak times saves money for the whole grid
                  </span>
                </li>
              </ul>
              <p className="text-sm text-slate-500 mt-4 pt-3 border-t border-slate-100">
                <strong className="text-slate-600">Want to dive deeper?</strong>{' '}
                <Link href="/methodology#literature-review" className="text-blue-600 hover:underline">
                  View our full research summary
                </Link>{' '}
                — covering 12+ studies including ones that show potential risks.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Use our <Link href="/calculator" className="text-amber-600 hover:underline font-medium">calculator</Link> to see projections specific to your utility and community.
          </p>
        </div>
      </section>

      {/* What Communities Are Asking */}
      <section className="bg-gradient-to-br from-slate-700 to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
            What Communities Are Asking
          </h2>
          <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10">
            These are the questions we hear most often. They deserve honest, evidence-based answers.
          </p>

          {/* FAQ Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Question 1 */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">&quot;Will my electric bill go up?&quot;</h3>
                  <p className="text-sm text-amber-300 mb-2">With the right policy, data centers apply downward pressure on rates.</p>
                  <p className="text-xs text-slate-300">
                    Large customers bring new revenue that helps cover shared infrastructure costs.
                    The E3 study found data centers can lower nearby bills by 1-2%.{' '}
                    <Link href="/methodology#market-structures" className="text-amber-300 hover:underline">See our model →</Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Question 2 */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">&quot;Who pays for all the new infrastructure?&quot;</h3>
                  <p className="text-sm text-amber-300 mb-2">Industrial tariffs ensure data centers pay their full cost of service.</p>
                  <p className="text-xs text-slate-300">
                    Utilities are creating dedicated rate classes with demand charges that recover transmission and
                    distribution costs directly from large loads.{' '}
                    <Link href="/methodology#revenue-adequacy" className="text-amber-300 hover:underline">See cost allocation →</Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Question 3 */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">&quot;What happens if the data center leaves?&quot;</h3>
                  <p className="text-sm text-amber-300 mb-2">Tariff structures include minimum contract terms to ensure full cost recovery.</p>
                  <p className="text-xs text-slate-300">
                    Policies like AEP Ohio&apos;s 12-year minimum demand requirements and exit fees protect
                    ratepayers from stranded asset risk.{' '}
                    <Link href="/methodology#policy-mechanisms" className="text-amber-300 hover:underline">See protections →</Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Question 4 */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm text-white p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">&quot;Will I have power outages?&quot;</h3>
                  <p className="text-sm text-amber-300 mb-2">Modern data centers actually help stabilize the grid during emergencies.</p>
                  <p className="text-xs text-slate-300">
                    Data centers can reduce operations and activate on-site generators during peak demand,
                    helping prevent brownouts and blackouts. Many include battery storage that acts as grid backup.{' '}
                    <Link href="/methodology#policy-mechanisms" className="text-amber-300 hover:underline">See grid benefits →</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Questions to Ask Checklist */}
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 mb-8">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Questions to Ask About Any Proposal</h3>
            <p className="text-slate-400 text-sm text-center mb-6">Use this checklist when evaluating data center proposals in your community.</p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Cost Allocation */}
              <div>
                <h4 className="text-sm font-semibold text-amber-300 mb-3">Cost Allocation</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    What rate schedule will the data center be on?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    Does the rate cover full cost-of-service including demand charges?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    Who pays for grid upgrades needed to serve the facility?
                  </li>
                </ul>
              </div>

              {/* Grid Reliability */}
              <div>
                <h4 className="text-sm font-semibold text-green-400 mb-3">Grid Reliability</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    Is any of the load flexible?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    Can operations be curtailed during grid emergencies?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    Is on-site generation or battery storage included?
                  </li>
                </ul>
              </div>

              {/* Risk Protection */}
              <div>
                <h4 className="text-sm font-semibold text-amber-300 mb-3">Risk Protection</h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    Are there minimum purchase requirements?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    What happens if the data center closes or reduces load?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-slate-500 rounded flex-shrink-0 mt-0.5"></span>
                    Who bears the risk of stranded assets?
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Learn More Button */}
          <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/methodology"
              className="inline-block px-8 py-4 bg-amber-400 text-slate-900 font-semibold rounded-full hover:bg-amber-300 transition-all duration-200 hover:scale-105"
            >
              Explore Our Full Methodology
            </Link>
            <ShareButton />
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
