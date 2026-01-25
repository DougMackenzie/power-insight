'use client';

import { motion } from 'framer-motion';

interface MicroViewProps {
    visualState: string;
    powerMetric?: {
        value: string;
        unit: string;
        comparison: string;
    };
}

/**
 * MicroView - Focal-point zoom visualization
 *
 * Single unified visualization where the GPU is always at center.
 * As we "zoom out", we decrease the scale to reveal more context:
 * - GPU at center
 * - Rack containing the GPU
 * - Pod containing multiple racks
 * - Building containing multiple pods
 *
 * This maintains visual continuity with the GPU as the focal point.
 */
export default function MicroView({ visualState, powerMetric }: MicroViewProps) {
    // Scale determines zoom level - higher = more zoomed in on GPU
    const scaleConfig: Record<string, { scale: number; opacity: { gpu: number; rack: number; pod: number; building: number } }> = {
        'chip-glow': {
            scale: 4,
            opacity: { gpu: 1, rack: 0, pod: 0, building: 0 }
        },
        'rack-zoom': {
            scale: 2,
            opacity: { gpu: 1, rack: 1, pod: 0, building: 0 }
        },
        'pod-zoom': {
            scale: 1,
            opacity: { gpu: 0.8, rack: 1, pod: 1, building: 0 }
        },
        'building-iso': {
            scale: 0.5,
            opacity: { gpu: 0.5, rack: 0.8, pod: 1, building: 1 }
        },
        'campus-grid': {
            scale: 0.25,
            opacity: { gpu: 0.3, rack: 0.5, pod: 0.8, building: 1 }
        },
    };

    const config = scaleConfig[visualState] || scaleConfig['chip-glow'];

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0">
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 40%)',
                            'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.2) 0%, transparent 50%)',
                            'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 40%)',
                        ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Grid that scales with zoom */}
            <motion.div
                className="absolute inset-0 opacity-10"
                animate={{
                    scale: config.scale,
                }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: 'center center' }}
            >
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="microGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="300%" height="300%" x="-100%" y="-100%" fill="url(#microGrid)" />
                </svg>
            </motion.div>

            {/* Main focal-point container - everything scales from center */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="relative"
                    animate={{
                        scale: config.scale,
                    }}
                    transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{ transformOrigin: 'center center' }}
                >
                    {/* Building layer (outermost) */}
                    <motion.div
                        className="absolute"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                        animate={{ opacity: config.opacity.building }}
                        transition={{ duration: 0.8 }}
                    >
                        <BuildingLayer />
                    </motion.div>

                    {/* Pod layer */}
                    <motion.div
                        className="absolute"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                        animate={{ opacity: config.opacity.pod }}
                        transition={{ duration: 0.8 }}
                    >
                        <PodLayer />
                    </motion.div>

                    {/* Rack layer */}
                    <motion.div
                        className="absolute"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                        animate={{ opacity: config.opacity.rack }}
                        transition={{ duration: 0.8 }}
                    >
                        <RackLayer />
                    </motion.div>

                    {/* GPU layer (innermost - always centered) */}
                    <motion.div
                        className="absolute"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                        animate={{ opacity: config.opacity.gpu }}
                        transition={{ duration: 0.8 }}
                    >
                        <GPULayer />
                    </motion.div>
                </motion.div>
            </div>

            {/* Power indicator */}
            <PowerIndicator visualState={visualState} powerMetric={powerMetric} />

            {/* Scale indicator */}
            <ScaleIndicator visualState={visualState} />
        </div>
    );
}

/**
 * GPU Layer - The innermost focal point
 */
function GPULayer() {
    return (
        <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
            <defs>
                <filter id="gpuGlow">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="gpuHeat" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
            </defs>

            {/* Connection traces */}
            {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                    <motion.line
                        key={i}
                        x1={60 + Math.cos(angle) * 30}
                        y1={60 + Math.sin(angle) * 30}
                        x2={60 + Math.cos(angle) * 55}
                        y2={60 + Math.sin(angle) * 55}
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                );
            })}

            {/* Chip body */}
            <rect x="30" y="30" width="60" height="60" rx="4" fill="#0c1929" stroke="#06b6d4" strokeWidth="2" filter="url(#gpuGlow)" />

            {/* Die */}
            <rect x="38" y="38" width="44" height="44" rx="2" fill="#0a0a0a" stroke="#1f2937" />

            {/* Heat core */}
            <motion.rect
                x="45"
                y="45"
                width="30"
                height="30"
                rx="2"
                fill="url(#gpuHeat)"
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Label */}
            <text x="60" y="63" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="monospace">RUBIN</text>
        </svg>
    );
}

/**
 * Rack Layer - Contains the GPU, shows server context
 */
function RackLayer() {
    return (
        <svg width="200" height="300" viewBox="0 0 200 300" className="drop-shadow-lg">
            {/* Rack frame */}
            <rect x="20" y="10" width="160" height="280" rx="4" fill="#111827" stroke="#374151" strokeWidth="2" />

            {/* Rack rails */}
            <rect x="30" y="20" width="4" height="260" fill="#4b5563" rx="1" />
            <rect x="166" y="20" width="4" height="260" fill="#4b5563" rx="1" />

            {/* Server trays - 8 units */}
            {[...Array(8)].map((_, i) => (
                <g key={i}>
                    <rect x="40" y={25 + i * 32} width="120" height="28" rx="2" fill="#0f172a" stroke="#1e293b" />

                    {/* GPU modules in each tray */}
                    {[...Array(6)].map((_, j) => (
                        <motion.rect
                            key={j}
                            x={45 + j * 19}
                            y={29 + i * 32}
                            width="15"
                            height="20"
                            rx="1"
                            fill="#1e3a5f"
                            stroke="#06b6d4"
                            strokeWidth="0.5"
                            animate={{ opacity: [0.6, 0.9, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: (i + j) * 0.05 }}
                        />
                    ))}

                    {/* Status LED */}
                    <motion.circle
                        cx="155"
                        cy={39 + i * 32}
                        r="3"
                        fill="#22c55e"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    />
                </g>
            ))}

            {/* Cooling pipes */}
            <rect x="10" y="20" width="6" height="260" rx="3" fill="#0891b2" opacity="0.6" />
            <rect x="184" y="20" width="6" height="260" rx="3" fill="#0891b2" opacity="0.6" />
        </svg>
    );
}

/**
 * Pod Layer - Multiple racks in isometric view
 */
function PodLayer() {
    return (
        <svg width="500" height="400" viewBox="0 0 500 400" className="drop-shadow-xl">
            {/* Floor */}
            <polygon points="250,50 450,140 250,230 50,140" fill="#1f2937" stroke="#374151" opacity="0.5" />

            {/* Rack array - 4x4 isometric */}
            {[...Array(4)].map((_, row) =>
                [...Array(4)].map((_, col) => {
                    const x = 150 + col * 50 - row * 40;
                    const y = 80 + row * 30 + col * 18;
                    return (
                        <g key={`${row}-${col}`}>
                            {/* Rack body */}
                            <polygon
                                points={`${x},${y} ${x + 35},${y + 12} ${x + 35},${y + 55} ${x},${y + 43}`}
                                fill="#1f2937"
                                stroke="#374151"
                            />
                            <polygon
                                points={`${x},${y} ${x + 20},${y - 8} ${x + 55},${y + 4} ${x + 35},${y + 12}`}
                                fill="#374151"
                            />
                            <polygon
                                points={`${x + 35},${y + 12} ${x + 55},${y + 4} ${x + 55},${y + 47} ${x + 35},${y + 55}`}
                                fill="#111827"
                            />

                            {/* Status light */}
                            <motion.circle
                                cx={x + 8}
                                cy={y + 15}
                                r="2"
                                fill="#22c55e"
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: (row + col) * 0.1 }}
                            />
                        </g>
                    );
                })
            )}

            {/* CRAH units */}
            <rect x="30" y="260" width="60" height="45" rx="4" fill="#0891b2" stroke="#06b6d4" strokeWidth="2" />
            <text x="60" y="287" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace">CRAH</text>

            <rect x="410" y="260" width="60" height="45" rx="4" fill="#0891b2" stroke="#06b6d4" strokeWidth="2" />
            <text x="440" y="287" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace">CRAH</text>

            {/* Pod label */}
            <rect x="175" y="330" width="150" height="50" rx="6" fill="rgba(0,0,0,0.7)" stroke="#374151" />
            <text x="250" y="352" textAnchor="middle" fill="#9ca3af" fontSize="10">COMPUTE POD</text>
            <text x="250" y="370" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="bold" fontFamily="monospace">16 RACKS • 2 MW</text>
        </svg>
    );
}

/**
 * Building Layer - Facility containing multiple pods
 */
function BuildingLayer() {
    return (
        <svg width="700" height="550" viewBox="0 0 700 550" className="drop-shadow-2xl">
            {/* Ground shadow */}
            <ellipse cx="350" cy="380" rx="250" ry="40" fill="rgba(0,0,0,0.3)" />

            {/* Building - isometric */}
            <polygon points="350,60 520,140 350,220 180,140" fill="#1e3a5f" stroke="#475569" strokeWidth="2" />
            <polygon points="180,140 350,220 350,360 180,280" fill="#0c1929" stroke="#475569" strokeWidth="2" />
            <polygon points="350,220 520,140 520,280 350,360" fill="#1e293b" stroke="#475569" strokeWidth="2" />

            {/* Windows - left face */}
            {[...Array(3)].map((_, row) =>
                [...Array(4)].map((_, col) => (
                    <motion.rect
                        key={`wl-${row}-${col}`}
                        x={195 + col * 35}
                        y={165 + row * 35 + col * 16}
                        width="20"
                        height="20"
                        fill="#06b6d4"
                        opacity="0.4"
                        transform="skewY(26.57)"
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, delay: (row + col) * 0.15 }}
                    />
                ))
            )}

            {/* Windows - right face */}
            {[...Array(3)].map((_, row) =>
                [...Array(4)].map((_, col) => (
                    <motion.rect
                        key={`wr-${row}-${col}`}
                        x={365 + col * 35}
                        y={155 + row * 35 - col * 16}
                        width="20"
                        height="20"
                        fill="#06b6d4"
                        opacity="0.4"
                        transform="skewY(-26.57)"
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, delay: (row + col) * 0.15 + 0.5 }}
                    />
                ))
            )}

            {/* Rooftop HVAC */}
            {[...Array(4)].map((_, i) => (
                <g key={`hvac-${i}`}>
                    <rect
                        x={260 + (i % 2) * 60}
                        y={80 + Math.floor(i / 2) * 35 + (i % 2) * 18}
                        width="40"
                        height="25"
                        fill="#374151"
                        stroke="#4b5563"
                    />
                    <motion.circle
                        cx={280 + (i % 2) * 60}
                        cy={92 + Math.floor(i / 2) * 35 + (i % 2) * 18}
                        r="8"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        style={{ transformOrigin: `${280 + (i % 2) * 60}px ${92 + Math.floor(i / 2) * 35 + (i % 2) * 18}px` }}
                    />
                </g>
            ))}

            {/* Substation */}
            <rect x="60" y="260" width="80" height="55" rx="4" fill="#374151" stroke="#f59e0b" strokeWidth="2" />
            <text x="100" y="292" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">SUBSTATION</text>

            {/* Power lines */}
            <motion.path
                d="M 140 280 Q 155 270, 180 265"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                animate={{ strokeDashoffset: [0, -20] }}
                strokeDasharray="8 4"
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Generators */}
            {[...Array(3)].map((_, i) => (
                <g key={`gen-${i}`}>
                    <rect x={540 + i * 8} y={260 - i * 20} width="45" height="30" rx="3" fill="#1f2937" stroke="#4b5563" />
                    <text x={562 + i * 8} y={279 - i * 20} textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">GEN</text>
                </g>
            ))}

            {/* Facility label */}
            <rect x="230" y="420" width="240" height="70" rx="8" fill="rgba(127, 29, 29, 0.9)" stroke="#dc2626" strokeWidth="2" />
            <text x="350" y="448" textAnchor="middle" fill="white" fontSize="12">HYPERSCALE FACILITY</text>
            <text x="350" y="475" textAnchor="middle" fill="#fca5a5" fontSize="22" fontWeight="bold" fontFamily="monospace">100+ MW</text>
        </svg>
    );
}

/**
 * Power Indicator
 */
function PowerIndicator({ visualState, powerMetric }: { visualState: string; powerMetric?: { value: string; unit: string; comparison: string } }) {
    const powerData: Record<string, { label: string; value: string; unit: string; comparison: string; color: string }> = {
        'chip-glow': { label: 'Single GPU', value: '2.3', unit: 'kW', comparison: '≈ 2 homes', color: '#06b6d4' },
        'rack-zoom': { label: 'Server Rack', value: '120', unit: 'kW', comparison: '≈ 100 homes', color: '#f59e0b' },
        'pod-zoom': { label: 'Compute Pod', value: '2', unit: 'MW', comparison: '≈ 1,600 homes', color: '#f59e0b' },
        'building-iso': { label: 'Facility', value: '100+', unit: 'MW', comparison: '≈ 80,000 homes', color: '#ef4444' },
        'campus-grid': { label: 'Campus', value: '500+', unit: 'MW', comparison: '≈ half nuclear plant', color: '#ef4444' },
    };

    const data = powerData[visualState];
    if (!data) return null;

    return (
        <motion.div
            key={visualState}
            className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-sm rounded-lg px-5 py-4 border border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{data.label}</div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono" style={{ color: data.color }}>
                    {powerMetric?.value || data.value}
                </span>
                <span className="text-lg font-mono text-gray-300">{powerMetric?.unit || data.unit}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">{powerMetric?.comparison || data.comparison}</div>
        </motion.div>
    );
}

/**
 * Scale Indicator
 */
function ScaleIndicator({ visualState }: { visualState: string }) {
    const scales: Record<string, { level: number; label: string }> = {
        'chip-glow': { level: 1, label: 'GPU' },
        'rack-zoom': { level: 2, label: 'Rack' },
        'pod-zoom': { level: 3, label: 'Pod' },
        'building-iso': { level: 4, label: 'Facility' },
        'campus-grid': { level: 5, label: 'Campus' },
    };

    const current = scales[visualState] || scales['chip-glow'];

    return (
        <motion.div
            className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Scale</div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <motion.div
                        key={level}
                        className="w-2 h-8 rounded-sm"
                        animate={{
                            backgroundColor: level <= current.level ? '#06b6d4' : '#374151'
                        }}
                        transition={{ duration: 0.3 }}
                    />
                ))}
            </div>
            <div className="text-sm text-white font-medium mt-2">{current.label}</div>
        </motion.div>
    );
}
