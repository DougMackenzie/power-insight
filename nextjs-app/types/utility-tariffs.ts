/**
 * Canonical Tariff Types — Local Mirror for Power Insight Public
 *
 * Schema version: 1 (established 2026-05-14)
 *
 * Mirror of the canonical types at
 *   ~/Claude-Context/shared-data/energy-market/utility-tariffs/types.ts
 *
 * Mirrored locally because Vercel's build container only sees this repo —
 * cross-repo imports into ~/Claude-Context/ fail at `next build` time. The
 * canonical file itself documents this pattern: "mirror this structure in
 * their local types if cross-repo imports are awkward."
 *
 * Sync expectation: when the canonical file's CANONICAL_SCHEMA_VERSION bumps,
 * update this file to match. The Zod schema in lib/validation/tariffSchema.ts
 * is paired with these types and validates the literal schema_version.
 *
 * NO RUNTIME DEPENDENCIES — pure TypeScript types + literal constants.
 */

export const CANONICAL_SCHEMA_VERSION = 1 as const;

export const ISO_RTOS = [
    'PJM',
    'ERCOT',
    'MISO',
    'SPP',
    'CAISO',
    'NYISO',
    'ISO-NE',
] as const;

export const REGIONS = [
    'Northeast',
    'Mid-Atlantic',
    'Southeast',
    'Midwest',
    'Plains',
    'Mountain',
    'Southwest',
    'West',
    'Pacific Northwest',
] as const;

export const TARIFF_STATUS = [
    'Active',
    'Pending',
    'Withdrawn',
    'Superseded',
] as const;

export const VOLTAGE_LEVELS = [
    'Transmission',
    'Sub-transmission',
    'Primary',
    'Secondary',
    'Mixed',
] as const;

export const PROTECTION_RATINGS = ['High', 'Mid', 'Low'] as const;

export const FRESHNESS_STATUSES = [
    'rescraped-2026-q2',
    'rescraped-2026-q3',
    'rescraped-2026-q4',
    'rescraped-2027-q1',
    'pre-rescrape-baseline',
    'pi-investor-feb-2026',
    'pi-public-jan-2026',
] as const;

export const EXTRACTION_METHODS = [
    'openei',
    'hermes-pdf',
    'manual',
    'baseline-pi-public',
    'baseline-pi-investor',
    'merged',
] as const;

export const VERIFIERS = ['hermes', 'doug', 'gemini'] as const;

export type IsoRto = (typeof ISO_RTOS)[number];
export type Region = (typeof REGIONS)[number];
export type TariffStatus = (typeof TARIFF_STATUS)[number];
export type VoltageLevel = (typeof VOLTAGE_LEVELS)[number];
export type ProtectionRating = (typeof PROTECTION_RATINGS)[number];
export type FreshnessStatus = (typeof FRESHNESS_STATUSES)[number];
export type ExtractionMethod = (typeof EXTRACTION_METHODS)[number];
export type Verifier = (typeof VERIFIERS)[number];

export interface TariffProtections {
    ciac_required: boolean;
    take_or_pay: boolean;
    exit_fee: boolean;
    demand_ratchet: boolean;
    ratchet_pct: number | null;
    credit_requirements: boolean;
    collateral_required: boolean;

    minimum_demand_charge?: boolean;
    minimum_demand_pct?: number;
    network_upgrade_allocation?: boolean;
    deposit_required?: boolean;
    letter_of_credit?: boolean;
    parent_guarantee?: boolean;
    contract_min_term_months?: number;
    load_factor_requirement?: boolean;
    ramp_schedule?: boolean;
    fuel_adjustment_clause?: boolean;
    capacity_pass_through?: boolean;
    curtailment_provisions?: boolean;
    force_majeure?: boolean;
    queue_deposit?: boolean;
    milestone_requirements?: boolean;
    study_cost_allocation?: boolean;
    commercial_readiness?: boolean;
    interruptible_discount?: boolean;
    tou_differential?: boolean;
    demand_response_credit?: boolean;
    behind_meter_credit?: boolean;
}

export interface TariffRecord {
    id: string;
    eia_utility_id?: number;
    utility: string;
    utility_short: string;
    aliases: string[];
    state: string;
    region: Region;
    iso_rto: IsoRto | null;
    parent_holding_company?: string;

    tariff_name: string;
    rate_schedule: string;
    effective_date: string;
    status: TariffStatus;
    min_load_mw: number;
    voltage_level: VoltageLevel;

    peak_demand_charge_per_kw: number;
    off_peak_demand_charge_per_kw: number;
    energy_rate_peak_per_kwh: number;
    energy_rate_off_peak_per_kwh: number;
    fuel_adjustment_per_kwh: number;
    capacity_cost_per_mw_day?: number;

    initial_term_years: number;
    termination_notice_months: number;

    protections: TariffProtections;

    data_center_specific: boolean;
    dc_specific_provisions?: string;

    protection_score: number;
    protection_rating: ProtectionRating;
    blended_rate_per_kwh: number;
    annual_cost_m_at_500mw_85pct?: number;

    source_doc: string;
    source_url: string;
    page_ref?: string;
    docket_number?: string;

    effective_date_observed: string;
    scraped_at: string;
    last_verified: string;
    freshness_status: FreshnessStatus;
    extraction_method: ExtractionMethod;
    verified_by?: Verifier | null;

    schema_version: typeof CANONICAL_SCHEMA_VERSION;
    notes?: string;
}

export interface CanonicalTariffPool {
    schema_version: typeof CANONICAL_SCHEMA_VERSION;
    generated_at: string;
    record_count: number;
    tariffs: TariffRecord[];
}

export interface UtilityAliasEntry {
    id: string;
    eia_utility_id?: number;
    canonical_name: string;
    short_name: string;
    aliases: string[];
    state: string;
    iso_rto: IsoRto | null;
    region: Region;
    parent_holding_company?: string;
    notes?: string;
}

export interface UtilityAliasMap {
    schema_version: typeof CANONICAL_SCHEMA_VERSION;
    generated_at: string;
    entry_count: number;
    entries: UtilityAliasEntry[];
}

export const ANOMALY_THRESHOLDS = {
    energy_rate_min: 0.015,
    energy_rate_max: 0.2,
    demand_charge_min: 2,
    demand_charge_max: 30,
    max_age_years: 2,
    blended_jump_pct: 0.2,
    demand_jump_pct: 0.3,
} as const;
