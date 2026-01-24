"""
Community Energy Calculator - Methodology Page
Mirrors the Next.js methodology page with detailed data sources and model explanation.
"""

import streamlit as st
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from calculations import (
    DEFAULT_UTILITY, DEFAULT_DATA_CENTER, TIME_PARAMS,
    INFRASTRUCTURE_COSTS, DC_RATE_STRUCTURE
)

# Page configuration
st.set_page_config(
    page_title="Methodology - Community Energy Calculator",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Convert Python constants to match naming
DEFAULT_UTILITY_DISPLAY = {
    'averageMonthlyBill': DEFAULT_UTILITY['avg_monthly_bill'],
    'residentialEnergyShare': DEFAULT_UTILITY.get('residential_energy_share', 0.35),
    'baseResidentialAllocation': DEFAULT_UTILITY.get('base_residential_allocation', 0.40),
}

DEFAULT_DC_DISPLAY = {
    'firmLoadFactor': DEFAULT_DATA_CENTER.get('firm_load_factor', 0.80),
    'flexLoadFactor': DEFAULT_DATA_CENTER.get('flex_load_factor', 0.95),
    'firmPeakCoincidence': DEFAULT_DATA_CENTER.get('firm_peak_coincidence', 1.0),
    'flexPeakCoincidence': DEFAULT_DATA_CENTER.get('flex_peak_coincidence', 0.75),
}

TIME_PARAMS_DISPLAY = {
    'generalInflation': TIME_PARAMS.get('general_inflation', 0.025),
    'electricityInflation': 0.035,  # Typical value
}

INFRASTRUCTURE_DISPLAY = {
    'transmissionCostPerMW': INFRASTRUCTURE_COSTS.get('transmission_cost_per_mw', 350000),
    'distributionCostPerMW': INFRASTRUCTURE_COSTS.get('distribution_cost_per_mw', 150000),
    'capacityCostPerMWYear': INFRASTRUCTURE_COSTS.get('capacity_cost_per_mw_year', 150000),
    'annualBaselineUpgradePercent': INFRASTRUCTURE_COSTS.get('annual_baseline_upgrade_pct', 0.015),
}

WORKLOAD_TYPES = {
    'ai_training': {'name': 'AI Training', 'percentOfLoad': 0.35, 'flexibility': 0.70, 'description': 'Large batch jobs, can pause/resume'},
    'batch_processing': {'name': 'Batch Processing', 'percentOfLoad': 0.25, 'flexibility': 0.60, 'description': 'Scheduled jobs, timing flexible'},
    'ai_inference': {'name': 'AI Inference', 'percentOfLoad': 0.20, 'flexibility': 0.15, 'description': 'User-facing, some can be queued'},
    'storage_backup': {'name': 'Storage/Backup', 'percentOfLoad': 0.10, 'flexibility': 0.50, 'description': 'Can defer to off-peak'},
    'realtime': {'name': 'Real-time Services', 'percentOfLoad': 0.10, 'flexibility': 0.05, 'description': 'Minimal flexibility'},
}


def format_currency(value):
    """Format currency values."""
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    elif value >= 1_000:
        return f"${value / 1_000:.0f}K"
    else:
        return f"${value:.0f}"


def main():
    # Header
    st.markdown("""
    <div style="background: #f3f4f6; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
        <h1 style="margin: 0 0 1rem 0; color: #111827;">Methodology & Data Sources</h1>
        <p style="color: #4b5563; font-size: 1.1rem; margin: 0; max-width: 800px;">
            This tool uses industry-standard methodologies and publicly available data
            to project electricity cost impacts. Below we explain our models, assumptions,
            and data sources so you can verify and critique our approach.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Model Overview
    st.subheader("Model Overview")
    st.write("""
    Our model projects residential electricity bills under four scenarios:

    1. **Baseline:** Normal cost growth from infrastructure aging and inflation
    2. **Firm Load:** Data center operates at constant power, adding 100% of capacity to system peak
    3. **Flexible Load:** Data center reduces load by 25% during peak hours by deferring non-time-sensitive workloads
    4. **Flex + Dispatchable:** Flexible operation plus onsite generation to further reduce grid draw during peaks

    For each scenario, we calculate infrastructure costs, revenue contributions, and
    allocate net impacts to residential customers based on market-specific regulatory methods.
    """)

    st.info("""
    **About the Flexibility Assumptions:** The 25% peak reduction capability is based on
    [EPRI's DCFlex initiative](https://dcflex.epri.com/), a 2024 field demonstration at a major data center
    that achieved 25% sustained power reduction during 3-hour peak events. While theoretical flexibility
    from workload analysis suggests up to 42% is possible, the 25% figure represents a conservative,
    field-validated baseline.
    """)

    st.divider()

    # Core Calculation Logic
    with st.expander("Core Calculation Logic", expanded=True):
        st.markdown("**Basic Formula:**")
        st.code("Monthly Impact = (Infrastructure Costs - DC Revenue Offset) x Residential Allocation / Customers / 12")

        st.markdown("**Key Terms Explained:**")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("""
            - **Load Factor:** Average power draw / nameplate capacity.
              A 2,000 MW data center at 80% load factor draws 1,600 MW on average.
            - **Peak Coincidence:** Fraction of capacity drawing power during system peak hours.
              100% means full contribution to peak; 75% means the facility reduces load by 25% during peaks.
            """)
        with col2:
            st.markdown("""
            - **Curtailable:** The portion of load that can be temporarily reduced during grid stress events
              by pausing or deferring non-time-sensitive workloads (e.g., AI training, batch processing).
            """)

        st.markdown("**Firm vs Flexible Load Scenarios:**")
        scenario_data = {
            "Parameter": ["Load Factor", "Peak Coincidence", "Curtailable During Peaks"],
            "Firm Load": [
                f"{DEFAULT_DC_DISPLAY['firmLoadFactor']*100:.0f}%",
                f"{DEFAULT_DC_DISPLAY['firmPeakCoincidence']*100:.0f}%",
                "0%"
            ],
            "Flexible Load": [
                f"{DEFAULT_DC_DISPLAY['flexLoadFactor']*100:.0f}%",
                f"{DEFAULT_DC_DISPLAY['flexPeakCoincidence']*100:.0f}%",
                f"{(1-DEFAULT_DC_DISPLAY['flexPeakCoincidence'])*100:.0f}%"
            ]
        }
        st.table(scenario_data)

        st.info("""
        **Why 95% load factor for flexible?** By shifting deferrable workloads (AI training, batch jobs)
        to off-peak hours, data centers can run at higher average utilization while reducing peak contribution.

        **Note on firm load behavior:** Firm data centers don't run at a constant 80%—they fluctuate
        between roughly 70-100% of interconnected capacity based on IT workload demands. The key difference is that
        they *cannot coordinate* their load reductions with grid stress events. When the grid needs relief during
        peak hours, a firm data center may happen to be running at 90% or 100%, while a flexible data center can
        deliberately curtail to 75% of capacity.
        """)

        st.success("""
        **Grid Capacity Math: Why 33% More?**

        If a grid has X MW of available capacity for new load:
        - **Firm load** (100% peak): Grid supports X MW of data center capacity
        - **Flexible load** (75% peak): Grid supports X / 0.75 = **1.33X MW** of data center capacity

        Result: **33% more data center capacity** can connect to the same grid infrastructure
        when operating flexibly, because each MW only adds 0.75 MW to the system peak.
        """)

        st.markdown("**Revenue Offset (DC Revenue Contribution):**")
        st.write("""
        Data centers generate significant revenue for utilities, which offsets infrastructure costs before
        any net impact flows to residential customers. In some scenarios, revenue can exceed infrastructure
        costs, resulting in a net benefit to ratepayers.
        """)

        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"""
            **1. Energy Revenue (Volume × Margin)**

            Utilities earn margin on each MWh sold: ${DC_RATE_STRUCTURE['energy_margin_per_mwh']}/MWh wholesale-to-retail spread.
            This margin contributes to the utility's revenue requirement, allocated across all customers.

            - **Firm (80% LF):** 1,000 MW × 80% × 8,760 hrs = 7,008,000 MWh/year
            - **Flexible (95% LF):** 1,000 MW × 95% × 8,760 hrs = 8,322,000 MWh/year
            - **Flexible generates 19% more energy revenue** (~$6.4M more annually at same capacity)
            """)

        with col2:
            st.markdown(f"""
            **2. Demand Charge Revenue (Coincident vs Non-Coincident Peak)**

            Large customer demand charges have **two components**:

            - **Coincident Peak (CP):** ~${DC_RATE_STRUCTURE['coincident_peak_charge_per_mw_month']:,}/MW-mo - Based on usage during *system* peak hours. Flexible DCs pay **less**.
            - **Non-Coincident Peak (NCP):** ~${DC_RATE_STRUCTURE['non_coincident_peak_charge_per_mw_month']:,}/MW-mo - Based on customer's own monthly peak. Both pay similar.
            """)

        st.warning("""
        **Important nuance:** When comparing "same interconnection" scenarios, flexible DCs generate
        **less** CP demand revenue (they curtail during peaks) but similar NCP revenue. The net benefit
        to ratepayers comes primarily from reduced infrastructure costs, not increased demand charges.
        """)

        st.markdown("""
        <div style="background: #f3e8ff; padding: 1rem; border-radius: 0.5rem; border: 1px solid #c4b5fd; margin-top: 1rem;">
            <strong style="color: #6b21a8;">When Revenue Exceeds Infrastructure Costs</strong>
            <p style="color: #6b21a8; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
            Flexible data centers can generate net benefits to ratepayers when: higher load factor generates significantly more
            energy revenue, 25% peak curtailment reduces infrastructure requirements, onsite generation further reduces grid
            capacity needs, and combined revenue contribution exceeds reduced infrastructure costs. This is why the
            "Optimized Data Center" scenario can show <strong>lower bills than baseline</strong> in certain configurations.
            </p>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("**Residential Cost Allocation:**")
        st.markdown(f"""
        - **Base allocation:** Varies by market (30-40% typical)
        - **Calculation method:** Weighted blend of 40% volumetric (kWh), 40% demand (peak MW), 20% customer count
        - **Dynamic adjustment:** As data center adds energy and peak, residential shares shift
        - **Regulatory lag:** Changes phase in over ~5 years through rate case proceedings
        - **Market multipliers:** ERCOT applies 0.85x (large loads face prices directly); high PJM capacity prices increase allocation

        The baseline trajectory includes {TIME_PARAMS_DISPLAY['generalInflation']*100:.1f}% annual
        inflation and {INFRASTRUCTURE_DISPLAY['annualBaselineUpgradePercent']*100:.1f}% annual
        infrastructure replacement costs.
        """)

    st.divider()

    # Data Sources
    with st.expander("Data Sources & Specific Values Used"):
        st.info("""
        **Transparency Note:** Below we document data sources where available.
        Values marked with **Model Assumption** are based on industry understanding or selected from published ranges,
        but not directly cited from a specific source. You can substitute your own values in the calculator.
        """)

        # EIA Data
        st.markdown("### Energy Information Administration (EIA)")
        st.caption("U.S. Department of Energy - Electricity Data")
        eia_data = {
            "Data Point": [
                "Average residential monthly bill",
                "Residential share of total sales",
                "Electricity price inflation",
                "General inflation rate"
            ],
            "Value": [
                f"${DEFAULT_UTILITY_DISPLAY['averageMonthlyBill']}",
                f"{DEFAULT_UTILITY_DISPLAY['residentialEnergyShare']*100:.0f}%",
                f"{TIME_PARAMS_DISPLAY['electricityInflation']*100:.1f}%/yr",
                f"{TIME_PARAMS_DISPLAY['generalInflation']*100:.1f}%/yr"
            ],
            "Source": [
                "[EIA Table 5A](https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf) - National avg ~$138/mo (2023)",
                "[EIA Electric Power Annual](https://www.eia.gov/electricity/annual/html/epa_01_02.html) - Residential 35.1% of total",
                "[EIA Table 1.1](https://www.eia.gov/electricity/annual/html/epa_01_01.html) - 10-year CAGR",
                "[BLS CPI Data](https://www.bls.gov/cpi/) - Fed Reserve 2% target + utility premium"
            ]
        }
        st.table(eia_data)

        # Infrastructure Costs
        st.markdown("### Transmission & Distribution Infrastructure Costs")
        infra_data = {
            "Data Point": [
                "Transmission cost per MW",
                "Distribution cost per MW",
                "Annual infrastructure upgrade rate",
                "Capacity cost per MW-year"
            ],
            "Value": [
                f"{format_currency(INFRASTRUCTURE_DISPLAY['transmissionCostPerMW'])}/MW",
                f"{format_currency(INFRASTRUCTURE_DISPLAY['distributionCostPerMW'])}/MW",
                f"{INFRASTRUCTURE_DISPLAY['annualBaselineUpgradePercent']*100:.1f}%",
                f"{format_currency(INFRASTRUCTURE_DISPLAY['capacityCostPerMWYear'])}/MW-yr"
            ],
            "Source": [
                "[MISO MTEP23](https://cdn.misoenergy.org/MTEP23%20Executive%20Summary630586.pdf) - Range $200k-$500k; **$350k median**",
                "[NREL Distribution Costs](https://docs.nrel.gov/docs/fy18osti/70710.pdf) - **$150k inferred**",
                "[Brattle/Grid Strategies](https://www.brattle.com/wp-content/uploads/2021/10/2021-10-12-Brattle-GridStrategies-Transmission-Planning-Report_v2.pdf) - **1.5% midpoint**",
                "[NREL ATB 2024](https://atb.nrel.gov/electricity/2024/fossil_energy_technologies) - **$150k representative**"
            ]
        }
        st.table(infra_data)

        # Cost Allocation
        st.markdown("### Residential Cost Allocation Methodology")
        alloc_data = {
            "Data Point": [
                "Base residential allocation",
                "Allocation weighting method",
                f"Total demand charge rate",
                "- Coincident peak (CP) portion",
                "- Non-coincident peak (NCP) portion",
                "Energy margin (utility spread)"
            ],
            "Value": [
                f"{DEFAULT_UTILITY_DISPLAY['baseResidentialAllocation']*100:.0f}%",
                "40/40/20",
                f"${DC_RATE_STRUCTURE['demand_charge_per_mw_month']:,}/MW-mo",
                f"${DC_RATE_STRUCTURE['coincident_peak_charge_per_mw_month']:,}/MW-mo",
                f"${DC_RATE_STRUCTURE['non_coincident_peak_charge_per_mw_month']:,}/MW-mo",
                f"${DC_RATE_STRUCTURE['energy_margin_per_mwh']}/MWh"
            ],
            "Source": [
                "[RAP Cost Allocation Manual](https://www.raponline.org/wp-content/uploads/2023/09/rap-lazar-chernick-marcus-lebel-electric-cost-allocation-new-era-2020-january.pdf) - Typical 35-45%",
                "**Model Assumption** - 40% volumetric, 40% demand, 20% customer count",
                "[PSO Rate Schedules](https://www.psoklahoma.com/company/about/rates/) - Peak ($7.05/kW) + Max ($2.47/kW)",
                "~60% of total - based on usage during system peak hours",
                "~40% of total - based on customer's own monthly peak",
                "**Model Assumption** - Industry typical $3-8/MWh"
            ]
        }
        st.table(alloc_data)

        # Data Center Characteristics
        st.markdown("### Data Center Load Characteristics")
        dc_data = {
            "Data Point": [
                "Firm load factor",
                "Flexible load factor",
                "Peak curtailment capability"
            ],
            "Value": [
                f"{DEFAULT_DC_DISPLAY['firmLoadFactor']*100:.0f}%",
                f"{DEFAULT_DC_DISPLAY['flexLoadFactor']*100:.0f}%",
                f"{(1-DEFAULT_DC_DISPLAY['flexPeakCoincidence'])*100:.0f}%"
            ],
            "Source": [
                "[LBNL Data Center Report](https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf) - Typical 75-85%",
                "**Model Assumption** - Shifting enables higher avg utilization",
                "[IEEE Spectrum DCFlex](https://spectrum.ieee.org/dcflex-data-center-flexibility) - Field-validated 25% sustained"
            ]
        }
        st.table(dc_data)

        st.markdown("### Additional Industry References")
        st.markdown("""
        - [PJM 2025/26 Base Residual Auction Report](https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf) - Clearing price $269.92/MW-day RTO
        - [Grid Strategies National Load Growth Report (Dec 2024)](https://gridstrategiesllc.com/wp-content/uploads/National-Load-Growth-Report-2024.pdf) - Data center load growth by region
        - [NREL Annual Technology Baseline 2024](https://atb.nrel.gov/electricity/2024/index) - Generation technology costs
        - [EPRI DCFlex Initiative](https://dcflex.epri.com/) - 45+ industry collaborators validating data center flexibility
        """)

    st.divider()

    # Workload Flexibility Model
    with st.expander("Workload Flexibility Model"):
        st.write("""
        Data center flexibility varies by workload type. The table below shows the theoretical
        flexibility potential based on typical workload mix:
        """)

        st.warning("""
        **Model Assumptions:** The workload percentages and flexibility values below are illustrative estimates
        based on industry understanding of AI/cloud workloads. Actual values vary significantly by data center
        operator and workload mix.
        """)

        workload_data = {
            "Workload Type": [],
            "% of Load": [],
            "Flexibility": [],
            "Notes": []
        }
        for key, wl in WORKLOAD_TYPES.items():
            workload_data["Workload Type"].append(wl['name'])
            workload_data["% of Load"].append(f"{wl['percentOfLoad']*100:.0f}%")
            workload_data["Flexibility"].append(f"{wl['flexibility']*100:.0f}%")
            workload_data["Notes"].append(wl['description'])

        workload_data["Workload Type"].append("**Theoretical Aggregate**")
        workload_data["% of Load"].append("100%")
        workload_data["Flexibility"].append("~42%")
        workload_data["Notes"].append("Weighted sum")

        st.table(workload_data)

        st.warning("""
        **Why We Use 25% (Not 42%)**

        While the theoretical workload analysis suggests ~42% aggregate flexibility, our model uses
        a more conservative **25% curtailable** assumption based on:
        - Field-validated results from EPRI DCFlex demonstration
        - Real-world constraints (coordination overhead, workload queuing, IT operations)
        - Reliability margin for grid operators to depend on
        - Conservative baseline that most data centers could achieve without major changes
        """)

        st.success("""
        **EPRI DCFlex Field Demonstration (2024)**

        The EPRI DCFlex demonstration at a major hyperscale data center in Phoenix achieved:
        - **25% sustained power reduction** during 3-hour peak grid events
        - **Up to 40% reduction** demonstrated while maintaining AI quality of service
        - **~90% of workloads** on representative clusters can be preempted (paused/delayed)

        This validates that 25% curtailment is achievable in real-world conditions, with potential
        for higher reductions as data center operators gain experience with demand response programs.
        """)

        st.markdown("""
        **Data Sources:**
        - [IEEE Spectrum: Big Tech Tests Data Center Flexibility (2025)](https://spectrum.ieee.org/dcflex-data-center-flexibility)
        - [arXiv: Turning AI Data Centers into Grid-Interactive Assets](https://arxiv.org/abs/2507.00909)
        - [Latitude Media: The Mechanics of Data Center Flexibility](https://www.latitudemedia.com/news/catalyst-the-mechanics-of-data-center-flexibility/) - includes 90% preemptible workload finding
        - [Google Cloud: Using Demand Response](https://cloud.google.com/blog/products/infrastructure/using-demand-response-to-reduce-data-center-power-consumption)
        - [EPRI DCFlex Initiative](https://dcflex.epri.com/) - 45+ industry collaborators
        """)

    st.divider()

    # Market Structures
    with st.expander("Market Structures & Cost Allocation Framework"):
        st.write("""
        Cost allocation to residential customers varies significantly based on the market structure
        in which a utility operates. Our model adjusts allocation factors based on five distinct market types.
        """)

        # Regulated Markets
        st.markdown("### Regulated / Vertically Integrated Markets")
        st.caption("Duke Energy Carolinas, Georgia Power, APS Arizona, NV Energy, Xcel Colorado")
        reg_data = {
            "Parameter": ["Base Residential Allocation", "Capacity Cost Pass-Through", "Utility Owns Generation"],
            "Value": ["40%", "40%", "Yes"],
            "Source": [
                "[RAP Cost Allocation Manual](https://www.raponline.org/wp-content/uploads/2023/09/rap-lazar-chernick-marcus-lebel-electric-cost-allocation-new-era-2020-january.pdf)",
                "**Model Assumption** - Embedded in rate base",
                "[EIA-861 Data](https://www.eia.gov/electricity/data/eia861/)"
            ]
        }
        st.table(reg_data)

        # PJM Markets
        st.markdown("### PJM Capacity Market")
        st.caption("Dominion Virginia, AEP Ohio, AEP I&M, Appalachian Power")
        pjm_data = {
            "Parameter": ["Base Residential Allocation", "Capacity Cost Pass-Through", "2025/26 Capacity Price", "Price vs 2024/25"],
            "Value": ["35%", "50%", "**$269.92/MW-day**", "~10x increase"],
            "Source": [
                "**Model Assumption** - Lower due to deregulated retail",
                "**Model Assumption** - RPM cost pass-through",
                "[PJM 2025/26 BRA Report](https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2025-2026/2025-2026-base-residual-auction-report.pdf)",
                "[Prior: $28.92/MW-day](https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2024-2025/2024-2025-base-residual-auction-report.pdf)"
            ]
        }
        st.table(pjm_data)

        # ERCOT
        st.markdown("### ERCOT Energy-Only Market")
        st.caption("Texas Grid (ERCOT)")
        ercot_data = {
            "Parameter": ["Base Residential Allocation", "Capacity Cost Pass-Through", "Capacity Market", "4CP Transmission Rate", "Allocation Adjustment"],
            "Value": ["30%", "25%", "None", "~$5.50/kW-mo", "x 0.70"],
            "Source": [
                "**Model Assumption** - Large loads face prices directly",
                "**Model Assumption** - Only transmission CREZ costs",
                "[Potomac Economics: ERCOT State of Market](https://www.potomaceconomics.com/wp-content/uploads/2024/05/2023-State-of-the-Market-Report_Final.pdf)",
                "[ERCOT 4CP Program](https://www.ercot.com/services/rq/re/4cp)",
                "4CP methodology: DC pays directly for transmission"
            ]
        }
        st.table(ercot_data)

        st.success("""
        **ERCOT 4CP Transmission Allocation**

        ERCOT allocates transmission costs based on **Four Coincident Peak (4CP)** methodology.
        Transmission charges are based on a customer's load during the 4 highest system peak hours each year.
        This creates a **huge incentive for flexible loads**:

        - **Firm DC:** Pays full 4CP charges (likely operating at high capacity during peaks)
        - **Flexible DC:** Can curtail during the 4 peak hours, reducing transmission allocation by 25%+

        Our model applies a 0.70× multiplier to residential allocation for ERCOT because the 4CP methodology
        ensures data centers pay more directly for their transmission needs.
        """)

        # SPP
        st.markdown("### SPP (Southwest Power Pool)")
        st.caption("PSO Oklahoma, SWEPCO")
        spp_data = {
            "Parameter": ["Base Residential Allocation", "Capacity Cost Pass-Through", "Capacity Market"],
            "Value": ["40%", "40%", "None"],
            "Source": [
                "**Model Assumption** - [PSO rate structure](https://www.psoklahoma.com/company/about/rates/)",
                "**Model Assumption** - Bilateral capacity",
                "[SPP Markets & Operations](https://www.spp.org/markets-operations/)"
            ]
        }
        st.table(spp_data)

        st.markdown("#### PSO LPL Tariff Riders (Service Level 1 - Transmission)")
        st.caption("In addition to base demand/energy charges, PSO applies several riders affecting the all-in rate")
        pso_riders = {
            "Rider": ["FCA (Fuel Cost Adjustment)", "SPPTC (SPP Transmission)", "RRR (Renewable Resources)",
                     "DRR (Dispatchable Resource)", "DSM (Demand-Side Mgmt)", "TCR (Tax Change)"],
            "Rate": ["$0.0194/kWh", "$0.18/kW", "$1.95/kW", "$1.73/kW", "$0.0065/kWh", "2.614%"],
            "Notes": ["Passthrough - no ratepayer impact", "Demand-based", "Demand-based",
                     "Demand-based", "High-volume opt-out available", "Applied to base charges"]
        }
        st.table(pso_riders)
        st.info("""
        **All-in rate estimate:** ~$43-45/MWh at published tariff rates for transmission-level service,
        including base charges plus applicable riders. The base energy charge ($1.71/MWh) is small
        compared to demand charges and riders spread over consumed energy.

        Source: [PSO Tariff Book (Feb 2025)](https://www.psoklahoma.com/lib/docs/ratesandtariffs/Oklahoma/PSOLargeCommercialandIndustrialFeb2025.pdf)
        """)

        st.markdown("### Market-Adjusted Allocation Formula")
        st.code("""
Adjusted Allocation = Base Allocation x Market Multiplier

Where Market Multiplier:
- Regulated/SPP: 1.0 (no adjustment)
- PJM with high capacity prices (>$100/MW-day): 1.0 to 1.15
- ERCOT: 0.70 (4CP methodology means DC pays directly for transmission)
        """)

    st.divider()

    # Limitations
    with st.expander("Limitations & Caveats"):
        st.write("""
        This model provides order-of-magnitude estimates, not precise predictions.
        Key limitations include:

        - **Regional variation:** Infrastructure costs vary by 2-3x depending on location, terrain, and existing grid conditions.
        - **Regulatory uncertainty:** Actual cost allocation depends on state regulatory decisions which vary widely.
        - **Technology change:** Battery costs, renewable prices, and grid technology are evolving rapidly.
        - **Market dynamics:** Wholesale electricity prices fluctuate based on fuel costs, weather, and demand patterns.
        - **Simplified model:** We use linear projections and don't capture all feedback effects, step changes, or non-linear dynamics.
        """)

        st.warning("""
        **Use appropriately:** This tool is designed for educational purposes and initial analysis.
        Actual utility planning and rate-making involves much more detailed engineering and economic modeling.
        """)

    st.divider()

    # Open Source
    with st.expander("Open Source & Contributing"):
        st.write("""
        This tool is open source and we welcome contributions:

        - Report bugs or suggest improvements via GitHub issues
        - Submit pull requests with enhanced models or features
        - Share utility-specific data to improve regional accuracy
        - Help translate to make accessible to more communities
        """)

        st.code("github.com/DougMackenzie/community-energy")
        st.caption("Licensed under MIT License")

    st.divider()

    # Contact/Navigation
    st.markdown("""
    <div style="background: #1f2937; color: white; padding: 1.5rem; border-radius: 0.75rem;">
        <h3 style="margin: 0 0 0.75rem 0;">Questions or Feedback?</h3>
        <p style="color: #d1d5db; margin: 0;">
            If you have questions about the methodology, want to report an error,
            or have suggestions for improvement, we'd love to hear from you.
        </p>
    </div>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Back to Calculator", use_container_width=True):
            st.switch_page("pages/1_Calculator.py")
    with col2:
        if st.button("Back to Home", type="primary", use_container_width=True):
            st.switch_page("app.py")


if __name__ == "__main__":
    main()
