import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Utility Territory Map — Power Insight',
    description:
        'Interactive map of US utility service territories overlaid with data center capacity and rate-impact data. Click a territory to drill into its tariff structure.',
    openGraph: {
        title: 'US utility territory map with data center overlay',
        description:
            'See where US utility service territories sit, what data center load they’re facing, and what each territory’s tariff structure looks like.',
        url: '/map',
        type: 'website',
        images: [
            {
                url: '/api/og?title=US%20utility%20territory%20map&subtitle=Data%20center%20capacity%20and%20rate%20impact%20by%20service%20area',
                width: 1200,
                height: 630,
                alt: 'Power Insight Territory Map',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'US utility territory map',
        description: 'Data center capacity and rate impact by service area.',
        images: [
            '/api/og?title=US%20utility%20territory%20map&subtitle=Data%20center%20capacity%20and%20rate%20impact%20by%20service%20area',
        ],
    },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
    return children;
}
