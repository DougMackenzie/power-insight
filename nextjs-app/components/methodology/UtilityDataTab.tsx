'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load the TariffExplorer component for better initial page load
const TariffExplorer = dynamic(() => import('@/components/tariffs/TariffExplorer'), {
    loading: () => (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    ),
    ssr: false,
});

interface UtilityDataTabProps {
    /** Initial view mode */
    initialView?: 'overview' | 'table' | 'matrix' | 'compare';
}

/**
 * Utility Data Tab
 *
 * New tab containing the comprehensive tariff database explorer.
 * Features:
 * - 88 utility tariff data from E3 study
 * - Interactive filtering and sorting
 * - Protection mechanism analysis
 * - Side-by-side comparison tool
 */
export default function UtilityDataTab({ initialView = 'overview' }: UtilityDataTabProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-600 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Large Load Tariff Database</h2>
                        <p className="text-gray-700">
                            Comprehensive database of 88 utility tariffs for large loads (1MW+) across the United States.
                            Includes rate structures, protection mechanisms, and regulatory status.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                <span className="text-gray-600">17 High Protection</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                <span className="text-gray-600">7 Mid Protection</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="text-gray-600">64 Low Protection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Source Attribution */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">
                    <strong>Data Sources:</strong> E3{' '}
                    <a
                        href="https://www.ethree.com/wp-content/uploads/2024/12/Tailored-for-Scale-Designing-Rates-to-Support-Data-Centers-E3-December-2024.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        "Tailored for Scale"
                    </a>{' '}
                    study (2024), state PUC tariff filings, utility rate schedules, and ISO/RTO interconnection requirements.
                    Last updated January 2026.
                </p>
            </div>

            {/* Tariff Explorer */}
            <Suspense fallback={
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading tariff data...</p>
                    </div>
                </div>
            }>
                <TariffExplorer initialView={initialView} />
            </Suspense>
        </div>
    );
}
