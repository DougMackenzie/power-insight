# Tariff Database Integration Guide
## Power-Insight Application Enhancement

**Document Version:** 1.0
**Last Updated:** February 2026
**Data Source:** E3 "Tailored for Scale" Study + Utility Tariff Filings

---

## Executive Summary

This guide outlines how to integrate the comprehensive Large Load Tariff Database (88 utilities) into the Power-Insight calculator application. The integration enables:

1. **Accurate Cost Forecasting** using actual utility tariff structures
2. **Utility-Specific Protection Analysis** showing ring-fencing mechanisms
3. **Interactive Map Visualization** with utility service territory boundaries
4. **Revenue Adequacy Documentation** using real rate schedules

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model Changes](#2-data-model-changes)
3. [Calculator Methodology Updates](#3-calculator-methodology-updates)
4. [Map Visualization Component](#4-map-visualization-component)
5. [Protection Matrix Enhancement](#5-protection-matrix-enhancement)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [API Endpoints](#7-api-endpoints)
8. [File Structure](#8-file-structure)

---

## 1. Architecture Overview

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│  src/data/utilityData.js     → 14 hardcoded utility profiles    │
│  src/data/constants.js       → Generic rate assumptions         │
│  src/utils/calculations.js   → $9,050/MW demand, $4.88/MWh     │
│  src/components/             → Static utility dropdown          │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed State

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENHANCED ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │  Tariff Database    │───▶│  88 utilities with actual    │   │
│  │  (JSON/SQLite)      │    │  demand charges, energy      │   │
│  │                     │    │  rates, fuel adjustments     │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │  Protection Matrix  │───▶│  CIAC, ratchets, take-or-pay │   │
│  │  (Calculated)       │    │  exit fees, contract terms   │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │  GeoJSON Boundaries │───▶│  Utility service territories │   │
│  │  (EIA/HIFLD)        │    │  for interactive map         │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │  Calculator Engine  │───▶│  Actual tariff-based costs   │   │
│  │  (Updated)          │    │  with peak/off-peak TOU      │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model Changes

### 2.1 New Tariff Data Structure

Create `src/data/tariffDatabase.js`:

```javascript
/**
 * Large Load Tariff Database
 * Source: E3 "Tailored for Scale" Study + Utility Filings
 *
 * Rate structure for 600MW @ 80% LF data center analysis
 */

export const TARIFF_DATABASE = [
  {
    id: "pso-oklahoma",
    utility: "Public Service Company of Oklahoma (PSO)",
    state: "OK",
    region: "Plains",
    iso: "SPP",

    // Tariff identification
    tariffName: "Large Power & Light (LPL)",
    rateSchedule: "Schedule 242/244/246",
    effectiveDate: "2025-01-30",
    status: "Active",

    // Rate components ($/kW-month and $/kWh)
    rates: {
      minLoadMW: 1,
      peakDemand: 7.05,        // $/kW-month
      offPeakDemand: 2.47,     // $/kW-month
      peakEnergy: 0.00171,     // $/kWh
      offPeakEnergy: 0.00125,  // $/kWh
      fuelAdjustment: 0.035,   // $/kWh rider
    },

    // Protection mechanisms
    protection: {
      contractYears: 7,
      ratchetPercent: 90,
      demandRatchet: true,
      ciac: true,              // Contribution in Aid of Construction
      takeOrPay: false,
      exitFee: true,
      creditRequirement: true,
      dcSpecificRate: false,
      collateralRequired: true,
    },

    // Calculated values (for 600MW @ 80% LF)
    calculated: {
      blendedRate: null,       // Calculated dynamically
      annualCostM: null,       // Calculated dynamically
      protectionScore: null,   // Calculated dynamically
      protectionRating: null,  // "High" | "Mid" | "Low"
    },

    // Documentation
    citation: {
      document: "PSO Large Commercial and Industrial Tariff",
      url: "https://www.psoklahoma.com/rates",
      pageReference: "Sheet No. 20-3 (Minimum Monthly Demand)",
      docketNumber: "OCC Cause No. PUD 202300123",
    },

    // Notes
    notes: "11 large load customers (779 MW total)",
  },
  // ... 87 more utilities
];

/**
 * Calculate blended rate for given load profile
 *
 * Formula:
 * Blended = (PeakDemand*MW + OffPeakDemand*MW*0.5 +
 *            (PeakEnergy+Fuel)*PeakKWh + (OffPeakEnergy+Fuel)*OffPeakKWh + Fixed) / TotalKWh
 */
export function calculateBlendedRate(utility, loadProfile) {
  const {
    capacityMW = 600,
    loadFactor = 0.80,
    peakEnergyPercent = 0.40,
    offPeakEnergyPercent = 0.60,
  } = loadProfile;

  const avgMW = capacityMW * loadFactor;
  const monthlyKWh = avgMW * 730 * 1000; // 730 hours/month
  const peakKWh = monthlyKWh * peakEnergyPercent;
  const offPeakKWh = monthlyKWh * offPeakEnergyPercent;

  const { rates } = utility;

  // Demand costs (monthly)
  const peakDemandCost = rates.peakDemand * capacityMW * 1000;
  const offPeakDemandCost = rates.offPeakDemand * capacityMW * 1000 * 0.5;

  // Energy costs (monthly)
  const peakEnergyCost = (rates.peakEnergy + rates.fuelAdjustment) * peakKWh;
  const offPeakEnergyCost = (rates.offPeakEnergy + rates.fuelAdjustment) * offPeakKWh;

  // Fixed charges (estimate $500/month for large load)
  const fixedCharges = 500;

  const totalMonthlyCost = peakDemandCost + offPeakDemandCost +
                           peakEnergyCost + offPeakEnergyCost + fixedCharges;

  return {
    blendedRate: totalMonthlyCost / monthlyKWh,
    monthlyCost: totalMonthlyCost,
    annualCost: totalMonthlyCost * 12,
    components: {
      peakDemandCost,
      offPeakDemandCost,
      peakEnergyCost,
      offPeakEnergyCost,
      fixedCharges,
    },
  };
}

/**
 * Calculate protection score based on utility's ring-fencing mechanisms
 *
 * Scoring (max 19 points):
 * - Ratchet %: >=90% (+3), 80-89% (+2), 60-79% (+1)
 * - Contract Term: >=15yr (+3), 10-14yr (+2), 5-9yr (+1)
 * - CIAC Required: Yes (+2)
 * - Take-or-Pay: Yes (+2)
 * - Exit Fee: Yes (+2)
 * - Demand Ratchet: Yes (+1)
 * - Credit Requirement: Yes (+1)
 * - DC-Specific Rate: Yes (+2)
 * - Collateral Required: Yes (+1)
 * - Min Load >=50MW: Yes (+1)
 */
export function calculateProtectionScore(utility) {
  const p = utility.protection;
  let score = 0;

  // Ratchet percentage
  if (p.ratchetPercent >= 90) score += 3;
  else if (p.ratchetPercent >= 80) score += 2;
  else if (p.ratchetPercent >= 60) score += 1;

  // Contract term
  if (p.contractYears >= 15) score += 3;
  else if (p.contractYears >= 10) score += 2;
  else if (p.contractYears >= 5) score += 1;

  // Binary protections
  if (p.ciac) score += 2;
  if (p.takeOrPay) score += 2;
  if (p.exitFee) score += 2;
  if (p.demandRatchet) score += 1;
  if (p.creditRequirement) score += 1;
  if (p.dcSpecificRate) score += 2;
  if (p.collateralRequired) score += 1;

  // Minimum load threshold
  if (utility.rates.minLoadMW >= 50) score += 1;

  // Rating thresholds
  let rating;
  if (score >= 14) rating = "High";
  else if (score >= 8) rating = "Mid";
  else rating = "Low";

  return { score, rating, maxScore: 19 };
}
```

### 2.2 Updates to `src/data/constants.js`

Replace the static rate structure with dynamic lookup:

```javascript
// BEFORE (static)
export const DC_RATE_STRUCTURE = {
  demandChargePerMWMonth: 9050,
  energyMarginPerMWh: 4.88,
};

// AFTER (dynamic from tariff database)
export const getDCRateStructure = (utilityId) => {
  const utility = getUtilityTariff(utilityId);
  if (!utility) {
    // Fallback to defaults
    return {
      demandChargePerMWMonth: 9050,
      energyMarginPerMWh: 4.88,
    };
  }

  // Calculate from actual tariff
  const monthlyDemand = (utility.rates.peakDemand * 1000) +
                        (utility.rates.offPeakDemand * 1000 * 0.5);
  const avgEnergyRate = (utility.rates.peakEnergy * 0.4 +
                         utility.rates.offPeakEnergy * 0.6) +
                        utility.rates.fuelAdjustment;

  // Energy margin is utility's spread over wholesale
  // Wholesale ~$0.025-0.04/kWh, so margin = retail - wholesale
  const estimatedWholesale = 0.032;
  const energyMargin = Math.max(0, (avgEnergyRate - estimatedWholesale) * 1000);

  return {
    demandChargePerMWMonth: monthlyDemand,
    energyMarginPerMWh: energyMargin,
    actualRates: utility.rates,
    source: utility.citation,
  };
};
```

---

## 3. Calculator Methodology Updates

### 3.1 Replace Generic Assumptions with Actual Tariffs

Update `src/utils/calculations.js`:

```javascript
import { calculateBlendedRate, calculateProtectionScore } from '../data/tariffDatabase';

/**
 * Enhanced revenue calculation using actual tariff structure
 */
export const calculateDCRevenueFromTariff = (
  utility,
  dcCapacityMW,
  loadFactor,
  peakCoincidence
) => {
  const loadProfile = {
    capacityMW: dcCapacityMW,
    loadFactor,
    peakEnergyPercent: 0.40,
    offPeakEnergyPercent: 0.60,
  };

  const blendedResult = calculateBlendedRate(utility, loadProfile);

  // Monthly revenue to utility
  const monthlyRevenue = blendedResult.monthlyCost;

  // Break down by component for allocation
  const demandRevenue = blendedResult.components.peakDemandCost +
                        blendedResult.components.offPeakDemandCost;
  const energyRevenue = blendedResult.components.peakEnergyCost +
                        blendedResult.components.offPeakEnergyCost;

  return {
    monthlyRevenue,
    annualRevenue: monthlyRevenue * 12,
    demandRevenue: demandRevenue * 12,
    energyRevenue: energyRevenue * 12,
    blendedRate: blendedResult.blendedRate,
    source: utility.citation,
  };
};

/**
 * Revenue adequacy check
 * Compares DC revenue contribution to incremental infrastructure costs
 */
export const calculateRevenueAdequacy = (utility, dcCapacityMW, loadFactor) => {
  const revenue = calculateDCRevenueFromTariff(utility, dcCapacityMW, loadFactor, 1.0);

  // Incremental infrastructure costs
  const transmissionCost = dcCapacityMW * 350000 / 20; // 20-year levelized
  const distributionCost = dcCapacityMW * 150000 / 20;
  const capacityCost = dcCapacityMW * 150000; // Annual capacity

  const annualInfraCost = transmissionCost + distributionCost + capacityCost;

  // Revenue adequacy ratio
  const adequacyRatio = revenue.annualRevenue / annualInfraCost;

  return {
    annualRevenue: revenue.annualRevenue,
    annualInfraCost,
    adequacyRatio,
    isAdequate: adequacyRatio >= 1.0,
    surplus: revenue.annualRevenue - annualInfraCost,
    surplusPerMW: (revenue.annualRevenue - annualInfraCost) / dcCapacityMW,
  };
};
```

### 3.2 Protection-Adjusted Cost Projections

```javascript
/**
 * Adjust cost projections based on protection mechanisms
 *
 * High protection utilities have more predictable cost recovery
 * Low protection utilities expose ratepayers to stranded cost risk
 */
export const calculateProtectionAdjustedTrajectory = (
  utility,
  dataCenter,
  years = 15
) => {
  const protection = calculateProtectionScore(utility);

  // Risk adjustment factor based on protection
  // High protection = low risk = small adjustment
  // Low protection = high risk = larger adjustment for uncertainty
  let riskMultiplier;
  switch (protection.rating) {
    case "High":
      riskMultiplier = 1.0;  // Full revenue certainty
      break;
    case "Mid":
      riskMultiplier = 0.85; // 15% risk discount
      break;
    case "Low":
      riskMultiplier = 0.70; // 30% risk discount
      break;
    default:
      riskMultiplier = 0.80;
  }

  const baseTrajectory = calculateFlexibleTrajectory(utility, dataCenter, years);

  // Apply risk adjustment to DC revenue contribution
  return baseTrajectory.map(year => ({
    ...year,
    adjustedImpact: year.components.dcImpact * riskMultiplier,
    protectionRating: protection.rating,
    protectionScore: protection.score,
    riskMultiplier,
  }));
};
```

---

## 4. Map Visualization Component

### 4.1 Data Source for Utility Boundaries

**EIA Form 861 Service Territories:**
- Download: https://www.eia.gov/electricity/data/eia861/
- Format: Shapefile/GeoJSON
- Coverage: All US electric utilities

**HIFLD Electric Service Territories:**
- Download: https://hifld-geoplatform.opendata.arcgis.com/
- Format: GeoJSON
- More detailed boundaries

### 4.2 React Component: `UtilityTariffMap.jsx`

```jsx
import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { TARIFF_DATABASE, calculateBlendedRate, calculateProtectionScore } from '../data/tariffDatabase';

const US_TOPO_JSON = '/data/us-utility-territories.json';

// Color scales for heat map
const RATE_COLOR_SCALE = [
  '#10B981', // Green - lowest rates
  '#34D399',
  '#6EE7B7',
  '#FCD34D', // Yellow - mid rates
  '#FBBF24',
  '#F59E0B',
  '#EF4444', // Red - highest rates
];

const PROTECTION_COLOR_SCALE = {
  High: '#10B981',   // Green
  Mid: '#F59E0B',    // Amber
  Low: '#EF4444',    // Red
};

export function UtilityTariffMap({
  viewMode = 'blendedRate', // 'blendedRate' | 'protection' | 'annualCost'
  loadProfile = { capacityMW: 600, loadFactor: 0.80 },
  onUtilitySelect,
}) {
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [tooltipContent, setTooltipContent] = useState(null);

  // Calculate values for all utilities
  const utilityData = useMemo(() => {
    return TARIFF_DATABASE.map(utility => {
      const blendedResult = calculateBlendedRate(utility, loadProfile);
      const protection = calculateProtectionScore(utility);

      return {
        ...utility,
        blendedRate: blendedResult.blendedRate,
        annualCostM: blendedResult.annualCost / 1000000,
        protectionScore: protection.score,
        protectionRating: protection.rating,
      };
    });
  }, [loadProfile]);

  // Create color scale based on view mode
  const colorScale = useMemo(() => {
    if (viewMode === 'protection') {
      return (utility) => PROTECTION_COLOR_SCALE[utility.protectionRating] || '#CBD5E1';
    }

    const values = utilityData.map(u =>
      viewMode === 'blendedRate' ? u.blendedRate : u.annualCostM
    );

    return scaleQuantile()
      .domain(values)
      .range(RATE_COLOR_SCALE);
  }, [utilityData, viewMode]);

  const handleUtilityHover = (utility) => {
    setTooltipContent({
      name: utility.utility,
      state: utility.state,
      blendedRate: `$${(utility.blendedRate * 100).toFixed(2)}/kWh`,
      annualCost: `$${utility.annualCostM.toFixed(1)}M/year`,
      protection: utility.protectionRating,
      iso: utility.iso,
    });
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-900 rounded-lg overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium mb-2">View Mode</div>
        <select
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="blendedRate">Blended Rate ($/kWh)</option>
          <option value="annualCost">Annual Cost ($M)</option>
          <option value="protection">Protection Rating</option>
        </select>

        <div className="mt-3 text-sm font-medium">Load Profile</div>
        <div className="text-xs text-gray-600">
          {loadProfile.capacityMW} MW @ {loadProfile.loadFactor * 100}% LF
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 rounded-lg p-3 shadow-lg">
        {viewMode === 'protection' ? (
          <div className="space-y-1">
            <div className="text-sm font-medium mb-2">Protection Rating</div>
            {Object.entries(PROTECTION_COLOR_SCALE).map(([rating, color]) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs">{rating}</span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium mb-2">
              {viewMode === 'blendedRate' ? 'Blended Rate' : 'Annual Cost'}
            </div>
            <div className="flex gap-1">
              {RATE_COLOR_SCALE.map((color, i) => (
                <div key={i} className="w-6 h-4" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Lower</span>
              <span>Higher</span>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg p-4 shadow-lg min-w-[250px]">
          <div className="font-bold text-lg">{tooltipContent.name}</div>
          <div className="text-gray-600 text-sm mb-3">{tooltipContent.state}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Blended Rate:</div>
            <div className="font-medium">{tooltipContent.blendedRate}</div>
            <div>Annual Cost:</div>
            <div className="font-medium">{tooltipContent.annualCost}</div>
            <div>Protection:</div>
            <div className="font-medium">{tooltipContent.protection}</div>
            <div>ISO/RTO:</div>
            <div className="font-medium">{tooltipContent.iso}</div>
          </div>
        </div>
      )}

      {/* Map */}
      <ComposableMap projection="geoAlbersUsa">
        <ZoomableGroup>
          <Geographies geography={US_TOPO_JSON}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Match geography to utility
                const utility = utilityData.find(u =>
                  geo.properties.UTILITY_ID === u.id ||
                  geo.properties.NAME?.includes(u.utility.split(' ')[0])
                );

                const fillColor = utility
                  ? (viewMode === 'protection'
                      ? colorScale(utility)
                      : colorScale(viewMode === 'blendedRate' ? utility.blendedRate : utility.annualCostM))
                  : '#CBD5E1';

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#1E293B"
                    strokeWidth={0.5}
                    onMouseEnter={() => utility && handleUtilityHover(utility)}
                    onMouseLeave={() => setTooltipContent(null)}
                    onClick={() => utility && onUtilitySelect?.(utility)}
                    style={{
                      hover: { fill: '#3B82F6', cursor: 'pointer' },
                      pressed: { fill: '#1D4ED8' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
```

### 4.3 Obtaining GeoJSON Data

```bash
# Download EIA utility territory boundaries
curl -o public/data/utility-territories.zip \
  "https://www.eia.gov/electricity/data/eia861/zip/Sales_Ult_Cust_2023.zip"

# Convert to GeoJSON (requires ogr2ogr)
ogr2ogr -f GeoJSON \
  public/data/us-utility-territories.json \
  utility-territories/Electric_Service_Territories.shp

# Simplify for web (reduce file size)
npx mapshaper public/data/us-utility-territories.json \
  -simplify 10% \
  -o format=geojson public/data/us-utility-territories-simplified.json
```

---

## 5. Protection Matrix Enhancement

### 5.1 Interactive Protection Matrix Component

```jsx
import React, { useState, useMemo } from 'react';
import { TARIFF_DATABASE, calculateProtectionScore } from '../data/tariffDatabase';

const PROTECTION_COLUMNS = [
  { key: 'contractYears', label: 'Contract Term', unit: 'years' },
  { key: 'ratchetPercent', label: 'Ratchet %', unit: '%' },
  { key: 'ciac', label: 'CIAC', type: 'boolean' },
  { key: 'takeOrPay', label: 'Take-or-Pay', type: 'boolean' },
  { key: 'exitFee', label: 'Exit Fee', type: 'boolean' },
  { key: 'demandRatchet', label: 'Demand Ratchet', type: 'boolean' },
  { key: 'creditRequirement', label: 'Credit Req', type: 'boolean' },
  { key: 'dcSpecificRate', label: 'DC Rate', type: 'boolean' },
  { key: 'collateralRequired', label: 'Collateral', type: 'boolean' },
];

export function ProtectionMatrix({ onUtilitySelect }) {
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');
  const [filterRating, setFilterRating] = useState('all');

  const utilities = useMemo(() => {
    let data = TARIFF_DATABASE.map(u => ({
      ...u,
      ...calculateProtectionScore(u),
    }));

    // Filter
    if (filterRating !== 'all') {
      data = data.filter(u => u.rating === filterRating);
    }

    // Sort
    data.sort((a, b) => {
      const aVal = sortBy === 'score' ? a.score : a[sortBy];
      const bVal = sortBy === 'score' ? b.score : b[sortBy];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return data;
  }, [sortBy, sortDir, filterRating]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4">
        <h2 className="text-xl font-bold">Utility Protection Matrix</h2>
        <p className="text-slate-300 text-sm mt-1">
          Ring-fencing mechanisms that protect ratepayers from stranded costs
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 bg-slate-50 border-b flex gap-4 items-center">
        <div>
          <label className="text-sm font-medium text-gray-700">Filter by Rating:</label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="ml-2 p-2 border rounded"
          >
            <option value="all">All Ratings</option>
            <option value="High">High Protection</option>
            <option value="Mid">Medium Protection</option>
            <option value="Low">Low Protection</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-600">
          Showing {utilities.length} utilities
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-slate-200"
                onClick={() => handleSort('utility')}
              >
                Utility
              </th>
              <th className="px-4 py-3 text-left">State</th>
              <th className="px-4 py-3 text-left">ISO</th>
              {PROTECTION_COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="text-xs">{col.label}</div>
                </th>
              ))}
              <th
                className="px-4 py-3 text-center cursor-pointer hover:bg-slate-200"
                onClick={() => handleSort('score')}
              >
                Score
              </th>
              <th className="px-4 py-3 text-center">Rating</th>
            </tr>
          </thead>
          <tbody>
            {utilities.map((utility, idx) => (
              <tr
                key={utility.id}
                className={`border-b hover:bg-blue-50 cursor-pointer ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                }`}
                onClick={() => onUtilitySelect?.(utility)}
              >
                <td className="px-4 py-3 font-medium">{utility.utility}</td>
                <td className="px-4 py-3 text-gray-600">{utility.state}</td>
                <td className="px-4 py-3 text-gray-600">{utility.iso}</td>
                {PROTECTION_COLUMNS.map(col => (
                  <td key={col.key} className="px-3 py-3 text-center">
                    {col.type === 'boolean' ? (
                      utility.protection[col.key] ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )
                    ) : (
                      <span>{utility.protection[col.key]}{col.unit}</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-bold">
                  {utility.score}/19
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    utility.rating === 'High' ? 'bg-green-100 text-green-800' :
                    utility.rating === 'Mid' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {utility.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 bg-slate-50 border-t">
        <div className="text-sm font-medium mb-2">Scoring Methodology</div>
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">Ratchet %:</span> ≥90% (+3), 80-89% (+2), 60-79% (+1)
          </div>
          <div>
            <span className="font-medium">Contract:</span> ≥15yr (+3), 10-14yr (+2), 5-9yr (+1)
          </div>
          <div>
            <span className="font-medium">CIAC/ToP/Exit:</span> +2 each
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Ratings:</span> High (≥14), Mid (8-13), Low (&lt;8)
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Implementation Roadmap

### Phase 1: Data Integration (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Convert Excel database to JSON | High | 2 days |
| Create tariffDatabase.js module | High | 2 days |
| Update constants.js with dynamic lookup | High | 1 day |
| Write unit tests for calculations | Medium | 2 days |

### Phase 2: Calculator Updates (Week 2-3)

| Task | Priority | Effort |
|------|----------|--------|
| Refactor calculateDCRevenueOffset | High | 2 days |
| Add protection-adjusted trajectories | High | 2 days |
| Update useCalculator hook | High | 1 day |
| Add revenue adequacy display | Medium | 1 day |

### Phase 3: Map Visualization (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Obtain/process GeoJSON boundaries | High | 2 days |
| Create UtilityTariffMap component | High | 3 days |
| Add heat map color scales | Medium | 1 day |
| Add tooltip/selection interactions | Medium | 1 day |

### Phase 4: Protection Matrix (Week 4-5)

| Task | Priority | Effort |
|------|----------|--------|
| Create ProtectionMatrix component | High | 2 days |
| Add sorting/filtering | Medium | 1 day |
| Create utility detail modal | Medium | 2 days |
| Add export functionality | Low | 1 day |

### Phase 5: Integration & Testing (Week 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| Integrate all components | High | 2 days |
| Cross-browser testing | High | 2 days |
| Performance optimization | Medium | 1 day |
| Documentation | Medium | 1 day |

---

## 7. API Endpoints

If moving to a backend architecture:

```
GET /api/utilities
  → Returns all utilities with calculated values

GET /api/utilities/:id
  → Returns single utility with full tariff details

GET /api/utilities/:id/calculate
  Query: capacityMW, loadFactor
  → Returns calculated blended rate, annual cost, protection score

GET /api/utilities/compare
  Query: ids[] (comma-separated)
  → Returns comparison of selected utilities

GET /api/geojson/utility-territories
  → Returns GeoJSON for map rendering

GET /api/protection/matrix
  Query: sortBy, filterRating
  → Returns sorted/filtered protection matrix data
```

---

## 8. File Structure

```
src/
├── data/
│   ├── tariffDatabase.js          # 88 utilities with rates
│   ├── tariffDatabase.json        # JSON export for API
│   ├── utilityData.js             # Legacy (deprecated)
│   ├── constants.js               # Updated with dynamic lookup
│   └── geojson/
│       └── utility-territories.json
│
├── utils/
│   ├── calculations.js            # Updated with tariff calcs
│   ├── protectionScoring.js       # Protection calculation helpers
│   └── mapUtils.js                # GeoJSON processing helpers
│
├── components/
│   ├── UtilityTariffMap.jsx       # Interactive map component
│   ├── ProtectionMatrix.jsx       # Protection scoring table
│   ├── UtilitySelector.jsx        # Enhanced dropdown with search
│   ├── TariffDetailModal.jsx      # Utility detail popup
│   └── RateComparisonChart.jsx    # Multi-utility comparison
│
├── hooks/
│   ├── useCalculator.jsx          # Updated with tariff integration
│   ├── useTariffData.jsx          # Tariff data fetching/caching
│   └── useProtectionScore.jsx     # Protection calculation hook
│
└── pages/
    ├── HomePage.jsx               # Add map visualization
    ├── CalculatorPage.jsx         # Use real tariff data
    └── ProtectionPage.jsx         # New: Protection matrix view
```

---

## Appendix A: Data Quality Notes

### Known Data Limitations

1. **Fuel Adjustment Riders** - Values change monthly; using recent averages
2. **Seasonal Rates** - Some utilities have summer/winter differentials; using annual average
3. **Negotiated Rates** - Large loads may negotiate below tariff; these are upper bounds
4. **Transmission Adders** - ISO transmission charges vary; included where documented

### Data Update Schedule

| Data Element | Update Frequency | Source |
|--------------|------------------|--------|
| Base rates | Annual | Utility tariff filings |
| Fuel adjustments | Quarterly | EIA Form 826 |
| Protection mechanisms | As filed | State PUC dockets |
| GeoJSON boundaries | Annual | EIA Form 861 |

---

## Appendix B: Revenue Adequacy Certification

For documenting revenue adequacy in regulatory filings:

```
REVENUE ADEQUACY CERTIFICATION

Utility: [Utility Name]
Rate Schedule: [Schedule Number]
Effective Date: [Date]

Load Parameters:
  Contracted Capacity: 600 MW
  Load Factor: 80%
  Annual Energy: 4,204,800 MWh

Monthly Revenue Calculation:
  Demand Charges: $[X] (Peak) + $[Y] (Off-Peak)
  Energy Charges: $[Z] (Peak kWh) + $[W] (Off-Peak kWh)
  Fuel Adjustment: $[F]
  Fixed Charges: $[G]
  TOTAL MONTHLY: $[Total]

Annual Revenue: $[Total × 12]

Incremental Cost Recovery:
  Transmission: $[T] (20-year levelized)
  Distribution: $[D] (20-year levelized)
  Capacity: $[C] (annual)
  TOTAL ANNUAL COST: $[Total]

Revenue Adequacy Ratio: [Revenue / Cost]
Status: [ADEQUATE / INADEQUATE]

Certification: This analysis demonstrates that the proposed
large load rate schedule provides [adequate/inadequate]
revenue to recover incremental infrastructure costs.
```

---

*Document prepared for Power-Insight application integration*
*Contact: [Project Lead]*
