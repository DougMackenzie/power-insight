'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import to avoid SSR issues with Mapbox
const ScrollyMap = dynamic(
    () => import('@/components/scrollytelling/ScrollyMap'),
    {
        ssr: false,
        loading: () => <LoadingState />,
    }
);

/**
 * Story Page - Immersive scrollytelling experience
 * From microchip to national grid
 */
export default function StoryPage() {
    return (
        <main className="bg-gray-950">
            {/* Hero header */}
            <header className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="heroGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#heroGrid)" />
                    </svg>
                </div>

                {/* Glowing orb effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <div className="mb-6">
                        <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-cyan-400 text-sm font-medium border border-white/10">
                            An Interactive Story
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        The Scale of
                        <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                            AI Data Centers
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                        A visual journey from a single GPU to the national power grid—understanding the infrastructure behind artificial intelligence.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href="#story"
                            className="group px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            Begin the Journey
                            <svg
                                className="w-5 h-5 group-hover:translate-y-1 transition-transform"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </a>
                        <a
                            href="/calculator"
                            className="px-8 py-4 bg-transparent border border-white/30 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
                        >
                            Skip to Calculator
                        </a>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                        <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </header>

            {/* Scrollytelling section */}
            <section id="story">
                <Suspense fallback={<LoadingState />}>
                    <ScrollyMap />
                </Suspense>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 py-12">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-gray-500 text-sm mb-4">
                        Data sources: EPRI DCFlex, PJM Interconnection, Grid Strategies, EIA
                    </p>
                    <div className="flex justify-center gap-6">
                        <a href="/methodology" className="text-gray-400 hover:text-white text-sm transition-colors">
                            Methodology
                        </a>
                        <a href="/learn-more" className="text-gray-400 hover:text-white text-sm transition-colors">
                            Learn More
                        </a>
                        <a
                            href="https://github.com/DougMackenzie/power-insight"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white text-sm transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
}

/**
 * Loading state while ScrollyMap loads
 */
function LoadingState() {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    {/* Spinning ring */}
                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
                </div>
                <p className="text-gray-500 text-sm">Loading visualization...</p>
            </div>
        </div>
    );
}
