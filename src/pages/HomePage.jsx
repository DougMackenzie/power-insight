/**
 * HomePage Component
 *
 * Landing page with overview of the tool - designed for homeowners and community leaders.
 */

import TrajectoryChart from '../components/TrajectoryChart';
import SummaryCards from '../components/SummaryCards';
import { useCalculator } from '../hooks/useCalculator';
import { SCENARIOS, formatCurrency, formatMW } from '../data/constants';

const HomePage = ({ onNavigate }) => {
  const { summary, utility, dataCenter, projectionYears } = useCalculator();

  // Calculate key metrics for display
  const baselineFinalBill = summary.finalYearBills.baseline;
  const firmLoadDiff = summary.finalYearBills.unoptimized - baselineFinalBill;
  const flexLoadDiff = summary.finalYearBills.flexible - baselineFinalBill;
  const dispatchableDiff = summary.finalYearBills.dispatchable - baselineFinalBill;

  return (
    <div className="space-y-8">
      {/* Hero section - Community focused */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-8 text-white">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            What Does a Data Center Mean for Your Electric Bill?
          </h1>
          <p className="text-lg text-blue-100 mb-6">
            A new data center has been proposed in your community. As a homeowner or community leader,
            you deserve to understand how this could affect the electricity costs for you and your neighbors.
            This tool shows you the real numbers.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('calculator')}
              className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Calculate My Impact
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

      {/* The Bottom Line - Clear summary for homeowners */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            The Bottom Line for Your Household
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Based on a {formatMW(dataCenter.capacityMW)} data center in a utility territory that serves {utility.residentialCustomers.toLocaleString()} residential customers,
            here's what your monthly bill could look like in {projectionYears} years:
          </p>
        </div>

        {/* Bill comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Current Bill */}
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Your Bill Today</p>
            <p className="text-3xl font-bold text-gray-900">${utility.averageMonthlyBill}</p>
            <p className="text-xs text-gray-500 mt-1">per month</p>
          </div>

          {/* Baseline (No DC) */}
          <div className="p-5 bg-gray-100 rounded-xl border border-gray-300 text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Without Data Center</p>
            <p className="text-3xl font-bold text-gray-700">${baselineFinalBill.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">in {projectionYears} years</p>
            <p className="text-xs text-gray-400 mt-2">Normal rate increases</p>
          </div>

          {/* Firm Load (Worst) */}
          <div className="p-5 bg-red-50 rounded-xl border-2 border-red-200 text-center">
            <p className="text-sm font-medium text-red-700 mb-1">With Firm Load DC</p>
            <p className="text-3xl font-bold text-red-600">${summary.finalYearBills.unoptimized.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">in {projectionYears} years</p>
            <p className={`text-sm font-semibold mt-2 ${firmLoadDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {firmLoadDiff >= 0 ? '+' : ''}{firmLoadDiff.toFixed(2)}/mo vs baseline
            </p>
          </div>

          {/* Dispatchable (Best) */}
          <div className="p-5 bg-green-50 rounded-xl border-2 border-green-300 text-center ring-2 ring-green-400 ring-offset-2">
            <p className="text-sm font-medium text-green-700 mb-1">With Optimized DC</p>
            <p className="text-3xl font-bold text-green-600">${summary.finalYearBills.dispatchable.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">in {projectionYears} years</p>
            <p className={`text-sm font-semibold mt-2 ${dispatchableDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {dispatchableDiff >= 0 ? '+' : ''}{dispatchableDiff.toFixed(2)}/mo vs baseline
            </p>
          </div>
        </div>

        {/* Key takeaway */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-900">Why does it matter HOW the data center operates?</p>
              <p className="text-sm text-amber-800 mt-1">
                The difference between a "firm load" data center (always on, no flexibility) and an "optimized"
                data center (with demand response and backup generation) could mean{' '}
                <strong>
                  {summary.savingsVsUnoptimized.dispatchable >= 0
                    ? `$${summary.savingsVsUnoptimized.dispatchable.toFixed(2)} less per month`
                    : `$${Math.abs(summary.savingsVsUnoptimized.dispatchable).toFixed(2)} more per month`}
                </strong>{' '}
                on your electric bill. Over {projectionYears} years, that's{' '}
                <strong>
                  {formatCurrency(Math.abs(summary.cumulativeHouseholdCosts.unoptimized - summary.cumulativeHouseholdCosts.dispatchable))}
                </strong>{' '}
                per household.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What determines the impact? */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          What Determines the Impact on Your Bill?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Infrastructure Costs</h3>
            <p className="text-sm text-gray-600">
              New power lines, substations, and generation capacity cost money. These costs get spread
              across all ratepayers based on regulatory formulas.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Revenue from Data Center</h3>
            <p className="text-sm text-gray-600">
              Data centers pay demand charges and energy costs. This revenue helps offset infrastructure
              investments and can actually reduce costs for other customers.
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Peak Demand Impact</h3>
            <p className="text-sm text-gray-600">
              When data centers can reduce usage during peak times (demand response), they don't add as
              much to the grid's maximum load - meaning less expensive infrastructure is needed.
            </p>
          </div>
        </div>
      </div>

      {/* Full trajectory chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Your Monthly Bill Over Time: Four Possible Futures
          </h2>
          <p className="text-gray-600">
            See how your electricity bill could change over the next {projectionYears} years under
            different scenarios. Click any scenario in the legend to show or hide it.
          </p>
        </div>

        <TrajectoryChart height={400} />

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg" style={{ backgroundColor: SCENARIOS.baseline.colorLight }}>
            <p className="text-xs text-gray-600">No Data Center</p>
            <p className="text-lg font-bold" style={{ color: SCENARIOS.baseline.color }}>
              ${baselineFinalBill.toFixed(0)}/mo
            </p>
            <p className="text-xs text-gray-500">baseline</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: SCENARIOS.unoptimized.colorLight }}>
            <p className="text-xs text-gray-600">Firm Load DC</p>
            <p className="text-lg font-bold" style={{ color: SCENARIOS.unoptimized.color }}>
              ${summary.finalYearBills.unoptimized.toFixed(0)}/mo
            </p>
            <p className={`text-xs ${firmLoadDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {firmLoadDiff >= 0 ? '+' : ''}{firmLoadDiff.toFixed(2)} vs baseline
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: SCENARIOS.flexible.colorLight }}>
            <p className="text-xs text-gray-600">Flexible Load DC</p>
            <p className="text-lg font-bold" style={{ color: SCENARIOS.flexible.color }}>
              ${summary.finalYearBills.flexible.toFixed(0)}/mo
            </p>
            <p className={`text-xs ${flexLoadDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {flexLoadDiff >= 0 ? '+' : ''}{flexLoadDiff.toFixed(2)} vs baseline
            </p>
          </div>
          <div className="p-3 rounded-lg border-2 border-green-300" style={{ backgroundColor: SCENARIOS.dispatchable.colorLight }}>
            <p className="text-xs text-gray-600">Optimized DC</p>
            <p className="text-lg font-bold" style={{ color: SCENARIOS.dispatchable.color }}>
              ${summary.finalYearBills.dispatchable.toFixed(0)}/mo
            </p>
            <p className={`text-xs ${dispatchableDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {dispatchableDiff >= 0 ? '+' : ''}{dispatchableDiff.toFixed(2)} vs baseline
            </p>
          </div>
        </div>
      </div>

      {/* Questions for community leaders */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">
          Questions to Ask About a Data Center Proposal
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">For the Developer:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Will your facility participate in demand response programs?
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                What percentage of load can be curtailed during peak periods?
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Will you have onsite generation that can support the grid?
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                What demand charges will you be paying?
              </li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">For the Utility/Regulators:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                How will infrastructure costs be allocated to ratepayers?
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Are there interconnection requirements for flexibility?
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                What rate structure will the data center be on?
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                How will residential allocation change over time?
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to action */}
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

      {/* Open source callout */}
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
