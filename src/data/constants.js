/**
 * Community Energy Cost Calculator - Constants and Default Values
 *
 * Based on the mathematical framework from the original research:
 * - FIRM scenario: Data center as 100% firm load (adds to peak, lower LF)
 * - FLEX scenario: Data center with flexibility (doesn't add fully to peak, higher LF)
 *
 * Key insight: With flex load, MORE total capacity can be added to the same grid
 * because the flexible load can curtail during peak periods.
 */

// ============================================
// CORE SCENARIO PARAMETERS (from original research)
// ============================================

// The original model compares two approaches:
// FIRM: 4 GW of data centers operating as firm load (must serve at all times)
// FLEX: 5 GW of data centers with flexibility (can curtail during peaks)
// Both scenarios work within the SAME grid constraints

// Based on EPRI DCFlex research (2024): 25% sustained reduction achievable
export const SCENARIO_PARAMS = {
  firm: {
    capacityMW: 4000,          // 4 GW of firm data center capacity
    loadFactor: 0.80,          // 80% effective load factor (firm = lower efficiency)
    peakCoincidence: 1.0,      // 100% contributes to system peak
    description: 'Traditional firm load - adds directly to peak demand',
  },
  flex: {
    capacityMW: 5333,          // 5.3 GW with flexibility (33% MORE capacity with 25% curtailable)
    loadFactor: 0.95,          // 95% effective load factor (flex = higher efficiency)
    peakCoincidence: 0.75,     // Only 75% at peak (25% curtailable - DCFlex validated)
    curtailablePercent: 0.25,  // 25% can be curtailed during system peaks
    description: 'Flexible load - higher capacity without adding to peak',
  },
};

// ============================================
// DEFAULT COMMUNITY/UTILITY PARAMETERS
// ============================================

// Based on PSO (Public Service Company of Oklahoma) as reference
// PSO serves ~560k customers with ~4GW peak demand

export const DEFAULT_UTILITY = {
  name: 'PSO-sized Utility',

  // Customer base
  residentialCustomers: 560000,      // Number of residential accounts
  commercialCustomers: 85000,        // Number of commercial accounts
  industrialCustomers: 5000,         // Number of industrial accounts

  // Current rates and bills
  averageMonthlyBill: 130,           // $ average monthly residential bill
  averageMonthlyUsage: 900,          // kWh average monthly residential usage

  // System characteristics (pre-data center)
  // KEY INPUT: System peak determines how significant the DC load is
  preDCSystemEnergyGWh: 20000,       // GWh annual system energy pre-DC
  residentialEnergyShare: 0.35,      // Residential is 35% of system energy
  systemPeakMW: 4000,                // MW current system peak demand (e.g., PSO ~4GW)

  // Rate base and cost allocation
  // Residential share DECREASES as large loads are added (they absorb fixed costs)
  baseResidentialAllocation: 0.40,   // Starting residential allocation
  allocationDeclineRate: 0.02,       // 2% decline per year with new load
};

// ============================================
// DATA CENTER RATE STRUCTURE
// ============================================

export const DC_RATE_STRUCTURE = {
  // Demand charges - what DC pays per MW of peak demand
  demandChargePerMWMonth: 9050,      // $/MW-month (from PJM/MISO market rates)

  // Energy margin - utility's margin on energy sales to DC
  energyMarginPerMWh: 4.88,          // $/MWh (typical wholesale spread)

  // These create REVENUE for the utility, offsetting costs to other ratepayers
};

// ============================================
// INFRASTRUCTURE COST PARAMETERS
// ============================================

export const INFRASTRUCTURE_COSTS = {
  // Transmission costs for new capacity
  transmissionCostPerMW: 350000,     // $ per MW (EIA/FERC data)
  transmissionLeadTime: 5,           // Years to build

  // Distribution costs
  distributionCostPerMW: 150000,     // $ per MW of distribution upgrades

  // Capacity/generation costs
  capacityCostPerMWYear: 150000,     // $/MW-year for capacity procurement
  peakerCostPerMW: 1200000,          // $ per MW if building new peakers

  // Baseline infrastructure upgrade rate
  annualBaselineUpgradePercent: 0.015, // 1.5% annual infrastructure replacement
  avgRateBasePerCustomer: 3500,        // $ rate base per residential customer
};

// ============================================
// DEFAULT DATA CENTER (user-adjustable)
// ============================================

// Default: 2 GW data center campus (significant but realistic)
// Range: 500 MW to 10 GW to cover various scenarios

export const DEFAULT_DATA_CENTER = {
  // Default shows a 2 GW campus - significant load for most utilities
  capacityMW: 2000,                  // MW nameplate capacity (2 GW default)

  // Firm load characteristics
  firmLoadFactor: 0.80,              // 80% LF when operating as firm
  firmPeakCoincidence: 1.0,          // 100% adds to peak

  // Flexible load characteristics (based on EPRI DCFlex 2024 research)
  // DCFlex Phoenix demo achieved 25% sustained reduction, up to 40%
  flexLoadFactor: 0.95,              // 95% LF when operating flexibly
  flexPeakCoincidence: 0.75,         // Only 75% at peak (25% curtailable - DCFlex validated)
  flexibleLoadPercent: 0.35,         // 35% of load can shift (training, batch) - conservative vs 90% preemptible

  // Dispatchable generation (Scenario 4)
  onsiteGenerationMW: 400,           // MW of onsite generation (20% of capacity)
  generationAvailability: 0.95,      // 95% availability during peaks
  generationCostPerMWh: 85,          // $/MWh marginal cost to run

  // Rate structure
  demandChargeRate: 9050,            // $/MW-month (matches DC_RATE_STRUCTURE)
  energyMargin: 4.88,                // $/MWh margin to utility
};

// Slider ranges for UI
export const DC_CAPACITY_RANGE = {
  min: 500,       // 500 MW minimum
  max: 10000,     // 10 GW maximum
  step: 100,      // 100 MW increments
  default: 2000,  // 2 GW default
};

export const UTILITY_PEAK_RANGE = {
  min: 1000,      // 1 GW minimum (small utility)
  max: 50000,     // 50 GW maximum (large ISO)
  step: 500,      // 500 MW increments
  default: 4000,  // 4 GW default (PSO-sized)
};

// ============================================
// SCENARIO DEFINITIONS (4 trajectories)
// ============================================

export const SCENARIOS = {
  baseline: {
    id: 'baseline',
    name: 'Baseline',
    shortName: 'No New Load',
    description: 'Current cost trajectory with normal infrastructure aging',
    color: '#6B7280', // gray
    colorLight: '#E5E7EB',
  },
  unoptimized: {
    id: 'unoptimized',
    name: 'Firm Load',
    shortName: '80% LF, 100% Peak',
    description: 'Data center as firm load: lower utilization, full peak contribution',
    color: '#DC2626', // red
    colorLight: '#FEE2E2',
  },
  flexible: {
    id: 'flexible',
    name: 'Flexible Load',
    shortName: '95% LF, 75% Peak',
    description: 'With demand response: higher utilization, 25% curtailable (DCFlex validated)',
    color: '#F59E0B', // amber
    colorLight: '#FEF3C7',
  },
  dispatchable: {
    id: 'dispatchable',
    name: 'Flex + Dispatchable',
    shortName: 'DR + Generation',
    description: 'Demand response plus onsite generation during system peaks',
    color: '#10B981', // green
    colorLight: '#D1FAE5',
  },
};

// ============================================
// TIME PARAMETERS
// ============================================

export const TIME_PARAMS = {
  projectionYears: 15,               // Years to project forward
  baseYear: 2025,                    // Starting year

  // Inflation and escalation
  generalInflation: 0.025,           // 2.5% general inflation
  electricityInflation: 0.03,        // 3% electricity cost inflation

  // Peak period parameters
  peakHoursPerYear: 100,             // Hours considered "peak" for planning
  criticalPeakHours: 20,             // Top 20 hours drive capacity planning
};

// ============================================
// WORKLOAD FLEXIBILITY BREAKDOWN
// ============================================

// Based on EPRI DCFlex research (2024): 90% of workloads can be preempted,
// 25-40% power reduction achievable during peak events
// Sources: IEEE Spectrum, arXiv:2507.00909, Latitude Media/Databricks
export const WORKLOAD_TYPES = {
  training: {
    name: 'AI Training',
    percentOfLoad: 0.30,
    flexibility: 0.60,    // DCFlex: training is highly deferrable
    description: 'Large model training jobs - deferrable to off-peak hours',
  },
  batchProcessing: {
    name: 'Batch Processing',
    percentOfLoad: 0.25,
    flexibility: 0.80,    // DCFlex: ~90% of batch workloads preemptible
    description: 'Non-real-time batch jobs - highly shiftable',
  },
  realtimeInference: {
    name: 'Real-time Inference',
    percentOfLoad: 0.35,
    flexibility: 0.10,    // DCFlex Flex 0 tier: strict SLA requirements
    description: 'Latency-sensitive requests - must respond instantly',
  },
  coreInfrastructure: {
    name: 'Core Infrastructure',
    percentOfLoad: 0.10,
    flexibility: 0.05,    // Always-on systems
    description: 'Networking, storage, cooling controls - always on',
  },
};

// Calculate aggregate flexibility from workload mix
// With updated values: 0.30*0.60 + 0.25*0.80 + 0.35*0.10 + 0.10*0.05 = 0.18 + 0.20 + 0.035 + 0.005 = ~42%
// This is conservative vs DCFlex finding that 90% of workloads can be preempted
export const calculateAggregateFlexibility = (workloadTypes = WORKLOAD_TYPES) => {
  let totalFlex = 0;
  Object.values(workloadTypes).forEach(w => {
    totalFlex += w.percentOfLoad * w.flexibility;
  });
  return totalFlex; // ~42% for default mix (conservative vs 90% preemptible finding)
};

// ============================================
// COST ALLOCATION METHODOLOGY
// ============================================

// Explanation: When large industrial loads are added, they absorb a share of
// fixed costs. This REDUCES the burden on residential customers over time.
// The allocation depends on the regulatory methodology used.

export const ALLOCATION_METHODS = {
  volumetric: {
    id: 'volumetric',
    name: 'Volumetric (per kWh)',
    description: 'Costs allocated based on energy consumption',
    residentialShare: 0.35,          // Residential typically 35% of energy
    notes: 'Large DC load significantly dilutes residential share',
  },
  demandBased: {
    id: 'demandBased',
    name: 'Demand-Based (per kW)',
    description: 'Costs allocated based on contribution to peak demand',
    residentialShare: 0.45,          // Residential typically 45% of peak
    notes: 'Firm DC adds more to peak than flexible DC',
  },
  customerBased: {
    id: 'customerBased',
    name: 'Customer-Based',
    description: 'Costs allocated equally per customer',
    residentialShare: 0.85,          // Residential is ~85% of customers
    notes: 'Less affected by large loads',
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid (Typical)',
    description: 'Weighted combination used in most rate cases',
    residentialShare: 0.40,          // Blended starting point
    notes: 'Most common regulatory approach',
  },
};

// ============================================
// REVENUE OFFSET CALCULATIONS
// ============================================

// Key insight: Data centers PAY demand charges and energy margins
// This creates REVENUE that offsets infrastructure costs

export const calculateDCRevenueOffset = (dcCapacityMW, loadFactor, peakCoincidence, years = 1) => {
  const { demandChargePerMWMonth, energyMarginPerMWh } = DC_RATE_STRUCTURE;

  // Annual demand charge revenue (based on coincident peak contribution)
  const coincidentPeakMW = dcCapacityMW * peakCoincidence;
  const annualDemandRevenue = coincidentPeakMW * demandChargePerMWMonth * 12;

  // Annual energy margin revenue
  const annualMWh = dcCapacityMW * loadFactor * 8760;
  const annualEnergyMargin = annualMWh * energyMarginPerMWh;

  return {
    demandRevenue: annualDemandRevenue * years,
    energyMargin: annualEnergyMargin * years,
    total: (annualDemandRevenue + annualEnergyMargin) * years,
    perYear: annualDemandRevenue + annualEnergyMargin,
  };
};

// ============================================
// DISPLAY FORMATTING
// ============================================

export const formatCurrency = (value, decimals = 0) => {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals > 0 ? decimals : 1)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals > 0 ? decimals : 0)}k`;
  }
  return `$${value.toFixed(decimals)}`;
};

export const formatPercent = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatMW = (value) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} GW`;
  }
  return `${value.toFixed(0)} MW`;
};

// ============================================
// NATIONAL DATA CENTER STATISTICS
// ============================================

export const NATIONAL_DC_STATS = {
  // Current state (2024-2025)
  currentCapacityGW: 50,
  currentElectricityShare: 0.044, // 4.4%
  currentTWh: 176, // 2023 consumption

  // Projections
  projected2030ShareLow: 0.06,
  projected2030ShareHigh: 0.09,
  projected2035CapacityGW: 150,
  growthMultiplier2035: 6, // 6x from 2024

  // Equivalents
  gwPerNuclearPlant: 1, // 1 GW ≈ 1 nuclear plant
  homesPerGW: 750000, // ~750k-1M homes per GW

  // Demand backlog
  totalUSRequestedGW: 1000, // GW requested from US utilities

  // PJM capacity market impact
  pjmCapacityPrice2024: 269.92, // $/MW-day
  pjmCapacityPricePrior: 28.92, // $/MW-day (prior year)
  pjmPriceIncreaseMultiple: 10, // 10x increase
  dcAttributionPercent: 0.63, // 63% of increase attributed to DC growth
};

// State-level data center statistics
export const STATE_DC_DATA = {
  VA: {
    capacityGW: 5.6,
    stateElectricityShare: 0.25, // 25% of Virginia's electricity
    notes: 'Data center capital of the world, 70% of global internet traffic flows through Loudoun County',
    projected2035GW: 9,
  },
  TX: {
    capacityGW: 4.2,
    loadGrowthShare: 0.46, // 46% of ERCOT projected load growth
    notes: 'ERCOT energy-only market with 4CP transmission allocation',
  },
  OH: {
    capacityGW: 1.2,
    notes: 'Emerging frontier as Virginia reaches capacity constraints',
  },
  AZ: {
    capacityGW: 1.8,
    notes: 'Phoenix metro data center growth',
  },
  GA: {
    capacityGW: 1.5,
    notes: 'Atlanta metro growing tech sector',
  },
  NC: {
    capacityGW: 1.3,
    notes: 'Charlotte and Research Triangle growth',
  },
};
