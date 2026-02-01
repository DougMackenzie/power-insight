/**
 * TariffDetails Component
 *
 * Displays tariff information for the selected utility including
 * demand charges, energy rates, protection rating, and source citation.
 */

import { useCalculator } from '../hooks/useCalculator';

// Protection rating badge colors
const PROTECTION_COLORS = {
  High: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  Mid: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  Low: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

// ISO/RTO info labels
const ISO_INFO = {
  'PJM': { name: 'PJM Interconnection', hasCapacity: true, note: 'Capacity market (2024: $269.92/MW-day)' },
  'MISO': { name: 'MISO', hasCapacity: true, note: 'Capacity market' },
  'ERCOT': { name: 'ERCOT', hasCapacity: false, note: 'Energy-only, 4CP transmission' },
  'SPP': { name: 'Southwest Power Pool', hasCapacity: false, note: 'No capacity market' },
  'NYISO': { name: 'New York ISO', hasCapacity: true, note: 'Capacity market' },
  'ISO-NE': { name: 'ISO New England', hasCapacity: true, note: 'Forward Capacity Market' },
  'CAISO': { name: 'California ISO', hasCapacity: false, note: 'Resource Adequacy program' },
  'None': { name: 'Regulated', hasCapacity: false, note: 'Vertically integrated utility' },
};

// Format currency with appropriate precision
const formatRate = (value, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A';
  return `$${value.toFixed(decimals)}`;
};

// Format percentage
const formatPercent = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value}%`;
};

// Rate row component
const RateRow = ({ label, value, unit, tooltip }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600" title={tooltip}>{label}</span>
    <span className="text-sm font-medium text-gray-900">
      {value} <span className="text-gray-500 text-xs">{unit}</span>
    </span>
  </div>
);

// Protection badge component
const ProtectionBadge = ({ rating, score }) => {
  const colors = PROTECTION_COLORS[rating] || PROTECTION_COLORS.Low;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} ${colors.border} border`}>
      <span className={`text-sm font-medium ${colors.text}`}>{rating} Protection</span>
      <span className={`text-xs ${colors.text} opacity-75`}>({score}/26)</span>
    </div>
  );
};

// ERCOT 4CP indicator
const ERCOT4CPIndicator = () => (
  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <div className="flex items-start gap-2">
      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-sm font-medium text-blue-800">ERCOT 4CP Transmission</p>
        <p className="text-xs text-blue-700 mt-1">
          Transmission costs allocated based on contribution to 4 summer coincident peaks (June-Sept).
          Flexible loads can reduce 4CP exposure by curtailing during peak intervals.
        </p>
      </div>
    </div>
  </div>
);

const TariffDetails = ({ collapsed = false }) => {
  const { tariffData, selectedUtilityProfile, selectedUtilityId } = useCalculator();

  // Don't show for custom utility
  if (selectedUtilityId === 'custom' || !tariffData) {
    return null;
  }

  const isoInfo = ISO_INFO[tariffData.isoRto] || ISO_INFO['None'];
  const isERCOT = tariffData.isoRto === 'ERCOT' || tariffData.is4CP;

  if (collapsed) {
    // Compact view - just show key info
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{tariffData.tariffName || tariffData.rateSchedule}</p>
            <p className="text-xs text-gray-500">{tariffData.utility}</p>
          </div>
          <ProtectionBadge rating={tariffData.protectionRating} score={tariffData.protectionScore} />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-600">
          <span>Blended: {formatRate(tariffData.blendedRate)}/MWh</span>
          <span>Peak Demand: {formatRate(tariffData.peakDemandCharge)}/MW-mo</span>
          {isERCOT && <span className="text-blue-600">4CP Allocation</span>}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tariff Details</h3>
          <p className="text-sm text-gray-500">{selectedUtilityProfile?.name}</p>
        </div>
        <ProtectionBadge rating={tariffData.protectionRating} score={tariffData.protectionScore} />
      </div>

      {/* Tariff name and schedule */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-900">{tariffData.tariffName || 'Rate Schedule'}</p>
        <p className="text-xs text-gray-500">{tariffData.rateSchedule}</p>
        {tariffData.effectiveDate && (
          <p className="text-xs text-gray-400 mt-1">Effective: {tariffData.effectiveDate}</p>
        )}
      </div>

      {/* Rate structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demand Charges */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Demand Charges</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <RateRow
              label="Peak Demand"
              value={formatRate(tariffData.peakDemandCharge)}
              unit="/MW-month"
              tooltip="On-peak demand charge"
            />
            {tariffData.offPeakDemandCharge > 0 && (
              <RateRow
                label="Off-Peak Demand"
                value={formatRate(tariffData.offPeakDemandCharge)}
                unit="/MW-month"
                tooltip="Off-peak demand charge"
              />
            )}
            {tariffData.minimumDemandPct > 0 && (
              <RateRow
                label="Minimum Demand"
                value={formatPercent(tariffData.minimumDemandPct)}
                unit="of contract"
                tooltip="Minimum billable demand as percentage of contract demand"
              />
            )}
          </div>
        </div>

        {/* Energy Rates */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Energy Rates</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <RateRow
              label="Peak Energy"
              value={formatRate(tariffData.energyRatePeak)}
              unit="/MWh"
              tooltip="On-peak energy rate"
            />
            {tariffData.energyRateOffPeak > 0 && (
              <RateRow
                label="Off-Peak Energy"
                value={formatRate(tariffData.energyRateOffPeak)}
                unit="/MWh"
                tooltip="Off-peak energy rate"
              />
            )}
            {tariffData.fuelAdjustment > 0 && (
              <RateRow
                label="Fuel Adjustment"
                value={formatRate(tariffData.fuelAdjustment)}
                unit="/MWh"
                tooltip="Fuel cost adjustment rider"
              />
            )}
            <RateRow
              label="Blended Rate"
              value={formatRate(tariffData.blendedRate)}
              unit="/MWh"
              tooltip="All-in blended energy rate"
            />
          </div>
        </div>
      </div>

      {/* ISO/RTO Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{isoInfo.name}</p>
            <p className="text-xs text-gray-500">{isoInfo.note}</p>
          </div>
          {isoInfo.hasCapacity && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
              Capacity Market
            </span>
          )}
        </div>
      </div>

      {/* ERCOT 4CP indicator */}
      {isERCOT && <ERCOT4CPIndicator />}

      {/* Protection details tooltip */}
      {tariffData.protectionScore > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          <details>
            <summary className="cursor-pointer hover:text-gray-700">Protection mechanisms</summary>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1">
              {tariffData.minimumDemandPct > 0 && (
                <p>Minimum demand: {tariffData.minimumDemandPct}% of contract</p>
              )}
              {tariffData.demandRatchetPct > 0 && (
                <p>Demand ratchet: {tariffData.demandRatchetPct}% of prior peak</p>
              )}
              {tariffData.takeOrPay && <p>Take-or-pay provision</p>}
              {tariffData.initialTermYears > 0 && (
                <p>Initial term: {tariffData.initialTermYears} years</p>
              )}
            </div>
          </details>
        </div>
      )}

      {/* Source citation */}
      {tariffData.source && (
        <p className="mt-4 text-xs text-gray-400">
          Source: {tariffData.source}
        </p>
      )}
    </div>
  );
};

export default TariffDetails;
