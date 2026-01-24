'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CarbonData {
  development: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    sessions: number;
    lastUpdated: string;
  };
  carbonMetrics: {
    gCO2PerThousandTokens: number;
    totalKgCO2: number;
    hamburgerEquivalentKg: number;
  };
}

export default function CarbonFooter() {
  const [carbonData, setCarbonData] = useState<CarbonData | null>(null);

  useEffect(() => {
    fetch('/api/carbon')
      .then(res => res.json())
      .then(data => setCarbonData(data))
      .catch(err => console.error('Failed to fetch carbon data:', err));
  }, []);

  if (!carbonData) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-300">
        <div className="inline-flex items-center gap-3 text-sm text-gray-500">
          <span className="text-2xl" role="img" aria-label="hamburger">🍔</span>
          <span>Loading carbon footprint data...</span>
        </div>
      </div>
    );
  }

  const { development, carbonMetrics } = carbonData;
  const kgCO2 = carbonMetrics.totalKgCO2;
  const hamburgers = kgCO2 / carbonMetrics.hamburgerEquivalentKg;
  const hamburgerFraction = hamburgers < 1
    ? `1/${Math.round(1/hamburgers)}`
    : hamburgers.toFixed(1);

  return (
    <div className="mt-8 pt-6 border-t border-gray-300">
      <div className="inline-flex items-center gap-3 text-sm text-gray-500">
        <span className="text-2xl" role="img" aria-label="hamburger">🍔</span>
        <span>
          This tool was developed with agentic AI assistance.{' '}
          <span className="text-gray-400">
            {development.totalTokens.toLocaleString()} tokens
          </span>{' '}
          produced an estimated{' '}
          <strong className="text-gray-700">~{kgCO2.toFixed(1)} kg CO2</strong>—equivalent to about{' '}
          <strong className="text-gray-700">{hamburgerFraction} of a hamburger</strong>.{' '}
          <Link href="/methodology#ai-carbon" className="text-blue-600 hover:underline">
            See methodology
          </Link>
        </span>
      </div>
      {development.lastUpdated && (
        <p className="text-xs text-gray-400 mt-2">
          Last updated: {development.lastUpdated}
        </p>
      )}
    </div>
  );
}
