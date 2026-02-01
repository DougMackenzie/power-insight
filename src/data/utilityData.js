/**
 * Utility data generated from the tariff database (88 utilities)
 *
 * This file provides utility profiles for the calculator, with data sourced from:
 * - E3 "Tailored for Scale" Study (2025)
 * - State PUC tariff filings
 * - Utility rate schedules and annual reports
 * - EIA Form 861 data
 *
 * Last Updated: 2026-01-01
 */

import { CALCULATOR_TARIFFS, getAllTariffs, getTariffsByRegion } from './calculatorTariffs';

// ============================================
// MARKET STRUCTURE PRESETS
// ============================================

const REGULATED_MARKET = {
  type: 'regulated',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.40,
  capacityCostPassThrough: 0.40,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true,
  notes: 'Vertically integrated utility. Infrastructure costs allocated through traditional rate base.'
};

const PJM_MARKET = {
  type: 'pjm',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.35,
  capacityCostPassThrough: 0.50,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  capacityPrice2024: 269.92,
  notes: 'PJM capacity market. 2024 auction cleared at $269.92/MW-day (10x increase).'
};

const ERCOT_MARKET = {
  type: 'ercot',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.30,
  capacityCostPassThrough: 0.25,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  notes: 'Energy-only market with no capacity payments. 4CP transmission allocation.'
};

const MISO_MARKET = {
  type: 'miso',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.38,
  capacityCostPassThrough: 0.35,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true,
  capacityPrice2024: 30.00,
  notes: 'MISO capacity market with lower clearing prices than PJM.'
};

const SPP_MARKET = {
  type: 'spp',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.40,
  capacityCostPassThrough: 0.40,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true,
  notes: 'Southwest Power Pool. Energy market but no mandatory capacity market.'
};

const NYISO_MARKET = {
  type: 'nyiso',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.35,
  capacityCostPassThrough: 0.45,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  capacityPrice2024: 180.00,
  notes: 'NYISO capacity market. Zone J (NYC) has highest prices.'
};

const ISONE_MARKET = {
  type: 'iso-ne',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.35,
  capacityCostPassThrough: 0.45,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  capacityPrice2024: 150.00,
  notes: 'ISO New England Forward Capacity Market.'
};

const CAISO_MARKET = {
  type: 'caiso',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.35,
  capacityCostPassThrough: 0.40,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  notes: 'CAISO with Resource Adequacy program. High renewable penetration.'
};

// Map ISO/RTO to market structure
const ISO_TO_MARKET = {
  'PJM': PJM_MARKET,
  'ERCOT': ERCOT_MARKET,
  'MISO': MISO_MARKET,
  'SPP': SPP_MARKET,
  'NYISO': NYISO_MARKET,
  'ISO-NE': ISONE_MARKET,
  'CAISO': CAISO_MARKET,
  'None': REGULATED_MARKET,
};

// ============================================
// UTILITY DATA ESTIMATES
// ============================================

// Estimated utility system data (from EIA 861 and public filings)
const UTILITY_SYSTEM_DATA = {
  'tva-tn': { residentialCustomers: 4500000, systemPeakMW: 33000, avgBill: 125 },
  'public-service-company-of-oklahoma-pso-ok': { residentialCustomers: 460000, systemPeakMW: 4400, avgBill: 130 },
  'dominion-energy-virginia-va': { residentialCustomers: 2500000, systemPeakMW: 18000, avgBill: 145 },
  'duke-energy-carolinas-nc': { residentialCustomers: 2507000, systemPeakMW: 20700, avgBill: 135 },
  'georgia-power-ga': { residentialCustomers: 2400000, systemPeakMW: 17100, avgBill: 153 },
  'aep-ohio-oh': { residentialCustomers: 1200000, systemPeakMW: 12000, avgBill: 135 },
  'ercot-market-via-rep-tx': { residentialCustomers: 12000000, systemPeakMW: 85508, avgBill: 140 },
  'nv-energy-nv': { residentialCustomers: 610000, systemPeakMW: 9000, avgBill: 125 },
  'arizona-public-service-aps-az': { residentialCustomers: 1200000, systemPeakMW: 8212, avgBill: 140 },
  'xcel-energy-co-co': { residentialCustomers: 1400000, systemPeakMW: 7200, avgBill: 105 },
  'florida-power-and-light-fpl-fl': { residentialCustomers: 5200000, systemPeakMW: 28000, avgBill: 150 },
  'pacific-gas-and-electric-pgande-ca': { residentialCustomers: 5500000, systemPeakMW: 32000, avgBill: 190 },
  'southern-california-edison-sce-ca': { residentialCustomers: 5000000, systemPeakMW: 24000, avgBill: 200 },
  'conedison-ny': { residentialCustomers: 3400000, systemPeakMW: 13500, avgBill: 180 },
  'comed-exelon-il': { residentialCustomers: 3900000, systemPeakMW: 22000, avgBill: 95 },
  'aep-indiana-michigan-power-in': { residentialCustomers: 480000, systemPeakMW: 5500, avgBill: 130 },
  'aep-appalachian-power-va': { residentialCustomers: 800000, systemPeakMW: 7000, avgBill: 125 },
  'swepco-aep-tx': { residentialCustomers: 400000, systemPeakMW: 4800, avgBill: 120 },
  // Default estimates for utilities not in the list
};

// Default system data estimates based on region
const REGION_DEFAULTS = {
  'Southeast': { residentialCustomers: 1500000, systemPeakMW: 12000, avgBill: 140 },
  'Mid-Atlantic': { residentialCustomers: 1200000, systemPeakMW: 10000, avgBill: 145 },
  'Midwest': { residentialCustomers: 800000, systemPeakMW: 6000, avgBill: 120 },
  'Texas': { residentialCustomers: 2000000, systemPeakMW: 15000, avgBill: 135 },
  'West': { residentialCustomers: 1000000, systemPeakMW: 8000, avgBill: 150 },
  'Plains': { residentialCustomers: 400000, systemPeakMW: 3500, avgBill: 115 },
  'Mountain West': { residentialCustomers: 500000, systemPeakMW: 4000, avgBill: 110 },
  'Northeast': { residentialCustomers: 1200000, systemPeakMW: 8000, avgBill: 160 },
  'Southwest': { residentialCustomers: 900000, systemPeakMW: 7000, avgBill: 130 },
};

/**
 * Build a utility profile from tariff data
 */
function buildUtilityProfile(tariff) {
  // Get system data estimates
  const systemData = UTILITY_SYSTEM_DATA[tariff.id] ||
    REGION_DEFAULTS[tariff.region] ||
    { residentialCustomers: 500000, systemPeakMW: 4000, avgBill: 130 };

  // Get market structure
  const market = ISO_TO_MARKET[tariff.isoRto] || REGULATED_MARKET;

  // Estimate default DC capacity based on system size
  const defaultDataCenterMW = Math.round(systemData.systemPeakMW * 0.25 / 100) * 100 || 500;

  return {
    id: tariff.id,
    name: tariff.utility,
    shortName: tariff.utilityShort,
    state: tariff.state,
    region: tariff.region,
    isoRto: tariff.isoRto,

    // System characteristics
    residentialCustomers: systemData.residentialCustomers,
    totalCustomers: Math.round(systemData.residentialCustomers * 1.2),
    systemPeakMW: systemData.systemPeakMW,
    averageMonthlyBill: systemData.avgBill,
    averageMonthlyUsageKWh: Math.round(systemData.avgBill / (tariff.blendedRate / 1000)),

    // Market structure
    market: { ...market },

    // Tariff data link
    tariffId: tariff.id,
    tariffName: tariff.tariffName,
    rateSchedule: tariff.rateSchedule,
    blendedRate: tariff.blendedRate,
    protectionRating: tariff.protectionRating,
    protectionScore: tariff.protectionScore,

    // Data center activity
    hasDataCenterActivity: tariff.protectionRating === 'High' || tariff.initialTermYears >= 10,
    dataCenterNotes: tariff.notes || '',
    defaultDataCenterMW,
  };
}

// ============================================
// GENERATE UTILITY PROFILES FROM TARIFF DATA
// ============================================

/**
 * All utility profiles generated from the tariff database
 */
export const UTILITY_PROFILES = [
  // Add Custom option at the beginning
  {
    id: 'custom',
    name: 'Custom / Enter Your Own',
    shortName: 'Custom',
    state: '',
    region: '',
    isoRto: 'None',
    residentialCustomers: 500000,
    totalCustomers: 600000,
    systemPeakMW: 4000,
    averageMonthlyBill: 130,
    averageMonthlyUsageKWh: 900,
    market: { ...REGULATED_MARKET },
    tariffId: null,
    hasDataCenterActivity: false,
    dataCenterNotes: 'Enter your own utility parameters',
    defaultDataCenterMW: 1000,
  },
  // Generate profiles from all tariffs
  ...Object.values(CALCULATOR_TARIFFS)
    .filter(t => t.id !== 'custom')
    .map(buildUtilityProfile)
    .sort((a, b) => a.blendedRate - b.blendedRate),
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getUtilityById(id) {
  return UTILITY_PROFILES.find(u => u.id === id);
}

export function getUtilitiesByRegion() {
  return UTILITY_PROFILES.reduce((acc, utility) => {
    const region = utility.region || 'Other';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(utility);
    return acc;
  }, {});
}

export function getUtilitiesByMarketType() {
  return UTILITY_PROFILES.reduce((acc, utility) => {
    const marketType = utility.market?.type || 'other';
    if (!acc[marketType]) {
      acc[marketType] = [];
    }
    acc[marketType].push(utility);
    return acc;
  }, {});
}

export function getUtilitiesByISO() {
  return UTILITY_PROFILES.reduce((acc, utility) => {
    const iso = utility.isoRto || 'None';
    if (!acc[iso]) {
      acc[iso] = [];
    }
    acc[iso].push(utility);
    return acc;
  }, {});
}

/**
 * Get utilities grouped by ISO with display labels
 */
export function getUtilitiesGroupedByISO() {
  const ISO_LABELS = {
    'PJM': 'PJM Interconnection',
    'ERCOT': 'ERCOT (Texas)',
    'MISO': 'MISO',
    'SPP': 'Southwest Power Pool',
    'NYISO': 'New York ISO',
    'ISO-NE': 'ISO New England',
    'CAISO': 'California ISO',
    'None': 'Regulated / Non-ISO',
  };

  const grouped = getUtilitiesByISO();

  return Object.entries(ISO_LABELS)
    .filter(([iso]) => grouped[iso]?.length > 0)
    .map(([iso, label]) => ({
      label,
      iso,
      utilities: grouped[iso].sort((a, b) => a.blendedRate - b.blendedRate),
    }));
}

/**
 * Get utilities grouped by region with display labels
 */
export function getUtilitiesGroupedByRegion() {
  const grouped = getUtilitiesByRegion();

  return Object.entries(grouped)
    .filter(([region]) => region !== 'Other' && region !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, utilities]) => ({
      label: region,
      utilities: utilities.sort((a, b) => a.blendedRate - b.blendedRate),
    }));
}
