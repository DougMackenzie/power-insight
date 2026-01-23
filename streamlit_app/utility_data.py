"""
Utility data compiled from public sources including EIA, utility filings, and annual reports.
Data reflects 2024 figures where available.

Market Structure Types:
- 'regulated': Vertically integrated utility with state PUC oversight
- 'pjm': PJM Interconnection (capacity market, 2024 prices ~$270/MW-day)
- 'ercot': ERCOT Texas (energy-only market, no capacity market)
- 'miso': MISO (capacity market, lower prices than PJM)
- 'spp': Southwest Power Pool (energy market, no mandatory capacity market)

Cost Allocation Notes:
- Regulated markets: Infrastructure costs allocated through rate base, ~40% residential
- PJM markets: Capacity costs flow through retail suppliers, high volatility
- ERCOT: No capacity market, transmission costs allocated, more direct price signals
"""

# Market structure presets
REGULATED_MARKET = {
    'type': 'regulated',
    'has_capacity_market': False,
    'base_residential_allocation': 0.40,
    'capacity_cost_pass_through': 0.40,
    'transmission_allocation': 0.35,
    'utility_owns_generation': True,
    'notes': 'Vertically integrated utility. Infrastructure costs allocated through traditional rate base.'
}

PJM_MARKET = {
    'type': 'pjm',
    'has_capacity_market': True,
    'base_residential_allocation': 0.35,
    'capacity_cost_pass_through': 0.50,
    'transmission_allocation': 0.35,
    'utility_owns_generation': False,
    'capacity_price_2024': 269.92,
    'notes': 'PJM capacity market. 2024 auction cleared at $269.92/MW-day (10x increase).'
}

ERCOT_MARKET = {
    'type': 'ercot',
    'has_capacity_market': False,
    'base_residential_allocation': 0.30,
    'capacity_cost_pass_through': 0.25,
    'transmission_allocation': 0.35,
    'utility_owns_generation': False,
    'notes': 'Energy-only market with no capacity payments. Price signals drive investment.'
}

MISO_MARKET = {
    'type': 'miso',
    'has_capacity_market': True,
    'base_residential_allocation': 0.38,
    'capacity_cost_pass_through': 0.35,
    'transmission_allocation': 0.35,
    'utility_owns_generation': True,
    'capacity_price_2024': 30.00,
    'notes': 'MISO capacity market with lower clearing prices than PJM.'
}

SPP_MARKET = {
    'type': 'spp',
    'has_capacity_market': False,
    'base_residential_allocation': 0.40,
    'capacity_cost_pass_through': 0.40,
    'transmission_allocation': 0.35,
    'utility_owns_generation': True,
    'notes': 'Southwest Power Pool. Energy market but no mandatory capacity market.'
}

UTILITY_PROFILES = [
    # ============================================
    # REGULATED / VERTICALLY INTEGRATED UTILITIES
    # ============================================
    {
        'id': 'pso-oklahoma',
        'name': 'Public Service Company of Oklahoma (PSO)',
        'short_name': 'PSO Oklahoma',
        'state': 'Oklahoma',
        'region': 'Southwest',
        'residential_customers': 460000,
        'total_customers': 575000,
        'system_peak_mw': 4400,
        'avg_monthly_bill': 130,
        'avg_monthly_usage_kwh': 1100,
        'market': {**SPP_MARKET},
        'has_dc_activity': True,
        'dc_notes': 'Multiple large data center proposals; PSO facing 31% power deficit by 2031 with 779MW of new large load requests',
        'default_dc_mw': 1000,
    },
    {
        'id': 'duke-carolinas',
        'name': 'Duke Energy Carolinas',
        'short_name': 'Duke Carolinas',
        'state': 'North Carolina / South Carolina',
        'region': 'Southeast',
        'residential_customers': 2507000,
        'total_customers': 2926000,
        'system_peak_mw': 20700,
        'avg_monthly_bill': 135,
        'avg_monthly_usage_kwh': 1000,
        'market': {**REGULATED_MARKET},
        'has_dc_activity': True,
        'dc_notes': 'Growing data center presence in Charlotte metro area',
        'default_dc_mw': 1000,
    },
    {
        'id': 'duke-progress',
        'name': 'Duke Energy Progress',
        'short_name': 'Duke Progress',
        'state': 'North Carolina / South Carolina',
        'region': 'Southeast',
        'residential_customers': 1400000,
        'total_customers': 1700000,
        'system_peak_mw': 13800,
        'avg_monthly_bill': 132,
        'avg_monthly_usage_kwh': 1000,
        'market': {**REGULATED_MARKET},
        'has_dc_activity': True,
        'dc_notes': 'Serves Raleigh area with growing tech sector',
        'default_dc_mw': 800,
    },
    {
        'id': 'georgia-power',
        'name': 'Georgia Power',
        'short_name': 'Georgia Power',
        'state': 'Georgia',
        'region': 'Southeast',
        'residential_customers': 2400000,
        'total_customers': 2804000,
        'system_peak_mw': 17100,
        'avg_monthly_bill': 153,
        'avg_monthly_usage_kwh': 1150,
        'market': {**REGULATED_MARKET},
        'has_dc_activity': True,
        'dc_notes': 'Projecting 8,200 MW load growth by 2030 including data centers',
        'default_dc_mw': 1200,
    },
    {
        'id': 'aps-arizona',
        'name': 'Arizona Public Service (APS)',
        'short_name': 'APS Arizona',
        'state': 'Arizona',
        'region': 'Southwest',
        'residential_customers': 1200000,
        'total_customers': 1400000,
        'system_peak_mw': 8212,
        'avg_monthly_bill': 140,
        'avg_monthly_usage_kwh': 1050,
        'market': {**REGULATED_MARKET},
        'has_dc_activity': True,
        'dc_notes': 'Phoenix metro data center growth; 40% peak growth by 2031',
        'default_dc_mw': 800,
    },
    {
        'id': 'nv-energy',
        'name': 'NV Energy',
        'short_name': 'NV Energy Nevada',
        'state': 'Nevada',
        'region': 'West',
        'residential_customers': 610000,
        'total_customers': 2400000,
        'system_peak_mw': 9000,
        'avg_monthly_bill': 125,
        'avg_monthly_usage_kwh': 900,
        'market': {**REGULATED_MARKET},
        'has_dc_activity': True,
        'dc_notes': 'Data centers requesting to triple peak demand',
        'default_dc_mw': 1500,
    },
    {
        'id': 'xcel-colorado',
        'name': 'Xcel Energy Colorado',
        'short_name': 'Xcel Colorado',
        'state': 'Colorado',
        'region': 'Mountain West',
        'residential_customers': 1400000,
        'total_customers': 1600000,
        'system_peak_mw': 7200,
        'avg_monthly_bill': 105,
        'avg_monthly_usage_kwh': 700,
        'market': {**REGULATED_MARKET},
        'has_dc_activity': True,
        'dc_notes': 'Data centers to drive 2/3 of new demand',
        'default_dc_mw': 600,
    },

    # ============================================
    # AEP UTILITIES
    # ============================================
    {
        'id': 'aep-ohio',
        'name': 'AEP Ohio',
        'short_name': 'AEP Ohio',
        'state': 'Ohio',
        'region': 'Midwest',
        'residential_customers': 1200000,
        'total_customers': 1500000,
        'system_peak_mw': 12000,
        'avg_monthly_bill': 135,
        'avg_monthly_usage_kwh': 900,
        'market': {
            **PJM_MARKET,
            'notes': 'AEP Ohio operates in PJM. Ohio is deregulated but AEP owns transmission.'
        },
        'has_dc_activity': True,
        'dc_notes': 'Ohio seeing significant data center growth; AEP proposed new rate class',
        'default_dc_mw': 1000,
    },
    {
        'id': 'aep-indiana-michigan',
        'name': 'Indiana Michigan Power (I&M)',
        'short_name': 'AEP I&M',
        'state': 'Indiana / Michigan',
        'region': 'Midwest',
        'residential_customers': 480000,
        'total_customers': 600000,
        'system_peak_mw': 5500,
        'avg_monthly_bill': 130,
        'avg_monthly_usage_kwh': 950,
        'market': {
            **PJM_MARKET,
            'utility_owns_generation': True,
            'base_residential_allocation': 0.38,
            'notes': 'I&M operates in PJM but owns generation including Cook Nuclear.'
        },
        'has_dc_activity': True,
        'dc_notes': 'Northeast Indiana seeing industrial and data center growth',
        'default_dc_mw': 500,
    },
    {
        'id': 'aep-appalachian',
        'name': 'Appalachian Power (APCo)',
        'short_name': 'AEP Appalachian',
        'state': 'Virginia / West Virginia',
        'region': 'Appalachian',
        'residential_customers': 800000,
        'total_customers': 1000000,
        'system_peak_mw': 7000,
        'avg_monthly_bill': 125,
        'avg_monthly_usage_kwh': 1000,
        'market': {
            **PJM_MARKET,
            'utility_owns_generation': True,
            'base_residential_allocation': 0.40,
            'notes': 'Appalachian Power operates in PJM but WV remains traditionally regulated.'
        },
        'has_dc_activity': True,
        'dc_notes': 'Virginia portion seeing data center interest as NoVA constrained',
        'default_dc_mw': 600,
    },
    {
        'id': 'aep-swepco',
        'name': 'Southwestern Electric Power (SWEPCO)',
        'short_name': 'AEP SWEPCO',
        'state': 'Arkansas / Louisiana / Texas',
        'region': 'Southwest',
        'residential_customers': 400000,
        'total_customers': 540000,
        'system_peak_mw': 4800,
        'avg_monthly_bill': 120,
        'avg_monthly_usage_kwh': 1100,
        'market': {
            **SPP_MARKET,
            'notes': 'SWEPCO operates in SPP. Vertically integrated with state PUC regulation.'
        },
        'has_dc_activity': False,
        'dc_notes': 'Less data center activity than other AEP territories',
        'default_dc_mw': 400,
    },

    # ============================================
    # PJM / ISO MARKET UTILITIES
    # ============================================
    {
        'id': 'dominion-virginia',
        'name': 'Dominion Energy Virginia',
        'short_name': 'Dominion Virginia',
        'state': 'Virginia',
        'region': 'Mid-Atlantic',
        'residential_customers': 2500000,
        'total_customers': 2800000,
        'system_peak_mw': 18000,
        'avg_monthly_bill': 145,
        'avg_monthly_usage_kwh': 1050,
        'market': {
            **PJM_MARKET,
            'utility_owns_generation': True,
            'base_residential_allocation': 0.35,
            'notes': 'Dominion operates in PJM. Data center capital of the world.'
        },
        'has_dc_activity': True,
        'dc_notes': 'Data center capital of the world; forecasting 9GW DC peak in 10 years',
        'default_dc_mw': 1500,
    },

    # ============================================
    # ENERGY-ONLY MARKETS
    # ============================================
    {
        'id': 'ercot-texas',
        'name': 'ERCOT (Texas Grid)',
        'short_name': 'ERCOT Texas',
        'state': 'Texas',
        'region': 'Texas',
        'residential_customers': 12000000,
        'total_customers': 26000000,
        'system_peak_mw': 85508,
        'avg_monthly_bill': 140,
        'avg_monthly_usage_kwh': 1100,
        'market': {
            **ERCOT_MARKET,
            'notes': 'Energy-only market. 46% of projected load growth from data centers.'
        },
        'has_dc_activity': True,
        'dc_notes': 'Data centers account for 46% of projected load growth',
        'default_dc_mw': 3000,
    },

    # ============================================
    # CUSTOM OPTION
    # ============================================
    {
        'id': 'custom',
        'name': 'Custom / Enter Your Own',
        'short_name': 'Custom',
        'state': '',
        'region': '',
        'residential_customers': 500000,
        'total_customers': 600000,
        'system_peak_mw': 4000,
        'avg_monthly_bill': 144,
        'avg_monthly_usage_kwh': 865,
        'market': {**REGULATED_MARKET},
        'has_dc_activity': False,
        'dc_notes': 'Enter your own utility parameters',
        'default_dc_mw': 1000,
    }
]


def get_utility_by_id(utility_id):
    """Get utility profile by ID."""
    for profile in UTILITY_PROFILES:
        if profile['id'] == utility_id:
            return profile
    return None


def get_utility_options():
    """Get list of (display_name, id) tuples for dropdown."""
    return [
        (f"{p['short_name']} ({p['state']})" if p['state'] else p['short_name'], p['id'])
        for p in UTILITY_PROFILES
    ]


def get_utilities_by_region():
    """Get utilities grouped by region."""
    result = {}
    for profile in UTILITY_PROFILES:
        region = profile['region'] or 'Other'
        if region not in result:
            result[region] = []
        result[region].append(profile)
    return result


def get_utilities_by_market_type():
    """Get utilities grouped by market type."""
    result = {}
    for profile in UTILITY_PROFILES:
        market_type = profile['market']['type']
        if market_type not in result:
            result[market_type] = []
        result[market_type].append(profile)
    return result


def get_market_adjusted_allocation(profile, dc_peak_coincidence=1.0):
    """
    Calculate market-adjusted residential allocation.

    In capacity markets (PJM), high capacity prices increase cost pressure on ratepayers.
    In energy-only markets (ERCOT), large loads face market prices more directly.
    """
    market = profile['market']
    allocation = market['base_residential_allocation']

    # Adjust for capacity market costs if applicable
    if market.get('has_capacity_market') and market.get('capacity_price_2024'):
        # Higher capacity prices mean more cost pressure on all ratepayers
        price_multiplier = market['capacity_price_2024'] / 30  # Normalize to historical ~$30/MW-day
        capacity_adjustment = min(0.10, (price_multiplier - 1) * 0.02)
        allocation += capacity_adjustment * market['capacity_cost_pass_through']

    # Energy-only markets have lower allocation for capacity-related costs
    if market['type'] == 'ercot':
        allocation *= 0.85

    # Clamp to reasonable bounds
    return max(0.20, min(0.55, allocation))
