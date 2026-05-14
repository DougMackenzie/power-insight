/**
 * Power Insight - Constants and Default Values
 *
 * TypeScript version migrated from original React app
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ScenarioParams {
    capacityMW: number;
    loadFactor: number;
    peakCoincidence: number;
    curtailablePercent?: number;
    description: string;
}

export type MarketType = 'regulated' | 'pjm' | 'ercot' | 'miso' | 'caiso' | 'spp' | 'nyiso' | 'tva';

// ============================================
// NON-BYPASSABLE CHARGE (NBC) CONSTANTS
// ============================================

/**
 * States with significant Non-Bypassable Charges (NBCs)
 * These charges are pass-throughs to fund state programs, not utility margin.
 * Examples: CA wildfire funds, PPP, PCIA, nuclear decommissioning;
 *           NY system benefit charges, renewable portfolio standards
 */
export const HIGH_NBC_STATES: string[] = ['CA', 'NY', 'CT', 'MA', 'RI', 'NH'];

/**
 * State name to 2-letter code mapping for NBC detection
 * Handles both full state names ('California') and 2-letter codes ('CA')
 */
const STATE_NAME_TO_CODE: Record<string, string> = {
  'california': 'CA', 'ca': 'CA',
  'new york': 'NY', 'ny': 'NY',
  'connecticut': 'CT', 'ct': 'CT',
  'massachusetts': 'MA', 'ma': 'MA',
  'rhode island': 'RI', 'ri': 'RI',
  'new hampshire': 'NH', 'nh': 'NH',
};

/**
 * Normalize state identifier to 2-letter code for NBC detection
 * Converts full state names ('New York') to 2-letter codes ('NY')
 * Returns uppercase 2-letter code if recognized, otherwise returns input uppercased
 */
export function normalizeStateCode(state: string | undefined): string | undefined {
  if (!state) return undefined;
  const lower = state.toLowerCase().trim();
  return STATE_NAME_TO_CODE[lower] || state.toUpperCase();
}

/**
 * Per-state energy margin caps ($/MWh) — refined per Gemini methodology review (2026-05-14).
 * California's PCIA + wildfire fund + DWR bond pressures push pass-throughs to ~$50/MWh,
 * while smaller-NBC states like NH/RI rarely exceed $25/MWh in true non-bypassables.
 * Replaces the prior blanket $40/MWh cap.
 */
export const MAX_ENERGY_MARGIN_BY_STATE: Record<string, number> = {
    CA: 50,
    NY: 40,
    CT: 35,
    MA: 35,
    RI: 30,
    NH: 25,
};

// Backward-compat default (used as fallback for any high-NBC state not explicitly mapped)
export const MAX_ENERGY_MARGIN_CONTRIBUTION = 40;

/**
 * Look up the per-state energy margin cap. Returns the state-specific cap if mapped,
 * otherwise falls back to the default. Use this everywhere the model previously
 * referenced MAX_ENERGY_MARGIN_CONTRIBUTION directly.
 */
export function getMaxEnergyMargin(state: string | undefined): number {
    const normalized = normalizeStateCode(state);
    if (normalized && normalized in MAX_ENERGY_MARGIN_BY_STATE) {
        return MAX_ENERGY_MARGIN_BY_STATE[normalized];
    }
    return MAX_ENERGY_MARGIN_CONTRIBUTION;
}

/**
 * Interconnection cost structure for calculations
 * Separates CIAC-recovered costs from network upgrade costs
 */
export interface InterconnectionCosts {
    // Portion of transmission cost covered by CIAC (0-1)
    ciacRecoveryFraction: number;
    // Network upgrade cost per MW that may be socialized ($/MW)
    networkUpgradeCostPerMW: number;
}

export interface Utility {
    name: string;
    // 2-letter state code (e.g., 'CA', 'NY') for NBC detection
    state?: string;
    residentialCustomers: number;
    commercialCustomers: number;
    industrialCustomers: number;
    averageMonthlyBill: number;
    averageMonthlyUsage: number;
    preDCSystemEnergyGWh: number;
    residentialEnergyShare: number;
    systemPeakMW: number;
    baseResidentialAllocation: number;
    allocationDeclineRate: number;
    // Market structure fields (optional, default to regulated)
    marketType?: MarketType;
    hasCapacityMarket?: boolean;
    capacityCostPassThrough?: number;
    capacityPrice2024?: number;
    // Capacity market endogenous pricing fields
    // Total generation capacity available to serve load (MW)
    totalGenerationCapacityMW?: number;
    // Current reserve margin before DC addition ((capacity - peak) / peak)
    currentReserveMargin?: number;
    // Interconnection cost structure (CIAC vs network upgrades)
    interconnection?: InterconnectionCosts;
    // Wholesale energy cost ($/MWh) for margin calculations
    marginalEnergyCost?: number;
}

export interface DataCenter {
    capacityMW: number;
    firmLoadFactor: number;
    firmPeakCoincidence: number;
    flexLoadFactor: number;
    flexPeakCoincidence: number;
    flexibleLoadPercent: number;
    onsiteGenerationMW: number;
    generationAvailability: number;
    generationCostPerMWh: number;
    demandChargeRate: number;
    energyMargin: number;
    // Capital cost of onsite generation (for reference/transparency, not used in ratepayer calcs)
    generationCapitalCostPerMW?: number;
    // v2.2 RESERVED — flex curtailment modeling. Defaults false; today the
    // calculator assumes flex DCs still hit full interconnection for billing
    // (Feb 2026 fix). When 8760 hourly simulation lands, this flag will gate
    // a curtailment-based capacity-cost path that consumes the MISO seasonal
    // split (`miso_summer` / `miso_non_summer` in ISO_CAPACITY_DATA). Until
    // then it has no behavioral effect and no caller should set it true.
    // Tracked: docs/METHODOLOGY.md §3.4 + §6, wiki log PM-7 (2026-05-14).
    flexCurtailmentEnabled?: boolean;
}

export interface Scenario {
    id: string;
    name: string;
    shortName: string;
    description: string;
    color: string;
    colorLight: string;
}

export interface WorkloadType {
    name: string;
    percentOfLoad: number;
    flexibility: number;
    description: string;
}

// ============================================
// SUPPLY CURVE FOR ENDOGENOUS CAPACITY PRICING
// Models non-linear dynamics where large loads consume reserve margin
// and trigger exponential price spikes in capacity markets
// ============================================

export interface SupplyCurveSlope {
    margin: number;         // Reserve margin threshold
    priceMultiplier: number; // Multiplier applied to CONE at this margin
}

export const SUPPLY_CURVE = {
    // Simplified PJM-style Variable Resource Requirement (VRR) Curve
    targetReserveMargin: 0.15,  // 15% target reserve margin
    costOfNewEntry: 280,        // $/MW-day (CONE) - Cost of New Entry
    // Price multipliers at different reserve margin levels
    // As reserve margin decreases, capacity prices spike non-linearly
    slopes: [
        { margin: 0.25, priceMultiplier: 0.05 },  // Very abundant: ~$14/MW-day
        { margin: 0.20, priceMultiplier: 0.10 },  // Abundant: ~$28/MW-day
        { margin: 0.15, priceMultiplier: 1.00 },  // Target: ~$280/MW-day (CONE)
        { margin: 0.10, priceMultiplier: 1.50 },  // Scarcity: ~$420/MW-day
        { margin: 0.05, priceMultiplier: 2.50 },  // Severe scarcity: ~$700/MW-day
        { margin: 0.00, priceMultiplier: 4.00 },  // Emergency: ~$1,120/MW-day
    ] as SupplyCurveSlope[],
    // Scarcity threshold - below this margin, prices spike dramatically
    scarcityThreshold: 0.10,
    // Critical threshold - below this, system reliability is at risk
    criticalThreshold: 0.05,
};

// ============================================
// ISO/RTO CAPACITY DATA
// For capacity market reserve margin calculations
// Capacity markets operate at ISO level, not individual utility level
// ============================================

export interface ISOCapacityData {
    totalPeakMW: number;           // ISO-wide peak demand (MW)
    totalCapacityMW: number;       // ISO-wide installed capacity (MW)
    targetReserveMargin: number;   // Target reserve margin (e.g., 0.15 = 15%)
    capacityPrice2024: number;     // Current capacity price ($/MW-day)
    // Hard regulatory price ceiling for capacity-market clearing prices ($/MW-day).
    // When the market is already at this cap, additional load cannot raise the
    // clearing price further — the ISO instead falls back to reliability actions
    // (load shedding, conservation voltage reduction, emergency procurement).
    // Per Gemini methodology review (2026-05-14): the supply curve interpolation
    // MUST clamp at this value to avoid projecting un-capped socialization costs
    // that contradict the legal mechanics of the auction.
    // - PJM: FERC-imposed BRA price cap ($333.44/MW-day, hit in 2026/27 + 2027/28 BRAs)
    // - MISO/NYISO: structural ceilings exist via demand curves but are less rigid;
    //   leave undefined until v2.1 splits MISO seasonal + adds NYISO zone modeling
    // - ERCOT: N/A (energy-only market, no capacity auction)
    priceCap?: number;
    dataSource: string;            // Documentation reference
}

// Capacity-market reference prices and system sizes per ISO.
// Refreshed 2026-05-13 to most-recent published auctions / CDR reports.
// `capacityPrice2024` field name kept for backward-compat with downstream code,
// but values are now the most recent FORWARD-LOOKING auction (PJM 2027/28, MISO 2025/26, NYISO 2025).
export const ISO_CAPACITY_DATA: Record<string, ISOCapacityData> = {
    pjm: {
        totalPeakMW: 150000,           // ~150 GW summer peak (PJM 2026 Load Forecast Report)
        totalCapacityMW: 180000,       // ~180 GW installed capacity
        targetReserveMargin: 0.15,     // 15% Installed Reserve Margin (IRM)
        // PJM 2027/28 BRA cleared 2025-12-17 at FERC-cap $333.44/MW-day uniformly across all LDAs.
        // 2026/27 BRA cleared 2025-07-22 at $329.17/MW-day. Both maxed the FERC price cap.
        // Procured 134,479 MW UCAP for 27/28; short of reliability requirement by ~6,623 MW.
        capacityPrice2024: 333.44,
        // FERC-imposed hard ceiling on PJM BRA clearing prices. The cap was hit in both
        // 26/27 and 27/28 auctions; once hit, additional load cannot raise the price
        // further (the supply curve clamps here, with reliability shortfalls socialized
        // via other ISO actions, not via capacity-market price escalation).
        priceCap: 333.44,
        dataSource: 'PJM 2027/28 Base Residual Auction Report (Dec 2025)',
    },
    // MISO is a SEASONAL capacity construct since 2025/26 (Reliability-Based Demand Curve).
    // Summer and non-summer prices diverge by an order of magnitude; modeling them as a
    // single annualized blend (the v2.0 approach) hides the binding-summer signal.
    // Per Gemini methodology peer review (2026-05-14, v2.1 item #2): split into seasonal
    // entries. Hourly seasonal selection in cost flow remains a v2.2 item (requires 8760
    // simulation); for now, getISODataForMarket('miso') returns miso_summer (conservative).
    miso_summer: {
        totalPeakMW: 127000,           // ~127 GW summer peak
        totalCapacityMW: 155000,       // ~155 GW installed capacity
        targetReserveMargin: 0.17,
        // Summer 2025/26 PRA cleared April 2025 at record $666.50/MW-day under RBDC.
        capacityPrice2024: 666.50,
        dataSource: 'MISO 2025/26 Planning Resource Auction Results — Summer (April 2025)',
    },
    miso_non_summer: {
        totalPeakMW: 127000,           // duplicated from summer (same system)
        totalCapacityMW: 155000,       // duplicated from summer (same system)
        targetReserveMargin: 0.17,     // duplicated from summer (same planning target)
        // Winter/spring/fall blended approximation, much lower than summer per RBDC clearing.
        capacityPrice2024: 30.00,
        dataSource: 'MISO 2025/26 PRA — winter/spring/fall blended approximation',
    },
    nyiso: {
        totalPeakMW: 32000,            // ~32 GW summer peak
        totalCapacityMW: 40000,        // ~40 GW installed capacity
        targetReserveMargin: 0.15,     // 15% IRM
        // NYISO statewide ICAP prices have averaged $2-6/kW-month since 2023 (~$67-200/MW-day).
        // NYC zone runs 250%+ premium ($12-20/kW-month, ~$400-667/MW-day).
        // Using mid-point statewide blend; for NYC-specific scenarios the model should adjust.
        capacityPrice2024: 180.00,
        dataSource: 'NYISO 2025 ICAP Auction Series (Modo Energy summary, Dec 2025)',
    },
    ercot: {
        totalPeakMW: 90000,            // ~90 GW peak (aligns with calculations.ts:977)
        // 2026 expected summer capacity = 104,850+ MW (ERCOT Dec 2025 CDR).
        totalCapacityMW: 105000,
        // ERCOT minimum target = 13.75% per PUCT. Actual 2026 summer projection
        // is 18.3% PRM (peak load) / 20.9% (peak net load), but field semantics
        // is "target", so using the regulator-set minimum here.
        targetReserveMargin: 0.1375,
        capacityPrice2024: 0,          // No capacity market - energy-only
        dataSource: 'ERCOT December 2025 Capacity, Demand and Reserves Report',
    },
};

/**
 * Get ISO capacity data for a given market type
 * Returns null for markets without centralized capacity markets (regulated, SPP, TVA)
 */
export function getISODataForMarket(marketType: MarketType): ISOCapacityData | null {
    // MISO seasonal split (2026-05-14, v2.1 item #2): the legacy 'miso' MarketType
    // resolves to 'miso_summer' (the conservative / higher-priced season) for back-compat.
    // Seasonal selection in calculations is a v2.2 item — it requires hourly 8760
    // simulation rather than annual aggregates. Today, every MISO scenario uses the
    // summer figure, which gives a defensible upper bound on capacity costs.
    const mapping: Record<string, string> = {
        pjm: 'pjm',
        miso: 'miso_summer',
        nyiso: 'nyiso',
        ercot: 'ercot',
    };
    const isoKey = mapping[marketType];
    return isoKey ? ISO_CAPACITY_DATA[isoKey] : null;
}

// ============================================
// SCENARIO PARAMETERS
// ============================================

export const SCENARIO_PARAMS: Record<string, ScenarioParams> = {
    firm: {
        capacityMW: 4000,
        loadFactor: 0.80,
        peakCoincidence: 1.0,
        description: 'Traditional firm load - adds directly to peak demand',
    },
    flex: {
        capacityMW: 5333,
        loadFactor: 0.95,
        peakCoincidence: 0.75,
        curtailablePercent: 0.25,
        description: 'Flexible load - higher capacity without adding to peak',
    },
};

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_UTILITY: Utility = {
    name: 'PSO-sized Utility',
    state: 'OK',  // Default state (PSO is Oklahoma) - safety net for NBC cap check
    residentialCustomers: 560000,
    commercialCustomers: 85000,
    industrialCustomers: 5000,
    averageMonthlyBill: 130,
    averageMonthlyUsage: 900,
    preDCSystemEnergyGWh: 20000,
    residentialEnergyShare: 0.35,
    systemPeakMW: 4000,
    baseResidentialAllocation: 0.40,
    allocationDeclineRate: 0.02,
    // Capacity for endogenous pricing - 15% reserve margin by default
    totalGenerationCapacityMW: 4600, // 4000 MW peak * 1.15 reserve
    currentReserveMargin: 0.15,
    // Default interconnection: 80% CIAC recovery (standard for large load interconnection)
    // Large DCs typically build dedicated substations and transmission taps
    // Only shared network upgrades (20%) should be socialized
    // See CIAC Recovery Guidelines in calculations.ts for detailed breakdown by utility type
    interconnection: {
        ciacRecoveryFraction: 0.80,
        networkUpgradeCostPerMW: 140000, // $140k/MW network upgrades
    },
    // Default wholesale energy cost
    marginalEnergyCost: 38, // $/MWh
};

export const DC_RATE_STRUCTURE = {
    // Split demand charges into coincident peak (CP) and non-coincident peak (NCP) components
    // CP charges are based on contribution during system peak hours
    // NCP charges are based on customer's own monthly peak (any time)
    coincidentPeakChargePerMWMonth: 5430, // ~60% of total demand charge
    nonCoincidentPeakChargePerMWMonth: 3620, // ~40% of total demand charge
    demandChargePerMWMonth: 9050, // Total for backwards compatibility
    energyMarginPerMWh: 4.88,

    // ERCOT 4CP transmission allocation
    // Transmission costs are allocated based on usage during 4 coincident peak hours per year
    // Curtailing during these hours dramatically reduces transmission cost allocation
    ercot4CPTransmissionRate: 5.50, // $/kW-month based on 4CP contribution
};

export const INFRASTRUCTURE_COSTS = {
    transmissionCostPerMW: 350000,
    transmissionLeadTime: 5,
    distributionCostPerMW: 150000,
    capacityCostPerMWYear: 150000,
    peakerCostPerMW: 1200000,
    annualBaselineUpgradePercent: 0.015,
    avgRateBasePerCustomer: 3500,
};

export const DEFAULT_DATA_CENTER: DataCenter = {
    capacityMW: 1000,
    firmLoadFactor: 0.80,
    firmPeakCoincidence: 1.0,
    flexLoadFactor: 0.95,
    flexPeakCoincidence: 0.75,
    flexibleLoadPercent: 0.35,
    onsiteGenerationMW: 200,
    generationAvailability: 0.95,
    generationCostPerMWh: 85,
    demandChargeRate: 9050,
    energyMargin: 4.88,
    // Capital cost for onsite generation - NOT used in ratepayer bill calculations
    // (DC pays this, not ratepayers) but included for transparency.
    // Modern data centers often install onsite generation that provides:
    // - Peak shaving / demand charge reduction
    // - Backup power / islanding capability
    // - Baseload operation with sufficient redundancy
    // Cost range: $600-1,200k/MW for gas peakers/reciprocating engines
    generationCapitalCostPerMW: 800000,
};

export const DC_CAPACITY_RANGE = {
    min: 500,
    max: 10000,
    step: 100,
    default: 1000,
};

export const UTILITY_PEAK_RANGE = {
    min: 1000,
    max: 50000,
    step: 500,
    default: 4000,
};

// ============================================
// SCENARIO DEFINITIONS
// ============================================

export const SCENARIOS: Record<string, Scenario> = {
    baseline: {
        id: 'baseline',
        name: 'Standard Escalation',
        shortName: 'No Data Center',
        description: 'Baseline cost growth from inflation and aging infrastructure',
        color: '#6B7280',
        colorLight: '#E5E7EB',
    },
    unoptimized: {
        id: 'unoptimized',
        name: 'Typical Data Center',
        shortName: '80% LF, 100% Peak',
        description: 'Data center as firm load: lower utilization, full peak contribution',
        color: '#DC2626',
        colorLight: '#FEE2E2',
    },
    flexible: {
        id: 'flexible',
        name: 'Flexible Data Center',
        shortName: '95% LF, 75% Peak',
        description: 'With demand response: higher utilization, 25% curtailable (DCFlex validated)',
        color: '#F59E0B',
        colorLight: '#FEF3C7',
    },
    dispatchable: {
        id: 'dispatchable',
        name: 'Optimized Data Center',
        shortName: 'DR + Generation',
        description: 'Demand response plus onsite generation during system peaks',
        color: '#10B981',
        colorLight: '#D1FAE5',
    },
};

// ============================================
// TIME PARAMETERS
// ============================================

export const TIME_PARAMS = {
    projectionYears: 15,
    baseYear: 2025,
    generalInflation: 0.025,
    electricityInflation: 0.03,
    peakHoursPerYear: 100,
    criticalPeakHours: 20,
};

// ============================================
// ESCALATION RANGES FOR USER-CONTROLLABLE TOGGLES
// ============================================

export const ESCALATION_RANGES = {
    inflation: {
        min: 0.01,      // 1%
        max: 0.05,      // 5%
        default: 0.025, // 2.5% (matches TIME_PARAMS.generalInflation)
        step: 0.005,    // 0.5% increments
    },
    infrastructureAging: {
        min: 0.005,     // 0.5%
        max: 0.03,      // 3%
        default: 0.015, // 1.5% (matches INFRASTRUCTURE_COSTS.annualBaselineUpgradePercent)
        step: 0.005,    // 0.5% increments
    },
};

// ============================================
// WORKLOAD FLEXIBILITY
// ============================================

export const WORKLOAD_TYPES: Record<string, WorkloadType> = {
    training: {
        name: 'AI Training',
        percentOfLoad: 0.30,
        flexibility: 0.60,
        description: 'Large model training jobs - deferrable to off-peak hours',
    },
    batchProcessing: {
        name: 'Batch Processing',
        percentOfLoad: 0.25,
        flexibility: 0.80,
        description: 'Non-real-time batch jobs - highly shiftable',
    },
    realtimeInference: {
        name: 'Real-time Inference',
        percentOfLoad: 0.35,
        flexibility: 0.10,
        description: 'Latency-sensitive requests - must respond instantly',
    },
    coreInfrastructure: {
        name: 'Core Infrastructure',
        percentOfLoad: 0.10,
        flexibility: 0.05,
        description: 'Networking, storage, cooling controls - always on',
    },
};

export const calculateAggregateFlexibility = (workloadTypes = WORKLOAD_TYPES): number => {
    let totalFlex = 0;
    Object.values(workloadTypes).forEach(w => {
        totalFlex += w.percentOfLoad * w.flexibility;
    });
    return totalFlex;
};

// ============================================
// REVENUE CALCULATIONS
// ============================================

/**
 * Calculate DC revenue offset with split demand charges
 *
 * Key insight: Demand charges have two components:
 * 1. Coincident Peak (CP): Based on usage during system peak hours
 *    - Flexible DCs pay LESS because they curtail during system peaks
 * 2. Non-Coincident Peak (NCP): Based on customer's own monthly peak
 *    - If flexible DCs install MORE capacity, they pay MORE on NCP charges
 *
 * Energy margin is now calculated dynamically based on market type:
 *   margin = genericEnergyRate - marketWholesaleCost
 * This replaces the previous fixed $4.88/MWh value with market-specific calculations.
 *
 * For accurate comparison of "same MW" vs "33% more MW" scenarios,
 * use the effectiveCapacityMW parameter to model increased capacity.
 */
export const calculateDCRevenueOffset = (
    dcCapacityMW: number,
    loadFactor: number,
    peakCoincidence: number,
    years: number = 1,
    options?: {
        // For flexible DCs that install more capacity (e.g., 1.33x for 75% coincidence)
        effectiveCapacityMW?: number;
        // Market type affects how demand charges are structured and energy margin
        marketType?: MarketType;
        // Custom wholesale energy cost ($/MWh) - overrides market-based default
        marginalEnergyCost?: number;
    }
) => {
    const {
        coincidentPeakChargePerMWMonth,
        nonCoincidentPeakChargePerMWMonth,
    } = DC_RATE_STRUCTURE;

    // Market-specific wholesale energy costs ($/MWh)
    // These are the same values from utilityData.ts market structures
    const MARKET_WHOLESALE_COSTS: Record<string, number> = {
        regulated: 38,  // Embedded fuel + O&M costs
        pjm: 42,        // LMP-based, moderate congestion
        ercot: 45,      // Volatile, scarcity pricing, 2024 average
        miso: 35,       // Lower congestion, coal/gas mix
        spp: 28,        // Wind-heavy, low wholesale prices
        nyiso: 55,      // Constrained zones, higher congestion
        tva: 32,        // Low-cost hydro/nuclear baseload
        caiso: 50,      // California ISO
    };

    // Generic retail energy rate assumption for fallback calculation
    // This represents a typical large power tariff energy component
    const GENERIC_RETAIL_ENERGY_RATE = 35; // $/MWh - approximate for large power

    // Get wholesale cost for this market (or use provided value)
    const marketType = options?.marketType ?? 'regulated';
    const wholesaleCost = options?.marginalEnergyCost ?? MARKET_WHOLESALE_COSTS[marketType] ?? 38;

    // Calculate dynamic energy margin (retail - wholesale)
    // Ensures margin is non-negative (in fuel rider tariffs, margin comes from demand charges)
    const energyMarginPerMWh = Math.max(0, GENERIC_RETAIL_ENERGY_RATE - wholesaleCost);

    // Effective capacity for NCP charges (may be higher than grid-facing capacity for flexible DCs)
    const effectiveCapacity = options?.effectiveCapacityMW ?? dcCapacityMW;

    // Coincident peak demand charges - based on contribution during system peak
    const coincidentPeakMW = dcCapacityMW * peakCoincidence;
    const annualCPDemandRevenue = coincidentPeakMW * coincidentPeakChargePerMWMonth * 12;

    // Non-coincident peak demand charges - based on customer's own monthly peak
    // This is the installed/effective capacity, not reduced by coincidence
    // Flexible DCs with more installed capacity hit their NCP more consistently
    const ncpPeakMW = effectiveCapacity; // Customer's own peak is their full capacity
    const annualNCPDemandRevenue = ncpPeakMW * nonCoincidentPeakChargePerMWMonth * 12;

    const annualDemandRevenue = annualCPDemandRevenue + annualNCPDemandRevenue;

    // Energy margin - based on actual energy consumption
    // Flexible DCs with higher load factor and/or more capacity generate more energy revenue
    const annualMWh = effectiveCapacity * loadFactor * 8760;
    const annualEnergyMargin = annualMWh * energyMarginPerMWh;

    return {
        cpDemandRevenue: annualCPDemandRevenue * years,
        ncpDemandRevenue: annualNCPDemandRevenue * years,
        demandRevenue: annualDemandRevenue * years,
        energyMargin: annualEnergyMargin * years,
        total: (annualDemandRevenue + annualEnergyMargin) * years,
        perYear: annualDemandRevenue + annualEnergyMargin,
        // Detailed breakdown for transparency
        breakdown: {
            coincidentPeakMW,
            ncpPeakMW,
            annualMWh,
            cpChargeRate: coincidentPeakChargePerMWMonth,
            ncpChargeRate: nonCoincidentPeakChargePerMWMonth,
        },
    };
};

// ============================================
// FORMATTING UTILITIES
// ============================================

export const formatCurrency = (value: number, decimals: number = 0): string => {
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

export const formatPercent = (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
};

export const formatMW = (value: number): string => {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)} GW`;
    }
    return `${value.toFixed(0)} MW`;
};

// ============================================
// NATIONAL DATA CENTER STATISTICS
// ============================================

// Refreshed 2026-05-13. LBNL 2024 report (published Dec 2024) is still the canonical source for
// current US DC capacity / TWh; LBNL released a "Large Load Literature Review September 2025
// Update" but did NOT publish a full successor to the 2024 report.
export const NATIONAL_DC_STATS = {
    // Current state (most-recent reported = 2023 actuals)
    // Source: LBNL 2024 United States Data Center Energy Usage Report
    currentCapacityGW: 25, // ~25 GW operating capacity (LBNL 2024)
    currentElectricityShare: 0.044, // 4.4% of US electricity (LBNL 2024)
    currentTWh: 176, // 2023 consumption (LBNL 2024)

    // Projections
    // LBNL 2024: 325-580 TWh by 2028 → ~74-132 GW total capacity at 50% utilization
    // EPRI: 6-9% of US electricity by 2030
    // DOE: ~50 GW net new DC demand by 2030
    // Grid Strategies: ~65 GW net new by 2030 (market-adjusted)
    // BloombergNEF Dec 2025: 106 GW total by 2035 (conservative)
    projected2028CapacityGWLow: 74, // LBNL 2024
    projected2028CapacityGWHigh: 132, // LBNL 2024
    projected2028TWhLow: 325, // LBNL 2024
    projected2028TWhHigh: 580, // LBNL 2024
    projected2030ShareLow: 0.06, // EPRI
    projected2030ShareHigh: 0.09, // EPRI
    projected2030NetNewGWLow: 50, // DOE
    projected2030NetNewGWHigh: 65, // Grid Strategies
    projected2035CapacityGWLow: 100, // BNEF conservative (106 GW)
    projected2035CapacityGWHigh: 150, // High-end / aggressive
    growthMultiplier2035: '4-6x', // Range from 2024 baseline

    // Equivalents
    gwPerNuclearPlant: 1, // 1 GW ≈ 1 nuclear plant
    homesPerGW: 750000, // ~750k-1M homes per GW (CRS)

    // Demand backlog
    // Source: LBNL Queued Up + LBNL Large Load Literature Review (Sept 2025 update);
    // ERCOT alone has 233 GW of large load requests. Historically only ~13% of
    // interconnection requests reach commercial operation, so requested >> built.
    totalUSRequestedGW: 1000,

    // PJM capacity market impact (refreshed to 2027/28 BRA)
    // 2027/28 BRA cleared 2025-12-17 at FERC cap $333.44/MW-day (PJM Inside Lines)
    // 2026/27 BRA cleared 2025-07-22 at FERC cap $329.17/MW-day
    // 2025/26 BRA cleared at $269.92/MW-day
    // 2024/25 BRA was $28.92/MW-day prior to the demand-driven step-change
    // → 11.5x increase from 24/25 to 27/28
    pjmCapacityPrice2024: 333.44, // most-recent BRA (2027/28)
    pjmCapacityPricePrior: 28.92, // 2024/25 BRA (pre-step-change baseline)
    pjmPriceIncreaseMultiple: 11.5, // 333.44 / 28.92
    dcAttributionPercent: 0.63, // 63% of increase attributed to DC growth (Grid Strategies)
};

// State-level data center statistics
export const STATE_DC_DATA: Record<string, {
    requestedGW?: number;
    capacityGW?: number;
    stateElectricityShare?: number;
    loadGrowthShare?: number;
    notes: string;
}> = {
    TX: {
        requestedGW: 230,
        capacityGW: 4.2,
        loadGrowthShare: 0.46, // 46% of ERCOT projected load growth
        notes: 'ERCOT energy-only market with 4CP transmission allocation',
    },
    VA: {
        requestedGW: 65,
        capacityGW: 5.6,
        stateElectricityShare: 0.25, // 25% of Virginia electricity
        notes: 'Data center capital of the world, 70% of global internet traffic flows through Loudoun County',
    },
    GA: {
        requestedGW: 51,
        capacityGW: 1.5,
        notes: 'Atlanta metro growing tech sector',
    },
    PA: {
        requestedGW: 42,
        notes: 'PJM territory with capacity market',
    },
    NC: {
        requestedGW: 42,
        capacityGW: 1.3,
        notes: 'Charlotte and Research Triangle growth',
    },
    IL: {
        requestedGW: 28,
        notes: 'Chicago metro data center hub',
    },
    IN: {
        requestedGW: 22,
        notes: 'Midwest data center expansion',
    },
    OH: {
        requestedGW: 13,
        capacityGW: 1.2,
        notes: 'Emerging frontier as Virginia reaches capacity constraints',
    },
    AZ: {
        requestedGW: 12,
        capacityGW: 1.8,
        notes: 'Phoenix metro data center growth',
    },
};
