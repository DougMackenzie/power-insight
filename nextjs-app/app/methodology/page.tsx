'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TabNavigation, { TabIcons, useActiveTab, type Tab } from '@/components/ui/TabNavigation';
import ResearchTab from '@/components/methodology/ResearchTab';
import UtilityDataTab from '@/components/methodology/UtilityDataTab';
import EnergyViewTab from '@/components/methodology/EnergyViewTab';
import CalculatorTab from '@/components/methodology/CalculatorTab';

// Define methodology tabs
const METHODOLOGY_TABS: Tab[] = [
    {
        id: 'research',
        label: 'Research & Framework',
        icon: TabIcons.book,
    },
    {
        id: 'utility',
        label: 'Utility Data',
        icon: TabIcons.database,
        badge: 'New',
        badgeColor: 'bg-primary-100 text-primary-700',
    },
    {
        id: 'calculator',
        label: 'Calculator',
        icon: TabIcons.calculator,
    },
    {
        id: 'energy',
        label: 'Energy View',
        icon: TabIcons.map,
    },
];

// Loading fallback for tab content
function TabLoadingFallback() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading...</p>
            </div>
        </div>
    );
}

// Tab content renderer
function TabContent({ activeTab }: { activeTab: string }) {
    switch (activeTab) {
        case 'research':
            return <ResearchTab />;
        case 'utility':
            return (
                <Suspense fallback={<TabLoadingFallback />}>
                    <UtilityDataTab />
                </Suspense>
            );
        case 'calculator':
            return <CalculatorTab />;
        case 'energy':
            return <EnergyViewTab />;
        default:
            return <ResearchTab />;
    }
}

// Inner component that uses searchParams
function MethodologyContent() {
    const activeTab = useActiveTab(METHODOLOGY_TABS, 'research', 'tab');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-8 border border-slate-200">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                    Methodology & Technical Documentation
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl">
                    This calculator models how large data center loads affect residential electricity bills,
                    with particular attention to <strong>capacity market dynamics</strong> and the supply curve
                    effects that can cause cost spillovers to existing ratepayers.
                </p>
            </div>

            {/* Tab Navigation */}
            <TabNavigation
                tabs={METHODOLOGY_TABS}
                defaultTab="research"
                useUrlParams={true}
                paramName="tab"
            />

            {/* Tab Content */}
            <div className="mt-6">
                <TabContent activeTab={activeTab} />
            </div>
        </div>
    );
}

// Main page component with Suspense boundary
export default function MethodologyPage() {
    return (
        <Suspense fallback={
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </div>
        }>
            <MethodologyContent />
        </Suspense>
    );
}
