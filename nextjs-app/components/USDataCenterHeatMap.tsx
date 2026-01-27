'use client';

import { useState, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';

// TopoJSON URL for US states with accurate boundaries
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS code to state abbreviation mapping
const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
};

/**
 * US State Load Request Data
 * Based on SemiAnalysis interconnection queue data (MW)
 * Used for shading intensity - higher values = more saturated color
 */
const STATE_LOAD_DATA: Record<string, number> = {
  TX: 230000,
  VA: 65000,
  GA: 51000,
  PA: 42000,
  NC: 42000,
  IL: 28000,
  IN: 22000,
  OH: 42000,
  AZ: 12000,
  NV: 10000,
  CA: 9000,
  NY: 8000,
  NJ: 7000,
  TN: 5000,
  SC: 4500,
  WA: 4000,
  OR: 3500,
  CO: 200,
  UT: 2500,
  FL: 2000,
  MD: 1800,
  MI: 1500,
  MO: 1200,
  WI: 1000,
  MN: 900,
  IA: 800,
  NE: 600,
  KS: 500,
  OK: 42000,
  AR: 300,
  LA: 250,
  MS: 200,
  AL: 180,
  KY: 150,
  WV: 100,
  WY: 600,
};

// Get color intensity based on load - muted slate/blue tones
const getStateColor = (stateAbbr: string): string => {
  const load = STATE_LOAD_DATA[stateAbbr];
  if (!load) return '#e2e8f0'; // slate-200 for no data

  // Muted blue/slate gradient based on load thresholds
  if (load >= 100000) return '#1e3a5f'; // Deep slate blue - TX (highest)
  if (load >= 50000) return '#2d4a6f';  // Dark slate blue
  if (load >= 30000) return '#3d5a7f';  // Medium slate blue
  if (load >= 15000) return '#4d6a8f';  // Slate blue
  if (load >= 5000) return '#6b8bb0';   // Light slate blue
  if (load >= 2000) return '#8ba4c4';   // Lighter slate blue
  if (load >= 500) return '#a8bdd8';    // Very light slate blue
  return '#c5d5e8';                      // Pale slate blue
};

interface USDataCenterHeatMapProps {
  className?: string;
}

function USDataCenterHeatMap({ className = '' }: USDataCenterHeatMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string>('');

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-slate-100 rounded-xl p-6 border border-slate-200">
        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
          Projected Data Center Demand by State
        </h3>

        {/* Map Container */}
        <div className="relative max-w-3xl mx-auto mb-6">
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{
              scale: 1000,
            }}
            style={{
              width: '100%',
              height: 'auto',
            }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = geo.id;
                  const stateAbbr = FIPS_TO_STATE[fips] || '';
                  const isHovered = hoveredState === stateAbbr;
                  const hasData = STATE_LOAD_DATA[stateAbbr] !== undefined;
                  const fillColor = getStateColor(stateAbbr);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={isHovered ? '#1e40af' : '#94a3b8'}
                      strokeWidth={isHovered ? 1.5 : 0.5}
                      style={{
                        default: {
                          outline: 'none',
                          transition: 'all 0.2s',
                        },
                        hover: {
                          outline: 'none',
                          fill: fillColor,
                          filter: 'brightness(0.85)',
                          cursor: 'pointer',
                        },
                        pressed: {
                          outline: 'none',
                        },
                      }}
                      onMouseEnter={() => {
                        setHoveredState(stateAbbr);
                        if (hasData) {
                          setTooltipContent(`${stateAbbr}: High demand region`);
                        } else {
                          setTooltipContent(stateAbbr);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredState(null);
                        setTooltipContent('');
                      }}
                    />
                  );
                })
              }
            </Geographies>

          </ComposableMap>

          {/* Hover tooltip */}
          {hoveredState && tooltipContent && (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-200 text-sm">
              <span className="font-semibold text-slate-800">{tooltipContent}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Lower demand</span>
            <div className="flex rounded overflow-hidden">
              <div className="w-5 h-4" style={{ backgroundColor: '#c5d5e8' }} />
              <div className="w-5 h-4" style={{ backgroundColor: '#8ba4c4' }} />
              <div className="w-5 h-4" style={{ backgroundColor: '#4d6a8f' }} />
              <div className="w-5 h-4" style={{ backgroundColor: '#1e3a5f' }} />
            </div>
            <span className="text-slate-500">Higher demand</span>
          </div>
        </div>

        {/* Source removed - SemiAnalysis credited in page-level sources */}
      </div>
    </div>
  );
}

export default memo(USDataCenterHeatMap);
