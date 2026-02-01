'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load the UtilityHeatmap component for better initial page load
const UtilityHeatmap = dynamic(() => import('@/components/tariffs/UtilityHeatmap'), {
    loading: () => (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    ),
    ssr: false,
});

type ColorMode = 'combined' | 'rate' | 'protection';

/**
 * Geographic Tab
 *
 * Displays utility service territory heatmap with toggleable views:
 * - Combined: Bivariate choropleth showing rate + protection
 * - Rate: Single-variable showing blended rates
 * - Protection: Single-variable showing ratepayer protection scores
 */
export default function GeographicTab() {
    const [colorMode, setColorMode] = useState<ColorMode>('combined');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-600 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Geographic Rate Map</h2>
                        <p className="text-gray-700">
                            Interactive map showing utility service territories with rate and ratepayer protection data.
                            Identify regions with favorable rates and strong consumer protections for large load customers.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                                <span className="text-gray-600">Low Rate + High Protection (Best)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-300"></span>
                                <span className="text-gray-600">High Rate + Low Protection (Caution)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-slate-700">View Mode:</span>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => setColorMode('combined')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                colorMode === 'combined'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            Combined
                        </button>
                        <button
                            onClick={() => setColorMode('rate')}
                            className={`px-4 py-2 text-sm font-medium border-l border-slate-200 transition-colors ${
                                colorMode === 'rate'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            Rates Only
                        </button>
                        <button
                            onClick={() => setColorMode('protection')}
                            className={`px-4 py-2 text-sm font-medium border-l border-slate-200 transition-colors ${
                                colorMode === 'protection'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            Protection Only
                        </button>
                    </div>
                    <div className="text-sm text-slate-500 ml-auto">
                        {colorMode === 'combined' && 'Showing rate and protection as bivariate choropleth'}
                        {colorMode === 'rate' && 'Showing blended rates: green (low) to red (high)'}
                        {colorMode === 'protection' && 'Showing protection scores: dark (high) to light (low)'}
                    </div>
                </div>
            </div>

            {/* Map */}
            <Suspense fallback={
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading map...</p>
                    </div>
                </div>
            }>
                <UtilityHeatmap colorMode={colorMode} />
            </Suspense>

            {/* Data Source Attribution */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">
                    <strong>Data Sources:</strong> Utility service territories aggregated by state. Rate and protection data from E3{' '}
                    <a
                        href="https://www.ethree.com/wp-content/uploads/2025/12/RatepayerStudy.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        "Tailored for Scale"
                    </a>{' '}
                    study (2025), state PUC tariff filings, and utility rate schedules.
                    Map shows best available rate per state from our database of 88 large load tariffs.
                </p>
            </div>

            {/* Methodology Note */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-medium text-amber-800 mb-1">State-Level Aggregation</h4>
                        <p className="text-sm text-amber-700">
                            This map currently shows the <strong>best available utility rate per state</strong> from our database.
                            States may contain multiple utilities with different rates and protection levels.
                            Click on a state to see all utilities serving that region.
                            For detailed utility-specific boundaries, see the{' '}
                            <a href="/methodology?tab=utility" className="underline hover:text-amber-900">Utility Data</a> tab.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
