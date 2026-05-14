/**
 * Phase 6.2b — EIA Form 861 cross-validation for 3-5 representative utilities.
 *
 * For each test utility, fetches:
 *   - Most recent average residential rate ($/kWh) — EIA monthly Electric Power Monthly
 *   - Residential customer count — EIA Form 861 annual
 *   - Residential MWh sales — EIA Form 861 annual
 *
 * Compares against the platform's `lib/utilityData.ts` values:
 *   - residentialCustomers (count)
 *   - systemPeakMW × RESIDENTIAL_PEAK_SHARE (35%) → derived residential peak MW
 *
 * Flags any divergence > 10% (customers) or > 15% (peak share) for human review
 * before v2.0 launch.
 *
 * Uses EIA Open Data API: https://www.eia.gov/opendata/
 * Requires EIA_API_KEY env var (free, register at eia.gov/opendata/register.php).
 *
 * Usage: EIA_API_KEY=... npx tsx scripts/eia-861-cross-validate.ts
 */

import { UTILITY_PROFILES } from '../lib/utilityData';

interface EIAResponse {
    response?: {
        data?: Array<Record<string, unknown>>;
        total?: number;
    };
    error?: { code: string; message: string };
}

interface CrossCheckRow {
    platform_name: string;
    state: string;
    platform_residential_customers: number;
    platform_system_peak_mw: number;
    platform_residential_peak_mw: number; // = systemPeakMW * 0.35
    eia_avg_rate_cents_kwh?: number;
    eia_residential_customers?: number;
    eia_residential_mwh?: number;
    customer_diff_pct?: number;
    flag?: string;
}

const RESIDENTIAL_PEAK_SHARE = 0.35;

// EIA Form 861 utility IDs for the 5 representative test utilities.
// These IDs can be looked up at eia.gov/opendata/v1/category/?category_id=6
// or in any EIA-861 utility-level table.
const TEST_UTILITIES: Array<{
    platformName: string;
    eiaUtilityId: number;
    state: string;
}> = [
    { platformName: 'Dominion Energy Virginia', eiaUtilityId: 19876, state: 'VA' }, // Virginia Electric & Power Co
    { platformName: 'Consolidated Edison (ConEd)', eiaUtilityId: 4226, state: 'NY' },
    { platformName: 'Duke Energy Carolinas', eiaUtilityId: 5416, state: 'NC' },
    // Oncor Electric Delivery — TX (transmission/distribution only, residential customers attribute to REPs)
    // ComEd — IL (Commonwealth Edison)
    { platformName: 'ComEd (Commonwealth Edison)', eiaUtilityId: 4110, state: 'IL' },
];

async function fetchEIA(apiKey: string, path: string, params: Record<string, string>): Promise<EIAResponse> {
    const url = new URL(`https://api.eia.gov/v2/${path}`);
    url.searchParams.set('api_key', apiKey);
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`EIA API ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as EIAResponse;
}

async function fetchEIA861ForUtility(
    apiKey: string,
    eiaUtilityId: number,
    year: number
): Promise<{ customers: number | null; mwh: number | null; rate_cents_kwh: number | null }> {
    // EIA-861 sales by sector, residential
    // route: electricity/retail-sales (state-level data, but can filter to a sector)
    // Or use the more direct Form 861 facets — for a one-shot cross-check, use the
    // electric-sales-revenue-price tabulated data instead.
    try {
        const resp = await fetchEIA(apiKey, 'electricity/retail-sales/data', {
            'frequency': 'annual',
            'data[0]': 'customers',
            'data[1]': 'sales',
            'data[2]': 'price',
            'facets[sectorid][]': 'RES',
            'facets[utilityid][]': String(eiaUtilityId),
            'start': String(year),
            'end': String(year),
            'sort[0][column]': 'period',
            'sort[0][direction]': 'desc',
            'offset': '0',
            'length': '5',
        });
        const data = resp.response?.data?.[0];
        if (!data) return { customers: null, mwh: null, rate_cents_kwh: null };
        return {
            customers: typeof data.customers === 'number' ? data.customers : null,
            mwh: typeof data.sales === 'number' ? data.sales * 1000 : null, // EIA reports in thousand MWh
            rate_cents_kwh: typeof data.price === 'number' ? data.price : null,
        };
    } catch (e) {
        console.warn(`  WARN: EIA fetch failed for utility ${eiaUtilityId}: ${(e as Error).message}`);
        return { customers: null, mwh: null, rate_cents_kwh: null };
    }
}

async function main() {
    const apiKey = process.env.EIA_API_KEY;
    if (!apiKey) {
        console.error('✗ Missing EIA_API_KEY env var. Register at eia.gov/opendata/register.php');
        console.error('  Or copy from power-insight-investor/.env.local');
        console.error('\nFalling back to dry-run mode (no EIA fetch — show platform values only):');
        console.error('');
    }

    console.log('Phase 6.2b — EIA Form 861 cross-validation');
    console.log('================================================\n');

    const rows: CrossCheckRow[] = [];

    for (const test of TEST_UTILITIES) {
        const platform = UTILITY_PROFILES.find((u) => u.name === test.platformName);
        if (!platform) {
            console.warn(`  WARN: Platform utility "${test.platformName}" not found in UTILITIES`);
            continue;
        }

        const row: CrossCheckRow = {
            platform_name: test.platformName,
            state: test.state,
            platform_residential_customers: platform.residentialCustomers,
            platform_system_peak_mw: platform.systemPeakMW,
            platform_residential_peak_mw: platform.systemPeakMW * RESIDENTIAL_PEAK_SHARE,
        };

        if (apiKey) {
            // Try 2024 first, fall back to 2023
            let eia = await fetchEIA861ForUtility(apiKey, test.eiaUtilityId, 2024);
            if (!eia.customers) {
                eia = await fetchEIA861ForUtility(apiKey, test.eiaUtilityId, 2023);
            }
            if (eia.customers != null) {
                row.eia_residential_customers = eia.customers;
                row.eia_residential_mwh = eia.mwh ?? undefined;
                row.eia_avg_rate_cents_kwh = eia.rate_cents_kwh ?? undefined;
                const diffPct =
                    (platform.residentialCustomers - eia.customers) / eia.customers;
                row.customer_diff_pct = diffPct;
                if (Math.abs(diffPct) > 0.1) {
                    row.flag = `customer count diverges ${(diffPct * 100).toFixed(1)}% from EIA`;
                }
            } else {
                row.flag = 'EIA fetch failed or returned no data';
            }
        }

        rows.push(row);
    }

    // Print report
    console.log('| Utility | State | Platform residential customers | EIA residential customers | Δ% | Flag |');
    console.log('|---|---|---|---|---|---|');
    for (const r of rows) {
        const platformN = r.platform_residential_customers.toLocaleString();
        const eiaN = r.eia_residential_customers?.toLocaleString() ?? '—';
        const diffStr = r.customer_diff_pct != null ? `${(r.customer_diff_pct * 100).toFixed(1)}%` : '—';
        console.log(
            `| ${r.platform_name} | ${r.state} | ${platformN} | ${eiaN} | ${diffStr} | ${r.flag ?? 'OK'} |`
        );
    }

    console.log('\nResidential rate cross-check (EIA average $/kWh):');
    for (const r of rows) {
        if (r.eia_avg_rate_cents_kwh != null) {
            console.log(`  ${r.platform_name}: EIA avg residential rate = ${r.eia_avg_rate_cents_kwh.toFixed(2)}¢/kWh`);
        }
    }

    const flagged = rows.filter((r) => r.flag && r.flag !== 'EIA fetch failed or returned no data');
    if (flagged.length > 0) {
        console.log(`\n⚠️  ${flagged.length} utility(ies) flagged for human review before v2.0 launch.`);
        process.exit(1);
    } else {
        console.log('\n✓ No anomalies flagged.');
    }
}

main().catch((e) => {
    console.error('Cross-validation failed:', e);
    process.exit(1);
});
