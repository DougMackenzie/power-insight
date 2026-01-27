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

export interface Utility {
    name: string;
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
        name: 'Baseline',
        shortName: 'No Data Center',
        description: 'Current cost trajectory with normal infrastructure aging',
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
        // Market type affects how demand charges are structured
        marketType?: MarketType;
    }
) => {
    const {
        coincidentPeakChargePerMWMonth,
        nonCoincidentPeakChargePerMWMonth,
        energyMarginPerMWh,
    } = DC_RATE_STRUCTURE;

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

export const NATIONAL_DC_STATS = {
    // Current state (2024-2025)
    // Source: LBNL 2024 Data Center Energy Usage Report
    currentCapacityGW: 25, // ~25 GW operating capacity (LBNL 2024); BNEF estimates ~35-40 GW by late 2025
    currentElectricityShare: 0.044, // 4.4% (LBNL 2024)
    currentTWh: 176, // 2023 consumption (LBNL 2024)

    // Projections
    // Sources: EPRI (6-9% by 2030), DOE (~50 GW net new DC demand by 2030),
    // Grid Strategies (market-adjusted ~65 GW net new by 2030),
    // BloombergNEF (106 GW total by 2035, conservative estimate, Dec 2025)
    projected2030ShareLow: 0.06,
    projected2030ShareHigh: 0.09,
    projected2030NetNewGWLow: 50, // DOE estimate
    projected2030NetNewGWHigh: 65, // Grid Strategies market-adjusted
    projected2035CapacityGWLow: 100, // Conservative (BNEF 106 GW)
    projected2035CapacityGWHigh: 150, // High-end / aggressive scenario
    growthMultiplier2035: '4-6x', // Range from 2024 baseline

    // Equivalents
    gwPerNuclearPlant: 1, // 1 GW ≈ 1 nuclear plant
    homesPerGW: 750000, // ~750k-1M homes per GW (CRS)

    // Demand backlog
    // Source: LBNL Queued Up database; ERCOT alone has 233 GW of large load requests
    // Note: historically only ~13% of interconnection requests reach commercial operation
    totalUSRequestedGW: 1000, // GW requested from US utilities (aggregate)

    // PJM capacity market impact
    // Source: PJM 2025/26 Base Residual Auction Report
    pjmCapacityPrice2024: 269.92, // $/MW-day
    pjmCapacityPricePrior: 28.92, // $/MW-day (prior year)
    pjmPriceIncreaseMultiple: 10, // 10x increase
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
