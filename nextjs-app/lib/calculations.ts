/**
 * Power Insight - Calculation Engine (TypeScript)
 *
 * Core calculation logic migrated from React app with TypeScript types
 */

import {
    DEFAULT_UTILITY,
    DEFAULT_DATA_CENTER,
    INFRASTRUCTURE_COSTS,
    TIME_PARAMS,
    DC_RATE_STRUCTURE,
    SUPPLY_CURVE,
    ESCALATION_RANGES,
    calculateDCRevenueOffset,
    type Utility,
    type DataCenter,
    type InterconnectionCosts,
} from './constants';

// ============================================
// ESCALATION CONFIG TYPE
// ============================================

export interface EscalationConfig {
    inflationEnabled: boolean;
    inflationRate: number;
    infrastructureAgingEnabled: boolean;
    infrastructureAgingRate: number;
}

import {
    type TariffStructure,
    type DemandChargeStructure,
} from './utilityData';

// ============================================
// GRADUAL DC GROWTH MODEL
// Models annual phased growth from 2027-2035
// ============================================

export interface CumulativeCapacityResult {
    // Total capacity online at this year index
    cumulativeMW: number;
    // New capacity added this year
    yearlyIncrementMW: number;
    // Fraction of total growth (0-1)
    phaseInFraction: number;
}

/**
 * Calculate cumulative DC capacity at a given year using gradual growth model
 *
 * Growth model (default):
 * - Year 0 (2025): 0 MW (base year)
 * - Year 1 (2026): 0 MW (12-month lag)
 * - Year 2 (2027): 1/9 of total
 * - Year 3 (2028): 2/9 of total
 * - ...
 * - Year 10 (2035): 9/9 = 100%
 *
 * @param yearIndex - Year index (0 = base year 2025)
 * @param totalGrowthMW - Total projected DC growth by end year
 * @param growthStartYear - Year index when growth begins (default: 2 = 2027)
 * @param growthEndYear - Year index when growth completes (default: 10 = 2035)
 */
export function calculateCumulativeDCCapacity(
    yearIndex: number,
    totalGrowthMW: number,
    growthStartYear: number = 2,
    growthEndYear: number = 10
): CumulativeCapacityResult {
    const growthYears = growthEndYear - growthStartYear + 1;
    const annualGrowthMW = totalGrowthMW / growthYears;

    // Before growth starts
    if (yearIndex < growthStartYear) {
        return {
            cumulativeMW: 0,
            yearlyIncrementMW: 0,
            phaseInFraction: 0
        };
    }

    // After growth completes
    if (yearIndex > growthEndYear) {
        return {
            cumulativeMW: totalGrowthMW,
            yearlyIncrementMW: 0,
            phaseInFraction: 1.0
        };
    }

    // During growth period
    const yearsOfGrowth = yearIndex - growthStartYear + 1;
    const cumulativeMW = annualGrowthMW * yearsOfGrowth;

    return {
        cumulativeMW,
        yearlyIncrementMW: annualGrowthMW,
        phaseInFraction: cumulativeMW / totalGrowthMW
    };
}

// ============================================
// ENDOGENOUS CAPACITY PRICING
// Models "Hockey Stick" dynamics in capacity markets
// ============================================

export interface CapacityPriceResult {
    // Capacity price before DC addition ($/MW-day)
    oldPrice: number;
    // Capacity price after DC addition ($/MW-day)
    newPrice: number;
    // Reserve margin before DC
    oldReserveMargin: number;
    // Reserve margin after DC
    newReserveMargin: number;
    // Whether system is in scarcity condition
    isScarcity: boolean;
    // Whether system is in critical condition
    isCritical: boolean;
    // Price increase caused by DC ($/MW-day)
    priceIncrease: number;
    // Annual socialized cost impact on existing customers ($)
    socializedCostImpact: number;
    // Breakdown for transparency
    breakdown: {
        systemPeakMW: number;
        totalCapacityMW: number;
        dcPeakContributionMW: number;
        newSystemPeakMW: number;
        conePrice: number;
    };
}

/**
 * Interpolate capacity price from supply curve based on reserve margin
 * Uses linear interpolation between defined slope points
 */
function interpolateCapacityPrice(reserveMargin: number): number {
    const { slopes, costOfNewEntry } = SUPPLY_CURVE;

    // Clamp reserve margin to curve bounds
    const clampedMargin = Math.max(0, Math.min(slopes[0].margin, reserveMargin));

    // Find the two slope points to interpolate between
    for (let i = 0; i < slopes.length - 1; i++) {
        const upper = slopes[i];
        const lower = slopes[i + 1];

        if (clampedMargin <= upper.margin && clampedMargin >= lower.margin) {
            // Linear interpolation between these two points
            const marginRange = upper.margin - lower.margin;
            const priceRange = lower.priceMultiplier - upper.priceMultiplier;
            const marginPosition = (upper.margin - clampedMargin) / marginRange;
            const interpolatedMultiplier = upper.priceMultiplier + (priceRange * marginPosition);
            return costOfNewEntry * interpolatedMultiplier;
        }
    }

    // If below lowest defined margin, use exponential spike
    if (clampedMargin < slopes[slopes.length - 1].margin) {
        const lowestSlope = slopes[slopes.length - 1];
        // Exponential increase as margin approaches zero
        const scarcityFactor = 1 + Math.pow((lowestSlope.margin - clampedMargin) / lowestSlope.margin, 2) * 2;
        return costOfNewEntry * lowestSlope.priceMultiplier * scarcityFactor;
    }

    // If above highest defined margin, use lowest multiplier
    return costOfNewEntry * slopes[0].priceMultiplier;
}

/**
 * Calculate dynamic capacity price based on reserve margin impact from DC addition
 *
 * This models the "capacity cost spillover" where:
 * 1. Large loads consume the reserve margin
 * 2. Reduced reserve margin triggers capacity price spikes via the supply curve
 * 3. Higher capacity prices are paid by ALL load (socialization)
 * 4. Existing ratepayers bear the cost increase on their existing load
 *
 * @param utility - Utility with current capacity and peak data
 * @param dcPeakContributionMW - Data center's peak contribution to system
 * @returns Capacity price result with old/new prices and socialized impact
 */
export function calculateDynamicCapacityPrice(
    utility: Utility,
    dcPeakContributionMW: number
): CapacityPriceResult {
    const systemPeakMW = utility.systemPeakMW;

    // Calculate total generation capacity
    // If not specified, estimate from reserve margin (default 15%)
    const currentReserveMargin = utility.currentReserveMargin ?? 0.15;
    const totalCapacityMW = utility.totalGenerationCapacityMW ??
        (systemPeakMW * (1 + currentReserveMargin));

    // Calculate old reserve margin
    const oldReserveMargin = (totalCapacityMW - systemPeakMW) / systemPeakMW;

    // Calculate new system peak with DC
    const newSystemPeakMW = systemPeakMW + dcPeakContributionMW;

    // Calculate new reserve margin
    // Reserve Margin = (Total Capacity - Peak Load) / Peak Load
    const newReserveMargin = (totalCapacityMW - newSystemPeakMW) / newSystemPeakMW;

    // Interpolate prices from supply curve
    const oldPrice = interpolateCapacityPrice(oldReserveMargin);
    const newPrice = interpolateCapacityPrice(Math.max(0, newReserveMargin));

    const priceIncrease = newPrice - oldPrice;

    // Check scarcity conditions
    const isScarcity = newReserveMargin < SUPPLY_CURVE.scarcityThreshold;
    const isCritical = newReserveMargin < SUPPLY_CURVE.criticalThreshold;

    // Calculate socialized cost impact on existing customers
    // This is the key "capacity cost spillover" - existing load now pays higher prices
    // Existing residential MW * (NewPrice - OldPrice) * 365 days
    const residentialPeakShare = 0.35; // ~35% of peak is residential
    const existingResidentialPeakMW = systemPeakMW * residentialPeakShare;
    const dailyPriceIncrease = priceIncrease; // Already in $/MW-day
    const annualSocializedCost = existingResidentialPeakMW * dailyPriceIncrease * 365;

    return {
        oldPrice,
        newPrice,
        oldReserveMargin,
        newReserveMargin,
        isScarcity,
        isCritical,
        priceIncrease,
        socializedCostImpact: annualSocializedCost,
        breakdown: {
            systemPeakMW,
            totalCapacityMW,
            dcPeakContributionMW,
            newSystemPeakMW,
            conePrice: SUPPLY_CURVE.costOfNewEntry,
        },
    };
}

// ============================================
// REVENUE ADEQUACY CALCULATION
// Based on E3 "Tailored for Scale" methodology
// Compares DC revenue to marginal cost-to-serve
// ============================================

export interface RevenueAdequacyResult {
    // Revenue components (what DC pays through tariff)
    demandChargeRevenue: number;      // CP + NCP demand charges
    energyChargeRevenue: number;      // Energy charges
    customerChargeRevenue: number;    // Fixed monthly charges (estimated)
    totalRevenue: number;

    // Cost components (marginal cost to serve)
    marginalCapacityCost: number;     // Capacity market or embedded
    marginalEnergyCost: number;       // Wholesale energy costs
    networkUpgradeCost: number;       // Only network upgrades (not CIAC)
    totalMarginalCost: number;

    // Revenue adequacy metrics
    surplusOrDeficitPerMW: number;    // (Revenue - Cost) / MW
    revenueAdequacyRatio: number;     // Revenue / Cost (>1.0 = surplus)
    contributesSurplus: boolean;      // true if ratio > 1.0
}

/**
 * Calculate revenue adequacy following E3 methodology
 *
 * E3 Framework (from "Tailored for Scale" pages 26-28):
 * - Revenue Adequacy = Utility Revenue / Marginal Cost to Serve
 * - If > 1.0: Surplus revenue that can benefit other ratepayers
 * - If = 1.0: Neutral impact
 * - If < 1.0: Cost subsidy from other ratepayers
 *
 * Note: Uses calculateTariffBasedDemandCharges for accurate revenue calculation.
 * Some tariffs (like PSO's LPL) have very low energy rates that are essentially
 * wholesale pass-through - the demand charges are the primary revenue driver.
 * Fuel costs are a straight pass-through and not included in margin calculations.
 *
 * @param dcCapacityMW - Data center interconnection capacity
 * @param loadFactor - Average load factor (0-1)
 * @param peakCoincidence - Peak coincidence factor (0-1)
 * @param tariff - Utility-specific tariff structure
 * @param utility - Utility parameters
 * @returns Revenue adequacy result with surplus/deficit per MW
 */
export function calculateRevenueAdequacy(
    dcCapacityMW: number,
    loadFactor: number,
    peakCoincidence: number,
    tariff: TariffStructure | undefined,
    utility: Utility | undefined,
    onsiteGenerationMW: number = 0  // Onsite generation reduces grid peak demand
): RevenueAdequacyResult {
    const annualMWh = dcCapacityMW * loadFactor * 8760;
    // Subtract onsite generation from peak demand (matches calculateNetResidentialImpact logic)
    const peakDemandMW = Math.max(0, dcCapacityMW * peakCoincidence - onsiteGenerationMW);

    // ============================================
    // REVENUE CALCULATION (what DC pays)
    // Use tariff-based calculation for accurate demand charge modeling
    // ============================================

    let demandChargeRevenue: number;
    let energyChargeRevenue: number;

    if (tariff) {
        // Use the comprehensive tariff-based calculation
        const tariffRevenue = calculateTariffBasedDemandCharges(
            dcCapacityMW,
            loadFactor,
            peakCoincidence,
            tariff
        );
        demandChargeRevenue = tariffRevenue.totalDemandRevenue;
        energyChargeRevenue = tariffRevenue.energyRevenue;
    } else {
        // Fallback to default calculation
        const peakDemandCharge = DC_RATE_STRUCTURE.coincidentPeakChargePerMWMonth;
        const maxDemandCharge = DC_RATE_STRUCTURE.nonCoincidentPeakChargePerMWMonth;
        demandChargeRevenue = (peakDemandMW * peakDemandCharge * 12) +
                              (dcCapacityMW * maxDemandCharge * 12);
        energyChargeRevenue = annualMWh * 30; // Default $30/MWh
    }

    // Customer charges (estimated as ~$500/month for large power)
    const customerChargeRevenue = 500 * 12;

    const totalRevenue = demandChargeRevenue + energyChargeRevenue + customerChargeRevenue;

    // ============================================
    // COST CALCULATION (marginal cost to serve)
    // Note: Fuel costs are pass-through and net out in margin calculation
    // ============================================

    // Capacity cost - in regulated markets, demand charges ARE the capacity recovery mechanism
    // We should not double-count by applying both demand charge revenue AND capacity cost
    let marginalCapacityCost: number;
    if (utility?.hasCapacityMarket && utility?.capacityPrice2024) {
        // Capacity market (PJM, NYISO): use market price since retail rates may not fully reflect
        marginalCapacityCost = peakDemandMW * utility.capacityPrice2024 * 365;
    } else if (tariff) {
        // Regulated market with tariff: demand charges are designed to recover capacity costs
        // Calculate net capacity cost NOT already covered by demand charges
        const demandChargeRecovery = (tariff.peakDemandCharge + (tariff.maxDemandCharge || 0)) * 12;
        const embeddedCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear;
        // If demand charges exceed embedded cost, net is zero (no additional capacity cost)
        // The surplus from demand charges goes to benefit other ratepayers
        marginalCapacityCost = peakDemandMW * Math.max(0, embeddedCapacityCost - demandChargeRecovery);
    } else {
        // No tariff, no capacity market - use embedded cost as fallback
        marginalCapacityCost = peakDemandMW * INFRASTRUCTURE_COSTS.capacityCostPerMWYear;
    }

    // Energy cost (wholesale) - this is the marginal generation cost
    // For wholesale pass-through tariffs (like PSO's LPL), the energy component nets out:
    // - DC pays wholesale rate as pass-through
    // - Utility pays wholesale rate to generators
    // - Net margin on energy = 0 (by design for large power tariffs)
    //
    // We detect pass-through tariffs when energy charge < 150% of wholesale cost
    // In this case, use the SAME rate for both revenue and cost to net them out
    const wholesaleEnergyCost = utility?.marginalEnergyCost ?? 38; // $/MWh
    const tariffEnergyCost = tariff?.energyCharge ?? 30; // $/MWh

    // If tariff energy charge is near or below wholesale, it's a pass-through rate
    // Use energy revenue as cost (nets to zero margin), not wholesale cost
    const isWholesalePassThrough = tariffEnergyCost < wholesaleEnergyCost * 1.5;
    const effectiveEnergyCostRate = isWholesalePassThrough ? tariffEnergyCost : wholesaleEnergyCost;
    const marginalEnergyCost = annualMWh * effectiveEnergyCostRate;

    // Network upgrade cost (only socialized portion, not CIAC)
    const interconnection = utility?.interconnection ?? {
        ciacRecoveryFraction: 0.60,
        networkUpgradeCostPerMW: 140000,
    };
    // Annualize over 20-year recovery period
    const networkUpgradeCost = (peakDemandMW * interconnection.networkUpgradeCostPerMW) / 20;

    const totalMarginalCost = marginalCapacityCost + marginalEnergyCost + networkUpgradeCost;

    // ============================================
    // REVENUE ADEQUACY METRICS
    // ============================================

    const surplusOrDeficit = totalRevenue - totalMarginalCost;
    const surplusOrDeficitPerMW = surplusOrDeficit / dcCapacityMW;
    const revenueAdequacyRatio = totalMarginalCost > 0 ? totalRevenue / totalMarginalCost : 1.0;
    const contributesSurplus = revenueAdequacyRatio > 1.0;

    return {
        demandChargeRevenue,
        energyChargeRevenue,
        customerChargeRevenue,
        totalRevenue,
        marginalCapacityCost,
        marginalEnergyCost,
        networkUpgradeCost,
        totalMarginalCost,
        surplusOrDeficitPerMW,
        revenueAdequacyRatio,
        contributesSurplus,
    };
}

// ============================================
// TARIFF-BASED DEMAND CHARGE CALCULATIONS
// ============================================

/**
 * Calculate demand charges and revenue based on utility-specific tariff structure
 *
 * Different utilities have very different demand charge structures:
 * - TOU_PEAK_NCP: PSO/Dominion style - separate peak (TOU) and max (NCP) charges
 * - COINCIDENT_PEAK: Duke style - based on system coincident peak
 * - CP_1_5: AEP Ohio/PJM style - 1CP transmission + 5CP capacity
 * - CP_4: ERCOT style - 4 coincident peaks determine transmission costs
 * - ROLLING_RATCHET: Georgia Power style - 12-month rolling maximum
 *
 * @param dcCapacityMW - Data center interconnection capacity
 * @param loadFactor - Average load factor (0-1)
 * @param peakCoincidence - Fraction of capacity during system peaks (0-1)
 * @param tariff - Utility-specific tariff structure
 * @returns Demand charge revenue and breakdown
 */
export function calculateTariffBasedDemandCharges(
    dcCapacityMW: number,
    loadFactor: number,
    peakCoincidence: number,
    tariff: TariffStructure
): {
    peakDemandRevenue: number;
    maxDemandRevenue: number;
    totalDemandRevenue: number;
    energyRevenue: number;
    totalRevenue: number;
    flexibilityBenefit: number; // How much a flexible DC saves vs firm on demand charges
    breakdown: {
        peakDemandMW: number;
        maxDemandMW: number;
        annualMWh: number;
        tariffType: DemandChargeStructure;
    };
} {
    const isFlexible = peakCoincidence < 1.0;
    const annualMWh = dcCapacityMW * loadFactor * 8760;

    let peakDemandMW: number;
    let maxDemandMW: number;

    switch (tariff.demandChargeType) {
        case 'TOU_PEAK_NCP':
            // PSO/Dominion style: Peak demand based on on-peak usage, Max based on any-time peak
            // Flexible DCs can reduce peak demand by curtailing during on-peak hours
            peakDemandMW = dcCapacityMW * peakCoincidence;
            maxDemandMW = dcCapacityMW; // NCP is based on installed capacity

            // Apply ratchet if defined (e.g., 90% of highest peak in past 11 months)
            if (tariff.ratchetPercent && tariff.ratchetMonths) {
                // For firm load, ratchet keeps them paying high all year
                // For flexible load, ratchet is set at their lower curtailed level
                // This is a simplification - actual ratchet depends on operational history
                const ratchetMultiplier = isFlexible ? 1.0 : 1.05; // Firm pays slightly more due to ratchet
                peakDemandMW *= ratchetMultiplier;
            }
            break;

        case 'COINCIDENT_PEAK':
            // Duke style: Both charges based on coincident peak contribution
            peakDemandMW = dcCapacityMW * peakCoincidence;
            maxDemandMW = dcCapacityMW * peakCoincidence * 0.85; // Distribution portion lower

            // Annual ratchet
            if (tariff.ratchetPercent) {
                // Ratchet applies to both firm and flexible, but flexible has lower base
                peakDemandMW = Math.max(peakDemandMW, dcCapacityMW * tariff.ratchetPercent);
            }
            break;

        case 'CP_1_5':
            // AEP Ohio/PJM style: 1CP for transmission, 5CP for capacity
            // Flexible load that can predict and curtail during CPs gets major benefit
            const cpAvoidanceMultiplier = isFlexible ? 0.65 : 1.0; // Flexible avoids ~35% of CP
            peakDemandMW = dcCapacityMW * peakCoincidence * cpAvoidanceMultiplier;
            maxDemandMW = dcCapacityMW * 0.3; // Distribution is smaller portion
            break;

        case 'CP_4':
            // ERCOT style: 4 coincident peaks determine transmission costs
            // HUGE benefit for flexible loads - curtail 4 hours = major savings
            const fourCPAvoidance = isFlexible ? 0.50 : 1.0; // Flexible avoids ~50% by curtailing during 4CP
            peakDemandMW = dcCapacityMW * peakCoincidence * fourCPAvoidance;
            maxDemandMW = dcCapacityMW * 0.25; // Distribution/local charges
            break;

        case 'ROLLING_RATCHET':
            // Georgia Power style: 12-month rolling maximum
            // Summer peak affects billing for entire year
            peakDemandMW = dcCapacityMW * peakCoincidence;
            maxDemandMW = 0; // Included in peak demand (single charge with ratchet)

            // 95% summer ratchet means one high summer month affects whole year
            if (tariff.ratchetPercent) {
                const summerMultiplier = isFlexible ? 0.85 : 1.0;
                peakDemandMW *= (1 + (tariff.ratchetPercent - 1) * summerMultiplier);
            }
            break;

        default:
            // Fallback to simple CP/NCP split
            peakDemandMW = dcCapacityMW * peakCoincidence;
            maxDemandMW = dcCapacityMW;
    }

    // Calculate annual revenues
    const peakDemandRevenue = peakDemandMW * tariff.peakDemandCharge * 12;
    const maxDemandRevenue = maxDemandMW * tariff.maxDemandCharge * 12;
    const totalDemandRevenue = peakDemandRevenue + maxDemandRevenue;
    const energyRevenue = annualMWh * tariff.energyCharge;
    const totalRevenue = totalDemandRevenue + energyRevenue;

    // Calculate flexibility benefit (savings vs firm load)
    const firmPeakDemandMW = dcCapacityMW; // Firm load at full capacity
    const firmPeakRevenue = firmPeakDemandMW * tariff.peakDemandCharge * 12;
    const firmMaxRevenue = dcCapacityMW * tariff.maxDemandCharge * 12;
    const firmTotalDemand = firmPeakRevenue + firmMaxRevenue;
    const flexibilityBenefit = isFlexible ? (firmTotalDemand - totalDemandRevenue) : 0;

    return {
        peakDemandRevenue,
        maxDemandRevenue,
        totalDemandRevenue,
        energyRevenue,
        totalRevenue,
        flexibilityBenefit,
        breakdown: {
            peakDemandMW,
            maxDemandMW,
            annualMWh,
            tariffType: tariff.demandChargeType,
        },
    };
}

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
        cumulativeCapacityMW?: number;
        phaseInFraction?: number;
    };
    parameters?: {
        loadFactor?: number;
        peakCoincidence?: number;
        residentialAllocation?: number;
        curtailablePercent?: number;
        onsiteGenerationMW?: number;
        cumulativeCapacityMW?: number;
        phaseInFraction?: number;
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
 * 1. Utility-specific tariff structures (TOU, CP, 4CP, ratchets)
 * 2. Split demand charges into CP (coincident peak) and NCP (non-coincident peak)
 * 3. ERCOT 4CP transmission allocation - huge benefit for flexible loads
 * 4. Flexible DCs can install more capacity for same grid impact
 */
const calculateNetResidentialImpact = (
    dcCapacityMW: number,
    loadFactor: number,
    peakCoincidence: number,
    residentialCustomers: number,
    residentialAllocation: number,
    includeCapacityCredit: boolean = false,
    onsiteGenMW: number = 0,
    utility?: Utility,
    tariff?: TariffStructure
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
    // TRANSMISSION COSTS - CIAC vs Network Upgrade Split
    // Based on E3 methodology: exclude "infrastructure exclusive to the
    // Amazon facility that Amazon pays for upfront"
    // ============================================
    let transmissionCost: number;

    // Get interconnection cost structure (CIAC recovery vs network upgrades)
    const interconnection = utility?.interconnection ?? {
        ciacRecoveryFraction: 0.60, // Default: 60% CIAC recovery
        networkUpgradeCostPerMW: 140000, // Default: $140k/MW network upgrades
    };

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

        // Network upgrade portion (not covered by CIAC) - ERCOT has higher CIAC recovery
        const networkUpgradeCost = Math.max(0, effectivePeakMW) * interconnection.networkUpgradeCostPerMW;
        transmissionCost = annualTransmissionCost + (networkUpgradeCost / 20);
    } else {
        // Traditional markets: Only network upgrade costs are socialized
        // CIAC-covered costs (direct facility costs) are excluded per E3 methodology
        // DC pays upfront for dedicated substations, interconnection lines, etc.
        const networkUpgradeCost = Math.max(0, effectivePeakMW) * interconnection.networkUpgradeCostPerMW;
        transmissionCost = networkUpgradeCost;
    }

    // ============================================
    // DISTRIBUTION COSTS - Connection voltage matters
    // ============================================
    // Large data centers (typically >10-20 MW) connect at transmission voltage (69kV+)
    // and build their own substations. They do NOT use the utility's distribution grid.
    // Charging full distribution costs creates a "phantom cost" that inflates the model.
    //
    // - Large DCs (>20 MW): Transmission-level service, minimal distribution cost
    //   (only interconnection fees, metering, some local upgrades)
    // - Medium DCs (10-20 MW): May use subtransmission, partial distribution costs
    // - Small DCs (<10 MW): May use distribution system, full costs apply
    const LARGE_DC_THRESHOLD_MW = 20;
    const MEDIUM_DC_THRESHOLD_MW = 10;

    let distributionCostMultiplier: number;
    if (dcCapacityMW >= LARGE_DC_THRESHOLD_MW) {
        // Transmission-level connection: only ~10% for interconnection facilities
        distributionCostMultiplier = 0.10;
    } else if (dcCapacityMW >= MEDIUM_DC_THRESHOLD_MW) {
        // Subtransmission: ~40% of distribution costs
        distributionCostMultiplier = 0.40;
    } else {
        // Distribution-level connection: full costs
        distributionCostMultiplier = 1.0;
    }

    const distributionCost = Math.max(0, effectivePeakMW) * INFRASTRUCTURE_COSTS.distributionCostPerMW * distributionCostMultiplier;

    // Annualize infrastructure costs (20-year recovery period)
    const annualizedTransmissionCost = utility?.marketType === 'ercot'
        ? transmissionCost // Already annualized for ERCOT 4CP
        : transmissionCost / 20;
    const annualizedDistributionCost = distributionCost / 20;
    const annualizedInfraCost = annualizedTransmissionCost + annualizedDistributionCost;

    // ============================================
    // CAPACITY COSTS - Market-specific with ENDOGENOUS PRICING
    // ============================================
    let baseCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear;
    const capacityCostPassThrough = utility?.capacityCostPassThrough ?? 0.40;

    // Endogenous capacity pricing variables
    let capacityPriceResult: CapacityPriceResult | null = null;
    let socializedCapacityCost = 0; // The "capacity cost spillover" cost impact

    if (utility?.hasCapacityMarket) {
        // Calculate dynamic capacity price based on reserve margin impact
        capacityPriceResult = calculateDynamicCapacityPrice(utility, effectivePeakMW);

        // The DC pays the new capacity price for its own load
        const dcCapacityPriceAnnual = capacityPriceResult.newPrice * 365;
        baseCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.3 +
                          dcCapacityPriceAnnual * capacityCostPassThrough * 0.7;

        // CRITICAL: Calculate the socialized cost impact on existing ratepayers
        // This is the "Hockey Stick" effect - ALL load pays the higher price
        // The DC's addition to system peak causes prices to rise for everyone
        socializedCapacityCost = capacityPriceResult.socializedCostImpact * capacityCostPassThrough;

    } else if (utility?.capacityPrice2024) {
        // Fallback to static pricing if no endogenous calculation
        const capacityPriceAnnual = utility.capacityPrice2024 * 365;
        baseCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.5 +
                          capacityPriceAnnual * capacityCostPassThrough * 0.5;
    }

    if (utility?.marketType === 'ercot') {
        // No capacity market in ERCOT, but still need some generation adequacy costs
        baseCapacityCost = INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.50;
        socializedCapacityCost = 0; // No socialization in energy-only market
    }

    // ============================================
    // DEMAND CHARGE REVENUE - Tariff-specific or generic
    // ============================================
    let dcRevenue: ReturnType<typeof calculateDCRevenueOffset>;
    let tariffBasedRevenue: ReturnType<typeof calculateTariffBasedDemandCharges> | null = null;
    let flexibilityBenefitFromTariff = 0;

    if (tariff) {
        // Use utility-specific tariff calculations
        tariffBasedRevenue = calculateTariffBasedDemandCharges(
            dcCapacityMW,
            loadFactor,
            peakCoincidence,
            tariff
        );
        flexibilityBenefitFromTariff = tariffBasedRevenue.flexibilityBenefit;

        // Create compatible dcRevenue object for rest of calculation
        dcRevenue = {
            cpDemandRevenue: tariffBasedRevenue.peakDemandRevenue,
            ncpDemandRevenue: tariffBasedRevenue.maxDemandRevenue,
            demandRevenue: tariffBasedRevenue.totalDemandRevenue,
            energyMargin: tariffBasedRevenue.energyRevenue,
            total: tariffBasedRevenue.totalRevenue,
            perYear: tariffBasedRevenue.totalRevenue,
            breakdown: {
                coincidentPeakMW: tariffBasedRevenue.breakdown.peakDemandMW,
                ncpPeakMW: tariffBasedRevenue.breakdown.maxDemandMW,
                annualMWh: tariffBasedRevenue.breakdown.annualMWh,
                cpChargeRate: tariff.peakDemandCharge,
                ncpChargeRate: tariff.maxDemandCharge,
            },
        };
    } else {
        // Use generic split demand charge calculation
        dcRevenue = calculateDCRevenueOffset(dcCapacityMW, loadFactor, peakCoincidence, 1, {
            effectiveCapacityMW: dcCapacityMW,
            marketType: utility?.marketType,
        });
    }

    // Net capacity cost after demand charge offset
    // Peak/CP demand charges offset CP-related capacity costs
    const peakDemandChargeAnnual = tariff
        ? tariff.peakDemandCharge * 12
        : DC_RATE_STRUCTURE.coincidentPeakChargePerMWMonth * 12;
    const netCapacityCostPerMW = Math.max(0, baseCapacityCost - peakDemandChargeAnnual);
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
    // REVENUE OFFSET CALCULATION - Cost Causation Principle
    // ============================================
    // In proper cost-of-service ratemaking, industrial tariffs are DESIGNED to recover
    // the cost of serving that customer class. If the DC pays its tariff rates:
    // - Demand charges cover their share of capacity/transmission costs
    // - Energy charges cover fuel + variable costs + overhead allocation
    // - The utility's revenue requirement is MET, not exceeded
    //
    // KEY INSIGHT: In regulated markets, DC tariff revenue should nearly FULLY offset
    // DC-caused costs because that's how cost-of-service ratemaking works.
    // The PUC sets rates to recover costs - if DC pays those rates, costs are recovered.
    //
    // Revenue offset components:
    // 1. DEMAND CHARGES (CP + NCP): These ARE the cost recovery mechanism for fixed costs
    //    - CP charges cover generation/capacity costs
    //    - NCP charges cover distribution/customer costs
    //    - These should offset infrastructure costs nearly 1:1 in regulated markets
    //
    // 2. ENERGY MARGIN: Covers variable costs plus contributes to fixed cost recovery
    //
    // Flow-through rates by market type:
    // - Regulated: ~90% - tariff IS cost recovery; small friction for rate case lag
    // - ERCOT: ~70% - market-based, some mismatch between wholesale and retail
    // - Capacity markets: ~60% - capacity price volatility creates mismatch

    const isRegulatedMarket = !utility?.hasCapacityMarket && utility?.marketType !== 'ercot';

    // Demand charge flow-through: how much of demand revenue offsets infrastructure costs
    // In regulated markets, demand charges ARE the cost recovery mechanism
    const demandChargeFlowThrough = isRegulatedMarket ? 0.90 :
                                    utility?.marketType === 'ercot' ? 0.70 :
                                    0.60; // Capacity markets

    // Energy margin flow-through: energy charges beyond fuel cost
    const energyMarginFlowThrough = isRegulatedMarket ? 0.85 :
                                    utility?.marketType === 'ercot' ? 0.65 :
                                    0.50;

    // Total revenue offset
    // Demand charges (both CP and NCP) offset fixed infrastructure costs
    const demandRevenueOffset = dcRevenue.demandRevenue * demandChargeFlowThrough;
    const energyRevenueOffset = dcRevenue.energyMargin * energyMarginFlowThrough;
    let revenueOffset = demandRevenueOffset + energyRevenueOffset;

    // Apply tariff-specific flexibility benefit if using tariff-based calculations
    if (tariff && isFlexible && flexibilityBenefitFromTariff > 0) {
        const scaledFlexBenefit = flexibilityBenefitFromTariff * tariff.flexibilityBenefitMultiplier * 0.20;
        revenueOffset += scaledFlexBenefit;
    }

    const netAnnualImpact = grossAnnualInfraCost - revenueOffset;

    // ============================================
    // RESIDENTIAL ALLOCATION - Market-adjusted with Cost Causation
    // ============================================
    let adjustedAllocation = residentialAllocation;

    // COST CAUSATION PRINCIPLE
    // ------------------------
    // In regulated markets with proper cost-of-service ratemaking:
    // - Industrial tariffs are designed to recover the cost of serving industrial customers
    // - If DC pays their tariff rates, they ARE paying for their cost causation
    // - Any "net impact" should only be from costs NOT covered by tariff (rare)
    //
    // The key question: What share of NET costs (after DC revenue offset) should residential bear?
    // Answer: Only the share of costs that the DC didn't pay for through their tariff.
    //
    // If DC revenue >= DC costs caused → residential allocation should be ~0 or negative (benefit)
    // If DC revenue < DC costs caused → residential bears share of the gap

    // Calculate how well DC revenue covers DC-caused costs
    const dcCostRecoveryRatio = Math.min(1.5, revenueOffset / Math.max(1, grossAnnualInfraCost));

    // ERCOT 4CP Cost Causation Adjustment
    const ERCOT_4CP_COST_CAUSATION_FACTOR = 0.60;

    if (utility?.marketType === 'ercot') {
        adjustedAllocation = residentialAllocation * ERCOT_4CP_COST_CAUSATION_FACTOR;
    } else if (isRegulatedMarket) {
        // REGULATED MARKETS: Aggressive cost causation adjustment
        // If DC revenue covers costs, residential allocation approaches zero
        // The formula: allocation = base * (1 - costRecoveryRatio)^0.5
        // At 100% cost recovery: allocation drops to ~0
        // At 50% cost recovery: allocation is ~30% of base
        // At 0% cost recovery: allocation is 100% of base
        const costRecoveryCapped = Math.min(1.0, dcCostRecoveryRatio);
        const regulatedCostCausationFactor = Math.pow(1 - costRecoveryCapped, 0.5);
        adjustedAllocation = residentialAllocation * Math.max(0.05, regulatedCostCausationFactor);

        // RATE SPREADING BENEFIT for high load factor loads
        // A high LF industrial load spreads fixed costs over more kWh
        // This benefits all ratepayers through lower average costs
        // Effect: ~5-15% reduction in residential allocation for high LF loads
        if (loadFactor >= 0.80) {
            const loadFactorBenefit = (loadFactor - 0.80) * 0.5; // 0-10% benefit
            adjustedAllocation = adjustedAllocation * (1 - loadFactorBenefit);
        }
    }
    // Note: For capacity markets, we no longer adjust allocation here because
    // socializedCapacityCost is added explicitly below. This avoids double-counting.

    // Add socialized capacity cost to the residential impact
    // This is the "capacity cost spillover" - the price increase caused by the DC
    // is paid by ALL existing customers on their existing load
    const baseResidentialImpact = netAnnualImpact * adjustedAllocation;
    let residentialImpact = baseResidentialImpact + socializedCapacityCost;

    // Apply floor to prevent unrealistically large bill decreases
    // Even with ideal DC integration, bills don't drop by more than ~15% from DC revenue alone
    // This reflects regulatory friction, utility retained earnings, and infrastructure reality
    const maxBenefitPerCustomerAnnual = -0.15 * 12 * (utility?.averageMonthlyBill ?? 130);
    const minResidentialImpact = maxBenefitPerCustomerAnnual * residentialCustomers;
    if (residentialImpact < minResidentialImpact) {
        residentialImpact = minResidentialImpact;
    }

    const perCustomerMonthly = residentialImpact / residentialCustomers / 12;

    // Calculate revenue adequacy (E3 methodology)
    const revenueAdequacy = calculateRevenueAdequacy(
        dcCapacityMW,
        loadFactor,
        peakCoincidence,
        tariff,
        utility,
        onsiteGenMW  // Pass onsite generation to reduce grid peak demand
    );

    return {
        perCustomerMonthly,
        annualResidentialImpact: residentialImpact,
        grossCost: grossAnnualInfraCost,
        revenueOffset,
        netImpact: netAnnualImpact,
        // Endogenous capacity pricing results
        capacityPriceResult: capacityPriceResult ?? undefined,
        socializedCapacityCost,
        // Revenue adequacy (E3 methodology)
        revenueAdequacy,
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
            // Endogenous pricing metrics
            oldCapacityPrice: capacityPriceResult?.oldPrice,
            newCapacityPrice: capacityPriceResult?.newPrice,
            oldReserveMargin: capacityPriceResult?.oldReserveMargin,
            newReserveMargin: capacityPriceResult?.newReserveMargin,
            isScarcity: capacityPriceResult?.isScarcity ?? false,
            isCritical: capacityPriceResult?.isCritical ?? false,
            socializedCapacityCost,
            // Revenue adequacy metrics
            revenueAdequacyRatio: revenueAdequacy.revenueAdequacyRatio,
            surplusPerMW: revenueAdequacy.surplusOrDeficitPerMW,
            contributesSurplus: revenueAdequacy.contributesSurplus,
            // Interconnection cost breakdown
            ciacRecoveryFraction: interconnection.ciacRecoveryFraction,
            networkUpgradeCostPerMW: interconnection.networkUpgradeCostPerMW,
        },
    };
};

// ============================================
// TRAJECTORY CALCULATIONS
// ============================================

export const calculateBaselineTrajectory = (
    utility: Utility = DEFAULT_UTILITY,
    years: number = TIME_PARAMS.projectionYears,
    escalationConfig?: EscalationConfig
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    let currentBill = utility.averageMonthlyBill;

    // Calculate escalation rate based on enabled toggles
    // If no config provided or both toggles off, baseline is flat (no escalation)
    let baselineIncreaseRate = 0;
    if (escalationConfig?.inflationEnabled) {
        baselineIncreaseRate += escalationConfig.inflationRate;
    }
    if (escalationConfig?.infrastructureAgingEnabled) {
        baselineIncreaseRate += escalationConfig.infrastructureAgingRate;
    }

    for (let year = 0; year <= years; year++) {
        if (year > 0 && baselineIncreaseRate > 0) {
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
    years: number = TIME_PARAMS.projectionYears,
    tariff?: TariffStructure,
    escalationConfig?: EscalationConfig
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years, escalationConfig);

    const firmLF = dataCenter.firmLoadFactor || 0.80;
    const firmPeakCoincidence = dataCenter.firmPeakCoincidence || 1.0;

    // Auction lag: capacity market price impacts
    // NOTE: In the current environment (2025-2026), capacity prices in PJM and other
    // organized markets are ALREADY elevated due to data center load growth that was
    // factored into recent auctions (2025/26: $269.92/MW-day, 2026/27 and 2027/28 at caps).
    // New data center load coming online immediately contributes to the tight reserve
    // margin environment. We use marketLag = 0 because:
    // 1. Capacity prices are already high and reflect anticipated DC growth
    // 2. New load immediately adds to the scarcity that's driving current prices
    // 3. Retail rates are already being updated to reflect these higher capacity costs
    const marketLag = 0;

    for (let year = 0; year <= years; year++) {
        let dcImpact = 0;
        let currentAllocation = utility.baseResidentialAllocation;
        let yearMetrics = null;

        // Use gradual growth model: DC capacity builds up 2027-2035
        const growthResult = calculateCumulativeDCCapacity(year, dataCenter.capacityMW, 2, 10);
        const effectiveCapacityMW = growthResult.cumulativeMW;

        if (effectiveCapacityMW > 0) {
            const yearsOnline = year - 2;

            const allocationResult = calculateResidentialAllocation(
                utility,
                effectiveCapacityMW,
                firmLF,
                firmPeakCoincidence,
                yearsOnline
            );
            currentAllocation = allocationResult.allocation;

            const yearImpact = calculateNetResidentialImpact(
                effectiveCapacityMW,
                firmLF,
                firmPeakCoincidence,
                utility.residentialCustomers,
                currentAllocation,
                false,
                0,
                utility,
                tariff
            );

            yearMetrics = yearImpact.metrics;

            // Separate socialized capacity cost (capacity cost spillover) from direct infrastructure costs
            // Socialized cost only applies after the auction lag period
            const socializedPerCustomerMonthly = yearImpact.socializedCapacityCost / utility.residentialCustomers / 12;
            const baseImpactPerCustomerMonthly = yearImpact.perCustomerMonthly - socializedPerCustomerMonthly;

            // Direct infrastructure costs apply with gradual growth (no separate phase-in needed)
            let directImpact = baseImpactPerCustomerMonthly;

            // Socialized capacity cost only applies after auction lag
            let socializedImpact = 0;
            if (yearsOnline >= marketLag) {
                socializedImpact = socializedPerCustomerMonthly;
            }

            dcImpact = directImpact + socializedImpact;

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
            dcOnline: effectiveCapacityMW > 0,
            components: {
                baseline: baseline[year].monthlyBill,
                dcImpact,
                cumulativeCapacityMW: effectiveCapacityMW,
                phaseInFraction: growthResult.phaseInFraction,
            },
            parameters: {
                loadFactor: firmLF,
                peakCoincidence: firmPeakCoincidence,
                residentialAllocation: effectiveCapacityMW > 0 ? currentAllocation : utility.baseResidentialAllocation,
            },
            metrics: yearMetrics,
        });
    }

    return trajectory;
};

export const calculateFlexibleTrajectory = (
    utility: Utility = DEFAULT_UTILITY,
    dataCenter: DataCenter = DEFAULT_DATA_CENTER,
    years: number = TIME_PARAMS.projectionYears,
    tariff?: TariffStructure,
    escalationConfig?: EscalationConfig
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years, escalationConfig);

    const flexLF = dataCenter.flexLoadFactor || 0.95;
    const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.75;

    // Capacity costs apply immediately - see comment in calculateUnoptimizedTrajectory
    const marketLag = 0;

    for (let year = 0; year <= years; year++) {
        let dcImpact = 0;
        let currentAllocation = utility.baseResidentialAllocation;
        let yearMetrics = null;

        // Use gradual growth model: DC capacity builds up 2027-2035
        const growthResult = calculateCumulativeDCCapacity(year, dataCenter.capacityMW, 2, 10);
        const effectiveCapacityMW = growthResult.cumulativeMW;

        if (effectiveCapacityMW > 0) {
            const yearsOnline = year - 2;

            const allocationResult = calculateResidentialAllocation(
                utility,
                effectiveCapacityMW,
                flexLF,
                flexPeakCoincidence,
                yearsOnline
            );
            currentAllocation = allocationResult.allocation;

            const yearImpact = calculateNetResidentialImpact(
                effectiveCapacityMW,
                flexLF,
                flexPeakCoincidence,
                utility.residentialCustomers,
                currentAllocation,
                true,
                0,
                utility,
                tariff
            );

            yearMetrics = yearImpact.metrics;

            // Separate socialized capacity cost from direct infrastructure costs
            const socializedPerCustomerMonthly = yearImpact.socializedCapacityCost / utility.residentialCustomers / 12;
            const baseImpactPerCustomerMonthly = yearImpact.perCustomerMonthly - socializedPerCustomerMonthly;

            // Direct infrastructure costs apply with gradual growth
            let directImpact = baseImpactPerCustomerMonthly;

            // Socialized capacity cost only applies after auction lag
            let socializedImpact = 0;
            if (yearsOnline >= marketLag) {
                socializedImpact = socializedPerCustomerMonthly;
            }

            dcImpact = directImpact + socializedImpact;

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
            dcOnline: effectiveCapacityMW > 0,
            components: {
                baseline: baseline[year].monthlyBill,
                dcImpact,
            },
            parameters: {
                loadFactor: flexLF,
                peakCoincidence: flexPeakCoincidence,
                residentialAllocation: effectiveCapacityMW > 0 ? currentAllocation : utility.baseResidentialAllocation,
                curtailablePercent: 1 - flexPeakCoincidence,
                cumulativeCapacityMW: effectiveCapacityMW,
                phaseInFraction: growthResult.phaseInFraction,
            },
            metrics: yearMetrics,
        });
    }

    return trajectory;
};

/**
 * Calculate trajectory for "Optimized" data center scenario with onsite generation
 *
 * IMPORTANT NOTE ON ONSITE GENERATION COSTS:
 * This model calculates the impact on RATEPAYER bills, not DC economics.
 * The onsite generation reduces peak grid draw (benefiting ratepayers by avoiding
 * infrastructure costs), but the DC bears the capital cost of that generation.
 *
 * We assume the DC finds onsite generation economic because modern data centers
 * often install generation that provides multiple value streams:
 * - Peak shaving / demand charge avoidance (often $100-200k/MW-year in savings)
 * - Backup power / islanding capability (required for Tier III/IV reliability)
 * - Baseload operation with N+1 or N+2 redundancy
 * - Grid services revenue (frequency response, capacity markets)
 *
 * Typical costs: $600-1,200k/MW capital for gas peakers/reciprocating engines
 * (see DEFAULT_DATA_CENTER.generationCapitalCostPerMW in constants.ts)
 *
 * The ratepayer benefit shown here is real - the DC is paying to avoid grid costs
 * that would otherwise be socialized. This is the "win-win" of optimized design.
 */
export const calculateDispatchableTrajectory = (
    utility: Utility = DEFAULT_UTILITY,
    dataCenter: DataCenter = DEFAULT_DATA_CENTER,
    years: number = TIME_PARAMS.projectionYears,
    tariff?: TariffStructure,
    escalationConfig?: EscalationConfig
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years, escalationConfig);

    const flexLF = dataCenter.flexLoadFactor || 0.95;
    const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.75;
    const onsiteGenMW = dataCenter.onsiteGenerationMW || dataCenter.capacityMW * 0.2;

    // Capacity costs apply immediately - see comment in calculateUnoptimizedTrajectory
    const marketLag = 0;

    for (let year = 0; year <= years; year++) {
        let dcImpact = 0;
        let currentAllocation = utility.baseResidentialAllocation;
        let yearMetrics = null;

        // Use gradual growth model: DC capacity builds up 2027-2035
        const growthResult = calculateCumulativeDCCapacity(year, dataCenter.capacityMW, 2, 10);
        const effectiveCapacityMW = growthResult.cumulativeMW;
        // Scale onsite generation proportionally to cumulative capacity
        const effectiveOnsiteGenMW = effectiveCapacityMW > 0
            ? onsiteGenMW * (effectiveCapacityMW / dataCenter.capacityMW)
            : 0;

        if (effectiveCapacityMW > 0) {
            const yearsOnline = year - 2;

            const effectivePeakCoincidence = Math.max(0, flexPeakCoincidence - (onsiteGenMW / dataCenter.capacityMW));
            const allocationResult = calculateResidentialAllocation(
                utility,
                effectiveCapacityMW,
                flexLF,
                effectivePeakCoincidence,
                yearsOnline
            );
            currentAllocation = allocationResult.allocation;

            const yearImpact = calculateNetResidentialImpact(
                effectiveCapacityMW,
                flexLF,
                flexPeakCoincidence,
                utility.residentialCustomers,
                currentAllocation,
                true,
                effectiveOnsiteGenMW,
                utility,
                tariff
            );

            yearMetrics = {
                ...yearImpact.metrics,
                onsiteGenMW: effectiveOnsiteGenMW,
                netPeakDraw: yearImpact.metrics.effectivePeakMW,
            };

            // Separate socialized capacity cost from direct infrastructure costs
            const socializedPerCustomerMonthly = yearImpact.socializedCapacityCost / utility.residentialCustomers / 12;
            const baseImpactPerCustomerMonthly = yearImpact.perCustomerMonthly - socializedPerCustomerMonthly;

            // Direct infrastructure costs apply with gradual growth
            let directImpact = baseImpactPerCustomerMonthly;

            // Socialized capacity cost only applies after auction lag
            let socializedImpact = 0;
            if (yearsOnline >= marketLag) {
                socializedImpact = socializedPerCustomerMonthly;
            }

            dcImpact = directImpact + socializedImpact;

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
            dcOnline: effectiveCapacityMW > 0,
            components: {
                baseline: baseline[year].monthlyBill,
                dcImpact,
                cumulativeCapacityMW: effectiveCapacityMW,
                phaseInFraction: growthResult.phaseInFraction,
            },
            parameters: {
                loadFactor: flexLF,
                peakCoincidence: flexPeakCoincidence,
                onsiteGenerationMW: effectiveOnsiteGenMW,
                residentialAllocation: effectiveCapacityMW > 0 ? currentAllocation : utility.baseResidentialAllocation,
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
    years: number = TIME_PARAMS.projectionYears,
    tariff?: TariffStructure,
    escalationConfig?: EscalationConfig
) => {
    return {
        baseline: calculateBaselineTrajectory(utility, years, escalationConfig),
        unoptimized: calculateUnoptimizedTrajectory(utility, dataCenter, years, tariff, escalationConfig),
        flexible: calculateFlexibleTrajectory(utility, dataCenter, years, tariff, escalationConfig),
        dispatchable: calculateDispatchableTrajectory(utility, dataCenter, years, tariff, escalationConfig),
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
