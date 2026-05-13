'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import CalculatorTab from '@/components/methodology/CalculatorTab';

function CalculatorLoadingFallback() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading calculator&hellip;</p>
            </div>
        </div>
    );
}

export default function CalculatorPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <header className="bg-gradient-to-br from-amber-50 to-slate-50 rounded-2xl p-6 md:p-8 border border-amber-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                            Calculate the impact on your electric bill
                        </h1>
                        <p className="text-slate-600 leading-relaxed">
                            Pick your utility, set the size of the data center, and see how the costs would
                            split between the data center and households like yours. Plain-English summary
                            below the result &mdash;{' '}
                            <Link href="/methodology" className="text-primary-600 hover:underline font-medium">
                                full methodology here
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </header>

            <Suspense fallback={<CalculatorLoadingFallback />}>
                <CalculatorTab />
            </Suspense>
        </div>
    );
}
