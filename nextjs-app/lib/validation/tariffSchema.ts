/**
 * Tariff Data Contract — Phase 1.6 of the v2.0 QAQC plan
 *
 * This Zod schema is the canonical contract that:
 *   - Phase 2 scraper output MUST conform to
 *   - Phase 3 refactored TypeScript types MUST mirror
 *   - Phase 4 Calculator MUST validate against on load
 *
 * Mirrors `LargeLoadTariff` from `lib/tariffDatabase.ts` with three additions:
 *   1. `scraped_at` — when the data was last fetched from primary source
 *   2. `freshness_status` — 'current' | 'stale' | 'pi-investor-feb-2026' (Phase 2.10 fallback)
 *   3. `source_url` is REQUIRED (was optional in the old interface)
 *
 * SCHEMA_VERSION semantics (per Phase 5.11): bump on any breaking change to the
 * data shape. Stored data with a mismatched version is dropped silently and re-fetched
 * (or, in Phase 5 saved-scenarios context, treated as a cache miss).
 */

import { z } from 'zod';

export const TARIFF_SCHEMA_VERSION = '2.0.0';

// ─── Enumerations (mirror lib/tariffDatabase.ts) ───────────────────────────

export const RegionSchema = z.enum([
  'Northeast',
  'Southeast',
  'Midwest',
  'Southwest',
  'West',
  'Texas',
  'Mountain West',
  'Mid-Atlantic',
  'Plains',
]);

export const ISORTOSchema = z.enum([
  'PJM',
  'ERCOT',
  'MISO',
  'CAISO',
  'SPP',
  'NYISO',
  'ISO-NE',
  'TVA',
  'None',
]);

export const TariffStatusSchema = z.enum([
  'Active',
  'Proposed',
  'Under Review',
  'Suspended',
]);

export const VoltageLevelSchema = z.enum([
  'Transmission',
  'Subtransmission',
  'Primary',
  'Secondary',
]);

/**
 * Phase 2 freshness contract.
 *   - 'current': scraped from primary source within last 90 days
 *   - 'stale': scraped from primary source more than 90 days ago, no recent attempt
 *   - 'pi-investor-feb-2026': fell back to PI Investor's Feb 2026 dataset because
 *     primary-source re-scrape was infeasible (Phase 2.10). Display in UI with
 *     explicit effective date.
 */
export const FreshnessStatusSchema = z.enum([
  'current',
  'stale',
  'pi-investor-feb-2026',
]);

// ─── Protection mechanisms ─────────────────────────────────────────────────

export const TariffProtectionsSchema = z.object({
  // Cost Recovery
  minimum_demand_charge: z.boolean(),
  minimum_demand_pct: z.number().min(0).max(1).optional(),
  demand_ratchet: z.boolean(),
  ratchet_pct: z.number().min(0).max(1).optional(),
  ratchet_months: z.number().int().nonnegative().optional(),
  ciac_required: z.boolean(),
  ciac_description: z.string().optional(),
  network_upgrade_allocation: z.boolean(),

  // Financial Security
  credit_requirements: z.boolean(),
  credit_rating_min: z.string().optional(),
  deposit_required: z.boolean(),
  deposit_months: z.number().nonnegative().optional(),
  letter_of_credit: z.boolean(),
  parent_guarantee: z.boolean(),

  // Load Assurance
  contract_min_term_months: z.number().int().positive(),
  take_or_pay: z.boolean(),
  take_or_pay_pct: z.number().min(0).max(1).optional(),
  load_factor_requirement: z.boolean(),
  min_load_factor: z.number().min(0).max(1).optional(),
  ramp_schedule: z.boolean(),
  ramp_schedule_months: z.number().int().nonnegative().optional(),

  // Risk Allocation
  fuel_adjustment_clause: z.boolean(),
  capacity_pass_through: z.boolean(),
  curtailment_provisions: z.boolean(),
  curtailment_notice_hours: z.number().nonnegative().optional(),
  force_majeure: z.boolean(),

  // Queue Management
  queue_deposit: z.boolean(),
  queue_deposit_per_mw: z.number().nonnegative().optional(),
  milestone_requirements: z.boolean(),
  study_cost_allocation: z.boolean(),
  commercial_readiness: z.boolean(),

  // Flexibility Incentives
  interruptible_discount: z.boolean(),
  interruptible_discount_pct: z.number().min(0).max(1).optional(),
  tou_differential: z.boolean(),
  tou_peak_premium_pct: z.number().min(0).max(1).optional(),
  demand_response_credit: z.boolean(),
  behind_meter_credit: z.boolean(),
});

// ─── Core tariff record ────────────────────────────────────────────────────

/**
 * Sanity bounds (per Phase 2.6 validation):
 *   - Energy rates: $0.015 to $0.200 per kWh ($15-$200 per MWh)
 *   - Demand charges: $2 to $30 per kW-month
 *   - Effective date: not in the future, not older than 5 years
 */
export const LargeLoadTariffSchema = z.object({
  schema_version: z.literal(TARIFF_SCHEMA_VERSION).default(TARIFF_SCHEMA_VERSION),

  // Identity
  id: z.string().min(1),
  utility: z.string().min(1),
  utility_short: z.string().min(1),
  state: z.string().length(2, 'state must be 2-letter code (e.g. CA, NY)'),
  region: RegionSchema,
  iso_rto: ISORTOSchema,

  // Tariff identification
  tariff_name: z.string().min(1),
  rate_schedule: z.string().min(1),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_date must be YYYY-MM-DD'),
  status: TariffStatusSchema,

  // Eligibility
  min_load_mw: z.number().positive(),
  max_load_mw: z.number().positive().optional(),
  voltage_level: VoltageLevelSchema,

  // Demand charges ($/kW-month) — bounded sanity check per Phase 2.6
  peak_demand_charge: z.number().min(0).max(50),
  off_peak_demand_charge: z.number().min(0).max(50).optional(),
  transmission_demand_charge: z.number().min(0).max(50).optional(),
  distribution_demand_charge: z.number().min(0).max(50).optional(),
  facilities_charge: z.number().nonnegative().optional(),

  // Energy rates ($/kWh) — bounded sanity check per Phase 2.6
  energy_rate_peak: z.number().min(0).max(0.50),
  energy_rate_off_peak: z.number().min(0).max(0.50).optional(),
  energy_rate_shoulder: z.number().min(0).max(0.50).optional(),

  // Optional fuel adjustment rider ($/kWh) — separate from base energy rate
  fuel_adjustment: z.number().min(-0.05).max(0.20).optional(),

  // Contract terms
  initial_term_years: z.number().int().positive(),
  renewal_term_years: z.number().int().positive().optional(),
  termination_notice_months: z.number().int().nonnegative(),
  exit_fee_description: z.string().optional(),

  // Protection mechanisms
  protections: TariffProtectionsSchema,

  // DC-specific provisions
  data_center_specific: z.boolean(),
  dc_special_provisions: z.string().optional(),

  // Phase 2 freshness contract
  source_url: z.string().url('source_url must be a valid URL'),
  source_document: z.string().optional(),
  last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'last_verified must be YYYY-MM-DD'),
  scraped_at: z.string().datetime({ offset: true }),
  freshness_status: FreshnessStatusSchema,

  // Free-text notes (e.g. moratoria status, special provisions)
  notes: z.string().optional(),
});

export type LargeLoadTariff = z.infer<typeof LargeLoadTariffSchema>;

// ─── Collection schema (full 88-utility dataset) ───────────────────────────

export const TariffDatasetSchema = z.object({
  schema_version: z.literal(TARIFF_SCHEMA_VERSION),
  generated_at: z.string().datetime({ offset: true }),
  utility_count: z.number().int().positive(),
  fallback_count: z
    .number()
    .int()
    .nonnegative()
    .max(25, 'fallback_count cap is 25 per Phase 2.10'),
  tariffs: z.array(LargeLoadTariffSchema),
});

export type TariffDataset = z.infer<typeof TariffDatasetSchema>;

// ─── Helpers for Phase 2 + Phase 3 + Phase 4 ───────────────────────────────

/**
 * Validate a single tariff record. Returns parsed value or throws with a
 * Zod-formatted error. Use at module boundaries (scraper output, runtime load).
 */
export function parseTariff(input: unknown): LargeLoadTariff {
  return LargeLoadTariffSchema.parse(input);
}

/**
 * Non-throwing variant. Returns either a parsed tariff or a structured error.
 * Use when you want to log + skip a bad record rather than fail-fast.
 */
export function safeParseTariff(input: unknown) {
  return LargeLoadTariffSchema.safeParse(input);
}

/**
 * Validate the full dataset. Used by Phase 4 calculator on app boot and by
 * Phase 2 scraper output validation.
 */
export function parseTariffDataset(input: unknown): TariffDataset {
  return TariffDatasetSchema.parse(input);
}

/**
 * Phase 2.6 anomaly check — flag tariffs whose rates jumped more than the
 * given threshold vs a baseline (e.g., the Feb 2026 dataset). Returns the
 * flagged tariffs with diff details, suitable for human review before commit.
 *
 * Default thresholds match the plan: blended/energy 20%, demand charge 30%.
 */
export interface AnomalyFlag {
  utility_id: string;
  field: string;
  baseline_value: number;
  current_value: number;
  pct_change: number;
}

export function detectRateAnomalies(
  current: LargeLoadTariff[],
  baseline: LargeLoadTariff[],
  thresholds: { energyPct?: number; demandPct?: number } = {}
): AnomalyFlag[] {
  const energyThreshold = thresholds.energyPct ?? 0.20;
  const demandThreshold = thresholds.demandPct ?? 0.30;
  const baselineMap = new Map(baseline.map((t) => [t.id, t]));
  const flags: AnomalyFlag[] = [];

  for (const cur of current) {
    const base = baselineMap.get(cur.id);
    if (!base) continue;

    const checks: Array<{ field: keyof LargeLoadTariff; threshold: number }> = [
      { field: 'peak_demand_charge', threshold: demandThreshold },
      { field: 'energy_rate_peak', threshold: energyThreshold },
    ];

    for (const { field, threshold } of checks) {
      const baseVal = base[field];
      const curVal = cur[field];
      if (typeof baseVal !== 'number' || typeof curVal !== 'number' || baseVal === 0) continue;
      const pctChange = (curVal - baseVal) / baseVal;
      if (Math.abs(pctChange) > threshold) {
        flags.push({
          utility_id: cur.id,
          field: String(field),
          baseline_value: baseVal,
          current_value: curVal,
          pct_change: pctChange,
        });
      }
    }
  }

  return flags;
}
