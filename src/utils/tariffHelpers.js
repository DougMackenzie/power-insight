/**
 * Tariff Helper Functions
 *
 * Utilities for working with tariff data in calculations.
 * Provides functions to lookup tariffs, calculate effective rates,
 * and handle ISO-specific rules.
 */

import {
  CALCULATOR_TARIFFS,
  ISO_CAPACITY_COSTS,
  ERCOT_4CP_RATE,
  getTariffById,
} from '../data/calculatorTariffs';

// Default wholesale energy cost ($/MWh) for margin calculations
const DEFAULT_WHOLESALE_COST = 38;

/**
 * Get tariff data for a utility
 * @param {string} utilityId - The utility ID
 * @returns {object|null} Tariff data or null if not found
 */
export const getTariffForUtility = (utilityId) => {
  return getTariffById(utilityId);
};

/**
 * Calculate the effective demand charge for a utility
 * Combines peak demand charge with any additional components
 *
 * @param {object} tariff - Tariff data object
 * @param {number} peakCoincidence - Peak coincidence factor (0-1)
 * @returns {number} Effective demand charge in $/MW-month
 */
export const calculateEffectiveDemandCharge = (tariff, peakCoincidence = 1.0) => {
  if (!tariff) return 9050; // Default

  // For TOU tariffs, weight peak vs off-peak based on typical usage patterns
  // Assume 40% of hours are peak, 60% off-peak for demand purposes
  const peakWeight = 0.6; // Peak demand matters more for billing
  const offPeakWeight = 0.4;

  const peakCharge = tariff.peakDemandCharge || 9050;
  const offPeakCharge = tariff.offPeakDemandCharge || peakCharge * 0.4;

  // Weighted average demand charge
  const weightedDemand = (peakCharge * peakWeight) + (offPeakCharge * offPeakWeight);

  // Apply peak coincidence factor for flexible loads
  return weightedDemand * peakCoincidence;
};

/**
 * Calculate the energy margin (retail rate - wholesale cost)
 * This represents the utility's margin on energy sales
 *
 * @param {object} tariff - Tariff data object
 * @param {number} loadFactor - Load factor (0-1)
 * @returns {number} Energy margin in $/MWh
 */
export const calculateEnergyMargin = (tariff, loadFactor = 0.9) => {
  if (!tariff) return 4.88; // Default

  // Calculate blended retail rate based on load factor
  // Higher load factor = more off-peak usage
  const peakHoursFraction = 0.35; // ~35% of hours are peak
  const offPeakFraction = 1 - peakHoursFraction;

  // Adjust for load factor - higher LF means more consistent usage
  // which shifts more consumption to off-peak
  const adjustedPeakFraction = peakHoursFraction * (1 - (loadFactor - 0.8) * 0.5);
  const adjustedOffPeakFraction = 1 - adjustedPeakFraction;

  const peakRate = tariff.energyRatePeak || 45;
  const offPeakRate = tariff.energyRateOffPeak || 32;

  const blendedRetailRate = (peakRate * adjustedPeakFraction) +
    (offPeakRate * adjustedOffPeakFraction);

  // Add fuel adjustment
  const fuelAdjustment = tariff.fuelAdjustment || 15;
  const totalRetailRate = blendedRetailRate + fuelAdjustment;

  // Margin = retail rate - wholesale cost
  const margin = Math.max(0, totalRetailRate - DEFAULT_WHOLESALE_COST);

  return margin;
};

/**
 * Get ISO-specific capacity cost
 *
 * @param {string} isoRto - ISO/RTO identifier
 * @returns {number} Capacity cost in $/MW-year
 */
export const getISOCapacityCost = (isoRto) => {
  return ISO_CAPACITY_COSTS[isoRto] || ISO_CAPACITY_COSTS['None'];
};

/**
 * Calculate ERCOT 4CP transmission cost
 * ERCOT allocates transmission costs based on contribution to 4 summer peak intervals
 *
 * @param {number} capacityMW - Data center capacity in MW
 * @param {number} peakCoincidence - Peak coincidence factor (0-1)
 * @param {number} loadFactor - Load factor (0-1)
 * @returns {object} ERCOT 4CP transmission cost details
 */
export const calculateERCOT4CPTransmission = (capacityMW, peakCoincidence, loadFactor) => {
  // 4CP contribution is based on load during 4 peak intervals (June-Sept)
  // Flexible loads with lower peak coincidence have lower 4CP exposure

  // 4CP intervals are typically hottest summer afternoons (2-6pm)
  // Data centers with flexibility can reduce load during these periods

  // Effective 4CP contribution
  // Lower peak coincidence = ability to shed during 4CP windows
  const cp4Factor = peakCoincidence;

  // Annual transmission cost per kW of 4CP contribution
  // $5.50/kW × 4 peaks × 12 months ≈ $264/kW-year = $264,000/MW-year
  const annualTransmissionPerMW = ERCOT_4CP_RATE * 1000 * 4;

  // Effective transmission cost based on 4CP contribution
  const effectiveTransmissionCost = capacityMW * cp4Factor * annualTransmissionPerMW;

  // Transmission savings from flexibility
  const firmTransmissionCost = capacityMW * annualTransmissionPerMW;
  const transmissionSavings = firmTransmissionCost - effectiveTransmissionCost;

  return {
    cp4Factor,
    annualTransmissionPerMW,
    effectiveTransmissionCost,
    transmissionSavings,
    firmTransmissionCost,
  };
};

/**
 * Calculate protection-adjusted revenue
 * Adjusts revenue projections based on tariff protection mechanisms
 *
 * @param {number} baseRevenue - Base annual revenue
 * @param {object} tariff - Tariff data object
 * @returns {object} Adjusted revenue and multiplier details
 */
export const adjustForProtections = (baseRevenue, tariff) => {
  if (!tariff) return { adjustedRevenue: baseRevenue, multiplier: 1.0, details: {} };

  let multiplier = 1.0;
  const details = {};

  // Minimum demand charge ensures revenue floor
  if (tariff.minimumDemandPct > 0) {
    // Higher minimum = more guaranteed revenue (lower risk)
    const minDemandBonus = (tariff.minimumDemandPct - 60) / 100 * 0.1;
    multiplier *= (1 + Math.max(0, minDemandBonus));
    details.minimumDemandBonus = minDemandBonus;
  }

  // Demand ratchet stabilizes billing
  if (tariff.demandRatchetPct > 0) {
    const ratchetBonus = 0.03; // 3% more stable revenue
    multiplier *= (1 + ratchetBonus);
    details.ratchetBonus = ratchetBonus;
  }

  // Take-or-pay provides additional security
  if (tariff.takeOrPay) {
    const takeOrPayBonus = 0.05; // 5% for guaranteed consumption
    multiplier *= (1 + takeOrPayBonus);
    details.takeOrPayBonus = takeOrPayBonus;
  }

  // Higher protection scores indicate more ratepayer-friendly terms
  if (tariff.protectionScore > 12) {
    const protectionBonus = (tariff.protectionScore - 12) / 26 * 0.05;
    multiplier *= (1 + protectionBonus);
    details.protectionBonus = protectionBonus;
  }

  return {
    adjustedRevenue: baseRevenue * multiplier,
    multiplier,
    details,
  };
};

/**
 * Build complete tariff rates for calculations
 * Combines tariff data with calculated values
 *
 * @param {object} tariff - Tariff data object
 * @param {object} options - Calculation options
 * @returns {object} Complete rate structure for calculations
 */
export const buildTariffRates = (tariff, options = {}) => {
  const {
    loadFactor = 0.9,
    peakCoincidence = 1.0,
  } = options;

  if (!tariff) {
    // Return defaults
    return {
      demandChargePerMWMonth: 9050,
      energyMarginPerMWh: 4.88,
      capacityCostPerMWYear: 150000,
      isERCOT4CP: false,
      tariffName: 'Default',
      protectionRating: 'Low',
    };
  }

  const effectiveDemandCharge = calculateEffectiveDemandCharge(tariff, peakCoincidence);
  const energyMargin = calculateEnergyMargin(tariff, loadFactor);
  const capacityCost = getISOCapacityCost(tariff.isoRto);

  return {
    demandChargePerMWMonth: effectiveDemandCharge,
    energyMarginPerMWh: energyMargin,
    capacityCostPerMWYear: capacityCost,
    isERCOT4CP: tariff.is4CP || tariff.isoRto === 'ERCOT',
    tariffName: tariff.tariffName,
    rateSchedule: tariff.rateSchedule,
    protectionRating: tariff.protectionRating,
    protectionScore: tariff.protectionScore,
    minimumDemandPct: tariff.minimumDemandPct,
    blendedRate: tariff.blendedRate,
    isoRto: tariff.isoRto,
  };
};

/**
 * Compare tariff economics across scenarios
 *
 * @param {object} tariff - Tariff data object
 * @param {number} capacityMW - Data center capacity
 * @returns {object} Comparison of firm vs flexible economics
 */
export const compareTariffScenarios = (tariff, capacityMW) => {
  if (!tariff) return null;

  // Firm scenario: 80% LF, 100% peak coincidence
  const firmRates = buildTariffRates(tariff, { loadFactor: 0.8, peakCoincidence: 1.0 });

  // Flexible scenario: 95% LF, 75% peak coincidence (25% curtailable)
  const flexRates = buildTariffRates(tariff, { loadFactor: 0.95, peakCoincidence: 0.75 });

  // Calculate annual revenues
  const firmDemandRevenue = firmRates.demandChargePerMWMonth * capacityMW * 12;
  const firmEnergyRevenue = firmRates.energyMarginPerMWh * capacityMW * 0.8 * 8760;
  const firmTotalRevenue = firmDemandRevenue + firmEnergyRevenue;

  const flexDemandRevenue = flexRates.demandChargePerMWMonth * capacityMW * 12;
  const flexEnergyRevenue = flexRates.energyMarginPerMWh * capacityMW * 0.95 * 8760;
  const flexTotalRevenue = flexDemandRevenue + flexEnergyRevenue;

  // ERCOT 4CP savings
  let ercot4CPSavings = 0;
  if (tariff.is4CP || tariff.isoRto === 'ERCOT') {
    const firmERCOT = calculateERCOT4CPTransmission(capacityMW, 1.0, 0.8);
    const flexERCOT = calculateERCOT4CPTransmission(capacityMW, 0.75, 0.95);
    ercot4CPSavings = firmERCOT.effectiveTransmissionCost - flexERCOT.effectiveTransmissionCost;
  }

  return {
    firm: {
      rates: firmRates,
      demandRevenue: firmDemandRevenue,
      energyRevenue: firmEnergyRevenue,
      totalRevenue: firmTotalRevenue,
    },
    flex: {
      rates: flexRates,
      demandRevenue: flexDemandRevenue,
      energyRevenue: flexEnergyRevenue,
      totalRevenue: flexTotalRevenue,
    },
    comparison: {
      additionalRevenue: flexTotalRevenue - firmTotalRevenue,
      ercot4CPSavings,
      totalBenefit: (flexTotalRevenue - firmTotalRevenue) + ercot4CPSavings,
    },
  };
};
