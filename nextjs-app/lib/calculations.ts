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
    calculateDCRevenueOffset,
    type Utility,
    type DataCenter,
} from './constants';

import {
    type TariffStructure,
    type DemandChargeStructure,
} from './utilityData';

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
    // REVENUE OFFSET CALCULATION
    // ============================================
    // Energy margin flows through to benefit ratepayers, but with significant friction:
    // - Regulated utilities: Revenue goes to utility, benefits flow through rate cases over years
    // - ISO markets: More direct connection but still regulatory friction
    // - ERCOT: Most direct since competitive retail, but still not 1:1
    //
    // CRITICAL: For small utilities (like BHE Cheyenne with 45k customers), the flow-through
    // must account for the fact that:
    // 1. PPA/tolling arrangements mean revenue goes to developers, not ratepayers
    // 2. Rate cases are infrequent (every 2-5 years)
    // 3. Utilities may retain margin as shareholder value, not rate reduction
    //
    // We use a conservative flow-through that scales with utility size to reflect
    // that larger utilities have more regulatory scrutiny and cost allocation mechanisms.
    const baseFlowThrough = utility?.marketType === 'ercot' ? 0.50 :
                            utility?.hasCapacityMarket ? 0.40 : 0.25;

    // Scale down for very small utilities where DC revenue dominates
    // and regulatory mechanisms are less refined
    const customerScaleFactor = Math.min(1.0, residentialCustomers / 200000);
    const energyMarginFlowThrough = baseFlowThrough * (0.3 + 0.7 * customerScaleFactor);

    // NCP/Max demand charges provide fixed cost spreading benefit
    // (The DC is paying toward system costs regardless of when they use power)
    // Reduced from 0.20 to 0.10 - demand charges cover utility costs, not ratepayer relief
    const ncpDemandBenefit = dcRevenue.ncpDemandRevenue * 0.10;

    // Total revenue offset
    let revenueOffset = (dcRevenue.energyMargin * energyMarginFlowThrough) + ncpDemandBenefit;

    // Apply tariff-specific flexibility benefit if using tariff-based calculations
    // This captures the savings from avoiding peak demand charges in TOU tariffs
    if (tariff && isFlexible && flexibilityBenefitFromTariff > 0) {
        // The flexibility benefit represents reduced demand charges paid by DC
        // This is a cost the DC avoids, which reduces the total cost impact
        // Apply the tariff's flexibility benefit multiplier to scale the benefit appropriately
        const scaledFlexBenefit = flexibilityBenefitFromTariff * tariff.flexibilityBenefitMultiplier * 0.15;
        revenueOffset += scaledFlexBenefit;
    }

    const netAnnualImpact = grossAnnualInfraCost - revenueOffset;

    // ============================================
    // RESIDENTIAL ALLOCATION - Market-adjusted
    // ============================================
    let adjustedAllocation = residentialAllocation;

    // ERCOT 4CP Cost Causation Adjustment
    // ------------------------------------
    // In ERCOT, transmission costs are allocated via 4CP (Four Coincident Peak) methodology:
    // - Each customer's transmission cost share = their load during 4 specific peak hours/year
    // - If a DC curtails during those 4 hours, they pay dramatically less transmission
    //
    // KEY INSIGHT: This is about COST CAUSATION, not just cost allocation:
    // - A flexible DC that avoids 4CP peaks is NOT driving transmission investment
    // - The utility's transmission revenue requirement doesn't change, BUT
    // - The DC is correctly paying less because they're not causing the peak-driven costs
    // - This model reduces residential allocation because the DC's NET IMPACT on the system
    //   is lower when they don't contribute to peaks that drive transmission buildout
    //
    // Note: If viewed purely as cost ALLOCATION (fixed pie), residential share would
    // technically increase when DC pays less. But our model calculates NET IMPACT
    // (costs caused minus revenue contributed), so reduced cost causation = reduced impact.
    const ERCOT_4CP_COST_CAUSATION_FACTOR = 0.70;

    if (utility?.marketType === 'ercot') {
        adjustedAllocation = residentialAllocation * ERCOT_4CP_COST_CAUSATION_FACTOR;
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

    return {
        perCustomerMonthly,
        annualResidentialImpact: residentialImpact,
        grossCost: grossAnnualInfraCost,
        revenueOffset,
        netImpact: netAnnualImpact,
        // Endogenous capacity pricing results
        capacityPriceResult: capacityPriceResult ?? undefined,
        socializedCapacityCost,
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
    years: number = TIME_PARAMS.projectionYears,
    tariff?: TariffStructure
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years);

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
                utility,
                tariff
            );

            yearMetrics = yearImpact.metrics;

            // Separate socialized capacity cost (capacity cost spillover) from direct infrastructure costs
            // Socialized cost only applies after the auction lag period
            const socializedPerCustomerMonthly = yearImpact.socializedCapacityCost / utility.residentialCustomers / 12;
            const baseImpactPerCustomerMonthly = yearImpact.perCustomerMonthly - socializedPerCustomerMonthly;

            // Direct infrastructure costs apply immediately
            let directImpact = baseImpactPerCustomerMonthly * phaseIn;

            // Socialized capacity cost only applies after auction lag
            let socializedImpact = 0;
            if (yearsOnline >= marketLag) {
                socializedImpact = socializedPerCustomerMonthly * phaseIn;
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
    years: number = TIME_PARAMS.projectionYears,
    tariff?: TariffStructure
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years);

    const flexLF = dataCenter.flexLoadFactor || 0.95;
    const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.75;

    // Capacity costs apply immediately - see comment in calculateUnoptimizedTrajectory
    const marketLag = 0;

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
                utility,
                tariff
            );

            yearMetrics = yearImpact.metrics;

            // Separate socialized capacity cost from direct infrastructure costs
            const socializedPerCustomerMonthly = yearImpact.socializedCapacityCost / utility.residentialCustomers / 12;
            const baseImpactPerCustomerMonthly = yearImpact.perCustomerMonthly - socializedPerCustomerMonthly;

            // Direct infrastructure costs apply immediately
            let directImpact = baseImpactPerCustomerMonthly * phaseIn;

            // Socialized capacity cost only applies after auction lag
            let socializedImpact = 0;
            if (yearsOnline >= marketLag) {
                socializedImpact = socializedPerCustomerMonthly * phaseIn;
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
    tariff?: TariffStructure
): TrajectoryPoint[] => {
    const trajectory: TrajectoryPoint[] = [];
    const baseYear = TIME_PARAMS.baseYear;
    const baseline = calculateBaselineTrajectory(utility, years);

    const flexLF = dataCenter.flexLoadFactor || 0.95;
    const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.75;
    const onsiteGenMW = dataCenter.onsiteGenerationMW || dataCenter.capacityMW * 0.2;

    // Capacity costs apply immediately - see comment in calculateUnoptimizedTrajectory
    const marketLag = 0;

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
                utility,
                tariff
            );

            yearMetrics = {
                ...yearImpact.metrics,
                onsiteGenMW,
                netPeakDraw: yearImpact.metrics.effectivePeakMW,
            };

            // Separate socialized capacity cost from direct infrastructure costs
            const socializedPerCustomerMonthly = yearImpact.socializedCapacityCost / utility.residentialCustomers / 12;
            const baseImpactPerCustomerMonthly = yearImpact.perCustomerMonthly - socializedPerCustomerMonthly;

            // Direct infrastructure costs apply immediately
            let directImpact = baseImpactPerCustomerMonthly * phaseIn;

            // Socialized capacity cost only applies after auction lag
            let socializedImpact = 0;
            if (yearsOnline >= marketLag) {
                socializedImpact = socializedPerCustomerMonthly * phaseIn;
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
    years: number = TIME_PARAMS.projectionYears,
    tariff?: TariffStructure
) => {
    return {
        baseline: calculateBaselineTrajectory(utility, years),
        unoptimized: calculateUnoptimizedTrajectory(utility, dataCenter, years, tariff),
        flexible: calculateFlexibleTrajectory(utility, dataCenter, years, tariff),
        dispatchable: calculateDispatchableTrajectory(utility, dataCenter, years, tariff),
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
