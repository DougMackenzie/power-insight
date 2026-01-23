/**
 * Utility data compiled from public sources including EIA, utility filings, and annual reports
 * Data reflects 2024 figures where available
 *
 * Market Structure Types:
 * - 'regulated': Vertically integrated utility with state PUC oversight
 * - 'pjm': PJM Interconnection (capacity market, 2024 prices ~$270/MW-day)
 * - 'ercot': ERCOT Texas (energy-only market, no capacity market)
 * - 'miso': MISO (capacity market, lower prices than PJM)
 * - 'caiso': California ISO (partially deregulated)
 *
 * Cost Allocation Notes:
 * - Regulated markets: Infrastructure costs allocated through rate base, ~40% residential
 * - PJM markets: Capacity costs flow through retail suppliers, high volatility
 * - ERCOT: No capacity market, transmission costs allocated, more direct price signals
 */

export type MarketType = 'regulated' | 'pjm' | 'ercot' | 'miso' | 'caiso' | 'spp';

export interface MarketStructure {
  type: MarketType;
  hasCapacityMarket: boolean;
  // Base residential allocation for infrastructure costs (0-1)
  baseResidentialAllocation: number;
  // How much of capacity costs flow through to residential (0-1)
  capacityCostPassThrough: number;
  // Transmission cost allocation to residential (0-1)
  transmissionAllocation: number;
  // Whether utility owns generation (affects cost allocation)
  utilityOwnsGeneration: boolean;
  // 2024 capacity price if applicable ($/MW-day)
  capacityPrice2024?: number;
  // Notes on market-specific considerations
  notes: string;
}

export interface UtilityProfile {
  id: string;
  name: string;
  shortName: string;
  state: string;
  region: string;
  // Rate base data - residential customers served by utility
  residentialCustomers: number;
  totalCustomers: number;
  // System characteristics
  systemPeakMW: number;
  // Billing data
  averageMonthlyBill: number;
  averageMonthlyUsageKWh: number;
  // Market structure
  market: MarketStructure;
  // Data center context
  hasDataCenterActivity: boolean;
  dataCenterNotes?: string;
  // Default data center size for this utility (MW)
  defaultDataCenterMW: number;
  // Sources
  sources: string[];
}

// Market structure presets
const REGULATED_MARKET: MarketStructure = {
  type: 'regulated',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.40,
  capacityCostPassThrough: 0.40, // Through rate base
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true,
  notes: 'Vertically integrated utility. Infrastructure costs allocated through traditional rate base. State PUC sets rates based on cost of service study.'
};

const PJM_MARKET: MarketStructure = {
  type: 'pjm',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.35,
  capacityCostPassThrough: 0.50, // Higher pass-through due to capacity market
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  capacityPrice2024: 269.92, // $/MW-day from July 2024 auction
  notes: 'PJM capacity market. 2024 auction cleared at $269.92/MW-day (10x increase). Data centers attributed to 63% of price increase. Capacity costs flow through retail suppliers to customers.'
};

const ERCOT_MARKET: MarketStructure = {
  type: 'ercot',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.30,
  capacityCostPassThrough: 0.25, // Lower - energy-only market
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  notes: 'Energy-only market with no capacity payments. Price signals drive investment. $5,000/MWh cap. Lower baseline costs but more volatile. Transmission costs still allocated to ratepayers.'
};

const MISO_MARKET: MarketStructure = {
  type: 'miso',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.38,
  capacityCostPassThrough: 0.35,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true, // Many vertically integrated utilities in MISO
  capacityPrice2024: 30.00, // Lower than PJM
  notes: 'MISO capacity market with lower clearing prices than PJM. Many vertically integrated utilities still operate within MISO footprint.'
};

const SPP_MARKET: MarketStructure = {
  type: 'spp',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.40,
  capacityCostPassThrough: 0.40,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true,
  notes: 'Southwest Power Pool. Energy market but no mandatory capacity market. Many vertically integrated utilities. Resource adequacy through bilateral contracts.'
};

export const UTILITY_PROFILES: UtilityProfile[] = [
  // ============================================
  // REGULATED / VERTICALLY INTEGRATED UTILITIES
  // ============================================
  {
    id: 'pso-oklahoma',
    name: 'Public Service Company of Oklahoma (PSO)',
    shortName: 'PSO Oklahoma',
    state: 'Oklahoma',
    region: 'Southwest',
    residentialCustomers: 460000,
    totalCustomers: 575000,
    systemPeakMW: 4400,
    averageMonthlyBill: 130,
    averageMonthlyUsageKWh: 1100,
    market: { ...SPP_MARKET },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Multiple large data center proposals; PSO facing 31% power deficit by 2031 with 779MW of new large load requests',
    defaultDataCenterMW: 1000,
    sources: ['PSO 2024 IRP Report', 'Oklahoma Corporation Commission filings', 'AEP annual reports']
  },
  {
    id: 'duke-carolinas',
    name: 'Duke Energy Carolinas',
    shortName: 'Duke Carolinas',
    state: 'North Carolina / South Carolina',
    region: 'Southeast',
    residentialCustomers: 2507000,
    totalCustomers: 2926000,
    systemPeakMW: 20700,
    averageMonthlyBill: 135,
    averageMonthlyUsageKWh: 1000,
    market: { ...REGULATED_MARKET },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Growing data center presence in Charlotte metro area',
    defaultDataCenterMW: 1000,
    sources: ['Duke Energy 2024 annual report', 'NC Utilities Commission filings']
  },
  {
    id: 'duke-progress',
    name: 'Duke Energy Progress',
    shortName: 'Duke Progress',
    state: 'North Carolina / South Carolina',
    region: 'Southeast',
    residentialCustomers: 1400000,
    totalCustomers: 1700000,
    systemPeakMW: 13800,
    averageMonthlyBill: 132,
    averageMonthlyUsageKWh: 1000,
    market: { ...REGULATED_MARKET },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Serves Raleigh area with growing tech sector',
    defaultDataCenterMW: 800,
    sources: ['Duke Energy 2024 annual report', 'NC Utilities Commission filings']
  },
  {
    id: 'georgia-power',
    name: 'Georgia Power',
    shortName: 'Georgia Power',
    state: 'Georgia',
    region: 'Southeast',
    residentialCustomers: 2400000,
    totalCustomers: 2804000,
    systemPeakMW: 17100,
    averageMonthlyBill: 153,
    averageMonthlyUsageKWh: 1150,
    market: { ...REGULATED_MARKET },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Projecting 8,200 MW of load growth by 2030, including significant data center demand in Atlanta metro',
    defaultDataCenterMW: 1200,
    sources: ['Georgia Power 2024 Facts & Figures', 'Georgia PSC filings', 'Southern Company annual reports']
  },
  {
    id: 'aps-arizona',
    name: 'Arizona Public Service (APS)',
    shortName: 'APS Arizona',
    state: 'Arizona',
    region: 'Southwest',
    residentialCustomers: 1200000,
    totalCustomers: 1400000,
    systemPeakMW: 8212,
    averageMonthlyBill: 140,
    averageMonthlyUsageKWh: 1050,
    market: { ...REGULATED_MARKET },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Phoenix metro data center growth; projecting 40% peak demand growth to 13,000 MW by 2031',
    defaultDataCenterMW: 800,
    sources: ['APS 2024 peak demand records', 'Arizona Corporation Commission filings']
  },
  {
    id: 'nv-energy',
    name: 'NV Energy',
    shortName: 'NV Energy Nevada',
    state: 'Nevada',
    region: 'West',
    residentialCustomers: 610000,
    totalCustomers: 2400000,
    systemPeakMW: 9000,
    averageMonthlyBill: 125,
    averageMonthlyUsageKWh: 900,
    market: { ...REGULATED_MARKET },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data centers requesting to triple peak demand; 4,000+ MW of AI data center projects planned in Reno area',
    defaultDataCenterMW: 1500,
    sources: ['NV Energy company facts', 'Nevada PUC filings', 'Greenlink transmission project documents']
  },
  {
    id: 'xcel-colorado',
    name: 'Xcel Energy Colorado',
    shortName: 'Xcel Colorado',
    state: 'Colorado',
    region: 'Mountain West',
    residentialCustomers: 1400000,
    totalCustomers: 1600000,
    systemPeakMW: 7200,
    averageMonthlyBill: 105,
    averageMonthlyUsageKWh: 700,
    market: { ...REGULATED_MARKET },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data centers expected to drive 2/3 of new demand; 19% peak increase projected by 2031',
    defaultDataCenterMW: 600,
    sources: ['Xcel Energy Colorado rate filings', 'Colorado PUC documents']
  },

  // ============================================
  // AEP UTILITIES
  // ============================================
  {
    id: 'aep-ohio',
    name: 'AEP Ohio',
    shortName: 'AEP Ohio',
    state: 'Ohio',
    region: 'Midwest',
    residentialCustomers: 1200000, // ~80% of 1.5M total
    totalCustomers: 1500000,
    systemPeakMW: 12000,
    averageMonthlyBill: 135,
    averageMonthlyUsageKWh: 900,
    market: {
      ...PJM_MARKET,
      notes: 'AEP Ohio operates in PJM. Ohio is a deregulated retail market but AEP still owns transmission. 2024 PJM capacity price surge significantly impacts costs.'
    },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Ohio seeing significant data center growth; AEP proposed new rate class for data centers to PUCO',
    defaultDataCenterMW: 1000,
    sources: ['AEP Ohio rate filings', 'PUCO documents', 'PJM capacity auction results']
  },
  {
    id: 'aep-indiana-michigan',
    name: 'Indiana Michigan Power (I&M)',
    shortName: 'AEP I&M',
    state: 'Indiana / Michigan',
    region: 'Midwest',
    residentialCustomers: 480000, // Estimate based on service area
    totalCustomers: 600000,
    systemPeakMW: 5500,
    averageMonthlyBill: 130,
    averageMonthlyUsageKWh: 950,
    market: {
      ...PJM_MARKET,
      utilityOwnsGeneration: true, // I&M still owns generation including Cook Nuclear
      baseResidentialAllocation: 0.38,
      notes: 'I&M operates in PJM but remains vertically integrated with owned generation including Cook Nuclear Plant. Hybrid market structure.'
    },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Northeast Indiana and Fort Wayne area seeing industrial and data center growth',
    defaultDataCenterMW: 500,
    sources: ['Indiana Michigan Power rate filings', 'Indiana Utility Regulatory Commission documents']
  },
  {
    id: 'aep-appalachian',
    name: 'Appalachian Power (APCo)',
    shortName: 'AEP Appalachian',
    state: 'Virginia / West Virginia',
    region: 'Appalachian',
    residentialCustomers: 800000,
    totalCustomers: 1000000,
    systemPeakMW: 7000,
    averageMonthlyBill: 125,
    averageMonthlyUsageKWh: 1000,
    market: {
      ...PJM_MARKET,
      utilityOwnsGeneration: true,
      baseResidentialAllocation: 0.40,
      notes: 'Appalachian Power operates in PJM but WV remains traditionally regulated. Virginia portion affected by data center growth in Northern Virginia spillover.'
    },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Virginia portion seeing data center interest as Northern Virginia capacity constrained',
    defaultDataCenterMW: 600,
    sources: ['Appalachian Power rate filings', 'Virginia SCC documents', 'WV PSC documents']
  },
  {
    id: 'aep-swepco',
    name: 'Southwestern Electric Power (SWEPCO)',
    shortName: 'AEP SWEPCO',
    state: 'Arkansas / Louisiana / Texas',
    region: 'Southwest',
    residentialCustomers: 400000,
    totalCustomers: 540000,
    systemPeakMW: 4800,
    averageMonthlyBill: 120,
    averageMonthlyUsageKWh: 1100,
    market: {
      ...SPP_MARKET,
      notes: 'SWEPCO operates in SPP (energy market, no capacity market). Vertically integrated with state PUC regulation in AR, LA, and TX panhandle.'
    },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Less data center activity than other AEP territories',
    defaultDataCenterMW: 400,
    sources: ['SWEPCO rate filings', 'Arkansas PSC documents', 'Louisiana PSC documents']
  },

  // ============================================
  // PJM / ISO MARKET UTILITIES
  // ============================================
  {
    id: 'dominion-virginia',
    name: 'Dominion Energy Virginia',
    shortName: 'Dominion Virginia',
    state: 'Virginia',
    region: 'Mid-Atlantic',
    residentialCustomers: 2500000,
    totalCustomers: 2800000,
    systemPeakMW: 18000,
    averageMonthlyBill: 145,
    averageMonthlyUsageKWh: 1050,
    market: {
      ...PJM_MARKET,
      utilityOwnsGeneration: true, // Dominion still owns significant generation
      baseResidentialAllocation: 0.35,
      notes: 'Dominion operates in PJM but Virginia remains traditionally regulated. Data center capital of the world - 9GW DC peak forecast in 10 years. PJM capacity costs flow through but state regulates retail rates.'
    },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data center capital of the world; 933MW connected in 2023, forecasting 9GW DC peak in 10 years (25% system increase)',
    defaultDataCenterMW: 1500,
    sources: ['Dominion Energy 2024 IRP', 'Virginia SCC filings', 'JLARC Virginia Data Center Study 2024', 'PJM capacity auction results']
  },

  // ============================================
  // ENERGY-ONLY MARKETS
  // ============================================
  {
    id: 'ercot-texas',
    name: 'ERCOT (Texas Grid)',
    shortName: 'ERCOT Texas',
    state: 'Texas',
    region: 'Texas',
    residentialCustomers: 12000000,
    totalCustomers: 26000000,
    systemPeakMW: 85508,
    averageMonthlyBill: 140,
    averageMonthlyUsageKWh: 1100,
    market: {
      ...ERCOT_MARKET,
      notes: 'Energy-only market with no capacity payments. 46% of projected load growth from data centers. Lower baseline capacity costs but transmission costs still flow to ratepayers. Retail choice allows competitive pricing.'
    },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data centers account for 46% of projected load growth; demand projected to grow from 87 GW to 145 GW by 2031. 230GW of large load interconnection requests.',
    defaultDataCenterMW: 3000,
    sources: ['ERCOT load forecasts', 'EIA Texas electricity data', 'Texas PUC filings', 'Potomac Economics 2024 State of the Market']
  },

  // ============================================
  // CUSTOM OPTION
  // ============================================
  {
    id: 'custom',
    name: 'Custom / Enter Your Own',
    shortName: 'Custom',
    state: '',
    region: '',
    residentialCustomers: 500000,
    totalCustomers: 600000,
    systemPeakMW: 4000,
    averageMonthlyBill: 144,
    averageMonthlyUsageKWh: 865,
    market: { ...REGULATED_MARKET },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Enter your own utility parameters',
    defaultDataCenterMW: 1000,
    sources: ['EIA national averages']
  }
];

// Helper to get utility by ID
export function getUtilityById(id: string): UtilityProfile | undefined {
  return UTILITY_PROFILES.find(u => u.id === id);
}

// Get utilities grouped by region
export function getUtilitiesByRegion(): Record<string, UtilityProfile[]> {
  return UTILITY_PROFILES.reduce((acc, utility) => {
    const region = utility.region || 'Other';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(utility);
    return acc;
  }, {} as Record<string, UtilityProfile[]>);
}

// Get utilities grouped by market type
export function getUtilitiesByMarketType(): Record<MarketType, UtilityProfile[]> {
  return UTILITY_PROFILES.reduce((acc, utility) => {
    const marketType = utility.market.type;
    if (!acc[marketType]) {
      acc[marketType] = [];
    }
    acc[marketType].push(utility);
    return acc;
  }, {} as Record<MarketType, UtilityProfile[]>);
}

// Get market-adjusted residential allocation
export function getMarketAdjustedAllocation(profile: UtilityProfile, dcPeakCoincidence: number): number {
  const market = profile.market;

  // Base allocation from market structure
  let allocation = market.baseResidentialAllocation;

  // Adjust for capacity market costs if applicable
  if (market.hasCapacityMarket && market.capacityPrice2024) {
    // Higher capacity prices mean more cost pressure on all ratepayers
    // PJM 2024 prices are ~10x historical, so adjust allocation upward
    const priceMultiplier = market.capacityPrice2024 / 30; // Normalize to historical ~$30/MW-day
    const capacityAdjustment = Math.min(0.10, (priceMultiplier - 1) * 0.02);
    allocation += capacityAdjustment * market.capacityCostPassThrough;
  }

  // Energy-only markets have lower allocation for capacity-related costs
  if (market.type === 'ercot') {
    // In ERCOT, large loads more directly face market prices
    // Residential allocation for infrastructure is lower
    allocation *= 0.85;
  }

  // Clamp to reasonable bounds
  return Math.max(0.20, Math.min(0.55, allocation));
}
