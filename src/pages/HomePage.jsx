/**
 * HomePage Component
 *
 * Landing page with overview of the tool - designed for individuals and community leaders.
 * Restructured to emphasize tariff policies, flexible operations, and responsible development.
 */

import TrajectoryChart from '../components/TrajectoryChart';
import USDataCenterHeatMap from '../components/USDataCenterHeatMap';
import { useCalculator } from '../hooks/useCalculator';
import { SCENARIOS, formatCurrency, formatMW, NATIONAL_DC_STATS } from '../data/constants';

const HomePage = ({ onNavigate }) => {
  const { summary, utility, dataCenter, projectionYears } = useCalculator();

  // Calculate key metrics for display
  const baselineFinalBill = summary.finalYearBills.baseline;
  const firmLoadDiff = summary.finalYearBills.unoptimized - baselineFinalBill;
  const dispatchableDiff = summary.finalYearBills.dispatchable - baselineFinalBill;

  return (
    <div className="space-y-8">
      {/* Section 1: Hero - Community focused */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-8 text-white">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            The Scale of AI and Planning for Responsible Energy Growth
          </h1>
          <p className="text-lg text-blue-100 mb-6">
            The public needs to understand how the rapid expansion of data centers impacts
            electricity costs. Individuals and community leaders can use this website to get
            the real numbers and advocate for responsible development and policy.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('calculator')}
              className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Calculate My Electric Costs
            </button>
            <button
              onClick={() => onNavigate('methodology')}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors border border-blue-400"
            >
              See Our Data Sources
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: The Data Center Boom by the Numbers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          The Data Center Boom by the Numbers
        </h2>

        <p className="text-gray-700 mb-4">
          Today, data centers make up about 4% of total U.S. electricity consumption.
          By 2030, this share is projected to reach 6 to 9% — that's equivalent to
          building approximately 100 nuclear power plants or 100 GW of new power generation capacity.
        </p>

        <p className="text-gray-600 mb-6">
          This growth, driven by the AI revolution, has led to a backlog of power demand.
          U.S. utilities around the country have requested 1,000 GW of power. This massive
          demand creates a supply-constrained market where there isn't enough power to meet
          all of these requests.
        </p>

        {/* US Heat Map */}
        <USDataCenterHeatMap />

        {/* Link to AI Energy Explorer */}
        <p className="text-sm text-gray-600 mt-4 text-center">
          Learn more about the scale of data centers from the chip to community level with the{' '}
          <button
            onClick={() => onNavigate('story')}
            className="font-bold text-purple-700 hover:text-purple-800 hover:underline"
          >
            AI Energy Explorer
          </button>
        </p>
      </div>

      {/* Section 3: Household Costs (The Scale) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Household Costs
        </h2>
        <p className="text-gray-600 mb-6">
          One large data center uses as much power as 300,000 homes. Here's how costs flow to your bill.
        </p>

        {/* Circle Infographics */}
        <div className="flex justify-center items-center gap-4 md:gap-8 flex-wrap">
          {/* Infrastructure Costs Circle */}
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-red-100 border-4 border-red-300 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-red-600">+</p>
                <p className="text-xs text-red-700">Costs</p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">Infrastructure</p>
            <p className="text-xs text-gray-500 text-center max-w-24">New lines, plants, capacity</p>
          </div>

          {/* Minus sign */}
          <div className="text-3xl font-bold text-gray-400">−</div>

          {/* Revenue Circle */}
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-green-100 border-4 border-green-300 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-green-600">−</p>
                <p className="text-xs text-green-700">Revenue</p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">DC Payments</p>
            <p className="text-xs text-gray-500 text-center max-w-24">Demand charges, energy sales</p>
          </div>

          {/* Equals sign */}
          <div className="text-3xl font-bold text-gray-400">=</div>

          {/* Net Impact Circle */}
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-blue-100 border-4 border-blue-300 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold text-blue-600">Net</p>
                <p className="text-xs text-blue-700">Impact</p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">Your Bill</p>
            <p className="text-xs text-gray-500 text-center max-w-24">Depends on design & tariffs</p>
          </div>
        </div>
      </div>

      {/* Section 4: The Path Forward - Equitable Tariffs and Flexible Operations */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            The Path Forward: Equitable Tariffs and Flexible Operations
          </h2>
          <p className="text-gray-600">
            In a supply-constrained market, the key to responsible data center development is both in
            (1) the tariffs and policies making sure that data center loads cover any increase in marginal costs,
            and (2) the data centers are designed and operated with flexibility in mind. Here's how it works:
          </p>
        </div>

        {/* Two-column cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Coordination to Share Costs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Coordination to Share Costs
            </h3>
            <p className="text-gray-600">
              With coordinated planning, large industrial loads can put downward pressure on rates
              because more customers share fixed infrastructure costs. Greater grid utilization
              makes for more efficient use of existing assets.
            </p>
          </div>

          {/* The Smart Design Model */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              The Smart Design Model
            </h3>
            <p className="text-gray-600 mb-3">
              Flexible data center operations rather than size are key to maximizing benefits
              and minimizing risks:
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Flexibility provides insurance against grid stress events
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                On-site generation can support the grid during emergencies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Data centers can shed load and push power to the grid during events like snowstorms
              </li>
            </ul>
          </div>
        </div>

        {/* Virginia/ERCOT comparison callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-900">Why Market Structure Matters</p>
              <p className="text-sm text-amber-800 mt-1">
                Virginia has seen residential bills increase because the market structure doesn't properly
                allocate costs to the loads that cause them. In contrast, ERCOT's 4CP (Four Coincident Peak)
                methodology ensures large loads pay their fair share of transmission costs based on their
                contribution during the four highest system peaks each year — creating strong incentives for
                flexible operations.
              </p>
            </div>
          </div>
        </div>

        {/* Data Center Operations in Practice */}
        <div className="bg-white rounded-xl border-2 border-gray-300 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Data Center Operations in Practice
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Firm Load */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </div>
              <h4 className="font-semibold text-red-700">Firm Load</h4>
              <p className="text-sm text-gray-600 mt-2">
                100% on at all times. Adds fully to peak demand. Requires maximum
                infrastructure investment.
              </p>
            </div>

            {/* Flexible Load */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-amber-700">Flexible Load</h4>
              <p className="text-sm text-gray-600 mt-2">
                25% can be curtailed during peaks (DCFlex validated). Higher utilization,
                lower infrastructure needs.
              </p>
            </div>

            {/* Optimized Load */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-semibold text-green-700">Optimized Load</h4>
              <p className="text-sm text-gray-600 mt-2">
                Flexibility plus on-site generation. Can support grid during emergencies.
                Maximum community benefit.
              </p>
            </div>
          </div>
        </div>

        {/* Cost Impact Scenario - 10-year projection chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Cost Impact Scenario
          </h3>
          <p className="text-gray-600 mb-4">
            Based on a {formatMW(dataCenter.capacityMW)} data center in a utility territory that serves{' '}
            {utility.residentialCustomers.toLocaleString()} residential customers, here's how your monthly
            bill could change over the next {projectionYears} years under different operating models.
          </p>
          <TrajectoryChart height={350} />

          {/* Summary stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg" style={{ backgroundColor: SCENARIOS.baseline.colorLight }}>
              <p className="text-xs text-gray-600">No Data Center</p>
              <p className="text-lg font-bold" style={{ color: SCENARIOS.baseline.color }}>
                ${baselineFinalBill.toFixed(0)}/mo
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: SCENARIOS.unoptimized.colorLight }}>
              <p className="text-xs text-gray-600">Firm Load DC</p>
              <p className="text-lg font-bold" style={{ color: SCENARIOS.unoptimized.color }}>
                ${summary.finalYearBills.unoptimized.toFixed(0)}/mo
              </p>
              <p className="text-xs text-red-600">
                +${firmLoadDiff.toFixed(0)} vs baseline
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: SCENARIOS.flexible.colorLight }}>
              <p className="text-xs text-gray-600">Flexible Load DC</p>
              <p className="text-lg font-bold" style={{ color: SCENARIOS.flexible.color }}>
                ${summary.finalYearBills.flexible.toFixed(0)}/mo
              </p>
            </div>
            <div className="p-3 rounded-lg border-2 border-green-300" style={{ backgroundColor: SCENARIOS.dispatchable.colorLight }}>
              <p className="text-xs text-gray-600">Optimized DC</p>
              <p className="text-lg font-bold" style={{ color: SCENARIOS.dispatchable.color }}>
                ${summary.finalYearBills.dispatchable.toFixed(0)}/mo
              </p>
              <p className={`text-xs ${dispatchableDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dispatchableDiff >= 0 ? '+' : ''}{dispatchableDiff.toFixed(0)} vs baseline
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Advocate for Your Community */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Advocate for Your Community
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Key Messages Box */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Key Messages</h3>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                <span>Data centers CAN benefit ratepayers when designed with flexibility and proper tariff structures.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                <span>The Public Utility Commission (PUC) should require flexible operations as a condition of interconnection.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                <span>Demand charges and cost allocation methods matter more than data center size.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                <span>On-site generation makes data centers a grid resource during emergencies.</span>
              </li>
            </ol>
          </div>

          {/* Take Action Box */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Take Action</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Attend Public Utility Commission (PUC) hearings on rate cases</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Ask your utility about data center interconnection requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Share this tool with community leaders and local representatives</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Request transparency on how large load costs are allocated</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Learn More Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('methodology')}
            className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Learn More About Data Center Development
          </button>
        </div>
      </div>

      {/* Section 6: Call to action */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Customize for Your Community
          </h3>
          <p className="text-gray-600 mb-4">
            Enter your utility's actual numbers to see a more accurate projection for your specific situation.
          </p>
          <button
            onClick={() => onNavigate('calculator')}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Calculator
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Understand the Math
          </h3>
          <p className="text-gray-600 mb-4">
            All our calculations are based on publicly available data. Review our methodology and sources.
          </p>
          <button
            onClick={() => onNavigate('methodology')}
            className="px-5 py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
          >
            View Methodology
          </button>
        </div>
      </div>

      {/* Section 7: Open source callout */}
      <div className="bg-gray-100 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Open Source & Community Driven
        </h3>
        <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
          This tool is free, open source, and not affiliated with any data center company or utility.
          Our goal is to provide objective information so communities can make informed decisions.
        </p>
        <a
          href="https://github.com/DougMackenzie/community-energy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  );
};

export default HomePage;
