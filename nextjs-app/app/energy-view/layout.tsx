import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Wholesale Energy View — Power Insight',
    description:
        'Wholesale generation costs, capacity prices, and where data center load lands on each ISO’s supply curve. Companion to the household-bill calculator.',
    openGraph: {
        title: 'Wholesale energy view — capacity prices by ISO',
        description:
            'Where data center load lands on each ISO’s supply curve, and what that does to wholesale energy and capacity prices.',
        url: '/energy-view',
        type: 'website',
        images: [
            {
                url: '/api/og?title=Wholesale%20energy%20view&subtitle=Capacity%20prices%20and%20supply%20curves%20by%20ISO',
                width: 1200,
                height: 630,
                alt: 'Power Insight Energy View',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Wholesale energy view',
        description: 'Capacity prices and supply curves by ISO.',
        images: [
            '/api/og?title=Wholesale%20energy%20view&subtitle=Capacity%20prices%20and%20supply%20curves%20by%20ISO',
        ],
    },
};

export default function EnergyViewLayout({ children }: { children: React.ReactNode }) {
    return children;
}
