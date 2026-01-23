/**
 * Community Energy Cost Calculator - Constants and Default Values
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

export type MarketType = 'regulated' | 'pjm' | 'ercot' | 'miso' | 'caiso' | 'spp';

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
};

export const DC_RATE_STRUCTURE = {
    demandChargePerMWMonth: 9050,
    energyMarginPerMWh: 4.88,
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

export const calculateDCRevenueOffset = (
    dcCapacityMW: number,
    loadFactor: number,
    peakCoincidence: number,
    years: number = 1
) => {
    const { demandChargePerMWMonth, energyMarginPerMWh } = DC_RATE_STRUCTURE;

    const coincidentPeakMW = dcCapacityMW * peakCoincidence;
    const annualDemandRevenue = coincidentPeakMW * demandChargePerMWMonth * 12;

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
