/**
 * Community Energy Cost Calculator - Calculation Engine
 *
 * Based on the original research framework + EPRI DCFlex 2024 validation:
 * - FIRM scenario: 4 GW of DC at 80% LF, 100% adds to peak
 * - FLEX scenario: 5.3 GW of DC at 95% LF, only 75% at peak (25% curtailable)
 *
 * Key insight: With flexibility, 33% MORE capacity fits on the same grid,
 * generating MORE revenue while requiring LESS infrastructure.
 *
 * IMPORTANT ECONOMIC REALITY:
 * Large industrial loads (like data centers) can actually REDUCE residential rates
 * when their revenue contribution exceeds the incremental infrastructure costs
 * allocated to residential customers. This happens because:
 * 1. DC pays demand charges (~$9,050/MW-month)
 * 2. DC pays energy margins (~$4.88/MWh)
 * 3. This revenue helps cover utility fixed costs
 * 4. Less fixed cost recovery needed from residential = lower bills
 */

import {
  DEFAULT_UTILITY,
  DEFAULT_DATA_CENTER,
  INFRASTRUCTURE_COSTS,
  TIME_PARAMS,
  SCENARIO_PARAMS,
  DC_RATE_STRUCTURE,
  calculateDCRevenueOffset,
} from '../data/constants';

// ============================================
// RESIDENTIAL ALLOCATION MODEL
// ============================================

/**
 * Calculate residential cost allocation based on tariff structure
 *
 * In typical rate cases, cost allocation is based on a weighted blend of:
 * - Energy consumption (volumetric share)
 * - Peak demand contribution (demand share)
 * - Customer count (customer share)
 *
 * When a large load is added:
 * 1. System energy increases → residential volumetric share decreases
 * 2. System peak increases → residential demand share decreases (if DC adds to peak)
 * 3. Customer count unchanged → residential customer share unchanged
 *
 * This is CALCULATED, not assumed, based on pre/post DC energy and demand.
 */
const calculateResidentialAllocation = (
  utility,
  dcCapacityMW,
  dcLoadFactor,
  dcPeakCoincidence,
  yearsOnline = 0
) => {
  // Pre-DC system energy
  const preDCSystemEnergyMWh = utility.preDCSystemEnergyGWh * 1000; // Convert GWh to MWh
  const residentialEnergyMWh = preDCSystemEnergyMWh * utility.residentialEnergyShare;

  // DC annual energy contribution
  const dcAnnualEnergyMWh = dcCapacityMW * dcLoadFactor * 8760;

  // Post-DC system energy (phases in over time)
  const phaseInFactor = Math.min(1.0, yearsOnline / 3); // Full phase-in over 3 years
  const postDCSystemEnergyMWh = preDCSystemEnergyMWh + (dcAnnualEnergyMWh * phaseInFactor);

  // Residential share of energy (volumetric)
  const residentialVolumetricShare = residentialEnergyMWh / postDCSystemEnergyMWh;

  // Pre-DC system peak (we don't have this, use estimate based on system energy and load factor)
  const estimatedSystemLF = 0.55; // Typical system load factor
  const preDCPeakMW = utility.systemPeakMW || (preDCSystemEnergyMWh / 8760 / estimatedSystemLF);

  // Residential contribution to peak (typically ~45% for residential class)
  const residentialPeakShare = 0.45;
  const residentialPeakMW = preDCPeakMW * residentialPeakShare;

  // DC contribution to peak
  const dcPeakContribution = dcCapacityMW * dcPeakCoincidence * phaseInFactor;

  // Post-DC system peak
  const postDCPeakMW = preDCPeakMW + dcPeakContribution;

  // Residential share of peak (demand-based)
  const residentialDemandShare = residentialPeakMW / postDCPeakMW;

  // Customer-based share (unchanged by DC - DC is 1 customer)
  const totalCustomers = utility.residentialCustomers + utility.commercialCustomers + utility.industrialCustomers + 1;
  const residentialCustomerShare = utility.residentialCustomers / totalCustomers;

  // Weighted blend (typical rate case weighting)
  // - 40% volumetric (energy)
  // - 40% demand-based (peak)
  // - 20% customer-based
  const weightedAllocation =
    residentialVolumetricShare * 0.40 +
    residentialDemandShare * 0.40 +
    residentialCustomerShare * 0.20;

  // Apply some regulatory lag (allocations don't change immediately)
  // Blend between base allocation and calculated allocation based on years
  const regulatoryLagFactor = Math.min(1.0, yearsOnline / 5); // Full adjustment over 5 years
  const baseAllocation = utility.baseResidentialAllocation;
  const adjustedAllocation = baseAllocation * (1 - regulatoryLagFactor) + weightedAllocation * regulatoryLagFactor;

  return {
    allocation: Math.max(0.15, Math.min(0.50, adjustedAllocation)), // Reasonable bounds
    volumetricShare: residentialVolumetricShare,
    demandShare: residentialDemandShare,
    customerShare: residentialCustomerShare,
    weightedRaw: weightedAllocation,
    dcEnergyShareOfSystem: dcAnnualEnergyMWh * phaseInFactor / postDCSystemEnergyMWh,
    dcPeakShareOfSystem: dcPeakContribution / postDCPeakMW,
  };
};

// ============================================
// CORE ECONOMIC MODEL
// ============================================

/**
 * Calculate the net impact on residential bills from data center load
 *
 * The impact can be POSITIVE (costs increase) or NEGATIVE (costs decrease/benefit).
 *
 * A negative impact (benefit) occurs when:
 * DC Revenue Contribution > Infrastructure Costs allocated to residential
 *
 * This is the key insight: well-structured data center loads can create
 * downward pressure on residential rates.
 */
const calculateNetResidentialImpact = (
  dcCapacityMW,
  loadFactor,
  peakCoincidence,
  residentialCustomers,
  residentialAllocation,
  includeCapacityCredit = false,
  onsiteGenMW = 0
) => {
  // Infrastructure costs based on peak demand contribution
  const effectivePeakMW = dcCapacityMW * peakCoincidence - onsiteGenMW;
  const transmissionCost = Math.max(0, effectivePeakMW) * INFRASTRUCTURE_COSTS.transmissionCostPerMW;
  const distributionCost = Math.max(0, effectivePeakMW) * INFRASTRUCTURE_COSTS.distributionCostPerMW;

  // Annualized infrastructure cost (20-year asset life)
  const totalInfraCost = transmissionCost + distributionCost;
  const annualizedInfraCost = totalInfraCost / 20;

  // Capacity costs (or credits)
  //
  // In REGULATED territories (like PSO/SPP):
  // - Utility owns generation and recovers costs through rate base
  // - Capacity "cost" = embedded cost of owned generation (~$80-120/kW-year)
  // - No capacity market premium, but still need to maintain reserve margins
  // - DC demand charges help offset utility's generation costs
  //
  // In MARKET territories (PJM, MISO energy-only regions):
  // - Capacity procured through auctions or bilateral contracts
  // - Recent PJM auctions: $29-269/MW-day ($10k-$98k/MW-year) - RISING due to retirements & load growth
  // - Scarcity is increasing capacity values significantly
  //
  // We use $150k/MW-year as a forward-looking blend, recognizing capacity values are RISING.
  // The DC's demand charges ($9,050/MW-month = $108,600/MW-year) largely cover this.
  //
  const demandChargeAnnual = DC_RATE_STRUCTURE.demandChargePerMWMonth * 12; // $108,600/MW-year
  const netCapacityCostPerMW = Math.max(0, INFRASTRUCTURE_COSTS.capacityCostPerMWYear - demandChargeAnnual);
  let capacityCostOrCredit = Math.max(0, effectivePeakMW) * netCapacityCostPerMW;

  // DR and onsite generation provide CAPACITY VALUE to the system
  // This is a real asset that helps the utility avoid purchasing capacity
  // In a tightening capacity market, this value is INCREASING
  let capacityCredit = 0;
  if (includeCapacityCredit) {
    // DR capability: The curtailable portion can be called during system peaks
    // This has value equal to avoided capacity purchases
    const curtailableMW = dcCapacityMW * (1 - peakCoincidence);

    // Onsite generation: Can island or export during emergencies
    // Often MORE valuable than DR because it's dispatchable
    const drCreditValue = curtailableMW * INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.8; // 80% of capacity value for DR
    const genCreditValue = onsiteGenMW * INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.95; // 95% for dispatchable gen

    capacityCredit = drCreditValue + genCreditValue;

    // Net capacity position can go NEGATIVE (net credit to system)
    capacityCostOrCredit = capacityCostOrCredit - capacityCredit;
  }

  // Revenue from data center (offsets costs for other ratepayers)
  const dcRevenue = calculateDCRevenueOffset(dcCapacityMW, loadFactor, peakCoincidence);

  // Total annual infrastructure cost impact on system
  // Note: capacityCostOrCredit can be NEGATIVE when DR/gen credits exceed costs
  // This is a real benefit - the DC is providing capacity value to the grid
  const grossAnnualInfraCost = annualizedInfraCost + capacityCostOrCredit;

  // DC revenue contribution to fixed cost recovery
  // The DC pays demand charges and energy margins that help cover utility fixed costs
  // This REDUCES the amount that needs to be recovered from other customers
  //
  // Revenue flow:
  // - Demand charges: ~$9,050/MW × peak MW × 12 months
  // - Energy margin: ~$4.88/MWh × annual MWh
  //
  // How much benefits other ratepayers depends on regulatory structure:
  //
  // In REGULATED utilities (like PSO):
  // - Demand charges primarily recover CAPACITY costs the DC is causing
  // - Net benefit to others is mainly the energy margin spread
  // - Fixed cost spreading happens gradually through rate cases
  //
  // In MARKET-BASED systems:
  // - More direct pass-through of capacity/energy economics
  // - Benefits flow more quickly
  //
  // Conservative approach: Only energy margin flows through directly as benefit
  // Demand charges are assumed to roughly match capacity costs they cause
  // (This is by design - demand charges are SET to recover capacity costs)
  //
  // The true benefit to other ratepayers comes from:
  // 1. Energy margin (utility keeps spread between wholesale and retail)
  // 2. Fixed cost spreading (more kWh to spread overhead across)
  // 3. Capacity credits (if DC provides DR or generation)
  //
  // We use conservative flow-through: only energy margin + portion of fixed cost spreading
  const energyMarginFlowThrough = 0.85; // Most energy margin benefits ratepayers
  const fixedCostSpreadingBenefit = dcRevenue.demandRevenue * 0.15; // Small fixed-cost spreading benefit
  const revenueOffset = (dcRevenue.energyMargin * energyMarginFlowThrough) + fixedCostSpreadingBenefit;

  // Net impact = Infrastructure costs - Revenue offset
  // If revenue > infrastructure costs, this is NEGATIVE (a benefit!)
  const netAnnualImpact = grossAnnualInfraCost - revenueOffset;

  // Allocate to residential customers
  const residentialImpact = netAnnualImpact * residentialAllocation;
  const perCustomerMonthly = residentialImpact / residentialCustomers / 12;

  return {
    perCustomerMonthly, // Can be negative (benefit) or positive (cost)
    annualResidentialImpact: residentialImpact,
    grossCost: grossAnnualInfraCost,
    revenueOffset,
    netImpact: netAnnualImpact, // Negative = benefit to ratepayers
    metrics: {
      effectivePeakMW: Math.max(0, effectivePeakMW),
      transmissionCost,
      distributionCost,
      dcRevenuePerYear: dcRevenue.perYear,
      capacityCostOrCredit,
      revenueOffset,
      energyMarginFlowThrough,
    },
  };
};

// ============================================
// BASELINE CALCULATIONS (No New Load)
// ============================================

/**
 * Calculate baseline cost trajectory without any new large load
 *
 * Key drivers of baseline increases:
 * 1. General inflation: ~2.5%/year
 * 2. Infrastructure aging/replacement: ~1.5%/year
 * 3. Grid modernization requirements: ~0.5%/year
 * 4. Environmental compliance: ~0.3%/year
 *
 * Combined: approximately 4-5% annual increase is typical
 * This is the reality ratepayers face WITH OR WITHOUT data centers
 */
export const calculateBaselineTrajectory = (
  utility = DEFAULT_UTILITY,
  years = TIME_PARAMS.projectionYears
) => {
  const trajectory = [];
  const baseYear = TIME_PARAMS.baseYear;

  let currentBill = utility.averageMonthlyBill;

  // Baseline increase rate (independent of data centers)
  // This reflects ongoing infrastructure needs, not new DC load
  const baselineIncreaseRate =
    TIME_PARAMS.generalInflation +                        // 2.5% inflation
    INFRASTRUCTURE_COSTS.annualBaselineUpgradePercent +   // 1.5% infrastructure
    0.005;                                                 // 0.5% grid modernization

  for (let year = 0; year <= years; year++) {
    if (year > 0) {
      // Compound annual increase from inflation + infrastructure aging
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

// ============================================
// FIRM LOAD SCENARIO (80% LF, 100% Peak)
// ============================================

/**
 * Calculate costs when data center operates as FIRM load
 * - Lower load factor (80%) due to less efficient operation scheduling
 * - Full capacity (100%) adds to system peak
 * - Requires full infrastructure buildout for peak
 *
 * Even firm load HELPS ratepayers by:
 * - Paying demand charges and energy margins
 * - Absorbing a share of utility fixed costs
 *
 * But firm load helps LESS than flexible because:
 * - Lower LF = less energy margin revenue
 * - 100% peak = more infrastructure costs
 */
export const calculateUnoptimizedTrajectory = (
  utility = DEFAULT_UTILITY,
  dataCenter = DEFAULT_DATA_CENTER,
  years = TIME_PARAMS.projectionYears
) => {
  const trajectory = [];
  const baseYear = TIME_PARAMS.baseYear;
  const baseline = calculateBaselineTrajectory(utility, years);

  // Firm load parameters (from original research)
  const firmLF = dataCenter.firmLoadFactor || 0.80;
  const firmPeakCoincidence = dataCenter.firmPeakCoincidence || 1.0;

  for (let year = 0; year <= years; year++) {
    // DC comes online in year 2
    let dcImpact = 0;
    let currentAllocation = utility.baseResidentialAllocation;
    let yearMetrics = null;

    if (year >= 2) {
      // Phase in: 50% year 2, 100% year 3+
      const phaseIn = year === 2 ? 0.5 : 1.0;
      const yearsOnline = year - 2;

      // CALCULATED residential allocation based on tariff structure
      // This replaces the assumed 2%/year decline with actual calculated values
      // based on how DC energy/demand changes the allocation weights
      const allocationResult = calculateResidentialAllocation(
        utility,
        dataCenter.capacityMW,
        firmLF,
        firmPeakCoincidence,
        yearsOnline
      );
      currentAllocation = allocationResult.allocation;

      // Calculate net impact (can be positive or negative!)
      const yearImpact = calculateNetResidentialImpact(
        dataCenter.capacityMW,
        firmLF,
        firmPeakCoincidence,
        utility.residentialCustomers,
        currentAllocation,
        false, // No capacity credit for firm load
        0      // No onsite gen
      );

      yearMetrics = yearImpact.metrics;

      // DC impact is the NET of infrastructure costs minus revenue contribution
      // This CAN BE NEGATIVE (a benefit) if revenue > costs
      dcImpact = yearImpact.perCustomerMonthly * phaseIn;

      // Escalate any positive impact with inflation (costs grow)
      // Benefits also grow with inflation (revenue grows)
      if (dcImpact > 0) {
        dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation, yearsOnline);
      } else {
        // Benefits (negative impact) also scale with time as DC revenue grows
        dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation * 0.8, yearsOnline);
      }
    }

    // Final bill = baseline + DC impact (which may be negative = lower bill)
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
        dcImpact, // Positive = cost, Negative = benefit
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

// ============================================
// FLEXIBLE LOAD SCENARIO (95% LF, 75% Peak - 25% curtailable)
// ============================================

/**
 * Calculate costs when data center operates with FLEXIBILITY
 *
 * Flexible load is BETTER for ratepayers because:
 * 1. Higher LF (95% vs 80%) = MORE energy margin revenue
 * 2. Lower peak (75% vs 100%) = LESS infrastructure cost (25% curtailable, DCFlex validated)
 * 3. Capacity credits for DR = additional value
 *
 * This combination often results in NET BENEFIT (negative impact)
 * meaning residential bills can be LOWER than baseline!
 */
export const calculateFlexibleTrajectory = (
  utility = DEFAULT_UTILITY,
  dataCenter = DEFAULT_DATA_CENTER,
  years = TIME_PARAMS.projectionYears
) => {
  const trajectory = [];
  const baseYear = TIME_PARAMS.baseYear;
  const baseline = calculateBaselineTrajectory(utility, years);

  // Flexible load parameters
  const flexLF = dataCenter.flexLoadFactor || 0.95;
  const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.80;

  for (let year = 0; year <= years; year++) {
    let dcImpact = 0;
    let currentAllocation = utility.baseResidentialAllocation;
    let yearMetrics = null;

    if (year >= 2) {
      const phaseIn = year === 2 ? 0.5 : 1.0;
      const yearsOnline = year - 2;

      // CALCULATED residential allocation based on tariff structure
      // Flex load has lower peak coincidence, so it contributes less to system peak
      // This means residential demand share doesn't decrease as much from DC
      // But the higher load factor means more energy → lower residential volumetric share
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
        true, // Include capacity credit for DR
        0     // No onsite gen in this scenario
      );

      yearMetrics = yearImpact.metrics;

      // DC impact can be NEGATIVE (a benefit!)
      dcImpact = yearImpact.perCustomerMonthly * phaseIn;

      // Scale impact over time
      if (dcImpact > 0) {
        dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation, yearsOnline);
      } else {
        // Benefits grow as DC revenue contribution increases
        dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation * 0.9, yearsOnline);
      }
    }

    // Final bill = baseline + DC impact
    // With flex load, dcImpact is often NEGATIVE = lower bills than baseline
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
        dcImpact, // Often negative = benefit
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

// ============================================
// FLEXIBLE + DISPATCHABLE SCENARIO
// ============================================

/**
 * Calculate costs with both demand response AND onsite generation
 *
 * This is the BEST CASE for ratepayers because:
 * 1. All benefits of flexible load (high LF, low peak, capacity credits)
 * 2. PLUS onsite generation reduces grid draw during peaks
 * 3. Can export power during grid emergencies = additional revenue
 *
 * This scenario often produces the LARGEST benefit (most negative impact)
 */
export const calculateDispatchableTrajectory = (
  utility = DEFAULT_UTILITY,
  dataCenter = DEFAULT_DATA_CENTER,
  years = TIME_PARAMS.projectionYears
) => {
  const trajectory = [];
  const baseYear = TIME_PARAMS.baseYear;
  const baseline = calculateBaselineTrajectory(utility, years);

  // Flexible load parameters with onsite generation
  const flexLF = dataCenter.flexLoadFactor || 0.95;
  const flexPeakCoincidence = dataCenter.flexPeakCoincidence || 0.80;
  const onsiteGenMW = dataCenter.onsiteGenerationMW || dataCenter.capacityMW * 0.2;

  for (let year = 0; year <= years; year++) {
    let dcImpact = 0;
    let currentAllocation = utility.baseResidentialAllocation;
    let yearMetrics = null;

    if (year >= 2) {
      const phaseIn = year === 2 ? 0.5 : 1.0;
      const yearsOnline = year - 2;

      // CALCULATED residential allocation based on tariff structure
      // With onsite generation, the effective peak contribution is even lower
      // because onsite gen can offset grid draw during peak periods
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
        true,      // Include capacity credit
        onsiteGenMW // Onsite generation
      );

      yearMetrics = {
        ...yearImpact.metrics,
        onsiteGenMW,
        netPeakDraw: yearImpact.metrics.effectivePeakMW,
      };

      // DC impact is very likely NEGATIVE (a benefit) in this scenario
      dcImpact = yearImpact.perCustomerMonthly * phaseIn;

      // Scale impact over time
      if (dcImpact > 0) {
        dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation, yearsOnline);
      } else {
        // Benefits compound as value grows
        dcImpact *= Math.pow(1 + TIME_PARAMS.generalInflation * 0.95, yearsOnline);
      }
    }

    // Final bill = baseline + DC impact
    // In this scenario, dcImpact is typically NEGATIVE = lowest bills
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
        dcImpact, // Usually negative = largest benefit
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
// FIRM VS FLEX COMPARISON (Original Research Model)
// ============================================

/**
 * Calculate the comparative benefit of FLEX over FIRM
 * This is the core value proposition from the original research
 *
 * With the same grid constraints:
 * - FIRM: 4 GW at 80% LF = X revenue
 * - FLEX: 5 GW at 95% LF = Y revenue (Y >> X)
 *
 * The difference (Y - X) represents the value created by flexibility
 */
export const calculateFlexVsFirmBenefit = (
  utility = DEFAULT_UTILITY,
  scaleFactor = 1.0 // 1.0 = research model (4/5 GW), smaller for local analysis
) => {
  // Research model parameters
  const firmCapacityMW = SCENARIO_PARAMS.firm.capacityMW * scaleFactor;
  const flexCapacityMW = SCENARIO_PARAMS.flex.capacityMW * scaleFactor;

  // Firm scenario economics
  const firmRevenue = calculateDCRevenueOffset(
    firmCapacityMW,
    SCENARIO_PARAMS.firm.loadFactor,
    SCENARIO_PARAMS.firm.peakCoincidence
  );

  const firmInfraCost = firmCapacityMW * SCENARIO_PARAMS.firm.peakCoincidence *
    (INFRASTRUCTURE_COSTS.transmissionCostPerMW + INFRASTRUCTURE_COSTS.distributionCostPerMW) / 20;

  // Flex scenario economics
  const flexRevenue = calculateDCRevenueOffset(
    flexCapacityMW,
    SCENARIO_PARAMS.flex.loadFactor,
    SCENARIO_PARAMS.flex.peakCoincidence
  );

  const flexInfraCost = flexCapacityMW * SCENARIO_PARAMS.flex.peakCoincidence *
    (INFRASTRUCTURE_COSTS.transmissionCostPerMW + INFRASTRUCTURE_COSTS.distributionCostPerMW) / 20;

  // Capacity credit for flex (DR value)
  const curtailableMW = flexCapacityMW * SCENARIO_PARAMS.flex.curtailablePercent;
  const capacityCredit = curtailableMW * INFRASTRUCTURE_COSTS.capacityCostPerMWYear * 0.8;

  // Net comparison
  const firmNetAnnual = firmInfraCost - firmRevenue.perYear * 0.4;
  const flexNetAnnual = flexInfraCost - flexRevenue.perYear * 0.4 - capacityCredit;

  // The benefit of flex over firm
  const annualBenefit = firmNetAnnual - flexNetAnnual;

  // Per residential customer
  const perCustomerAnnual = annualBenefit * utility.baseResidentialAllocation / utility.residentialCustomers;
  const perCustomerMonthly = perCustomerAnnual / 12;

  return {
    firmScenario: {
      capacityMW: firmCapacityMW,
      loadFactor: SCENARIO_PARAMS.firm.loadFactor,
      annualRevenue: firmRevenue.perYear,
      annualInfraCost: firmInfraCost,
      netCost: firmNetAnnual,
    },
    flexScenario: {
      capacityMW: flexCapacityMW,
      loadFactor: SCENARIO_PARAMS.flex.loadFactor,
      annualRevenue: flexRevenue.perYear,
      annualInfraCost: flexInfraCost,
      capacityCredit,
      netCost: flexNetAnnual,
    },
    comparison: {
      additionalCapacityMW: flexCapacityMW - firmCapacityMW,
      additionalRevenuePerYear: flexRevenue.perYear - firmRevenue.perYear,
      infrastructureSavings: firmInfraCost - flexInfraCost + capacityCredit,
      annualBenefitTotal: annualBenefit,
      perCustomerAnnual,
      perCustomerMonthly,
    },
  };
};

// ============================================
// COMBINED PROJECTION
// ============================================

/**
 * Generate all four scenario trajectories for comparison
 */
export const generateAllTrajectories = (
  utility = DEFAULT_UTILITY,
  dataCenter = DEFAULT_DATA_CENTER,
  years = TIME_PARAMS.projectionYears
) => {
  return {
    baseline: calculateBaselineTrajectory(utility, years),
    unoptimized: calculateUnoptimizedTrajectory(utility, dataCenter, years),
    flexible: calculateFlexibleTrajectory(utility, dataCenter, years),
    dispatchable: calculateDispatchableTrajectory(utility, dataCenter, years),
  };
};

/**
 * Format trajectories for chart display
 */
export const formatTrajectoriesForChart = (trajectories) => {
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

// ============================================
// SUMMARY STATISTICS
// ============================================

/**
 * Calculate summary statistics for the trajectories
 *
 * Key insight: the comparison to baseline shows whether DC helps or hurts
 * - Positive difference = DC adds cost
 * - Negative difference = DC creates BENEFIT (lower bills than baseline!)
 */
export const calculateSummaryStats = (trajectories, utility = DEFAULT_UTILITY) => {
  const finalYear = trajectories.baseline.length - 1;

  const baselineFinal = trajectories.baseline[finalYear].monthlyBill;
  const unoptimizedFinal = trajectories.unoptimized[finalYear].monthlyBill;
  const flexibleFinal = trajectories.flexible[finalYear].monthlyBill;
  const dispatchableFinal = trajectories.dispatchable[finalYear].monthlyBill;

  // Calculate cumulative costs over projection period
  const cumulativeCosts = {
    baseline: trajectories.baseline.reduce((sum, y) => sum + y.annualBill, 0),
    unoptimized: trajectories.unoptimized.reduce((sum, y) => sum + y.annualBill, 0),
    flexible: trajectories.flexible.reduce((sum, y) => sum + y.annualBill, 0),
    dispatchable: trajectories.dispatchable.reduce((sum, y) => sum + y.annualBill, 0),
  };

  // Get flex vs firm comparison metrics
  const flexVsFirm = calculateFlexVsFirmBenefit(utility, utility.residentialCustomers / 560000);

  // Difference from baseline (negative = benefit!)
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

    // Difference from baseline at final year
    // NEGATIVE values mean bills are LOWER than baseline (benefit!)
    finalYearDifference,

    // Is this scenario better than baseline?
    benefitsRatepayers: {
      unoptimized: finalYearDifference.unoptimized < 0,
      flexible: finalYearDifference.flexible < 0,
      dispatchable: finalYearDifference.dispatchable < 0,
    },

    // Monthly savings vs baseline (positive = savings)
    savingsVsBaseline: {
      unoptimized: -finalYearDifference.unoptimized,
      flexible: -finalYearDifference.flexible,
      dispatchable: -finalYearDifference.dispatchable,
    },

    // Savings compared to firm/unoptimized
    savingsVsUnoptimized: {
      flexible: unoptimizedFinal - flexibleFinal,
      dispatchable: unoptimizedFinal - dispatchableFinal,
    },

    // Cumulative household costs
    cumulativeHouseholdCosts: cumulativeCosts,

    // Community-wide cumulative savings vs baseline
    cumulativeCommunitySavings: {
      unoptimized: (cumulativeCosts.baseline - cumulativeCosts.unoptimized) * utility.residentialCustomers,
      flexible: (cumulativeCosts.baseline - cumulativeCosts.flexible) * utility.residentialCustomers,
      dispatchable: (cumulativeCosts.baseline - cumulativeCosts.dispatchable) * utility.residentialCustomers,
    },

    // Percent change from current (can be positive or negative)
    percentChange: {
      baseline: (baselineFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
      unoptimized: (unoptimizedFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
      flexible: (flexibleFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
      dispatchable: (dispatchableFinal - utility.averageMonthlyBill) / utility.averageMonthlyBill,
    },

    // Original research comparison
    flexVsFirmComparison: flexVsFirm,
  };
};
