/**
 * One-shot seed script: build the canonical tariff pool from PI Public + PI Investor.
 *
 * Reads:
 *   - power-insight/nextjs-app/lib/generatedTariffData.ts (86 utilities, PI Public)
 *   - power-insight-investor/lib/data/tariffs-expanded.json (90 utilities, PI Investor)
 *
 * Writes:
 *   - ~/Claude-Context/shared-data/energy-market/utility-tariffs/utility-id-aliases.json
 *   - ~/Claude-Context/shared-data/energy-market/utility-tariffs/utility-tariffs-canonical.json
 *
 * Usage: npx tsx scripts/seed-canonical-tariff-pool.ts
 *
 * This is Phase 2.1 + 2.2 of the QAQC plan. After this runs, both apps
 * can be refactored (Phase 2.11) to read from the canonical pool.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { GENERATED_TARIFFS } from '../lib/generatedTariffData';
import type { EnrichedTariff } from '../lib/generatedTariffData';
import {
    CANONICAL_SCHEMA_VERSION,
    type CanonicalTariffPool,
    type IsoRto,
    type Region,
    type TariffRecord,
    type UtilityAliasEntry,
    type UtilityAliasMap,
    type VoltageLevel,
} from '@/types/utility-tariffs';
import {
    canonicalTariffPoolSchema,
    utilityAliasMapSchema,
} from '../lib/validation/tariffSchema';

// =============================================================================
// PI Investor record shape (subset — matches tariffs-expanded.json)
// =============================================================================

interface PIInvestorRecord {
    rank: number;
    utility: string;
    state: string;
    region: string;
    iso_rto: string | null;
    peakDemand: number;
    offPeakDemand: number;
    energyPeak: number;
    energyOffPeak: number;
    fuelAdj: number;
    blendedRate: number;
    annualCostM: number;
    protectionRating: 'High' | 'Mid' | 'Low';
    status: string;
    minLoadMW: number;
    ratchetPct: number;
    contractYears: number;
    ciac: boolean;
    takeOrPay: boolean;
    exitFee: boolean;
    demandRatchet: boolean;
    creditReq: boolean;
    dcSpecific: boolean;
    collateral: boolean;
    protectionScore: number;
    sourceDoc: string;
    sourceUrl: string;
    pageRef: string;
    docketNumber: string;
    capacityCostPerMwDay: number;
    allInBlendedRate: number;
    allInAnnualCostM: number;
}

// =============================================================================
// Paths
// =============================================================================

const HOME = os.homedir();
const PI_INVESTOR_TARIFFS_PATH = path.join(
    HOME,
    'Code Development/projects/power-insight-investor/lib/data/tariffs-expanded.json'
);
const SHARED_DIR = path.join(
    HOME,
    'Claude-Context/shared-data/energy-market/utility-tariffs'
);
const ALIASES_OUT = path.join(SHARED_DIR, 'utility-id-aliases.json');
const CANONICAL_OUT = path.join(SHARED_DIR, 'utility-tariffs-canonical.json');

// =============================================================================
// Region normalization (PI Investor uses some labels not in canonical enum)
// =============================================================================

const REGION_MAP: Record<string, Region> = {
    Northeast: 'Northeast',
    'Mid-Atlantic': 'Mid-Atlantic',
    Southeast: 'Southeast',
    Midwest: 'Midwest',
    Plains: 'Plains',
    Mountain: 'Mountain',
    Southwest: 'Southwest',
    West: 'West',
    'Pacific Northwest': 'Pacific Northwest',
    // PI Investor variants
    'New England': 'Northeast',
    Pacific: 'West',
    // PI Public variants
    'Mountain West': 'Mountain',
    Texas: 'Southwest',
};

function normalizeRegion(r: string): Region {
    const mapped = REGION_MAP[r];
    if (!mapped) {
        console.warn(`  WARN: Unknown region "${r}" — defaulting to Midwest`);
        return 'Midwest';
    }
    return mapped;
}

const ISO_RTO_MAP: Record<string, IsoRto | null> = {
    PJM: 'PJM',
    ERCOT: 'ERCOT',
    MISO: 'MISO',
    SPP: 'SPP',
    CAISO: 'CAISO',
    NYISO: 'NYISO',
    'ISO-NE': 'ISO-NE',
    ISONE: 'ISO-NE',
    None: null,
    NONE: null,
    '': null,
};

function normalizeIsoRto(s: string | null | undefined): IsoRto | null {
    if (!s) return null;
    const mapped = ISO_RTO_MAP[s];
    return mapped !== undefined ? mapped : null;
}

const VOLTAGE_MAP: Record<string, VoltageLevel> = {
    Transmission: 'Transmission',
    'Sub-transmission': 'Sub-transmission',
    Subtransmission: 'Sub-transmission',
    Primary: 'Primary',
    Secondary: 'Secondary',
    Mixed: 'Mixed',
    '': 'Transmission', // default for large-load DCs
};

function normalizeVoltage(v: string | undefined): VoltageLevel {
    if (!v) return 'Transmission';
    return VOLTAGE_MAP[v] || 'Transmission';
}

function normalizeStatus(s: string | undefined): 'Active' | 'Pending' | 'Withdrawn' | 'Superseded' {
    if (!s) return 'Active';
    const map: Record<string, 'Active' | 'Pending' | 'Withdrawn' | 'Superseded'> = {
        Active: 'Active',
        Pending: 'Pending',
        Proposed: 'Pending',
        'Under Review': 'Pending',
        Suspended: 'Withdrawn',
        Withdrawn: 'Withdrawn',
        Superseded: 'Superseded',
    };
    return map[s] || 'Active';
}

function normalizeDate(d: string | undefined, fallback = '2026-01-01'): string {
    if (!d) return fallback;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    // Common variants
    const m = d.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    // 'TBD' and similar fall back
    return fallback;
}

// =============================================================================
// Utility name normalization → canonical ID
// =============================================================================

/**
 * Slugify a utility name into a stable lowercase-hyphenated form.
 * Strips parenthetical short codes, ampersands, common stopwords.
 */
function slugify(name: string, state: string): string {
    const cleaned = name
        .replace(/\([^)]*\)/g, '') // remove parentheticals
        .replace(/&/g, 'and')
        .replace(/[^a-zA-Z0-9 -]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const stateSuffix = state.toLowerCase().replace(/[^a-z]/g, '').slice(0, 2);
    return `${cleaned}-${stateSuffix}`;
}

/**
 * Heuristic match: do these two utility names refer to the same entity?
 *
 * Strategy:
 *   1. Normalize to lowercase, strip punctuation, normalize whitespace
 *   2. Compare normalized forms directly
 *   3. Compare with state context (same state + significant token overlap)
 *   4. Fall back to fuzzy substring match
 */
function nameKey(s: string): string {
    return s
        .toLowerCase()
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(s: string): Set<string> {
    const stopwords = new Set([
        'company',
        'co',
        'corporation',
        'corp',
        'inc',
        'llc',
        'public',
        'service',
        'electric',
        'energy',
        'power',
        'and',
        'of',
        'the',
        'utilities',
        'utility',
        'gas',
    ]);
    return new Set(
        nameKey(s)
            .split(' ')
            .filter((t) => t.length > 1 && !stopwords.has(t))
    );
}

function jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let inter = 0;
    for (const t of a) {
        if (b.has(t)) inter++;
    }
    return inter / (a.size + b.size - inter);
}

function namesMatch(
    a: { name: string; state: string },
    b: { name: string; state: string }
): boolean {
    if (nameKey(a.name) === nameKey(b.name)) return true;
    // Same state + high token overlap
    if (a.state.includes(b.state) || b.state.includes(a.state)) {
        const sim = jaccard(tokenize(a.name), tokenize(b.name));
        if (sim >= 0.5) return true;
    }
    return false;
}

// =============================================================================
// Build alias map
// =============================================================================

interface RawEntry {
    name: string;
    short: string;
    state: string;
    iso_rto: IsoRto | null;
    region: Region;
    source: 'pi-public' | 'pi-investor';
    piPublicData?: EnrichedTariff;
    piInvestorData?: PIInvestorRecord;
}

function buildAliasMap(
    piPublic: EnrichedTariff[],
    piInvestor: PIInvestorRecord[]
): { aliases: UtilityAliasMap; merged: RawEntry[] } {
    const merged: RawEntry[] = [];

    // Start with PI Public records
    for (const r of piPublic) {
        merged.push({
            name: r.utility,
            short: r.utility_short || r.utility,
            state: r.state,
            iso_rto: normalizeIsoRto(r.iso_rto),
            region: normalizeRegion(r.region as string),
            source: 'pi-public',
            piPublicData: r,
        });
    }

    // Merge PI Investor records: match against PI Public, add new entries if no match
    for (const r of piInvestor) {
        const match = merged.find((e) =>
            namesMatch({ name: e.name, state: e.state }, { name: r.utility, state: r.state })
        );
        if (match) {
            match.piInvestorData = r;
        } else {
            merged.push({
                name: r.utility,
                short: r.utility.length > 24 ? r.utility.slice(0, 24) : r.utility,
                state: r.state,
                iso_rto: normalizeIsoRto(r.iso_rto),
                region: normalizeRegion(r.region),
                source: 'pi-investor',
                piInvestorData: r,
            });
        }
    }

    // Build alias entries
    const entries: UtilityAliasEntry[] = merged.map((e) => {
        const aliases = new Set<string>();
        aliases.add(e.name);
        aliases.add(e.short);
        if (e.piPublicData) {
            aliases.add(e.piPublicData.utility);
            if (e.piPublicData.utility_short) aliases.add(e.piPublicData.utility_short);
        }
        if (e.piInvestorData) {
            aliases.add(e.piInvestorData.utility);
        }
        return {
            id: slugify(e.name, e.state),
            canonical_name: e.piPublicData?.utility || e.name,
            short_name: e.short,
            aliases: Array.from(aliases).filter((a) => a && a.trim().length > 0),
            state: e.state,
            iso_rto: e.iso_rto,
            region: e.region,
        };
    });

    // De-dup by ID (in case slugify collides)
    const byId = new Map<string, UtilityAliasEntry>();
    for (const entry of entries) {
        if (byId.has(entry.id)) {
            // Merge aliases; prefer PI Public canonical name
            const existing = byId.get(entry.id)!;
            existing.aliases = Array.from(new Set([...existing.aliases, ...entry.aliases]));
        } else {
            byId.set(entry.id, entry);
        }
    }

    const dedupedEntries = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));

    const aliases: UtilityAliasMap = {
        schema_version: CANONICAL_SCHEMA_VERSION,
        generated_at: new Date().toISOString(),
        entry_count: dedupedEntries.length,
        entries: dedupedEntries,
    };

    return { aliases, merged };
}

// =============================================================================
// Build canonical tariff records from merged data
// =============================================================================

function blendedFromPIPublic(t: EnrichedTariff): number {
    return t.blendedRatePerKWh ?? 0;
}

function piPublicToCanonical(
    t: EnrichedTariff,
    aliases: UtilityAliasEntry,
    piInvestor?: PIInvestorRecord
): TariffRecord {
    const protections = {
        // Flat flags (use PI Investor where available, else derive from PI Public)
        ciac_required:
            piInvestor?.ciac ?? t.protections?.ciac_required ?? false,
        take_or_pay:
            piInvestor?.takeOrPay ?? t.protections?.take_or_pay ?? false,
        exit_fee:
            piInvestor?.exitFee ?? t.protections?.fuel_adjustment_clause ?? false,
        demand_ratchet:
            piInvestor?.demandRatchet ?? t.protections?.demand_ratchet ?? false,
        ratchet_pct:
            piInvestor?.ratchetPct ?? t.protections?.ratchet_pct ?? null,
        credit_requirements:
            piInvestor?.creditReq ?? t.protections?.credit_requirements ?? false,
        collateral_required:
            piInvestor?.collateral ?? t.protections?.deposit_required ?? false,
        // Detailed flags from PI Public
        ...(t.protections
            ? {
                  minimum_demand_charge: t.protections.minimum_demand_charge,
                  minimum_demand_pct: t.protections.minimum_demand_pct,
                  network_upgrade_allocation:
                      t.protections.network_upgrade_allocation,
                  deposit_required: t.protections.deposit_required,
                  letter_of_credit: t.protections.letter_of_credit,
                  parent_guarantee: t.protections.parent_guarantee,
                  contract_min_term_months:
                      t.protections.contract_min_term_months,
                  load_factor_requirement: t.protections.load_factor_requirement,
                  ramp_schedule: t.protections.ramp_schedule,
                  fuel_adjustment_clause: t.protections.fuel_adjustment_clause,
                  capacity_pass_through: t.protections.capacity_pass_through,
                  curtailment_provisions: t.protections.curtailment_provisions,
                  force_majeure: t.protections.force_majeure,
                  queue_deposit: t.protections.queue_deposit,
                  milestone_requirements: t.protections.milestone_requirements,
                  study_cost_allocation: t.protections.study_cost_allocation,
                  commercial_readiness: t.protections.commercial_readiness,
                  interruptible_discount: t.protections.interruptible_discount,
                  tou_differential: t.protections.tou_differential,
                  demand_response_credit: t.protections.demand_response_credit,
                  behind_meter_credit: t.protections.behind_meter_credit,
              }
            : {}),
    };

    const lastVerified =
        t.last_verified || piInvestor?.sourceUrl ? '2026-01-31' : '2026-01-31';

    return {
        id: aliases.id,
        utility: aliases.canonical_name,
        utility_short: aliases.short_name,
        aliases: aliases.aliases,
        state: aliases.state,
        region: aliases.region,
        iso_rto: aliases.iso_rto,

        tariff_name: t.tariff_name || piInvestor?.sourceDoc || 'General Service',
        rate_schedule: t.rate_schedule || 'See source',
        effective_date: normalizeDate(t.effective_date),
        status: normalizeStatus(t.status as string),
        min_load_mw: t.min_load_mw ?? piInvestor?.minLoadMW ?? 1,
        voltage_level: normalizeVoltage(t.voltage_level),

        peak_demand_charge_per_kw: t.peak_demand_charge ?? piInvestor?.peakDemand ?? 0,
        off_peak_demand_charge_per_kw:
            t.off_peak_demand_charge ?? piInvestor?.offPeakDemand ?? 0,
        energy_rate_peak_per_kwh: t.energy_rate_peak ?? piInvestor?.energyPeak ?? 0,
        energy_rate_off_peak_per_kwh:
            t.energy_rate_off_peak ?? piInvestor?.energyOffPeak ?? 0,
        fuel_adjustment_per_kwh:
            t.fuelAdjustmentPerKWh ?? piInvestor?.fuelAdj ?? 0,
        capacity_cost_per_mw_day: piInvestor?.capacityCostPerMwDay ?? 0,

        initial_term_years:
            t.initial_term_years ?? piInvestor?.contractYears ?? 0,
        termination_notice_months: t.termination_notice_months ?? 12,

        protections,

        data_center_specific:
            t.data_center_specific ?? piInvestor?.dcSpecific ?? false,

        protection_score: piInvestor?.protectionScore ?? t.protectionScore ?? 0,
        protection_rating:
            (piInvestor?.protectionRating as 'High' | 'Mid' | 'Low') ||
            t.protectionRating ||
            'Low',
        blended_rate_per_kwh: blendedFromPIPublic(t),
        annual_cost_m_at_500mw_85pct:
            piInvestor?.allInAnnualCostM ?? piInvestor?.annualCostM ?? t.annualCostM,

        source_doc: t.citation?.document || piInvestor?.sourceDoc || 'Baseline import',
        source_url: t.citation?.url || piInvestor?.sourceUrl || '',
        page_ref: t.citation?.pageReference || piInvestor?.pageRef || undefined,
        docket_number:
            t.citation?.docketNumber || piInvestor?.docketNumber || undefined,

        effective_date_observed: normalizeDate(t.effective_date),
        scraped_at: new Date().toISOString(),
        last_verified: normalizeDate(lastVerified),
        freshness_status: piInvestor ? 'pi-investor-feb-2026' : 'pi-public-jan-2026',
        extraction_method: piInvestor ? 'merged' : 'baseline-pi-public',
        verified_by: null,

        schema_version: CANONICAL_SCHEMA_VERSION,
        notes: t.notes || undefined,
    };
}

function piInvestorOnlyToCanonical(
    r: PIInvestorRecord,
    aliases: UtilityAliasEntry
): TariffRecord {
    return {
        id: aliases.id,
        utility: aliases.canonical_name,
        utility_short: aliases.short_name,
        aliases: aliases.aliases,
        state: aliases.state,
        region: aliases.region,
        iso_rto: aliases.iso_rto,

        tariff_name: r.sourceDoc || 'Industrial Service',
        rate_schedule: r.pageRef || 'See source',
        effective_date: '2026-02-01', // PI Investor data was Feb 2026
        status: normalizeStatus(r.status),
        min_load_mw: r.minLoadMW,
        voltage_level: 'Transmission',

        peak_demand_charge_per_kw: r.peakDemand,
        off_peak_demand_charge_per_kw: r.offPeakDemand,
        energy_rate_peak_per_kwh: r.energyPeak,
        energy_rate_off_peak_per_kwh: r.energyOffPeak,
        fuel_adjustment_per_kwh: r.fuelAdj,
        capacity_cost_per_mw_day: r.capacityCostPerMwDay,

        initial_term_years: r.contractYears,
        termination_notice_months: 12,

        protections: {
            ciac_required: r.ciac,
            take_or_pay: r.takeOrPay,
            exit_fee: r.exitFee,
            demand_ratchet: r.demandRatchet,
            ratchet_pct: r.ratchetPct,
            credit_requirements: r.creditReq,
            collateral_required: r.collateral,
        },

        data_center_specific: r.dcSpecific,

        protection_score: r.protectionScore,
        protection_rating: r.protectionRating,
        blended_rate_per_kwh: r.blendedRate,
        annual_cost_m_at_500mw_85pct: r.allInAnnualCostM || r.annualCostM,

        source_doc: r.sourceDoc,
        source_url: r.sourceUrl,
        page_ref: r.pageRef || undefined,
        docket_number: r.docketNumber || undefined,

        effective_date_observed: '2026-02-01',
        scraped_at: new Date().toISOString(),
        last_verified: '2026-02-01',
        freshness_status: 'pi-investor-feb-2026',
        extraction_method: 'baseline-pi-investor',
        verified_by: null,

        schema_version: CANONICAL_SCHEMA_VERSION,
    };
}

// =============================================================================
// Main
// =============================================================================

function main() {
    console.log('Seeding canonical tariff pool...\n');

    // Read PI Investor
    const piInvestorRaw = fs.readFileSync(PI_INVESTOR_TARIFFS_PATH, 'utf-8');
    const piInvestor: PIInvestorRecord[] = JSON.parse(piInvestorRaw);
    console.log(`  PI Investor: ${piInvestor.length} records loaded`);

    // PI Public
    const piPublic = GENERATED_TARIFFS;
    console.log(`  PI Public:   ${piPublic.length} records loaded`);

    // Build alias map
    const { aliases, merged } = buildAliasMap(piPublic, piInvestor);
    console.log(`  Merged into ${aliases.entry_count} canonical utility entries\n`);

    // Build canonical tariff records
    const tariffs: TariffRecord[] = [];
    const aliasById = new Map(aliases.entries.map((e) => [e.id, e]));

    for (const m of merged) {
        const aliasEntry = aliasById.get(slugify(m.name, m.state));
        if (!aliasEntry) {
            console.warn(`  WARN: No alias entry for "${m.name}" (${m.state})`);
            continue;
        }
        if (m.piPublicData) {
            tariffs.push(
                piPublicToCanonical(m.piPublicData, aliasEntry, m.piInvestorData)
            );
        } else if (m.piInvestorData) {
            tariffs.push(piInvestorOnlyToCanonical(m.piInvestorData, aliasEntry));
        }
    }

    // De-dup tariffs by ID (in case the merge produced duplicates)
    const tariffsById = new Map<string, TariffRecord>();
    for (const t of tariffs) {
        if (!tariffsById.has(t.id)) {
            tariffsById.set(t.id, t);
        }
    }
    const dedupedTariffs = Array.from(tariffsById.values()).sort((a, b) =>
        a.blended_rate_per_kwh - b.blended_rate_per_kwh
    );

    const canonical: CanonicalTariffPool = {
        schema_version: CANONICAL_SCHEMA_VERSION,
        generated_at: new Date().toISOString(),
        record_count: dedupedTariffs.length,
        tariffs: dedupedTariffs,
    };

    // Validate before writing
    console.log('Validating against Zod schema...');
    const aliasResult = utilityAliasMapSchema.safeParse(aliases);
    if (!aliasResult.success) {
        console.error('  ✗ Alias map validation FAILED:');
        console.error(JSON.stringify(aliasResult.error.issues.slice(0, 5), null, 2));
        process.exit(1);
    }
    console.log('  ✓ Alias map valid');

    const canonicalResult = canonicalTariffPoolSchema.safeParse(canonical);
    if (!canonicalResult.success) {
        console.error('  ✗ Canonical pool validation FAILED:');
        console.error(JSON.stringify(canonicalResult.error.issues.slice(0, 10), null, 2));
        process.exit(1);
    }
    console.log('  ✓ Canonical pool valid\n');

    // Write
    fs.writeFileSync(ALIASES_OUT, JSON.stringify(aliases, null, 2) + '\n');
    fs.writeFileSync(CANONICAL_OUT, JSON.stringify(canonical, null, 2) + '\n');

    console.log(`✓ Wrote ${aliases.entry_count} aliases  → ${ALIASES_OUT}`);
    console.log(`✓ Wrote ${canonical.record_count} tariffs → ${CANONICAL_OUT}`);

    // Summary
    const piPublicOnly = merged.filter((m) => m.piPublicData && !m.piInvestorData).length;
    const piInvestorOnly = merged.filter((m) => !m.piPublicData && m.piInvestorData).length;
    const both = merged.filter((m) => m.piPublicData && m.piInvestorData).length;
    console.log(`\nSeeding summary:`);
    console.log(`  PI Public only:    ${piPublicOnly}`);
    console.log(`  PI Investor only:  ${piInvestorOnly}`);
    console.log(`  Both (merged):     ${both}`);
    console.log(`  Total canonical:   ${canonical.record_count}`);
}

main();
