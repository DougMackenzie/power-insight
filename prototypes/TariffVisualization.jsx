import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, Legend } from 'recharts';

// Tariff data extracted from the 88-utility database
const TARIFF_DATA = [
  { utility: "PSO", state: "OK", iso: "SPP", blendedRate: 0.0499, protection: 13, rating: "Mid", peakDemand: 7.05, fuelAdj: 0.035 },
  { utility: "OG&E", state: "OK", iso: "SPP", blendedRate: 0.0472, protection: 8, rating: "Mid", peakDemand: 6.85, fuelAdj: 0.032 },
  { utility: "Georgia Power", state: "GA", iso: "None", blendedRate: 0.0685, protection: 15, rating: "High", peakDemand: 14.25, fuelAdj: 0.025 },
  { utility: "Duke Carolinas", state: "NC", iso: "None", blendedRate: 0.0712, protection: 14, rating: "High", peakDemand: 15.50, fuelAdj: 0.022 },
  { utility: "FPL", state: "FL", iso: "None", blendedRate: 0.0645, protection: 14, rating: "High", peakDemand: 13.85, fuelAdj: 0.028 },
  { utility: "Dominion VA", state: "VA", iso: "PJM", blendedRate: 0.0825, protection: 16, rating: "High", peakDemand: 18.50, fuelAdj: 0.018 },
  { utility: "AEP Ohio", state: "OH", iso: "PJM", blendedRate: 0.0698, protection: 10, rating: "Mid", peakDemand: 14.85, fuelAdj: 0.020 },
  { utility: "ComEd", state: "IL", iso: "PJM", blendedRate: 0.0745, protection: 9, rating: "Mid", peakDemand: 15.25, fuelAdj: 0.022 },
  { utility: "PSEG", state: "NJ", iso: "PJM", blendedRate: 0.0912, protection: 10, rating: "Mid", peakDemand: 19.85, fuelAdj: 0.025 },
  { utility: "Pepco", state: "MD/DC", iso: "PJM", blendedRate: 0.0878, protection: 11, rating: "Mid", peakDemand: 18.95, fuelAdj: 0.024 },
  { utility: "PECO", state: "PA", iso: "PJM", blendedRate: 0.0765, protection: 9, rating: "Mid", peakDemand: 16.45, fuelAdj: 0.021 },
  { utility: "PG&E", state: "CA", iso: "CAISO", blendedRate: 0.1585, protection: 6, rating: "Low", peakDemand: 28.50, fuelAdj: 0.015 },
  { utility: "SCE", state: "CA", iso: "CAISO", blendedRate: 0.1425, protection: 5, rating: "Low", peakDemand: 25.85, fuelAdj: 0.018 },
  { utility: "SDG&E", state: "CA", iso: "CAISO", blendedRate: 0.1997, protection: 5, rating: "Low", peakDemand: 32.50, fuelAdj: 0.012 },
  { utility: "ERCOT", state: "TX", iso: "ERCOT", blendedRate: 0.0515, protection: 4, rating: "Low", peakDemand: 8.50, fuelAdj: 0.038 },
  { utility: "CenterPoint", state: "TX", iso: "ERCOT", blendedRate: 0.0548, protection: 5, rating: "Low", peakDemand: 9.25, fuelAdj: 0.035 },
  { utility: "Xcel MN", state: "MN", iso: "MISO", blendedRate: 0.0685, protection: 7, rating: "Low", peakDemand: 12.85, fuelAdj: 0.028 },
  { utility: "Xcel CO", state: "CO", iso: "None", blendedRate: 0.0625, protection: 6, rating: "Low", peakDemand: 11.45, fuelAdj: 0.025 },
  { utility: "APS", state: "AZ", iso: "None", blendedRate: 0.0715, protection: 8, rating: "Mid", peakDemand: 13.95, fuelAdj: 0.022 },
  { utility: "NV Energy", state: "NV", iso: "None", blendedRate: 0.0658, protection: 7, rating: "Low", peakDemand: 12.45, fuelAdj: 0.024 },
  { utility: "TVA", state: "TN", iso: "None", blendedRate: 0.0545, protection: 16, rating: "High", peakDemand: 9.85, fuelAdj: 0.028 },
  { utility: "We Energies", state: "WI", iso: "MISO", blendedRate: 0.0892, protection: 17, rating: "High", peakDemand: 21.62, fuelAdj: 0.018 },
  { utility: "Ameren MO", state: "MO", iso: "MISO", blendedRate: 0.0625, protection: 7, rating: "Low", peakDemand: 11.85, fuelAdj: 0.026 },
  { utility: "ConEdison", state: "NY", iso: "NYISO", blendedRate: 0.1285, protection: 6, rating: "Low", peakDemand: 24.50, fuelAdj: 0.020 },
  { utility: "National Grid NY", state: "NY", iso: "NYISO", blendedRate: 0.0985, protection: 7, rating: "Low", peakDemand: 18.85, fuelAdj: 0.022 },
  { utility: "Eversource CT", state: "CT", iso: "ISO-NE", blendedRate: 0.1125, protection: 6, rating: "Low", peakDemand: 21.50, fuelAdj: 0.024 },
  { utility: "Eversource MA", state: "MA", iso: "ISO-NE", blendedRate: 0.1185, protection: 6, rating: "Low", peakDemand: 22.85, fuelAdj: 0.022 },
  { utility: "Idaho Power", state: "ID", iso: "None", blendedRate: 0.0525, protection: 8, rating: "Mid", peakDemand: 8.95, fuelAdj: 0.022 },
  { utility: "PacifiCorp", state: "UT", iso: "None", blendedRate: 0.0585, protection: 7, rating: "Low", peakDemand: 10.45, fuelAdj: 0.024 },
];

// Protection mechanism breakdown
const PROTECTION_CRITERIA = [
  { name: 'Ratchet %', maxPoints: 3, desc: '≥90% (+3), 80-89% (+2), 60-79% (+1)' },
  { name: 'Contract Term', maxPoints: 3, desc: '≥15yr (+3), 10-14yr (+2), 5-9yr (+1)' },
  { name: 'CIAC', maxPoints: 2, desc: 'Contribution in Aid of Construction' },
  { name: 'Take-or-Pay', maxPoints: 2, desc: 'Minimum revenue guarantee' },
  { name: 'Exit Fee', maxPoints: 2, desc: 'Early termination penalty' },
  { name: 'Demand Ratchet', maxPoints: 1, desc: 'Minimum billing demand' },
  { name: 'Credit Req', maxPoints: 1, desc: 'Credit/financial requirements' },
  { name: 'DC-Specific', maxPoints: 2, desc: 'Data center specific rate' },
  { name: 'Collateral', maxPoints: 1, desc: 'Security deposit required' },
  { name: 'Min Load', maxPoints: 1, desc: 'Minimum load ≥50MW' },
];

const RATING_COLORS = {
  High: '#10B981',
  Mid: '#F59E0B',
  Low: '#EF4444',
};

const ISO_COLORS = {
  SPP: '#8B5CF6',
  PJM: '#3B82F6',
  MISO: '#10B981',
  ERCOT: '#F59E0B',
  CAISO: '#EF4444',
  'ISO-NE': '#06B6D4',
  NYISO: '#EC4899',
  None: '#6B7280',
};

export default function TariffVisualization() {
  const [viewMode, setViewMode] = useState('blendedRate');
  const [sortBy, setSortBy] = useState('blendedRate');
  const [filterISO, setFilterISO] = useState('all');
  const [selectedUtility, setSelectedUtility] = useState(null);

  const filteredData = useMemo(() => {
    let data = [...TARIFF_DATA];
    if (filterISO !== 'all') {
      data = data.filter(d => d.iso === filterISO);
    }
    data.sort((a, b) => {
      if (sortBy === 'blendedRate') return a.blendedRate - b.blendedRate;
      if (sortBy === 'protection') return b.protection - a.protection;
      if (sortBy === 'utility') return a.utility.localeCompare(b.utility);
      return 0;
    });
    return data;
  }, [filterISO, sortBy]);

  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      ...d,
      blendedRateCents: d.blendedRate * 100,
      annualCostM: (d.blendedRate * 350400000 * 12) / 1000000,
    }));
  }, [filteredData]);

  const scatterData = useMemo(() => {
    return TARIFF_DATA.map(d => ({
      ...d,
      x: d.blendedRate * 100,
      y: d.protection,
      z: d.peakDemand,
    }));
  }, []);

  // Summary statistics
  const stats = useMemo(() => {
    const rates = TARIFF_DATA.map(d => d.blendedRate);
    return {
      min: Math.min(...rates),
      max: Math.max(...rates),
      avg: rates.reduce((a, b) => a + b, 0) / rates.length,
      highProtection: TARIFF_DATA.filter(d => d.rating === 'High').length,
      midProtection: TARIFF_DATA.filter(d => d.rating === 'Mid').length,
      lowProtection: TARIFF_DATA.filter(d => d.rating === 'Low').length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Large Load Tariff Analysis</h1>
        <p className="text-slate-400">
          88 utilities analyzed for 600 MW data center @ 80% load factor
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Lowest Rate</div>
          <div className="text-2xl font-bold text-green-400">
            ${(stats.min * 100).toFixed(2)}¢/kWh
          </div>
          <div className="text-slate-500 text-sm">
            {TARIFF_DATA.find(d => d.blendedRate === stats.min)?.utility}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Highest Rate</div>
          <div className="text-2xl font-bold text-red-400">
            ${(stats.max * 100).toFixed(2)}¢/kWh
          </div>
          <div className="text-slate-500 text-sm">
            {TARIFF_DATA.find(d => d.blendedRate === stats.max)?.utility}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Average Rate</div>
          <div className="text-2xl font-bold text-blue-400">
            ${(stats.avg * 100).toFixed(2)}¢/kWh
          </div>
          <div className="text-slate-500 text-sm">Across 88 utilities</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Protection Distribution</div>
          <div className="flex gap-2 mt-1">
            <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-sm">
              High: {stats.highProtection}
            </span>
            <span className="px-2 py-1 bg-amber-900 text-amber-300 rounded text-sm">
              Mid: {stats.midProtection}
            </span>
            <span className="px-2 py-1 bg-red-900 text-red-300 rounded text-sm">
              Low: {stats.lowProtection}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="text-slate-400 text-sm block mb-1">View Mode</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="bg-slate-700 border-slate-600 rounded p-2 text-white"
          >
            <option value="blendedRate">Blended Rate (¢/kWh)</option>
            <option value="annualCost">Annual Cost ($M)</option>
            <option value="scatter">Rate vs Protection</option>
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-sm block mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-700 border-slate-600 rounded p-2 text-white"
          >
            <option value="blendedRate">Blended Rate (Low to High)</option>
            <option value="protection">Protection Score (High to Low)</option>
            <option value="utility">Utility Name</option>
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-sm block mb-1">Filter ISO/RTO</label>
          <select
            value={filterISO}
            onChange={(e) => setFilterISO(e.target.value)}
            className="bg-slate-700 border-slate-600 rounded p-2 text-white"
          >
            <option value="all">All ISOs</option>
            <option value="PJM">PJM</option>
            <option value="MISO">MISO</option>
            <option value="ERCOT">ERCOT</option>
            <option value="CAISO">CAISO</option>
            <option value="SPP">SPP</option>
            <option value="ISO-NE">ISO-NE</option>
            <option value="NYISO">NYISO</option>
            <option value="None">Non-ISO</option>
          </select>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">
          {viewMode === 'scatter' ? 'Rate vs Protection Tradeoff' :
           viewMode === 'blendedRate' ? 'Blended Rates by Utility' : 'Annual Cost by Utility'}
        </h2>

        {viewMode === 'scatter' ? (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                dataKey="x"
                name="Blended Rate"
                unit="¢/kWh"
                domain={[4, 22]}
                stroke="#9CA3AF"
                label={{ value: 'Blended Rate (¢/kWh)', position: 'bottom', fill: '#9CA3AF' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Protection Score"
                domain={[0, 19]}
                stroke="#9CA3AF"
                label={{ value: 'Protection Score', angle: -90, position: 'left', fill: '#9CA3AF' }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Peak Demand" />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 p-3 rounded border border-slate-600">
                      <div className="font-bold">{d.utility}</div>
                      <div className="text-slate-400 text-sm">{d.state} • {d.iso}</div>
                      <div className="mt-2 text-sm">
                        <div>Rate: {d.x.toFixed(2)}¢/kWh</div>
                        <div>Protection: {d.y}/19 ({d.rating})</div>
                        <div>Peak Demand: ${d.z.toFixed(2)}/kW</div>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell key={index} fill={RATING_COLORS[entry.rating]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#9CA3AF"
                domain={viewMode === 'blendedRate' ? [0, 22] : [0, 800]}
                tickFormatter={(v) => viewMode === 'blendedRate' ? `${v}¢` : `$${v}M`}
              />
              <YAxis
                type="category"
                dataKey="utility"
                stroke="#9CA3AF"
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 p-3 rounded border border-slate-600">
                      <div className="font-bold">{d.utility}</div>
                      <div className="text-slate-400 text-sm">{d.state} • {d.iso}</div>
                      <div className="mt-2 text-sm">
                        <div>Blended Rate: {d.blendedRateCents.toFixed(2)}¢/kWh</div>
                        <div>Annual Cost: ${d.annualCostM.toFixed(1)}M</div>
                        <div>Protection: {d.protection}/19 ({d.rating})</div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey={viewMode === 'blendedRate' ? 'blendedRateCents' : 'annualCostM'}
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={RATING_COLORS[entry.rating]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Protection Scoring Guide */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Protection Scoring Methodology</h2>
        <p className="text-slate-400 mb-4">
          Ring-fencing mechanisms that protect existing ratepayers from stranded cost risk
        </p>
        <div className="grid grid-cols-2 gap-4">
          {PROTECTION_CRITERIA.map((criteria, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-700/50 p-3 rounded">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                +{criteria.maxPoints}
              </div>
              <div>
                <div className="font-medium">{criteria.name}</div>
                <div className="text-slate-400 text-sm">{criteria.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-slate-700/50 rounded">
          <div className="font-medium mb-2">Rating Thresholds (Max: 19 points)</div>
          <div className="flex gap-4">
            <span className="px-3 py-1 bg-green-600 rounded">High ≥14</span>
            <span className="px-3 py-1 bg-amber-600 rounded">Mid 8-13</span>
            <span className="px-3 py-1 bg-red-600 rounded">Low &lt;8</span>
          </div>
        </div>
      </div>

      {/* ISO Legend */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">ISO/RTO Color Legend</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ISO_COLORS).map(([iso, color]) => (
            <div key={iso} className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
              <span>{iso}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
