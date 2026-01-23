"""
Community Energy Calculator - Calculator Page
Mirrors the Next.js calculator page with interactive inputs and charts.
"""

import streamlit as st
import plotly.graph_objects as go
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from calculations import (
    DEFAULT_UTILITY, DEFAULT_DATA_CENTER, TIME_PARAMS, SCENARIOS,
    generate_all_trajectories, calculate_summary_stats
)

# Page configuration
st.set_page_config(
    page_title="Calculator - Community Energy",
    page_icon="🔢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Utility profiles (matching Next.js)
UTILITY_PROFILES = [
    {
        'id': 'pso',
        'shortName': 'PSO (Oklahoma)',
        'state': 'OK',
        'residentialCustomers': 560000,
        'averageMonthlyBill': 130,
        'systemPeakMW': 4000,
        'hasDataCenterActivity': True,
        'dataCenterNotes': 'Large hyperscale proposals under review',
    },
    {
        'id': 'dominion',
        'shortName': 'Dominion Energy',
        'state': 'VA',
        'residentialCustomers': 2700000,
        'averageMonthlyBill': 145,
        'systemPeakMW': 21000,
        'hasDataCenterActivity': True,
        'dataCenterNotes': 'Data Center Alley - largest US concentration',
    },
    {
        'id': 'georgia_power',
        'shortName': 'Georgia Power',
        'state': 'GA',
        'residentialCustomers': 2600000,
        'averageMonthlyBill': 140,
        'systemPeakMW': 18000,
        'hasDataCenterActivity': True,
        'dataCenterNotes': 'Major hyperscale developments in Atlanta metro',
    },
    {
        'id': 'custom',
        'shortName': 'Custom Values',
        'state': None,
        'residentialCustomers': 560000,
        'averageMonthlyBill': 130,
        'systemPeakMW': 4000,
        'hasDataCenterActivity': False,
        'dataCenterNotes': None,
    },
]


def format_currency(value):
    """Format large currency values."""
    if abs(value) >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"
    elif abs(value) >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    elif abs(value) >= 1_000:
        return f"${value / 1_000:.1f}K"
    else:
        return f"${value:.0f}"


def format_mw(value):
    """Format MW values."""
    if value >= 1000:
        return f"{value / 1000:.1f} GW"
    else:
        return f"{value:.0f} MW"


def main():
    # Initialize session state
    if 'utility' not in st.session_state:
        st.session_state.utility = DEFAULT_UTILITY.copy()
    if 'datacenter' not in st.session_state:
        st.session_state.datacenter = DEFAULT_DATA_CENTER.copy()
    if 'projection_years' not in st.session_state:
        st.session_state.projection_years = TIME_PARAMS['projection_years']
    if 'selected_profile' not in st.session_state:
        st.session_state.selected_profile = 'pso'

    # Header
    st.markdown("""
    <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 2rem; border-radius: 1rem; color: white; margin-bottom: 2rem;">
        <h1 style="margin: 0 0 1rem 0; font-size: 1.875rem;">Calculator: Your Community's Numbers</h1>
        <p style="color: #d1d5db; font-size: 1.1rem; margin: 0; max-width: 800px;">
            Adjust the parameters below to match your community's utility and the proposed data center.
            See how different configurations affect projected electricity costs.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Sidebar - Input Controls
    with st.sidebar:
        # Utility Profile Selector
        st.markdown("""
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 1rem; border-radius: 0.75rem; border: 2px solid #93c5fd; margin-bottom: 1rem;">
            <p style="font-weight: 600; color: #1e3a8a; margin: 0 0 0.5rem 0; font-size: 0.9rem;">Select Your Utility / Location</p>
        </div>
        """, unsafe_allow_html=True)

        profile_options = {p['id']: f"{p['shortName']} ({p['state']})" if p['state'] else p['shortName'] for p in UTILITY_PROFILES}
        selected_id = st.selectbox(
            "Utility",
            options=list(profile_options.keys()),
            format_func=lambda x: profile_options[x],
            index=list(profile_options.keys()).index(st.session_state.selected_profile),
            label_visibility="collapsed"
        )

        if selected_id != st.session_state.selected_profile:
            st.session_state.selected_profile = selected_id
            if selected_id != 'custom':
                profile = next(p for p in UTILITY_PROFILES if p['id'] == selected_id)
                st.session_state.utility['residential_customers'] = profile['residentialCustomers']
                st.session_state.utility['avg_monthly_bill'] = profile['averageMonthlyBill']
                st.session_state.utility['system_peak_mw'] = profile['systemPeakMW']

        selected_profile = next(p for p in UTILITY_PROFILES if p['id'] == selected_id)
        if selected_id != 'custom':
            st.caption(f"**{selected_profile['residentialCustomers']:,}** residential customers")
            if selected_profile.get('dataCenterNotes'):
                st.caption(f"*{selected_profile['dataCenterNotes']}*")

        st.divider()

        # Section tabs
        section = st.radio(
            "Configuration",
            ["Your Utility", "Data Center", "Projection"],
            horizontal=True,
            label_visibility="collapsed"
        )

        if section == "Your Utility":
            st.subheader("Community & Utility")

            st.session_state.utility['residential_customers'] = st.number_input(
                "Residential Customers",
                min_value=1000,
                max_value=10_000_000,
                value=st.session_state.utility['residential_customers'],
                step=1000,
                help="Number of residential electric accounts"
            )

            st.session_state.utility['avg_monthly_bill'] = st.number_input(
                "Average Monthly Bill ($)",
                min_value=50,
                max_value=500,
                value=st.session_state.utility['avg_monthly_bill'],
                step=5,
                help="Typical residential electricity bill"
            )

            st.session_state.utility['system_peak_mw'] = st.number_input(
                "Current System Peak (MW)",
                min_value=1000,
                max_value=50000,
                value=st.session_state.utility['system_peak_mw'],
                step=500,
                help="Utility's current peak demand"
            )

        elif section == "Data Center":
            st.subheader("Data Center Parameters")

            dc_capacity = st.slider(
                "Data Center Capacity",
                min_value=500,
                max_value=10000,
                value=st.session_state.datacenter['capacity_mw'],
                step=100,
                format="%d MW"
            )
            # Maintain onsite generation ratio when capacity changes
            if dc_capacity != st.session_state.datacenter['capacity_mw']:
                ratio = st.session_state.datacenter.get('onsite_generation_mw', dc_capacity * 0.2) / st.session_state.datacenter['capacity_mw']
                st.session_state.datacenter['capacity_mw'] = dc_capacity
                st.session_state.datacenter['onsite_generation_mw'] = int(dc_capacity * ratio)

            st.divider()
            st.caption("**Firm Load Scenario**")
            st.session_state.datacenter['firm_load_factor'] = st.slider(
                "Firm Load Factor",
                min_value=0.6,
                max_value=0.9,
                value=st.session_state.datacenter.get('firm_load_factor', 0.80),
                step=0.05,
                format="%.0f%%",
                help="Load factor for firm load data center"
            )

            st.divider()
            st.caption("**Flexible Load Scenario**")
            st.session_state.datacenter['flex_load_factor'] = st.slider(
                "Flex Load Factor",
                min_value=0.85,
                max_value=0.98,
                value=st.session_state.datacenter.get('flex_load_factor', 0.95),
                step=0.01,
                format="%.0f%%"
            )

            st.session_state.datacenter['flex_peak_coincidence'] = st.slider(
                "Peak Coincidence (Flex)",
                min_value=0.60,
                max_value=0.95,
                value=st.session_state.datacenter.get('flex_peak_coincidence', 0.75),
                step=0.05,
                format="%.0f%%",
                help="75% = 25% curtailable during peak hours"
            )

            st.divider()
            st.caption("**Dispatchable Generation**")
            max_gen = st.session_state.datacenter['capacity_mw']
            st.session_state.datacenter['onsite_generation_mw'] = st.slider(
                "Onsite Generation (MW)",
                min_value=0,
                max_value=max_gen,
                value=st.session_state.datacenter.get('onsite_generation_mw', int(max_gen * 0.2)),
                step=max(10, int(max_gen / 100))
            )
            gen_pct = (st.session_state.datacenter['onsite_generation_mw'] / st.session_state.datacenter['capacity_mw']) * 100
            st.caption(f"{gen_pct:.0f}% of data center capacity")

        else:  # Projection
            st.subheader("Projection Settings")

            st.session_state.projection_years = st.slider(
                "Projection Period",
                min_value=5,
                max_value=30,
                value=st.session_state.projection_years,
                step=5,
                format="%d years"
            )

            st.divider()
            st.caption("**Key Assumptions**")
            st.markdown("""
            - General inflation: 2.5%/year
            - Transmission cost: $350k/MW peak
            - Demand charge: $9,050/MW-month
            - Firm LF: 80%, Flex LF: 95%
            - Initial residential allocation: 40%
            """)

        # Reset button
        st.divider()
        if st.button("Reset to Default Values", use_container_width=True):
            st.session_state.utility = DEFAULT_UTILITY.copy()
            st.session_state.datacenter = DEFAULT_DATA_CENTER.copy()
            st.session_state.projection_years = TIME_PARAMS['projection_years']
            st.session_state.selected_profile = 'pso'
            st.rerun()

        # Quick presets
        st.divider()
        st.caption("**Quick Presets**")
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("Small Utility", use_container_width=True):
                st.session_state.utility['residential_customers'] = 100000
                st.session_state.utility['avg_monthly_bill'] = 125
                st.session_state.utility['system_peak_mw'] = 1500
                st.session_state.datacenter['capacity_mw'] = 500
                st.session_state.datacenter['onsite_generation_mw'] = 100
                st.rerun()
        with col2:
            if st.button("Large ISO", use_container_width=True):
                st.session_state.utility['residential_customers'] = 2000000
                st.session_state.utility['avg_monthly_bill'] = 150
                st.session_state.utility['system_peak_mw'] = 20000
                st.session_state.datacenter['capacity_mw'] = 5000
                st.session_state.datacenter['onsite_generation_mw'] = 1000
                st.rerun()
        with col3:
            if st.button("High Impact", use_container_width=True):
                st.session_state.utility['residential_customers'] = 300000
                st.session_state.utility['avg_monthly_bill'] = 135
                st.session_state.utility['system_peak_mw'] = 3000
                st.session_state.datacenter['capacity_mw'] = 3000
                st.session_state.datacenter['onsite_generation_mw'] = 600
                st.rerun()

    # Main content - Results
    # Generate trajectories
    trajectories = generate_all_trajectories(
        st.session_state.utility,
        st.session_state.datacenter,
        st.session_state.projection_years
    )
    summary = calculate_summary_stats(trajectories, st.session_state.utility)

    # Trajectory Chart
    st.subheader("Projected Monthly Bill")
    st.caption(f"For a {st.session_state.utility['residential_customers']:,}-customer utility with a {st.session_state.datacenter['capacity_mw']:,} MW data center")

    # Create Plotly figure
    fig = go.Figure()

    # Add traces for each scenario
    colors = {
        'baseline': '#6B7280',
        'unoptimized': '#DC2626',
        'flexible': '#F59E0B',
        'dispatchable': '#10B981',
    }
    names = {
        'baseline': 'No Data Center',
        'unoptimized': 'Typical Data Center',
        'flexible': 'Flexible Data Center',
        'dispatchable': 'Optimized Data Center',
    }

    for scenario_key in ['baseline', 'unoptimized', 'flexible', 'dispatchable']:
        traj = trajectories[scenario_key]
        fig.add_trace(go.Scatter(
            x=traj['years'],
            y=traj['monthly_bills'],
            mode='lines',
            name=names[scenario_key],
            line=dict(color=colors[scenario_key], width=2.5),
            hovertemplate='%{y:$.2f}/mo<extra>' + names[scenario_key] + '</extra>'
        ))

    # Add data center comes online marker
    dc_online_year = TIME_PARAMS['base_year'] + 2
    fig.add_vline(
        x=dc_online_year,
        line_dash="dash",
        line_color="gray",
        annotation_text="Data Center Comes Online",
        annotation_position="top"
    )

    fig.update_layout(
        height=400,
        margin=dict(l=20, r=20, t=40, b=20),
        xaxis_title="Year",
        yaxis_title="Monthly Bill ($)",
        yaxis_tickformat="$,.0f",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="center",
            x=0.5
        ),
        hovermode="x unified"
    )

    st.plotly_chart(fig, use_container_width=True)

    # Summary Cards
    st.subheader(f"Year {TIME_PARAMS['base_year'] + st.session_state.projection_years} Bill Comparison")

    cols = st.columns(4)
    scenarios = [
        ('baseline', 'No Data Center', '#6B7280', '#f3f4f6'),
        ('unoptimized', 'Typical Data Center', '#DC2626', '#fef2f2'),
        ('flexible', 'Flexible Data Center', '#F59E0B', '#fffbeb'),
        ('dispatchable', 'Optimized Data Center', '#10B981', '#f0fdf4'),
    ]

    for i, (key, label, color, bg) in enumerate(scenarios):
        with cols[i]:
            final_bill = summary['final_year_bills'][key]
            if key == 'baseline':
                diff_text = "Baseline"
            else:
                diff = summary['final_year_difference'][key]
                diff_color = "#dc2626" if diff >= 0 else "#16a34a"
                sign = "+" if diff >= 0 else ""
                diff_text = f"{sign}${diff:.2f}/mo"

            st.markdown(f"""
            <div style="background: {bg}; padding: 1.25rem; border-radius: 0.75rem; border: 2px solid {color}40; text-align: center;">
                <p style="color: #6b7280; font-size: 0.85rem; margin: 0 0 0.5rem 0;">{label}</p>
                <p style="font-size: 1.75rem; font-weight: bold; color: {color}; margin: 0;">${final_bill:.0f}</p>
                <p style="color: #9ca3af; font-size: 0.75rem; margin: 0.5rem 0 0 0;">{diff_text}</p>
            </div>
            """, unsafe_allow_html=True)

    st.divider()

    # Key Findings
    st.markdown("""
    <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 0.75rem; border: 2px solid #86efac;">
        <h3 style="color: #15803d; margin: 0 0 1rem 0;">Key Findings for Your Community</h3>
    </div>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns(2)

    with col1:
        disp_diff = summary['final_year_difference']['dispatchable']
        diff_color = "#dc2626" if disp_diff >= 0 else "#16a34a"
        sign = "+" if disp_diff >= 0 else "-"
        st.markdown(f"""
        <div style="background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; margin-bottom: 1rem;">
            <p style="color: #6b7280; font-size: 0.9rem; margin: 0 0 0.5rem 0;">Optimized Data Center vs Baseline</p>
            <p style="font-size: 1.5rem; font-weight: bold; color: {diff_color}; margin: 0;">{sign}${abs(disp_diff):.2f}/mo</p>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.25rem;">vs no data center (best case)</p>
        </div>
        """, unsafe_allow_html=True)

        savings = summary['savings_vs_unoptimized']['dispatchable']
        st.markdown(f"""
        <div style="background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 0.9rem; margin: 0 0 0.5rem 0;">Value of Optimization</p>
            <p style="font-size: 1.5rem; font-weight: bold; color: #16a34a; margin: 0;">${savings:.2f}/mo</p>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.25rem;">optimized vs typical data center</p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        annual_community = savings * 12 * st.session_state.utility['residential_customers']
        st.markdown(f"""
        <div style="background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; margin-bottom: 1rem;">
            <p style="color: #6b7280; font-size: 0.9rem; margin: 0 0 0.5rem 0;">Annual Community Benefit</p>
            <p style="font-size: 1.5rem; font-weight: bold; color: #111827; margin: 0;">{format_currency(annual_community)}</p>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.25rem;">optimized vs firm load, all households</p>
        </div>
        """, unsafe_allow_html=True)

        lifetime = summary['cumulative_costs']['unoptimized'] - summary['cumulative_costs']['dispatchable']
        st.markdown(f"""
        <div style="background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 0.9rem; margin: 0 0 0.5rem 0;">Lifetime Benefit</p>
            <p style="font-size: 1.5rem; font-weight: bold; color: #111827; margin: 0;">{format_currency(lifetime)}</p>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.25rem;">per household over {st.session_state.projection_years} years</p>
        </div>
        """, unsafe_allow_html=True)

    st.divider()

    # Energy View Link
    st.markdown("""
    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%); padding: 1.5rem; border-radius: 0.75rem; border: 2px solid #a5b4fc;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h3 style="color: #4338ca; margin: 0 0 0.25rem 0;">Visualize Grid Impact</h3>
                <p style="color: #6366f1; margin: 0; font-size: 0.9rem;">See hourly load profiles and load duration curves for each scenario</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Energy View", type="primary", use_container_width=True):
        st.switch_page("pages/2_Energy_View.py")

    st.divider()

    # Share / Export section
    col1, col2 = st.columns(2)
    with col1:
        if st.button("View Methodology", use_container_width=True):
            st.switch_page("pages/3_Methodology.py")
    with col2:
        if st.button("Export Summary (Coming Soon)", use_container_width=True, disabled=True):
            pass


if __name__ == "__main__":
    main()
