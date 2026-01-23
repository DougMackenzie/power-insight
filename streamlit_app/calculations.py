"""
Community Energy Calculator - Calculation Engine (Python)

Ported from the JavaScript implementation.
Calculates residential electricity bill impacts from data center development.
"""

import numpy as np
from typing import Dict, Any, List

# ============================================
# CONSTANTS
# ============================================

SCENARIOS = {
    'baseline': {
        'id': 'baseline',
        'name': 'Baseline',
        'color': '#6B7280',
    },
    'unoptimized': {
        'id': 'unoptimized',
        'name': 'Firm Load',
        'color': '#DC2626',
    },
    'flexible': {
        'id': 'flexible',
        'name': 'Flexible Load',
        'color': '#F59E0B',
    },
    'dispatchable': {
        'id': 'dispatchable',
        'name': 'Flex + Generation',
        'color': '#10B981',
    },
}

DEFAULT_UTILITY = {
    'residential_customers': 560000,
    'commercial_customers': 85000,
    'industrial_customers': 5000,
    'avg_monthly_bill': 130,
    'pre_dc_system_energy_gwh': 20000,
    'residential_energy_share': 0.35,
    'system_peak_mw': 4000,
    'base_residential_allocation': 0.40,
}

# Based on EPRI DCFlex research (2024): 25% sustained reduction achievable,
# up to 40% while maintaining AI quality of service
# Sources: IEEE Spectrum, arXiv:2507.00909, Latitude Media/Databricks
DEFAULT_DATA_CENTER = {
    'capacity_mw': 1000,
    'firm_load_factor': 0.80,
    'firm_peak_coincidence': 1.0,
    'flex_load_factor': 0.95,
    'flex_peak_coincidence': 0.75,  # 25% curtailable (DCFlex validated)
    'onsite_generation_mw': 200,
}

INFRASTRUCTURE_COSTS = {
    'transmission_cost_per_mw': 350000,
    'distribution_cost_per_mw': 150000,
    'capacity_cost_per_mw_year': 150000,
    'annual_baseline_upgrade_pct': 0.015,
}

DC_RATE_STRUCTURE = {
    'demand_charge_per_mw_month': 9050,
    'energy_margin_per_mwh': 4.88,
}

TIME_PARAMS = {
    'base_year': 2025,
    'general_inflation': 0.025,
    'projection_years': 10,
}


# ============================================
# RESIDENTIAL ALLOCATION MODEL
# ============================================

def calculate_residential_allocation(
    utility: Dict,
    dc_capacity_mw: float,
    dc_load_factor: float,
    dc_peak_coincidence: float,
    years_online: int = 0
) -> Dict:
    """
    Calculate residential cost allocation based on tariff structure.
    Uses weighted blend: 40% volumetric, 40% demand, 20% customer.
    """
    # Pre-DC system energy (convert GWh to MWh)
    pre_dc_system_energy_mwh = utility['pre_dc_system_energy_gwh'] * 1000
    residential_energy_mwh = pre_dc_system_energy_mwh * utility['residential_energy_share']

    # DC annual energy contribution
    dc_annual_energy_mwh = dc_capacity_mw * dc_load_factor * 8760

    # Post-DC system energy (phases in over time)
    phase_in_factor = min(1.0, years_online / 3)
    post_dc_system_energy_mwh = pre_dc_system_energy_mwh + (dc_annual_energy_mwh * phase_in_factor)

    # Residential volumetric share
    residential_volumetric_share = residential_energy_mwh / post_dc_system_energy_mwh

    # System peak calculations
    pre_dc_peak_mw = utility['system_peak_mw']
    residential_peak_share = 0.45
    residential_peak_mw = pre_dc_peak_mw * residential_peak_share

    # DC contribution to peak
    dc_peak_contribution = dc_capacity_mw * dc_peak_coincidence * phase_in_factor
    post_dc_peak_mw = pre_dc_peak_mw + dc_peak_contribution

    # Residential demand share
    residential_demand_share = residential_peak_mw / post_dc_peak_mw

    # Customer-based share
    total_customers = (utility['residential_customers'] +
                      utility['commercial_customers'] +
                      utility['industrial_customers'] + 1)
    residential_customer_share = utility['residential_customers'] / total_customers

    # Weighted blend (40% volumetric, 40% demand, 20% customer)
    weighted_allocation = (
        residential_volumetric_share * 0.40 +
        residential_demand_share * 0.40 +
        residential_customer_share * 0.20
    )

    # Regulatory lag (5-year phase-in)
    regulatory_lag_factor = min(1.0, years_online / 5)
    base_allocation = utility['base_residential_allocation']
    adjusted_allocation = (base_allocation * (1 - regulatory_lag_factor) +
                          weighted_allocation * regulatory_lag_factor)

    return {
        'allocation': max(0.15, min(0.50, adjusted_allocation)),
        'volumetric_share': residential_volumetric_share,
        'demand_share': residential_demand_share,
        'customer_share': residential_customer_share,
    }


# ============================================
# CORE ECONOMIC MODEL
# ============================================

def calculate_dc_revenue_offset(
    dc_capacity_mw: float,
    load_factor: float,
    peak_coincidence: float
) -> Dict:
    """Calculate revenue contribution from data center."""
    coincident_peak_mw = dc_capacity_mw * peak_coincidence
    annual_demand_revenue = coincident_peak_mw * DC_RATE_STRUCTURE['demand_charge_per_mw_month'] * 12

    annual_mwh = dc_capacity_mw * load_factor * 8760
    annual_energy_margin = annual_mwh * DC_RATE_STRUCTURE['energy_margin_per_mwh']

    return {
        'demand_revenue': annual_demand_revenue,
        'energy_margin': annual_energy_margin,
        'per_year': annual_demand_revenue + annual_energy_margin,
    }


def calculate_net_residential_impact(
    dc_capacity_mw: float,
    load_factor: float,
    peak_coincidence: float,
    residential_customers: int,
    residential_allocation: float,
    include_capacity_credit: bool = False,
    onsite_gen_mw: float = 0,
    utility: Dict = None
) -> Dict:
    """Calculate net impact on residential bills from data center load."""

    # Infrastructure costs
    effective_peak_mw = dc_capacity_mw * peak_coincidence - onsite_gen_mw
    transmission_cost = max(0, effective_peak_mw) * INFRASTRUCTURE_COSTS['transmission_cost_per_mw']
    distribution_cost = max(0, effective_peak_mw) * INFRASTRUCTURE_COSTS['distribution_cost_per_mw']

    # Annualized infrastructure cost (20-year asset life)
    total_infra_cost = transmission_cost + distribution_cost
    annualized_infra_cost = total_infra_cost / 20

    # Market-specific capacity cost calculation
    base_capacity_cost = INFRASTRUCTURE_COSTS['capacity_cost_per_mw_year']
    capacity_cost_pass_through = utility.get('capacity_cost_pass_through', 0.40) if utility else 0.40
    market_type = utility.get('market_type', 'regulated') if utility else 'regulated'

    # In capacity markets (PJM), use actual 2024 capacity price if available
    if utility and utility.get('has_capacity_market') and utility.get('capacity_price_2024'):
        # Convert $/MW-day to $/MW-year
        capacity_price_annual = utility['capacity_price_2024'] * 365
        # Blend the capacity cost with market price
        base_capacity_cost = (INFRASTRUCTURE_COSTS['capacity_cost_per_mw_year'] * 0.5 +
                             capacity_price_annual * capacity_cost_pass_through * 0.5)

    # In energy-only markets (ERCOT), capacity costs are lower
    if market_type == 'ercot':
        base_capacity_cost = INFRASTRUCTURE_COSTS['capacity_cost_per_mw_year'] * 0.60

    # Capacity costs
    demand_charge_annual = DC_RATE_STRUCTURE['demand_charge_per_mw_month'] * 12
    net_capacity_cost_per_mw = max(0, base_capacity_cost - demand_charge_annual)
    capacity_cost_or_credit = max(0, effective_peak_mw) * net_capacity_cost_per_mw

    # DR and generation credits
    if include_capacity_credit:
        curtailable_mw = dc_capacity_mw * (1 - peak_coincidence)
        # Capacity credits are more valuable in capacity markets
        credit_multiplier = 0.90 if (utility and utility.get('has_capacity_market')) else 0.80
        dr_credit = curtailable_mw * base_capacity_cost * credit_multiplier
        gen_credit = onsite_gen_mw * base_capacity_cost * 0.95
        capacity_cost_or_credit = capacity_cost_or_credit - (dr_credit + gen_credit)

    # Revenue offset
    dc_revenue = calculate_dc_revenue_offset(dc_capacity_mw, load_factor, peak_coincidence)

    gross_annual_infra_cost = annualized_infra_cost + capacity_cost_or_credit

    # Energy-only markets have more direct price signals
    energy_margin_flow_through = 0.90 if market_type == 'ercot' else 0.85
    fixed_cost_spreading_benefit = dc_revenue['demand_revenue'] * 0.15
    revenue_offset = (dc_revenue['energy_margin'] * energy_margin_flow_through) + fixed_cost_spreading_benefit

    # Net impact
    net_annual_impact = gross_annual_infra_cost - revenue_offset

    # Apply market-adjusted residential allocation
    adjusted_allocation = residential_allocation
    if market_type == 'ercot':
        # ERCOT: Large loads face market prices more directly
        adjusted_allocation = residential_allocation * 0.85
    elif utility and utility.get('has_capacity_market') and utility.get('capacity_price_2024', 0) > 100:
        # High capacity market prices increase allocation
        price_multiplier = min(1.15, 1 + (utility['capacity_price_2024'] - 100) / 1000)
        adjusted_allocation = residential_allocation * price_multiplier

    residential_impact = net_annual_impact * adjusted_allocation
    per_customer_monthly = residential_impact / residential_customers / 12

    return {
        'per_customer_monthly': per_customer_monthly,
        'gross_cost': gross_annual_infra_cost,
        'revenue_offset': revenue_offset,
        'net_impact': net_annual_impact,
        'market_type': market_type,
        'adjusted_allocation': adjusted_allocation,
    }


# ============================================
# TRAJECTORY CALCULATIONS
# ============================================

def calculate_baseline_trajectory(
    utility: Dict,
    years: int = 10
) -> Dict:
    """Calculate baseline cost trajectory without data center."""
    base_year = TIME_PARAMS['base_year']
    avg_bill = utility['avg_monthly_bill']

    baseline_increase_rate = (
        TIME_PARAMS['general_inflation'] +
        INFRASTRUCTURE_COSTS['annual_baseline_upgrade_pct'] +
        0.005  # Grid modernization
    )

    years_list = []
    monthly_bills = []

    for year in range(years + 1):
        years_list.append(base_year + year)
        if year == 0:
            monthly_bills.append(avg_bill)
        else:
            bill = avg_bill * ((1 + baseline_increase_rate) ** year)
            monthly_bills.append(bill)

    return {
        'years': years_list,
        'monthly_bills': monthly_bills,
        'scenario': 'baseline',
    }


def calculate_unoptimized_trajectory(
    utility: Dict,
    datacenter: Dict,
    years: int = 10
) -> Dict:
    """Calculate trajectory for firm load scenario."""
    base_year = TIME_PARAMS['base_year']
    baseline = calculate_baseline_trajectory(utility, years)

    firm_lf = datacenter.get('firm_load_factor', 0.80)
    firm_peak = datacenter.get('firm_peak_coincidence', 1.0)

    years_list = []
    monthly_bills = []

    for year in range(years + 1):
        years_list.append(base_year + year)

        if year < 2:
            monthly_bills.append(baseline['monthly_bills'][year])
        else:
            phase_in = 0.5 if year == 2 else 1.0
            years_online = year - 2

            allocation_result = calculate_residential_allocation(
                utility, datacenter['capacity_mw'], firm_lf, firm_peak, years_online
            )

            impact_result = calculate_net_residential_impact(
                datacenter['capacity_mw'],
                firm_lf,
                firm_peak,
                utility['residential_customers'],
                allocation_result['allocation'],
                False,
                0,
                utility
            )

            dc_impact = impact_result['per_customer_monthly'] * phase_in

            # Escalate with inflation
            if dc_impact > 0:
                dc_impact *= (1 + TIME_PARAMS['general_inflation']) ** years_online
            else:
                dc_impact *= (1 + TIME_PARAMS['general_inflation'] * 0.8) ** years_online

            monthly_bills.append(baseline['monthly_bills'][year] + dc_impact)

    return {
        'years': years_list,
        'monthly_bills': monthly_bills,
        'scenario': 'unoptimized',
    }


def calculate_flexible_trajectory(
    utility: Dict,
    datacenter: Dict,
    years: int = 10
) -> Dict:
    """Calculate trajectory for flexible load scenario."""
    base_year = TIME_PARAMS['base_year']
    baseline = calculate_baseline_trajectory(utility, years)

    flex_lf = datacenter.get('flex_load_factor', 0.95)
    flex_peak = datacenter.get('flex_peak_coincidence', 0.75)  # 25% curtailable (DCFlex validated)

    years_list = []
    monthly_bills = []

    for year in range(years + 1):
        years_list.append(base_year + year)

        if year < 2:
            monthly_bills.append(baseline['monthly_bills'][year])
        else:
            phase_in = 0.5 if year == 2 else 1.0
            years_online = year - 2

            allocation_result = calculate_residential_allocation(
                utility, datacenter['capacity_mw'], flex_lf, flex_peak, years_online
            )

            impact_result = calculate_net_residential_impact(
                datacenter['capacity_mw'],
                flex_lf,
                flex_peak,
                utility['residential_customers'],
                allocation_result['allocation'],
                True,  # Include capacity credit
                0,
                utility
            )

            dc_impact = impact_result['per_customer_monthly'] * phase_in

            if dc_impact > 0:
                dc_impact *= (1 + TIME_PARAMS['general_inflation']) ** years_online
            else:
                dc_impact *= (1 + TIME_PARAMS['general_inflation'] * 0.9) ** years_online

            monthly_bills.append(baseline['monthly_bills'][year] + dc_impact)

    return {
        'years': years_list,
        'monthly_bills': monthly_bills,
        'scenario': 'flexible',
    }


def calculate_dispatchable_trajectory(
    utility: Dict,
    datacenter: Dict,
    years: int = 10
) -> Dict:
    """Calculate trajectory for flexible + generation scenario."""
    base_year = TIME_PARAMS['base_year']
    baseline = calculate_baseline_trajectory(utility, years)

    flex_lf = datacenter.get('flex_load_factor', 0.95)
    flex_peak = datacenter.get('flex_peak_coincidence', 0.75)  # 25% curtailable (DCFlex validated)
    onsite_gen = datacenter.get('onsite_generation_mw', datacenter['capacity_mw'] * 0.2)

    years_list = []
    monthly_bills = []

    for year in range(years + 1):
        years_list.append(base_year + year)

        if year < 2:
            monthly_bills.append(baseline['monthly_bills'][year])
        else:
            phase_in = 0.5 if year == 2 else 1.0
            years_online = year - 2

            # Effective peak with onsite generation
            effective_peak = max(0, flex_peak - (onsite_gen / datacenter['capacity_mw']))

            allocation_result = calculate_residential_allocation(
                utility, datacenter['capacity_mw'], flex_lf, effective_peak, years_online
            )

            impact_result = calculate_net_residential_impact(
                datacenter['capacity_mw'],
                flex_lf,
                flex_peak,
                utility['residential_customers'],
                allocation_result['allocation'],
                True,
                onsite_gen,
                utility
            )

            dc_impact = impact_result['per_customer_monthly'] * phase_in

            if dc_impact > 0:
                dc_impact *= (1 + TIME_PARAMS['general_inflation']) ** years_online
            else:
                dc_impact *= (1 + TIME_PARAMS['general_inflation'] * 0.95) ** years_online

            monthly_bills.append(baseline['monthly_bills'][year] + dc_impact)

    return {
        'years': years_list,
        'monthly_bills': monthly_bills,
        'scenario': 'dispatchable',
    }


# ============================================
# COMBINED FUNCTIONS
# ============================================

def generate_all_trajectories(utility: Dict, datacenter: Dict, years: int = None) -> Dict:
    """Generate all four scenario trajectories."""
    if years is None:
        years = TIME_PARAMS.get('projection_years', 10)

    return {
        'baseline': calculate_baseline_trajectory(utility, years),
        'unoptimized': calculate_unoptimized_trajectory(utility, datacenter, years),
        'flexible': calculate_flexible_trajectory(utility, datacenter, years),
        'dispatchable': calculate_dispatchable_trajectory(utility, datacenter, years),
    }


# ============================================
# SUMMARY STATISTICS
# ============================================

def calculate_summary_stats(trajectories: Dict, utility: Dict) -> Dict:
    """Calculate summary statistics from trajectories."""
    final_idx = -1

    baseline_final = trajectories['baseline']['monthly_bills'][final_idx]
    unoptimized_final = trajectories['unoptimized']['monthly_bills'][final_idx]
    flexible_final = trajectories['flexible']['monthly_bills'][final_idx]
    dispatchable_final = trajectories['dispatchable']['monthly_bills'][final_idx]

    return {
        'current_monthly_bill': utility['avg_monthly_bill'],

        'final_year_bills': {
            'baseline': baseline_final,
            'unoptimized': unoptimized_final,
            'flexible': flexible_final,
            'dispatchable': dispatchable_final,
        },

        'final_year_difference': {
            'unoptimized': unoptimized_final - baseline_final,
            'flexible': flexible_final - baseline_final,
            'dispatchable': dispatchable_final - baseline_final,
        },

        'savings_vs_unoptimized': {
            'flexible': unoptimized_final - flexible_final,
            'dispatchable': unoptimized_final - dispatchable_final,
        },

        'cumulative_costs': {
            'baseline': sum(b * 12 for b in trajectories['baseline']['monthly_bills']),
            'unoptimized': sum(b * 12 for b in trajectories['unoptimized']['monthly_bills']),
            'flexible': sum(b * 12 for b in trajectories['flexible']['monthly_bills']),
            'dispatchable': sum(b * 12 for b in trajectories['dispatchable']['monthly_bills']),
        },
    }
