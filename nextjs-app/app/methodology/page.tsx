'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ResearchTab from '@/components/methodology/ResearchTab';

// Map legacy ?tab= query params to the new standalone routes.
// Keeps old bookmarks and inbound links working.
const LEGACY_TAB_REDIRECTS: Record<string, string> = {
    calculator: '/calculator',
    utility: '/utilities',
    geographic: '/map',
    energy: '/energy-view',
};

function MethodologyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && LEGACY_TAB_REDIRECTS[tab]) {
            router.replace(LEGACY_TAB_REDIRECTS[tab]);
        }
    }, [router, searchParams]);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <header className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                    Methodology &amp; research framework
                </h1>
                <p className="text-slate-600 leading-relaxed max-w-3xl">
                    How the calculator works, where the data comes from, and the cost-of-service framework
                    behind every result. Cross-references peer-reviewed studies and primary regulator
                    filings. For the interactive tool see{' '}
                    <Link href="/calculator" className="text-primary-600 hover:underline font-medium">
                        the calculator
                    </Link>
                    ; for the underlying tariff records see{' '}
                    <Link href="/utilities" className="text-primary-600 hover:underline font-medium">
                        utility data
                    </Link>
                    .
                </p>
            </header>

            <ResearchTab />
        </div>
    );
}

export default function MethodologyPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                </div>
            }
        >
            <MethodologyContent />
        </Suspense>
    );
}
