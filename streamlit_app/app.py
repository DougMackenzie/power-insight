"""
Community Energy Calculator - Home Page
Mirrors the Next.js home page at community-energy.vercel.app
"""

import streamlit as st
from calculations import (
    DEFAULT_UTILITY, DEFAULT_DATA_CENTER, TIME_PARAMS,
    generate_all_trajectories, calculate_summary_stats
)

# Page configuration
st.set_page_config(
    page_title="Community Energy Calculator",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
        padding: 2.5rem 2rem;
        border-radius: 1rem;
        color: white;
        margin-bottom: 2rem;
    }
    .main-header h1 { font-size: 2.25rem; margin-bottom: 1rem; }
    .main-header p { font-size: 1.1rem; opacity: 0.9; line-height: 1.6; }
    .metric-card {
        background: white;
        padding: 1.25rem;
        border-radius: 0.75rem;
        border: 2px solid #e5e7eb;
        text-align: center;
        height: 100%;
    }
    .metric-card.red { background: #fef2f2; border-color: #fecaca; }
    .metric-card.green { background: #f0fdf4; border-color: #22c55e; border-width: 3px; }
    .scenario-card {
        padding: 1rem;
        border-radius: 0.5rem;
        text-align: center;
        height: 100%;
    }
    .info-box {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        padding: 2rem;
        border-radius: 0.75rem;
    }
    .action-box {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        padding: 2rem;
        border-radius: 0.75rem;
    }
    .cta-section {
        background: #f9fafb;
        padding: 1.5rem;
        border-radius: 1rem;
        border: 2px solid #e5e7eb;
    }
</style>
""", unsafe_allow_html=True)


def main():
    # Calculate results with defaults
    trajectories = generate_all_trajectories(DEFAULT_UTILITY, DEFAULT_DATA_CENTER)
    summary = calculate_summary_stats(trajectories, DEFAULT_UTILITY)
    projection_years = TIME_PARAMS['projection_years']

    # Hero Section
    st.markdown("""
    <div class="main-header">
        <h1>What Does a Data Center Mean for <span style="color: #86efac;">Your Electric Bill?</span></h1>
        <p>
            A new data center has been proposed in your community. As a homeowner or community
            leader, you deserve to understand how this could affect the electricity costs for you
            and your neighbors. This tool shows you the real numbers.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Navigation buttons
    col1, col2, col3 = st.columns([1.2, 1.2, 2])
    with col1:
        if st.button("🔢 Calculate My Impact", type="primary", use_container_width=True):
            st.switch_page("pages/1_Calculator.py")
    with col2:
        if st.button("📚 See Our Data Sources", use_container_width=True):
            st.switch_page("pages/3_Methodology.py")

    st.divider()

    # The Bottom Line Section
    st.header("The Bottom Line for Your Household")

    dc_capacity = DEFAULT_DATA_CENTER['capacity_mw']
    res_customers = DEFAULT_UTILITY['residential_customers']

    st.write(f"""
    Based on a **{dc_capacity:,} MW** data center in a utility territory that serves
    **{res_customers:,}** residential customers, here's what your monthly bill could look like
    in **{projection_years} years**:
    """)

    # Bill comparison cards
    baseline_final = summary['final_year_bills']['baseline']
    unoptimized_final = summary['final_year_bills']['unoptimized']
    dispatchable_final = summary['final_year_bills']['dispatchable']
    firm_diff = unoptimized_final - baseline_final
    opt_diff = dispatchable_final - baseline_final

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown(f"""
        <div class="metric-card" style="background: #f3f4f6;">
            <p style="color: #6b7280; font-size: 0.85rem; margin: 0 0 0.5rem 0;">Without Data Center</p>
            <p style="font-size: 2rem; font-weight: bold; color: #374151; margin: 0;">${baseline_final:.0f}</p>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.5rem;">in {projection_years} years</p>
            <p style="color: #9ca3af; font-size: 0.7rem;">Normal rate increases</p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        diff_color = "#dc2626" if firm_diff >= 0 else "#16a34a"
        diff_sign = "+" if firm_diff >= 0 else ""
        st.markdown(f"""
        <div class="metric-card red">
            <p style="color: #b91c1c; font-size: 0.85rem; margin: 0 0 0.5rem 0;">With Typical Data Center</p>
            <p style="font-size: 2rem; font-weight: bold; color: #dc2626; margin: 0;">${unoptimized_final:.0f}</p>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.5rem;">in {projection_years} years</p>
            <p style="color: {diff_color}; font-weight: 600; font-size: 0.85rem;">{diff_sign}{firm_diff:.2f}/mo vs baseline</p>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        diff_color = "#dc2626" if opt_diff >= 0 else "#16a34a"
        diff_sign = "+" if opt_diff >= 0 else ""
        st.markdown(f"""
        <div class="metric-card green">
            <p style="color: #15803d; font-size: 0.85rem; margin: 0 0 0.5rem 0;">With Optimized Data Center <span style="background: #bbf7d0; padding: 2px 6px; border-radius: 9999px; font-size: 0.7rem;">BEST</span></p>
            <p style="font-size: 2rem; font-weight: bold; color: #16a34a; margin: 0;">${dispatchable_final:.0f}</p>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.5rem;">in {projection_years} years</p>
            <p style="color: {diff_color}; font-weight: 600; font-size: 0.85rem;">{diff_sign}{opt_diff:.2f}/mo vs baseline</p>
        </div>
        """, unsafe_allow_html=True)

    st.divider()

    # The Scale Section
    col1, col2 = st.columns([2, 1])
    with col1:
        st.markdown("""
        <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: #f3f4f6; border-radius: 0.75rem;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); width: 80px; height: 80px; border-radius: 1rem; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 2.5rem;">🖥️</span>
            </div>
            <span style="font-size: 2rem; font-weight: bold; color: #9ca3af;">=</span>
            <div style="background: #fef3c7; padding: 0.75rem 1rem; border-radius: 1rem;">
                <span style="font-size: 1.5rem;">🏠🏠🏠🏠🏠🏠🏠🏠<br/>🏠🏠🏠🏠🏠🏠🏠</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.subheader("The Scale")
        st.write("**One large data center uses as much power as 300,000 homes**")

    st.divider()

    # How Costs Flow
    st.subheader("How Costs Flow to Your Bill")
    cols = st.columns(4)
    steps = [
        ("🖥️", "Data Center Needs Power", "#2563eb"),
        ("⚡", "Utility Builds", "#f59e0b"),
        ("📊", "Costs Shared", "#dc2626"),
        ("📄", "Your Bill", "#16a34a"),
    ]
    for i, (icon, label, color) in enumerate(steps):
        with cols[i]:
            st.markdown(f"""
            <div style="text-align: center;">
                <div style="background: {color}; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">{icon}</span>
                </div>
                <p style="font-weight: 600; color: #111827; font-size: 0.875rem; margin: 0;">{label}</p>
            </div>
            """, unsafe_allow_html=True)
        if i < 3:
            with cols[i]:
                st.markdown('<div style="text-align: right; color: #d1d5db; margin-top: -2rem;">→</div>', unsafe_allow_html=True)

    st.divider()

    # Design Determines Impact
    st.subheader("Design Determines Impact")
    st.caption("How a data center operates matters more than its size")

    # Spectrum bar
    st.markdown("""
    <div style="height: 12px; border-radius: 9999px; background: linear-gradient(to right, #ef4444, #f97316, #22c55e); margin: 1rem 0 1.5rem 0;"></div>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        <div class="scenario-card" style="background: #fef2f2;">
            <span style="font-size: 1.5rem;">⚠️</span>
            <h4 style="color: #b91c1c; margin: 0.5rem 0;">Firm Load</h4>
            <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Always on, no flex</p>
            <p style="color: #dc2626; font-weight: 600; font-size: 0.85rem; margin-top: 0.25rem;">Highest cost</p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="scenario-card" style="background: #fff7ed;">
            <span style="font-size: 1.5rem;">📈</span>
            <h4 style="color: #c2410c; margin: 0.5rem 0;">Flexible</h4>
            <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Reduces at peaks</p>
            <p style="color: #ea580c; font-weight: 600; font-size: 0.85rem; margin-top: 0.25rem;">Lower cost</p>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown("""
        <div class="scenario-card" style="background: #f0fdf4;">
            <span style="font-size: 1.5rem;">✅</span>
            <h4 style="color: #15803d; margin: 0.5rem 0;">Optimized</h4>
            <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">Flex + onsite gen</p>
            <p style="color: #16a34a; font-weight: 600; font-size: 0.85rem; margin-top: 0.25rem;">Lowest cost</p>
        </div>
        """, unsafe_allow_html=True)

    st.divider()

    # What Matters Most & Take Action
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        <div class="info-box">
            <h4 style="margin-top: 0; margin-bottom: 0.75rem;">What Matters Most</h4>
            <p style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                <span style="background: rgba(255,255,255,0.2); width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">1</span>
                Peak demand drives infrastructure costs
            </p>
            <p style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                <span style="background: rgba(255,255,255,0.2); width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">2</span>
                Flexibility can cut impact dramatically
            </p>
            <p style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                <span style="background: rgba(255,255,255,0.2); width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">3</span>
                Your voice at the PUC shapes outcomes
            </p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="action-box">
            <h4 style="margin-top: 0; margin-bottom: 0.75rem;">Take Action</h4>
            <p style="margin: 0 0 0.5rem 0;">✓ Attend utility commission hearings</p>
            <p style="margin: 0 0 0.5rem 0;">✓ Ask about flexibility requirements</p>
            <p style="margin: 0;">✓ Demand transparent cost allocation</p>
        </div>
        """, unsafe_allow_html=True)

    st.divider()

    # CTA Section
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        <div class="cta-section">
            <h4 style="margin-top: 0;">Customize for Your Community</h4>
            <p style="color: #4b5563; margin-bottom: 1rem;">
                Enter your utility's actual numbers to see a more accurate projection for your
                specific situation.
            </p>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Open Calculator →", key="calc_cta", use_container_width=True):
            st.switch_page("pages/1_Calculator.py")

    with col2:
        st.markdown("""
        <div class="cta-section">
            <h4 style="margin-top: 0;">Understand the Math</h4>
            <p style="color: #4b5563; margin-bottom: 1rem;">
                All our calculations are based on publicly available data. Review our methodology and
                sources.
            </p>
        </div>
        """, unsafe_allow_html=True)
        if st.button("View Methodology →", key="method_cta", use_container_width=True):
            st.switch_page("pages/3_Methodology.py")

    st.divider()

    # Open Source Section
    st.markdown("""
    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%); padding: 2rem; border-radius: 1rem; border: 2px solid #e5e7eb; text-align: center;">
        <h3 style="margin-top: 0;">Open Source & Community Driven</h3>
        <p style="color: #4b5563; max-width: 600px; margin: 0 auto;">
            This tool is free, open source, and not affiliated with any data center company or
            utility. Our goal is to provide objective information so communities can make informed
            decisions.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.write("")
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        st.link_button(
            "⭐ View on GitHub",
            "https://github.com/DougMackenzie/community-energy",
            use_container_width=True
        )

    # Footer
    st.divider()
    st.markdown("""
    <div style="text-align: center; color: #9ca3af; font-size: 0.8rem;">
        Community Energy Calculator | MIT License |
        <a href="https://github.com/DougMackenzie/community-energy" style="color: #6b7280;">GitHub</a>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
