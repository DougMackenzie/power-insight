'use client';

/**
 * Calculator Context and Hook (TypeScript)
 */

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { DEFAULT_UTILITY, DEFAULT_DATA_CENTER, type Utility, type DataCenter } from '@/lib/constants';
import {
    generateAllTrajectories,
    formatTrajectoriesForChart,
    calculateSummaryStats,
    type SummaryStats,
    type TrajectoryPoint,
} from '@/lib/calculations';
import { UTILITY_PROFILES, getUtilityById, getUtilitiesSortedByState, type UtilityProfile } from '@/lib/utilityData';

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

    const selectedUtilityProfile = useMemo(() => {
        return getUtilityById(selectedUtilityId);
    }, [selectedUtilityId]);

    const trajectories = useMemo(() => {
        // Pass the tariff from the selected utility profile for utility-specific demand charge calculations
        const tariff = selectedUtilityProfile?.tariff;
        return generateAllTrajectories(utility, dataCenter, projectionYears, tariff);
    }, [utility, dataCenter, projectionYears, selectedUtilityProfile]);

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
            });
            // Auto-populate data center capacity
            setDataCenter((prev) => ({
                ...prev,
                capacityMW: profile.defaultDataCenterMW,
                onsiteGenerationMW: Math.round(profile.defaultDataCenterMW * 0.2),
            }));
        }
    }, [utility]);

    const resetToDefaults = useCallback(() => {
        setUtility(DEFAULT_UTILITY);
        setDataCenter(DEFAULT_DATA_CENTER);
        setSelectedScenarios(['baseline', 'unoptimized', 'flexible', 'dispatchable']);
        setProjectionYears(10);
        setSelectedUtilityId('pso-oklahoma');
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
