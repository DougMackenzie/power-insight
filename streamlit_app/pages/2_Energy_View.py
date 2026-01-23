"""
Community Energy Calculator - Energy View Page
Visualizes hourly load profiles and load duration curves.

This is an illustrative visualization to articulate the framework.
Load shapes are representative of typical utility patterns.
"""

import streamlit as st
import plotly.graph_objects as go
import numpy as np
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from calculations import DEFAULT_UTILITY, DEFAULT_DATA_CENTER

# Page configuration
st.set_page_config(
    page_title="Energy View - Community Energy",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Colors matching the Next.js implementation
COLORS = {
    'baseGrid': '#E5E7EB',
    'baseGridStroke': '#9CA3AF',
    'firmDC': '#86EFAC',
    'firmDCStroke': '#22C55E',
    'flexBonus': '#166534',
    'gridCapacity': '#DC2626',
    'shiftedHatch': '#7C3AED',
}


def format_mw(value):
    """Format MW values."""
    if value >= 1000:
        return f"{value / 1000:.1f} GW"
    else:
        return f"{value:.0f} MW"


def generate_peak_day_profile(system_peak_mw, dc_capacity_mw, firm_load_factor, flex_load_factor):
    """
    Generate realistic summer peak day load profile.

    Logic:
    - DC wants to run at flexLoadFactor (95%) whenever possible
    - Grid capacity = systemPeakMW + (firmDC baseline allocation)
    - DC serves as much as grid headroom allows
    - When DC wants > headroom, the excess becomes "shifted workload"
    """
    # Typical summer peak day shape based on ERCOT/PJM data
    hourly_shape = [
        0.62, 0.58, 0.55, 0.53, 0.52, 0.54,  # 12am-6am
        0.60, 0.68, 0.76, 0.84, 0.90, 0.94,  # 6am-12pm
        0.97, 0.99, 1.00, 1.00, 0.99, 0.96,  # 12pm-6pm
        0.90, 0.82, 0.75, 0.70, 0.66, 0.64,  # 6pm-12am
    ]

    dc_max_wants = dc_capacity_mw * flex_load_factor
    dc_firm_baseline = dc_capacity_mw * firm_load_factor
    grid_capacity = system_peak_mw + dc_firm_baseline

    data = []
    for hour, shape in enumerate(hourly_shape):
        if hour == 0:
            hour_label = '12 AM'
        elif hour < 12:
            hour_label = f'{hour} AM'
        elif hour == 12:
            hour_label = '12 PM'
        else:
            hour_label = f'{hour - 12} PM'

        base_grid = system_peak_mw * shape
        headroom_for_dc = max(0, grid_capacity - base_grid)
        dc_actually_served = min(dc_max_wants, headroom_for_dc)
        shifted_workload = max(0, dc_max_wants - headroom_for_dc)

        firm_dc = min(dc_firm_baseline, dc_actually_served)
        flex_bonus = max(0, dc_actually_served - dc_firm_baseline)

        data.append({
            'hour': hour,
            'hour_label': hour_label,
            'base_grid': base_grid,
            'firm_dc': firm_dc,
            'flex_bonus': flex_bonus,
            'shifted_workload': shifted_workload,
            'grid_capacity': grid_capacity,
            'dc_actually_served': dc_actually_served,
            'dc_max_wants': dc_max_wants,
        })

    return data


def generate_load_duration_curve(system_peak_mw, dc_capacity_mw, firm_load_factor, flex_load_factor):
    """
    Generate annual load duration curve (8760 hours sorted by BASE GRID load).

    A proper load duration curve:
    1. Generates 8760 hours of base grid load with seasonal/daily variation
    2. Sorts BASE GRID values from highest to lowest
    3. For each sorted position, calculates DC service based on headroom
    """
    hours = 8760
    dc_max_wants = dc_capacity_mw * flex_load_factor
    dc_firm_baseline = dc_capacity_mw * firm_load_factor
    grid_capacity = system_peak_mw + dc_firm_baseline

    daily_shape = [
        0.62, 0.58, 0.55, 0.53, 0.52, 0.54,
        0.60, 0.68, 0.76, 0.84, 0.90, 0.94,
        0.97, 0.99, 1.00, 1.00, 0.99, 0.96,
        0.90, 0.82, 0.75, 0.70, 0.66, 0.64,
    ]

    # Use seeded random for consistency
    np.random.seed(12345)

    # Generate all 8760 hours of BASE GRID load
    base_grid_values = []
    for h in range(hours):
        day_of_year = h // 24
        hour_of_day = h % 24

        # Seasonal factor: summer peak around day 180
        day_angle = (day_of_year - 180) * np.pi / 182.5
        summer_factor = np.cos(day_angle)
        seasonal_factor = 0.75 + 0.25 * max(summer_factor, summer_factor * 0.3 + 0.2)

        daily_factor = daily_shape[hour_of_day]

        # Weekend reduction
        day_of_week = day_of_year % 7
        weekend_factor = 0.88 if day_of_week in [5, 6] else 1.0

        # Weather-driven random variation
        random_factor = 0.95 + np.random.random() * 0.10

        load_factor = seasonal_factor * daily_factor * weekend_factor * random_factor
        base_grid_values.append(system_peak_mw * load_factor)

    # Sort from highest to lowest
    sorted_base_grid = sorted(base_grid_values, reverse=True)

    # Sample at intervals
    samples = 200
    result = []

    for i in range(samples):
        idx = int((i / samples) * hours)
        hour_number = round((i / samples) * hours)
        base_grid = sorted_base_grid[idx]

        headroom_for_dc = max(0, grid_capacity - base_grid)
        dc_served = min(dc_max_wants, headroom_for_dc)
        shifted_workload = max(0, dc_max_wants - headroom_for_dc)

        firm_dc = min(dc_firm_baseline, dc_served)
        flex_bonus = max(0, dc_served - dc_firm_baseline)

        result.append({
            'hour_number': hour_number,
            'percentile': (i / samples) * 100,
            'base_grid': base_grid,
            'firm_dc': firm_dc,
            'flex_bonus': flex_bonus,
            'shifted_workload': shifted_workload,
            'grid_capacity': grid_capacity,
            'dc_served': dc_served,
        })

    return result


def main():
    # Initialize session state from Calculator page if available
    if 'utility' not in st.session_state:
        st.session_state.utility = DEFAULT_UTILITY.copy()
    if 'datacenter' not in st.session_state:
        st.session_state.datacenter = DEFAULT_DATA_CENTER.copy()

    utility = st.session_state.utility
    datacenter = st.session_state.datacenter

    # Header
    st.markdown("""
    <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 2rem; border-radius: 1rem; color: white; margin-bottom: 2rem;">
        <p style="color: #9ca3af; font-size: 0.9rem; margin: 0 0 0.5rem 0;">Calculator / Energy View</p>
        <h1 style="margin: 0 0 1rem 0; font-size: 1.875rem;">Energy View: Load Profile Visualization</h1>
        <p style="color: #d1d5db; font-size: 1.1rem; margin: 0; max-width: 800px;">
            Illustrative visualization showing how flexible data center operations affect grid load patterns.
            These representative profiles demonstrate the framework for understanding capacity benefits.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Calculate metrics
    dc_firm_baseline = datacenter['capacity_mw'] * datacenter.get('firm_load_factor', 0.80)
    dc_max_wants = datacenter['capacity_mw'] * datacenter.get('flex_load_factor', 0.95)
    grid_capacity = utility['system_peak_mw'] + dc_firm_baseline
    max_flex_bonus = dc_max_wants - dc_firm_baseline

    # Generate data
    peak_day_data = generate_peak_day_profile(
        utility['system_peak_mw'],
        datacenter['capacity_mw'],
        datacenter.get('firm_load_factor', 0.80),
        datacenter.get('flex_load_factor', 0.95)
    )
    duration_curve_data = generate_load_duration_curve(
        utility['system_peak_mw'],
        datacenter['capacity_mw'],
        datacenter.get('firm_load_factor', 0.80),
        datacenter.get('flex_load_factor', 0.95)
    )

    # Calculate shifting metrics
    hours_with_shifting = sum(1 for d in peak_day_data if d['shifted_workload'] > 0)
    peak_shifted_mw = max(d['shifted_workload'] for d in peak_day_data)
    avg_flex_bonus = sum(d['flex_bonus'] for d in duration_curve_data) / len(duration_curve_data)
    annual_flex_bonus_mwh = avg_flex_bonus * 8760

    # Key Metrics
    cols = st.columns(4)
    with cols[0]:
        st.metric("Grid Capacity", format_mw(grid_capacity), help="System Peak + Firm Data Center")
    with cols[1]:
        st.metric("Firm Data Center Baseline", format_mw(dc_firm_baseline),
                 f"{datacenter['capacity_mw']} MW @ {datacenter.get('firm_load_factor', 0.80)*100:.0f}% LF")
    with cols[2]:
        st.metric("Max Flex Bonus", f"+{format_mw(max_flex_bonus)}", help="Additional when headroom exists")
    with cols[3]:
        st.metric("Peak Shifted Load", format_mw(peak_shifted_mw), f"{hours_with_shifting} peak hours/day")

    st.divider()

    # Chart tabs
    tab1, tab2 = st.tabs(["Peak Summer Day", "Annual Load Curve"])

    with tab1:
        # Show shifted workload toggle
        show_shifted = st.checkbox("Show Shifted Workload", value=True)

        # Create stacked area chart
        fig = go.Figure()

        hours = [d['hour_label'] for d in peak_day_data]
        base_grid = [d['base_grid'] for d in peak_day_data]
        firm_dc = [d['firm_dc'] for d in peak_day_data]
        flex_bonus = [d['flex_bonus'] for d in peak_day_data]
        shifted = [d['shifted_workload'] for d in peak_day_data]

        # Base Grid
        fig.add_trace(go.Scatter(
            x=hours, y=base_grid,
            mode='lines',
            name='Base Grid',
            fill='tozeroy',
            fillcolor=COLORS['baseGrid'],
            line=dict(color=COLORS['baseGridStroke'], width=1),
            stackgroup='main'
        ))

        # Firm Data Center
        fig.add_trace(go.Scatter(
            x=hours, y=firm_dc,
            mode='lines',
            name=f'Firm Data Center ({format_mw(dc_firm_baseline)})',
            fill='tonexty',
            fillcolor=COLORS['firmDC'],
            line=dict(color=COLORS['firmDCStroke'], width=1),
            stackgroup='main'
        ))

        # Flex Bonus
        fig.add_trace(go.Scatter(
            x=hours, y=flex_bonus,
            mode='lines',
            name=f'Flex Bonus (up to +{format_mw(max_flex_bonus)})',
            fill='tonexty',
            fillcolor=COLORS['flexBonus'],
            line=dict(color=COLORS['flexBonus'], width=1),
            stackgroup='main'
        ))

        # Shifted Workload
        if show_shifted:
            fig.add_trace(go.Scatter(
                x=hours, y=shifted,
                mode='lines',
                name='Shifted Workload',
                fill='tonexty',
                fillcolor='rgba(124, 58, 237, 0.3)',
                line=dict(color=COLORS['shiftedHatch'], width=2, dash='dash'),
                stackgroup='main'
            ))

        # Grid Capacity Line
        fig.add_hline(
            y=grid_capacity,
            line_dash="dash",
            line_color=COLORS['gridCapacity'],
            annotation_text="Grid Capacity",
            annotation_position="right"
        )

        fig.update_layout(
            height=450,
            margin=dict(l=20, r=20, t=40, b=60),
            xaxis_title="Hour",
            yaxis_title="Megawatts (MW)",
            yaxis_tickformat=",.0f",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5),
            hovermode="x unified"
        )

        st.plotly_chart(fig, use_container_width=True)

        # Annotation
        st.info(f"""
        **Load Shifting:** During {hours_with_shifting} afternoon peak hours, flexible data centers shift up to
        {format_mw(peak_shifted_mw)} of workload to off-peak hours when the combined load (base grid + data center)
        would exceed grid capacity. This enables the data center to capture {format_mw(max_flex_bonus)} more energy
        during off-peak hours.
        """)

    with tab2:
        # Show shifted workload toggle
        show_shifted_ldc = st.checkbox("Show Shifted Workload", value=True, key="ldc_shifted")

        # Create stacked area chart
        fig2 = go.Figure()

        hour_nums = [d['hour_number'] for d in duration_curve_data]
        base_grid_ldc = [d['base_grid'] for d in duration_curve_data]
        firm_dc_ldc = [d['firm_dc'] for d in duration_curve_data]
        flex_bonus_ldc = [d['flex_bonus'] for d in duration_curve_data]
        shifted_ldc = [d['shifted_workload'] for d in duration_curve_data]

        # Base Grid
        fig2.add_trace(go.Scatter(
            x=hour_nums, y=base_grid_ldc,
            mode='lines',
            name='Base Grid Load',
            fill='tozeroy',
            fillcolor=COLORS['baseGrid'],
            line=dict(color=COLORS['baseGridStroke'], width=1),
            stackgroup='main'
        ))

        # Firm Data Center
        fig2.add_trace(go.Scatter(
            x=hour_nums, y=firm_dc_ldc,
            mode='lines',
            name='Firm Data Center',
            fill='tonexty',
            fillcolor=COLORS['firmDC'],
            line=dict(color=COLORS['firmDCStroke'], width=1),
            stackgroup='main'
        ))

        # Flex Bonus ("Profit Wedge")
        fig2.add_trace(go.Scatter(
            x=hour_nums, y=flex_bonus_ldc,
            mode='lines',
            name='Flex Bonus ("Profit Wedge")',
            fill='tonexty',
            fillcolor=COLORS['flexBonus'],
            line=dict(color=COLORS['flexBonus'], width=1),
            stackgroup='main'
        ))

        # Shifted Workload
        if show_shifted_ldc:
            fig2.add_trace(go.Scatter(
                x=hour_nums, y=shifted_ldc,
                mode='lines',
                name='Shifted Workload',
                fill='tonexty',
                fillcolor='rgba(124, 58, 237, 0.3)',
                line=dict(color=COLORS['shiftedHatch'], width=2, dash='dash'),
                stackgroup='main'
            ))

        # Grid Capacity Line
        fig2.add_hline(
            y=grid_capacity,
            line_dash="dash",
            line_color=COLORS['gridCapacity'],
            annotation_text="Grid Capacity Limit",
            annotation_position="right"
        )

        fig2.update_layout(
            height=450,
            margin=dict(l=20, r=20, t=40, b=60),
            xaxis_title="Hours (sorted by load, descending)",
            yaxis_title="Megawatts (MW)",
            yaxis_tickformat=",.0f",
            xaxis_tickformat=",",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5),
            hovermode="x unified"
        )

        st.plotly_chart(fig2, use_container_width=True)

        # The "Profit Wedge" Annotation
        st.success(f"""
        **The "Profit Wedge":** The dark green area represents additional energy captured when grid
        headroom allows the data center to run above its firm baseline ({datacenter.get('firm_load_factor', 0.80)*100:.0f}% LF)
        up to its flexible capacity ({datacenter.get('flex_load_factor', 0.95)*100:.0f}% LF). This unlocks
        approximately **{annual_flex_bonus_mwh / 1_000_000:.2f} million MWh** of additional annual energy sales.
        The purple hatched area shows load that must be shifted to off-peak hours when grid capacity is constrained.
        """)

    st.divider()

    # Methodology Note
    st.markdown("""
    <div style="background: #dbeafe; padding: 1.5rem; border-radius: 0.75rem; border: 2px solid #93c5fd;">
        <h3 style="color: #1e40af; margin: 0 0 0.75rem 0;">About This Visualization</h3>
        <p style="color: #1e3a8a; margin: 0 0 0.75rem 0;">
            These charts are <strong>illustrative representations</strong> designed to communicate the framework
            for understanding how flexible data center operations benefit grid capacity. Key assumptions:
        </p>
        <ul style="color: #1d4ed8; margin: 0; padding-left: 1.5rem;">
            <li>Grid capacity = system peak ({}) + firm data center baseline ({})</li>
            <li>Data center wants to run at {}% load factor whenever grid headroom allows</li>
            <li>When base grid + data center would exceed capacity, data center shifts load to off-peak hours</li>
            <li>Base grid follows typical summer peak day shape (ERCOT/PJM patterns)</li>
            <li>Annual curve includes seasonal, daily, weekend, and weather variation</li>
        </ul>
    </div>
    """.format(
        format_mw(utility['system_peak_mw']),
        format_mw(dc_firm_baseline),
        int(datacenter.get('flex_load_factor', 0.95) * 100)
    ), unsafe_allow_html=True)

    st.divider()

    # Navigation
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Bill Calculator", use_container_width=True):
            st.switch_page("pages/1_Calculator.py")
    with col2:
        if st.button("View Methodology", type="primary", use_container_width=True):
            st.switch_page("pages/3_Methodology.py")


if __name__ == "__main__":
    main()
