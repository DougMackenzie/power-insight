/**
 * FlexiblePage Component
 *
 * Explains how demand response and load flexibility benefits everyone.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useCalculator } from '../hooks/useCalculator';
import { SCENARIOS, formatCurrency, WORKLOAD_TYPES, calculateAggregateFlexibility } from '../data/constants';

const FlexiblePage = ({ onNavigate }) => {
  const { trajectories, utility, dataCenter, projectionYears } = useCalculator();

  const baselineFinal = trajectories.baseline[trajectories.baseline.length - 1];
  const unoptimizedFinal = trajectories.unoptimized[trajectories.unoptimized.length - 1];
  const flexibleFinal = trajectories.flexible[trajectories.flexible.length - 1];

  const savingsVsUnoptimized = unoptimizedFinal.monthlyBill - flexibleFinal.monthlyBill;
  const savingsVsBaseline = flexibleFinal.monthlyBill - baselineFinal.monthlyBill;

  const flexMetrics = trajectories.flexible[trajectories.flexible.length - 1].metrics;
  const aggregateFlexibility = calculateAggregateFlexibility();

  // Workload flexibility breakdown
  const workloadData = Object.entries(WORKLOAD_TYPES).map(([key, wl]) => ({
    name: wl.name,
    percentOfLoad: wl.percentOfLoad * 100,
    flexibility: wl.flexibility * 100,
    flexibleMW: dataCenter.capacityMW * wl.percentOfLoad * wl.flexibility,
  }));

  // Comparison chart data
  const comparisonData = trajectories.baseline.map((point, i) => ({
    year: point.year,
    baseline: point.monthlyBill,
    unoptimized: trajectories.unoptimized[i].monthlyBill,
    flexible: trajectories.flexible[i].monthlyBill,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="rounded-2xl p-8"
        style={{ backgroundColor: SCENARIOS.flexible.colorLight }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: SCENARIOS.flexible.color }}
          />
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Scenario 3
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Flexible Load: Higher Capacity, Lower Impact
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          With flexibility, data centers achieve <strong>95% load factor</strong> (vs 80% for firm)
          while only contributing <strong>75% to peak demand</strong> (25% curtailable, validated by EPRI DCFlex 2024).
          This means the same grid can support 33% MORE data center capacity - generating more jobs,
          more tax revenue, and more utility revenue to offset costs for everyone.
        </p>
      </div>

      {/* Impact summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border-2 border-amber-200 text-center">
          <p className="text-sm text-gray-600 mb-1">Monthly Savings vs Firm Load</p>
          <p className="text-3xl font-bold" style={{ color: SCENARIOS.flexible.color }}>
            ${savingsVsUnoptimized.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">per household</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-1">Load Flexibility</p>
          <p className="text-3xl font-bold text-gray-900">
            {(aggregateFlexibility * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500">{flexMetrics?.curtailableMW?.toFixed(0)} MW can shift</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-1">Peak Contribution</p>
          <p className="text-3xl font-bold text-gray-900">
            {flexMetrics?.effectivePeakMW?.toFixed(0) || (dataCenter.capacityMW * 0.8).toFixed(0)} MW
          </p>
          <p className="text-sm text-gray-500">vs {dataCenter.capacityMW} MW firm</p>
        </div>
      </div>

      {/* How flexibility works */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          How Data Center Flexibility Works
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">What Can Shift</h3>
            <div className="space-y-3">
              {workloadData.map((wl, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{wl.name}</span>
                      <span className="text-gray-500">{wl.flexibility.toFixed(0)}% flexible</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${wl.flexibility}%`,
                          backgroundColor: SCENARIOS.flexible.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-3">Why Flexibility Matters (EPRI DCFlex 2024)</h3>
            <p className="text-amber-800 text-sm mb-3">
              The grid is sized for peak demand, which only occurs ~100 hours/year. Flexible loads
              can curtail 25% during these critical hours (validated by DCFlex demonstration), meaning the SAME grid infrastructure
              can support 33% MORE total data center capacity.
            </p>
            <div className="bg-white p-3 rounded border border-amber-200">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-600">Firm Load</p>
                  <p className="text-lg font-bold text-red-600">80% LF</p>
                  <p className="text-xs text-gray-500">100% at peak</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Flexible Load</p>
                  <p className="text-lg font-bold" style={{ color: SCENARIOS.flexible.color }}>95% LF</p>
                  <p className="text-xs text-gray-500">75% at peak</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Benefits of Flexible Load
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lower Infrastructure Costs</h3>
            <p className="text-sm text-gray-600">
              By reducing peak demand contribution from {dataCenter.capacityMW} MW to {flexMetrics?.effectivePeakMW?.toFixed(0)} MW,
              the utility can defer expensive transmission and generation investments.
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Grid Reliability</h3>
            <p className="text-sm text-gray-600">
              During grid emergencies, the data center can reduce load within minutes,
              helping prevent blackouts. This is like having a "virtual power plant" that
              can respond instantly.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Capacity Value</h3>
            <p className="text-sm text-gray-600">
              Demand response has real value - utilities pay for it because it's often cheaper
              than building peaker plants. This value can be shared with all ratepayers.
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Renewable Integration</h3>
            <p className="text-sm text-gray-600">
              Flexible loads can ramp up when solar and wind are abundant (and cheap) and
              ramp down when they're not. This helps integrate more clean energy.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Cost Trajectory Comparison
        </h2>
        <p className="text-gray-600 mb-6">
          The flexible scenario (amber) lands between baseline and firm load.
        </p>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value) => [`$${value.toFixed(2)}/mo`]}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="baseline"
              stroke={SCENARIOS.baseline.color}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Baseline"
            />
            <Line
              type="monotone"
              dataKey="unoptimized"
              stroke={SCENARIOS.unoptimized.color}
              strokeWidth={2}
              dot={false}
              name="Firm Load"
            />
            <Line
              type="monotone"
              dataKey="flexible"
              stroke={SCENARIOS.flexible.color}
              strokeWidth={3}
              dot={false}
              name="Flexible Load"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Can we do better? */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          Can We Do Even Better?
        </h3>
        <p className="text-green-800 mb-4">
          Demand response is powerful, but what if the data center could also <em>generate</em> power
          during peak congestion? Onsite generation (natural gas or dual-fuel) can provide backup
          power AND help the grid during the most critical hours.
        </p>
        <button
          onClick={() => onNavigate('dispatchable')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          See Flexible + Dispatchable →
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          onClick={() => onNavigate('unoptimized')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back: Firm Load
        </button>
        <button
          onClick={() => onNavigate('dispatchable')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          Next: Flex + Generation
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FlexiblePage;
