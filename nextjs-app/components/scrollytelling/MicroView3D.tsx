'use client';

import { useRef, useMemo, Suspense, useEffect, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface MicroView3DProps {
    visualState: string;
    powerMetric?: {
        value: string;
        unit: string;
        comparison: string;
    };
}

// Camera configurations for cinematic Z-axis dolly zoom
// GPU stays dead center - camera pulls straight back along diagonal
// Isometric angle maintained: position on 45° diagonal from origin
const cameraConfig: Record<string, {
    position: [number, number, number];
    target: [number, number, number];
    zoom: number;
}> = {
    // Pure Z-axis dolly: camera moves along [1, 0.6, 1] normalized direction
    // Target stays at GPU height (0.08) for chip, then rises smoothly
    'chip-glow': { position: [0.8, 0.5, 0.8], target: [0, 0.08, 0], zoom: 550 },
    'rack-zoom': { position: [3, 1.8, 3], target: [0, 0.08, 0], zoom: 100 },
    'pod-zoom': { position: [18, 10.8, 18], target: [0, 0.08, 0], zoom: 28 },
    'building-iso': { position: [80, 48, 80], target: [0, 0.08, 0], zoom: 5 },
    'campus-grid': { position: [400, 240, 400], target: [0, 0.08, 0], zoom: 0.9 },
};

const scaleOrder = ['chip-glow', 'rack-zoom', 'pod-zoom', 'building-iso', 'campus-grid'];

/**
 * MicroView3D - Continuous seamless 3D zoom from GPU to campus
 * Based on NVIDIA Rubin/Vera Rubin NVL72 specifications
 * All elements exist in one unified 3D space at their real relative scales
 */
/**
 * NYT-inspired color palette - muted but high contrast
 * Background: Deep charcoal with slight warmth (#0a0a0f to #12121a)
 * Text: Warm off-white (#f0ebe3) instead of pure white
 * Accents: Muted amber (#d4a574), soft cyan (#7dd3c0), muted coral (#e8927c)
 */
const NYT_COLORS = {
    // Backgrounds
    bgDeep: '#0a0a0f',
    bgMid: '#12121a',
    bgSurface: '#1a1a24',

    // Text
    textPrimary: '#f0ebe3',      // Warm off-white
    textSecondary: '#a8a29e',     // Warm gray
    textMuted: '#6b6560',         // Muted warm gray

    // Accents - muted but visible
    accentAmber: '#d4a574',       // Muted gold/amber
    accentCyan: '#7dd3c0',        // Soft teal
    accentCoral: '#e8927c',       // Soft coral/red
    accentBlue: '#7c9cc9',        // Soft blue

    // Data viz specific
    dcBlue: '#5b7aa6',            // Data centers - muted blue
    ppGreen: '#6b9e7a',           // Power plants - muted green
    gridLine: '#3d4f6f',          // Grid/transmission lines
};

export default function MicroView3D({ visualState, powerMetric }: MicroView3DProps) {
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${NYT_COLORS.bgDeep} 0%, ${NYT_COLORS.bgMid} 50%, ${NYT_COLORS.bgDeep} 100%)` }}>
            <Canvas
                orthographic
                camera={{
                    position: [0.8, 0.5, 0.8],
                    zoom: 550,
                    near: 0.001,
                    far: 5000
                }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    <ContinuousScene visualState={visualState} />
                </Suspense>
            </Canvas>

            {/* UI Overlays */}
            <PowerIndicator visualState={visualState} powerMetric={powerMetric} />
            <ScaleIndicator visualState={visualState} />
        </div>
    );
}

/**
 * Continuous 3D Scene - All elements at real relative scales
 * Progressive visibility based on zoom level
 */
function ContinuousScene({ visualState }: { visualState: string }) {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();
    const initializedRef = useRef(false);

    // Get current config and scale index for visibility
    const config = cameraConfig[visualState] || cameraConfig['chip-glow'];
    const currentIndex = scaleOrder.indexOf(visualState);

    // Visibility flags - progressive reveal as we zoom out
    const showGPU = true; // Always visible at center
    const showRack = currentIndex >= 1;
    const showPod = currentIndex >= 2;
    const showBuilding = currentIndex >= 3;
    const showCampus = currentIndex >= 4;

    // Refs for smooth interpolation
    const targetPosRef = useRef(new THREE.Vector3(...config.position));
    const targetLookRef = useRef(new THREE.Vector3(...config.target));
    const targetZoomRef = useRef(config.zoom);

    // Force camera to correct position on mount
    useLayoutEffect(() => {
        if (camera && !initializedRef.current) {
            const initConfig = cameraConfig['chip-glow'];
            camera.position.set(initConfig.position[0], initConfig.position[1], initConfig.position[2]);

            if ('zoom' in camera) {
                const orthoCamera = camera as THREE.OrthographicCamera;
                orthoCamera.zoom = initConfig.zoom;
                orthoCamera.updateProjectionMatrix();
            }

            camera.lookAt(new THREE.Vector3(initConfig.target[0], initConfig.target[1], initConfig.target[2]));
            targetPosRef.current.set(...initConfig.position);
            targetLookRef.current.set(...initConfig.target);
            targetZoomRef.current = initConfig.zoom;

            initializedRef.current = true;
        }
    }, [camera]);

    // Update targets when visualState changes
    useEffect(() => {
        if (initializedRef.current) {
            targetPosRef.current.set(...config.position);
            targetLookRef.current.set(...config.target);
            targetZoomRef.current = config.zoom;
        }
    }, [visualState, config]);

    // Continuous camera animation - slower for GPU-to-rack transition
    useFrame((state, delta) => {
        if (!camera) return;

        // Slower interpolation for chip-to-rack transition, faster for others
        const isChipToRack = currentIndex <= 1;
        const positionSpeed = isChipToRack ? 1.2 : 2.5;
        const zoomSpeed = isChipToRack ? 0.8 : 2.0;

        camera.position.lerp(targetPosRef.current, delta * positionSpeed);

        if ('zoom' in camera) {
            const orthoCamera = camera as THREE.OrthographicCamera;
            orthoCamera.zoom = THREE.MathUtils.lerp(
                orthoCamera.zoom,
                targetZoomRef.current,
                delta * zoomSpeed
            );
            orthoCamera.updateProjectionMatrix();
        }

        camera.lookAt(targetLookRef.current);

        // Subtle scene breathing
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.002;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Lighting - NYT-style: warmer, more dramatic */}
            <ambientLight intensity={0.35} color="#f0ebe3" />
            <directionalLight position={[50, 100, 50]} intensity={0.7} color="#fff8f0" />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#d4a574" />
            <pointLight position={[-20, 30, -20]} intensity={0.2} color="#7dd3c0" />

            {/* GPU Chip - always visible at origin */}
            <RubinGPU />

            {/* Server Rack - visible from rack-zoom onwards */}
            {showRack && <FadeInGroup delay={0}><VeraRubinRack /></FadeInGroup>}

            {/* Compute Pod - visible from pod-zoom onwards */}
            {showPod && <FadeInGroup delay={0.1}><ComputePod /></FadeInGroup>}

            {/* Data Center Building - visible from building-iso onwards */}
            {showBuilding && <FadeInGroup delay={0.2}><DataCenterBuilding /></FadeInGroup>}

            {/* Campus - visible at campus-grid */}
            {showCampus && <FadeInGroup delay={0.3}><CampusLayout /></FadeInGroup>}

            {/* Ground plane that extends to cover all scales */}
            <InfiniteGround currentIndex={currentIndex} />

            <Environment preset="night" />
        </group>
    );
}

/**
 * FadeInGroup - Smoothly fades in child components
 */
function FadeInGroup({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const opacityRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    useFrame((state) => {
        if (!groupRef.current) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current - delay;
        if (elapsed > 0) {
            opacityRef.current = Math.min(1, opacityRef.current + 0.02);
        }

        // Apply opacity to all mesh children
        groupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mat = child.material as THREE.MeshStandardMaterial;
                if (mat.opacity !== undefined) {
                    mat.transparent = true;
                    mat.opacity = opacityRef.current * (mat.userData.baseOpacity || 1);
                }
            }
        });
    });

    return <group ref={groupRef}>{children}</group>;
}

/**
 * NVIDIA Rubin GPU - Detailed isometric view
 * Power: ~2,300W (2.3 kW)
 */
function RubinGPU() {
    const glowRef = useRef<THREE.Mesh>(null);
    const chipRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2.5) * 0.25;
        }
        if (chipRef.current) {
            chipRef.current.position.y = 0.08 + Math.sin(state.clock.elapsedTime * 1.5) * 0.005;
        }
    });

    return (
        <group ref={chipRef} position={[0, 0.08, 0]}>
            {/* Glow base effect - muted amber */}
            <mesh ref={glowRef} position={[0, -0.02, 0]}>
                <boxGeometry args={[1.2, 0.02, 1.2]} />
                <meshBasicMaterial color="#d4a574" transparent opacity={0.4} />
            </mesh>

            {/* Package substrate - 1.0 × 1.0 units - deeper charcoal */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.0, 0.06, 1.0]} />
                <meshStandardMaterial color="#1a1a24" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Interposer - 0.8 × 0.8 units, dark PCB */}
            <mesh position={[0, 0.04, 0]}>
                <boxGeometry args={[0.8, 0.025, 0.8]} />
                <meshStandardMaterial color="#12121a" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Main GPU die - 0.4 × 0.4 units, muted amber with glow */}
            <mesh position={[0, 0.065, 0]}>
                <boxGeometry args={[0.4, 0.025, 0.4]} />
                <meshStandardMaterial
                    color="#2a2a35"
                    emissive="#d4a574"
                    emissiveIntensity={0.9}
                    metalness={0.95}
                    roughness={0.05}
                />
            </mesh>

            {/* Heat spreader frame - warm metallic */}
            <mesh position={[0, 0.08, 0]}>
                <boxGeometry args={[0.5, 0.015, 0.5]} />
                <meshStandardMaterial color="#a8a29e" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Heat spreader cutout (darker center) */}
            <mesh position={[0, 0.085, 0]}>
                <boxGeometry args={[0.38, 0.01, 0.38]} />
                <meshStandardMaterial
                    color="#0a0a0f"
                    emissive="#d4a574"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* HBM4 stacks - 6 stacks arranged around die */}
            {[
                [-0.28, 0.055, -0.15], [0.28, 0.055, -0.15],
                [-0.28, 0.055, 0.15], [0.28, 0.055, 0.15],
                [-0.28, 0.055, 0], [0.28, 0.055, 0]
            ].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}>
                    <boxGeometry args={[0.08, 0.06, 0.08]} />
                    <meshStandardMaterial
                        color="#252530"
                        metalness={0.7}
                        roughness={0.3}
                    />
                </mesh>
            ))}

            {/* BGA pins array underneath - muted gold */}
            {[...Array(64)].map((_, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                return (
                    <mesh key={i} position={[
                        -0.35 + col * 0.1,
                        -0.04,
                        -0.35 + row * 0.1
                    ]}>
                        <sphereGeometry args={[0.012, 8, 8]} />
                        <meshStandardMaterial color="#d4a574" metalness={0.95} />
                    </mesh>
                );
            })}

            {/* Circuit traces on interposer - muted amber */}
            {[...Array(12)].map((_, i) => (
                <mesh key={`trace-${i}`} position={[
                    -0.35 + (i % 4) * 0.23,
                    0.053,
                    -0.3 + Math.floor(i / 4) * 0.3
                ]}>
                    <boxGeometry args={[0.15, 0.002, 0.003]} />
                    <meshStandardMaterial color="#d4a574" metalness={0.8} emissive="#d4a574" emissiveIntensity={0.25} />
                </mesh>
            ))}
        </group>
    );
}

/**
 * Vera Rubin NVL72 Rack - Transparent front panel showing 72 GPUs
 * GPU scale: The main GPU at origin is ~1.0 units, rack GPU dies are ~0.08 units (8x smaller for visibility)
 * Front panel transparency decreases as camera zooms out
 */
function VeraRubinRack() {
    const rackRef = useRef<THREE.Group>(null);
    const frontPanelRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const rackBodyRef = useRef<THREE.MeshPhysicalMaterial>(null);

    // Animate front panel opacity - more transparent when close, darker when far
    useFrame(({ camera }) => {
        if (!rackRef.current) return;

        const rackCenter = new THREE.Vector3(0, 1.0, 0);
        const distance = camera.position.distanceTo(rackCenter);

        // Front panel: very transparent (0.95) when close, opaque (0.3) when far
        // This lets you see GPU clearly at chip-glow, but panel darkens at rack-zoom
        const normalizedDist = Math.min(1, Math.max(0, (distance - 1.0) / 5));
        const frontPanelTransmission = Math.max(0.3, 0.95 - normalizedDist * 0.65);

        // Rack body: starts invisible, becomes visible as we zoom out
        const bodyOpacity = Math.min(0.85, normalizedDist * 0.9);

        if (frontPanelRef.current) {
            frontPanelRef.current.transmission = frontPanelTransmission;
            frontPanelRef.current.opacity = 1 - frontPanelTransmission * 0.7;
        }
        if (rackBodyRef.current) {
            rackBodyRef.current.opacity = bodyOpacity;
        }
    });

    // GPU arrangement: 72 GPUs in 8 rows × 9 columns (Vera Rubin NVL72 spec)
    const gpuPositions: [number, number, number][] = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 9; col++) {
            // GPU size ~0.08 units (8% of main GPU), arranged in grid inside rack
            // Rack is 0.55 wide × 1.8 tall × 0.9 deep
            gpuPositions.push([
                -0.22 + col * 0.055,  // X: spread across width
                0.15 + row * 0.21,     // Y: spread across height
                0                       // Z: centered front-to-back
            ]);
        }
    }

    return (
        <group ref={rackRef} position={[0, 0, 0]}>
            {/* Rack frame - dark metal */}
            <mesh position={[0, 1.0, 0]}>
                <boxGeometry args={[0.6, 2.0, 1.0]} />
                <meshPhysicalMaterial
                    ref={rackBodyRef}
                    color="#1e293b"
                    metalness={0.5}
                    roughness={0.3}
                    transparent
                    opacity={0}
                />
            </mesh>

            {/* Rack frame edges - muted cyan */}
            <lineSegments position={[0, 1.0, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(0.6, 2.0, 1.0)]} />
                <lineBasicMaterial color="#7dd3c0" transparent opacity={0.5} />
            </lineSegments>

            {/* TRANSPARENT FRONT PANEL - shows GPUs through it */}
            <mesh position={[0, 1.0, 0.51]}>
                <boxGeometry args={[0.58, 1.95, 0.02]} />
                <meshPhysicalMaterial
                    ref={frontPanelRef}
                    color="#1a2535"
                    metalness={0.1}
                    roughness={0}
                    transmission={0.95}
                    thickness={0.5}
                    transparent
                    opacity={0.1}
                    ior={1.5}
                />
            </mesh>

            {/* 72 GPU dies arranged in grid - VISIBLE through front panel */}
            {gpuPositions.map((pos, i) => {
                // Highlight the center GPU to match the main GPU position
                const isMainGPU = i === 36; // Center of 72 (row 4, col 4)
                return (
                    <group key={i} position={pos}>
                        {/* GPU package */}
                        <mesh>
                            <boxGeometry args={[0.045, 0.12, 0.045]} />
                            <meshStandardMaterial
                                color="#1a1a24"
                                metalness={0.8}
                                roughness={0.2}
                            />
                        </mesh>
                        {/* GPU die with glow - muted amber for main, soft teal for others */}
                        <mesh position={[0, 0.02, 0.024]}>
                            <boxGeometry args={[0.025, 0.06, 0.002]} />
                            <meshStandardMaterial
                                color="#2a2a35"
                                emissive={isMainGPU ? "#d4a574" : "#7dd3c0"}
                                emissiveIntensity={isMainGPU ? 1.5 : 0.35}
                            />
                        </mesh>
                        {/* HBM stacks */}
                        <mesh position={[-0.015, 0.02, 0.024]}>
                            <boxGeometry args={[0.008, 0.04, 0.002]} />
                            <meshStandardMaterial color="#252530" />
                        </mesh>
                        <mesh position={[0.015, 0.02, 0.024]}>
                            <boxGeometry args={[0.008, 0.04, 0.002]} />
                            <meshStandardMaterial color="#252530" />
                        </mesh>
                    </group>
                );
            })}

            {/* Liquid cooling manifolds visible at top and bottom - muted teal/coral */}
            <mesh position={[0, 0.05, 0.3]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5]} />
                <meshStandardMaterial color="#4a8c7a" emissive="#7dd3c0" emissiveIntensity={0.15} />
            </mesh>
            <mesh position={[0, 1.95, 0.3]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5]} />
                <meshStandardMaterial color="#b86a5a" emissive="#e8927c" emissiveIntensity={0.1} />
            </mesh>

            {/* Side cooling pipes */}
            <mesh position={[-0.32, 1.0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 1.8]} />
                <meshStandardMaterial color="#4a8c7a" metalness={0.6} />
            </mesh>
            <mesh position={[0.32, 1.0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 1.8]} />
                <meshStandardMaterial color="#b86a5a" metalness={0.6} />
            </mesh>

            {/* Power sidecar */}
            <mesh position={[0.4, 0.6, 0]}>
                <boxGeometry args={[0.15, 1.0, 0.7]} />
                <meshStandardMaterial color="#1f2937" metalness={0.4} />
            </mesh>

            {/* Front panel display */}
            <mesh position={[0, 1.85, 0.53]}>
                <boxGeometry args={[0.3, 0.1, 0.01]} />
                <meshBasicMaterial color="#0a0a0f" />
            </mesh>
            <mesh position={[0, 1.85, 0.535]}>
                <boxGeometry args={[0.25, 0.06, 0.005]} />
                <meshBasicMaterial color="#7dd3c0" transparent opacity={0.85} />
            </mesh>

            {/* "72 GPUs" label */}
            <mesh position={[0, 1.72, 0.535]}>
                <boxGeometry args={[0.15, 0.03, 0.005]} />
                <meshBasicMaterial color="#d4a574" transparent opacity={0.7} />
            </mesh>

            {/* Status LEDs */}
            <LEDIndicator position={[0.25, 1.9, 0.53]} />
            <LEDIndicator position={[-0.25, 1.9, 0.53]} />
        </group>
    );
}

function LEDIndicator({ position }: { position: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null);
    const offset = useMemo(() => Math.random() * 10, []);

    useFrame((state) => {
        if (ref.current) {
            const mat = ref.current.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.sin(state.clock.elapsedTime * 4 + offset) > 0 ? 1 : 0.4;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={1} />
        </mesh>
    );
}

/**
 * Compute Pod - Row of 8 racks
 * Power: 8 × 130kW = ~1 MW (standard) or 8 × 600kW = ~5 MW (Kyber)
 */
function ComputePod() {
    // 8 racks in a row, 1.8m spacing
    const rackPositions = useMemo(() => {
        const positions: [number, number, number][] = [];
        for (let i = 0; i < 8; i++) {
            // Skip center position where main detailed rack is (positions 3 and 4)
            if (i === 3 || i === 4) continue;
            positions.push([(i - 3.5) * 1.8, 0, 0]);
        }
        return positions;
    }, []);

    return (
        <group position={[0, 0, 0]}>
            {/* Raised floor - 0.6m × 0.6m tiles */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[18, 8]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* Floor tile grid pattern */}
            <gridHelper args={[18, 30, '#334155', '#1e293b']} position={[0, -0.01, 0]} />

            {/* Simplified racks in the row */}
            {rackPositions.map((pos, i) => (
                <SimplifiedRack key={i} position={pos} />
            ))}

            {/* Overhead liquid cooling distribution */}
            <mesh position={[0, 2.8, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 16]} />
                <meshStandardMaterial color="#0891b2" metalness={0.5} />
            </mesh>

            {/* Overhead cable trays */}
            <mesh position={[0, 2.6, 1.5]}>
                <boxGeometry args={[16, 0.1, 0.6]} />
                <meshStandardMaterial color="#475569" metalness={0.4} />
            </mesh>
            <mesh position={[0, 2.6, -1.5]}>
                <boxGeometry args={[16, 0.1, 0.6]} />
                <meshStandardMaterial color="#475569" metalness={0.4} />
            </mesh>

            {/* Power distribution units between racks */}
            {[-5.4, -1.8, 1.8, 5.4].map((x, i) => (
                <mesh key={i} position={[x, 0.5, -2]}>
                    <boxGeometry args={[0.4, 1.0, 0.3]} />
                    <meshStandardMaterial color="#374151" />
                </mesh>
            ))}

            {/* CRAH units at ends */}
            <CRAHUnit position={[-10, 0, 0]} />
            <CRAHUnit position={[10, 0, 0]} />
        </group>
    );
}

function SimplifiedRack({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 1.0, 0]}>
                <boxGeometry args={[0.6, 2.0, 1.0]} />
                <meshStandardMaterial
                    color="#2a2a35"
                    emissive="#7dd3c0"
                    emissiveIntensity={0.025}
                    metalness={0.4}
                />
            </mesh>
            <lineSegments position={[0, 1.0, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(0.6, 2.0, 1.0)]} />
                <lineBasicMaterial color="#4a4a55" transparent opacity={0.4} />
            </lineSegments>
        </group>
    );
}

function CRAHUnit({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[1.8, 2.4, 1.2]} />
                <meshStandardMaterial color="#4a8c7a" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Cooling coils visible */}
            <mesh position={[0, 1.2, 0.65]}>
                <boxGeometry args={[1.4, 1.8, 0.1]} />
                <meshStandardMaterial color="#3a3a45" />
            </mesh>
        </group>
    );
}

/**
 * Data Center Building - Single Data Hall (75-150MW+)
 * Dimensions: 50m W × 100m L × 15m H
 * Power: 75-150MW+ (125 racks × 600kW = ~75 MW per hall)
 * Features rooftop cooling equipment visible from above
 */
function DataCenterBuilding() {
    return (
        <group position={[0, 0, 0]}>
            {/* Main building shell - 50m × 100m × 15m - warmer charcoal */}
            <mesh position={[0, 7.5, 0]}>
                <boxGeometry args={[50, 15, 100]} />
                <meshStandardMaterial
                    color="#3a3a45"
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* Building edge highlights for definition - softer */}
            <lineSegments position={[0, 7.5, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(50, 15, 100)]} />
                <lineBasicMaterial color="#5a5a65" transparent opacity={0.4} />
            </lineSegments>

            {/* Foundation */}
            <mesh position={[0, -0.3, 0]}>
                <boxGeometry args={[54, 0.6, 104]} />
                <meshStandardMaterial color="#1a1a24" />
            </mesh>

            {/* ROOFTOP EQUIPMENT - Cooling units in row along Z-axis (rotated 90 degrees) */}
            {[...Array(16)].map((_, i) => (
                <group key={`rooftop-cooling-${i}`} position={[0, 15, -38 + i * 5]}>
                    {/* Base sits directly on roof (y=0 relative to group = roof surface) */}
                    <mesh position={[0, 0.15, 0]}>
                        <boxGeometry args={[2.8, 0.3, 2.8]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                    {/* Cooling unit on base */}
                    <mesh position={[0, 1.15, 0]}>
                        <cylinderGeometry args={[1.0, 1.2, 1.7, 12]} />
                        <meshStandardMaterial color="#6b7280" metalness={0.3} roughness={0.7} />
                    </mesh>
                    {/* Fan shroud on top */}
                    <mesh position={[0, 2.2, 0]}>
                        <cylinderGeometry args={[0.8, 0.9, 0.5, 12]} />
                        <meshStandardMaterial color="#4b5563" metalness={0.5} />
                    </mesh>
                </group>
            ))}

            {/* Rooftop HVAC/electrical units on sides - flat boxes on roof */}
            {[...Array(6)].map((_, i) => (
                <group key={`rooftop-hvac-${i}`}>
                    <mesh position={[18, 15.4, -40 + i * 16]}>
                        <boxGeometry args={[3, 0.8, 5]} />
                        <meshStandardMaterial color="#4b5563" metalness={0.4} />
                    </mesh>
                    <mesh position={[-18, 15.4, -40 + i * 16]}>
                        <boxGeometry args={[3, 0.8, 5]} />
                        <meshStandardMaterial color="#4b5563" metalness={0.4} />
                    </mesh>
                </group>
            ))}

            {/* Large intake louvers on long sides */}
            {[...Array(8)].map((_, i) => (
                <group key={`louver-${i}`}>
                    <mesh position={[25.1, 5, -40 + i * 11]}>
                        <boxGeometry args={[0.2, 8, 8]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    {/* Louver slats with soft teal glow */}
                    {[...Array(6)].map((_, j) => (
                        <mesh key={j} position={[25.15, 2 + j * 1.2, -40 + i * 11]}>
                            <boxGeometry args={[0.1, 0.1, 7.5]} />
                            <meshStandardMaterial color="#7dd3c0" emissive="#7dd3c0" emissiveIntensity={0.1} />
                        </mesh>
                    ))}
                    {/* Mirror on back side */}
                    <mesh position={[-25.1, 5, -40 + i * 11]}>
                        <boxGeometry args={[0.2, 8, 8]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                </group>
            ))}

            {/* Loading docks on ends */}
            <mesh position={[0, 2, 52]}>
                <boxGeometry args={[20, 4, 4]} />
                <meshStandardMaterial color="#374151" />
            </mesh>

            {/* Generator yard - adjacent to building */}
            <group position={[35, 0, 0]}>
                {[...Array(4)].map((_, i) => (
                    <group key={`gen-${i}`} position={[0, 0, -30 + i * 20]}>
                        <mesh position={[0, 2, 0]}>
                            <boxGeometry args={[10, 4, 4]} />
                            <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.6} />
                        </mesh>
                        <mesh position={[4, 5, 0]}>
                            <cylinderGeometry args={[0.3, 0.4, 2]} />
                            <meshStandardMaterial color="#4b5563" />
                        </mesh>
                    </group>
                ))}
                {/* Fuel tank */}
                <mesh position={[8, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[1, 1, 20]} />
                    <meshStandardMaterial color="#1f2937" metalness={0.3} />
                </mesh>
            </group>

            {/* Secondary substation adjacent to building */}
            <SecondarySubstation position={[-35, 0, 0]} />
        </group>
    );
}

function SecondarySubstation({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <planeGeometry args={[20, 15]} />
                <meshStandardMaterial color="#475569" />
            </mesh>

            {/* Transformer */}
            <mesh position={[0, 2.5, 0]}>
                <boxGeometry args={[5, 5, 4]} />
                <meshStandardMaterial color="#374151" metalness={0.5} />
            </mesh>

            {/* Bushings */}
            {[-1.5, 0, 1.5].map((x, i) => (
                <mesh key={i} position={[x, 5.5, 0]}>
                    <cylinderGeometry args={[0.25, 0.35, 2]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
            ))}

            {/* Switchgear cabinet */}
            <mesh position={[7, 2, 0]}>
                <boxGeometry args={[3, 4, 3]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
        </group>
    );
}

/**
 * Campus Layout - 600MW Hyperscale Campus (4x 150MW buildings)
 * Features:
 * - 4 identical data center buildings in 2x2 grid
 * - Each building has rooftop cooling visible
 * - Central primary substation
 * - Perimeter generators and battery storage
 * - Transmission corridor
 */
function CampusLayout() {
    // 4 buildings in 2x2 grid (each ~150MW = 600MW total)
    const buildingPositions: [number, number, number][] = [
        [-100, 0, -80],   // NW
        [100, 0, -80],    // NE
        [-100, 0, 80],    // SW
        [100, 0, 80],     // SE
    ];

    return (
        <group position={[0, 0, 0]}>
            {/* 4 Data Center Buildings with rooftop equipment */}
            {buildingPositions.map((pos, i) => (
                <CampusBuilding key={i} position={pos} />
            ))}

            {/* Central Primary Substation (345kV/138kV) */}
            <PrimarySubstation position={[0, 0, 0]} />

            {/* Battery Storage (BESS) near substation */}
            <BatteryStorage position={[0, 0, 180]} />

            {/* Transmission line towers corridor leading away */}
            {[...Array(10)].map((_, i) => (
                <TransmissionTower key={i} position={[-220 - i * 35, 0, 0]} />
            ))}

            {/* Main access roads - grid pattern */}
            {/* Horizontal roads */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[350, 12]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -80]}>
                <planeGeometry args={[350, 10]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 80]}>
                <planeGeometry args={[350, 10]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
            {/* Vertical roads */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-100, 0.02, 0]}>
                <planeGeometry args={[10, 220]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[100, 0.02, 0]}>
                <planeGeometry args={[10, 220]} />
                <meshStandardMaterial color="#374151" />
            </mesh>

            {/* Perimeter security fence - rectangular */}
            <group>
                {/* North fence */}
                <mesh position={[0, 1.5, -160]}>
                    <boxGeometry args={[380, 3, 0.5]} />
                    <meshStandardMaterial color="#475569" transparent opacity={0.3} />
                </mesh>
                {/* South fence */}
                <mesh position={[0, 1.5, 220]}>
                    <boxGeometry args={[380, 3, 0.5]} />
                    <meshStandardMaterial color="#475569" transparent opacity={0.3} />
                </mesh>
                {/* East fence */}
                <mesh position={[190, 1.5, 30]}>
                    <boxGeometry args={[0.5, 3, 380]} />
                    <meshStandardMaterial color="#475569" transparent opacity={0.3} />
                </mesh>
                {/* West fence */}
                <mesh position={[-190, 1.5, 30]}>
                    <boxGeometry args={[0.5, 3, 380]} />
                    <meshStandardMaterial color="#475569" transparent opacity={0.3} />
                </mesh>
            </group>

            {/* Admin/security building at main entrance - small, clearly not a data center */}
            <mesh position={[0, 2.5, 200]}>
                <boxGeometry args={[18, 5, 10]} />
                <meshStandardMaterial color="#9ca3af" metalness={0.2} />
            </mesh>

            {/* Guard house - small booth */}
            <mesh position={[0, 1.5, 212]}>
                <boxGeometry args={[4, 3, 3]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
        </group>
    );
}

/**
 * Campus Building - Individual data center building for campus (150MW each)
 * Smaller version with rooftop cooling equipment
 */
function CampusBuilding({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Main building shell - 60m × 80m × 15m */}
            <mesh position={[0, 7.5, 0]}>
                <boxGeometry args={[60, 15, 80]} />
                <meshStandardMaterial
                    color="#475569"
                    metalness={0.4}
                    roughness={0.6}
                />
            </mesh>

            {/* Building edge wireframe */}
            <lineSegments position={[0, 7.5, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(60, 15, 80)]} />
                <lineBasicMaterial color="#64748b" transparent opacity={0.4} />
            </lineSegments>

            {/* Foundation */}
            <mesh position={[0, -0.3, 0]}>
                <boxGeometry args={[64, 0.6, 84]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>

            {/* ROOFTOP COOLING - 10 smaller cooling units in row along Z-axis (rotated 90 degrees) */}
            {[...Array(10)].map((_, i) => (
                <group key={`cooling-${i}`} position={[0, 15, -30 + i * 6.5]}>
                    {/* Base sits on roof */}
                    <mesh position={[0, 0.12, 0]}>
                        <boxGeometry args={[2.4, 0.25, 2.4]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                    {/* Cooling unit on base */}
                    <mesh position={[0, 1.0, 0]}>
                        <cylinderGeometry args={[0.9, 1.1, 1.5, 12]} />
                        <meshStandardMaterial color="#6b7280" metalness={0.3} roughness={0.7} />
                    </mesh>
                    {/* Fan shroud */}
                    <mesh position={[0, 1.9, 0]}>
                        <cylinderGeometry args={[0.7, 0.8, 0.4, 12]} />
                        <meshStandardMaterial color="#4b5563" metalness={0.5} />
                    </mesh>
                </group>
            ))}

            {/* HVAC units on roof sides - flat boxes directly on roof */}
            {[...Array(4)].map((_, i) => (
                <group key={`hvac-${i}`}>
                    <mesh position={[23, 15.35, -30 + i * 20]}>
                        <boxGeometry args={[3, 0.7, 6]} />
                        <meshStandardMaterial color="#4b5563" metalness={0.4} />
                    </mesh>
                    <mesh position={[-23, 15.35, -30 + i * 20]}>
                        <boxGeometry args={[3, 0.7, 6]} />
                        <meshStandardMaterial color="#4b5563" metalness={0.4} />
                    </mesh>
                </group>
            ))}

            {/* Intake louvers with cyan glow */}
            {[...Array(6)].map((_, i) => (
                <group key={`louver-${i}`}>
                    <mesh position={[30.1, 5, -32 + i * 13]}>
                        <boxGeometry args={[0.2, 6, 8]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    {[...Array(4)].map((_, j) => (
                        <mesh key={j} position={[30.15, 3 + j * 1.3, -32 + i * 13]}>
                            <boxGeometry args={[0.1, 0.08, 7.5]} />
                            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.12} />
                        </mesh>
                    ))}
                </group>
            ))}

            {/* Adjacent generator units (3 per building) */}
            <group position={[40, 0, 0]}>
                {[-20, 0, 20].map((z, i) => (
                    <group key={`gen-${i}`} position={[0, 0, z]}>
                        <mesh position={[0, 2, 0]}>
                            <boxGeometry args={[12, 4, 5]} />
                            <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.6} />
                        </mesh>
                        <mesh position={[5, 5, 0]}>
                            <cylinderGeometry args={[0.3, 0.4, 2]} />
                            <meshStandardMaterial color="#4b5563" />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* Transformer pad */}
            <group position={[-40, 0, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                    <planeGeometry args={[15, 20]} />
                    <meshStandardMaterial color="#4b5563" />
                </mesh>
                <mesh position={[0, 2.5, 0]}>
                    <boxGeometry args={[6, 5, 5]} />
                    <meshStandardMaterial color="#374151" metalness={0.5} />
                </mesh>
                {[-1.5, 0, 1.5].map((x, i) => (
                    <mesh key={i} position={[x, 5.5, 0]}>
                        <cylinderGeometry args={[0.25, 0.35, 1.5]} />
                        <meshStandardMaterial color="#94a3b8" />
                    </mesh>
                ))}
            </group>
        </group>
    );
}



/**
 * Primary Substation - 345kV/138kV (80m × 60m)
 * Designed to be clearly a substation, NOT a data center building
 */
function PrimarySubstation({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Substation pad - gravel/concrete */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <planeGeometry args={[70, 50]} />
                <meshStandardMaterial color="#6b7280" />
            </mesh>

            {/* Small control shed (NOT a building - clearly different from data centers) */}
            <mesh position={[28, 2.5, 18]}>
                <boxGeometry args={[8, 5, 6]} />
                <meshStandardMaterial color="#9ca3af" metalness={0.2} />
            </mesh>

            {/* Main power transformers (6 units) - larger and more prominent */}
            {[[-18, 0, -8], [0, 0, -8], [18, 0, -8], [-18, 0, 8], [0, 0, 8], [18, 0, 8]].map((pos, i) => (
                <group key={i} position={pos as [number, number, number]}>
                    {/* Transformer body */}
                    <mesh position={[0, 3.5, 0]}>
                        <boxGeometry args={[7, 7, 5]} />
                        <meshStandardMaterial color="#374151" metalness={0.6} />
                    </mesh>
                    {/* Radiator fins */}
                    <mesh position={[0, 3.5, 3]}>
                        <boxGeometry args={[6, 5, 1]} />
                        <meshStandardMaterial color="#4b5563" />
                    </mesh>
                    {/* HV bushings - taller and more visible */}
                    {[-2, 0, 2].map((x, j) => (
                        <mesh key={j} position={[x, 8, 0]}>
                            <cylinderGeometry args={[0.35, 0.5, 3]} />
                            <meshStandardMaterial color="#94a3b8" />
                        </mesh>
                    ))}
                </group>
            ))}

            {/* Bus bars at 14m height - more visible */}
            <mesh position={[0, 14, 0]}>
                <boxGeometry args={[60, 0.3, 0.3]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.8} emissive="#f59e0b" emissiveIntensity={0.15} />
            </mesh>
            {/* Cross bus bar */}
            <mesh position={[0, 14, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[40, 0.3, 0.3]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.8} emissive="#f59e0b" emissiveIntensity={0.15} />
            </mesh>

            {/* Steel lattice towers - taller */}
            {[-25, 0, 25].map((x, i) => (
                <mesh key={i} position={[x, 10, -20]}>
                    <cylinderGeometry args={[0.5, 1.0, 20, 4]} />
                    <meshStandardMaterial color="#64748b" metalness={0.7} />
                </mesh>
            ))}

            {/* Additional lattice towers on other side */}
            {[-25, 0, 25].map((x, i) => (
                <mesh key={`back-${i}`} position={[x, 10, 20]}>
                    <cylinderGeometry args={[0.5, 1.0, 20, 4]} />
                    <meshStandardMaterial color="#64748b" metalness={0.7} />
                </mesh>
            ))}

            {/* Fence around substation - chain link style */}
            <group>
                {/* North fence */}
                <mesh position={[0, 1.5, -26]}>
                    <boxGeometry args={[72, 3, 0.2]} />
                    <meshStandardMaterial color="#64748b" transparent opacity={0.4} />
                </mesh>
                {/* South fence */}
                <mesh position={[0, 1.5, 26]}>
                    <boxGeometry args={[72, 3, 0.2]} />
                    <meshStandardMaterial color="#64748b" transparent opacity={0.4} />
                </mesh>
                {/* East fence */}
                <mesh position={[36, 1.5, 0]}>
                    <boxGeometry args={[0.2, 3, 52]} />
                    <meshStandardMaterial color="#64748b" transparent opacity={0.4} />
                </mesh>
                {/* West fence */}
                <mesh position={[-36, 1.5, 0]}>
                    <boxGeometry args={[0.2, 3, 52]} />
                    <meshStandardMaterial color="#64748b" transparent opacity={0.4} />
                </mesh>
            </group>
        </group>
    );
}


/**
 * Battery Energy Storage System (BESS) - Low-profile container units
 * Designed to NOT look like a building - just rows of small containers
 */
function BatteryStorage({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Gravel pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[35, 20]} />
                <meshStandardMaterial color="#6b7280" />
            </mesh>

            {/* Battery containers (12 units in 2×6 grid - smaller, low profile) */}
            {[...Array(12)].map((_, i) => {
                const row = Math.floor(i / 6);
                const col = i % 6;
                return (
                    <group key={i} position={[-13 + col * 5, 0, -5 + row * 5]}>
                        <mesh position={[0, 1.25, 0]}>
                            <boxGeometry args={[4, 2.5, 2]} />
                            <meshStandardMaterial color="#1f2937" metalness={0.5} />
                        </mesh>
                        {/* Status indicator */}
                        <mesh position={[1.5, 2.2, 1.05]}>
                            <boxGeometry args={[0.2, 0.2, 0.05]} />
                            <meshBasicMaterial color="#22c55e" />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}


function TransmissionTower({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Tower structure - 35m tall */}
            <mesh position={[0, 17.5, 0]}>
                <cylinderGeometry args={[0.5, 1.5, 35, 4]} />
                <meshStandardMaterial color="#64748b" metalness={0.7} />
            </mesh>
            {/* Cross arms */}
            <mesh position={[0, 32, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 18]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            <mesh position={[0, 28, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.15, 0.15, 12]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            {/* Insulators */}
            {[-6, -3, 0, 3, 6].map((x, i) => (
                <mesh key={i} position={[x, 31, 0]}>
                    <cylinderGeometry args={[0.1, 0.2, 2]} />
                    <meshStandardMaterial color="#374151" />
                </mesh>
            ))}
        </group>
    );
}

/**
 * Infinite Ground - Expands smoothly based on current view
 */
function InfiniteGround({ currentIndex }: { currentIndex: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    const sizes = [3, 20, 40, 150, 500];
    const gridDivisions = [6, 40, 80, 150, 250];

    const targetSize = sizes[Math.min(currentIndex, sizes.length - 1)];
    const divisions = gridDivisions[Math.min(currentIndex, gridDivisions.length - 1)];

    useFrame((_, delta) => {
        if (meshRef.current) {
            const currentScale = meshRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetSize, delta * 1.5);
            meshRef.current.scale.set(newScale, 1, newScale);
        }
    });

    return (
        <group>
            {/* Dark ground plane - deep charcoal */}
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} scale={[3, 1, 3]}>
                <planeGeometry args={[2, 2]} />
                <meshStandardMaterial color="#0a0a0f" />
            </mesh>

            {/* Grid overlay - muted warm tones */}
            <gridHelper
                args={[targetSize * 2, divisions, '#252530', '#0a0a0f']}
                position={[0, -0.09, 0]}
            />
        </group>
    );
}

/**
 * Power Indicator UI - Updated for NVIDIA Rubin Ultra Kyber specs (600kW racks)
 * NYT-style: warm off-white text, muted accent colors
 */
function PowerIndicator({ visualState, powerMetric }: {
    visualState: string;
    powerMetric?: { value: string; unit: string; comparison: string };
}) {
    // Based on Rubin Ultra NVL576 Kyber (600kW per rack, 2027)
    // Muted NYT-style colors
    const data: Record<string, { label: string; value: string; unit: string; comparison: string; color: string }> = {
        'chip-glow': { label: 'NVIDIA Rubin GPU', value: '2.3', unit: 'kW', comparison: '≈ 2 homes', color: '#d4a574' },
        'rack-zoom': { label: 'Rubin Ultra Kyber Rack', value: '600', unit: 'kW', comparison: '≈ 500 homes', color: '#7dd3c0' },
        'pod-zoom': { label: 'Compute Pod (8 racks)', value: '4.8', unit: 'MW', comparison: '≈ 4,000 homes', color: '#7dd3c0' },
        'building-iso': { label: 'Data Center Facility', value: '75-150', unit: 'MW', comparison: '≈ 60,000-125,000 homes', color: '#e8927c' },
        'campus-grid': { label: 'Hyperscale Campus (4 buildings)', value: '600', unit: 'MW', comparison: '≈ small nuclear plant', color: '#e8927c' },
    };

    const d = data[visualState];
    if (!d) return null;

    return (
        <motion.div
            key={visualState}
            className="absolute bottom-8 left-8 rounded-lg px-5 py-4 border z-10"
            style={{
                backgroundColor: 'rgba(10, 10, 15, 0.9)',
                borderColor: 'rgba(107, 101, 96, 0.3)'
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#a8a29e' }}>{d.label}</div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono" style={{ color: d.color }}>
                    {powerMetric?.value || d.value}
                </span>
                <span className="text-lg font-mono" style={{ color: '#f0ebe3' }}>{powerMetric?.unit || d.unit}</span>
            </div>
            <div className="text-sm mt-1" style={{ color: '#a8a29e' }}>{powerMetric?.comparison || d.comparison}</div>
        </motion.div>
    );
}

/**
 * Scale Indicator UI - NYT-style muted colors
 */
function ScaleIndicator({ visualState }: { visualState: string }) {
    const scales: Record<string, { level: number; label: string }> = {
        'chip-glow': { level: 1, label: 'GPU' },
        'rack-zoom': { level: 2, label: 'Rack' },
        'pod-zoom': { level: 3, label: 'Pod' },
        'building-iso': { level: 4, label: 'Hall' },
        'campus-grid': { level: 5, label: 'Campus' },
    };

    const current = scales[visualState] || scales['chip-glow'];

    return (
        <motion.div
            className="absolute top-8 right-8 rounded-lg px-4 py-3 border z-10"
            style={{
                backgroundColor: 'rgba(10, 10, 15, 0.85)',
                borderColor: 'rgba(107, 101, 96, 0.3)'
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#a8a29e' }}>Scale</div>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                    <motion.div
                        key={level}
                        className="w-2 rounded-sm"
                        style={{ height: 8 + level * 4 }}
                        animate={{
                            backgroundColor: level <= current.level ? '#7dd3c0' : '#3a3a45',
                            opacity: level <= current.level ? 1 : 0.4,
                        }}
                        transition={{ duration: 0.3 }}
                    />
                ))}
            </div>
            <div className="text-sm font-medium mt-2" style={{ color: '#f0ebe3' }}>{current.label}</div>
        </motion.div>
    );
}
