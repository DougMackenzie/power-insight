'use client';

import { useState } from 'react';

/**
 * US State Load Request Data
 * Based on SemiAnalysis interconnection queue data
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
  OH: 13000,
  AZ: 12000,
  NV: 10000,
  CA: 9000,
  NY: 8000,
  NJ: 7000,
  TN: 5000,
  SC: 4500,
  WA: 4000,
  OR: 3500,
  CO: 3000,
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
  OK: 400,
  AR: 300,
  LA: 250,
  MS: 200,
  AL: 180,
  KY: 150,
  WV: 100,
};

// Get color intensity based on load - muted slate/blue tones
const getStateColor = (stateId: string): string => {
  const load = STATE_LOAD_DATA[stateId];
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

// Simplified US state paths - actual geographic shapes
const US_STATES: Record<string, string> = {
  WA: 'M125,43 L172,56 L168,95 L122,84 L108,54 Z',
  OR: 'M108,54 L122,84 L168,95 L165,138 L100,135 L85,95 L100,70 Z',
  CA: 'M85,95 L100,135 L115,205 L95,255 L60,240 L55,175 L70,115 Z',
  NV: 'M100,135 L165,138 L160,210 L115,205 Z',
  ID: 'M168,95 L195,65 L205,130 L165,138 Z',
  MT: 'M195,65 L290,55 L295,105 L205,115 Z',
  WY: 'M205,115 L295,105 L295,165 L205,170 Z',
  UT: 'M165,138 L205,130 L205,170 L200,215 L160,210 Z',
  AZ: 'M115,205 L160,210 L175,280 L115,285 L95,255 Z',
  CO: 'M205,170 L295,165 L295,225 L205,230 Z',
  NM: 'M175,230 L205,230 L210,295 L175,300 L175,280 Z',
  ND: 'M290,55 L370,50 L375,95 L295,100 Z',
  SD: 'M295,100 L375,95 L375,145 L295,150 Z',
  NE: 'M295,150 L375,145 L380,195 L295,195 Z',
  KS: 'M295,195 L380,195 L385,245 L300,250 Z',
  OK: 'M300,250 L385,245 L390,290 L330,295 L300,290 L295,275 Z',
  TX: 'M260,290 L330,295 L390,290 L400,380 L310,420 L235,385 L240,320 Z',
  MN: 'M375,50 L430,55 L440,115 L375,120 Z',
  IA: 'M375,120 L440,115 L450,165 L380,170 Z',
  MO: 'M380,170 L450,165 L465,225 L395,235 Z',
  AR: 'M395,235 L465,225 L470,280 L405,290 Z',
  LA: 'M405,290 L470,280 L485,340 L430,350 L410,330 Z',
  WI: 'M430,55 L480,65 L490,125 L440,115 Z',
  IL: 'M450,125 L490,125 L505,205 L455,200 Z',
  IN: 'M490,150 L520,145 L530,210 L495,215 Z',
  MI: 'M480,65 L530,50 L555,95 L520,145 L490,125 Z',
  OH: 'M520,145 L565,135 L575,195 L530,210 Z',
  KY: 'M495,215 L575,195 L590,240 L510,255 Z',
  TN: 'M480,250 L590,240 L600,275 L490,285 Z',
  MS: 'M470,280 L490,285 L500,345 L470,350 Z',
  AL: 'M500,280 L535,275 L545,345 L505,350 Z',
  GA: 'M535,275 L580,270 L595,345 L550,355 Z',
  FL: 'M550,355 L595,345 L640,440 L580,430 L565,375 Z',
  SC: 'M580,270 L625,255 L630,305 L585,310 Z',
  NC: 'M565,240 L660,220 L665,265 L580,280 Z',
  VA: 'M575,195 L665,175 L670,220 L590,240 Z',
  WV: 'M565,170 L590,180 L585,215 L555,210 Z',
  MD: 'M610,185 L660,178 L665,205 L615,210 Z',
  DE: 'M655,180 L670,178 L672,200 L657,202 Z',
  NJ: 'M645,155 L665,150 L670,185 L650,190 Z',
  PA: 'M575,140 L650,130 L660,175 L580,185 Z',
  NY: 'M580,85 L665,70 L680,130 L595,140 Z',
  CT: 'M660,125 L685,120 L688,140 L663,145 Z',
  RI: 'M688,120 L700,118 L702,135 L690,137 Z',
  MA: 'M670,100 L720,95 L725,120 L675,125 Z',
  VT: 'M660,70 L680,68 L685,100 L665,102 Z',
  NH: 'M680,55 L698,52 L705,95 L687,98 Z',
  ME: 'M698,35 L735,25 L745,85 L708,95 Z',
  AK: 'M30,320 L120,310 L130,370 L40,385 Z',
  HI: 'M180,400 L230,395 L240,420 L190,425 Z',
};

export default function USDataCenterHeatMap({ className = '' }: USDataCenterHeatMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-slate-100 rounded-xl p-6 border border-slate-200">
        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
          Data Center Load Requests by State
        </h3>

        {/* SVG Map */}
        <div className="relative max-w-3xl mx-auto mb-6">
          <svg
            viewBox="0 0 770 450"
            className="w-full h-auto"
            style={{ maxHeight: '400px' }}
          >
            {/* Background */}
            <rect x="0" y="0" width="770" height="450" fill="#f1f5f9" rx="8" />

            {/* State paths */}
            {Object.entries(US_STATES).map(([stateId, path]) => {
              const isHovered = hoveredState === stateId;
              const hasData = STATE_LOAD_DATA[stateId] !== undefined;
              const fillColor = getStateColor(stateId);

              return (
                <g key={stateId}>
                  <path
                    d={path}
                    fill={fillColor}
                    stroke={isHovered ? '#1e40af' : '#94a3b8'}
                    strokeWidth={isHovered ? 2 : 0.5}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: isHovered ? 'brightness(0.9)' : 'none',
                    }}
                    onMouseEnter={() => setHoveredState(stateId)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  {/* State label */}
                  <text
                    x={getStateCentroid(path).x}
                    y={getStateCentroid(path).y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      fill: hasData && STATE_LOAD_DATA[stateId]! >= 5000 ? '#ffffff' : '#475569',
                    }}
                  >
                    {stateId}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredState && STATE_LOAD_DATA[hoveredState] && (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-200 text-sm">
              <span className="font-semibold text-slate-800">{hoveredState}</span>
              <span className="text-slate-500 ml-2">High demand region</span>
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

        {/* Key callouts */}
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <span className="text-slate-700 font-semibold bg-slate-200 px-2 py-1 rounded">TX: Highest requests</span>
          <span className="text-slate-700 font-semibold bg-slate-200 px-2 py-1 rounded">VA: Data center capital</span>
          <span className="text-slate-700 font-semibold bg-slate-200 px-2 py-1 rounded">GA, PA, NC: Growing hubs</span>
        </div>

        {/* Source */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Data: Utility interconnection queue requests (SemiAnalysis)
        </p>
      </div>
    </div>
  );
}

// Helper to get approximate centroid of a path for label placement
function getStateCentroid(path: string): { x: number; y: number } {
  const coords = path.match(/\d+/g);
  if (!coords || coords.length < 4) return { x: 0, y: 0 };

  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < coords.length - 1; i += 2) {
    sumX += parseInt(coords[i]);
    sumY += parseInt(coords[i + 1]);
    count++;
  }

  return { x: sumX / count, y: sumY / count };
}
