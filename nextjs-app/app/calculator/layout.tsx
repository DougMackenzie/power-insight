import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Calculator — Power Insight',
    description:
        'Calculate how a new data center could change your electric bill. Pick your utility, set the size of the data center, get a plain-English answer in under a minute. Covers 88 US utilities.',
    openGraph: {
        title: 'Calculate the impact on your electric bill — Power Insight',
        description:
            'See how a new data center would change household bills in your utility territory. Free, open-source, built on tariff data from 88 US utilities.',
        url: '/calculator',
        type: 'website',
        images: [
            {
                url: '/api/og?title=Calculate%20the%20impact%20on%20your%20electric%20bill&subtitle=88%20US%20utilities%20%E2%80%A2%20Pick%20yours%20and%20see%20the%20math',
                width: 1200,
                height: 630,
                alt: 'Power Insight Calculator',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Calculate the impact on your electric bill',
        description: 'Free tool covering 88 US utilities.',
        images: [
            '/api/og?title=Calculate%20the%20impact%20on%20your%20electric%20bill&subtitle=88%20US%20utilities%20%E2%80%A2%20Pick%20yours%20and%20see%20the%20math',
        ],
    },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
    return children;
}
