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

interface CalculatorContextType {
    utility: Utility;
    dataCenter: DataCenter;
    selectedScenarios: string[];
    projectionYears: number;
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
    resetToDefaults: () => void;
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

    const trajectories = useMemo(() => {
        return generateAllTrajectories(utility, dataCenter, projectionYears);
    }, [utility, dataCenter, projectionYears]);

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

    const resetToDefaults = useCallback(() => {
        setUtility(DEFAULT_UTILITY);
        setDataCenter(DEFAULT_DATA_CENTER);
        setSelectedScenarios(['baseline', 'unoptimized', 'flexible', 'dispatchable']);
        setProjectionYears(10);
    }, []);

    const value: CalculatorContextType = {
        utility,
        dataCenter,
        selectedScenarios,
        projectionYears,
        trajectories,
        chartData,
        summary,
        updateUtility,
        updateDataCenter,
        toggleScenario,
        setSelectedScenarios,
        setProjectionYears,
        resetToDefaults,
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
