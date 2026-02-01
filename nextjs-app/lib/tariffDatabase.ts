/**
 * Large Load Utility Tariff Database
 *
 * Comprehensive database of utility tariffs for large loads (typically 1MW+)
 * across the United States. Includes protection mechanisms, contract terms,
 * and regulatory status.
 *
 * Data Sources:
 * - E3 Study "Tailored for Scale" (2025)
 * - State PUC tariff filings
 * - Utility rate schedules
 * - ISO/RTO interconnection requirements
 * - FERC dockets and orders
 *
 * Last Updated: January 2026
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type Region = 'Northeast' | 'Southeast' | 'Midwest' | 'Southwest' | 'West' | 'Texas' | 'Mountain West' | 'Mid-Atlantic' | 'Plains';

export type ISO_RTO = 'PJM' | 'ERCOT' | 'MISO' | 'CAISO' | 'SPP' | 'NYISO' | 'ISO-NE' | 'None';

export type TariffStatus = 'Active' | 'Proposed' | 'Under Review' | 'Suspended';

export type ProposedStatus = 'Filed' | 'Under Review' | 'Comment Period' | 'Hearing Scheduled' | 'Decision Pending' | 'Approved' | 'Rejected';

export type ProtectionCategory =
  | 'Cost Recovery'
  | 'Financial Security'
  | 'Load Assurance'
  | 'Risk Allocation'
  | 'Queue Management'
  | 'Flexibility Incentives';

export interface TariffProtections {
  // Cost Recovery
  minimum_demand_charge: boolean;
  minimum_demand_pct?: number; // Percentage of contract demand
  demand_ratchet: boolean;
  ratchet_pct?: number; // Ratchet percentage
  ratchet_months?: number;
  ciac_required: boolean;
  ciac_description?: string;
  network_upgrade_allocation: boolean;

  // Financial Security
  credit_requirements: boolean;
  credit_rating_min?: string;
  deposit_required: boolean;
  deposit_months?: number; // Months of estimated billing
  letter_of_credit: boolean;
  parent_guarantee: boolean;

  // Load Assurance
  contract_min_term_months: number;
  take_or_pay: boolean;
  take_or_pay_pct?: number;
  load_factor_requirement: boolean;
  min_load_factor?: number;
  ramp_schedule: boolean;
  ramp_schedule_months?: number;

  // Risk Allocation
  fuel_adjustment_clause: boolean;
  capacity_pass_through: boolean;
  curtailment_provisions: boolean;
  curtailment_notice_hours?: number;
  force_majeure: boolean;

  // Queue Management
  queue_deposit: boolean;
  queue_deposit_per_mw?: number;
  milestone_requirements: boolean;
  study_cost_allocation: boolean;
  commercial_readiness: boolean;

  // Flexibility Incentives
  interruptible_discount: boolean;
  interruptible_discount_pct?: number;
  tou_differential: boolean;
  tou_peak_premium_pct?: number;
  demand_response_credit: boolean;
  behind_meter_credit: boolean;
}

export interface LargeLoadTariff {
  id: string;
  utility: string;
  utility_short: string;
  state: string;
  region: Region;
  iso_rto: ISO_RTO;
  tariff_name: string;
  rate_schedule: string;
  effective_date: string;
  status: TariffStatus;

  // Eligibility
  min_load_mw: number;
  max_load_mw?: number;
  voltage_level: 'Transmission' | 'Subtransmission' | 'Primary' | 'Secondary';

  // Demand Charges ($/kW-month)
  peak_demand_charge: number;
  off_peak_demand_charge?: number;
  transmission_demand_charge?: number;
  distribution_demand_charge?: number;
  facilities_charge?: number;

  // Energy Rates ($/kWh)
  energy_rate_peak: number;
  energy_rate_off_peak?: number;
  energy_rate_shoulder?: number;

  // Contract Terms
  initial_term_years: number;
  renewal_term_years?: number;
  termination_notice_months: number;
  exit_fee_description?: string;

  // Protections
  protections: TariffProtections;

  // Data Center Specific
  data_center_specific: boolean;
  dc_special_provisions?: string;

  // Metadata
  source_url?: string;
  source_document?: string;
  last_verified: string;
  notes?: string;
}

export interface ProposedTariff extends Omit<LargeLoadTariff, 'status'> {
  status: ProposedStatus;
  docket_number: string;
  filing_date: string;
  expected_decision_date?: string;
  regulatory_body: string;
  key_changes: string[];
  stakeholder_positions?: string;
}

export interface ISORequirement {
  id: string;
  iso: ISO_RTO;
  requirement_type: 'Interconnection' | 'Capacity' | 'Transmission' | 'Market Participation';
  name: string;
  description: string;
  threshold_mw?: number;
  timeline_days?: number;
  cost_range?: string;
  recent_changes?: string;
  ferc_order_2023_status?: string;
  effective_date: string;
  source_url?: string;
}

export interface ProtectionMechanism {
  id: string;
  name: string;
  category: ProtectionCategory;
  description: string;
  ratepayer_benefit: string;
  typical_implementation: string;
  e3_study_reference?: string;
  prevalence: 'Common' | 'Moderate' | 'Rare';
}

// =============================================================================
// PROTECTION MECHANISMS CATALOG
// =============================================================================

export const PROTECTION_MECHANISMS: ProtectionMechanism[] = [
  // Cost Recovery
  {
    id: 'min_demand',
    name: 'Minimum Demand Charges',
    category: 'Cost Recovery',
    description: 'Requires customers to pay for a minimum level of demand regardless of actual usage, typically 60-85% of contract demand.',
    ratepayer_benefit: 'Ensures fixed infrastructure costs are recovered even if large load operates below expectations, preventing cost shifts to other customers.',
    typical_implementation: '60-85% of contract demand for 10-20 year term',
    e3_study_reference: 'E3 Appendix A - AEP Ohio 85%, Georgia Power 95%',
    prevalence: 'Common'
  },
  {
    id: 'demand_ratchet',
    name: 'Demand Ratchet',
    category: 'Cost Recovery',
    description: 'Billing demand is the greater of current month demand or a percentage of the highest demand in previous months.',
    ratepayer_benefit: 'Protects against seasonal variations in large load usage while ensuring consistent revenue recovery.',
    typical_implementation: '75-95% of previous 11-month peak',
    e3_study_reference: 'E3 Appendix A - PSO 90%, Dominion 90%',
    prevalence: 'Common'
  },
  {
    id: 'ciac',
    name: 'CIAC Requirements',
    category: 'Cost Recovery',
    description: 'Contribution In Aid of Construction requires upfront payment for dedicated infrastructure.',
    ratepayer_benefit: 'Large load pays for infrastructure they exclusively use, preventing socialization of dedicated facilities.',
    typical_implementation: 'Full cost of substations, feeders, and local network upgrades',
    e3_study_reference: 'E3 Section 3.2 - Typical 60-95% CIAC recovery',
    prevalence: 'Common'
  },
  {
    id: 'network_upgrade',
    name: 'Network Upgrade Allocation',
    category: 'Cost Recovery',
    description: 'Allocation of network-level transmission upgrades required for interconnection.',
    ratepayer_benefit: 'Defines how system-wide upgrade costs are shared between new load and existing customers.',
    typical_implementation: 'Varies by ISO - PJM socializes, ERCOT allocates to load',
    e3_study_reference: 'E3 Section 4.1 - Deep Grid vs Shallow',
    prevalence: 'Common'
  },

  // Financial Security
  {
    id: 'credit_req',
    name: 'Credit/Creditworthiness Requirements',
    category: 'Financial Security',
    description: 'Minimum credit rating or financial metrics required for large load customers.',
    ratepayer_benefit: 'Reduces utility exposure to customer default, protecting rate base.',
    typical_implementation: 'Investment grade rating (BBB-/Baa3) or equivalent metrics',
    prevalence: 'Common'
  },
  {
    id: 'deposit',
    name: 'Security Deposit',
    category: 'Financial Security',
    description: 'Upfront deposit held by utility, typically based on estimated monthly bills.',
    ratepayer_benefit: 'Provides financial buffer against customer non-payment.',
    typical_implementation: '2-6 months estimated billing',
    prevalence: 'Common'
  },
  {
    id: 'loc',
    name: 'Letter of Credit',
    category: 'Financial Security',
    description: 'Bank-backed guarantee for payment obligations.',
    ratepayer_benefit: 'Third-party guarantee ensures payment even if customer faces financial difficulties.',
    typical_implementation: 'Standby LC covering 6-12 months billing',
    prevalence: 'Moderate'
  },
  {
    id: 'parent_guarantee',
    name: 'Parent Company Guarantee',
    category: 'Financial Security',
    description: 'Corporate parent guarantees subsidiary obligations.',
    ratepayer_benefit: 'Extends creditworthiness of large corporate parents to project-level entities.',
    typical_implementation: 'Full guarantee of contract obligations',
    prevalence: 'Moderate'
  },

  // Load Assurance
  {
    id: 'contract_term',
    name: 'Minimum Contract Term',
    category: 'Load Assurance',
    description: 'Required duration of service agreement.',
    ratepayer_benefit: 'Ensures infrastructure investments are recovered over adequate time period.',
    typical_implementation: '5-20 years, with 10-15 years most common for large DC',
    e3_study_reference: 'E3 Appendix A - AEP Ohio 12 years, NOVEC 20 years',
    prevalence: 'Common'
  },
  {
    id: 'take_or_pay',
    name: 'Take-or-Pay Obligations',
    category: 'Load Assurance',
    description: 'Customer commits to pay for minimum consumption regardless of actual usage.',
    ratepayer_benefit: 'Guarantees revenue stream to cover fixed infrastructure costs.',
    typical_implementation: '60-85% of contracted capacity',
    e3_study_reference: 'E3 Section 3.3 - Risk mitigation best practice',
    prevalence: 'Moderate'
  },
  {
    id: 'load_factor',
    name: 'Load Factor Requirements',
    category: 'Load Assurance',
    description: 'Minimum ratio of average to peak demand.',
    ratepayer_benefit: 'Ensures efficient use of capacity built for large load.',
    typical_implementation: 'Typically 50-80% after ramp-up period',
    prevalence: 'Moderate'
  },
  {
    id: 'ramp_schedule',
    name: 'Ramp-Up Schedule',
    category: 'Load Assurance',
    description: 'Phased increase in contracted demand over time.',
    ratepayer_benefit: 'Aligns infrastructure investment with actual load growth, reducing stranded asset risk.',
    typical_implementation: '3-5 year ramp to full contract demand',
    e3_study_reference: 'E3 Section 3.2 - Best practice for new build',
    prevalence: 'Common'
  },

  // Risk Allocation
  {
    id: 'fuel_adj',
    name: 'Fuel Adjustment Clause',
    category: 'Risk Allocation',
    description: 'Pass-through of fuel cost variations to customers.',
    ratepayer_benefit: 'Ensures utility recovers actual fuel costs without lag.',
    typical_implementation: 'Monthly or quarterly fuel cost adjustment',
    prevalence: 'Common'
  },
  {
    id: 'capacity_pass',
    name: 'Capacity Cost Pass-Through',
    category: 'Risk Allocation',
    description: 'Allocation of wholesale capacity market costs to customers.',
    ratepayer_benefit: 'Ensures capacity costs caused by load growth are borne by growing loads.',
    typical_implementation: 'Based on CP contribution (1CP, 4CP, 5CP)',
    e3_study_reference: 'E3 Section 2.3 - PJM capacity market impacts',
    prevalence: 'Common'
  },
  {
    id: 'curtailment',
    name: 'Curtailment Provisions',
    category: 'Risk Allocation',
    description: 'Utility right to curtail service under specified conditions.',
    ratepayer_benefit: 'Provides system reliability protection during emergencies.',
    typical_implementation: '2-4 hour notice for economic curtailment',
    prevalence: 'Common'
  },
  {
    id: 'force_majeure',
    name: 'Force Majeure',
    category: 'Risk Allocation',
    description: 'Provisions for unforeseeable circumstances affecting service.',
    ratepayer_benefit: 'Standard risk allocation for events beyond either party control.',
    typical_implementation: 'Standard contract force majeure language',
    prevalence: 'Common'
  },

  // Queue Management
  {
    id: 'queue_deposit',
    name: 'Interconnection Queue Deposit',
    category: 'Queue Management',
    description: 'Upfront deposit to reserve position in interconnection queue.',
    ratepayer_benefit: 'Ensures only serious projects occupy queue positions, reducing speculative requests.',
    typical_implementation: '$1,000-$10,000 per MW',
    e3_study_reference: 'FERC Order 2023 deposit requirements',
    prevalence: 'Common'
  },
  {
    id: 'milestones',
    name: 'Milestone Requirements',
    category: 'Queue Management',
    description: 'Required project development milestones to maintain queue position.',
    ratepayer_benefit: 'Removes stalled projects from queue, allowing viable projects to proceed.',
    typical_implementation: 'Site control, permits, equipment orders',
    e3_study_reference: 'FERC Order 2023 commercial readiness',
    prevalence: 'Common'
  },
  {
    id: 'study_cost',
    name: 'Study Cost Allocation',
    category: 'Queue Management',
    description: 'How interconnection study costs are allocated.',
    ratepayer_benefit: 'Ensures load pays for studies their project requires.',
    typical_implementation: 'Pro-rata share of cluster study costs',
    prevalence: 'Common'
  },
  {
    id: 'commercial_ready',
    name: 'Commercial Readiness Demonstration',
    category: 'Queue Management',
    description: 'Evidence that project can proceed to commercial operation.',
    ratepayer_benefit: 'Filters speculative projects, focuses utility resources on viable loads.',
    typical_implementation: 'Financing commitment, offtake agreements, site control',
    e3_study_reference: 'FERC Order 2023 readiness requirements',
    prevalence: 'Moderate'
  },

  // Flexibility Incentives
  {
    id: 'interruptible',
    name: 'Interruptible Rate Discounts',
    category: 'Flexibility Incentives',
    description: 'Reduced rates in exchange for curtailment during system peaks.',
    ratepayer_benefit: 'Provides system operator with demand response resource, reducing need for peaking capacity.',
    typical_implementation: '10-30% discount for 100-200 hours annual curtailment',
    e3_study_reference: 'E3 Section 4.2 - Flexibility incentives',
    prevalence: 'Common'
  },
  {
    id: 'tou_diff',
    name: 'TOU Rate Differentials',
    category: 'Flexibility Incentives',
    description: 'Significant price difference between peak and off-peak periods.',
    ratepayer_benefit: 'Encourages load shifting away from system peak, reducing capacity requirements.',
    typical_implementation: '2-5x price ratio peak to off-peak',
    e3_study_reference: 'E3 Section 4.2 - Rate design for flexibility',
    prevalence: 'Common'
  },
  {
    id: 'dr_credit',
    name: 'Demand Response Credits',
    category: 'Flexibility Incentives',
    description: 'Payment for participating in demand response programs.',
    ratepayer_benefit: 'Creates dispatchable demand resource, enhancing grid reliability.',
    typical_implementation: '$50-200/kW-year for committed curtailment',
    prevalence: 'Moderate'
  },
  {
    id: 'btm_credit',
    name: 'Behind-the-Meter Generation Credit',
    category: 'Flexibility Incentives',
    description: 'Credit for onsite generation that reduces grid draw during peaks.',
    ratepayer_benefit: 'Reduces transmission and distribution infrastructure requirements.',
    typical_implementation: 'Demand charge reduction for BTM capacity',
    e3_study_reference: 'E3 Section 4.3 - Dispatchable assets',
    prevalence: 'Rare'
  }
];

// =============================================================================
// CURRENT IOU TARIFFS
// =============================================================================

export const CURRENT_TARIFFS: LargeLoadTariff[] = [
  // PJM Region
  {
    id: 'aep-ohio-gs4',
    utility: 'AEP Ohio',
    utility_short: 'AEP Ohio',
    state: 'Ohio',
    region: 'Midwest',
    iso_rto: 'PJM',
    tariff_name: 'GS-4 Large General Service',
    rate_schedule: 'Schedule GS-4',
    effective_date: '2024-06-01',
    status: 'Active',
    min_load_mw: 1,
    voltage_level: 'Primary',
    peak_demand_charge: 6.50,
    off_peak_demand_charge: 2.00,
    transmission_demand_charge: 4.80,
    energy_rate_peak: 0.045,
    energy_rate_off_peak: 0.032,
    initial_term_years: 12,
    termination_notice_months: 24,
    exit_fee_description: 'Remaining contract value plus stranded asset recovery',
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 85,
      demand_ratchet: true,
      ratchet_pct: 85,
      ratchet_months: 12,
      ciac_required: true,
      ciac_description: 'Full cost of dedicated facilities',
      network_upgrade_allocation: true,
      credit_requirements: true,
      credit_rating_min: 'BBB-',
      deposit_required: true,
      deposit_months: 3,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 144,
      take_or_pay: true,
      take_or_pay_pct: 85,
      load_factor_requirement: false,
      ramp_schedule: true,
      ramp_schedule_months: 36,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 4,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 5000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 15,
      tou_differential: true,
      tou_peak_premium_pct: 40,
      demand_response_credit: true,
      behind_meter_credit: false
    },
    data_center_specific: true,
    dc_special_provisions: 'Data Center Rate Class under PUCO consideration',
    source_document: 'AEP Ohio Tariff Book, Schedule GS-4',
    last_verified: '2025-12-15',
    notes: 'Proposed new data center rate class with 85% minimum demand for 12 years'
  },
  {
    id: 'dominion-va-gs4',
    utility: 'Dominion Energy Virginia',
    utility_short: 'Dominion VA',
    state: 'Virginia',
    region: 'Mid-Atlantic',
    iso_rto: 'PJM',
    tariff_name: 'Schedule GS-4 Large General Service',
    rate_schedule: 'Schedule GS-4',
    effective_date: '2025-01-01',
    status: 'Active',
    min_load_mw: 0.5,
    voltage_level: 'Transmission',
    peak_demand_charge: 8.77,
    off_peak_demand_charge: 0.52,
    transmission_demand_charge: 5.20,
    energy_rate_peak: 0.027,
    energy_rate_off_peak: 0.018,
    initial_term_years: 10,
    termination_notice_months: 12,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 75,
      demand_ratchet: true,
      ratchet_pct: 90,
      ratchet_months: 11,
      ciac_required: true,
      ciac_description: 'Substations and direct facilities',
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 2,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 120,
      take_or_pay: false,
      load_factor_requirement: false,
      ramp_schedule: true,
      ramp_schedule_months: 48,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 2,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 4000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 20,
      tou_differential: true,
      tou_peak_premium_pct: 60,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: false,
    source_document: 'Dominion Virginia Tariff, effective 1/1/2025',
    last_verified: '2025-12-20',
    notes: 'Data center capital of the world - 70% of global internet traffic'
  },
  {
    id: 'pso-lpl',
    utility: 'Public Service Company of Oklahoma',
    utility_short: 'PSO',
    state: 'Oklahoma',
    region: 'Plains',
    iso_rto: 'SPP',
    tariff_name: 'Large Power & Light',
    rate_schedule: 'Schedule 242/244/246',
    effective_date: '2025-01-30',
    status: 'Active',
    min_load_mw: 1,
    voltage_level: 'Transmission',
    peak_demand_charge: 7.05,
    off_peak_demand_charge: 2.47,
    energy_rate_peak: 0.00171,
    energy_rate_off_peak: 0.00125,
    initial_term_years: 5,
    renewal_term_years: 1,
    termination_notice_months: 12,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 70,
      demand_ratchet: true,
      ratchet_pct: 90,
      ratchet_months: 11,
      ciac_required: true,
      ciac_description: 'Full local infrastructure within 30-36 months',
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 2,
      letter_of_credit: false,
      parent_guarantee: false,
      contract_min_term_months: 60,
      take_or_pay: false,
      load_factor_requirement: false,
      ramp_schedule: false,
      fuel_adjustment_clause: true,
      capacity_pass_through: false,
      curtailment_provisions: true,
      curtailment_notice_hours: 4,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 3000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: false,
      interruptible_discount: true,
      interruptible_discount_pct: 25,
      tou_differential: true,
      tou_peak_premium_pct: 45,
      demand_response_credit: false,
      behind_meter_credit: false
    },
    data_center_specific: false,
    source_document: 'PSO LPL Schedule 242/244/246, effective 1/30/2025',
    last_verified: '2026-01-15',
    notes: '6+ GW large load queue including hyperscale AI facilities'
  },
  {
    id: 'georgia-power-pll18',
    utility: 'Georgia Power',
    utility_short: 'Georgia Power',
    state: 'Georgia',
    region: 'Southeast',
    iso_rto: 'None',
    tariff_name: 'Power and Light Large',
    rate_schedule: 'Schedule PLL-18',
    effective_date: '2025-01-01',
    status: 'Active',
    min_load_mw: 0.5,
    voltage_level: 'Primary',
    peak_demand_charge: 13.27,
    energy_rate_peak: 0.0143,
    energy_rate_off_peak: 0.0095,
    initial_term_years: 10,
    termination_notice_months: 12,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 95,
      demand_ratchet: true,
      ratchet_pct: 95,
      ratchet_months: 12,
      ciac_required: true,
      ciac_description: 'Dedicated facilities and network upgrades',
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 3,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 120,
      take_or_pay: true,
      take_or_pay_pct: 90,
      load_factor_requirement: true,
      min_load_factor: 0.65,
      ramp_schedule: true,
      ramp_schedule_months: 36,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 2,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 4500,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 18,
      tou_differential: true,
      tou_peak_premium_pct: 50,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: false,
    source_document: 'Georgia Power PLL-18 Schedule, 2025',
    last_verified: '2025-12-10',
    notes: '51 GW in Georgia interconnection queue'
  },
  {
    id: 'duke-carolinas-lgs',
    utility: 'Duke Energy Carolinas',
    utility_short: 'Duke Carolinas',
    state: 'North Carolina',
    region: 'Southeast',
    iso_rto: 'None',
    tariff_name: 'Large General Service',
    rate_schedule: 'Schedule LGS',
    effective_date: '2024-09-01',
    status: 'Active',
    min_load_mw: 1,
    voltage_level: 'Primary',
    peak_demand_charge: 5.20,
    off_peak_demand_charge: 3.50,
    distribution_demand_charge: 2.80,
    energy_rate_peak: 0.035,
    energy_rate_off_peak: 0.028,
    initial_term_years: 5,
    termination_notice_months: 6,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 70,
      demand_ratchet: true,
      ratchet_pct: 70,
      ratchet_months: 12,
      ciac_required: true,
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 2,
      letter_of_credit: false,
      parent_guarantee: false,
      contract_min_term_months: 60,
      take_or_pay: false,
      load_factor_requirement: false,
      ramp_schedule: true,
      ramp_schedule_months: 24,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 4,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 3500,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: false,
      interruptible_discount: true,
      interruptible_discount_pct: 12,
      tou_differential: true,
      tou_peak_premium_pct: 25,
      demand_response_credit: true,
      behind_meter_credit: false
    },
    data_center_specific: false,
    source_document: 'Duke Energy Carolinas LGS Schedule',
    last_verified: '2025-11-20',
    notes: '42 GW in NC interconnection queue'
  },
  {
    id: 'nv-energy-lgs',
    utility: 'NV Energy',
    utility_short: 'NV Energy',
    state: 'Nevada',
    region: 'West',
    iso_rto: 'None',
    tariff_name: 'Large General Service',
    rate_schedule: 'Schedule LGS-1',
    effective_date: '2024-07-01',
    status: 'Active',
    min_load_mw: 1,
    voltage_level: 'Primary',
    peak_demand_charge: 8.50,
    off_peak_demand_charge: 4.20,
    energy_rate_peak: 0.055,
    energy_rate_off_peak: 0.035,
    initial_term_years: 10,
    termination_notice_months: 18,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 80,
      demand_ratchet: true,
      ratchet_pct: 85,
      ratchet_months: 12,
      ciac_required: true,
      ciac_description: 'Greenlink West transmission and local facilities',
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 3,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 120,
      take_or_pay: true,
      take_or_pay_pct: 75,
      load_factor_requirement: true,
      min_load_factor: 0.60,
      ramp_schedule: true,
      ramp_schedule_months: 48,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 4,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 6000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 22,
      tou_differential: true,
      tou_peak_premium_pct: 55,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: true,
    dc_special_provisions: 'Special contract for 4+ GW AI data center projects',
    source_document: 'NV Energy LGS-1, Nevada PUC filings',
    last_verified: '2025-12-01',
    notes: 'Data centers requesting to triple peak demand in Reno area'
  },
  {
    id: 'ercot-4cp',
    utility: 'ERCOT (Texas Grid)',
    utility_short: 'ERCOT',
    state: 'Texas',
    region: 'Texas',
    iso_rto: 'ERCOT',
    tariff_name: '4CP Transmission Allocation',
    rate_schedule: 'ERCOT Transmission Cost Allocation',
    effective_date: '2024-01-01',
    status: 'Active',
    min_load_mw: 1,
    voltage_level: 'Transmission',
    peak_demand_charge: 5.50,
    off_peak_demand_charge: 1.50,
    energy_rate_peak: 0.050,
    energy_rate_off_peak: 0.030,
    initial_term_years: 5,
    termination_notice_months: 6,
    protections: {
      minimum_demand_charge: false,
      demand_ratchet: false,
      ciac_required: true,
      ciac_description: '70% via CIAC for dedicated facilities',
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 2,
      letter_of_credit: true,
      parent_guarantee: false,
      contract_min_term_months: 60,
      take_or_pay: false,
      load_factor_requirement: false,
      ramp_schedule: false,
      fuel_adjustment_clause: false,
      capacity_pass_through: false,
      curtailment_provisions: true,
      curtailment_notice_hours: 1,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 5000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: false,
      tou_differential: true,
      tou_peak_premium_pct: 80,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: false,
    source_document: 'ERCOT 4CP Transmission Allocation Methodology',
    last_verified: '2025-12-15',
    notes: '200+ GW in ERCOT large load queue; 46% of load growth from data centers'
  },
  {
    id: 'novec-dc',
    utility: 'Northern Virginia Electric Cooperative',
    utility_short: 'NOVEC',
    state: 'Virginia',
    region: 'Mid-Atlantic',
    iso_rto: 'PJM',
    tariff_name: 'Data Center Rate',
    rate_schedule: 'Schedule DC',
    effective_date: '2024-01-01',
    status: 'Active',
    min_load_mw: 5,
    voltage_level: 'Transmission',
    peak_demand_charge: 12.50,
    off_peak_demand_charge: 6.80,
    transmission_demand_charge: 8.20,
    energy_rate_peak: 0.048,
    energy_rate_off_peak: 0.032,
    initial_term_years: 20,
    termination_notice_months: 36,
    exit_fee_description: 'Present value of remaining contract payments',
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 90,
      demand_ratchet: true,
      ratchet_pct: 95,
      ratchet_months: 12,
      ciac_required: true,
      ciac_description: 'Full dedicated infrastructure plus network share',
      network_upgrade_allocation: true,
      credit_requirements: true,
      credit_rating_min: 'BBB',
      deposit_required: true,
      deposit_months: 6,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 240,
      take_or_pay: true,
      take_or_pay_pct: 85,
      load_factor_requirement: true,
      min_load_factor: 0.75,
      ramp_schedule: true,
      ramp_schedule_months: 60,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 4,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 8000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 15,
      tou_differential: true,
      tou_peak_premium_pct: 45,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: true,
    dc_special_provisions: 'Dedicated data center tariff with 20-year term and 90% minimum demand',
    source_document: 'NOVEC Schedule DC',
    last_verified: '2025-12-20',
    notes: 'E3 case study - strongest ratepayer protections in industry'
  },
  {
    id: 'aps-e32',
    utility: 'Arizona Public Service',
    utility_short: 'APS',
    state: 'Arizona',
    region: 'Southwest',
    iso_rto: 'None',
    tariff_name: 'Large General Service TOU',
    rate_schedule: 'E-32',
    effective_date: '2024-06-01',
    status: 'Active',
    min_load_mw: 3,
    voltage_level: 'Primary',
    peak_demand_charge: 9.80,
    off_peak_demand_charge: 3.20,
    energy_rate_peak: 0.048,
    energy_rate_off_peak: 0.028,
    initial_term_years: 5,
    termination_notice_months: 12,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 75,
      demand_ratchet: true,
      ratchet_pct: 80,
      ratchet_months: 12,
      ciac_required: true,
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 2,
      letter_of_credit: true,
      parent_guarantee: false,
      contract_min_term_months: 60,
      take_or_pay: false,
      load_factor_requirement: false,
      ramp_schedule: true,
      ramp_schedule_months: 36,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 4,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 4000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: false,
      interruptible_discount: true,
      interruptible_discount_pct: 20,
      tou_differential: true,
      tou_peak_premium_pct: 70,
      demand_response_credit: true,
      behind_meter_credit: false
    },
    data_center_specific: false,
    source_document: 'APS E-32 Schedule',
    last_verified: '2025-11-15',
    notes: 'Projecting 40% peak demand growth to 13,000 MW by 2031'
  },
  {
    id: 'tva-gsa3',
    utility: 'Tennessee Valley Authority',
    utility_short: 'TVA',
    state: 'Tennessee',
    region: 'Southeast',
    iso_rto: 'None',
    tariff_name: 'General Service Rate',
    rate_schedule: 'GSA Part 3',
    effective_date: '2024-10-01',
    status: 'Active',
    min_load_mw: 1,
    voltage_level: 'Primary',
    peak_demand_charge: 5.34,
    transmission_demand_charge: 2.50,
    energy_rate_peak: 0.0245,
    energy_rate_off_peak: 0.0185,
    initial_term_years: 5,
    termination_notice_months: 12,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 60,
      demand_ratchet: false,
      ciac_required: true,
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 2,
      letter_of_credit: false,
      parent_guarantee: false,
      contract_min_term_months: 60,
      take_or_pay: false,
      load_factor_requirement: false,
      ramp_schedule: false,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 2,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 2500,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: false,
      interruptible_discount: true,
      interruptible_discount_pct: 15,
      tou_differential: true,
      tou_peak_premium_pct: 35,
      demand_response_credit: true,
      behind_meter_credit: false
    },
    data_center_specific: false,
    source_document: 'TVA GSA Rate Schedules',
    last_verified: '2025-12-01',
    notes: 'Federal power agency serving 153 local distributors'
  }
];

// =============================================================================
// PROPOSED TARIFFS TRACKER
// =============================================================================

export const PROPOSED_TARIFFS: ProposedTariff[] = [
  {
    id: 'aep-ohio-dc-class',
    utility: 'AEP Ohio',
    utility_short: 'AEP Ohio',
    state: 'Ohio',
    region: 'Midwest',
    iso_rto: 'PJM',
    tariff_name: 'Data Center Rate Class',
    rate_schedule: 'Proposed Schedule DC',
    effective_date: 'TBD',
    status: 'Under Review',
    docket_number: 'PUCO Case No. 24-0XXX',
    filing_date: '2024-08-15',
    expected_decision_date: '2025-Q2',
    regulatory_body: 'Public Utilities Commission of Ohio',
    key_changes: [
      '85% minimum demand charge for 12 years',
      'New data center rate classification',
      'Enhanced CIAC requirements',
      'Capacity market cost allocation reform'
    ],
    min_load_mw: 10,
    voltage_level: 'Transmission',
    peak_demand_charge: 7.20,
    energy_rate_peak: 0.048,
    initial_term_years: 12,
    termination_notice_months: 24,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 85,
      demand_ratchet: true,
      ratchet_pct: 85,
      ratchet_months: 12,
      ciac_required: true,
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 4,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 144,
      take_or_pay: true,
      take_or_pay_pct: 85,
      load_factor_requirement: true,
      min_load_factor: 0.70,
      ramp_schedule: true,
      ramp_schedule_months: 48,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 4,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 6000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 18,
      tou_differential: true,
      tou_peak_premium_pct: 50,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: true,
    source_document: 'AEP Ohio PUCO Filing',
    last_verified: '2026-01-15'
  },
  {
    id: 'georgia-power-dc',
    utility: 'Georgia Power',
    utility_short: 'Georgia Power',
    state: 'Georgia',
    region: 'Southeast',
    iso_rto: 'None',
    tariff_name: 'Large Load Interconnection Reform',
    rate_schedule: 'Proposed PLL-20',
    effective_date: 'TBD',
    status: 'Filed',
    docket_number: 'GA PSC Docket 2025-XXX',
    filing_date: '2025-01-10',
    expected_decision_date: '2025-Q3',
    regulatory_body: 'Georgia Public Service Commission',
    key_changes: [
      'Increased CIAC requirements for large loads',
      'Longer minimum contract terms',
      'Enhanced credit requirements',
      'Queue deposit reform'
    ],
    min_load_mw: 50,
    voltage_level: 'Transmission',
    peak_demand_charge: 14.50,
    energy_rate_peak: 0.015,
    initial_term_years: 15,
    termination_notice_months: 24,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 90,
      demand_ratchet: true,
      ratchet_pct: 90,
      ratchet_months: 12,
      ciac_required: true,
      ciac_description: 'Enhanced CIAC for 50MW+ loads',
      network_upgrade_allocation: true,
      credit_requirements: true,
      credit_rating_min: 'BBB+',
      deposit_required: true,
      deposit_months: 6,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 180,
      take_or_pay: true,
      take_or_pay_pct: 85,
      load_factor_requirement: true,
      min_load_factor: 0.70,
      ramp_schedule: true,
      ramp_schedule_months: 48,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 2,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 8000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 20,
      tou_differential: true,
      tou_peak_premium_pct: 55,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: true,
    source_document: 'Georgia Power PSC Filing 2025',
    last_verified: '2026-01-20'
  },
  {
    id: 'dominion-rider-dc',
    utility: 'Dominion Energy Virginia',
    utility_short: 'Dominion VA',
    state: 'Virginia',
    region: 'Mid-Atlantic',
    iso_rto: 'PJM',
    tariff_name: 'Rider DC - Data Center Service',
    rate_schedule: 'Proposed Rider DC',
    effective_date: 'TBD',
    status: 'Under Review',
    docket_number: 'VA SCC Case No. PUR-2024-XXXX',
    filing_date: '2024-11-01',
    expected_decision_date: '2025-Q2',
    regulatory_body: 'Virginia State Corporation Commission',
    key_changes: [
      'Dedicated rider for 10MW+ data centers',
      'Modified peak/off-peak differentials',
      'Enhanced demand response incentives',
      'Flexibility credits for grid services'
    ],
    min_load_mw: 10,
    voltage_level: 'Transmission',
    peak_demand_charge: 9.50,
    off_peak_demand_charge: 2.80,
    energy_rate_peak: 0.032,
    energy_rate_off_peak: 0.020,
    initial_term_years: 15,
    termination_notice_months: 24,
    protections: {
      minimum_demand_charge: true,
      minimum_demand_pct: 80,
      demand_ratchet: true,
      ratchet_pct: 85,
      ratchet_months: 12,
      ciac_required: true,
      network_upgrade_allocation: true,
      credit_requirements: true,
      deposit_required: true,
      deposit_months: 4,
      letter_of_credit: true,
      parent_guarantee: true,
      contract_min_term_months: 180,
      take_or_pay: true,
      take_or_pay_pct: 75,
      load_factor_requirement: true,
      min_load_factor: 0.80,
      ramp_schedule: true,
      ramp_schedule_months: 48,
      fuel_adjustment_clause: true,
      capacity_pass_through: true,
      curtailment_provisions: true,
      curtailment_notice_hours: 2,
      force_majeure: true,
      queue_deposit: true,
      queue_deposit_per_mw: 5000,
      milestone_requirements: true,
      study_cost_allocation: true,
      commercial_readiness: true,
      interruptible_discount: true,
      interruptible_discount_pct: 25,
      tou_differential: true,
      tou_peak_premium_pct: 65,
      demand_response_credit: true,
      behind_meter_credit: true
    },
    data_center_specific: true,
    dc_special_provisions: 'Enhanced flexibility incentives for grid services',
    source_document: 'Dominion SCC Filing',
    last_verified: '2026-01-10'
  }
];

// =============================================================================
// ISO/RTO REQUIREMENTS
// =============================================================================

export const ISO_REQUIREMENTS: ISORequirement[] = [
  // PJM
  {
    id: 'pjm-interconnection',
    iso: 'PJM',
    requirement_type: 'Interconnection',
    name: 'Large Load Interconnection Process',
    description: 'Cluster-based study process for loads 1MW+ requesting new service or upgrades',
    threshold_mw: 1,
    timeline_days: 450,
    cost_range: '$5,000-$10,000/MW deposit',
    recent_changes: 'FERC Order 2023 compliance - first-ready, first-served within clusters',
    ferc_order_2023_status: 'Compliant',
    effective_date: '2024-06-01',
    source_url: 'https://www.pjm.com/planning/services-requests/interconnection-queues'
  },
  {
    id: 'pjm-capacity',
    iso: 'PJM',
    requirement_type: 'Capacity',
    name: 'Capacity Performance Requirements',
    description: 'Loads may be subject to capacity obligations based on peak load contribution',
    threshold_mw: 1,
    cost_range: '$269.92/MW-day (2025/26 auction)',
    recent_changes: '2024 auction cleared at 10x prior year, attributed to data center growth',
    effective_date: '2024-07-01',
    source_url: 'https://www.pjm.com/markets-and-operations/rpm'
  },
  {
    id: 'pjm-transmission',
    iso: 'PJM',
    requirement_type: 'Transmission',
    name: 'Network Integration Transmission Service',
    description: 'Transmission service for native load customers',
    timeline_days: 60,
    cost_range: 'Varies by zone, $50-200/kW-year',
    effective_date: '2024-01-01',
    source_url: 'https://www.pjm.com/markets-and-operations/transmission-service'
  },

  // ERCOT
  {
    id: 'ercot-interconnection',
    iso: 'ERCOT',
    requirement_type: 'Interconnection',
    name: 'Large Load Interconnection Study',
    description: 'Studies for loads 10MW+ or transmission-level connections',
    threshold_mw: 10,
    timeline_days: 180,
    cost_range: '$3,000-$5,000/MW deposit',
    recent_changes: 'Large Flexible Load program created for 75MW+ interruptible loads',
    effective_date: '2024-01-01',
    source_url: 'https://www.ercot.com/gridinfo/planning'
  },
  {
    id: 'ercot-transmission',
    iso: 'ERCOT',
    requirement_type: 'Transmission',
    name: '4CP Transmission Cost Allocation',
    description: 'Transmission costs allocated based on contribution to 4 seasonal coincident peaks',
    cost_range: '$4-8/kW-month based on 4CP contribution',
    recent_changes: 'Growing emphasis on 4CP management for large loads',
    effective_date: '2024-01-01',
    source_url: 'https://www.ercot.com/services/rq/tcalloc'
  },
  {
    id: 'ercot-market',
    iso: 'ERCOT',
    requirement_type: 'Market Participation',
    name: 'Large Flexible Load Program',
    description: 'Program for 75MW+ loads willing to curtail during grid emergencies',
    threshold_mw: 75,
    cost_range: 'Reduced transmission costs, ancillary service revenue',
    recent_changes: 'Created 2024 to accommodate data center flexibility',
    effective_date: '2024-06-01',
    source_url: 'https://www.ercot.com/services/programs/load'
  },

  // MISO
  {
    id: 'miso-interconnection',
    iso: 'MISO',
    requirement_type: 'Interconnection',
    name: 'Load Modification Request',
    description: 'Process for new or modified loads impacting the transmission system',
    threshold_mw: 5,
    timeline_days: 270,
    cost_range: '$3,000-$5,000/MW deposit',
    ferc_order_2023_status: 'Implementation in progress',
    effective_date: '2024-01-01',
    source_url: 'https://www.misoenergy.org/planning/generator-interconnection/'
  },
  {
    id: 'miso-capacity',
    iso: 'MISO',
    requirement_type: 'Capacity',
    name: 'Resource Adequacy Requirements',
    description: 'Planning Reserve Margin requirements for load serving entities',
    cost_range: '$30/MW-day (Zone 4, 2024)',
    recent_changes: 'Capacity prices rising with retirements',
    effective_date: '2024-06-01',
    source_url: 'https://www.misoenergy.org/markets-and-operations/resource-adequacy/'
  },

  // CAISO
  {
    id: 'caiso-interconnection',
    iso: 'CAISO',
    requirement_type: 'Interconnection',
    name: 'Large Load Interconnection Procedures',
    description: 'Transmission-level load interconnection process',
    threshold_mw: 10,
    timeline_days: 365,
    cost_range: '$4,000-$8,000/MW deposit',
    ferc_order_2023_status: 'Compliant with modifications',
    effective_date: '2024-01-01',
    source_url: 'https://www.caiso.com/planning/Pages/GeneratorInterconnection/Default.aspx'
  },
  {
    id: 'caiso-ra',
    iso: 'CAISO',
    requirement_type: 'Capacity',
    name: 'Resource Adequacy Program',
    description: 'Must-offer obligations and resource adequacy requirements',
    cost_range: 'RA prices vary, $5-15/kW-month',
    recent_changes: 'Slice-of-day methodology implementation',
    effective_date: '2024-01-01',
    source_url: 'https://www.caiso.com/informed/Pages/StakeholderProcesses/ResourceAdequacy.aspx'
  },

  // SPP
  {
    id: 'spp-interconnection',
    iso: 'SPP',
    requirement_type: 'Interconnection',
    name: 'Generation Interconnection Process',
    description: 'Applies to loads requiring new transmission service',
    threshold_mw: 10,
    timeline_days: 270,
    cost_range: '$2,000-$4,000/MW deposit',
    ferc_order_2023_status: 'Implementation in progress',
    effective_date: '2024-01-01',
    source_url: 'https://spp.org/engineering/generator-interconnection/'
  },

  // NYISO
  {
    id: 'nyiso-interconnection',
    iso: 'NYISO',
    requirement_type: 'Interconnection',
    name: 'Large Facility Interconnection Procedures',
    description: 'Interconnection process for large loads in New York',
    threshold_mw: 10,
    timeline_days: 365,
    cost_range: '$5,000-$12,000/MW deposit',
    ferc_order_2023_status: 'Compliant',
    effective_date: '2024-01-01',
    source_url: 'https://www.nyiso.com/interconnections'
  },
  {
    id: 'nyiso-capacity',
    iso: 'NYISO',
    requirement_type: 'Capacity',
    name: 'ICAP Market Requirements',
    description: 'Installed Capacity market for resource adequacy',
    cost_range: '$180/MW-day (Zone J, 2024)',
    recent_changes: 'Demand curve adjustments, limited capacity zones',
    effective_date: '2024-05-01',
    source_url: 'https://www.nyiso.com/installed-capacity-market'
  },

  // ISO-NE
  {
    id: 'isone-interconnection',
    iso: 'ISO-NE',
    requirement_type: 'Interconnection',
    name: 'System Impact Study',
    description: 'Study process for loads impacting transmission system',
    threshold_mw: 5,
    timeline_days: 270,
    cost_range: '$3,000-$6,000/MW deposit',
    ferc_order_2023_status: 'Compliant',
    effective_date: '2024-01-01',
    source_url: 'https://www.iso-ne.com/system-planning/interconnection-service/'
  },
  {
    id: 'isone-capacity',
    iso: 'ISO-NE',
    requirement_type: 'Capacity',
    name: 'Forward Capacity Market',
    description: 'Three-year forward capacity auction',
    cost_range: '$150/MW-day (FCA 18)',
    recent_changes: 'Prompt capacity payments, MOPR reforms',
    effective_date: '2024-06-01',
    source_url: 'https://www.iso-ne.com/markets-operations/markets/forward-capacity-market'
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTariffById(id: string): LargeLoadTariff | ProposedTariff | undefined {
  return CURRENT_TARIFFS.find(t => t.id === id) || PROPOSED_TARIFFS.find(t => t.id === id);
}

export function getTariffsByState(state: string): LargeLoadTariff[] {
  return CURRENT_TARIFFS.filter(t => t.state.toLowerCase().includes(state.toLowerCase()));
}

export function getTariffsByISO(iso: ISO_RTO): LargeLoadTariff[] {
  return CURRENT_TARIFFS.filter(t => t.iso_rto === iso);
}

export function getTariffsByRegion(region: Region): LargeLoadTariff[] {
  return CURRENT_TARIFFS.filter(t => t.region === region);
}

export function getProtectionsByCategory(category: ProtectionCategory): ProtectionMechanism[] {
  return PROTECTION_MECHANISMS.filter(p => p.category === category);
}

export function getISORequirementsByISO(iso: ISO_RTO): ISORequirement[] {
  return ISO_REQUIREMENTS.filter(r => r.iso === iso);
}

export function hasProtection(tariff: LargeLoadTariff, protectionId: string): boolean {
  const protectionMap: Record<string, keyof TariffProtections> = {
    'min_demand': 'minimum_demand_charge',
    'demand_ratchet': 'demand_ratchet',
    'ciac': 'ciac_required',
    'network_upgrade': 'network_upgrade_allocation',
    'credit_req': 'credit_requirements',
    'deposit': 'deposit_required',
    'loc': 'letter_of_credit',
    'parent_guarantee': 'parent_guarantee',
    'contract_term': 'contract_min_term_months',
    'take_or_pay': 'take_or_pay',
    'load_factor': 'load_factor_requirement',
    'ramp_schedule': 'ramp_schedule',
    'fuel_adj': 'fuel_adjustment_clause',
    'capacity_pass': 'capacity_pass_through',
    'curtailment': 'curtailment_provisions',
    'force_majeure': 'force_majeure',
    'queue_deposit': 'queue_deposit',
    'milestones': 'milestone_requirements',
    'study_cost': 'study_cost_allocation',
    'commercial_ready': 'commercial_readiness',
    'interruptible': 'interruptible_discount',
    'tou_diff': 'tou_differential',
    'dr_credit': 'demand_response_credit',
    'btm_credit': 'behind_meter_credit'
  };

  const key = protectionMap[protectionId];
  if (!key) return false;

  const value = tariff.protections[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return false;
}

export function countProtections(tariff: LargeLoadTariff): number {
  return PROTECTION_MECHANISMS.filter(p => hasProtection(tariff, p.id)).length;
}

export function getProtectionStrength(tariff: LargeLoadTariff): 'Strong' | 'Moderate' | 'Weak' {
  const count = countProtections(tariff);
  if (count >= 18) return 'Strong';
  if (count >= 12) return 'Moderate';
  return 'Weak';
}
