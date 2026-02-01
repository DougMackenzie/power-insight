#!/usr/bin/env python3
"""
Migrate Large Load Tariff Database from Excel to TypeScript

This script reads the Large_Load_Tariff_Database_FINAL.xlsx file and generates
TypeScript code for the tariffDatabase.ts file, including all 88 utilities
with their protection mechanisms and calculated fields.

Usage:
    python scripts/migrate_tariff_excel_to_ts.py

Output:
    - Prints TypeScript array to stdout
    - Also saves to nextjs-app/lib/generatedTariffData.ts
"""

import pandas as pd
import json
import sys
from pathlib import Path

# Configuration
EXCEL_FILE = Path(__file__).parent.parent / "Large_Load_Tariff_Database_FINAL.xlsx"
OUTPUT_FILE = Path(__file__).parent.parent / "nextjs-app" / "lib" / "generatedTariffData.ts"

# State to region mapping (as fallback)
STATE_TO_REGION = {
    'CT': 'Northeast', 'ME': 'Northeast', 'MA': 'Northeast', 'NH': 'Northeast',
    'RI': 'Northeast', 'VT': 'Northeast', 'NJ': 'Northeast', 'NY': 'Northeast',
    'PA': 'Northeast',
    'AL': 'Southeast', 'FL': 'Southeast', 'GA': 'Southeast', 'KY': 'Southeast',
    'MS': 'Southeast', 'NC': 'Southeast', 'SC': 'Southeast', 'TN': 'Southeast',
    'VA': 'Southeast', 'WV': 'Southeast', 'LA': 'Southeast', 'AR': 'Southeast',
    'IL': 'Midwest', 'IN': 'Midwest', 'MI': 'Midwest', 'OH': 'Midwest',
    'WI': 'Midwest', 'MN': 'Midwest', 'IA': 'Midwest', 'MO': 'Midwest',
    'KS': 'Plains', 'NE': 'Plains', 'ND': 'Plains', 'SD': 'Plains', 'OK': 'Plains',
    'AZ': 'Southwest', 'NM': 'Southwest',
    'CA': 'West', 'OR': 'West', 'WA': 'West', 'NV': 'West',
    'TX': 'Texas',
    'CO': 'Mountain West', 'ID': 'Mountain West', 'MT': 'Mountain West',
    'UT': 'Mountain West', 'WY': 'Mountain West',
    'DC': 'Mid-Atlantic', 'DE': 'Mid-Atlantic', 'MD': 'Mid-Atlantic',
}

def safe_float(val, default=0.0):
    """Safely convert value to float."""
    if pd.isna(val):
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def safe_int(val, default=0):
    """Safely convert value to int."""
    if pd.isna(val):
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default

def safe_bool(val):
    """Safely convert value to boolean."""
    if pd.isna(val):
        return False
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ('yes', 'true', '1', 'y')
    return bool(val)

def safe_str(val, default=''):
    """Safely convert value to string."""
    if pd.isna(val):
        return default
    return str(val).strip()

def normalize_status(status_val):
    """Normalize tariff status to valid TariffStatus type."""
    if pd.isna(status_val):
        return 'Active'
    status_str = str(status_val).strip()

    # Map various status strings to valid TariffStatus values
    status_map = {
        'Active': 'Active',
        'Proposed': 'Proposed',
        'Under Review': 'Under Review',
        'Suspended': 'Suspended',
        'Suspended / Hearing Pending': 'Suspended',
        'Hearing Pending': 'Under Review',
        'Pending': 'Proposed',
        'Filed': 'Proposed',
    }

    # Check exact match first
    if status_str in status_map:
        return status_map[status_str]

    # Check partial matches
    lower_status = status_str.lower()
    if 'suspend' in lower_status:
        return 'Suspended'
    if 'propos' in lower_status or 'pending' in lower_status or 'filed' in lower_status:
        return 'Proposed'
    if 'review' in lower_status:
        return 'Under Review'

    return 'Active'

def normalize_iso(iso_val):
    """Normalize ISO/RTO value."""
    if pd.isna(iso_val):
        return 'None'
    iso_str = str(iso_val).upper().strip()
    iso_map = {
        'PJM': 'PJM',
        'ERCOT': 'ERCOT',
        'MISO': 'MISO',
        'CAISO': 'CAISO',
        'SPP': 'SPP',
        'NYISO': 'NYISO',
        'ISO-NE': 'ISO-NE',
        'ISONE': 'ISO-NE',
        'ISO NE': 'ISO-NE',
        'NONE': 'None',
        'NON-ISO': 'None',
        'N/A': 'None',
        '': 'None',
        'TVA': 'None',  # TVA is not an ISO
    }
    return iso_map.get(iso_str, 'None')

def normalize_region(region_val, state_val):
    """Normalize region value to valid Region type."""
    # Valid regions from tariffDatabase.ts
    VALID_REGIONS = {
        'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West',
        'Texas', 'Mountain West', 'Mid-Atlantic', 'Plains'
    }

    # Mapping for non-standard region names
    REGION_MAPPING = {
        'South Central': 'Southeast',
        'Pacific': 'West',
        'Northwest': 'West',
        'Great Lakes': 'Midwest',
        'Central': 'Midwest',
        'Unknown': 'Midwest',
    }

    if pd.isna(region_val) or not str(region_val).strip():
        # Use state to determine region
        state = str(state_val).split('/')[0].strip() if state_val else ''
        return STATE_TO_REGION.get(state, 'Midwest')

    region = str(region_val).strip()

    # Map to valid region if needed
    if region in VALID_REGIONS:
        return region
    elif region in REGION_MAPPING:
        return REGION_MAPPING[region]
    else:
        # Fall back to state-based lookup
        state = str(state_val).split('/')[0].strip() if state_val else ''
        return STATE_TO_REGION.get(state, 'Midwest')

def create_tariff_id(utility_name, state):
    """Create a unique tariff ID from utility name and state."""
    clean_name = utility_name.lower()
    clean_name = clean_name.replace(' ', '-')
    clean_name = clean_name.replace('&', 'and')
    clean_name = clean_name.replace(',', '')
    clean_name = clean_name.replace('.', '')
    clean_name = clean_name.replace("'", '')
    clean_name = clean_name.replace('(', '')
    clean_name = clean_name.replace(')', '')
    clean_name = ''.join(c for c in clean_name if c.isalnum() or c == '-')
    while '--' in clean_name:
        clean_name = clean_name.replace('--', '-')
    state_code = str(state).split('/')[0].strip().lower() if state else 'xx'
    return f"{clean_name}-{state_code}"

def calculate_blended_rate(peak_demand, off_peak_demand, energy_peak, energy_off_peak, fuel_adj):
    """
    Calculate blended rate for 600 MW DC @ 80% load factor.

    Parameters based on Excel methodology:
    - 600 MW DC capacity
    - 80% load factor = 480 MW average load
    - 350,400,000 kWh/month consumption
    - Peak: 40% (140,160,000 kWh), Off-Peak: 60% (210,240,000 kWh)
    - Billing demand: 600,000 kW (600 MW)
    """
    # Monthly consumption
    monthly_kwh = 350_400_000
    peak_kwh = 140_160_000    # 40%
    off_peak_kwh = 210_240_000  # 60%
    billing_demand_kw = 600_000  # 600 MW

    # Monthly costs
    # Demand costs (peak demand charged on full billing demand, off-peak on 50%)
    demand_cost = (peak_demand * billing_demand_kw) + (off_peak_demand * billing_demand_kw * 0.5)

    # Energy costs
    energy_cost = (energy_peak * peak_kwh) + (energy_off_peak * off_peak_kwh)

    # Fuel adjustment (applied to all kWh)
    fuel_cost = fuel_adj * monthly_kwh

    # Total monthly cost
    total_monthly = demand_cost + energy_cost + fuel_cost

    # Blended rate ($/kWh)
    blended_rate = total_monthly / monthly_kwh

    return blended_rate

def calculate_protection_score(row):
    """
    Calculate protection score based on Excel Scoring Methodology.
    Max score: 19 points
    """
    score = 0

    # Ratchet % (0-3 pts): ≥90% (+3), 80-89% (+2), 60-79% (+1)
    ratchet_pct = safe_float(row.get('Ratchet %', 0))
    if ratchet_pct >= 90:
        score += 3
    elif ratchet_pct >= 80:
        score += 2
    elif ratchet_pct >= 60:
        score += 1

    # Contract Term (0-3 pts): ≥15yr (+3), 10-14yr (+2), 5-9yr (+1)
    term_years = safe_int(row.get('Contract (Yrs)', 0))
    if term_years >= 15:
        score += 3
    elif term_years >= 10:
        score += 2
    elif term_years >= 5:
        score += 1

    # CIAC Required (0-2 pts)
    if safe_bool(row.get('CIAC', False)):
        score += 2

    # Take-or-Pay (0-2 pts)
    if safe_bool(row.get('Take-or-Pay', False)):
        score += 2

    # Exit Fees (0-2 pts)
    if safe_bool(row.get('Exit Fee', False)):
        score += 2

    # Demand Ratchet (0-1 pt)
    if safe_bool(row.get('Demand Ratchet', False)):
        score += 1

    # Credit Requirements (0-1 pt)
    if safe_bool(row.get('Credit Req', False)):
        score += 1

    # DC-Specific Provisions (0-2 pts)
    if safe_bool(row.get('DC Specific', False)):
        score += 2

    # Collateral (0-1 pt)
    if safe_bool(row.get('Collateral', False)):
        score += 1

    # Min Load threshold (0-1 pt) - if min load >= 1 MW
    min_load = safe_float(row.get('Min Load (MW)', 0))
    if min_load >= 1:
        score += 1

    return score

def get_protection_rating(score):
    """Get protection rating from score."""
    if score >= 14:
        return 'High'
    elif score >= 8:
        return 'Mid'
    else:
        return 'Low'

def row_to_tariff(row, idx):
    """Convert a DataFrame row to a TypeScript tariff object."""
    utility = safe_str(row.get('Utility', f'Utility {idx}'))
    state = safe_str(row.get('State', 'XX'))
    iso = normalize_iso(row.get('ISO/RTO'))
    region = normalize_region(row.get('Region'), state)

    # Get rates from Excel columns
    peak_demand = safe_float(row.get('Peak Demand ($/kW)'))
    off_peak_demand = safe_float(row.get('Off-Peak Demand'))
    energy_peak = safe_float(row.get('Energy Peak ($/kWh)'))
    energy_off_peak = safe_float(row.get('Energy Off-Peak'))
    fuel_adj = safe_float(row.get('Fuel/Rider Adj'))

    # Calculate blended rate
    blended_rate = calculate_blended_rate(peak_demand, off_peak_demand, energy_peak, energy_off_peak, fuel_adj)

    # Calculate annual cost (for 600 MW @ 80% load factor)
    annual_kwh = 350_400_000 * 12  # 4.2 billion kWh
    annual_cost_m = (blended_rate * annual_kwh) / 1_000_000

    # Calculate protection score
    protection_score = calculate_protection_score(row)
    protection_rating = get_protection_rating(protection_score)

    # Contract terms
    contract_term = safe_int(row.get('Contract (Yrs)'), 5)
    min_load = safe_float(row.get('Min Load (MW)'), 1)
    ratchet_pct = safe_float(row.get('Ratchet %'), 80)

    # Protection booleans
    demand_ratchet = safe_bool(row.get('Demand Ratchet'))
    ciac = safe_bool(row.get('CIAC'))
    take_or_pay = safe_bool(row.get('Take-or-Pay'))
    exit_fee = safe_bool(row.get('Exit Fee'))
    credit_req = safe_bool(row.get('Credit Req'))
    dc_specific = safe_bool(row.get('DC Specific'))
    collateral = safe_bool(row.get('Collateral'))

    # Build tariff object
    tariff = {
        'id': create_tariff_id(utility, state),
        'utility': utility,
        'utility_short': utility[:25] + '...' if len(utility) > 25 else utility,
        'state': state,
        'region': region,
        'iso_rto': iso,
        'tariff_name': safe_str(row.get('Tariff Name'), f'{utility} Large Load'),
        'rate_schedule': safe_str(row.get('Rate Schedule'), 'Schedule LGS'),
        'effective_date': safe_str(row.get('Effective Date'), '2025-01-01'),
        'status': normalize_status(row.get('Status')),

        # Eligibility
        'min_load_mw': min_load,
        'voltage_level': 'Transmission',

        # Demand Charges ($/kW-month)
        'peak_demand_charge': peak_demand,
        'off_peak_demand_charge': off_peak_demand,

        # Energy Rates ($/kWh)
        'energy_rate_peak': energy_peak,
        'energy_rate_off_peak': energy_off_peak,

        # Contract Terms
        'initial_term_years': contract_term,
        'termination_notice_months': 12,

        # Calculated fields (from Excel)
        'blendedRatePerKWh': blended_rate,
        'annualCostM': round(annual_cost_m, 2),
        'protectionScore': protection_score,
        'protectionRating': protection_rating,
        'fuelAdjustmentPerKWh': fuel_adj,

        # Protections
        'protections': {
            'minimum_demand_charge': demand_ratchet,
            'minimum_demand_pct': ratchet_pct,
            'demand_ratchet': demand_ratchet,
            'ratchet_pct': ratchet_pct,
            'ciac_required': ciac,
            'network_upgrade_allocation': False,
            'credit_requirements': credit_req,
            'deposit_required': collateral,
            'letter_of_credit': False,
            'parent_guarantee': False,
            'contract_min_term_months': contract_term * 12,
            'take_or_pay': take_or_pay,
            'load_factor_requirement': False,
            'ramp_schedule': False,
            'fuel_adjustment_clause': fuel_adj > 0,
            'capacity_pass_through': False,
            'curtailment_provisions': False,
            'force_majeure': True,
            'queue_deposit': False,
            'milestone_requirements': False,
            'study_cost_allocation': False,
            'commercial_readiness': False,
            'interruptible_discount': False,
            'tou_differential': energy_peak != energy_off_peak and energy_off_peak > 0,
            'demand_response_credit': False,
            'behind_meter_credit': False,
        },

        # Data Center Specific
        'data_center_specific': dc_specific,

        # Citation
        'citation': {
            'document': safe_str(row.get('Rate Components'), ''),
            'url': '',
            'pageReference': '',
            'docketNumber': '',
        },

        # Metadata
        'last_verified': '2026-01-01',
        'notes': safe_str(row.get('Notes'), ''),
    }

    return tariff

def tariff_to_typescript(tariff):
    """Convert tariff dict to TypeScript object literal."""
    def format_value(v, indent=4):
        if v is None:
            return 'undefined'
        if isinstance(v, bool):
            return 'true' if v else 'false'
        if isinstance(v, str):
            escaped = v.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
            return f"'{escaped}'"
        if isinstance(v, (int, float)):
            return str(v)
        if isinstance(v, dict):
            items = []
            for k, val in v.items():
                items.append(f"{' ' * (indent + 2)}{k}: {format_value(val, indent + 2)}")
            return '{\n' + ',\n'.join(items) + f"\n{' ' * indent}}}"
        return str(v)

    lines = ['  {']
    for key, value in tariff.items():
        lines.append(f"    {key}: {format_value(value)},")
    lines.append('  }')
    return '\n'.join(lines)

def main():
    print(f"Reading Excel file: {EXCEL_FILE}", file=sys.stderr)

    if not EXCEL_FILE.exists():
        print(f"Error: Excel file not found at {EXCEL_FILE}", file=sys.stderr)
        sys.exit(1)

    # Read the main Tariff Database sheet with header on row 1 (0-indexed)
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name='Tariff Database', header=1)
        print(f"Found {len(df)} rows in Tariff Database sheet", file=sys.stderr)
        print(f"Columns: {list(df.columns)}", file=sys.stderr)
    except Exception as e:
        print(f"Error reading Excel: {e}", file=sys.stderr)
        sys.exit(1)

    # Convert rows to tariffs
    tariffs = []
    for idx, row in df.iterrows():
        utility = row.get('Utility', '')
        if pd.isna(utility) or not str(utility).strip():
            continue

        tariff = row_to_tariff(row, idx)
        tariffs.append(tariff)

    print(f"Converted {len(tariffs)} tariffs", file=sys.stderr)

    # Sort by blended rate
    tariffs.sort(key=lambda t: t['blendedRatePerKWh'])

    # Generate TypeScript code
    ts_code = '''/**
 * Generated Tariff Data
 *
 * Auto-generated from Large_Load_Tariff_Database_FINAL.xlsx
 * DO NOT EDIT MANUALLY - run migrate_tariff_excel_to_ts.py to regenerate
 *
 * Generated: 2026-01-01
 * Source: Large Load Tariff Database (88 utilities)
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
 * Complete tariff database with all 88 utilities
 * Data sourced from E3 "Tailored for Scale" study and utility tariff filings
 * Sorted by blended rate (lowest to highest)
 */
export const GENERATED_TARIFFS: EnrichedTariff[] = [
'''

    tariff_strings = [tariff_to_typescript(t) for t in tariffs]
    ts_code += ',\n'.join(tariff_strings)
    ts_code += '\n];\n'

    # Calculate statistics
    high_count = sum(1 for t in tariffs if t['protectionRating'] == 'High')
    mid_count = sum(1 for t in tariffs if t['protectionRating'] == 'Mid')
    low_count = sum(1 for t in tariffs if t['protectionRating'] == 'Low')
    rates = [t['blendedRatePerKWh'] for t in tariffs if t['blendedRatePerKWh'] > 0]
    avg_rate = sum(rates) / len(rates) if rates else 0
    min_rate = min(rates) if rates else 0
    max_rate = max(rates) if rates else 0

    # Get unique states and ISOs
    states = list(set(t['state'] for t in tariffs))
    isos = list(set(t['iso_rto'] for t in tariffs if t['iso_rto'] != 'None'))

    ts_code += f'''
/**
 * Database Statistics
 */
export const TARIFF_STATS = {{
  totalUtilities: {len(tariffs)},
  highProtection: {high_count},
  midProtection: {mid_count},
  lowProtection: {low_count},
  avgBlendedRate: {avg_rate:.5f},
  minBlendedRate: {min_rate:.5f},
  maxBlendedRate: {max_rate:.5f},
  uniqueStates: {len(states)},
  uniqueISOs: {len(isos)},
  generatedDate: '2026-01-01',
}};

/**
 * Get all unique states in the database
 */
export const TARIFF_STATES = {json.dumps(sorted(states))};

/**
 * Get all unique ISO/RTOs in the database
 */
export const TARIFF_ISOS = {json.dumps(sorted(isos))};

/**
 * Helper function to get tariffs by rating
 */
export function getTariffsByRating(rating: ProtectionRating): EnrichedTariff[] {{
  return GENERATED_TARIFFS.filter(t => t.protectionRating === rating);
}}

/**
 * Helper function to get tariffs by ISO
 */
export function getTariffsByISO(iso: string): EnrichedTariff[] {{
  return GENERATED_TARIFFS.filter(t => t.iso_rto === iso);
}}

/**
 * Helper function to get tariffs by state
 */
export function getTariffsByState(state: string): EnrichedTariff[] {{
  return GENERATED_TARIFFS.filter(t => t.state === state || t.state.includes(state));
}}

/**
 * Get the cheapest N tariffs
 */
export function getCheapestTariffs(n: number = 10): EnrichedTariff[] {{
  return GENERATED_TARIFFS.slice(0, n);
}}

/**
 * Get tariffs within a blended rate range
 */
export function getTariffsInRateRange(minRate: number, maxRate: number): EnrichedTariff[] {{
  return GENERATED_TARIFFS.filter(t => t.blendedRatePerKWh >= minRate && t.blendedRatePerKWh <= maxRate);
}}
'''

    # Save to file
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(ts_code)
    print(f"Written TypeScript to: {OUTPUT_FILE}", file=sys.stderr)
    print(f"\nStatistics:", file=sys.stderr)
    print(f"  Total utilities: {len(tariffs)}", file=sys.stderr)
    print(f"  High protection: {high_count}", file=sys.stderr)
    print(f"  Mid protection: {mid_count}", file=sys.stderr)
    print(f"  Low protection: {low_count}", file=sys.stderr)
    print(f"  Avg blended rate: ${avg_rate:.4f}/kWh ({avg_rate*100:.2f} ¢/kWh)", file=sys.stderr)
    print(f"  Min blended rate: ${min_rate:.4f}/kWh ({min_rate*100:.2f} ¢/kWh)", file=sys.stderr)
    print(f"  Max blended rate: ${max_rate:.4f}/kWh ({max_rate*100:.2f} ¢/kWh)", file=sys.stderr)

if __name__ == '__main__':
    main()
