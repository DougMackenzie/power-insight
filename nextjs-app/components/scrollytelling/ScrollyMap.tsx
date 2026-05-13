'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Scrollama, Step } from 'react-scrollama';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from './MapView';
import { steps, type StoryStep } from './storyData';

/**
 * NYT-inspired color palette - SLATE BLUE background with white/yellow accents
 * Based on NYT interactive article style
 */
const NYT_COLORS = {
    bgDeep: '#3d4f5f',            // Main slate blue
    bgMid: '#4a5a68',             // Slightly lighter slate
    bgSurface: '#526270',         // Surface tone
    textPrimary: '#f0ebe3',       // Warm off-white
    textSecondary: '#c9c4bc',     // Lighter warm gray
    textMuted: '#94918a',         // Muted warm gray
    accentYellow: '#f0c040',      // Bright gold/yellow
    accentAmber: '#e8a830',       // Amber
    accentCyan: '#88c4c8',        // Soft teal
    accentCoral: '#d88070',       // Soft coral
    accentBlue: '#7c9cc9',        // Soft blue
    border: 'rgba(200, 196, 188, 0.3)',
};

// Dynamically import 3D component to avoid SSR issues with Three.js
const MicroView3D = dynamic(() => import('./MicroView3D'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: NYT_COLORS.bgDeep }}>
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: NYT_COLORS.accentYellow, borderTopColor: 'transparent' }} />
                <p className="text-sm" style={{ color: NYT_COLORS.textSecondary }}>Loading 3D view...</p>
            </div>
        </div>
    ),
});

/**
 * ScrollyMap - Main scrollytelling component
 * Orchestrates the narrative from microchip to national grid
 * Uses layered rendering for seamless transitions
 */
export default function ScrollyMap() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const currentStep = steps[currentStepIndex];

    const onStepEnter = useCallback(({ data }: { data: unknown }) => {
        setCurrentStepIndex(data as number);
    }, []);

    // Determine if we should show micro, map, or both (for transitions)
    const showMicro = currentStep.mode === 'micro' || currentStep.mode === 'infrastructure';
    const showMap = currentStep.mode === 'map' || currentStep.mode === 'infrastructure';

    // Get first step with a map location for preloading
    const firstMapStep = useMemo(() =>
        steps.find(s => s.location) || steps[4],
        []
    );

    // Calculate map location - use current or default to first map step for preloading
    const mapLocation = currentStep.location || firstMapStep.location;

    return (
        <div className="relative min-h-screen" style={{ backgroundColor: NYT_COLORS.bgDeep }}>
            {/* Sticky visual container - Full screen on mobile, 60% on desktop */}
            <div className="sticky top-0 h-screen w-full lg:w-[60%] lg:ml-auto z-0 overflow-hidden">

                {/* Map layer - always rendered after first micro steps to preload, fades in for map/infrastructure */}
                {mapLocation && (
                    <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: showMap ? 1 : 0,
                            scale: showMap ? 1 : 1.05
                        }}
                        transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <MapView
                            location={mapLocation}
                            layerColor={currentStep.layerColor}
                            stepId={currentStep.id}
                            region={currentStep.region}
                            powerMetric={currentStep.powerMetric}
                        />
                    </motion.div>
                )}

                {/* 3D Micro layer - continuous zoom, single focal point */}
                <AnimatePresence>
                    {showMicro && (
                        <motion.div
                            key="micro-view"
                            className="absolute inset-0"
                            initial={{ opacity: 1 }}
                            animate={{
                                opacity: currentStep.mode === 'infrastructure' ? 0 : 1
                            }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.8 }
                            }}
                            transition={{ duration: 0.6 }}
                        >
                            <MicroView3D
                                visualState={currentStep.visualState || 'chip-glow'}
                                powerMetric={currentStep.powerMetric}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress indicator */}
                <ProgressIndicator currentIndex={currentStepIndex} totalSteps={steps.length} />
            </div>

            {/* Scrolling narrative cards */}
            <div className="relative z-10 lg:w-[40%] pointer-events-none">
                {/* Top disclaimer */}
                <div className="min-h-[10vh] flex items-end justify-center pb-4">
                    <DisclaimerBanner />
                </div>

                <Scrollama onStepEnter={onStepEnter} offset={0.5}>
                    {steps.map((step, index) => (
                        <Step key={step.id} data={index}>
                            <div className="min-h-screen flex items-center px-4 lg:px-8 py-20">
                                <StoryCard
                                    step={step}
                                    isActive={currentStepIndex === index}
                                    stepNumber={index + 1}
                                    totalSteps={steps.length}
                                />
                            </div>
                        </Step>
                    ))}
                </Scrollama>

                {/* Bottom disclaimer */}
                <div className="flex items-center justify-center py-8">
                    <DisclaimerBanner />
                </div>

                {/* Call to action at the end */}
                <div className="min-h-[50vh] flex items-center justify-center px-4 lg:px-8">
                    <CallToAction />
                </div>
            </div>

            {/* Mobile scroll hint */}
            <ScrollHint currentIndex={currentStepIndex} />
        </div>
    );
}

/**
 * Story Card - Individual narrative card
 * NYT-style muted colors with warm off-white text
 */
function StoryCard({
    step,
    isActive,
    stepNumber,
    totalSteps,
}: {
    step: StoryStep;
    isActive: boolean;
    stepNumber: number;
    totalSteps: number;
}) {
    // Determine mode label and color - using NYT yellow accent palette
    const getModeInfo = () => {
        switch (step.mode) {
            case 'micro':
                return { label: 'Micro Scale', bgColor: `${NYT_COLORS.accentYellow}25`, textColor: NYT_COLORS.accentYellow };
            case 'infrastructure':
                return { label: 'Grid Infrastructure', bgColor: `${NYT_COLORS.accentAmber}25`, textColor: NYT_COLORS.accentAmber };
            case 'map':
                return { label: 'Regional View', bgColor: `${NYT_COLORS.accentCyan}25`, textColor: NYT_COLORS.accentCyan };
            default:
                return { label: 'View', bgColor: `${NYT_COLORS.textMuted}25`, textColor: NYT_COLORS.textMuted };
        }
    };

    const modeInfo = getModeInfo();

    return (
        <motion.div
            className="w-full max-w-md mx-auto lg:mx-0 backdrop-blur-md rounded-2xl p-6 lg:p-8 border transition-all duration-500 pointer-events-auto"
            style={{
                backgroundColor: `${NYT_COLORS.bgSurface}e6`,
                borderColor: isActive ? NYT_COLORS.border : `${NYT_COLORS.bgSurface}80`,
                boxShadow: isActive ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none',
                opacity: isActive ? 1 : 0.4,
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isActive ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                        backgroundColor: isActive ? NYT_COLORS.textPrimary : NYT_COLORS.bgDeep,
                        color: isActive ? NYT_COLORS.bgDeep : NYT_COLORS.textMuted,
                    }}
                >
                    {stepNumber}
                </div>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: NYT_COLORS.bgDeep }}>
                    <motion.div
                        className="h-full"
                        style={{ background: `linear-gradient(to right, ${NYT_COLORS.accentYellow}, ${NYT_COLORS.accentAmber})` }}
                        initial={{ width: 0 }}
                        animate={{ width: isActive ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <span className="text-xs font-mono" style={{ color: NYT_COLORS.textMuted }}>{stepNumber}/{totalSteps}</span>
            </div>

            {/* Mode indicator and region */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span
                    className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{ backgroundColor: modeInfo.bgColor, color: modeInfo.textColor }}
                >
                    {modeInfo.label}
                </span>
                {step.region && (
                    <span
                        className="px-2 py-1 text-xs rounded-full font-medium border"
                        style={{
                            borderColor: step.region.color,
                            color: step.region.color,
                            backgroundColor: `${step.region.color}15`
                        }}
                    >
                        {step.region.name}
                    </span>
                )}
                {step.layerColor && !step.region && (
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: step.layerColor }}
                    />
                )}
            </div>

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight" style={{ color: NYT_COLORS.textPrimary }}>
                {step.title}
            </h2>

            {/* Text */}
            <p className="leading-relaxed text-base lg:text-lg" style={{ color: NYT_COLORS.textSecondary }}>
                {step.text}
            </p>

            {/* Subtext (sources, additional context) */}
            {step.subtext && isActive && (
                <motion.p
                    className="mt-4 text-sm italic"
                    style={{ color: NYT_COLORS.textMuted }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {step.subtext}
                </motion.p>
            )}

            {/* Power metric badge */}
            {step.powerMetric && isActive && (
                <motion.div
                    className="mt-4 inline-flex items-baseline gap-1 rounded-lg px-3 py-2"
                    style={{ backgroundColor: `${NYT_COLORS.bgDeep}80` }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="text-xl font-bold font-mono" style={{ color: NYT_COLORS.textPrimary }}>
                        {step.powerMetric.value}
                    </span>
                    <span className="text-sm font-mono" style={{ color: NYT_COLORS.textSecondary }}>
                        {step.powerMetric.unit}
                    </span>
                    <span className="text-xs ml-2" style={{ color: NYT_COLORS.textMuted }}>
                        {step.powerMetric.comparison}
                    </span>
                </motion.div>
            )}

            {/* Visual hint for active card */}
            {isActive && (
                <motion.div
                    className="mt-6 flex items-center gap-2 text-sm"
                    style={{ color: NYT_COLORS.textMuted }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Watch the visualization</span>
                </motion.div>
            )}
        </motion.div>
    );
}

/**
 * Progress Indicator - Shows overall story progress
 * NYT-style with muted warm tones
 */
function ProgressIndicator({ currentIndex, totalSteps }: { currentIndex: number; totalSteps: number }) {
    const progress = ((currentIndex + 1) / totalSteps) * 100;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 z-20">
            <div
                className="flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2"
                style={{ backgroundColor: `${NYT_COLORS.bgDeep}99` }}
            >
                {/* Mini step dots */}
                <div className="flex gap-1">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: index === currentIndex
                                    ? NYT_COLORS.textPrimary
                                    : index < currentIndex
                                        ? `${NYT_COLORS.textPrimary}99`
                                        : NYT_COLORS.textMuted,
                                transform: index === currentIndex ? 'scale(1.25)' : 'scale(1)',
                            }}
                        />
                    ))}
                </div>
                {/* Percentage */}
                <span className="text-xs font-mono ml-2" style={{ color: NYT_COLORS.textPrimary }}>
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
}

/**
 * Scroll Hint - Animated indicator to scroll down
 * NYT-style with muted warm text
 */
function ScrollHint({ currentIndex }: { currentIndex: number }) {
    if (currentIndex > 0) return null;

    return (
        <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2 }}
        >
            <div className="flex flex-col items-center" style={{ color: `${NYT_COLORS.textSecondary}99` }}>
                <span className="text-sm mb-2">Scroll to explore</span>
                <motion.svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </motion.svg>
            </div>
        </motion.div>
    );
}

/**
 * Disclaimer Banner - Representative data caveat
 */
function DisclaimerBanner() {
    return (
        <div
            className="w-full max-w-md mx-auto pointer-events-auto px-4 lg:px-0"
        >
            <div
                className="backdrop-blur-sm rounded-lg px-4 py-3 border flex items-start gap-2"
                style={{
                    backgroundColor: `${NYT_COLORS.bgDeep}cc`,
                    borderColor: NYT_COLORS.border,
                }}
            >
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: NYT_COLORS.textMuted }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs italic leading-relaxed" style={{ color: NYT_COLORS.textMuted }}>
                    Project locations shown are representative of the scale and type of development occurring across the U.S. They do not depict actual site locations or non-public project information.
                </p>
            </div>
        </div>
    );
}

/**
 * Call to Action - End of story prompt
 * NYT-style with warm muted colors
 */
function CallToAction() {
    return (
        <motion.div
            className="w-full max-w-md mx-auto text-center pointer-events-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
        >
            <div
                className="backdrop-blur-md rounded-2xl p-8 border shadow-2xl"
                style={{
                    background: `linear-gradient(to bottom right, ${NYT_COLORS.bgSurface}f2, ${NYT_COLORS.bgDeep}f2)`,
                    borderColor: NYT_COLORS.border,
                }}
            >
                <h3 className="text-2xl font-bold mb-4" style={{ color: NYT_COLORS.textPrimary }}>
                    Explore the Numbers
                </h3>
                <p className="mb-6" style={{ color: NYT_COLORS.textSecondary }}>
                    Use our interactive calculator to see how data center policies affect electricity bills in your region.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href="/calculator"
                        className="px-6 py-3 rounded-lg font-semibold transition-colors hover:opacity-90"
                        style={{
                            backgroundColor: NYT_COLORS.textPrimary,
                            color: NYT_COLORS.bgDeep,
                        }}
                    >
                        Open Calculator
                    </a>
                    <a
                        href="/methodology"
                        className="px-6 py-3 rounded-lg font-semibold transition-colors hover:opacity-80 border"
                        style={{
                            backgroundColor: NYT_COLORS.bgDeep,
                            color: NYT_COLORS.textPrimary,
                            borderColor: NYT_COLORS.border,
                        }}
                    >
                        Read Methodology
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
