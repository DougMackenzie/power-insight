import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Utility Tariff Database — Power Insight',
    description:
        'Search 88 US utilities for the rate schedules, demand charges, and large-load tariff provisions used by the Power Insight calculator. Each entry includes the source document and the date the tariff was last verified.',
    openGraph: {
        title: 'Utility tariff database — 88 US utilities',
        description:
            'Searchable rate schedules, demand charges, and large-load tariff provisions across 88 US utilities. Sources and effective dates included.',
        url: '/utilities',
        type: 'website',
        images: [
            {
                url: '/api/og?title=Utility%20tariff%20database&subtitle=88%20US%20utilities%20%E2%80%A2%20demand%20charges%2C%20rate%20schedules%2C%20large-load%20provisions',
                width: 1200,
                height: 630,
                alt: 'Power Insight Utility Database',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Utility tariff database — 88 US utilities',
        description: 'Demand charges, rate schedules, large-load provisions.',
        images: [
            '/api/og?title=Utility%20tariff%20database&subtitle=88%20US%20utilities%20%E2%80%A2%20demand%20charges%2C%20rate%20schedules%2C%20large-load%20provisions',
        ],
    },
};

export default function UtilitiesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
