'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface MicroViewProps {
    visualState: string;
    powerMetric?: {
        value: string;
        unit: string;
        comparison: string;
    };
}

/**
 * MicroView - Zoom-out visualization from chip to campus
 * Maintains focal point at center while zooming out to show increasing scale
 */
export default function MicroView({ visualState, powerMetric }: MicroViewProps) {
    // Scale factor determines how "zoomed out" we are
    const scaleFactors: Record<string, number> = {
        'chip-glow': 1,
        'rack-zoom': 0.6,
        'pod-zoom': 0.35,
        'building-iso': 0.2,
        'campus-grid': 0.12,
    };

    const currentScale = scaleFactors[visualState] || 1;

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
            {/* Animated grid background - scales with zoom */}
            <motion.div
                className="absolute inset-0 opacity-20"
                animate={{ scale: 1 / currentScale }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                style={{ transformOrigin: 'center center' }}
            >
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-500" />
                        </pattern>
                    </defs>
                    <rect width="200%" height="200%" x="-50%" y="-50%" fill="url(#grid)" />
                </svg>
            </motion.div>

            {/* Pulsing glow effect */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.25) 0%, transparent 60%)',
                        'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
                    ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main content area - all content zooms from center */}
            <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {visualState === 'chip-glow' && <ChipVisualization key="chip" />}
                    {visualState === 'rack-zoom' && <RackVisualization key="rack" />}
                    {visualState === 'pod-zoom' && <PodVisualization key="pod" />}
                    {visualState === 'building-iso' && <BuildingVisualization key="building" />}
                    {visualState === 'campus-grid' && <CampusVisualization key="campus" />}
                </AnimatePresence>
            </div>

            {/* Power consumption indicator */}
            <PowerIndicator visualState={visualState} powerMetric={powerMetric} />

            {/* Scale indicator */}
            <ScaleIndicator visualState={visualState} />
        </div>
    );
}

/**
 * Chip Visualization - NVIDIA Rubin GPU at 2.3kW
 */
function ChipVisualization() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
        >
            <svg width="400" height="400" viewBox="0 0 400 400" className="drop-shadow-2xl">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a5f" />
                        <stop offset="50%" stopColor="#0c1929" />
                        <stop offset="100%" stopColor="#1e3a5f" />
                    </linearGradient>
                    <linearGradient id="heatGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>

                {/* Circuit traces extending outward */}
                {[...Array(16)].map((_, i) => {
                    const angle = (i / 16) * Math.PI * 2;
                    const x1 = 200 + Math.cos(angle) * 80;
                    const y1 = 200 + Math.sin(angle) * 80;
                    const x2 = 200 + Math.cos(angle) * 180;
                    const y2 = 200 + Math.sin(angle) * 180;
                    return (
                        <motion.line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#06b6d4"
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6 }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                        />
                    );
                })}

                {/* Connection pins */}
                {[...Array(16)].map((_, i) => {
                    const angle = (i / 16) * Math.PI * 2;
                    const x = 200 + Math.cos(angle) * 180;
                    const y = 200 + Math.sin(angle) * 180;
                    return (
                        <motion.circle
                            key={`pin-${i}`}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#06b6d4"
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.5, delay: i * 0.05, repeat: Infinity }}
                        />
                    );
                })}

                {/* Main chip body */}
                <motion.rect
                    x="120"
                    y="120"
                    width="160"
                    height="160"
                    rx="8"
                    fill="url(#chipGradient)"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    filter="url(#glow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Die area */}
                <motion.rect
                    x="145"
                    y="145"
                    width="110"
                    height="110"
                    rx="4"
                    fill="#0a0a0a"
                    stroke="#1f2937"
                    strokeWidth="1"
                />

                {/* Heat signature in the center */}
                <motion.rect
                    x="160"
                    y="160"
                    width="80"
                    height="80"
                    rx="2"
                    fill="url(#heatGradient)"
                    opacity={0.8}
                    animate={{ opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* "RUBIN" text */}
                <text x="200" y="195" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="monospace">
                    NVIDIA
                </text>
                <text x="200" y="215" textAnchor="middle" fill="#06b6d4" fontSize="18" fontWeight="bold" fontFamily="monospace">
                    RUBIN
                </text>
            </svg>
        </motion.div>
    );
}

/**
 * Rack Visualization - Vera Rubin NVL72 rack at 120kW
 */
function RackVisualization() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
        >
            <svg width="500" height="500" viewBox="0 0 500 500" className="drop-shadow-2xl">
                <defs>
                    <linearGradient id="rackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1f2937" />
                        <stop offset="50%" stopColor="#111827" />
                        <stop offset="100%" stopColor="#1f2937" />
                    </linearGradient>
                    <linearGradient id="rackHeatGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <filter id="serverGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Liquid cooling pipes */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <rect x="80" y="50" width="12" height="380" rx="6" fill="#0891b2" opacity={0.6} />
                    <rect x="408" y="50" width="12" height="380" rx="6" fill="#0891b2" opacity={0.6} />
                    <motion.rect
                        x="82" y="50" width="8" height="380" rx="4"
                        fill="#22d3ee"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.rect
                        x="410" y="50" width="8" height="380" rx="4"
                        fill="#22d3ee"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    />
                </motion.g>

                {/* Rack frame */}
                <rect x="100" y="30" width="300" height="420" rx="4" fill="url(#rackGradient)" stroke="#374151" strokeWidth="2" />

                {/* Rack rails */}
                <rect x="115" y="40" width="8" height="400" fill="#4b5563" rx="2" />
                <rect x="377" y="40" width="8" height="400" fill="#4b5563" rx="2" />

                {/* Server units - 8 trays representing NVL72 */}
                {[...Array(8)].map((_, i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                    >
                        {/* Server tray */}
                        <rect
                            x="130"
                            y={50 + i * 48}
                            width="240"
                            height="42"
                            rx="2"
                            fill="#0f172a"
                            stroke="#1e293b"
                            strokeWidth="1"
                        />

                        {/* GPU modules (9 per tray = 72 total) */}
                        {[...Array(9)].map((_, j) => (
                            <motion.rect
                                key={`gpu-${i}-${j}`}
                                x={138 + j * 25}
                                y={55 + i * 48}
                                width="20"
                                height="32"
                                rx="1"
                                fill="#1e3a5f"
                                stroke="#06b6d4"
                                strokeWidth="0.5"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: (i + j) * 0.05 }}
                            />
                        ))}

                        {/* Heat glow from tray */}
                        <motion.rect
                            x="135"
                            y={52 + i * 48}
                            width="230"
                            height="38"
                            rx="2"
                            fill="url(#rackHeatGradient)"
                            opacity={0.1}
                            filter="url(#serverGlow)"
                            animate={{ opacity: [0.05, 0.15, 0.05] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        />
                    </motion.g>
                ))}

                {/* Rack label */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    <text x="250" y="470" textAnchor="middle" fill="#9ca3af" fontSize="12" fontFamily="monospace">
                        VERA RUBIN NVL72
                    </text>
                    <text x="250" y="488" textAnchor="middle" fill="#06b6d4" fontSize="10" fontFamily="monospace">
                        72 GPUs × 2.3 kW = 165 kW (with cooling: 120 kW IT)
                    </text>
                </motion.g>
            </svg>
        </motion.div>
    );
}

/**
 * Pod Visualization - Multiple racks forming a compute pod (1-2 MW)
 */
function PodVisualization() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
        >
            <svg width="700" height="500" viewBox="0 0 700 500" className="drop-shadow-2xl">
                <defs>
                    <linearGradient id="podFloorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1f2937" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                </defs>

                {/* Floor/room outline - isometric */}
                <motion.polygon
                    points="350,50 650,175 350,300 50,175"
                    fill="url(#podFloorGradient)"
                    stroke="#374151"
                    strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Racks in isometric grid - 4 rows of 4 */}
                {[...Array(4)].map((_, row) =>
                    [...Array(4)].map((_, col) => {
                        const baseX = 200 + col * 80 - row * 60;
                        const baseY = 100 + row * 40 + col * 25;
                        const delay = (row * 4 + col) * 0.05;
                        return (
                            <motion.g
                                key={`rack-${row}-${col}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay, duration: 0.5 }}
                            >
                                {/* Rack body - isometric box */}
                                <polygon
                                    points={`${baseX},${baseY} ${baseX + 50},${baseY + 15} ${baseX + 50},${baseY + 80} ${baseX},${baseY + 65}`}
                                    fill="#1f2937"
                                    stroke="#374151"
                                    strokeWidth="1"
                                />
                                <polygon
                                    points={`${baseX},${baseY} ${baseX + 30},${baseY - 10} ${baseX + 80},${baseY + 5} ${baseX + 50},${baseY + 15}`}
                                    fill="#374151"
                                    stroke="#4b5563"
                                    strokeWidth="1"
                                />
                                <polygon
                                    points={`${baseX + 50},${baseY + 15} ${baseX + 80},${baseY + 5} ${baseX + 80},${baseY + 70} ${baseX + 50},${baseY + 80}`}
                                    fill="#111827"
                                    stroke="#374151"
                                    strokeWidth="1"
                                />

                                {/* Status LED */}
                                <motion.circle
                                    cx={baseX + 10}
                                    cy={baseY + 20}
                                    r="3"
                                    fill="#22c55e"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: delay }}
                                />

                                {/* Heat signature */}
                                <motion.rect
                                    x={baseX + 5}
                                    y={baseY + 25}
                                    width="40"
                                    height="35"
                                    fill="#f59e0b"
                                    opacity={0.1}
                                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: delay }}
                                />
                            </motion.g>
                        );
                    })
                )}

                {/* Cooling infrastructure */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    {/* CRAH units */}
                    <rect x="50" y="320" width="80" height="60" rx="4" fill="#0891b2" stroke="#06b6d4" strokeWidth="2" />
                    <text x="90" y="355" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace">CRAH</text>
                    <rect x="570" y="320" width="80" height="60" rx="4" fill="#0891b2" stroke="#06b6d4" strokeWidth="2" />
                    <text x="610" y="355" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace">CRAH</text>

                    {/* Airflow arrows */}
                    {[...Array(3)].map((_, i) => (
                        <motion.path
                            key={`air-${i}`}
                            d={`M 140 ${330 + i * 15} L 200 ${330 + i * 15}`}
                            stroke="#22d3ee"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        />
                    ))}
                </motion.g>

                {/* Pod metrics */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                    <rect x="250" y="400" width="200" height="70" rx="6" fill="rgba(0,0,0,0.7)" stroke="#374151" />
                    <text x="350" y="425" textAnchor="middle" fill="#9ca3af" fontSize="12" fontFamily="sans-serif">
                        COMPUTE POD
                    </text>
                    <text x="350" y="448" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="monospace">
                        16 RACKS
                    </text>
                    <text x="350" y="465" textAnchor="middle" fill="#f59e0b" fontSize="12" fontFamily="monospace">
                        ~2 MW continuous
                    </text>
                </motion.g>
            </svg>
        </motion.div>
    );
}

/**
 * Building Visualization - Hyperscale facility (100+ MW)
 */
function BuildingVisualization() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
        >
            <svg width="700" height="550" viewBox="0 0 700 550" className="drop-shadow-2xl">
                <defs>
                    <linearGradient id="buildingTop" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a5f" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="buildingLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0c1929" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="buildingRight" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                </defs>

                {/* Ground shadow */}
                <ellipse cx="350" cy="420" rx="280" ry="50" fill="rgba(0,0,0,0.3)" />

                {/* Main building - isometric */}
                <motion.polygon
                    points="350,60 530,145 350,230 170,145"
                    fill="url(#buildingTop)"
                    stroke="#475569"
                    strokeWidth="2"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                />
                <motion.polygon
                    points="170,145 350,230 350,390 170,305"
                    fill="url(#buildingLeft)"
                    stroke="#475569"
                    strokeWidth="2"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                />
                <motion.polygon
                    points="350,230 530,145 530,305 350,390"
                    fill="url(#buildingRight)"
                    stroke="#475569"
                    strokeWidth="2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                />

                {/* Windows/vents on left face - in rows */}
                {[...Array(4)].map((_, row) =>
                    [...Array(5)].map((_, col) => (
                        <motion.rect
                            key={`win-l-${row}-${col}`}
                            x={185 + col * 30}
                            y={175 + row * 40 + col * 12}
                            width="18"
                            height="22"
                            fill="#06b6d4"
                            opacity={0.5}
                            transform={`skewY(26.57)`}
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: (row + col) * 0.15 }}
                        />
                    ))
                )}

                {/* Windows on right face */}
                {[...Array(4)].map((_, row) =>
                    [...Array(5)].map((_, col) => (
                        <motion.rect
                            key={`win-r-${row}-${col}`}
                            x={365 + col * 30}
                            y={162 + row * 40 - col * 12}
                            width="18"
                            height="22"
                            fill="#06b6d4"
                            opacity={0.5}
                            transform={`skewY(-26.57)`}
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: (row + col) * 0.15 + 0.5 }}
                        />
                    ))
                )}

                {/* Rooftop cooling */}
                {[...Array(6)].map((_, i) => (
                    <motion.g key={`hvac-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + i * 0.1 }}>
                        <rect
                            x={230 + (i % 3) * 50}
                            y={75 + Math.floor(i / 3) * 40 + (i % 3) * 15}
                            width="35"
                            height="25"
                            fill="#374151"
                            stroke="#4b5563"
                        />
                        <motion.circle
                            cx={247 + (i % 3) * 50}
                            cy={87 + Math.floor(i / 3) * 40 + (i % 3) * 15}
                            r="8"
                            fill="#1f2937"
                            stroke="#06b6d4"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            style={{ transformOrigin: `${247 + (i % 3) * 50}px ${87 + Math.floor(i / 3) * 40 + (i % 3) * 15}px` }}
                        />
                    </motion.g>
                ))}

                {/* Backup generators */}
                {[...Array(4)].map((_, i) => (
                    <motion.g key={`gen-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 + i * 0.1 }}>
                        <rect x={560 + i * 8} y={300 - i * 25} width="55" height="35" rx="3" fill="#1f2937" stroke="#4b5563" />
                        <text x={587 + i * 8} y={322 - i * 25} textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="monospace">GEN</text>
                    </motion.g>
                ))}

                {/* Substation */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    <rect x="50" y="280" width="80" height="60" rx="4" fill="#374151" stroke="#f59e0b" strokeWidth="2" />
                    <text x="90" y="315" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">SUBSTATION</text>

                    {/* Power lines from substation */}
                    <motion.path
                        d="M 130 300 Q 145 290, 170 285"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="3"
                        animate={{ strokeDashoffset: [0, -20] }}
                        strokeDasharray="8 4"
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.path
                        d="M 130 320 Q 145 310, 170 305"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="3"
                        animate={{ strokeDashoffset: [0, -20] }}
                        strokeDasharray="8 4"
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear', delay: 0.1 }}
                    />
                </motion.g>

                {/* Facility metrics */}
                <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}>
                    <rect x="230" y="460" width="240" height="70" rx="8" fill="rgba(127, 29, 29, 0.9)" stroke="#dc2626" strokeWidth="2" />
                    <text x="350" y="485" textAnchor="middle" fill="white" fontSize="12" fontFamily="sans-serif">
                        HYPERSCALE FACILITY
                    </text>
                    <text x="350" y="510" textAnchor="middle" fill="#fca5a5" fontSize="20" fontWeight="bold" fontFamily="monospace">
                        100+ MW
                    </text>
                    <text x="350" y="525" textAnchor="middle" fill="#fca5a5" fontSize="11" fontFamily="monospace">
                        ≈ 80,000 homes
                    </text>
                </motion.g>
            </svg>
        </motion.div>
    );
}

/**
 * Campus Visualization - Multiple facilities with grid infrastructure (500+ MW)
 */
function CampusVisualization() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
        >
            <svg width="800" height="600" viewBox="0 0 800 600" className="drop-shadow-2xl">
                <defs>
                    <linearGradient id="campusGround" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ground */}
                <rect x="0" y="0" width="800" height="600" fill="url(#campusGround)" />

                {/* Transmission lines entering campus */}
                <motion.g filter="url(#lineGlow)">
                    {/* Main transmission corridor */}
                    <motion.path
                        d="M 0 200 L 200 250 L 400 230"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        animate={{ strokeDashoffset: [0, -40] }}
                        strokeDasharray="20 10"
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.path
                        d="M 0 220 L 200 270 L 400 250"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        animate={{ strokeDashoffset: [0, -40] }}
                        strokeDasharray="20 10"
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear', delay: 0.2 }}
                    />

                    {/* Towers */}
                    {[50, 150, 250].map((x, i) => (
                        <g key={`tower-${i}`}>
                            <polygon points={`${x},${190 + i * 10} ${x + 20},${190 + i * 10} ${x + 16},${240 + i * 12} ${x + 4},${240 + i * 12}`} fill="#4b5563" />
                            <line x1={x - 10} y1={195 + i * 10} x2={x + 30} y2={195 + i * 10} stroke="#4b5563" strokeWidth="4" />
                            <line x1={x - 5} y1={210 + i * 10} x2={x + 25} y2={210 + i * 10} stroke="#4b5563" strokeWidth="3" />
                        </g>
                    ))}
                </motion.g>

                {/* Main substation */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <rect x="350" y="200" width="100" height="80" rx="4" fill="#374151" stroke="#f59e0b" strokeWidth="3" />
                    <text x="400" y="245" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace">500 kV</text>
                    <text x="400" y="260" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace">SUBSTATION</text>
                </motion.g>

                {/* Distribution lines to buildings */}
                <motion.g filter="url(#lineGlow)">
                    {[[450, 240, 550, 180], [450, 250, 620, 320], [420, 280, 300, 380], [420, 280, 500, 420]].map(([x1, y1, x2, y2], i) => (
                        <motion.line
                            key={`dist-${i}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#06b6d4"
                            strokeWidth="3"
                            animate={{ strokeDashoffset: [0, -30] }}
                            strokeDasharray="15 8"
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
                        />
                    ))}
                </motion.g>

                {/* Data center buildings */}
                {[
                    { x: 520, y: 120, w: 100, h: 80, label: 'DC-1', mw: '120 MW' },
                    { x: 580, y: 280, w: 120, h: 90, label: 'DC-2', mw: '150 MW' },
                    { x: 240, y: 340, w: 110, h: 85, label: 'DC-3', mw: '130 MW' },
                    { x: 440, y: 380, w: 130, h: 95, label: 'DC-4', mw: '180 MW' },
                ].map((bldg, i) => (
                    <motion.g
                        key={`bldg-${i}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.2 }}
                    >
                        {/* Building shadow */}
                        <ellipse cx={bldg.x + bldg.w / 2} cy={bldg.y + bldg.h + 10} rx={bldg.w / 2} ry={10} fill="rgba(0,0,0,0.3)" />

                        {/* Building */}
                        <rect x={bldg.x} y={bldg.y} width={bldg.w} height={bldg.h} rx="4" fill="#1e3a5f" stroke="#06b6d4" strokeWidth="2" />

                        {/* Windows */}
                        {[...Array(Math.floor(bldg.w / 25))].map((_, j) =>
                            [...Array(Math.floor(bldg.h / 25))].map((_, k) => (
                                <motion.rect
                                    key={`win-${i}-${j}-${k}`}
                                    x={bldg.x + 8 + j * 25}
                                    y={bldg.y + 8 + k * 25}
                                    width="15"
                                    height="15"
                                    fill="#06b6d4"
                                    opacity={0.5}
                                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: (j + k) * 0.1 }}
                                />
                            ))
                        )}

                        {/* Labels */}
                        <text x={bldg.x + bldg.w / 2} y={bldg.y + bldg.h + 30} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">
                            {bldg.label}
                        </text>
                        <text x={bldg.x + bldg.w / 2} y={bldg.y + bldg.h + 45} textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace">
                            {bldg.mw}
                        </text>
                    </motion.g>
                ))}

                {/* Campus metrics */}
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>
                    <rect x="50" y="480" width="280" height="90" rx="8" fill="rgba(0,0,0,0.8)" stroke="#ef4444" strokeWidth="2" />
                    <text x="190" y="510" textAnchor="middle" fill="#9ca3af" fontSize="14" fontFamily="sans-serif">
                        DATA CENTER CAMPUS
                    </text>
                    <text x="190" y="540" textAnchor="middle" fill="#ef4444" fontSize="28" fontWeight="bold" fontFamily="monospace">
                        580 MW
                    </text>
                    <text x="190" y="560" textAnchor="middle" fill="#fca5a5" fontSize="12" fontFamily="monospace">
                        ≈ half a nuclear power plant
                    </text>
                </motion.g>
            </svg>
        </motion.div>
    );
}

/**
 * Power Indicator - Shows escalating power consumption
 */
function PowerIndicator({ visualState, powerMetric }: { visualState: string; powerMetric?: { value: string; unit: string; comparison: string } }) {
    const defaultPowerData: Record<string, { label: string; value: string; unit: string; comparison: string; color: string }> = {
        'chip-glow': { label: 'Single GPU', value: '2.3', unit: 'kW', comparison: '≈ 2 homes', color: '#06b6d4' },
        'rack-zoom': { label: 'Server Rack', value: '120', unit: 'kW', comparison: '≈ 100 homes', color: '#f59e0b' },
        'pod-zoom': { label: 'Compute Pod', value: '2', unit: 'MW', comparison: '≈ 1,600 homes', color: '#f59e0b' },
        'building-iso': { label: 'Facility', value: '100+', unit: 'MW', comparison: '≈ 80,000 homes', color: '#ef4444' },
        'campus-grid': { label: 'Campus', value: '500+', unit: 'MW', comparison: '≈ half a nuclear plant', color: '#ef4444' },
    };

    const data = defaultPowerData[visualState];
    if (!data) return null;

    const displayValue = powerMetric?.value || data.value;
    const displayUnit = powerMetric?.unit || data.unit;
    const displayComparison = powerMetric?.comparison || data.comparison;

    return (
        <motion.div
            className="absolute bottom-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-5 py-4 border border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={visualState}
        >
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{data.label}</div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono" style={{ color: data.color }}>
                    {displayValue}
                </span>
                <span className="text-lg font-mono text-gray-300">{displayUnit}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">{displayComparison}</div>
        </motion.div>
    );
}

/**
 * Scale Indicator - Shows what level we're viewing
 */
function ScaleIndicator({ visualState }: { visualState: string }) {
    const scales: Record<string, { level: number; label: string }> = {
        'chip-glow': { level: 1, label: 'GPU' },
        'rack-zoom': { level: 2, label: 'Rack' },
        'pod-zoom': { level: 3, label: 'Pod' },
        'building-iso': { level: 4, label: 'Facility' },
        'campus-grid': { level: 5, label: 'Campus' },
    };

    const current = scales[visualState];
    if (!current) return null;

    return (
        <motion.div
            className="absolute top-8 right-8 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Scale</div>
            <div className="flex gap-1">
                {Object.values(scales).map((s, i) => (
                    <div
                        key={i}
                        className={`w-2 h-8 rounded-sm transition-colors ${i < current.level ? 'bg-cyan-500' : 'bg-gray-700'
                            }`}
                    />
                ))}
            </div>
            <div className="text-sm text-white font-medium mt-2">{current.label}</div>
        </motion.div>
    );
}
