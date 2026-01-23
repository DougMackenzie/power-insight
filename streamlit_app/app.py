"""
Community Energy Calculator - Streamlit App

Analyzes the impact of data center development on residential electricity bills.
Compares four scenarios: Baseline, Firm Load, Flexible Load, and Flex + Generation.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from calculations import (
    calculate_baseline_trajectory,
    calculate_unoptimized_trajectory,
    calculate_flexible_trajectory,
    calculate_dispatchable_trajectory,
    calculate_summary_stats,
    DEFAULT_UTILITY,
    DEFAULT_DATA_CENTER,
    SCENARIOS,
    INFRASTRUCTURE_COSTS,
    DC_RATE_STRUCTURE,
)
from utility_data import UTILITY_PROFILES, get_utility_by_id, get_utility_options

# Page config
st.set_page_config(
    page_title="Community Energy Calculator",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        border: 1px solid #e9ecef;
    }
    .metric-value {
        font-size: 2rem;
        font-weight: bold;
    }
    .metric-label {
        font-size: 0.9rem;
        color: #6c757d;
    }
    .scenario-baseline { color: #6B7280; }
    .scenario-firm { color: #DC2626; }
    .scenario-flex { color: #F59E0B; }
    .scenario-dispatch { color: #10B981; }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'utility' not in st.session_state:
    st.session_state.utility = DEFAULT_UTILITY.copy()
if 'datacenter' not in st.session_state:
    st.session_state.datacenter = DEFAULT_DATA_CENTER.copy()
if 'projection_years' not in st.session_state:
    st.session_state.projection_years = 10
if 'selected_utility_id' not in st.session_state:
    st.session_state.selected_utility_id = 'pso-oklahoma'


def apply_utility_profile(utility_id):
    """Apply a utility profile to the session state."""
    profile = get_utility_by_id(utility_id)
    if profile:
        st.session_state.utility['residential_customers'] = profile['residential_customers']
        st.session_state.utility['system_peak_mw'] = profile['system_peak_mw']
        st.session_state.utility['avg_monthly_bill'] = profile['avg_monthly_bill']
        st.session_state.utility['avg_monthly_usage'] = profile['avg_monthly_usage_kwh']
        # Market structure fields
        st.session_state.utility['base_residential_allocation'] = profile['market']['base_residential_allocation']
        st.session_state.utility['market_type'] = profile['market']['type']
        st.session_state.utility['has_capacity_market'] = profile['market']['has_capacity_market']
        st.session_state.utility['capacity_cost_pass_through'] = profile['market']['capacity_cost_pass_through']
        st.session_state.utility['capacity_price_2024'] = profile['market'].get('capacity_price_2024')
        st.session_state.datacenter['capacity_mw'] = profile['default_dc_mw']
        st.session_state.datacenter['onsite_generation_mw'] = int(profile['default_dc_mw'] * 0.2)
        st.session_state.selected_utility_id = utility_id


# Sidebar for inputs
with st.sidebar:
    st.title("⚡ Calculator Settings")

    # Location/Utility Selector
    st.header("📍 Select Your Utility")

    utility_options = get_utility_options()
    utility_names = [name for name, _ in utility_options]
    utility_ids = [uid for _, uid in utility_options]

    # Find current index
    current_idx = utility_ids.index(st.session_state.selected_utility_id) if st.session_state.selected_utility_id in utility_ids else 0

    selected_name = st.selectbox(
        "Utility / Location",
        options=utility_names,
        index=current_idx,
        key="utility_selector"
    )

    # Get the ID for the selected name
    selected_idx = utility_names.index(selected_name)
    new_utility_id = utility_ids[selected_idx]

    # Check if selection changed
    if new_utility_id != st.session_state.selected_utility_id:
        apply_utility_profile(new_utility_id)
        st.rerun()

    # Show utility info
    selected_profile = get_utility_by_id(st.session_state.selected_utility_id)
    if selected_profile and selected_profile['id'] != 'custom':
        market_type_labels = {
            'regulated': 'Regulated (Vertically Integrated)',
            'pjm': 'PJM Capacity Market',
            'ercot': 'ERCOT Energy-Only',
            'miso': 'MISO Capacity Market',
            'spp': 'SPP Energy Market'
        }
        market_type = selected_profile['market']['type']
        market_label = market_type_labels.get(market_type, market_type.upper())
        st.info(f"**{selected_profile['residential_customers']:,}** residential customers\n\n**Market:** {market_label}")
        if selected_profile['has_dc_activity'] and selected_profile['dc_notes']:
            st.caption(f"_{selected_profile['dc_notes']}_")

    st.divider()
    st.header("Utility Parameters")

    st.session_state.utility['residential_customers'] = st.number_input(
        "Residential Customers",
        min_value=10000,
        max_value=5000000,
        value=st.session_state.utility['residential_customers'],
        step=10000,
        format="%d"
    )

    st.session_state.utility['system_peak_mw'] = st.slider(
        "System Peak (MW)",
        min_value=1000,
        max_value=50000,
        value=st.session_state.utility['system_peak_mw'],
        step=500
    )

    st.session_state.utility['avg_monthly_bill'] = st.slider(
        "Avg Monthly Bill ($)",
        min_value=50,
        max_value=300,
        value=st.session_state.utility['avg_monthly_bill'],
        step=5
    )

    st.divider()
    st.header("Data Center Parameters")

    st.session_state.datacenter['capacity_mw'] = st.slider(
        "Data Center Capacity (MW)",
        min_value=500,
        max_value=10000,
        value=st.session_state.datacenter['capacity_mw'],
        step=100
    )

    # Auto-scale onsite generation
    max_onsite = st.session_state.datacenter['capacity_mw']
    default_onsite = min(
        st.session_state.datacenter.get('onsite_generation_mw', int(max_onsite * 0.2)),
        max_onsite
    )

    st.session_state.datacenter['onsite_generation_mw'] = st.slider(
        "Onsite Generation (MW)",
        min_value=0,
        max_value=max_onsite,
        value=default_onsite,
        step=max(10, max_onsite // 100)
    )

    onsite_pct = (st.session_state.datacenter['onsite_generation_mw'] /
                  st.session_state.datacenter['capacity_mw'] * 100)
    st.caption(f"{onsite_pct:.0f}% of DC capacity")

    st.divider()
    st.header("Projection")

    st.session_state.projection_years = st.slider(
        "Projection Years",
        min_value=5,
        max_value=25,
        value=st.session_state.projection_years,
        step=1
    )

    if st.button("Reset to Defaults", type="secondary"):
        st.session_state.utility = DEFAULT_UTILITY.copy()
        st.session_state.datacenter = DEFAULT_DATA_CENTER.copy()
        st.session_state.projection_years = 10
        st.session_state.selected_utility_id = 'pso-oklahoma'
        st.rerun()

# Calculate trajectories
trajectories = {
    'baseline': calculate_baseline_trajectory(
        st.session_state.utility,
        st.session_state.projection_years
    ),
    'unoptimized': calculate_unoptimized_trajectory(
        st.session_state.utility,
        st.session_state.datacenter,
        st.session_state.projection_years
    ),
    'flexible': calculate_flexible_trajectory(
        st.session_state.utility,
        st.session_state.datacenter,
        st.session_state.projection_years
    ),
    'dispatchable': calculate_dispatchable_trajectory(
        st.session_state.utility,
        st.session_state.datacenter,
        st.session_state.projection_years
    ),
}

summary = calculate_summary_stats(trajectories, st.session_state.utility)

# Main content
st.title("Community Energy Calculator")
st.markdown("""
Analyze how data center development affects residential electricity bills.
Compare scenarios from traditional "firm" load to flexible operations with demand response and onsite generation.
""")

# Navigation tabs
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "📊 Overview",
    "📈 Baseline",
    "🔴 Firm Load",
    "🟡 Flexible Load",
    "🟢 Flex + Generation",
    "📚 Methodology"
])

# Tab 1: Overview
with tab1:
    st.header("What Does a Data Center Mean for Your Electric Bill?")
    st.markdown("""
    A new data center has been proposed in your community. As a homeowner or community leader,
    you deserve to understand how this could affect the electricity costs for you and your neighbors.
    """)

    # Calculate baseline comparisons
    baseline_final = summary['final_year_bills']['baseline']
    firm_diff = summary['final_year_bills']['unoptimized'] - baseline_final
    flex_diff = summary['final_year_bills']['flexible'] - baseline_final
    dispatch_diff = summary['final_year_bills']['dispatchable'] - baseline_final

    st.subheader("The Bottom Line for Your Household")
    st.markdown(f"""
    Based on a **{st.session_state.datacenter['capacity_mw']:,} MW** data center in a utility territory that serves
    **{st.session_state.utility['residential_customers']:,}** residential customers,
    here's what your monthly bill could look like in **{st.session_state.projection_years} years**:
    """)

    # Key metrics - showing baseline comparisons
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "Your Bill Today",
            f"${st.session_state.utility['avg_monthly_bill']}/mo",
            delta=None
        )

    with col2:
        st.metric(
            f"Without DC ({st.session_state.projection_years}yr)",
            f"${baseline_final:.0f}/mo",
            delta="Baseline",
            delta_color="off"
        )

    with col3:
        st.metric(
            f"Firm Load ({st.session_state.projection_years}yr)",
            f"${summary['final_year_bills']['unoptimized']:.0f}/mo",
            delta=f"{'+' if firm_diff >= 0 else ''}{firm_diff:.2f} vs baseline",
            delta_color="inverse"
        )

    with col4:
        st.metric(
            f"Optimized DC ({st.session_state.projection_years}yr)",
            f"${summary['final_year_bills']['dispatchable']:.0f}/mo",
            delta=f"{'+' if dispatch_diff >= 0 else ''}{dispatch_diff:.2f} vs baseline",
            delta_color="inverse" if dispatch_diff < 0 else "normal"
        )

    # Key takeaway
    dispatch_savings = summary['savings_vs_unoptimized']['dispatchable']
    cumulative_savings = summary['cumulative_costs']['unoptimized'] - summary['cumulative_costs']['dispatchable']

    st.warning(f"""**Why does it matter HOW the data center operates?**

The difference between a "firm load" data center (always on, no flexibility) and an "optimized" data center (with demand response and backup generation) could mean **${dispatch_savings:.2f} {'less' if dispatch_savings > 0 else 'more'}** per month on your electric bill. Over {st.session_state.projection_years} years, that's **${cumulative_savings/st.session_state.utility['residential_customers']:.0f}** per household.""")

    st.divider()

    # Chart
    st.subheader("Your Monthly Bill Over Time: Four Possible Futures")

    # Create DataFrame for plotting
    df = pd.DataFrame({
        'Year': trajectories['baseline']['years'],
        'Baseline (No DC)': trajectories['baseline']['monthly_bills'],
        'Firm Load': trajectories['unoptimized']['monthly_bills'],
        'Flexible Load': trajectories['flexible']['monthly_bills'],
        'Flex + Generation': trajectories['dispatchable']['monthly_bills'],
    })

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df['Year'], y=df['Baseline (No DC)'],
        name='Baseline (No DC)',
        line=dict(color=SCENARIOS['baseline']['color'], dash='dash'),
        mode='lines'
    ))

    fig.add_trace(go.Scatter(
        x=df['Year'], y=df['Firm Load'],
        name='Firm Load',
        line=dict(color=SCENARIOS['unoptimized']['color'], width=2),
        mode='lines'
    ))

    fig.add_trace(go.Scatter(
        x=df['Year'], y=df['Flexible Load'],
        name='Flexible Load',
        line=dict(color=SCENARIOS['flexible']['color'], width=2),
        mode='lines'
    ))

    fig.add_trace(go.Scatter(
        x=df['Year'], y=df['Flex + Generation'],
        name='Flex + Generation',
        line=dict(color=SCENARIOS['dispatchable']['color'], width=3),
        mode='lines'
    ))

    # Add reference line for current bill
    fig.add_hline(
        y=st.session_state.utility['avg_monthly_bill'],
        line_dash="dot",
        line_color="gray",
        annotation_text="Current",
        annotation_position="right"
    )

    fig.update_layout(
        xaxis_title="Year",
        yaxis_title="Monthly Bill ($)",
        hovermode='x unified',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        height=450
    )

    st.plotly_chart(fig, use_container_width=True)

    # Scenario comparison cards
    st.subheader("Understanding the Four Scenarios")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown(f"""
        **Baseline: No New Data Center**
        - Normal inflation and infrastructure aging
        - Your comparison point
        - Bill in {st.session_state.projection_years} years: **${baseline_final:.0f}/mo**
        """)

        if firm_diff >= 0:
            st.error(f"""
            **Firm Load: No Flexibility**
            - Runs 24/7 at full power, no peak reduction
            - Requires the most infrastructure investment
            - Bill: **${summary['final_year_bills']['unoptimized']:.0f}/mo** (+${firm_diff:.2f} vs baseline)
            """)
        else:
            st.success(f"""
            **Firm Load: No Flexibility**
            - Runs 24/7 at full power, no peak reduction
            - Still provides revenue to offset costs
            - Bill: **${summary['final_year_bills']['unoptimized']:.0f}/mo** (${firm_diff:.2f} vs baseline)
            """)

    with col2:
        flex_diff_display = summary['final_year_bills']['flexible'] - baseline_final
        if flex_diff_display >= 0:
            st.warning(f"""
            **Flexible Load: With Demand Response**
            - Can reduce power 25% during peaks
            - Less infrastructure needed
            - Bill: **${summary['final_year_bills']['flexible']:.0f}/mo** (+${flex_diff_display:.2f} vs baseline)
            """)
        else:
            st.success(f"""
            **Flexible Load: With Demand Response**
            - Can reduce power 25% during peaks
            - Less infrastructure needed
            - Bill: **${summary['final_year_bills']['flexible']:.0f}/mo** (${flex_diff_display:.2f} vs baseline)
            """)

        st.success(f"""
        **Optimized: Flexibility + Onsite Generation**
        - Demand response plus backup generators
        - Maximum benefit for all ratepayers
        - Bill: **${summary['final_year_bills']['dispatchable']:.0f}/mo** ({'+' if dispatch_diff >= 0 else ''}{dispatch_diff:.2f} vs baseline)
        """)

    # Questions for community leaders
    st.divider()
    st.subheader("Questions to Ask About a Data Center Proposal")

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        **For the Developer:**
        - Will your facility participate in demand response programs?
        - What percentage of load can be curtailed during peak periods?
        - Will you have onsite generation that can support the grid?
        - What demand charges will you be paying?
        """)
    with col2:
        st.markdown("""
        **For the Utility/Regulators:**
        - How will infrastructure costs be allocated to ratepayers?
        - Are there interconnection requirements for flexibility?
        - What rate structure will the data center be on?
        - How will residential allocation change over time?
        """)

    # Community impact
    annual_community_savings = dispatch_savings * 12 * st.session_state.utility['residential_customers']
    st.info(f"""
    **Community-Wide Impact:** If the utility requires flexible operations with dispatchable generation,
    the {st.session_state.utility['residential_customers']:,} residential customers could collectively save
    **${annual_community_savings/1e6:.1f}M per year** compared to allowing unoptimized firm load.
    """)

# Tab 2: Baseline
with tab2:
    st.header("Baseline: No Data Center")
    st.markdown("""
    This scenario projects your electricity costs without any new large industrial load.
    Even without data centers, bills increase due to:
    - **General inflation:** ~2.5%/year
    - **Infrastructure aging:** ~1.5%/year for replacement and upgrades
    - **Grid modernization:** ~0.5%/year for smart grid investments
    """)

    baseline_final = trajectories['baseline']['monthly_bills'][-1]
    baseline_start = trajectories['baseline']['monthly_bills'][0]
    total_increase = baseline_final - baseline_start
    pct_increase = (total_increase / baseline_start) * 100

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Starting Bill", f"${baseline_start:.0f}/mo")
    with col2:
        st.metric(f"Bill in {st.session_state.projection_years} Years", f"${baseline_final:.0f}/mo")
    with col3:
        st.metric("Total Increase", f"+${total_increase:.0f}", f"+{pct_increase:.1f}%")

    # Simple baseline chart
    fig_baseline = go.Figure()
    fig_baseline.add_trace(go.Scatter(
        x=trajectories['baseline']['years'],
        y=trajectories['baseline']['monthly_bills'],
        fill='tozeroy',
        line=dict(color=SCENARIOS['baseline']['color']),
        name='Monthly Bill'
    ))
    fig_baseline.update_layout(
        xaxis_title="Year",
        yaxis_title="Monthly Bill ($)",
        height=350
    )
    st.plotly_chart(fig_baseline, use_container_width=True)

# Tab 3: Firm Load
with tab3:
    st.header("Firm Load: Traditional Data Center")
    st.markdown(f"""
    When a **{st.session_state.datacenter['capacity_mw']:,} MW** data center operates as "firm" load:
    - Runs at **80% load factor** (less efficient scheduling)
    - **100%** of capacity adds to system peak
    - Requires full infrastructure buildout
    - No flexibility for grid support
    """)

    firm_final = summary['final_year_bills']['unoptimized']
    firm_diff = summary['final_year_difference']['unoptimized']

    col1, col2, col3 = st.columns(3)
    with col1:
        if firm_diff >= 0:
            st.metric("Additional Monthly Cost", f"+${firm_diff:.2f}", "vs baseline")
        else:
            st.metric("Monthly Savings", f"-${abs(firm_diff):.2f}", "vs baseline")
    with col2:
        st.metric("Peak Demand Added", f"{st.session_state.datacenter['capacity_mw']:,} MW", "100% to peak")
    with col3:
        infra_cost = st.session_state.datacenter['capacity_mw'] * 500000  # Approx T&D cost
        st.metric("Infrastructure Required", f"${infra_cost/1e6:.0f}M", "transmission & distribution")

    st.warning("""
    **Why Firm Load is Less Optimal:**
    1. Adds 100% of capacity to peak demand
    2. Triggers expensive infrastructure investments
    3. Lower load factor = less energy revenue per MW
    4. Cannot help during grid emergencies
    """)

# Tab 4: Flexible Load
with tab4:
    st.header("Flexible Load: Demand Response")
    st.markdown(f"""
    With demand response capability, the **{st.session_state.datacenter['capacity_mw']:,} MW** data center:
    - Operates at **95% load factor** (higher efficiency)
    - Only **75%** at peak (25% curtailable - validated by EPRI DCFlex 2024)
    - Provides capacity value through DR
    - Can reduce load during grid stress
    """)

    flex_final = summary['final_year_bills']['flexible']
    flex_diff = summary['final_year_difference']['flexible']
    flex_vs_firm = summary['savings_vs_unoptimized']['flexible']

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("vs Baseline", f"${flex_diff:+.2f}/mo")
    with col2:
        st.metric("vs Firm Load", f"Save ${flex_vs_firm:.2f}/mo")
    with col3:
        curtailable = st.session_state.datacenter['capacity_mw'] * 0.25  # Updated to 25%
        st.metric("Curtailable Capacity", f"{curtailable:.0f} MW", "DR resource")

    st.success("""
    **Benefits of Flexible Load:**
    - Higher load factor = more energy revenue
    - Lower peak contribution = less infrastructure
    - DR capacity credit = additional value
    - Grid support during emergencies
    """)

# Tab 5: Flex + Generation
with tab5:
    st.header("Flex + Generation: Best Case")
    st.markdown(f"""
    Adding **{st.session_state.datacenter['onsite_generation_mw']:,} MW** of onsite generation to flexible operations:
    - All benefits of flexible load
    - Onsite generation reduces grid draw at peak
    - Can export power during emergencies
    - Maximum capacity credit value
    """)

    dispatch_final = summary['final_year_bills']['dispatchable']
    dispatch_diff = summary['final_year_difference']['dispatchable']
    dispatch_vs_firm = summary['savings_vs_unoptimized']['dispatchable']

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("vs Baseline", f"${dispatch_diff:+.2f}/mo")
    with col2:
        st.metric("vs Firm Load", f"Save ${dispatch_vs_firm:.2f}/mo")
    with col3:
        net_peak = max(0, st.session_state.datacenter['capacity_mw'] * 0.75 -
                      st.session_state.datacenter['onsite_generation_mw'])
        st.metric("Net Peak Draw", f"{net_peak:.0f} MW", "after onsite gen")

    st.success(f"""
    **This is the best outcome for ratepayers!**
    With {st.session_state.datacenter['onsite_generation_mw']:,} MW of onsite generation plus demand response,
    the data center provides maximum value to the grid while minimizing infrastructure costs.
    """)

# Tab 6: Methodology
with tab6:
    st.header("Methodology & Data Sources")
    st.markdown("""
    This tool uses industry-standard methodologies and publicly available data
    to project electricity cost impacts. Below we explain our models, assumptions,
    and data sources so you can verify and critique our approach.
    """)

    with st.expander("Core Calculation Logic", expanded=True):
        st.markdown("""
        **Basic Formula:**
        ```
        Monthly Impact = (Infrastructure Costs - DC Revenue Offset) × Residential Share / Customers / 12
        ```

        **Key Insight - Firm vs Flexible (based on EPRI DCFlex 2024 research):**
        - **Firm load:** 80% load factor, 100% contributes to peak demand
        - **Flexible load:** 95% load factor, only 75% at peak (25% curtailable - DCFlex validated)
        - Same grid can support 33% MORE flexible capacity than firm

        **Revenue Offset:**
        - Demand charges: $9,050/MW-month (based on coincident peak)
        - Energy margin: $4.88/MWh (utility's wholesale spread)
        - Higher load factor = more energy = more revenue

        **Residential Allocation (Calculated from Tariff Structure):**
        - Starts at ~40% (typical for utilities per FERC/EIA data)
        - **Calculated** based on weighted blend: 40% volumetric, 40% demand, 20% customer
        - As DC adds energy → residential volumetric share decreases
        - As DC adds to peak → residential demand share decreases
        - Regulatory lag: changes phase in over ~5 years through rate cases

        The baseline trajectory includes 2.5% annual inflation and 1.5% annual
        infrastructure replacement costs.
        """)

    with st.expander("Data Sources & Specific Values Used", expanded=True):
        st.info("""
        **Transparency Note:** Below we document data sources where available.
        Values marked with ⚠️ **Model Assumption** are based on industry understanding or selected from
        published ranges, but not directly cited from a specific source. You can substitute your own values using the sidebar.
        """)

        # EIA Data
        st.subheader("Energy Information Administration (EIA)")
        st.markdown("[U.S. Department of Energy - Electricity Data Browser](https://www.eia.gov/electricity/data.php)")
        eia_data = {
            "Data Point": [
                "Average residential monthly bill",
                "Residential share of total sales",
                "Typical residential customer count",
                "Electricity price inflation (historical)"
            ],
            "Value Used": [
                f"${DEFAULT_UTILITY['avg_monthly_bill']}",
                f"{DEFAULT_UTILITY['residential_energy_share']*100:.0f}%",
                f"{DEFAULT_UTILITY['residential_customers']:,}",
                "3.0%/yr"
            ],
            "How We Use It": [
                "Starting point for projections",
                "Volumetric allocation calculation",
                "Per-household cost division",
                "Baseline trajectory escalation"
            ]
        }
        st.table(eia_data)

        # Infrastructure & Allocation Data
        st.subheader("Infrastructure & Allocation Data")
        st.markdown("[MISO MTEP](https://cdn.misoenergy.org/MTEP23%20Executive%20Summary630586.pdf) | [NREL Distribution Costs](https://docs.nrel.gov/docs/fy18osti/70710.pdf) | [RAP Cost Allocation](https://www.raponline.org/knowledge-center/electric-cost-allocation-new-era/)")
        infra_data = {
            "Data Point": [
                "Transmission cost per MW",
                "Distribution cost per MW",
                "Base residential allocation",
                "Allocation weighting (vol/demand/cust)",
                "Annual infrastructure upgrade rate"
            ],
            "Value Used": [
                f"${INFRASTRUCTURE_COSTS['transmission_cost_per_mw']:,}/MW",
                f"${INFRASTRUCTURE_COSTS['distribution_cost_per_mw']:,}/MW",
                f"{DEFAULT_UTILITY['base_residential_allocation']*100:.0f}%",
                "40% / 40% / 20%",
                f"{INFRASTRUCTURE_COSTS['annual_baseline_upgrade_pct']*100:.1f}%"
            ],
            "Source / Note": [
                "MISO MTEP23 range $200-500k; ⚠️ $350k selected as median",
                "NREL study ranges; ⚠️ $150k inferred",
                "⚠️ Model Assumption (typical for regulated utilities)",
                "⚠️ Model Assumption (simplified blend)",
                "Brattle 1-2% range; ⚠️ 1.5% selected as midpoint"
            ]
        }
        st.table(infra_data)

        # PJM/MISO Data
        st.subheader("Capacity Markets & Rate Structure")
        st.markdown("[PJM Auction Results](https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf) | [NREL ATB](https://atb.nrel.gov/electricity/2024/fossil_energy_technologies)")
        pjm_data = {
            "Data Point": [
                "Capacity cost per MW-year",
                "Demand charge rate",
                "Energy margin",
                "DR capacity credit factor"
            ],
            "Value Used": [
                f"${INFRASTRUCTURE_COSTS['capacity_cost_per_mw_year']:,}/MW-yr",
                f"${DC_RATE_STRUCTURE['demand_charge_per_mw_month']:,}/MW-mo",
                f"${DC_RATE_STRUCTURE['energy_margin_per_mwh']}/MWh",
                "80%"
            ],
            "Source / Note": [
                "NREL ATB range $98-175k; ⚠️ $150k selected",
                "⚠️ Representative value from PSO LPL tariff",
                "⚠️ Model Assumption (industry typical $3-8/MWh)",
                "⚠️ Model Assumption"
            ]
        }
        st.table(pjm_data)

        # NREL Data
        st.subheader("NREL Annual Technology Baseline (ATB)")
        st.markdown("[Generation Technology Costs and Performance](https://atb.nrel.gov/)")
        nrel_data = {
            "Data Point": [
                "Peaker plant capital cost",
                "Generation availability factor",
                "Generation capacity credit"
            ],
            "Value Used": [
                "$1,000,000/MW",
                "95%",
                "95%"
            ],
            "How We Use It": [
                "New capacity construction cost",
                "Onsite generation credit calculation",
                "Value of dispatchable generation"
            ]
        }
        st.table(nrel_data)

        # LBNL Data + EPRI DCFlex Research
        st.subheader("LBNL & EPRI DCFlex Research")
        st.markdown("[LBNL Data Center Energy](https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf) | [EPRI DCFlex](https://dcflex.epri.com/)")
        lbnl_data = {
            "Data Point": [
                "Firm load factor",
                "Flexible load factor",
                "Curtailable load percentage",
                "Aggregate workload flexibility"
            ],
            "Value Used": [
                f"{DEFAULT_DATA_CENTER['firm_load_factor']*100:.0f}%",
                f"{DEFAULT_DATA_CENTER['flex_load_factor']*100:.0f}%",
                f"{(1-DEFAULT_DATA_CENTER['flex_peak_coincidence'])*100:.0f}%",
                "42%"
            ],
            "How We Use It": [
                "Energy consumption - firm scenario",
                "Energy consumption - flex scenario",
                "Peak demand reduction (DCFlex: 25% sustained, up to 40%)",
                "Shiftable workload fraction (conservative vs 90% preemptible)"
            ]
        }
        st.table(lbnl_data)

        # Industry Research
        st.subheader("Industry Research & Academic Literature")
        st.markdown("""
        Sources: [EPRI DCFlex Initiative](https://dcflex.epri.com/),
        [IEEE Spectrum (2025)](https://spectrum.ieee.org/dcflex-data-center-flexibility),
        [Latitude Media / Databricks Research](https://www.latitudemedia.com/news/catalyst-the-mechanics-of-data-center-flexibility/)
        """)
        st.warning("⚠️ **Model Assumptions:** The workload percentages and flexibility values below are illustrative estimates. Actual values vary significantly by operator and workload mix.")
        industry_data = {
            "Workload Type": [
                "AI Training",
                "Batch Processing",
                "Real-time Inference",
                "Core Infrastructure"
            ],
            "Flexibility": [
                "60%",
                "80%",
                "10%",
                "5%"
            ],
            "Source": [
                "⚠️ Inferred from DCFlex / arXiv Phoenix",
                "⚠️ Inferred from Databricks ~90% preemptible",
                "⚠️ DCFlex Flex 0 tier (strict SLA)",
                "⚠️ Industry estimate"
            ]
        }
        st.table(industry_data)

        st.info("""
        **Key Finding:** The EPRI DCFlex Phoenix demonstration (2024) showed that ~90% of workloads
        on a representative Databricks cluster could be preempted, and 25-40% power reduction
        was achievable during peak events while maintaining AI quality of service.
        """)

    with st.expander("Residential Allocation (Calculated)"):
        st.markdown("""
        Rather than assuming a fixed decline rate, we **calculate** residential allocation based on tariff structure:

        | Component | Weight | Calculation |
        |-----------|--------|-------------|
        | Volumetric | 40% | Residential energy ÷ total system energy |
        | Demand | 40% | Residential peak ÷ total system peak |
        | Customer | 20% | Residential customers ÷ total customers |

        **When a DC comes online:**
        - System energy increases → residential volumetric share decreases
        - System peak increases → residential demand share decreases
        - Customer count essentially unchanged

        **Regulatory lag:** Changes phase in over ~5 years through rate cases.
        """)

    with st.expander("Infrastructure Cost Assumptions"):
        st.markdown("""
        Infrastructure costs are based on industry benchmarks and regulatory filings:

        | Component | Cost | Source |
        |-----------|------|--------|
        | Transmission | $350,000/MW | EIA, FERC filings |
        | Distribution | $150,000/MW | Utility rate cases |
        | Peaker Capacity | $1,000,000/MW | NREL ATB 2024 |
        | Capacity Purchase | $150,000/MW-year | PJM, MISO auctions |

        These are order-of-magnitude estimates. Actual costs vary significantly by region,
        terrain, existing infrastructure, and regulatory environment.
        """)

    with st.expander("Capacity Markets & Regulated Territories"):
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("""
            **Regulated Territories (e.g., PSO/SPP):**
            - Utility **owns generation** and recovers costs through rate base
            - No capacity market auction - uses bilateral contracts and self-supply
            - Capacity "cost" = embedded cost of owned fleet (~$80-120/kW-year)
            - Must maintain SPP reserve margins (~12-15%)
            - DC demand charges help offset utility's existing generation costs
            """)
        with col2:
            st.markdown("""
            **Market Territories (PJM, MISO):**
            - Capacity procured through **competitive auctions**
            - Recent PJM: $29-269/MW-day ($10k-$98k/MW-year)
            - Prices are **rising sharply** due to retirements and load growth
            - Emergency auctions being implemented for large loads
            - DCs that bring generation get priority interconnection
            """)

        st.error("""
        **Capacity Scarcity is Increasing**

        The U.S. power grid faces a growing capacity deficit driven by:
        - **Load growth:** Data centers, EVs, electrification, reshoring
        - **Retirements:** 80+ GW of coal plants retiring by 2030
        - **Intermittency:** Solar/wind require backup for reliability
        - **Interconnection delays:** 5-7 year queues for new generation

        **Implication:** Capacity values are likely to INCREASE over time.
        Data centers that bring their own generation or provide demand response are
        increasingly valuable because they help address this scarcity rather than worsen it.
        """)

        st.success("""
        **How This Model Handles Capacity:**
        - **Base capacity cost:** $150k/MW-year (forward-looking blend of market and regulated costs)
        - **Demand charge offset:** DC pays ~$108k/MW-year through demand charges, which largely covers capacity costs
        - **DR capacity credit:** Curtailable load valued at 80% of capacity cost (dispatchable during system peaks)
        - **Generation capacity credit:** Onsite generation valued at 95% of capacity cost (more reliable than DR)

        When DR + generation capacity credits exceed infrastructure costs, the DC provides
        a **net benefit** to other ratepayers.
        """)

    with st.expander("Workload Flexibility Model"):
        st.markdown("""
        Data center flexibility varies by workload type. Our model uses the following
        breakdown based on EPRI DCFlex research (2024):

        | Workload Type | % of Load | Flexibility | Notes |
        |---------------|-----------|-------------|-------|
        | AI Training | 30% | 60% | Deferrable to off-peak hours |
        | Batch Processing | 25% | 80% | Highly shiftable, low latency needs |
        | Real-time Inference | 35% | 10% | Must respond instantly |
        | Core Infrastructure | 10% | 5% | Always-on systems |

        **Aggregate Flexibility:** Based on this mix, approximately 42% of
        total facility load can be shifted to off-peak hours with minimal operational impact.
        This is conservative compared to the DCFlex finding that ~90% of workloads can be preempted.
        """)

        st.success("""
        **Field Demonstration Results (EPRI DCFlex, 2024)**

        The EPRI DCFlex demonstration at Oracle's Phoenix data center achieved:
        - **25% sustained power reduction** during 3-hour peak grid events
        - **Up to 40% reduction** demonstrated while maintaining AI quality of service
        - **~90% of workloads** on representative clusters can be preempted (paused/delayed)
        """)

        st.markdown("""
        **Data Sources:**
        - [IEEE Spectrum: Big Tech Tests Data Center Flexibility (2024)](https://spectrum.ieee.org/dcflex-data-center-flexibility)
        - [arXiv: Turning AI Data Centers into Grid-Interactive Assets - Phoenix Field Demonstration](https://arxiv.org/abs/2507.00909)
        - [Latitude Media: The Mechanics of Data Center Flexibility](https://www.latitudemedia.com/news/catalyst-the-mechanics-of-data-center-flexibility/) - includes Databricks 90% preemptible workload finding
        - [Google Cloud: Using Demand Response to Reduce Data Center Power Consumption](https://cloud.google.com/blog/products/infrastructure/using-demand-response-to-reduce-data-center-power-consumption)
        - [EPRI DCFlex Initiative](https://dcflex.epri.com/) - 45+ industry collaborators including Google, Meta, Microsoft, NVIDIA
        """)

    with st.expander("Limitations & Caveats"):
        st.markdown("""
        This model provides order-of-magnitude estimates, not precise predictions.
        Key limitations include:

        - **Regional variation:** Infrastructure costs vary by 2-3x depending
          on location, terrain, and existing grid conditions.
        - **Regulatory uncertainty:** Actual cost allocation depends on
          state regulatory decisions which vary widely.
        - **Technology change:** Battery costs, renewable prices, and
          grid technology are evolving rapidly.
        - **Market dynamics:** Wholesale electricity prices fluctuate
          based on fuel costs, weather, and demand patterns.
        - **Simplified model:** We use linear projections and don't capture
          all feedback effects, step changes, or non-linear dynamics.
        """)

        st.warning("""
        **Use appropriately:** This tool is designed for educational purposes
        and initial analysis. Actual utility planning and rate-making involves much more
        detailed engineering and economic modeling.
        """)

    with st.expander("Data Source Links"):
        st.markdown("""
        - [EIA Table 5A - Average Monthly Bill](https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf)
        - [NREL Annual Technology Baseline 2024](https://atb.nrel.gov/electricity/2024/index)
        - [RAP: Electric Cost Allocation for a New Era (2020)](https://www.raponline.org/wp-content/uploads/2023/09/rap-lazar-chernick-marcus-lebel-electric-cost-allocation-new-era-2020-january.pdf)
        - [PJM 2025/26 Base Residual Auction Report](https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf)
        - [MISO MTEP23 Executive Summary](https://cdn.misoenergy.org/MTEP23%20Executive%20Summary630586.pdf)
        - [LBNL Data Center Energy Usage Report (2024)](https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf)
        - [Grid Strategies: National Load Growth Report (2024)](https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf)
        - [EPRI DCFlex Initiative](https://dcflex.epri.com/)
        - [arXiv: Turning AI Data Centers into Grid-Interactive Assets](https://arxiv.org/abs/2507.00909)
        """)

# Footer
st.divider()
st.markdown("""
<div style="text-align: center; color: #6c757d; font-size: 0.8rem;">
    Community Energy Calculator | MIT License |
    <a href="https://github.com/DougMackenzie/community-energy">GitHub</a>
</div>
""", unsafe_allow_html=True)
