'use client';

import { useState, useCallback } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import { motion, AnimatePresence } from 'framer-motion';
import MicroView from './MicroView';
import MapView from './MapView';
import { steps, type StoryStep } from './storyData';

/**
 * ScrollyMap - Main scrollytelling component
 * Orchestrates the narrative from microchip to national grid
 */
export default function ScrollyMap() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const currentStep = steps[currentStepIndex];

    const onStepEnter = useCallback(({ data }: { data: unknown }) => {
        setCurrentStepIndex(data as number);
    }, []);

    // Determine which visualization to show based on mode
    const renderVisualization = () => {
        // Micro mode: SVG visualizations (chip, rack, pod, building)
        if (currentStep.mode === 'micro') {
            return (
                <motion.div
                    key={`micro-${currentStep.id}`}
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <MicroView
                        visualState={currentStep.visualState || 'chip-glow'}
                        powerMetric={currentStep.powerMetric}
                    />
                </motion.div>
            );
        }

        // Infrastructure mode: Shows campus with grid elements (transition between micro and map)
        if (currentStep.mode === 'infrastructure') {
            return (
                <motion.div
                    key={`infra-${currentStep.id}`}
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <MicroView
                        visualState={currentStep.visualState || 'campus-grid'}
                        powerMetric={currentStep.powerMetric}
                    />
                </motion.div>
            );
        }

        // Map mode: Mapbox visualizations for regional views
        return (
            <motion.div
                key={`map-${currentStep.id}`}
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                {currentStep.location && (
                    <MapView
                        location={currentStep.location}
                        layerColor={currentStep.layerColor}
                        stepId={currentStep.id}
                        region={currentStep.region}
                        powerMetric={currentStep.powerMetric}
                    />
                )}
            </motion.div>
        );
    };

    return (
        <div className="relative min-h-screen bg-gray-950">
            {/* Sticky visual container - Full screen on mobile, 60% on desktop */}
            <div className="sticky top-0 h-screen w-full lg:w-[60%] lg:ml-auto z-0">
                <AnimatePresence mode="wait">
                    {renderVisualization()}
                </AnimatePresence>

                {/* Progress indicator */}
                <ProgressIndicator currentIndex={currentStepIndex} totalSteps={steps.length} />
            </div>

            {/* Scrolling narrative cards */}
            <div className="relative z-10 lg:w-[40%] pointer-events-none">
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
    // Determine mode label and color
    const getModeInfo = () => {
        switch (step.mode) {
            case 'micro':
                return { label: 'Micro Scale', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' };
            case 'infrastructure':
                return { label: 'Grid Infrastructure', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400' };
            case 'map':
                return { label: 'Regional View', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' };
            default:
                return { label: 'View', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400' };
        }
    };

    const modeInfo = getModeInfo();

    return (
        <motion.div
            className={`
                w-full max-w-md mx-auto lg:mx-0
                bg-gray-900/90 backdrop-blur-md
                rounded-2xl p-6 lg:p-8
                border transition-all duration-500
                pointer-events-auto
                ${isActive ? 'border-white/30 shadow-2xl shadow-black/50' : 'border-gray-800/50 opacity-40'}
            `}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isActive ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        text-xs font-bold transition-colors
                        ${isActive ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-500'}
                    `}
                >
                    {stepNumber}
                </div>
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: isActive ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <span className="text-xs text-gray-500 font-mono">{stepNumber}/{totalSteps}</span>
            </div>

            {/* Mode indicator and region */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`px-2 py-1 ${modeInfo.bgColor} ${modeInfo.textColor} text-xs rounded-full font-medium`}>
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
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
                {step.title}
            </h2>

            {/* Text */}
            <p className="text-gray-300 leading-relaxed text-base lg:text-lg">
                {step.text}
            </p>

            {/* Subtext (sources, additional context) */}
            {step.subtext && isActive && (
                <motion.p
                    className="mt-4 text-sm text-gray-500 italic"
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
                    className="mt-4 inline-flex items-baseline gap-1 bg-gray-800/50 rounded-lg px-3 py-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="text-xl font-bold text-white font-mono">
                        {step.powerMetric.value}
                    </span>
                    <span className="text-sm text-gray-400 font-mono">
                        {step.powerMetric.unit}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                        {step.powerMetric.comparison}
                    </span>
                </motion.div>
            )}

            {/* Visual hint for active card */}
            {isActive && (
                <motion.div
                    className="mt-6 flex items-center gap-2 text-gray-500 text-sm"
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
 */
function ProgressIndicator({ currentIndex, totalSteps }: { currentIndex: number; totalSteps: number }) {
    const progress = ((currentIndex + 1) / totalSteps) * 100;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 z-20">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
                {/* Mini step dots */}
                <div className="flex gap-1">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`
                                w-2 h-2 rounded-full transition-all duration-300
                                ${index === currentIndex ? 'bg-white scale-125' : index < currentIndex ? 'bg-white/60' : 'bg-gray-600'}
                            `}
                        />
                    ))}
                </div>
                {/* Percentage */}
                <span className="text-white text-xs font-mono ml-2">{Math.round(progress)}%</span>
            </div>
        </div>
    );
}

/**
 * Scroll Hint - Animated indicator to scroll down
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
            <div className="flex flex-col items-center text-white/60">
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
 * Call to Action - End of story prompt
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
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-4">
                    Explore the Numbers
                </h3>
                <p className="text-gray-400 mb-6">
                    Use our interactive calculator to see how data center policies affect electricity bills in your region.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href="/calculator"
                        className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Open Calculator
                    </a>
                    <a
                        href="/methodology"
                        className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors border border-gray-600"
                    >
                        Read Methodology
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
