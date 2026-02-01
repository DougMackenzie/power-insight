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
    getISODataForMarket,
    type Utility,
    type DataCenter,
    type InterconnectionCosts,
    type MarketType,
} from './constants';

// ============================================
// RESIDENTIAL ALLOCATION CONSTANTS
// ============================================

// Residential share of system peak demand
// Based on typical utility class allocation studies (range: 30-45%)
const RESIDENTIAL_PEAK_SHARE = 0.35;

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
        // ISO-level calculation fields (for capacity markets)
        isoLevelCalculation?: boolean;
        isoTotalPeakMW?: number;
        isoTotalCapacityMW?: number;
        utilitySystemPeakMW?: number;
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
 * For capacity markets (PJM, MISO, NYISO), reserve margin is calculated at the
 * ISO level since capacity markets operate regionally, not at individual utility level.
 * For regulated/SPP/TVA markets, utility-level calculations are used.
 *
 * @param utility - Utility with current capacity and peak data
 * @param dcPeakContributionMW - Data center's peak contribution to system
 * @param marketType - Optional market type for ISO-level calculations
 * @returns Capacity price result with old/new prices and socialized impact
 */
export function calculateDynamicCapacityPrice(
    utility: Utility,
    dcPeakContributionMW: number,
    marketType?: MarketType
): CapacityPriceResult {
    // For capacity markets (PJM, MISO, NYISO), use ISO-level data for reserve margin
    // Reserve margin impacts occur at the ISO level, not individual utility level
    const isoData = marketType ? getISODataForMarket(marketType) : null;
    const useISOLevel = !!(isoData && utility.hasCapacityMarket);

    // Choose appropriate system peak and capacity for reserve margin calculation
    // ISO-level for capacity markets, utility-level for regulated markets
    const systemPeakMW = useISOLevel
        ? isoData.totalPeakMW
        : utility.systemPeakMW;

    const currentReserveMargin = useISOLevel
        ? isoData.targetReserveMargin
        : utility.currentReserveMargin ?? 0.15;

    const totalCapacityMW = useISOLevel
        ? isoData.totalCapacityMW
        : utility.totalGenerationCapacityMW ?? (utility.systemPeakMW * (1 + currentReserveMargin));

    // Calculate old reserve margin (before DC addition)
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
    // Note: We use the UTILITY's residential peak (their customers pay the increased price)
    // The price increase is determined at ISO level, but the cost impact is on this utility's customers
    const existingResidentialPeakMW = utility.systemPeakMW * RESIDENTIAL_PEAK_SHARE;
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
            // ISO-level calculation transparency
            isoLevelCalculation: useISOLevel,
            isoTotalPeakMW: useISOLevel ? isoData.totalPeakMW : undefined,
            isoTotalCapacityMW: useISOLevel ? isoData.totalCapacityMW : undefined,
            utilitySystemPeakMW: useISOLevel ? utility.systemPeakMW : undefined,
        },
    };
}

// ============================================
// UNIFIED CAPACITY COST CALCULATION
// Ensures Revenue Adequacy and Bill Forecast use consistent methodology
// ============================================

/**
 * CIAC Recovery Fraction Guidelines (per E3 methodology):
 *
 * 95%: DC builds dedicated substation + transmission tap (>100 MW)
 *      - Dominion NoVA, AEP Ohio (have 85% minimum demand clauses)
 *      - Nearly all local costs paid upfront
 *
 * 90%: Large DCs with dedicated facilities, greenfield sites
 *      - Georgia Power, APS Arizona, NV Energy
 *      - Most infrastructure purpose-built for DC
 *
 * 85%: Standard large load interconnection (25-100 MW)
 *      - Duke utilities, Entergy, National Grid Upstate
 *      - Mix of dedicated and shared upgrades
 *
 * 80%: Default / smaller large loads (10-25 MW)
 *      - More reliance on existing infrastructure
 *
 * 75%: Constrained urban areas
 *      - ConEd NYC - dense grid, more shared infrastructure
 */

export interface MarginalCapacityCostResult {
    cost: number;
    methodology: 'capacity_market' | 'ercot_embedded' | 'regulated_embedded';
    pricePerMWYear: number;
}

/**
 * Market-specific Cost of New Entry (CONE) values
 * Based on Brattle/MISO/PJM studies for 2024-2026
 *
 * Sources:
 * - ERCOT: Brattle 2026 CONE study (~$110k/MW for Aeroderivative CT)
 * - SPP: Similar to MISO South (~$80k/MW Net-CONE)
 * - MISO: MISO 2024 Net-CONE study (~$73-80k/MW)
 * - PJM: Based on auction clearing prices (~$98k/MW at $269/MW-day)
 * - CAISO: Higher due to CA RA requirements (~$115k/MW)
 * - SERC/Southeast: Similar to MISO (~$85k/MW)
 */
const EMBEDDED_CAPACITY_BY_ISO: Record<string, number> = {
    'ercot': 110000,     // ERCOT: $110k/MW (Brattle 2026 study - Aeroderivative CT)
    'spp': 80000,        // SPP: ~$80k/MW (MISO South adjacent, wind-heavy)
    'miso': 80000,       // MISO: ~$80k/MW (MISO 2024 Net-CONE)
    'pjm': 98000,        // PJM: ~$98k/MW ($269/MW-day × 365)
    'nyiso': 105000,     // NYISO: ~$105k/MW (higher than PJM due to NYC constraints)
    'caiso': 115000,     // CAISO: ~$115k/MW (CA RA requirements)
    'serc': 85000,       // SERC/Southeast: ~$85k/MW
    'frcc': 90000,       // Florida: ~$90k/MW
    'wecc': 100000,      // Other WECC: ~$100k/MW
    'default': 90000,    // Default: $90k/MW (conservative national average)
};

/**
 * Calculate marginal capacity cost using market-specific methodology
 *
 * This function provides a UNIFIED capacity cost calculation for both
 * Revenue Adequacy and Bill Forecast, ensuring consistent methodology.
 *
 * CAPACITY MARKETS (PJM/NYISO/MISO):
 * - Use auction clearing price × 365 (100% pass-through required by market rules)
 * - This is SEPARATE from demand charges (which cover T&D, not wholesale capacity)
 * - Utilities cannot mark up or absorb these costs
 *
 * ERCOT (Energy-Only):
 * - Capacity embedded in energy via ORDC scarcity pricing
 * - Use 50% of market-specific CONE (capacity revenues come through scarcity pricing)
 * - No capacity charge pass-through needed
 *
 * REGULATED/SPP/SERC:
 * - Capacity embedded in demand charges through cost-of-service ratemaking
 * - Use market-specific CONE as proxy for utility's generation investment recovery
 * - Demand charges ARE the capacity cost recovery mechanism
 *
 * @param peakDemandMW - DC contribution to system peak
 * @param utility - Utility with market structure
 * @returns Capacity cost result with methodology used
 */
export function calculateMarginalCapacityCost(
    peakDemandMW: number,
    utility: Utility | undefined
): MarginalCapacityCostResult {
    // Get market-specific CONE value
    const isoKey = (utility?.marketType || 'default').toLowerCase();
    const marketCONE = EMBEDDED_CAPACITY_BY_ISO[isoKey] ?? EMBEDDED_CAPACITY_BY_ISO['default'];

    if (utility?.marketType === 'ercot') {
        // ERCOT: Energy-only market - capacity embedded in wholesale energy via ORDC
        // Use 50% of market-specific CONE (capacity revenues come through scarcity pricing)
        const pricePerMWYear = marketCONE * 0.50;
        return {
            cost: peakDemandMW * pricePerMWYear,
            methodology: 'ercot_embedded',
            pricePerMWYear,
        };
    }

    if (utility?.hasCapacityMarket && utility?.capacityPrice2024) {
        // Capacity markets (PJM, NYISO, MISO): Use actual auction clearing price
        // Market rules require 100% pass-through - utilities cannot absorb or mark up
        const pricePerMWYear = utility.capacityPrice2024 * 365;
        return {
            cost: peakDemandMW * pricePerMWYear,
            methodology: 'capacity_market',
            pricePerMWYear,
        };
    }

    // Regulated/SPP/SERC: Capacity embedded in demand charges through cost-of-service ratemaking
    // Use market-specific CONE - this represents utility's generation investment recovery
    return {
        cost: peakDemandMW * marketCONE,
        methodology: 'regulated_embedded',
        pricePerMWYear: marketCONE,
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
    surplusOrDeficit: number;         // Total Revenue - Total Cost (absolute)
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

    // Get wholesale energy cost for margin calculation
    const wholesaleEnergyCostForMargin = utility?.marginalEnergyCost ?? 38;

    if (tariff) {
        // Use the comprehensive tariff-based calculation with dynamic energy margin
        const tariffRevenue = calculateTariffBasedDemandCharges(
            dcCapacityMW,
            loadFactor,
            peakCoincidence,
            tariff,
            wholesaleEnergyCostForMargin
        );
        demandChargeRevenue = tariffRevenue.totalDemandRevenue;
        energyChargeRevenue = tariffRevenue.energyRevenue;
    } else {
        // Fallback to default calculation
        const peakDemandCharge = DC_RATE_STRUCTURE.coincidentPeakChargePerMWMonth;
        const maxDemandCharge = DC_RATE_STRUCTURE.nonCoincidentPeakChargePerMWMonth;
        demandChargeRevenue = (peakDemandMW * peakDemandCharge * 12) +
                              (dcCapacityMW * maxDemandCharge * 12);
        // Use dynamic margin calculation: generic rate ($35/MWh) - wholesale cost
        const genericRetailRate = 35; // $/MWh
        const energyMarginPerMWh = Math.max(0, genericRetailRate - wholesaleEnergyCostForMargin);
        energyChargeRevenue = annualMWh * energyMarginPerMWh;
    }

    // Customer charges (estimated as ~$500/month for large power)
    const customerChargeRevenue = 500 * 12;

    // Note: totalRevenue calculated after fuel rider adjustment below

    // ============================================
    // COST CALCULATION (marginal cost to serve)
    // Note: Fuel costs are pass-through and net out in margin calculation
    // ============================================

    // Capacity cost - uses unified calculateMarginalCapacityCost() for consistency
    // with calculateNetResidentialImpact(). Market-specific methodology:
    // - ERCOT: 50% of embedded (capacity in energy prices via ORDC)
    // - Capacity Markets (PJM/NYISO/MISO): Market clearing price × 365
    // - Regulated/SPP: Full embedded cost (in demand charges)
    const capacityCostResult = calculateMarginalCapacityCost(peakDemandMW, utility);
    const marginalCapacityCost = capacityCostResult.cost;

    // Energy cost and revenue adjustment for fuel rider tariffs
    //
    // Many large power tariffs (like PSO's LPL) have a "fuel rider" structure:
    // - Base energy rate in tariff is very low (e.g., $1.71/MWh for PSO)
    // - Fuel rider passes through wholesale energy costs separately
    // - These costs flow through to ratepayers dollar-for-dollar
    //
    // For Revenue Adequacy purposes, fuel rider tariffs are COST-NEUTRAL on energy:
    // - The utility collects wholesale costs AND pays wholesale costs
    // - Net energy margin = $0 (pass-through is not a revenue source or cost)
    // - Revenue adequacy is driven by DEMAND CHARGES only
    //
    // Detection: If tariff energy charge < 50% of wholesale, it's a fuel rider structure
    // (PSO LPL at $1.71/MWh vs $38/MWh wholesale = ~4.5%, clearly a fuel rider)
    const wholesaleEnergyCost = utility?.marginalEnergyCost ?? 38; // $/MWh
    const tariffEnergyCost = tariff?.energyCharge ?? 30; // $/MWh

    const isFuelRiderTariff = tariffEnergyCost < wholesaleEnergyCost * 0.50;

    // For fuel rider tariffs, energy is cost-neutral (pass-through)
    // For non-fuel-rider tariffs, calculate actual energy margin
    let marginalEnergyCost: number;
    if (isFuelRiderTariff) {
        // Fuel rider: Energy revenue = energy cost = wholesale (net contribution = $0)
        // Set both to the same value so they cancel out in revenue adequacy
        energyChargeRevenue = annualMWh * wholesaleEnergyCost;
        marginalEnergyCost = annualMWh * wholesaleEnergyCost;
        // Note: This reflects that utility collects AND pays wholesale - no net margin
    } else {
        // Non-fuel-rider: Utility has actual energy margin (retail - wholesale)
        // energyChargeRevenue already set above from calculateTariffBasedDemandCharges
        marginalEnergyCost = annualMWh * wholesaleEnergyCost;
    }

    // Calculate total revenue AFTER fuel rider adjustment
    const totalRevenue = demandChargeRevenue + energyChargeRevenue + customerChargeRevenue;

    // Network upgrade cost (only socialized portion, not CIAC)
    const interconnection = utility?.interconnection ?? {
        ciacRecoveryFraction: 0.80, // Default: 80% DC pays upfront
        networkUpgradeCostPerMW: 140000,
    };
    // Annualize over 20-year recovery period
    const networkUpgradeCost = (peakDemandMW * interconnection.networkUpgradeCostPerMW) / 20;

    const totalMarginalCost = marginalCapacityCost + marginalEnergyCost + networkUpgradeCost;

    // ============================================
    // REVENUE ADEQUACY METRICS
    // ============================================
    //
    // METHODOLOGY ALIGNMENT NOTE:
    // Both Revenue Adequacy and Bill Forecast (calculateNetResidentialImpact) now use
    // the same capacity cost basis via calculateMarginalCapacityCost(). The difference is:
    //
    // REVENUE ADEQUACY (this function):
    //   - Compares FULL tariff revenue to FULL marginal cost
    //   - Answers: "Does the DC pay for its cost-to-serve?"
    //   - 100% of revenue vs 100% of cost (no flow-through applied)
    //   - Per E3 "Tailored for Scale" methodology
    //
    // BILL FORECAST (calculateNetResidentialImpact):
    //   - Allocates net costs to residential after demand charge flow-through
    //   - Answers: "What is the impact on residential bills?"
    //   - Demand charges offset infrastructure costs via market-specific flow-through
    //   - Socialized capacity spillover applies pass-through for timing lag
    //
    // These serve different purposes but use consistent cost inputs.
    // A DC can be revenue-adequate while bill impacts vary based on flow-through rates.
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
        surplusOrDeficit,
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
 * Energy margin is now calculated dynamically as:
 *   (tariff.energyCharge - utility.marginalEnergyCost) * annualMWh
 * This represents the utility's wholesale-to-retail spread that contributes
 * to fixed cost recovery beyond just fuel pass-through.
 *
 * @param dcCapacityMW - Data center interconnection capacity
 * @param loadFactor - Average load factor (0-1)
 * @param peakCoincidence - Fraction of capacity during system peaks (0-1)
 * @param tariff - Utility-specific tariff structure
 * @param marginalEnergyCost - Wholesale energy cost ($/MWh), defaults to $38/MWh
 * @returns Demand charge revenue and breakdown
 */
export function calculateTariffBasedDemandCharges(
    dcCapacityMW: number,
    loadFactor: number,
    peakCoincidence: number,
    tariff: TariffStructure,
    marginalEnergyCost: number = 38 // Default wholesale cost if not provided
): {
    peakDemandRevenue: number;
    maxDemandRevenue: number;
    totalDemandRevenue: number;
    energyRevenue: number;  // Now represents energy MARGIN, not gross revenue
    totalRevenue: number;
    flexibilityBenefit: number; // How much a flexible DC saves vs firm on demand charges
    breakdown: {
        peakDemandMW: number;
        maxDemandMW: number;
        annualMWh: number;
        tariffType: DemandChargeStructure;
        energyMarginPerMWh: number; // Calculated margin rate
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

    // Calculate energy MARGIN dynamically (retail rate - wholesale cost)
    // This represents the utility's wholesale-to-retail spread that contributes
    // to fixed cost recovery. Some tariffs have very low energy rates (e.g., PSO's LPL
    // at $1.708/MWh) which are essentially wholesale pass-through - in those cases
    // the margin may be negative (fuel rider tariff), handled in calculateRevenueAdequacy.
    const energyMarginPerMWh = Math.max(0, tariff.energyCharge - marginalEnergyCost);
    const energyRevenue = annualMWh * energyMarginPerMWh;
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
            energyMarginPerMWh, // Dynamic margin rate for transparency
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
    // Use consistent residential peak share across all calculations
    const residentialPeakMW = preDCPeakMW * RESIDENTIAL_PEAK_SHARE;
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
        ciacRecoveryFraction: 0.80, // Default: 80% DC pays upfront
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
    // CAPACITY COSTS - Market-specific methodology (unified with Revenue Adequacy)
    // ============================================
    // Uses calculateMarginalCapacityCost() for consistent capacity cost basis.
    //
    // Key insight from research:
    // - CAPACITY MARKETS: 100% pass-through of auction price (required by market rules)
    // - ERCOT: Capacity embedded in energy via ORDC scarcity pricing (no separate charge)
    // - REGULATED: Capacity embedded in demand charges (cost-of-service ratemaking)
    //
    // The old "capacityCostPassThrough" (40%) was conceptually incorrect for base capacity cost.
    // It now ONLY applies to the socialized spillover effect (price increase on existing customers
    // due to timing lag between capacity auctions and retail rate updates).
    const capacityCostResult = calculateMarginalCapacityCost(effectivePeakMW, utility);

    // Base capacity cost: use the market-appropriate rate directly
    let baseCapacityCost = capacityCostResult.pricePerMWYear;
    let socializedCapacityCost = 0;
    let capacityPriceResult: CapacityPriceResult | null = null;

    // For capacity markets: calculate dynamic price impact (hockey stick effect)
    if (utility?.hasCapacityMarket && capacityCostResult.methodology === 'capacity_market') {
        // Calculate dynamic capacity price based on reserve margin impact
        capacityPriceResult = calculateDynamicCapacityPrice(utility, effectivePeakMW, utility.marketType);

        // The DC pays the NEW capacity price for its load
        // Update baseCapacityCost to use the dynamic price instead of static
        baseCapacityCost = capacityPriceResult.newPrice * 365;

        // CRITICAL: The price INCREASE affects ALL existing load - this is the socialized impact
        // Apply capacityCostPassThrough ONLY to the spillover (timing lag for existing customers)
        // Existing customers don't immediately see the higher price due to rate case lag
        const spilloverPassThrough = utility?.capacityCostPassThrough ?? 0.40;
        socializedCapacityCost = capacityPriceResult.socializedCostImpact * spilloverPassThrough;
    }

    // ERCOT: No socialization (energy-only market, no capacity price spillover)
    // baseCapacityCost already set correctly by calculateMarginalCapacityCost (50% of embedded)
    if (utility?.marketType === 'ercot') {
        socializedCapacityCost = 0;
    }

    // ============================================
    // DEMAND CHARGE REVENUE - Tariff-specific or generic
    // ============================================
    let dcRevenue: ReturnType<typeof calculateDCRevenueOffset>;
    let tariffBasedRevenue: ReturnType<typeof calculateTariffBasedDemandCharges> | null = null;
    let flexibilityBenefitFromTariff = 0;

    if (tariff) {
        // Use utility-specific tariff calculations with dynamic energy margin
        // Pass the utility's marginal energy cost for proper margin calculation
        const marginalEnergyCost = utility?.marginalEnergyCost ?? 38;
        tariffBasedRevenue = calculateTariffBasedDemandCharges(
            dcCapacityMW,
            loadFactor,
            peakCoincidence,
            tariff,
            marginalEnergyCost
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
        // Use generic split demand charge calculation with market-specific wholesale costs
        dcRevenue = calculateDCRevenueOffset(dcCapacityMW, loadFactor, peakCoincidence, 1, {
            effectiveCapacityMW: dcCapacityMW,
            marketType: utility?.marketType,
            marginalEnergyCost: utility?.marginalEnergyCost,
        });
    }

    // Capacity cost calculation - use FULL base capacity cost
    // NOTE: Demand charges are handled ONLY via the flow-through revenue offset mechanism
    // (lines 1098-1111). Subtracting them here AND adding them to revenueOffset would
    // double-count their benefit and artificially reduce bill impacts.
    // See QAQC Report Issue 1.1 for details.
    let capacityCostOrCredit = Math.max(0, effectivePeakMW) * baseCapacityCost;

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

    // ERCOT: Dynamic residential allocation based on DC penetration
    // As DC capacity grows, residential share of system load decreases proportionally
    // This reflects that DCs are a larger portion of total system load, not that they're reducing costs
    if (utility?.marketType === 'ercot') {
        const baseAllocation = utility.baseResidentialAllocation || 0.30;

        // Calculate DC penetration as % of ERCOT total capacity (~90 GW)
        const ercotTotalCapacity = 90000; // MW - approximate ERCOT system capacity
        const dcPenetration = dcCapacityMW / ercotTotalCapacity;

        // Scale down residential allocation as DCs grow
        // At 0 GW DC: base allocation (30%)
        // At 9 GW DC (10% penetration): ~29% allocation
        // At 25 GW DC (~28% penetration): ~27% allocation
        // At 45 GW DC (50% penetration): ~26% allocation
        const scaleFactor = 1 - (dcPenetration * 0.3); // 30% reduction at full penetration
        adjustedAllocation = baseAllocation * Math.max(0.5, scaleFactor);
    }

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

    // Apply cost causation adjustments for regulated markets
    // Note: ERCOT now uses standard allocation (no special 0.60 factor)
    // This ensures Revenue Adequacy and Bill Forecast align directionally
    if (isRegulatedMarket) {
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

    // Calculate revenue adequacy FIRST (E3 methodology)
    // We need this to apply the logic clamp below
    const revenueAdequacy = calculateRevenueAdequacy(
        dcCapacityMW,
        loadFactor,
        peakCoincidence,
        tariff,
        utility,
        onsiteGenMW  // Pass onsite generation to reduce grid peak demand
    );

    // ============================================
    // LOGIC CLAMP: Revenue Adequacy vs Bill Impact Consistency
    // ============================================
    // If Revenue Adequacy < 1.0 (deficit), bill impact MUST be positive.
    // A deficit means DC revenue doesn't cover DC costs, so other ratepayers
    // must cover the shortfall - they cannot simultaneously benefit.
    // See QAQC Report Issue 1.2 for details.
    if (revenueAdequacy.revenueAdequacyRatio < 1.0 && residentialImpact < 0) {
        // Calculate minimum impact based on the deficit proportion
        const deficitProportion = 1 - revenueAdequacy.revenueAdequacyRatio;
        const minPositiveImpact = grossAnnualInfraCost * deficitProportion * residentialAllocation * 0.1;
        residentialImpact = Math.max(minPositiveImpact, 0);
    }

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

            // Apply symmetric inflation to both costs and benefits
            // Previously used asymmetric rates (100% for costs, 80% for benefits)
            // which biased results. See QAQC Report Issue 6.
            dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation, yearsOnline);
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
