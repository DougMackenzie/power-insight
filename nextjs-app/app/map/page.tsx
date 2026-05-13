'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import GeographicTab from '@/components/methodology/GeographicTab';

function MapLoadingFallback() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading map&hellip;</p>
            </div>
        </div>
    );
}

export default function MapPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <header className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                    Utility territory map
                </h1>
                <p className="text-slate-600 leading-relaxed max-w-3xl">
                    Interactive map of US utility service territories overlaid with data center capacity and
                    rate-impact data. Click a territory to drill into its tariff structure, or jump straight
                    to the{' '}
                    <Link href="/calculator" className="text-primary-600 hover:underline font-medium">
                        calculator
                    </Link>
                    .
                </p>
            </header>

            <Suspense fallback={<MapLoadingFallback />}>
                <GeographicTab />
            </Suspense>
        </div>
    );
}
