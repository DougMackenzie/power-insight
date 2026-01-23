/**
 * Community Energy Cost Calculator - Calculation Engine (TypeScript)
 * 
 * Core calculation logic migrated from React app with TypeScript types
 */

import {
    DEFAULT_UTILITY,
    DEFAULT_DATA_CENTER,
    INFRASTRUCTURE_COSTS,
    TIME_PARAMS,
    DC_RATE_STRUCTURE,
    calculateDCRevenueOffset,
    type Utility,
    type DataCenter,
} from './constants';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TrajectoryPoint {
    year: number;
    yearIndex: number;
    monthlyBill: number;
    annualBill: number;
    scenario: string;
    dcOnline?: boolean;
    components: {
        baseline?: number;
        dcImpact?: number;
        base?: number;
        inflation?: number;
        annualIncreaseRate?: number;
    };
    parameters?: {
        loadFactor?: number;
        peakCoincidence?: number;
        residentialAllocation?: number;
        curtailablePercent?: number;
        onsiteGenerationMW?: number;
    };
    metrics?: any;
}

export interface SummaryStats {
    currentMonthlyBill: number;
    finalYearBills: {
        baseline: number;
        unoptimized: number;
        flexible: number;
        dispatchable: number;
    };
    finalYearDifference: {
        unoptimized: number;
        flexible: number;
        dispatchable: number;
    };
    benefitsRatepayers: {
        unoptimized: boolean;
        flexible: boolean;
        dispatchable: boolean;
    };
    savingsVsBaseline: {
        unoptimized: number;
        flexible: number;
        dispatchable: number;
    };
    savingsVsUnoptimized: {
        flexible: number;
        dispatchable: number;
    };
    cumulativeHouseholdCosts: {
        baseline: number;
        unoptimized: number;
        flexible: number;
        dispatchable: number;
    };
    cumulativeCommunitySavings: {
        unoptimized: number;
        flexible: number;
        dispatchable: number;
    };
    percentChange: {
        baseline: number;
        unoptimized: number;
        flexible: number;
        dispatchable: number;
    };
}

// ============================================
// RESIDENTIAL ALLOCATION MODEL
// ============================================

const calculateResidentialAllocation = (
    utility: Utility,
    dcCapacityMW: number,
    dcLoadFactor: number,
    dcPeakCoincidence: number,
    yearsOnline: number = 0
) => {
    const preDCSystemEnergyMWh = utility.preDCSystemEnergyGWh * 1000;
    const residentialEnergyMWh = preDCSystemEnergyMWh * utility.residentialEnergyShare;
    const dcAnnualEnergyMWh = dcCapacityMW * dcLoadFactor * 8760;
    const phaseInFactor = Math.min(1.0, yearsOnline / 3);
    const postDCSystemEnergyMWh = preDCSystemEnergyMWh + (dcAnnualEnergyMWh * phaseInFactor);
    const residentialVolumetricShare = residentialEnergyMWh / postDCSystemEnergyMWh;

    const estimatedSystemLF = 0.55;
    const preDCPeakMW = utility.systemPeakMW || (preDCSystemEnergyMWh / 8760 / estimatedSystemLF);
    const residentialPeakShare = 0.45;
    const residentialPeakMW = preDCPeakMW * residentialPeakShare;
    const dcPeakContribution = dcCapacityMW * dcPeakCoincidence * phaseInFactor;
    const postDCPeakMW = preDCPeakMW + dcPeakContribution;
    const residentialDemandShare = residentialPeakMW / postDCPeakMW;

    const totalCustomers = utility.residentialCustomers + utility.commercialCustomers + utility.industrialCustomers + 1;
    const residentialCustomerShare = utility.residentialCustomers / totalCustomers;

    const weightedAllocation =
        residentialVolumetricShare * 0.40 +
        residentialDemandShare * 0.40 +
        residentialCustomerShare * 0.20;

    const regulatoryLagFactor = Math.min(1.0, yearsOnline / 5);
    const baseAllocation = utility.baseResidentialAllocation;
    const adjustedAllocation = baseAllocation * (1 - regulatoryLagFactor) + weightedAllocation * regulatoryLagFactor;

    return {
        allocation: Math.max(0.15, Math.min(0.50, adjustedAllocation)),
        volumetricShare: residentialVolumetricShare,
        demandShare: residentialDemandShare,
        customerShare: residentialCustomerShare,
        weightedRaw: weightedAllocation,
        dcEnergyShareOfSystem: dcAnnualEnergyMWh * phaseInFactor / postDCSystemEnergyMWh,
        dcPeakShareOfSystem: dcPeakContribution / postDCPeakMW,
    };
};

// ============================================
// NET IMPACT CALCULATIONS
// ============================================

/**
 * Calculate net residential impact with improved demand charge modeling
 *
 * Key improvements:
 * 1. Split demand charges into CP (coincident peak) and NCP (non-coincident peak)
 * 2. ERCOT 4CP transmission allocation - huge benefit for flexible loads
 * 3. Flexible DCs can install more capacity for same grid impact
 */
const calculateNetResidentialImpact = (
    dcCapacityMW: number,
    loadFactor: number,
    peakCoincidence: number,
    residentialCustomers: number,
    residentialAllocation: number,
    includeCapacityCredit: boolean = false,
    onsiteGenMW: number = 0,
    utility?: Utility
) => {
    // For flexible DCs (peakCoincidence < 1.0), they can install more capacity
    // because each MW only adds (peakCoincidence) MW to system peak
    // flexCapacityMultiplier = 1 / peakCoincidence (e.g., 1/0.75 = 1.33 for 25% curtailment)
    // However, we model the "same interconnection" scenario by default
    // The increased capacity primarily affects NCP demand charges and energy revenue
    const isFlexible = peakCoincidence < 1.0;

    // Effective peak contribution to the grid (what drives infrastructure needs)
    const effectivePeakMW = dcCapacityMW * peakCoincidence - onsiteGenMW;

    // ============================================
    // TRANSMISSION COSTS - Market-specific allocation
    // ============================================
    let transmissionCost: number;

    if (utility?.marketType === 'ercot') {
        // ERCOT uses 4CP (four coincident peak) methodology
        // Transmission costs are allocated based on usage during 4 specific peak hours per year
        // If a DC curtails during those hours, their transmission allocation drops dramatically

        // The 4CP rate is applied to the DC's load during those 4 hours
        // For firm load: 100% of capacity during 4CP hours
        // For flexible load: peakCoincidence % of capacity during 4CP hours
        const fourCPContributionMW = dcCapacityMW * peakCoincidence - onsiteGenMW;
        const ercot4CPRate = DC_RATE_STRUCTURE.ercot4CPTransmissionRate || 5.50; // $/kW-month
        const annualTransmissionCost = Math.max(0, fourCPContributionMW) * 1000 * ercot4CPRate * 12;

        // Also include some base transmission cost that doesn't depend on 4CP
        // (interconnection facilities, local upgrades)
        const baseTransmissionCost = Math.max(0, effectivePeakMW) * INFRASTRUCTURE_COSTS.transmissionCostPerMW * 0.3;
        transmissionCost = annualTransmissionCost + (baseTransmissionCost / 20);
    } else {
        // Traditional embedded cost allocation for regulated/PJM/other markets
        transmissionCost = Math.max(0, effectivePeakMW) * INFRASTRUCTURE_COSTS.transmissionCostPerMW;
    }

    const distributionCost = Math.max(0, effectivePeakMW) * INFRASTRUCTURE_COSTS.distributionCostPerMW;

    // Annualize infrastructure costs (20-year recovery period)
    const annualizedTransmissionCost = utility?.marketType === 'ercot'
        ? transmissionCost // Already annualized for ERCOT 4CP
        : transmissionCost / 20;
    const annualizedDistributionCost = distributionCost / 20;
    const annualizedInfraCost = annualizedTransmissionCost + annualizedDistributionCost;

    // ============================================
    // CAPACITY COSTS - Market-specific
    // ============================================
    let baseCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear;
    const capacityCostPassThrough = utility?.capacityCostPassThrough ?? 0.40;

    if (utility?.hasCapacityMarket && utility?.capacityPrice2024) {
        const capacityPriceAnnual = utility.capacityPrice2024 * 365;
        baseCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.5 +
                          capacityPriceAnnual * capacityCostPassThrough * 0.5;
    }

    if (utility?.marketType === 'ercot') {
        // No capacity market in ERCOT, but still need some generation adequacy costs
        baseCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.50;
    }

    // ============================================
    // DEMAND CHARGE REVENUE - Split CP/NCP
    // ============================================
    // Use the new split demand charge calculation
    const dcRevenue = calculateDCRevenueOffset(dcCapacityMW, loadFactor, peakCoincidence, 1, {
        effectiveCapacityMW: dcCapacityMW, // Same capacity for both scenarios
        marketType: utility?.marketType,
    });

    // Net capacity cost after demand charge offset
    // CP demand charges offset CP-related capacity costs
    // NCP demand charges provide additional revenue
    const cpDemandChargeAnnual = DC_RATE_STRUCTURE.coincidentPeakChargePerMWMonth * 12;
    const netCapacityCostPerMW = Math.max(0, baseCapacityCost - cpDemandChargeAnnual);
    let capacityCostOrCredit = Math.max(0, effectivePeakMW) * netCapacityCostPerMW;

    // ============================================
    // CAPACITY CREDITS for flexible operation
    // ============================================
    let capacityCredit = 0;
    if (includeCapacityCredit && isFlexible) {
        const curtailableMW = dcCapacityMW * (1 - peakCoincidence);
        // Capacity credits are more valuable in capacity markets
        const creditMultiplier = utility?.hasCapacityMarket ? 0.90 : 0.80;
        const drCreditValue = curtailableMW * baseCapacityCost * creditMultiplier;
        const genCreditValue = onsiteGenMW * baseCapacityCost * 0.95;
        capacityCredit = drCreditValue + genCreditValue;
        capacityCostOrCredit = capacityCostOrCredit - capacityCredit;
    }

    const grossAnnualInfraCost = annualizedInfraCost + capacityCostOrCredit;

    // ============================================
    // REVENUE OFFSET CALCULATION
    // ============================================
    // Energy margin flows through to benefit ratepayers
    const energyMarginFlowThrough = utility?.marketType === 'ercot' ? 0.90 : 0.85;

    // NCP demand charges provide fixed cost spreading benefit
    // (The DC is paying toward system costs regardless of when they use power)
    const ncpDemandBenefit = dcRevenue.ncpDemandRevenue * 0.20;

    // Total revenue offset
    const revenueOffset = (dcRevenue.energyMargin * energyMarginFlowThrough) + ncpDemandBenefit;

    const netAnnualImpact = grossAnnualInfraCost - revenueOffset;

    // ============================================
    // RESIDENTIAL ALLOCATION - Market-adjusted
    // ============================================
    let adjustedAllocation = residentialAllocation;

    if (utility?.marketType === 'ercot') {
        // ERCOT: Large loads face 4CP transmission costs directly
        // This significantly reduces cost spillover to residential
        // The 4CP methodology means DC pays for their own transmission needs
        adjustedAllocation = residentialAllocation * 0.70; // Larger reduction than before
    } else if (utility?.hasCapacityMarket && utility?.capacityPrice2024 && utility.capacityPrice2024 > 100) {
        const priceMultiplier = Math.min(1.15, 1 + (utility.capacityPrice2024 - 100) / 1000);
        adjustedAllocation = residentialAllocation * priceMultiplier;
    }

    const residentialImpact = netAnnualImpact * adjustedAllocation;
    const perCustomerMonthly = residentialImpact / residentialCustomers / 12;

    return {
        perCustomerMonthly,
        annualResidentialImpact: residentialImpact,
        grossCost: grossAnnualInfraCost,
        revenueOffset,
        netImpact: netAnnualImpact,
        metrics: {
            effectivePeakMW: Math.max(0, effectivePeakMW),
            transmissionCost: annualizedTransmissionCost,
            distributionCost: annualizedDistributionCost,
            dcRevenuePerYear: dcRevenue.perYear,
            cpDemandRevenue: dcRevenue.cpDemandRevenue,
            ncpDemandRevenue: dcRevenue.ncpDemandRevenue,
            energyMarginRevenue: dcRevenue.energyMargin,
            capacityCostOrCredit,
            capacityCredit,
            revenueOffset,
            energyMarginFlowThrough,
            marketType: utility?.marketType ?? 'regulated',
            adjustedAllocation,
            isFlexible,
        },
    };
};

// ============================================
// TRAJECTORY CALCULATIONS
// ============================================

export const calculateBaselineTrajectory = (
    utility: Utility = DEFAULT_UTILITY,
    years: number = TIME_PARAMS.projectionYears
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    let currentBill = utility.averageMonthlyBill;

    const baselineIncreaseRate =
        TIME_PARAMS.generalInflation +
        INFRASTRUCTURE_COSTS.annualBaselineUpgradePercent +
        0.005;

    for (let year = 0; year <= years; year++) {
        if (year > 0) {
            currentBill = utility.averageMonthlyBill * Math.pow(1 + baselineIncreaseRate, year);
        }

        trajectory.push({
            year: baseYear + year,
            yearIndex: year,
            monthlyBill: currentBill,
            annualBill: currentBill * 12,
            scenario: 'baseline',
            components: {
                base: utility.averageMonthlyBill,
                inflation: currentBill - utility.averageMonthlyBill,
                annualIncreaseRate: baselineIncreaseRate,
            },
        });
    }

    return trajectory;
};

export const calculateUnoptimizedTrajectory = (
    utility: Utility = DEFAULT_UTILITY,
    dataCenter: DataCenter = DEFAULT_DATA_CENTER,
    years: number = TIME_PARAMS.projectionYears
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years);

    const firmLF = dataCenter.firmLoadFactor || 0.80;
    const firmPeakCoincidence = dataCenter.firmPeakCoincidence || 1.0;

    for (let year = 0; year <= years; year++) {
        let dcImpact = 0;
        let currentAllocation = utility.baseResidentialAllocation;
        let yearMetrics = null;

        if (year >= 2) {
            const phaseIn = year === 2 ? 0.5 : 1.0;
            const yearsOnline = year - 2;

            const allocationResult = calculateResidentialAllocation(
                utility,
                dataCenter.capacityMW,
                firmLF,
                firmPeakCoincidence,
                yearsOnline
            );
            currentAllocation = allocationResult.allocation;

            const yearImpact = calculateNetResidentialImpact(
                dataCenter.capacityMW,
                firmLF,
                firmPeakCoincidence,
                utility.residentialCustomers,
                currentAllocation,
                false,
                0,
                utility
            );

            yearMetrics = yearImpact.metrics;
            dcImpact = yearImpact.perCustomerMonthly * phaseIn;

            if (dcImpact > 0) {
                dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation, yearsOnline);
            } else {
                dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation * 0.8, yearsOnline);
            }
        }

        const monthlyBill = baseline[year].monthlyBill + dcImpact;

        trajectory.push({
            year: baseYear + year,
            yearIndex: year,
            monthlyBill,
            annualBill: monthlyBill * 12,
            scenario: 'unoptimized',
            dcOnline: year >= 2,
            components: {
                baseline: baseline[year].monthlyBill,
                dcImpact,
            },
            parameters: {
                loadFactor: firmLF,
                peakCoincidence: firmPeakCoincidence,
                residentialAllocation: year >= 2 ? currentAllocation : utility.baseResidentialAllocation,
            },
            metrics: yearMetrics,
        });
    }

    return trajectory;
};

export const calculateFlexibleTrajectory = (
    utility: Utility = DEFAULT_UTILITY,
    dataCenter: DataCenter = DEFAULT_DATA_CENTER,
    years: number = TIME_PARAMS.projectionYears
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years);

    const flexLF = dataCenter.flexLoadFactor || 0.95;
    const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.75;

    for (let year = 0; year <= years; year++) {
        let dcImpact = 0;
        let currentAllocation = utility.baseResidentialAllocation;
        let yearMetrics = null;

        if (year >= 2) {
            const phaseIn = year === 2 ? 0.5 : 1.0;
            const yearsOnline = year - 2;

            const allocationResult = calculateResidentialAllocation(
                utility,
                dataCenter.capacityMW,
                flexLF,
                flexPeakCoincidence,
                yearsOnline
            );
            currentAllocation = allocationResult.allocation;

            const yearImpact = calculateNetResidentialImpact(
                dataCenter.capacityMW,
                flexLF,
                flexPeakCoincidence,
                utility.residentialCustomers,
                currentAllocation,
                true,
                0,
                utility
            );

            yearMetrics = yearImpact.metrics;
            dcImpact = yearImpact.perCustomerMonthly * phaseIn;

            if (dcImpact > 0) {
                dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation, yearsOnline);
            } else {
                dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation * 0.9, yearsOnline);
            }
        }

        const monthlyBill = baseline[year].monthlyBill + dcImpact;

        trajectory.push({
            year: baseYear + year,
            yearIndex: year,
            monthlyBill,
            annualBill: monthlyBill * 12,
            scenario: 'flexible',
            dcOnline: year >= 2,
            components: {
                baseline: baseline[year].monthlyBill,
                dcImpact,
            },
            parameters: {
                loadFactor: flexLF,
                peakCoincidence: flexPeakCoincidence,
                residentialAllocation: year >= 2 ? currentAllocation : utility.baseResidentialAllocation,
                curtailablePercent: 1 - flexPeakCoincidence,
            },
            metrics: yearMetrics,
        });
    }

    return trajectory;
};

export const calculateDispatchableTrajectory = (
    utility: Utility = DEFAULT_UTILITY,
    dataCenter: DataCenter = DEFAULT_DATA_CENTER,
    years: number = TIME_PARAMS.projectionYears
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years);

    const flexLF = dataCenter.flexLoadFactor || 0.95;
    const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.75;
    const onsiteGenMW = dataCenter.onsiteGenerationMW || dataCenter.capacityMW * 0.2;

    for (let year = 0; year <= years; year++) {
        let dcImpact = 0;
        let currentAllocation = utility.baseResidentialAllocation;
        let yearMetrics = null;

        if (year >= 2) {
            const phaseIn = year === 2 ? 0.5 : 1.0;
            const yearsOnline = year - 2;

            const effectivePeakCoincidence = Math.max(0, flexPeakCoincidence - (onsiteGenMW / dataCenter.capacityMW));
            const allocationResult = calculateResidentialAllocation(
                utility,
                dataCenter.capacityMW,
                flexLF,
                effectivePeakCoincidence,
                yearsOnline
            );
            currentAllocation = allocationResult.allocation;

            const yearImpact = calculateNetResidentialImpact(
                dataCenter.capacityMW,
                flexLF,
                flexPeakCoincidence,
                utility.residentialCustomers,
                currentAllocation,
                true,
                onsiteGenMW,
                utility
            );

            yearMetrics = {
                ...yearImpact.metrics,
                onsiteGenMW,
                netPeakDraw: yearImpact.metrics.effectivePeakMW,
            };

            dcImpact = yearImpact.perCustomerMonthly * phaseIn;

            if (dcImpact > 0) {
                dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation, yearsOnline);
            } else {
                dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation * 0.95, yearsOnline);
            }
        }

        const monthlyBill = baseline[year].monthlyBill + dcImpact;

        trajectory.push({
            year: baseYear + year,
            yearIndex: year,
            monthlyBill,
            annualBill: monthlyBill * 12,
            scenario: 'dispatchable',
            dcOnline: year >= 2,
            components: {
                baseline: baseline[year].monthlyBill,
                dcImpact,
            },
            parameters: {
                loadFactor: flexLF,
                peakCoincidence: flexPeakCoincidence,
                onsiteGenerationMW: onsiteGenMW,
                residentialAllocation: year >= 2 ? currentAllocation : utility.baseResidentialAllocation,
            },
            metrics: yearMetrics,
        });
    }

    return trajectory;
};

// ============================================
// COMBINED FUNCTIONS
// ============================================

export const generateAllTrajectories = (
    utility: Utility = DEFAULT_UTILITY,
    dataCenter: DataCenter = DEFAULT_DATA_CENTER,
    years: number = TIME_PARAMS.projectionYears
) => {
    return {
        baseline: calculateBaselineTrajectory(utility, years),
        unoptimized: calculateUnoptimizedTrajectory(utility, dataCenter, years),
        flexible: calculateFlexibleTrajectory(utility, dataCenter, years),
        dispatchable: calculateDispatchableTrajectory(utility, dataCenter, years),
    };
};

export const formatTrajectoriesForChart = (trajectories: ReturnType<typeof generateAllTrajectories>) => {
    const years = trajectories.baseline.length;
    const chartData = [];

    for (let i = 0; i < years; i++) {
        chartData.push({
            year: trajectories.baseline[i].year,
            baseline: trajectories.baseline[i].monthlyBill,
            unoptimized: trajectories.unoptimized[i].monthlyBill,
            flexible: trajectories.flexible[i].monthlyBill,
            dispatchable: trajectories.dispatchable[i].monthlyBill,
        });
    }

    return chartData;
};

export const calculateSummaryStats = (
    trajectories: ReturnType<typeof generateAllTrajectories>,
    utility: Utility = DEFAULT_UTILITY
): SummaryStats => {
    const finalYear = trajectories.baseline.length - 1;

    const baselineFinal = trajectories.baseline[finalYear].monthlyBill;
    const unoptimizedFinal = trajectories.unoptimized[finalYear].monthlyBill;
    const flexibleFinal = trajectories.flexible[finalYear].monthlyBill;
    const dispatchableFinal = trajectories.dispatchable[finalYear].monthlyBill;

    const cumulativeCosts = {
        baseline: trajectories.baseline.reduce((sum, y) => sum + y.annualBill, 0),
        unoptimized: trajectories.unoptimized.reduce((sum, y) => sum + y.annualBill, 0),
        flexible: trajectories.flexible.reduce((sum, y) => sum + y.annualBill, 0),
        dispatchable: trajectories.dispatchable.reduce((sum, y) => sum + y.annualBill, 0),
    };

    const finalYearDifference = {
        unoptimized: unoptimizedFinal - baselineFinal,
        flexible: flexibleFinal - baselineFinal,
        dispatchable: dispatchableFinal - baselineFinal,
    };

    return {
        currentMonthlyBill: utility.averageMonthlyBill,

        finalYearBills: {
            baseline: baselineFinal,
            unoptimized: unoptimizedFinal,
            flexible: flexibleFinal,
            dispatchable: dispatchableFinal,
        },

        finalYearDifference,

        benefitsRatepayers: {
            unoptimized: finalYearDifference.unoptimized < 0,
            flexible: finalYearDifference.flexible < 0,
            dispatchable: finalYearDifference.dispatchable < 0,
        },

        savingsVsBaseline: {
            unoptimized: -finalYearDifference.unoptimized,
            flexible: -finalYearDifference.flexible,
            dispatchable: -finalYearDifference.dispatchable,
        },

        savingsVsUnoptimized: {
            flexible: unoptimizedFinal - flexibleFinal,
            dispatchable: unoptimizedFinal - dispatchableFinal,
        },

        cumulativeHouseholdCosts: cumulativeCosts,

        cumulativeCommunitySavings: {
            unoptimized: (cumulativeCosts.baseline - cumulativeCosts.unoptimized) * utility.residentialCustomers,
            flexible: (cumulativeCosts.baseline - cumulativeCosts.flexible) * utility.residentialCustomers,
            dispatchable: (cumulativeCosts.baseline - cumulativeCosts.dispatchable) * utility.residentialCustomers,
        },

        percentChange: {
            baseline: (baselineFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
            unoptimized: (unoptimizedFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
            flexible: (flexibleFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
            dispatchable: (dispatchableFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
        },
    };
};
