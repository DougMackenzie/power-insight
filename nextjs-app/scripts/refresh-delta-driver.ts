/**
 * Track E driver: v2.1 methodology re-validation against the 9 refreshed utilities.
 *
 * Compares year-10 residential bill impact (Unoptimized + Flexible scenarios at
 * 2 capacity points = 3 scenarios per utility) using:
 *   - Baseline tariff data: scripts/_baseline_generated_tariffs.snapshot.ts
 *     (snapshot of lib/generatedTariffData.ts at SHA f64dcc8, prior to Track A refresh)
 *   - Refreshed tariff data: lib/generatedTariffData.ts (current)
 *
 * Approach:
 *   - Both datasets share UTILITY_PROFILES manual entries; we replicate the
 *     getUtilityById merge logic locally so we can swap which GENERATED_TARIFFS
 *     pool is used to override the manual fields.
 *   - Trajectory functions are imported as-is from lib/calculations.ts.
 *
 * Output:
 *   - Markdown delta table → stdout (also saved by caller via redirect)
 *   - Per-utility stress notes for the 4 v2.1 deferred items
 *
 * Usage: npx tsx scripts/refresh-delta-driver.ts
 */

import {
    generateAllTrajectories,
    calculateRevenueAdequacy,
    type EscalationConfig,
} from '../lib/calculations';
import {
    UTILITY_PROFILES,
    enrichedTariffToUtilityProfile,
    normalizeRatchetPct,
    type UtilityProfile,
} from '../lib/utilityData';
import { GENERATED_TARIFFS } from '../lib/generatedTariffData';
import { BASELINE_GENERATED_TARIFFS } from './_baseline_generated_tariffs.snapshot';
import {
    DEFAULT_UTILITY,
    DEFAULT_DATA_CENTER,
    type Utility,
    type DataCenter,
} from '../lib/constants';

// ============================================================
// CONFIG
// ============================================================
const REFRESHED_IDS = [
    'aep-ohio-oh',
    'comed-il',
    'conedison-ny',
    'dominion-energy-virginia-va',
    'georgia-power-ga',
    'midamerican-energy-ia',
    'oncor-electric-delivery-tx',
    'pacific-gas-and-electric-ca',
    'salt-river-project-az',
] as const;

interface Scenario {
    label: string;
    capacityMW: number;
    firmLoadFactor: number;
    firmPeakCoincidence: number;
    flexLoadFactor: number;
    flexPeakCoincidence: number;
    onsiteGenerationMW: number;
    // Which trajectory series to read for the headline impact
    series: 'unoptimized' | 'flexible';
}

const SCENARIOS: Scenario[] = [
    {
        label: '1GW firm 24/7 baseload',
        capacityMW: 1000,
        firmLoadFactor: 0.95,
        firmPeakCoincidence: 1.0,
        flexLoadFactor: 0.95,
        flexPeakCoincidence: 1.0,
        onsiteGenerationMW: 0,
        series: 'unoptimized',
    },
    {
        label: '1GW flexible (95% LF, 75% peak coinc)',
        capacityMW: 1000,
        firmLoadFactor: 0.80,
        firmPeakCoincidence: 1.0,
        flexLoadFactor: 0.95,
        flexPeakCoincidence: 0.75,
        onsiteGenerationMW: 0,
        series: 'flexible',
    },
    {
        label: '500MW firm 24/7',
        capacityMW: 500,
        firmLoadFactor: 0.95,
        firmPeakCoincidence: 1.0,
        flexLoadFactor: 0.95,
        flexPeakCoincidence: 1.0,
        onsiteGenerationMW: 0,
        series: 'unoptimized',
    },
];

const PROJECTION_YEARS = 12; // Year 10 = fully ramped (DC build 2027–2035, year index 8 onward = full)
const ESCALATION: EscalationConfig = {
    inflationEnabled: false,
    inflationRate: 0.02,
    infrastructureAgingEnabled: false,
    infrastructureAgingRate: 0.01,
};

// ============================================================
// HELPER: replicate getUtilityById merge logic, parameterized on tariff pool
// ============================================================
function buildProfileFromPool(
    utilityId: string,
    tariffPool: Array<{ id: string;[k: string]: unknown }>,
): UtilityProfile | undefined {
    const manual = UTILITY_PROFILES.find((u) => u.id === utilityId);
    const tariff = tariffPool.find((t) => t.id === utilityId) as
        | (typeof GENERATED_TARIFFS)[number]
        | undefined;

    if (manual && tariff) {
        // Same merge as lib/utilityData.ts getUtilityById()
        const peakDemandCharge = (tariff.peak_demand_charge || 5) * 1000;
        const maxDemandCharge =
            (tariff.off_peak_demand_charge || tariff.peak_demand_charge * 0.4) * 1000;
        const energyCharge = tariff.blendedRatePerKWh * 1000;
        // Boundary-detect whole-percent vs fractional ratchet_pct (mirrors
        // lib/utilityData.ts normalizeRatchetPct — kept in sync).
        const ratchetPercent =
            normalizeRatchetPct(tariff.protections.ratchet_pct) ?? manual.tariff.ratchetPercent;

        return {
            ...manual,
            state: tariff.state,
            tariff: {
                ...manual.tariff,
                peakDemandCharge,
                maxDemandCharge,
                energyCharge,
                ratchetPercent,
                ratchetMonths: ratchetPercent ? 12 : manual.tariff.ratchetMonths,
                tariffSource: `${tariff.tariff_name} (${tariff.rate_schedule}); ${manual.tariff.tariffSource}`,
            },
        };
    }
    if (manual) return manual;
    if (tariff) return enrichedTariffToUtilityProfile(tariff);
    return undefined;
}

function buildUtilityFromProfile(profile: UtilityProfile): Utility {
    return {
        ...DEFAULT_UTILITY,
        name: profile.name,
        state: profile.state,
        residentialCustomers: profile.residentialCustomers,
        averageMonthlyBill: profile.averageMonthlyBill,
        averageMonthlyUsage: profile.averageMonthlyUsageKWh,
        systemPeakMW: profile.systemPeakMW,
        baseResidentialAllocation: profile.market.baseResidentialAllocation,
        marketType: profile.market.type,
        hasCapacityMarket: profile.market.hasCapacityMarket,
        capacityCostPassThrough: profile.market.capacityCostPassThrough,
        capacityPrice2024: profile.market.capacityPrice2024,
        totalGenerationCapacityMW: profile.totalGenerationCapacityMW,
        currentReserveMargin: profile.currentReserveMargin,
        interconnection: profile.interconnection,
        marginalEnergyCost: profile.market.marginalEnergyCost,
    };
}

function buildDataCenter(scenario: Scenario): DataCenter {
    return {
        ...DEFAULT_DATA_CENTER,
        capacityMW: scenario.capacityMW,
        firmLoadFactor: scenario.firmLoadFactor,
        firmPeakCoincidence: scenario.firmPeakCoincidence,
        flexLoadFactor: scenario.flexLoadFactor,
        flexPeakCoincidence: scenario.flexPeakCoincidence,
        onsiteGenerationMW: scenario.onsiteGenerationMW,
    };
}

// ============================================================
// RUN ONE UTILITY × SCENARIO × DATASET
// ============================================================
interface RunResult {
    monthlyBillFinal: number;
    baselineFinal: number;
    dcImpactMonthly: number; // monthlyBill - baseline at final year
    revAdequacyRatio: number;
    surplusOrDeficitPerMW: number;
    totalRevenue: number;
    totalCost: number;
    demandRevenue: number;
    energyRevenue: number;
    capacityCost: number;
    networkCost: number;
}

function runOne(
    profile: UtilityProfile,
    scenario: Scenario,
): RunResult {
    const utility = buildUtilityFromProfile(profile);
    const dc = buildDataCenter(scenario);
    const tariff = profile.tariff;

    const trajectories = generateAllTrajectories(
        utility,
        dc,
        PROJECTION_YEARS,
        tariff,
        ESCALATION,
    );

    const target =
        scenario.series === 'flexible'
            ? trajectories.flexible
            : trajectories.unoptimized;
    const baseline = trajectories.baseline;
    const finalIdx = target.length - 1;
    const monthlyBillFinal = target[finalIdx].monthlyBill;
    const baselineFinal = baseline[finalIdx].monthlyBill;

    // Revenue adequacy at scenario params
    const lf =
        scenario.series === 'flexible' ? scenario.flexLoadFactor : scenario.firmLoadFactor;
    const pc =
        scenario.series === 'flexible'
            ? scenario.flexPeakCoincidence
            : scenario.firmPeakCoincidence;
    const ra = calculateRevenueAdequacy(
        scenario.capacityMW,
        lf,
        pc,
        tariff,
        utility,
        scenario.onsiteGenerationMW,
    );

    return {
        monthlyBillFinal,
        baselineFinal,
        dcImpactMonthly: monthlyBillFinal - baselineFinal,
        revAdequacyRatio: ra.revenueAdequacyRatio,
        surplusOrDeficitPerMW: ra.surplusOrDeficitPerMW,
        totalRevenue: ra.totalRevenue,
        totalCost: ra.totalMarginalCost,
        demandRevenue: ra.demandChargeRevenue,
        energyRevenue: ra.energyChargeRevenue,
        capacityCost: ra.marginalCapacityCost,
        networkCost: ra.networkUpgradeCost,
    };
}

// ============================================================
// MAIN
// ============================================================
function fmtMoney(v: number): string {
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}k`;
    return `$${v.toFixed(2)}`;
}

function fmtPct(v: number): string {
    if (!isFinite(v)) return 'inf';
    return `${(v * 100).toFixed(1)}%`;
}

function deltaCell(baseline: number, refreshed: number): {
    abs: number;
    pct: number;
    direction: 'higher' | 'lower' | 'flat';
} {
    const abs = refreshed - baseline;
    const pct = baseline === 0 ? Infinity : abs / Math.abs(baseline);
    let direction: 'higher' | 'lower' | 'flat' = 'flat';
    if (Math.abs(pct) > 0.001) direction = abs > 0 ? 'higher' : 'lower';
    return { abs, pct, direction };
}

function main(): void {
    const out: string[] = [];
    out.push('# v2.1 Methodology Re-Validation — Track E Delta Report');
    out.push('');
    out.push(`**Generated:** ${new Date().toISOString()}`);
    out.push(`**Methodology:** v2.1 (4 Gemini-recommended items shipped)`);
    out.push(`**Baseline SHA:** f64dcc8 (pre-Track A refresh)`);
    out.push(`**Refreshed SHA:** f561313 (current main, post Duke revert)`);
    out.push(`**Gemini bless reference:** docs/GEMINI_REVIEW_2026-05-14.md`);
    out.push('');
    out.push('## Per-utility delta grid (3 scenarios × 9 utilities = 27 cells)');
    out.push('');

    // Header for headline grid: residential bill impact $/mo per scenario
    const headerRows: string[][] = [];
    headerRows.push([
        'Utility',
        'Scenario',
        'Baseline $/mo',
        'Refreshed $/mo',
        'Δ $/mo',
        'Δ %',
        'Direction',
        'Refr RA ratio',
        'Refr surplus $/MW',
    ]);

    interface Flag {
        utility: string;
        scenario: string;
        deltaPct: number;
        deltaAbs: number;
        baseline: number;
        refreshed: number;
        baselineProfile: UtilityProfile | undefined;
        refreshedProfile: UtilityProfile | undefined;
        baselineRun: RunResult;
        refreshedRun: RunResult;
    }
    const flags: Flag[] = [];
    const detailedNotes: string[] = [];

    for (const id of REFRESHED_IDS) {
        const baselineProfile = buildProfileFromPool(
            id,
            BASELINE_GENERATED_TARIFFS as never,
        );
        const refreshedProfile = buildProfileFromPool(id, GENERATED_TARIFFS as never);

        if (!baselineProfile || !refreshedProfile) {
            detailedNotes.push(
                `\n### ${id}\n\n  - Baseline profile present: ${!!baselineProfile}\n  - Refreshed profile present: ${!!refreshedProfile}\n`,
            );
            continue;
        }

        // Per-utility tariff field summary
        const refreshedTariff = (GENERATED_TARIFFS as Array<typeof GENERATED_TARIFFS[number]>).find((t) => t.id === id)!;
        const baselineTariff = (BASELINE_GENERATED_TARIFFS as Array<typeof GENERATED_TARIFFS[number]>).find((t) => t.id === id)!;

        for (const scenario of SCENARIOS) {
            const baselineRun = runOne(baselineProfile, scenario);
            const refreshedRun = runOne(refreshedProfile, scenario);
            const d = deltaCell(baselineRun.dcImpactMonthly, refreshedRun.dcImpactMonthly);

            headerRows.push([
                id,
                scenario.label,
                `$${baselineRun.dcImpactMonthly.toFixed(2)}`,
                `$${refreshedRun.dcImpactMonthly.toFixed(2)}`,
                d.abs >= 0 ? `+$${d.abs.toFixed(2)}` : `-$${Math.abs(d.abs).toFixed(2)}`,
                isFinite(d.pct) ? `${d.pct >= 0 ? '+' : ''}${(d.pct * 100).toFixed(1)}%` : 'n/a',
                d.direction,
                fmtPct(refreshedRun.revAdequacyRatio),
                fmtMoney(refreshedRun.surplusOrDeficitPerMW),
            ]);

            if (Math.abs(d.pct) > 0.10 || !isFinite(d.pct)) {
                flags.push({
                    utility: id,
                    scenario: scenario.label,
                    deltaPct: d.pct,
                    deltaAbs: d.abs,
                    baseline: baselineRun.dcImpactMonthly,
                    refreshed: refreshedRun.dcImpactMonthly,
                    baselineProfile,
                    refreshedProfile,
                    baselineRun,
                    refreshedRun,
                });
            }
        }

        // Per-utility note
        detailedNotes.push(`\n### ${id}\n`);
        detailedNotes.push(
            `- Baseline tariff fields: peak_dc=${baselineTariff.peak_demand_charge} \$/kW, off_dc=${baselineTariff.off_peak_demand_charge} \$/kW, e_peak=${baselineTariff.energy_rate_peak} \$/kWh, e_off=${baselineTariff.energy_rate_off_peak} \$/kWh, blended=${baselineTariff.blendedRatePerKWh.toFixed(5)} \$/kWh, ratchet_pct=${baselineTariff.protections.ratchet_pct}, take_or_pay=${baselineTariff.protections.take_or_pay}, dc_specific=${baselineTariff.data_center_specific}`,
        );
        detailedNotes.push(
            `- Refreshed tariff fields: peak_dc=${refreshedTariff.peak_demand_charge} \$/kW, off_dc=${refreshedTariff.off_peak_demand_charge} \$/kW, e_peak=${refreshedTariff.energy_rate_peak} \$/kWh, e_off=${refreshedTariff.energy_rate_off_peak} \$/kWh, blended=${refreshedTariff.blendedRatePerKWh.toFixed(5)} \$/kWh, ratchet_pct=${refreshedTariff.protections.ratchet_pct}, take_or_pay=${refreshedTariff.protections.take_or_pay}, dc_specific=${refreshedTariff.data_center_specific}`,
        );
    }

    // Print grid as markdown table
    out.push('| ' + headerRows[0].join(' | ') + ' |');
    out.push('|' + headerRows[0].map(() => '---').join('|') + '|');
    for (const row of headerRows.slice(1)) {
        out.push('| ' + row.join(' | ') + ' |');
    }
    out.push('');

    out.push('## Flagged scenarios (|delta| > 10%)');
    out.push('');
    if (flags.length === 0) {
        out.push('- None.');
    } else {
        out.push(`- **${flags.length} flagged scenarios** out of ${headerRows.length - 1} total.`);
        out.push('');
        for (const f of flags) {
            const pctStr = isFinite(f.deltaPct)
                ? `${(f.deltaPct * 100).toFixed(1)}%`
                : 'n/a (baseline=$0)';
            out.push(
                `- **${f.utility}** / ${f.scenario}: baseline $${f.baseline.toFixed(2)}/mo → refreshed $${f.refreshed.toFixed(2)}/mo (Δ ${pctStr})`,
            );
        }
    }
    out.push('');

    out.push('## Per-utility tariff field summary');
    for (const note of detailedNotes) out.push(note);

    console.log(out.join('\n'));
}

main();
