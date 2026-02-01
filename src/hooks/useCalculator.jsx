/**
 * Calculator Context and Hook
 *
 * Provides centralized state management for calculator inputs
 * and computed trajectory data. Now includes tariff data integration.
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { DEFAULT_UTILITY, DEFAULT_DATA_CENTER } from '../data/constants';
import {
  generateAllTrajectories,
  formatTrajectoriesForChart,
  calculateSummaryStats,
} from '../utils/calculations';
import { UTILITY_PROFILES, getUtilityById, getUtilitiesGroupedByISO } from '../data/utilityData';
import { getTariffById } from '../data/calculatorTariffs';

// Create context
const CalculatorContext = createContext(null);

/**
 * Calculator Provider Component
 */
export const CalculatorProvider = ({ children }) => {
  // Utility parameters (user can customize)
  const [utility, setUtility] = useState(DEFAULT_UTILITY);

  // Data center parameters (user can customize)
  const [dataCenter, setDataCenter] = useState(DEFAULT_DATA_CENTER);

  // UI state
  const [selectedScenarios, setSelectedScenarios] = useState(['baseline', 'unoptimized', 'flexible', 'dispatchable']);
  const [projectionYears, setProjectionYears] = useState(10);
  const [selectedUtilityId, setSelectedUtilityId] = useState('public-service-company-of-oklahoma-pso-ok');

  // Get selected utility profile
  const selectedUtilityProfile = useMemo(() => {
    return getUtilityById(selectedUtilityId);
  }, [selectedUtilityId]);

  // Get tariff data for selected utility
  const tariffData = useMemo(() => {
    if (!selectedUtilityProfile?.tariffId) return null;
    return getTariffById(selectedUtilityProfile.tariffId);
  }, [selectedUtilityProfile]);

  // Calculate trajectories using tariff data (memoized for performance)
  const trajectories = useMemo(() => {
    return generateAllTrajectories(utility, dataCenter, projectionYears, tariffData);
  }, [utility, dataCenter, projectionYears, tariffData]);

  // Format for charts
  const chartData = useMemo(() => {
    return formatTrajectoriesForChart(trajectories);
  }, [trajectories]);

  // Summary statistics
  const summary = useMemo(() => {
    return calculateSummaryStats(trajectories, utility);
  }, [trajectories, utility]);

  // Update functions
  const updateUtility = useCallback((updates) => {
    setUtility(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDataCenter = useCallback((updates) => {
    setDataCenter(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleScenario = useCallback((scenarioId) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        // Don't allow deselecting all scenarios
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== scenarioId);
      }
      return [...prev, scenarioId];
    });
  }, []);

  const selectUtilityProfile = useCallback((utilityId) => {
    const profile = getUtilityById(utilityId);
    if (profile) {
      setSelectedUtilityId(utilityId);
      setUtility(prev => ({
        ...prev,
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
        // ISO/RTO for capacity cost lookup
        isoRto: profile.isoRto,
      }));
      setDataCenter(prev => ({
        ...prev,
        capacityMW: profile.defaultDataCenterMW,
        onsiteGenerationMW: Math.round(profile.defaultDataCenterMW * 0.2),
      }));
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setUtility(DEFAULT_UTILITY);
    setDataCenter(DEFAULT_DATA_CENTER);
    setSelectedScenarios(['baseline', 'unoptimized', 'flexible', 'dispatchable']);
    setProjectionYears(10);
    setSelectedUtilityId('public-service-company-of-oklahoma-pso-ok');
  }, []);

  // Context value
  const value = {
    // State
    utility,
    dataCenter,
    selectedScenarios,
    projectionYears,
    selectedUtilityId,
    selectedUtilityProfile,

    // Tariff data
    tariffData,

    // Computed
    trajectories,
    chartData,
    summary,

    // Actions
    updateUtility,
    updateDataCenter,
    toggleScenario,
    setSelectedScenarios,
    setProjectionYears,
    selectUtilityProfile,
    resetToDefaults,

    // Data
    utilityProfiles: UTILITY_PROFILES,
    utilitiesGroupedByISO: getUtilitiesGroupedByISO(),
  };

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
};

/**
 * Hook to access calculator context
 */
export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
};

export default useCalculator;
