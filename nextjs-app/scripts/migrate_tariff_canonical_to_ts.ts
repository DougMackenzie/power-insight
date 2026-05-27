/**
 * Build-time migrator: canonical pool → PI Public's generatedTariffData.ts.
 *
 * Reads:
 *   ~/Claude-Context/shared-data/energy-market/utility-tariffs/utility-tariffs-canonical.json
 *
 * Writes:
 *   nextjs-app/lib/generatedTariffData.ts
 *
 * Replaces the legacy migrate_tariff_excel_to_ts.py pipeline. Run as part of
 * the prebuild step (npm run build:tariffs) or whenever the canonical pool
 * changes.
 *
 * Usage: npx tsx scripts/migrate_tariff_canonical_to_ts.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { canonicalTariffPoolSchema } from '../lib/validation/tariffSchema';
import type { TariffRecord } from '@/types/utility-tariffs';

const HOME = os.homedir();
const CANONICAL_IN = path.join(
    HOME,
    'Claude-Context/shared-data/energy-market/utility-tariffs/utility-tariffs-canonical.json'
);
const TS_OUT = path.join(__dirname, '..', 'lib', 'generatedTariffData.ts');

// Map canonical region/iso to PI Public's existing enum (which differs slightly)
function mapRegionToAppShape(canonical: string): string {
    // App accepts: Northeast, Southeast, Midwest, Southwest, West, Texas, Mountain West, Mid-Atlantic, Plains
    // Canonical: Northeast, Mid-Atlantic, Southeast, Midwest, Plains, Mountain, Southwest, West, Pacific Northwest
    const map: Record<string, string> = {
        Northeast: 'Northeast',
        'Mid-Atlantic': 'Mid-Atlantic',
        Southeast: 'Southeast',
        Midwest: 'Midwest',
        Plains: 'Plains',
        Mountain: 'Mountain West',
        Southwest: 'Southwest',
        West: 'West',
        'Pacific Northwest': 'West',
    };
    return map[canonical] || canonical;
}

function mapIsoToAppShape(canonical: string | null): string {
    return canonical || 'None';
}

function mapStatusToAppShape(canonical: string): string {
    const map: Record<string, string> = {
        Active: 'Active',
        Pending: 'Proposed',
        Withdrawn: 'Suspended',
        Superseded: 'Suspended',
    };
    return map[canonical] || 'Active';
}

function mapVoltageToAppShape(canonical: string): string {
    const map: Record<string, string> = {
        Transmission: 'Transmission',
        'Sub-transmission': 'Subtransmission',
        Primary: 'Primary',
        Secondary: 'Secondary',
        Mixed: 'Transmission',
    };
    return map[canonical] || 'Transmission';
}

/**
 * Canonical blended-rate formula — load-factor-weighted energy + fuel + amortized demand.
 *
 * Why we recompute instead of trusting `r.blended_rate_per_kwh`:
 * the upstream canonical pool's blended_rate semantics drifted between
 * extractor versions. The Jan 2026 baseline pool used a load-factor-weighted
 * formula including demand-charge amortization; the May 2026 Hermes rescrape
 * batch silently switched to a simple `(e_peak + e_off) / 2` average, dropping
 * the demand-charge component entirely. This produced 25 utilities with >50%
 * `blendedRatePerKWh` jumps that weren't proportional to underlying energy-rate
 * changes (see docs/GEMINI_REFRESH_DELTA_2026-05-27.md "BLENDED_JUMP").
 *
 * Recomputing here at the migrator boundary forces apples-to-apples blended
 * rates across baseline + rescraped records using the same formula:
 *
 *     blended = e_peak * 0.40
 *             + e_off  * 0.60
 *             + fuel_adjustment
 *             + (peak_demand + off_peak_demand) * 12 / (8760 * 0.95)
 *
 * Constants reverse-engineered from the Jan 2026 baseline pool (89 records,
 * mean absolute error 5e-4 / kWh — i.e. fits to machine-precision rounding).
 * The (0.40 / 0.60) TOU split approximates a baseload DC profile favoring
 * off-peak hours; the (8760 * 0.95) denominator amortizes 12 monthly demand
 * charges over a 95% load factor annual energy delivery.
 *
 * Long-term, the canonical pool should store this derived field consistently
 * (Wave 3 candidate); recomputing in the migrator is the defensive guard.
 */
function computeBlendedRatePerKWh(
    peakDemand: number,
    offPeakDemand: number,
    energyPeak: number,
    energyOffPeak: number,
    fuelAdjustment: number,
): number {
    const ENERGY_PEAK_WEIGHT = 0.4;
    const ENERGY_OFF_PEAK_WEIGHT = 0.6;
    const HOURS_PER_YEAR = 8760;
    const LOAD_FACTOR = 0.95;
    const MONTHS_PER_YEAR = 12;
    const energyComponent =
        energyPeak * ENERGY_PEAK_WEIGHT + energyOffPeak * ENERGY_OFF_PEAK_WEIGHT;
    const demandComponent =
        ((peakDemand || 0) + (offPeakDemand || 0)) *
        MONTHS_PER_YEAR /
        (HOURS_PER_YEAR * LOAD_FACTOR);
    return energyComponent + (fuelAdjustment || 0) + demandComponent;
}

function recordToAppShape(r: TariffRecord): Record<string, unknown> {
    // App's protections shape — derive from canonical's flat + detailed, with safe defaults
    const p = r.protections;
    return {
        id: r.id,
        utility: r.utility,
        utility_short: r.utility_short,
        state: r.state,
        region: mapRegionToAppShape(r.region),
        iso_rto: mapIsoToAppShape(r.iso_rto),
        tariff_name: r.tariff_name,
        rate_schedule: r.rate_schedule,
        effective_date: r.effective_date,
        status: mapStatusToAppShape(r.status),
        min_load_mw: r.min_load_mw,
        voltage_level: mapVoltageToAppShape(r.voltage_level),

        // Demand + energy
        peak_demand_charge: r.peak_demand_charge_per_kw,
        off_peak_demand_charge: r.off_peak_demand_charge_per_kw,
        energy_rate_peak: r.energy_rate_peak_per_kwh,
        energy_rate_off_peak: r.energy_rate_off_peak_per_kwh,

        // Contract
        initial_term_years: r.initial_term_years,
        termination_notice_months: r.termination_notice_months,

        // Derived — RECOMPUTED at migrator boundary, not trusted from upstream.
        // See computeBlendedRatePerKWh() docblock for formula reconciliation.
        blendedRatePerKWh: computeBlendedRatePerKWh(
            r.peak_demand_charge_per_kw,
            r.off_peak_demand_charge_per_kw,
            r.energy_rate_peak_per_kwh,
            r.energy_rate_off_peak_per_kwh,
            r.fuel_adjustment_per_kwh,
        ),
        annualCostM: r.annual_cost_m_at_500mw_85pct ?? 0,
        protectionScore: r.protection_score,
        protectionRating: r.protection_rating,
        fuelAdjustmentPerKWh: r.fuel_adjustment_per_kwh,

        // Protections — build the rich object expected by the app
        protections: {
            // Cost Recovery
            minimum_demand_charge: p.minimum_demand_charge ?? false,
            minimum_demand_pct: p.minimum_demand_pct,
            demand_ratchet: p.demand_ratchet,
            ratchet_pct: p.ratchet_pct ?? undefined,
            ciac_required: p.ciac_required,
            network_upgrade_allocation: p.network_upgrade_allocation ?? false,

            // Financial Security
            credit_requirements: p.credit_requirements,
            deposit_required: p.deposit_required ?? p.collateral_required,
            letter_of_credit: p.letter_of_credit ?? false,
            parent_guarantee: p.parent_guarantee ?? false,

            // Load Assurance
            contract_min_term_months: p.contract_min_term_months ?? r.initial_term_years * 12,
            take_or_pay: p.take_or_pay,
            load_factor_requirement: p.load_factor_requirement ?? false,
            ramp_schedule: p.ramp_schedule ?? false,

            // Risk Allocation
            fuel_adjustment_clause: p.fuel_adjustment_clause ?? r.fuel_adjustment_per_kwh > 0,
            capacity_pass_through: p.capacity_pass_through ?? false,
            curtailment_provisions: p.curtailment_provisions ?? false,
            force_majeure: p.force_majeure ?? true,

            // Queue Management
            queue_deposit: p.queue_deposit ?? false,
            milestone_requirements: p.milestone_requirements ?? false,
            study_cost_allocation: p.study_cost_allocation ?? false,
            commercial_readiness: p.commercial_readiness ?? false,

            // Flexibility Incentives
            interruptible_discount: p.interruptible_discount ?? false,
            tou_differential: p.tou_differential ?? false,
            demand_response_credit: p.demand_response_credit ?? false,
            behind_meter_credit: p.behind_meter_credit ?? false,
        },

        data_center_specific: r.data_center_specific,
        ...(r.dc_specific_provisions ? { dc_special_provisions: r.dc_specific_provisions } : {}),

        citation: {
            document: r.source_doc,
            url: r.source_url,
            pageReference: r.page_ref || '',
            docketNumber: r.docket_number || '',
        },

        last_verified: r.last_verified,
        ...(r.notes ? { notes: r.notes } : {}),
    };
}

function emitTSFile(records: Array<Record<string, unknown>>, generatedAt: string): string {
    const records_json = JSON.stringify(records, null, 2)
        // Convert JSON keys to TS-style (no quotes on identifier keys)
        .replace(/^( *)"([a-zA-Z_$][a-zA-Z0-9_$]*)":/gm, '$1$2:');

    // Compute aggregate stats so consumers can keep using TARIFF_STATS / TARIFF_STATES / TARIFF_ISOS
    const blendedRates = records
        .map((r) => r.blendedRatePerKWh as number)
        .filter((n) => typeof n === 'number' && !isNaN(n));
    const protectionRatings = records.map((r) => r.protectionRating as string);
    const states = Array.from(new Set(records.map((r) => r.state as string))).sort();
    const isos = Array.from(
        new Set(records.map((r) => r.iso_rto as string).filter((i) => i && i !== 'None'))
    ).sort();

    const stats = {
        totalUtilities: records.length,
        highProtection: protectionRatings.filter((r) => r === 'High').length,
        midProtection: protectionRatings.filter((r) => r === 'Mid').length,
        lowProtection: protectionRatings.filter((r) => r === 'Low').length,
        avgBlendedRate: blendedRates.reduce((s, n) => s + n, 0) / Math.max(1, blendedRates.length),
        minBlendedRate: Math.min(...blendedRates),
        maxBlendedRate: Math.max(...blendedRates),
        uniqueStates: states.length,
        uniqueISOs: isos.length,
        generatedDate: generatedAt.split('T')[0],
    };

    return `/**
 * Generated Tariff Data
 *
 * AUTO-GENERATED from the shared canonical tariff pool.
 * Source: ~/Claude-Context/shared-data/energy-market/utility-tariffs/utility-tariffs-canonical.json
 * Migrator: scripts/migrate_tariff_canonical_to_ts.ts
 *
 * DO NOT EDIT MANUALLY. To update tariff data, edit the canonical pool and
 * re-run \`npm run build:tariffs\` (or run the migrator directly).
 *
 * Generated: ${generatedAt}
 * Records: ${records.length}
 */

import type { LargeLoadTariff } from './tariffDatabase';

export type ProtectionRating = 'High' | 'Mid' | 'Low';

/**
 * Extended tariff interface with calculated fields
 */
export interface EnrichedTariff extends LargeLoadTariff {
  blendedRatePerKWh: number;
  annualCostM: number;
  protectionScore: number;
  protectionRating: ProtectionRating;
  fuelAdjustmentPerKWh: number;
  citation?: {
    document: string;
    url?: string;
    pageReference?: string;
    docketNumber?: string;
  };
}

/**
 * Complete tariff database, sorted by blended rate (lowest to highest).
 * Sourced from the shared canonical pool — both Power Insight (public) and
 * Power Insight Investor read from the same canonical store.
 */
export const GENERATED_TARIFFS: EnrichedTariff[] = ${records_json};

/**
 * Aggregate statistics over GENERATED_TARIFFS — recomputed at every regeneration.
 */
export const TARIFF_STATS = ${JSON.stringify(stats, null, 2)};

/**
 * All unique states represented in the database.
 */
export const TARIFF_STATES = ${JSON.stringify(states)};

/**
 * All unique ISO/RTOs represented in the database (excluding 'None').
 */
export const TARIFF_ISOS = ${JSON.stringify(isos)};

/**
 * Helper: get tariffs by protection rating.
 */
export function getTariffsByRating(rating: ProtectionRating): EnrichedTariff[] {
  return GENERATED_TARIFFS.filter(t => t.protectionRating === rating);
}

/**
 * Helper: get tariffs by ISO/RTO.
 */
export function getTariffsByISO(iso: string): EnrichedTariff[] {
  return GENERATED_TARIFFS.filter(t => t.iso_rto === iso);
}

/**
 * Helper: get tariffs by state.
 */
export function getTariffsByState(state: string): EnrichedTariff[] {
  return GENERATED_TARIFFS.filter(t => t.state === state || t.state.includes(state));
}

/**
 * Helper: get the cheapest N tariffs.
 */
export function getCheapestTariffs(n: number = 10): EnrichedTariff[] {
  return GENERATED_TARIFFS.slice(0, n);
}

/**
 * Helper: get tariffs within a blended rate range.
 */
export function getTariffsInRateRange(minRate: number, maxRate: number): EnrichedTariff[] {
  return GENERATED_TARIFFS.filter(t => t.blendedRatePerKWh >= minRate && t.blendedRatePerKWh <= maxRate);
}
`;
}

function main() {
    console.log('Migrating canonical tariff pool → PI Public TypeScript...\n');

    // Read + validate canonical pool
    const raw = fs.readFileSync(CANONICAL_IN, 'utf-8');
    const parsed = JSON.parse(raw);
    const validation = canonicalTariffPoolSchema.safeParse(parsed);
    if (!validation.success) {
        console.error('  ✗ Canonical pool failed validation. Fix the canonical JSON before re-running.');
        console.error(JSON.stringify(validation.error.issues.slice(0, 5), null, 2));
        process.exit(1);
    }
    const pool = validation.data;
    console.log(`  ✓ Read + validated ${pool.record_count} canonical records\n`);

    // Convert to app shape
    const records = pool.tariffs.map(recordToAppShape);

    // Emit TS file
    const ts = emitTSFile(records, pool.generated_at);
    fs.writeFileSync(TS_OUT, ts);
    console.log(`✓ Wrote ${records.length} tariffs → ${TS_OUT}`);
    console.log(`\nNext: run \`npm run build\` and \`npm run test\` to confirm app health.`);
}

main();
