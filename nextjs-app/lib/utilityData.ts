/**
 * Utility data compiled from public sources including EIA, utility filings, and annual reports
 * Data reflects 2024 figures where available
 *
 * Market Structure Types:
 * - 'regulated': Vertically integrated utility with state PUC oversight
 * - 'pjm': PJM Interconnection (capacity market, 2024 prices ~$270/MW-day)
 * - 'ercot': ERCOT Texas (energy-only market, no capacity market)
 * - 'miso': MISO (capacity market, lower prices than PJM)
 * - 'caiso': California ISO (partially deregulated)
 *
 * Cost Allocation Notes:
 * - Regulated markets: Infrastructure costs allocated through rate base, ~40% residential
 * - PJM markets: Capacity costs flow through retail suppliers, high volatility
 * - ERCOT: No capacity market, transmission costs allocated, more direct price signals
 */

export type MarketType = 'regulated' | 'pjm' | 'ercot' | 'miso' | 'caiso' | 'spp' | 'nyiso' | 'tva';

/**
 * Demand charge structure types based on actual utility tariffs
 *
 * TOU_PEAK_NCP: Time-of-use peak demand + Non-coincident peak (e.g., PSO, Dominion)
 *   - Peak Demand: Based on usage during defined on-peak hours
 *   - Maximum Demand: Based on highest usage any time (NCP)
 *   - Often includes ratchet provisions
 *
 * COINCIDENT_PEAK: Based on contribution to system peak (e.g., Duke)
 *   - Billing demand tied to usage during system coincident peak
 *   - May include annual ratchet
 *
 * CP_1_5: 1CP transmission + 5CP capacity (PJM markets)
 *   - Transmission: Based on single annual coincident peak
 *   - Capacity: Based on 5 summer coincident peaks
 *
 * CP_4: Four coincident peak (ERCOT)
 *   - Transmission costs allocated based on 4 seasonal peak hours
 *   - Huge incentive to curtail during these specific hours
 *
 * ROLLING_RATCHET: NCP with rolling ratchet (e.g., Georgia Power)
 *   - Monthly billing but with 12-month rolling maximum
 *   - Summer peak affects billing for full year
 */
export type DemandChargeStructure = 'TOU_PEAK_NCP' | 'COINCIDENT_PEAK' | 'CP_1_5' | 'CP_4' | 'ROLLING_RATCHET';

export interface TariffStructure {
  // Type of demand charge structure
  demandChargeType: DemandChargeStructure;
  // Peak/On-Peak Demand Charge ($/MW-month)
  // For TOU: charged during on-peak hours
  // For CP: charged based on coincident peak contribution
  peakDemandCharge: number;
  // Maximum/NCP Demand Charge ($/MW-month)
  // Charged based on customer's own highest usage any time
  maxDemandCharge: number;
  // Energy charge ($/MWh) - for reference
  energyCharge: number;
  // Ratchet percentage (e.g., 0.90 = 90% of highest peak in preceding months)
  ratchetPercent?: number;
  // How many months the ratchet applies
  ratchetMonths?: number;
  // On-peak period definition (for TOU tariffs)
  onPeakDefinition?: string;
  // Whether flexible load benefits from this tariff structure
  // Higher = more benefit from curtailing during peaks
  flexibilityBenefitMultiplier: number;
  // Notes about tariff source
  tariffSource: string;
}

export interface MarketStructure {
  type: MarketType;
  hasCapacityMarket: boolean;
  // Base residential allocation for infrastructure costs (0-1)
  baseResidentialAllocation: number;
  // How much of capacity costs flow through to residential (0-1)
  capacityCostPassThrough: number;
  // Transmission cost allocation to residential (0-1)
  transmissionAllocation: number;
  // Whether utility owns generation (affects cost allocation)
  utilityOwnsGeneration: boolean;
  // 2024 capacity price if applicable ($/MW-day)
  capacityPrice2024?: number;
  // Notes on market-specific considerations
  notes: string;
}

export interface UtilityProfile {
  id: string;
  name: string;
  shortName: string;
  state: string;
  region: string;
  // Rate base data - residential customers served by utility
  residentialCustomers: number;
  totalCustomers: number;
  // System characteristics
  systemPeakMW: number;
  // Billing data
  averageMonthlyBill: number;
  averageMonthlyUsageKWh: number;
  // Market structure
  market: MarketStructure;
  // Tariff structure for large power customers
  tariff: TariffStructure;
  // Data center context
  hasDataCenterActivity: boolean;
  dataCenterNotes?: string;
  // Default data center size for this utility (MW)
  defaultDataCenterMW: number;
  // Sources
  sources: string[];
}

// Market structure presets
const REGULATED_MARKET: MarketStructure = {
  type: 'regulated',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.40,
  capacityCostPassThrough: 0.40, // Through rate base
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true,
  notes: 'Vertically integrated utility. Infrastructure costs allocated through traditional rate base. State PUC sets rates based on cost of service study.'
};

const PJM_MARKET: MarketStructure = {
  type: 'pjm',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.35,
  capacityCostPassThrough: 0.50, // Higher pass-through due to capacity market
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  capacityPrice2024: 269.92, // $/MW-day from July 2024 auction
  notes: 'PJM capacity market. 2024 auction cleared at $269.92/MW-day (10x increase). Data centers attributed to 63% of price increase. Capacity costs flow through retail suppliers to customers.'
};

const ERCOT_MARKET: MarketStructure = {
  type: 'ercot',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.30,
  capacityCostPassThrough: 0.25, // Lower - energy-only market
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: false,
  notes: 'Energy-only market with no capacity payments. Price signals drive investment. $5,000/MWh cap. Lower baseline costs but more volatile. Transmission costs still allocated to ratepayers.'
};

const MISO_MARKET: MarketStructure = {
  type: 'miso',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.38,
  capacityCostPassThrough: 0.35,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true, // Many vertically integrated utilities in MISO
  capacityPrice2024: 30.00, // Lower than PJM
  notes: 'MISO capacity market with lower clearing prices than PJM. Many vertically integrated utilities still operate within MISO footprint.'
};

const SPP_MARKET: MarketStructure = {
  type: 'spp',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.40,
  capacityCostPassThrough: 0.40,
  transmissionAllocation: 0.35,
  utilityOwnsGeneration: true,
  notes: 'Southwest Power Pool. Energy market but no mandatory capacity market. Many vertically integrated utilities. Resource adequacy through bilateral contracts.'
};

const NYISO_MARKET: MarketStructure = {
  type: 'nyiso',
  hasCapacityMarket: true,
  baseResidentialAllocation: 0.35,
  capacityCostPassThrough: 0.45,
  transmissionAllocation: 0.38,
  utilityOwnsGeneration: false,
  capacityPrice2024: 180.00, // $/MW-day approximate for NYISO
  notes: 'New York ISO with capacity market. High capacity and transmission costs. Transmission constraints in downstate areas. Data center growth concentrated upstate.'
};

const TVA_MARKET: MarketStructure = {
  type: 'tva',
  hasCapacityMarket: false,
  baseResidentialAllocation: 0.42,
  capacityCostPassThrough: 0.35,
  transmissionAllocation: 0.40,
  utilityOwnsGeneration: true,
  notes: 'Tennessee Valley Authority provides wholesale power to 153 local power companies. Costs flow through to retail rates. Federal power agency with low-cost hydro and nuclear.'
};

// ============================================
// TARIFF STRUCTURE PRESETS
// Based on actual utility rate schedules
// ============================================

/**
 * PSO Large Power & Light (LPL) - Schedule 242/244/246
 * Source: PSO Tariff effective 1/30/2025
 * Key: TOU Peak demand + Maximum demand with 90% ratchet
 */
const PSO_TARIFF: TariffStructure = {
  demandChargeType: 'TOU_PEAK_NCP',
  peakDemandCharge: 7050, // $7.05/kW at Transmission level
  maxDemandCharge: 2470, // $2.47/kW at Transmission level
  energyCharge: 1.708, // $0.001708/kWh at Transmission level
  ratchetPercent: 0.90,
  ratchetMonths: 11,
  onPeakDefinition: '2pm-9pm Mon-Fri, June 1 - September 30',
  flexibilityBenefitMultiplier: 1.4, // High benefit - peak charge >> max charge
  tariffSource: 'PSO LPL Schedule 242/244/246, effective 1/30/2025',
};

/**
 * Dominion Virginia GS-4 (Large General Service)
 * Source: Dominion Energy Virginia tariff schedules
 * Key: TOU On-Peak vs Off-Peak demand with large differential
 */
const DOMINION_TARIFF: TariffStructure = {
  demandChargeType: 'TOU_PEAK_NCP',
  peakDemandCharge: 8769, // $8.769/kW on-peak (transmission voltage)
  maxDemandCharge: 515, // $0.515/kW off-peak
  energyCharge: 27.0, // ~$0.027/kWh
  ratchetPercent: 0.90, // Off-peak billed only for demand exceeding 90% of on-peak
  ratchetMonths: 11,
  onPeakDefinition: 'Seasonal TOU periods defined by Dominion',
  flexibilityBenefitMultiplier: 1.6, // Very high benefit - $8.25/kW on-peak avoidance
  tariffSource: 'Dominion Virginia GS-4 Schedule, effective 1/1/2025',
};

/**
 * Duke Energy Carolinas LGS (Large General Service)
 * Source: Duke Energy Carolinas rate schedules
 * Key: Coincident peak method with 70% annual ratchet
 */
const DUKE_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 5200, // Based on CP contribution
  maxDemandCharge: 3500, // Distribution component
  energyCharge: 35.0, // ~$0.035/kWh blended
  ratchetPercent: 0.70, // 70% of annual max
  ratchetMonths: 12,
  onPeakDefinition: 'System coincident peak hours',
  flexibilityBenefitMultiplier: 1.2, // Moderate benefit from CP avoidance
  tariffSource: 'Duke Energy Carolinas LGS Schedule',
};

/**
 * Georgia Power PLL-18 (Power and Light Large)
 * Source: Georgia Power tariff schedules 2025
 * Key: 12-month rolling ratchet with summer/winter weighting
 */
const GEORGIA_POWER_TARIFF: TariffStructure = {
  demandChargeType: 'ROLLING_RATCHET',
  peakDemandCharge: 13270, // $13.27/kW of billing demand
  maxDemandCharge: 0, // Included in peak demand (rolling max)
  energyCharge: 14.27, // Mid-tier rate
  ratchetPercent: 0.95, // 95% of summer average
  ratchetMonths: 12,
  onPeakDefinition: 'Summer months weighted at 95%, Winter at 60%',
  flexibilityBenefitMultiplier: 1.3, // High impact from summer peak avoidance
  tariffSource: 'Georgia Power PLL-18 Schedule, 2025',
};

/**
 * AEP Ohio GS-4 with PJM market overlay
 * Source: AEP Ohio tariff book + PJM capacity
 * Key: 1CP transmission pilot + 5CP capacity allocation
 */
const AEP_OHIO_TARIFF: TariffStructure = {
  demandChargeType: 'CP_1_5',
  peakDemandCharge: 6500, // Base demand + transmission
  maxDemandCharge: 2000, // Distribution
  energyCharge: 45.0, // Including various riders
  ratchetPercent: 0.85, // 85% contract minimum for new DC tariff
  ratchetMonths: 12,
  onPeakDefinition: '1CP for transmission, 5CP for PJM capacity',
  flexibilityBenefitMultiplier: 1.5, // Massive benefit from CP avoidance
  tariffSource: 'AEP Ohio GS-4 + PJM capacity charges',
};

/**
 * ERCOT - 4CP transmission allocation
 * Source: ERCOT transmission cost allocation methodology
 * Key: Transmission costs based on 4 coincident peak hours per year
 */
const ERCOT_TARIFF: TariffStructure = {
  demandChargeType: 'CP_4',
  peakDemandCharge: 5500, // 4CP-based transmission (~$5.50/kW-month)
  maxDemandCharge: 1500, // Distribution/local charges
  energyCharge: 50.0, // Varies by retailer, competitive market
  ratchetPercent: undefined, // No ratchet - pure 4CP
  ratchetMonths: 0,
  onPeakDefinition: '4 highest system peak hours per year (one per season)',
  flexibilityBenefitMultiplier: 1.8, // Huge benefit - curtail 4 hours = major savings
  tariffSource: 'ERCOT 4CP transmission allocation methodology',
};

/**
 * Generic regulated utility tariff
 * For utilities without specific tariff data
 */
const GENERIC_REGULATED_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 5430, // ~60% of total
  maxDemandCharge: 3620, // ~40% of total
  energyCharge: 30.0,
  ratchetPercent: 0.80,
  ratchetMonths: 12,
  onPeakDefinition: 'Utility-defined peak periods',
  flexibilityBenefitMultiplier: 1.0, // Baseline
  tariffSource: 'Generic regulated utility assumptions',
};

/**
 * Black Hills Energy Wyoming (Cheyenne Light, Fuel & Power)
 * Source: CLFP Wyo. P.S.C. Tariff No. 13, effective 2024
 * Key: Large Power Contract Service (LPCS) for 5MW+ loads, negotiated rates
 * Note: Data center focused utility with Meta/Microsoft partnerships
 */
const BHE_WYOMING_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 5800, // Estimated from LPCS negotiations, transmission-based
  maxDemandCharge: 2400, // Distribution component
  energyCharge: 26.28, // $0.02628/kWh for Industrial Contract Service (Nov 2025 TCAM)
  ratchetPercent: 0.85,
  ratchetMonths: 12,
  onPeakDefinition: 'System coincident peak, negotiated for large loads',
  flexibilityBenefitMultiplier: 1.3, // Moderate benefit, offers interruptible rates
  tariffSource: 'BHE CLFP Wyo. P.S.C. Tariff No. 13, LPCS Schedule; Model Assumption for negotiated rates',
};

/**
 * Black Hills Energy South Dakota (Black Hills Power)
 * Source: SD PUC Tariff filings, effective 2024
 * Key: General Service Large (GSL) for 1MW+ loads
 */
const BHE_SOUTH_DAKOTA_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 5200, // Estimated from SD GSL schedule
  maxDemandCharge: 2800, // Distribution/facilities charge
  energyCharge: 28.0, // Approximate blended rate
  ratchetPercent: 0.80,
  ratchetMonths: 12,
  onPeakDefinition: 'System coincident peak periods',
  flexibilityBenefitMultiplier: 1.2,
  tariffSource: 'Black Hills Power SD PUC Tariff, General Service Large; Model Assumption',
};

/**
 * ConEd New York SC-9 Large Power
 * Source: ConEd PSC No. 10 - Electricity, effective 2024
 * Key: High capacity and delivery charges, NYISO capacity market overlay
 */
const CONED_TARIFF: TariffStructure = {
  demandChargeType: 'CP_1_5',
  peakDemandCharge: 12500, // High due to NYC transmission constraints + capacity
  maxDemandCharge: 3800, // Distribution delivery charges
  energyCharge: 85.0, // Includes market supply and delivery, varies significantly
  ratchetPercent: 0.90,
  ratchetMonths: 12,
  onPeakDefinition: 'NYISO coincident peak for capacity; summer peak for transmission',
  flexibilityBenefitMultiplier: 1.5, // High benefit from peak avoidance in constrained system
  tariffSource: 'ConEd PSC No. 10 Electricity, SC-9 Large Power, effective Dec 2023; Model Assumption',
};

/**
 * National Grid Upstate NY SC-3/SC-7
 * Source: National Grid PSC No. 220, effective 2025
 * Key: $18.11/kW demand charge for SC-7 large general service
 */
const NATIONAL_GRID_NY_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 10930, // Based on $18.11/kW × 60% peak allocation
  maxDemandCharge: 7260, // 40% for max demand/distribution
  energyCharge: 45.0, // Approximate delivery + supply
  ratchetPercent: 0.85,
  ratchetMonths: 12,
  onPeakDefinition: 'Peak demand measured over any 15-minute interval',
  flexibilityBenefitMultiplier: 1.3,
  tariffSource: 'National Grid NY PSC No. 220, SC-7 Large General Service, effective Sept 2025',
};

/**
 * NYSEG Large General Service SC-7
 * Source: NYSEG PSC No. 120, effective 2025
 * Key: SC-7-1 through SC-7-4 based on voltage level
 */
const NYSEG_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 10870, // Based on $18.11/kW demand charge
  maxDemandCharge: 7250,
  energyCharge: 42.0, // Approximate for large customers
  ratchetPercent: 0.85,
  ratchetMonths: 12,
  onPeakDefinition: 'Billing demand 500 kW+ in two periods triggers SC-7 classification',
  flexibilityBenefitMultiplier: 1.3,
  tariffSource: 'NYSEG PSC No. 120, SC-7 Large General Service, Apr 2025 Rate Summary',
};

/**
 * Duke Energy Florida GSD-1
 * Source: FL PSC approved tariff, effective 2025
 * Key: $7.77/kW standard demand charge
 */
const DUKE_FLORIDA_TARIFF: TariffStructure = {
  demandChargeType: 'TOU_PEAK_NCP',
  peakDemandCharge: 4660, // $7.77/kW × 60% peak allocation
  maxDemandCharge: 3110, // 40% for max/distribution
  energyCharge: 35.0, // Approximate blended energy + fuel
  ratchetPercent: 0.75,
  ratchetMonths: 12,
  onPeakDefinition: 'Time of Use with Base/Mid/On-Peak periods',
  flexibilityBenefitMultiplier: 1.2,
  tariffSource: 'Duke Energy Florida GSD-1/GSDT-1, FL PSC filing effective Jan 2025',
};

/**
 * Entergy Arkansas LGS/LPS
 * Source: Entergy Arkansas Rate Schedule No. 6 (LGS), filed with AR PSC
 * Key: Formula Rate Plan allows annual adjustments
 */
const ENTERGY_ARKANSAS_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 4800, // Estimated from LGS/LPS schedules
  maxDemandCharge: 3200,
  energyCharge: 25.0, // Lower than average due to MISO market
  ratchetPercent: 0.80,
  ratchetMonths: 12,
  onPeakDefinition: 'System coincident peak periods',
  flexibilityBenefitMultiplier: 1.1,
  tariffSource: 'Entergy Arkansas Rate Schedule No. 6 LGS, filed with AR PSC; Model Assumption',
};

/**
 * Entergy Mississippi LGS
 * Source: Entergy Mississippi tariff, filed with MS PSC
 */
const ENTERGY_MISSISSIPPI_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 4600,
  maxDemandCharge: 3000,
  energyCharge: 24.0, // Competitive rates in MISO
  ratchetPercent: 0.80,
  ratchetMonths: 12,
  onPeakDefinition: 'System coincident peak periods',
  flexibilityBenefitMultiplier: 1.1,
  tariffSource: 'Entergy Mississippi LGS tariff, filed with MS PSC; Model Assumption',
};

/**
 * TVA Large Power (via Local Power Companies)
 * Source: TVA Rate Schedules, GSA-2/GSA-3 for demand customers
 * Key: $5.34/kW for first 50 kW, wholesale plus LPC markup
 */
const TVA_TARIFF: TariffStructure = {
  demandChargeType: 'COINCIDENT_PEAK',
  peakDemandCharge: 5340, // Based on $5.34/kW GSA demand
  maxDemandCharge: 2500, // Transmission delivery component ($0.36-$0.93/kW)
  energyCharge: 24.5, // Including TVA fuel cost ~$0.0245/kWh
  ratchetPercent: undefined, // 30-minute peak measurement, no ratchet
  ratchetMonths: 0,
  onPeakDefinition: 'Highest 30-minute period during billing cycle',
  flexibilityBenefitMultiplier: 1.0,
  tariffSource: 'TVA GSA-2/GSA-3 Rate Schedules; Local Power Company rates may vary',
};

/**
 * Appalachian Power West Virginia (AEP)
 * Source: APCo P.S.C. W.VA. Tariff No. 16, Large General Service
 * Key: PJM market overlay with WV regulatory structure
 */
const APCO_WV_TARIFF: TariffStructure = {
  demandChargeType: 'CP_1_5',
  peakDemandCharge: 7200, // Higher due to PJM capacity costs
  maxDemandCharge: 2800,
  energyCharge: 38.0,
  ratchetPercent: 0.85,
  ratchetMonths: 12,
  onPeakDefinition: '1CP transmission, 5CP PJM capacity allocation',
  flexibilityBenefitMultiplier: 1.5,
  tariffSource: 'APCo P.S.C. W.VA. Tariff No. 16, Large General Service Schedule LGS; Model Assumption',
};

/**
 * Mon Power/Potomac Edison West Virginia (FirstEnergy)
 * Source: FirstEnergy WV tariff filings, effective 2024-2025
 * Key: PJM market with state regulation
 */
const MON_POWER_TARIFF: TariffStructure = {
  demandChargeType: 'CP_1_5',
  peakDemandCharge: 6800,
  maxDemandCharge: 2600,
  energyCharge: 40.0,
  ratchetPercent: 0.85,
  ratchetMonths: 12,
  onPeakDefinition: '1CP transmission, 5CP PJM capacity',
  flexibilityBenefitMultiplier: 1.4,
  tariffSource: 'Mon Power WV Electric Tariff, Power Service schedules; Model Assumption',
};

export const UTILITY_PROFILES: UtilityProfile[] = [
  // ============================================
  // ORGANIZED ALPHABETICALLY BY STATE
  // ============================================

  // --- ALABAMA (TVA) ---
  {
    id: 'tva-alabama',
    name: 'TVA - Alabama Power Distributors',
    shortName: 'TVA Alabama',
    state: 'Alabama',
    region: 'Southeast',
    residentialCustomers: 1800000,
    totalCustomers: 2100000,
    systemPeakMW: 12000,
    averageMonthlyBill: 142,
    averageMonthlyUsageKWh: 1150,
    market: { ...TVA_MARKET },
    tariff: { ...TVA_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Growing data center interest in TVA region; low-cost hydro and nuclear power',
    defaultDataCenterMW: 800,
    sources: ['TVA Rate Schedules 2024', 'TVA 2024 IRP', 'Alabama local power company filings']
  },

  // --- ARIZONA ---
  {
    id: 'aps-arizona',
    name: 'Arizona Public Service (APS)',
    shortName: 'APS Arizona',
    state: 'Arizona',
    region: 'Southwest',
    residentialCustomers: 1200000,
    totalCustomers: 1400000,
    systemPeakMW: 8212,
    averageMonthlyBill: 140,
    averageMonthlyUsageKWh: 1050,
    market: { ...REGULATED_MARKET },
    tariff: { ...GENERIC_REGULATED_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Phoenix metro data center growth; projecting 40% peak demand growth to 13,000 MW by 2031',
    defaultDataCenterMW: 800,
    sources: ['APS 2024 peak demand records', 'Arizona Corporation Commission filings']
  },

  // --- ARKANSAS ---
  {
    id: 'entergy-arkansas',
    name: 'Entergy Arkansas',
    shortName: 'Entergy Arkansas',
    state: 'Arkansas',
    region: 'South Central',
    residentialCustomers: 520000,
    totalCustomers: 720000,
    systemPeakMW: 4800,
    averageMonthlyBill: 118,
    averageMonthlyUsageKWh: 1100,
    market: { ...MISO_MARKET, notes: 'Entergy operates in MISO. Formula Rate Plan allows annual rate adjustments through AR PSC.' },
    tariff: { ...ENTERGY_ARKANSAS_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data center development opportunities with competitive MISO rates',
    defaultDataCenterMW: 500,
    sources: ['Entergy Arkansas 2024 FRP', 'AR PSC filings', 'MISO market data']
  },

  // --- COLORADO ---
  {
    id: 'xcel-colorado',
    name: 'Xcel Energy Colorado',
    shortName: 'Xcel Colorado',
    state: 'Colorado',
    region: 'Mountain West',
    residentialCustomers: 1400000,
    totalCustomers: 1600000,
    systemPeakMW: 7200,
    averageMonthlyBill: 105,
    averageMonthlyUsageKWh: 700,
    market: { ...REGULATED_MARKET },
    tariff: { ...GENERIC_REGULATED_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data centers expected to drive 2/3 of new demand; 19% peak increase projected by 2031',
    defaultDataCenterMW: 600,
    sources: ['Xcel Energy Colorado rate filings', 'Colorado PUC documents']
  },

  // --- FLORIDA ---
  {
    id: 'duke-florida',
    name: 'Duke Energy Florida',
    shortName: 'Duke Florida',
    state: 'Florida',
    region: 'Southeast',
    residentialCustomers: 1900000,
    totalCustomers: 2100000,
    systemPeakMW: 10500,
    averageMonthlyBill: 148,
    averageMonthlyUsageKWh: 1100,
    market: { ...REGULATED_MARKET, notes: 'Florida regulated market under FL PSC. Storm hardening costs included in base rates.' },
    tariff: { ...DUKE_FLORIDA_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Central Florida data center corridor growth; hurricane resilience considerations',
    defaultDataCenterMW: 600,
    sources: ['Duke Energy Florida FL PSC filings', 'GSD-1/GSDT-1 tariff sheets Jan 2025']
  },

  // --- GEORGIA ---
  {
    id: 'georgia-power',
    name: 'Georgia Power',
    shortName: 'Georgia Power',
    state: 'Georgia',
    region: 'Southeast',
    residentialCustomers: 2400000,
    totalCustomers: 2804000,
    systemPeakMW: 17100,
    averageMonthlyBill: 153,
    averageMonthlyUsageKWh: 1150,
    market: { ...REGULATED_MARKET },
    tariff: { ...GEORGIA_POWER_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Projecting 8,200 MW of load growth by 2030, including significant data center demand in Atlanta metro',
    defaultDataCenterMW: 1200,
    sources: ['Georgia Power 2024 Facts & Figures', 'Georgia PSC filings', 'Southern Company annual reports']
  },

  // --- INDIANA ---
  {
    id: 'aep-indiana-michigan',
    name: 'Indiana Michigan Power (I&M)',
    shortName: 'AEP I&M',
    state: 'Indiana / Michigan',
    region: 'Midwest',
    residentialCustomers: 480000,
    totalCustomers: 600000,
    systemPeakMW: 5500,
    averageMonthlyBill: 130,
    averageMonthlyUsageKWh: 950,
    market: {
      ...PJM_MARKET,
      utilityOwnsGeneration: true,
      baseResidentialAllocation: 0.38,
      notes: 'I&M operates in PJM but remains vertically integrated with owned generation including Cook Nuclear Plant. Hybrid market structure.'
    },
    tariff: { ...AEP_OHIO_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Northeast Indiana and Fort Wayne area seeing industrial and data center growth',
    defaultDataCenterMW: 500,
    sources: ['Indiana Michigan Power rate filings', 'Indiana Utility Regulatory Commission documents']
  },

  // --- KENTUCKY (TVA) ---
  {
    id: 'tva-kentucky',
    name: 'TVA - Kentucky Distributors',
    shortName: 'TVA Kentucky',
    state: 'Kentucky',
    region: 'Southeast',
    residentialCustomers: 650000,
    totalCustomers: 780000,
    systemPeakMW: 4500,
    averageMonthlyBill: 128,
    averageMonthlyUsageKWh: 1050,
    market: { ...TVA_MARKET },
    tariff: { ...TVA_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'TVA service area in western Kentucky; low-cost power attracts industrial loads',
    defaultDataCenterMW: 400,
    sources: ['TVA Rate Schedules 2024', 'Kentucky local power company filings']
  },

  // --- MISSISSIPPI ---
  {
    id: 'entergy-mississippi',
    name: 'Entergy Mississippi',
    shortName: 'Entergy Mississippi',
    state: 'Mississippi',
    region: 'South Central',
    residentialCustomers: 450000,
    totalCustomers: 610000,
    systemPeakMW: 4200,
    averageMonthlyBill: 132,
    averageMonthlyUsageKWh: 1100,
    market: { ...MISO_MARKET, notes: 'Entergy operates in MISO. AWS data center development announced in Mississippi.' },
    tariff: { ...ENTERGY_MISSISSIPPI_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'AWS data center projects announced; Entergy CEO cites DC benefits for ratepayers',
    defaultDataCenterMW: 600,
    sources: ['Entergy Mississippi tariff filings', 'MS PSC documents', 'Entergy 2024 news releases']
  },

  // --- NEVADA ---
  {
    id: 'nv-energy',
    name: 'NV Energy',
    shortName: 'NV Energy Nevada',
    state: 'Nevada',
    region: 'West',
    residentialCustomers: 610000,
    totalCustomers: 2400000,
    systemPeakMW: 9000,
    averageMonthlyBill: 125,
    averageMonthlyUsageKWh: 900,
    market: { ...REGULATED_MARKET },
    tariff: { ...GENERIC_REGULATED_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data centers requesting to triple peak demand; 4,000+ MW of AI data center projects planned in Reno area',
    defaultDataCenterMW: 1500,
    sources: ['NV Energy company facts', 'Nevada PUC filings', 'Greenlink transmission project documents']
  },

  // --- NEW YORK ---
  {
    id: 'coned-ny',
    name: 'Consolidated Edison (ConEd)',
    shortName: 'ConEd NYC',
    state: 'New York',
    region: 'Northeast',
    residentialCustomers: 3400000,
    totalCustomers: 3800000,
    systemPeakMW: 13200,
    averageMonthlyBill: 165,
    averageMonthlyUsageKWh: 600,
    market: { ...NYISO_MARKET, notes: 'ConEd operates in NYISO. NYC transmission constraints drive high capacity costs. Limited data center development due to space and cost.' },
    tariff: { ...CONED_TARIFF },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Limited NYC data center growth due to high costs and space constraints; some edge facilities',
    defaultDataCenterMW: 200,
    sources: ['ConEd PSC No. 10 Electricity', 'NYISO capacity data', 'NY PSC rate orders Dec 2023']
  },
  {
    id: 'national-grid-ny',
    name: 'National Grid Upstate NY',
    shortName: 'National Grid NY',
    state: 'New York',
    region: 'Northeast',
    residentialCustomers: 1700000,
    totalCustomers: 1950000,
    systemPeakMW: 6800,
    averageMonthlyBill: 125,
    averageMonthlyUsageKWh: 650,
    market: { ...NYISO_MARKET },
    tariff: { ...NATIONAL_GRID_NY_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Upstate NY data center development; Buffalo and Syracuse areas seeing growth',
    defaultDataCenterMW: 400,
    sources: ['National Grid PSC No. 220', 'NY PSC rate orders Sept 2025', 'NYISO data']
  },
  {
    id: 'nyseg',
    name: 'New York State Electric & Gas (NYSEG)',
    shortName: 'NYSEG',
    state: 'New York',
    region: 'Northeast',
    residentialCustomers: 880000,
    totalCustomers: 1000000,
    systemPeakMW: 3200,
    averageMonthlyBill: 138,
    averageMonthlyUsageKWh: 700,
    market: { ...NYISO_MARKET },
    tariff: { ...NYSEG_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Central NY and Southern Tier data center opportunities; competitive land costs',
    defaultDataCenterMW: 300,
    sources: ['NYSEG PSC No. 120', 'NYSEG Apr 2025 Rate Summary', 'NY PSC filings']
  },

  // --- NORTH CAROLINA / SOUTH CAROLINA ---
  {
    id: 'duke-carolinas',
    name: 'Duke Energy Carolinas',
    shortName: 'Duke Carolinas',
    state: 'North Carolina / South Carolina',
    region: 'Southeast',
    residentialCustomers: 2507000,
    totalCustomers: 2926000,
    systemPeakMW: 20700,
    averageMonthlyBill: 135,
    averageMonthlyUsageKWh: 1000,
    market: { ...REGULATED_MARKET },
    tariff: { ...DUKE_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Growing data center presence in Charlotte metro area',
    defaultDataCenterMW: 1000,
    sources: ['Duke Energy 2024 annual report', 'NC Utilities Commission filings']
  },
  {
    id: 'duke-progress',
    name: 'Duke Energy Progress',
    shortName: 'Duke Progress',
    state: 'North Carolina / South Carolina',
    region: 'Southeast',
    residentialCustomers: 1400000,
    totalCustomers: 1700000,
    systemPeakMW: 13800,
    averageMonthlyBill: 132,
    averageMonthlyUsageKWh: 1000,
    market: { ...REGULATED_MARKET },
    tariff: { ...DUKE_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Serves Raleigh area with growing tech sector',
    defaultDataCenterMW: 800,
    sources: ['Duke Energy 2024 annual report', 'NC Utilities Commission filings']
  },

  // --- OHIO ---
  {
    id: 'aep-ohio',
    name: 'AEP Ohio',
    shortName: 'AEP Ohio',
    state: 'Ohio',
    region: 'Midwest',
    residentialCustomers: 1200000,
    totalCustomers: 1500000,
    systemPeakMW: 12000,
    averageMonthlyBill: 135,
    averageMonthlyUsageKWh: 900,
    market: {
      ...PJM_MARKET,
      notes: 'AEP Ohio operates in PJM. Ohio is a deregulated retail market but AEP still owns transmission. 2024 PJM capacity price surge significantly impacts costs.'
    },
    tariff: { ...AEP_OHIO_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Ohio seeing significant data center growth; AEP proposed new rate class for data centers to PUCO',
    defaultDataCenterMW: 1000,
    sources: ['AEP Ohio rate filings', 'PUCO documents', 'PJM capacity auction results']
  },

  // --- OKLAHOMA ---
  {
    id: 'pso-oklahoma',
    name: 'Public Service Company of Oklahoma (PSO)',
    shortName: 'PSO Oklahoma',
    state: 'Oklahoma',
    region: 'Southwest',
    residentialCustomers: 460000,
    totalCustomers: 575000,
    systemPeakMW: 4400,
    averageMonthlyBill: 130,
    averageMonthlyUsageKWh: 1100,
    market: { ...SPP_MARKET },
    tariff: { ...PSO_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Multiple large data center proposals; PSO facing 31% power deficit by 2031 with 779MW of new large load requests',
    defaultDataCenterMW: 1000,
    sources: ['PSO 2024 IRP Report', 'Oklahoma Corporation Commission filings', 'AEP annual reports', 'PSO LPL Schedule 242/244/246']
  },
  // --- SOUTH DAKOTA ---
  {
    id: 'bhe-south-dakota',
    name: 'Black Hills Energy South Dakota',
    shortName: 'BHE South Dakota',
    state: 'South Dakota',
    region: 'Northern Plains',
    residentialCustomers: 75000,
    totalCustomers: 95000,
    systemPeakMW: 850,
    averageMonthlyBill: 115,
    averageMonthlyUsageKWh: 900,
    market: { ...REGULATED_MARKET, notes: 'Regulated by SD PUC. Ready Wyoming transmission project will connect WY and SD systems by end of 2025.' },
    tariff: { ...BHE_SOUTH_DAKOTA_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Growing data center interest; no corporate income tax in SD, favorable business climate',
    defaultDataCenterMW: 300,
    sources: ['Black Hills Power SD PUC tariff filings', 'SD PUC documents', 'BHE Data Centers 2024']
  },

  // --- TENNESSEE (TVA) ---
  {
    id: 'tva-tennessee',
    name: 'TVA - Tennessee Distributors',
    shortName: 'TVA Tennessee',
    state: 'Tennessee',
    region: 'Southeast',
    residentialCustomers: 2800000,
    totalCustomers: 3200000,
    systemPeakMW: 18000,
    averageMonthlyBill: 135,
    averageMonthlyUsageKWh: 1100,
    market: { ...TVA_MARKET, notes: 'TVA provides wholesale power to 153 local distributors. 5.25% base rate increase effective Oct 2024. Federal power agency.' },
    tariff: { ...TVA_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Nashville area data center growth; Google, Facebook facilities in region',
    defaultDataCenterMW: 800,
    sources: ['TVA Rate Schedules 2024', 'TVA 2024 IRP', 'Nashville Electric Service rates']
  },

  // --- TEXAS ---
  {
    id: 'ercot-texas',
    name: 'ERCOT (Texas Grid)',
    shortName: 'ERCOT Texas',
    state: 'Texas',
    region: 'Texas',
    residentialCustomers: 12000000,
    totalCustomers: 26000000,
    systemPeakMW: 85508,
    averageMonthlyBill: 140,
    averageMonthlyUsageKWh: 1100,
    market: {
      ...ERCOT_MARKET,
      notes: 'Energy-only market with no capacity payments. 46% of projected load growth from data centers. Lower baseline capacity costs but transmission costs still flow to ratepayers. Retail choice allows competitive pricing.'
    },
    tariff: { ...ERCOT_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data centers account for 46% of projected load growth; demand projected to grow from 87 GW to 145 GW by 2031. 230GW of large load interconnection requests.',
    defaultDataCenterMW: 3000,
    sources: ['ERCOT load forecasts', 'EIA Texas electricity data', 'Texas PUC filings', 'Potomac Economics 2024 State of the Market']
  },
  {
    id: 'aep-swepco',
    name: 'Southwestern Electric Power (SWEPCO)',
    shortName: 'AEP SWEPCO',
    state: 'Texas (Panhandle) / Arkansas / Louisiana',
    region: 'Southwest',
    residentialCustomers: 400000,
    totalCustomers: 540000,
    systemPeakMW: 4800,
    averageMonthlyBill: 120,
    averageMonthlyUsageKWh: 1100,
    market: {
      ...SPP_MARKET,
      notes: 'SWEPCO operates in SPP (energy market, no capacity market). Vertically integrated with state PUC regulation in AR, LA, and TX panhandle.'
    },
    tariff: { ...PSO_TARIFF },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Less data center activity than other AEP territories',
    defaultDataCenterMW: 400,
    sources: ['SWEPCO rate filings', 'Arkansas PSC documents', 'Louisiana PSC documents']
  },

  // --- VIRGINIA ---
  {
    id: 'dominion-virginia',
    name: 'Dominion Energy Virginia',
    shortName: 'Dominion Virginia',
    state: 'Virginia',
    region: 'Mid-Atlantic',
    residentialCustomers: 2500000,
    totalCustomers: 2800000,
    systemPeakMW: 18000,
    averageMonthlyBill: 145,
    averageMonthlyUsageKWh: 1050,
    market: {
      ...PJM_MARKET,
      utilityOwnsGeneration: true,
      baseResidentialAllocation: 0.35,
      notes: 'Dominion operates in PJM but Virginia remains traditionally regulated. Data center capital of the world - 9GW DC peak forecast in 10 years. PJM capacity costs flow through but state regulates retail rates.'
    },
    tariff: { ...DOMINION_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Data center capital of the world; 933MW connected in 2023, forecasting 9GW DC peak in 10 years (25% system increase)',
    defaultDataCenterMW: 1500,
    sources: ['Dominion Energy 2024 IRP', 'Virginia SCC filings', 'JLARC Virginia Data Center Study 2024', 'PJM capacity auction results']
  },
  {
    id: 'aep-appalachian-va',
    name: 'Appalachian Power (APCo) - Virginia',
    shortName: 'APCo Virginia',
    state: 'Virginia',
    region: 'Appalachian',
    residentialCustomers: 500000,
    totalCustomers: 620000,
    systemPeakMW: 4500,
    averageMonthlyBill: 128,
    averageMonthlyUsageKWh: 1000,
    market: {
      ...PJM_MARKET,
      utilityOwnsGeneration: true,
      baseResidentialAllocation: 0.40,
      notes: 'APCo Virginia operates in PJM. Virginia SCC regulates retail rates. Data center interest as NoVA capacity constrained.'
    },
    tariff: { ...AEP_OHIO_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Virginia portion seeing data center interest as Northern Virginia capacity constrained',
    defaultDataCenterMW: 400,
    sources: ['Appalachian Power Virginia rate filings', 'Virginia SCC documents', 'PJM capacity data']
  },

  // --- WEST VIRGINIA ---
  {
    id: 'aep-appalachian-wv',
    name: 'Appalachian Power (APCo) - West Virginia',
    shortName: 'APCo West Virginia',
    state: 'West Virginia',
    region: 'Appalachian',
    residentialCustomers: 400000,
    totalCustomers: 500000,
    systemPeakMW: 3500,
    averageMonthlyBill: 122,
    averageMonthlyUsageKWh: 1000,
    market: {
      ...PJM_MARKET,
      utilityOwnsGeneration: true,
      baseResidentialAllocation: 0.42,
      notes: 'APCo WV operates in PJM but WV remains traditionally regulated. 2024-2025 rate case pending with ~14% commercial increase proposed.'
    },
    tariff: { ...APCO_WV_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Growing interest in WV for data centers due to lower costs than NoVA; securitization proposal pending',
    defaultDataCenterMW: 500,
    sources: ['APCo P.S.C. W.VA. Tariff No. 16', 'WV PSC Case No. 24-0854-E-42T', 'PJM capacity data']
  },
  {
    id: 'mon-power-wv',
    name: 'Mon Power / Potomac Edison (FirstEnergy)',
    shortName: 'Mon Power WV',
    state: 'West Virginia',
    region: 'Appalachian',
    residentialCustomers: 395000,
    totalCustomers: 480000,
    systemPeakMW: 2800,
    averageMonthlyBill: 118,
    averageMonthlyUsageKWh: 950,
    market: {
      ...PJM_MARKET,
      baseResidentialAllocation: 0.40,
      notes: 'FirstEnergy utilities in WV operate in PJM. 2024 rate case approved 6.4% base rate increase with 12% commercial impact.'
    },
    tariff: { ...MON_POWER_TARIFF },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Limited data center activity; industrial base focused on traditional manufacturing',
    defaultDataCenterMW: 300,
    sources: ['Mon Power WV PSC tariff filings', 'FirstEnergy 2024 WV rate order', 'PJM capacity data']
  },

  // --- WYOMING ---
  {
    id: 'bhe-wyoming',
    name: 'Black Hills Energy Wyoming (Cheyenne)',
    shortName: 'BHE Cheyenne WY',
    state: 'Wyoming',
    region: 'Mountain West',
    residentialCustomers: 45000,
    totalCustomers: 55000,
    systemPeakMW: 650,
    averageMonthlyBill: 108,
    averageMonthlyUsageKWh: 850,
    market: { ...REGULATED_MARKET, notes: 'Cheyenne Light, Fuel & Power operates in SPP. Major data center partnerships with Meta, Microsoft. Large Power Contract Service for 5MW+ loads with negotiated rates.' },
    tariff: { ...BHE_WYOMING_TARIFF },
    hasDataCenterActivity: true,
    dataCenterNotes: 'Major data center hub; Crusoe/Tallgrass 1,800-10,000 MW campus; Prometheus 1,200 MW; Meta and Microsoft facilities',
    defaultDataCenterMW: 500,
    sources: ['CLFP Wyo. P.S.C. Tariff No. 13', 'BHE Data Centers 2024', 'WyoFile Jan 2025 data center report']
  },

  // ============================================
  // GENERIC / NOT SURE OPTIONS
  // ============================================
  {
    id: 'generic-regulated',
    name: 'Generic Regulated Utility',
    shortName: 'Not Sure - Regulated',
    state: '',
    region: 'National Average',
    residentialCustomers: 500000,
    totalCustomers: 600000,
    systemPeakMW: 4000,
    averageMonthlyBill: 144,
    averageMonthlyUsageKWh: 865,
    market: { ...REGULATED_MARKET, notes: 'National average for vertically integrated regulated utility. Use if your utility is not in a competitive market.' },
    tariff: { ...GENERIC_REGULATED_TARIFF },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Select this if you are unsure of your utility or want to use national average assumptions',
    defaultDataCenterMW: 500,
    sources: ['EIA 2024 Electric Power Annual', 'EIA Form 861 data']
  },
  {
    id: 'generic-iso',
    name: 'Generic ISO/RTO Market Utility',
    shortName: 'Not Sure - ISO Market',
    state: '',
    region: 'National Average',
    residentialCustomers: 800000,
    totalCustomers: 950000,
    systemPeakMW: 6000,
    averageMonthlyBill: 155,
    averageMonthlyUsageKWh: 850,
    market: { ...PJM_MARKET, capacityPrice2024: 150, notes: 'Generic ISO/RTO market assumptions. Use if your utility is in a competitive wholesale market (PJM, NYISO, ISO-NE, MISO, CAISO, SPP).' },
    tariff: { ...AEP_OHIO_TARIFF },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Select this if your utility is in an ISO/RTO market but not specifically listed',
    defaultDataCenterMW: 600,
    sources: ['EIA 2024 Electric Power Annual', 'ISO/RTO capacity market data']
  },
  {
    id: 'custom',
    name: 'Custom / Enter Your Own',
    shortName: 'Custom Entry',
    state: '',
    region: '',
    residentialCustomers: 500000,
    totalCustomers: 600000,
    systemPeakMW: 4000,
    averageMonthlyBill: 144,
    averageMonthlyUsageKWh: 865,
    market: { ...REGULATED_MARKET },
    tariff: { ...GENERIC_REGULATED_TARIFF },
    hasDataCenterActivity: false,
    dataCenterNotes: 'Enter your own utility parameters for a custom analysis',
    defaultDataCenterMW: 1000,
    sources: ['User-provided data']
  }
];

// Helper to get utility by ID
export function getUtilityById(id: string): UtilityProfile | undefined {
  return UTILITY_PROFILES.find(u => u.id === id);
}

// Get utilities sorted alphabetically by state, then by utility name
// Places generic options at the end
export function getUtilitiesSortedByState(): UtilityProfile[] {
  return [...UTILITY_PROFILES].sort((a, b) => {
    // Custom/generic options go last
    const aIsGeneric = a.id.startsWith('generic') || a.id === 'custom';
    const bIsGeneric = b.id.startsWith('generic') || b.id === 'custom';

    if (aIsGeneric && !bIsGeneric) return 1;
    if (!aIsGeneric && bIsGeneric) return -1;
    if (aIsGeneric && bIsGeneric) {
      // Within generic options, maintain specific order
      if (a.id === 'custom') return 1;
      if (b.id === 'custom') return -1;
      return a.shortName.localeCompare(b.shortName);
    }

    // Sort by state first
    const stateCompare = a.state.localeCompare(b.state);
    if (stateCompare !== 0) return stateCompare;

    // Then by utility name within same state
    return a.shortName.localeCompare(b.shortName);
  });
}

// Get utilities grouped by state for optgroup display
export function getUtilitiesGroupedByState(): { state: string; utilities: UtilityProfile[] }[] {
  const sorted = getUtilitiesSortedByState();
  const groups: { state: string; utilities: UtilityProfile[] }[] = [];
  let currentState = '';
  let currentGroup: UtilityProfile[] = [];

  for (const utility of sorted) {
    const state = utility.state || 'Other Options';
    if (state !== currentState) {
      if (currentGroup.length > 0) {
        groups.push({ state: currentState || 'Other Options', utilities: currentGroup });
      }
      currentState = state;
      currentGroup = [utility];
    } else {
      currentGroup.push(utility);
    }
  }

  // Push the last group
  if (currentGroup.length > 0) {
    groups.push({ state: currentState || 'Other Options', utilities: currentGroup });
  }

  return groups;
}

// Get utilities grouped by region
export function getUtilitiesByRegion(): Record<string, UtilityProfile[]> {
  return UTILITY_PROFILES.reduce((acc, utility) => {
    const region = utility.region || 'Other';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(utility);
    return acc;
  }, {} as Record<string, UtilityProfile[]>);
}

// Get utilities grouped by market type
export function getUtilitiesByMarketType(): Record<MarketType, UtilityProfile[]> {
  return UTILITY_PROFILES.reduce((acc, utility) => {
    const marketType = utility.market.type;
    if (!acc[marketType]) {
      acc[marketType] = [];
    }
    acc[marketType].push(utility);
    return acc;
  }, {} as Record<MarketType, UtilityProfile[]>);
}

// Get market-adjusted residential allocation
export function getMarketAdjustedAllocation(profile: UtilityProfile, dcPeakCoincidence: number): number {
  const market = profile.market;

  // Base allocation from market structure
  let allocation = market.baseResidentialAllocation;

  // Adjust for capacity market costs if applicable
  if (market.hasCapacityMarket && market.capacityPrice2024) {
    // Higher capacity prices mean more cost pressure on all ratepayers
    // PJM 2024 prices are ~10x historical, so adjust allocation upward
    const priceMultiplier = market.capacityPrice2024 / 30; // Normalize to historical ~$30/MW-day
    const capacityAdjustment = Math.min(0.10, (priceMultiplier - 1) * 0.02);
    allocation += capacityAdjustment * market.capacityCostPassThrough;
  }

  // Energy-only markets have lower allocation for capacity-related costs
  if (market.type === 'ercot') {
    // In ERCOT, large loads more directly face market prices
    // Residential allocation for infrastructure is lower
    allocation *= 0.85;
  }

  // Clamp to reasonable bounds
  return Math.max(0.20, Math.min(0.55, allocation));
}
