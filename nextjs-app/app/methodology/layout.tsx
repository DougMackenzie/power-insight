import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Methodology & Research Framework — Power Insight',
    description:
        'How the Power Insight calculator works, where the data comes from, and the cost-of-service framework behind every result. Cross-references peer-reviewed studies and primary regulator filings.',
    openGraph: {
        title: 'Methodology & research framework',
        description:
            'How the calculator works, every constant cited, every source linked. Cost-of-service, capacity market dynamics, asymmetric residential allocation, NBC handling.',
        url: '/methodology',
        type: 'article',
        images: [
            {
                url: '/api/og?title=Methodology%20%26%20research%20framework&subtitle=Cost-of-service%2C%20capacity%20markets%2C%20NBC%20handling%20%E2%80%94%20every%20constant%20cited',
                width: 1200,
                height: 630,
                alt: 'Power Insight Methodology',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Methodology & research framework',
        description: 'Cost-of-service, capacity markets, NBC handling — every constant cited.',
        images: [
            '/api/og?title=Methodology%20%26%20research%20framework&subtitle=Cost-of-service%2C%20capacity%20markets%2C%20NBC%20handling%20%E2%80%94%20every%20constant%20cited',
        ],
    },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
