/**
 * Scrollytelling Story Data
 * Educational narrative about AI data center scale and grid impact
 *
 * Power Reference (2025-2026):
 * - NVIDIA Rubin GPU: ~2,300W (2.3 kW)
 * - AI Server Rack (Vera Rubin NVL72): 120-130 kW
 * - Future Rack (Rubin Ultra/Kyber, 2027): 600 kW
 * - Hyperscale Facility: 100-500+ MW
 * - Data Center Campus: 500-2,000+ MW
 *
 * Relatable Comparisons:
 * - Avg US Home continuous demand: ~1.2 kW
 * - Avg US Home peak demand (with A/C): ~5-10 kW
 * - Medium office building (100k sq ft): ~250 kW avg
 * - Empire State Building peak: 9.5 MW
 * - Avg nuclear reactor: ~1,000 MW (1 GW)
 * - Avg natural gas plant: ~400 MW
 *
 * Sources: EIA, NVIDIA, EPRI, PJM, Dominion Energy IRP
 */

export interface MapLocation {
    lng: number;
    lat: number;
    zoom: number;
    pitch: number;
    bearing: number;
}

export interface StoryStep {
    id: string;
    mode: 'micro' | 'map' | 'infrastructure';
    visualState?: string;
    location?: MapLocation;
    title: string;
    text: string;
    subtext?: string;
    layerColor?: string;
    // Power metrics for display
    powerMetric?: {
        value: string;
        unit: string;
        comparison: string;
    };
    // Region data for map coloring
    region?: {
        name: string;
        type: 'iso' | 'regulated' | 'deregulated';
        color: string;
    };
}

export const steps: StoryStep[] = [
    // --- PHASE 1: THE MICRO VIEW - Zooming out from a single chip ---
    {
        id: 'chip',
        mode: 'micro',
        visualState: 'chip-glow',
        title: "A Single GPU",
        text: "This is an NVIDIA Rubin GPU, the latest generation of AI accelerator. At 2,300 watts of continuous power draw, one chip consumes roughly the same electricity as two average American homes.",
        subtext: "NVIDIA expects volume production of Rubin systems in late 2026.",
        powerMetric: {
            value: "2.3",
            unit: "kW",
            comparison: "≈ 2 homes"
        }
    },
    {
        id: 'rack',
        mode: 'micro',
        visualState: 'rack-zoom',
        title: "A Server Rack",
        text: "AI training requires thousands of GPUs working together. A Rubin Ultra Kyber rack contains 576 GPU dies in a fully liquid-immersed, fanless design—drawing 600 kW continuously, equivalent to powering 500 homes.",
        subtext: "These racks require full liquid immersion cooling and 40°C inlet water for heat extraction.",
        powerMetric: {
            value: "600",
            unit: "kW",
            comparison: "≈ 500 homes"
        }
    },
    {
        id: 'pod',
        mode: 'micro',
        visualState: 'pod-zoom',
        title: "A Compute Pod",
        text: "Multiple Kyber racks form a compute pod. With 8 racks at 600 kW each, a single pod draws 4.8 MW continuously—as much power as a small downtown district.",
        powerMetric: {
            value: "4.8",
            unit: "MW",
            comparison: "≈ 4,000 homes"
        }
    },
    {
        id: 'facility',
        mode: 'micro',
        visualState: 'building-iso',
        title: "A Data Center Facility",
        text: "A single data center building with 125 Kyber racks draws 75-150 MW continuously. Rooftop cooling equipment rejects heat to the atmosphere while backup generators ensure 99.999% uptime.",
        subtext: "Each facility requires its own transformer substation and dedicated utility feed. Buildings this size need planning years in advance.",
        powerMetric: {
            value: "75-150",
            unit: "MW",
            comparison: "≈ 60,000-125,000 homes"
        }
    },
    {
        id: 'campus',
        mode: 'micro',
        visualState: 'campus-grid',
        title: "A Hyperscale Campus",
        text: "Four data center buildings share a central 345kV substation, battery storage, and transmission corridor. At 600 MW total capacity, this campus rivals a small nuclear plant in power consumption.",
        subtext: "Building a campus this size requires 3-5 years of planning, $2-4 billion in capital, and coordination with regional transmission operators.",
        powerMetric: {
            value: "600",
            unit: "MW",
            comparison: "≈ small nuclear plant"
        }
    },

    // --- PHASE 2: TRANSITION - Infrastructure becomes visible (map starts here) ---
    {
        id: 'grid-connection',
        mode: 'infrastructure',
        visualState: 'campus-grid',
        // Start zoomed in very tight on Ashburn data center campus for seamless 3D-to-map transition
        location: { lng: -77.4875, lat: 39.0437, zoom: 16, pitch: 55, bearing: -30 },
        title: "The Grid Connection",
        text: "These massive campuses connect directly to high-voltage transmission lines. The transition from 3D model to satellite view shows real data center locations in Northern Virginia—the world's largest data center market.",
        powerMetric: {
            value: "600",
            unit: "MW",
            comparison: "≈ small nuclear plant"
        },
        layerColor: '#EF4444',
    },

    // --- PHASE 3: THE MACRO VIEW - Continuous sweeping pan across regions ---
    {
        id: 'nova',
        mode: 'map',
        // Pull back to see the NOVA cluster, slight bearing shift for sweep feel
        location: { lng: -77.46, lat: 39.03, zoom: 10, pitch: 50, bearing: -20 },
        title: "Northern Virginia: Data Center Alley",
        text: "The world's largest data center market. With 5.6 GW of capacity, Northern Virginia hosts more computing power than most countries. This cluster alone consumes 25% of Virginia's electricity—more than all residential customers combined.",
        subtext: "70% of global internet traffic flows through Loudoun County. Dominion Energy projects data center demand reaching 9 GW by 2035.",
        powerMetric: {
            value: "5.6",
            unit: "GW",
            comparison: "≈ 5 nuclear plants"
        },
        region: {
            name: 'PJM Interconnection',
            type: 'iso',
            color: '#EF4444'
        },
        layerColor: '#EF4444',
    },
    {
        id: 'ohio',
        mode: 'map',
        // Pan northwest to Ohio - bearing continues sweep
        location: { lng: -82.99, lat: 40.10, zoom: 8, pitch: 45, bearing: 10 },
        title: "Ohio: The Emerging Frontier",
        text: "Central Ohio is experiencing rapid data center growth as Virginia reaches capacity constraints. AEP Ohio has seen interconnection requests surge, with several gigawatts in the pipeline. Without careful planning, infrastructure costs flow to residential ratepayers.",
        region: {
            name: 'PJM Interconnection',
            type: 'iso',
            color: '#F59E0B'
        },
        layerColor: '#F59E0B',
    },
    {
        id: 'oklahoma',
        mode: 'map',
        // Pan southwest to Oklahoma - continuous westward motion
        location: { lng: -96.50, lat: 35.50, zoom: 7, pitch: 40, bearing: 25 },
        title: "Oklahoma: Regulated Market Structure",
        text: "In traditionally regulated markets like Oklahoma (PSO, SPP region), utilities and regulators can design tariff structures that assign infrastructure costs to the customers who cause them. This 'cost causation' principle protects existing ratepayers.",
        subtext: "Regulated utilities use integrated resource planning (IRP) to forecast and allocate costs over 15-20 year horizons.",
        region: {
            name: 'SPP (Southwest Power Pool)',
            type: 'regulated',
            color: '#3B82F6'
        },
        layerColor: '#3B82F6',
    },
    {
        id: 'texas',
        mode: 'map',
        // Pan south to Texas - bearing rotates to face south
        location: { lng: -97.50, lat: 31.50, zoom: 6, pitch: 35, bearing: 15 },
        title: "Texas: The ERCOT Model",
        text: "ERCOT's deregulated market uses '4CP' transmission charges that allocate costs based on usage during the four annual coincident peaks. Data centers that reduce load during these critical hours pay significantly less—creating strong incentives for flexibility.",
        subtext: "Flexible data centers acting as 'virtual power plants' can reduce their peak contribution by 25%, lowering both their own costs and grid stress.",
        region: {
            name: 'ERCOT',
            type: 'deregulated',
            color: '#10B981'
        },
        layerColor: '#10B981',
    },
    {
        id: 'usa',
        mode: 'map',
        // Pull way back to see full US - level view
        location: { lng: -96.00, lat: 38.50, zoom: 4, pitch: 0, bearing: 0 },
        title: "The National Picture: 150 GW by 2035",
        text: "U.S. data centers consumed 176 TWh in 2023—about 4.4% of national electricity. By 2035, AI and cloud computing demand is projected to drive total capacity to 150+ GW, requiring 100+ GW of new generation. How we structure rates and incentivize flexibility today determines whether this growth benefits or burdens residential ratepayers.",
        subtext: "Meeting this demand will require a mix of nuclear restarts and SMRs, new gas plants, and massive renewable buildout. Flexible data center operation could defer $50+ billion in grid upgrades while enabling faster deployment.",
        powerMetric: {
            value: "150+",
            unit: "GW by 2035",
            comparison: "6x growth from 2024"
        },
        region: {
            name: 'United States',
            type: 'iso',
            color: '#6366F1'
        },
        layerColor: '#6366F1',
    },
];

// Regional market data for map visualization
export const regionData = {
    pjm: {
        name: 'PJM Interconnection',
        states: ['VA', 'MD', 'PA', 'OH', 'WV', 'NJ', 'DE', 'DC', 'NC', 'KY', 'IN', 'IL', 'MI'],
        type: 'iso' as const,
        color: '#EF4444',
        dataCenterCapacityGW: 8.5,
        growthRate: 0.15,
        capacityPrice2025: 269.92, // $/MW-day
    },
    ercot: {
        name: 'ERCOT',
        states: ['TX'],
        type: 'deregulated' as const,
        color: '#10B981',
        dataCenterCapacityGW: 2.1,
        growthRate: 0.20,
    },
    spp: {
        name: 'Southwest Power Pool',
        states: ['OK', 'KS', 'NE', 'ND', 'SD', 'MT', 'WY', 'NM', 'AR', 'LA', 'MO'],
        type: 'regulated' as const,
        color: '#3B82F6',
        dataCenterCapacityGW: 0.8,
        growthRate: 0.12,
    },
    miso: {
        name: 'MISO',
        states: ['MN', 'WI', 'IA', 'IL', 'IN', 'MI', 'MO', 'AR', 'LA', 'MS'],
        type: 'iso' as const,
        color: '#8B5CF6',
        dataCenterCapacityGW: 1.2,
        growthRate: 0.10,
    },
    caiso: {
        name: 'California ISO',
        states: ['CA'],
        type: 'iso' as const,
        color: '#F59E0B',
        dataCenterCapacityGW: 1.5,
        growthRate: 0.08,
    },
};

// Power plant reference data for visualization
export const powerPlantTypes = {
    nuclear: { avgCapacityMW: 1000, color: '#8B5CF6', icon: 'nuclear' },
    naturalGas: { avgCapacityMW: 400, color: '#F59E0B', icon: 'gas' },
    coal: { avgCapacityMW: 380, color: '#6B7280', icon: 'coal' },
    solar: { avgCapacityMW: 100, color: '#FBBF24', icon: 'solar' },
    wind: { avgCapacityMW: 150, color: '#34D399', icon: 'wind' },
};

// Growth projection data (for animation) - Extended to 2035 for 150+ GW
export const growthProjection = {
    2024: { totalGW: 25, novaGW: 4.9, percentOfUS: 4.4 },
    2025: { totalGW: 30, novaGW: 5.6, percentOfUS: 5.2 },
    2026: { totalGW: 38, novaGW: 6.5, percentOfUS: 6.5 },
    2028: { totalGW: 55, novaGW: 8.5, percentOfUS: 8.5 },
    2030: { totalGW: 80, novaGW: 13.8, percentOfUS: 12.0 },
    2032: { totalGW: 110, novaGW: 18.0, percentOfUS: 15.5 },
    2034: { totalGW: 135, novaGW: 22.0, percentOfUS: 18.0 },
    2035: { totalGW: 155, novaGW: 25.0, percentOfUS: 20.0 },
};

// Color mapping for market types
export const marketTypeColors = {
    iso: '#EF4444',       // Red - organized capacity markets
    regulated: '#3B82F6', // Blue - traditional regulated utilities
    deregulated: '#10B981', // Green - deregulated energy-only markets
};

// Color mapping for risk/status levels
export const riskColors = {
    danger: '#EF4444',    // Red - high cost risk
    warning: '#F59E0B',   // Amber - emerging risk
    protected: '#3B82F6', // Blue - regulated/protected
    optimized: '#10B981', // Green - flexible/optimized
    vision: '#6366F1',    // Indigo - national view
};
