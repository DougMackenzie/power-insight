'use client';

/**
 * Calculator Context and Hook (TypeScript)
 */

import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { DEFAULT_UTILITY, DEFAULT_DATA_CENTER, ESCALATION_RANGES, type Utility, type DataCenter } from '@/lib/constants';
import {
    generateAllTrajectories,
    formatTrajectoriesForChart,
    calculateSummaryStats,
    type SummaryStats,
    type TrajectoryPoint,
    type EscalationConfig,
} from '@/lib/calculations';
import { UTILITY_PROFILES, getUtilityById, getUtilitiesSortedByState, type UtilityProfile } from '@/lib/utilityData';
import { MARKET_FORECASTS, calculateUtilityMarketShare, type ForecastScenario } from '@/lib/marketForecasts';

interface CalculatorContextType {
    utility: Utility;
    dataCenter: DataCenter;
    selectedScenarios: string[];
    projectionYears: number;
    selectedUtilityId: string;
    selectedUtilityProfile: UtilityProfile | undefined;
    trajectories: {
        baseline: TrajectoryPoint[];
        unoptimized: TrajectoryPoint[];
        flexible: TrajectoryPoint[];
        dispatchable: TrajectoryPoint[];
    };
    chartData: any[];
    summary: SummaryStats;
    // Escalation controls
    inflationEnabled: boolean;
    inflationRate: number;
    infrastructureAgingEnabled: boolean;
    infrastructureAgingRate: number;
    setInflationEnabled: (enabled: boolean) => void;
    setInflationRate: (rate: number) => void;
    setInfrastructureAgingEnabled: (enabled: boolean) => void;
    setInfrastructureAgingRate: (rate: number) => void;
    // Forecast scenario
    forecastScenario: ForecastScenario;
    setForecastScenario: (scenario: ForecastScenario) => void;
    // Actions
    updateUtility: (updates: Partial<Utility>) => void;
    updateDataCenter: (updates: Partial<DataCenter>) => void;
    toggleScenario: (scenarioId: string) => void;
    setSelectedScenarios: (scenarios: string[]) => void;
    setProjectionYears: (years: number) => void;
    selectUtilityProfile: (utilityId: string) => void;
    resetToDefaults: () => void;
    utilityProfiles: UtilityProfile[];
}

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export const CalculatorProvider = ({ children }: { children: ReactNode }) => {
    const [utility, setUtility] = useState<Utility>(DEFAULT_UTILITY);
    const [dataCenter, setDataCenter] = useState<DataCenter>(DEFAULT_DATA_CENTER);
    const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
        'baseline',
        'unoptimized',
        'flexible',
        'dispatchable',
    ]);
    const [projectionYears, setProjectionYears] = useState(10);
    const [selectedUtilityId, setSelectedUtilityId] = useState<string>('pso-oklahoma');

    // Escalation control state - default OFF for flat baseline
    const [inflationEnabled, setInflationEnabled] = useState(false);
    const [inflationRate, setInflationRate] = useState(ESCALATION_RANGES.inflation.default);
    const [infrastructureAgingEnabled, setInfrastructureAgingEnabled] = useState(false);
    const [infrastructureAgingRate, setInfrastructureAgingRate] = useState(ESCALATION_RANGES.infrastructureAging.default);

    // Forecast scenario state - default to aggressive
    const [forecastScenario, setForecastScenario] = useState<ForecastScenario>('aggressive');

    const selectedUtilityProfile = useMemo(() => {
        return getUtilityById(selectedUtilityId);
    }, [selectedUtilityId]);

    // Initialize from selected utility on mount
    useEffect(() => {
        const profile = getUtilityById(selectedUtilityId);
        if (profile) {
            // Set utility values
            setUtility({
                ...DEFAULT_UTILITY,
                residentialCustomers: profile.residentialCustomers,
                averageMonthlyBill: profile.averageMonthlyBill,
                averageMonthlyUsage: profile.averageMonthlyUsageKWh,
                systemPeakMW: profile.systemPeakMW,
                baseResidentialAllocation: profile.market.baseResidentialAllocation,
                marketType: profile.market.type,
                hasCapacityMarket: profile.market.hasCapacityMarket,
                capacityCostPassThrough: profile.market.capacityCostPassThrough,
                capacityPrice2024: profile.market.capacityPrice2024,
                totalGenerationCapacityMW: profile.totalGenerationCapacityMW,
                currentReserveMargin: profile.currentReserveMargin,
                interconnection: profile.interconnection,
                marginalEnergyCost: profile.market.marginalEnergyCost,
            });

            // Set data center capacity from utility's default
            const defaultCapacityMW = profile.defaultDataCenterMW && profile.defaultDataCenterMW > 0
                ? profile.defaultDataCenterMW
                : 1000;

            setDataCenter((prev) => ({
                ...prev,
                capacityMW: defaultCapacityMW,
                onsiteGenerationMW: Math.round(defaultCapacityMW * 0.2),
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Build escalation config from state
    const escalationConfig: EscalationConfig = useMemo(() => ({
        inflationEnabled,
        inflationRate,
        infrastructureAgingEnabled,
        infrastructureAgingRate,
    }), [inflationEnabled, inflationRate, infrastructureAgingEnabled, infrastructureAgingRate]);

    const trajectories = useMemo(() => {
        // Pass the tariff from the selected utility profile for utility-specific demand charge calculations
        const tariff = selectedUtilityProfile?.tariff;
        return generateAllTrajectories(utility, dataCenter, projectionYears, tariff, escalationConfig);
    }, [utility, dataCenter, projectionYears, selectedUtilityProfile, escalationConfig]);

    const chartData = useMemo(() => {
        return formatTrajectoriesForChart(trajectories);
    }, [trajectories]);

    const summary = useMemo(() => {
        return calculateSummaryStats(trajectories, utility);
    }, [trajectories, utility]);

    const updateUtility = useCallback((updates: Partial<Utility>) => {
        setUtility((prev) => ({ ...prev, ...updates }));
    }, []);

    const updateDataCenter = useCallback((updates: Partial<DataCenter>) => {
        setDataCenter((prev) => ({ ...prev, ...updates }));
    }, []);

    const toggleScenario = useCallback((scenarioId: string) => {
        setSelectedScenarios((prev) => {
            if (prev.includes(scenarioId)) {
                if (prev.length === 1) return prev;
                return prev.filter((s) => s !== scenarioId);
            }
            return [...prev, scenarioId];
        });
    }, []);

    const selectUtilityProfile = useCallback((utilityId: string) => {
        const profile = getUtilityById(utilityId);
        if (profile) {
            setSelectedUtilityId(utilityId);
            // Auto-populate utility values from profile including market structure
            setUtility({
                ...utility,
                residentialCustomers: profile.residentialCustomers,
                averageMonthlyBill: profile.averageMonthlyBill,
                averageMonthlyUsage: profile.averageMonthlyUsageKWh,
                systemPeakMW: profile.systemPeakMW,
                // Market structure fields - use market-specific allocation
                baseResidentialAllocation: profile.market.baseResidentialAllocation,
                marketType: profile.market.type,
                hasCapacityMarket: profile.market.hasCapacityMarket,
                capacityCostPassThrough: profile.market.capacityCostPassThrough,
                capacityPrice2024: profile.market.capacityPrice2024,
                // Endogenous capacity pricing fields
                totalGenerationCapacityMW: profile.totalGenerationCapacityMW,
                currentReserveMargin: profile.currentReserveMargin,
                // Interconnection cost structure (CIAC vs network upgrades)
                interconnection: profile.interconnection,
                // Wholesale energy cost for margin calculations
                marginalEnergyCost: profile.market.marginalEnergyCost,
            });

            // Calculate DC capacity - prefer utility-specific default, fall back to market share
            let defaultCapacityMW: number;

            if (profile.defaultDataCenterMW && profile.defaultDataCenterMW > 0) {
                // Use utility-specific default if available (e.g., PSO 6000 MW)
                defaultCapacityMW = profile.defaultDataCenterMW;
            } else if (profile.market?.type) {
                // Otherwise calculate from market share
                const marketForecast = MARKET_FORECASTS[profile.market.type];
                if (marketForecast) {
                    const share = calculateUtilityMarketShare(
                        profile.systemPeakMW,
                        marketForecast,
                        forecastScenario
                    );
                    defaultCapacityMW = Math.round(share.utilityNetGrowthMW);
                } else {
                    defaultCapacityMW = 1000; // fallback
                }
            } else {
                defaultCapacityMW = 1000; // fallback
            }

            // Auto-populate data center capacity
            setDataCenter((prev) => ({
                ...prev,
                capacityMW: defaultCapacityMW,
                onsiteGenerationMW: Math.round(defaultCapacityMW * 0.2),
            }));
        }
    }, [utility]);

    // Recalculate DC capacity when forecast scenario changes (for utilities without specific defaults)
    useEffect(() => {
        const profile = getUtilityById(selectedUtilityId);
        if (profile && (!profile.defaultDataCenterMW || profile.defaultDataCenterMW === 0) && profile.market?.type) {
            const marketForecast = MARKET_FORECASTS[profile.market.type];
            if (marketForecast) {
                const share = calculateUtilityMarketShare(
                    profile.systemPeakMW,
                    marketForecast,
                    forecastScenario
                );
                setDataCenter((prev) => ({
                    ...prev,
                    capacityMW: Math.round(share.utilityNetGrowthMW),
                    onsiteGenerationMW: Math.round(share.utilityNetGrowthMW * 0.2),
                }));
            }
        }
    }, [forecastScenario, selectedUtilityId]);

    const resetToDefaults = useCallback(() => {
        setUtility(DEFAULT_UTILITY);
        setDataCenter(DEFAULT_DATA_CENTER);
        setSelectedScenarios(['baseline', 'unoptimized', 'flexible', 'dispatchable']);
        setProjectionYears(10);
        setSelectedUtilityId('pso-oklahoma');
        // Reset escalation controls to defaults (OFF)
        setInflationEnabled(false);
        setInflationRate(ESCALATION_RANGES.inflation.default);
        setInfrastructureAgingEnabled(false);
        setInfrastructureAgingRate(ESCALATION_RANGES.infrastructureAging.default);
        // Reset forecast scenario to aggressive (default)
        setForecastScenario('aggressive');
    }, []);

    const value: CalculatorContextType = {
        utility,
        dataCenter,
        selectedScenarios,
        projectionYears,
        selectedUtilityId,
        selectedUtilityProfile,
        trajectories,
        chartData,
        summary,
        // Escalation controls
        inflationEnabled,
        inflationRate,
        infrastructureAgingEnabled,
        infrastructureAgingRate,
        setInflationEnabled,
        setInflationRate,
        setInfrastructureAgingEnabled,
        setInfrastructureAgingRate,
        // Forecast scenario
        forecastScenario,
        setForecastScenario,
        // Actions
        updateUtility,
        updateDataCenter,
        toggleScenario,
        setSelectedScenarios,
        setProjectionYears,
        selectUtilityProfile,
        resetToDefaults,
        utilityProfiles: getUtilitiesSortedByState(),
    };

    return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
};

export const useCalculator = () => {
    const context = useContext(CalculatorContext);
    if (!context) {
        throw new Error('useCalculator must be used within a CalculatorProvider');
    }
    return context;
};

export default useCalculator;
