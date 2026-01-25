'use client';

import { useRef, useMemo, Suspense } from 'react';
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

// Camera configurations for seamless continuous zoom
// All elements exist in one 3D space - camera just moves smoothly
// GPU zoom increased for true-to-scale feel, smoother transitions between levels
const cameraConfig: Record<string, {
    position: [number, number, number];
    target: [number, number, number];
    zoom: number;
}> = {
    'chip-glow': { position: [1.2, 0.8, 1.2], target: [0, 0.03, 0], zoom: 480 },
    'rack-zoom': { position: [3, 2.5, 3], target: [0, 1.0, 0], zoom: 110 },
    'pod-zoom': { position: [10, 7, 10], target: [0, 1.2, 0], zoom: 35 },
    'building-iso': { position: [50, 38, 50], target: [0, 6, 0], zoom: 7 },
    'campus-grid': { position: [180, 120, 180], target: [0, 10, 0], zoom: 2.2 },
};

const scaleOrder = ['chip-glow', 'rack-zoom', 'pod-zoom', 'building-iso', 'campus-grid'];

/**
 * MicroView3D - Continuous seamless 3D zoom from GPU to campus
 * All elements exist in one unified 3D space at their real relative scales
 */
export default function MicroView3D({ visualState, powerMetric }: MicroView3DProps) {
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
            <Canvas
                orthographic
                camera={{
                    position: [1.2, 0.8, 1.2],
                    zoom: 480,
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
 * Camera smoothly interpolates position and zoom
 */
function ContinuousScene({ visualState }: { visualState: string }) {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    const targetPosRef = useRef(new THREE.Vector3(3, 2, 3));
    const targetLookRef = useRef(new THREE.Vector3(0, 0.05, 0));
    const targetZoomRef = useRef(280);

    const currentIndex = scaleOrder.indexOf(visualState);
    const config = cameraConfig[visualState] || cameraConfig['chip-glow'];

    // Update targets when visualState changes
    useMemo(() => {
        targetPosRef.current.set(...config.position);
        targetLookRef.current.set(...config.target);
        targetZoomRef.current = config.zoom;
    }, [config]);

    // Smooth continuous camera animation
    useFrame((state, delta) => {
        if (!camera) return;

        // Slower interpolation for more seamless transitions between scales
        const speed = 1.0;

        camera.position.lerp(targetPosRef.current, delta * speed);

        // Smooth zoom
        if ('zoom' in camera) {
            const orthoCamera = camera as THREE.OrthographicCamera;
            orthoCamera.zoom = THREE.MathUtils.lerp(
                orthoCamera.zoom,
                targetZoomRef.current,
                delta * speed
            );
            orthoCamera.updateProjectionMatrix();
        }

        // Look at target
        camera.lookAt(targetLookRef.current);

        // Very subtle scene breathing
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.003;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Lighting - consistent across all scales */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[50, 100, 50]} intensity={0.8} />
            <pointLight position={[0, 5, 0]} intensity={0.3} color="#06b6d4" />

            {/*
              All infrastructure exists simultaneously at real relative scales:
              - GPU chip: ~0.7 units wide
              - Server rack: ~0.9 units wide, ~2.4 units tall
              - Compute pod: ~10 units across (with multiple racks)
              - Building: ~35 units wide, ~16 units tall
              - Campus: ~300 units across (multiple buildings)
            */}

            {/* GPU Chip - at origin, tiny */}
            <GPUChip />

            {/* Server Rack - surrounds the GPU chip */}
            <ServerRack />

            {/* Compute Pod - grid of racks around the central rack */}
            <ComputePod />

            {/* Data Center Building - contains the pod */}
            <DataCenterBuilding />

            {/* Campus - multiple buildings and infrastructure */}
            <CampusLayout />

            {/* Ground plane that extends to cover all scales */}
            <InfiniteGround currentIndex={currentIndex} />

            <Environment preset="night" />
        </group>
    );
}

/**
 * GPU Chip - Tiny but detailed, always visible at center
 */
function GPUChip() {
    const glowRef = useRef<THREE.Mesh>(null);
    const chipRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
        }
        if (chipRef.current) {
            chipRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.005;
        }
    });

    return (
        <group ref={chipRef} position={[0, 0.03, 0]}>
            {/* Glow base */}
            <mesh ref={glowRef} position={[0, -0.015, 0]}>
                <boxGeometry args={[0.8, 0.01, 0.8]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
            </mesh>

            {/* Chip substrate */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.65, 0.05, 0.65]} />
                <meshStandardMaterial color="#0a1628" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Silicon die (golden) */}
            <mesh position={[0, 0.035, 0]}>
                <boxGeometry args={[0.3, 0.02, 0.3]} />
                <meshStandardMaterial
                    color="#1a1a2e"
                    emissive="#f59e0b"
                    emissiveIntensity={0.6}
                    metalness={0.95}
                    roughness={0.05}
                />
            </mesh>

            {/* HBM stacks */}
            {[[-0.18, 0.04, -0.18], [0.18, 0.04, -0.18], [-0.18, 0.04, 0.18], [0.18, 0.04, 0.18]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}>
                    <boxGeometry args={[0.07, 0.05, 0.07]} />
                    <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
                </mesh>
            ))}

            {/* Package pins */}
            {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(angle) * 0.38, -0.03, Math.sin(angle) * 0.38]}>
                        <cylinderGeometry args={[0.006, 0.006, 0.025]} />
                        <meshStandardMaterial color="#fbbf24" metalness={0.95} />
                    </mesh>
                );
            })}
        </group>
    );
}

/**
 * Server Rack - Contains the GPU, positioned around it
 */
function ServerRack() {
    return (
        <group position={[0, 0, 0]}>
            {/* Rack frame */}
            <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[0.85, 2.4, 0.65]} />
                <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.4} transparent opacity={0.95} />
            </mesh>

            {/* Server trays with GPU modules */}
            {[...Array(8)].map((_, i) => (
                <group key={i} position={[0, 0.12 + i * 0.28, 0.12]}>
                    <mesh>
                        <boxGeometry args={[0.72, 0.2, 0.38]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.5} />
                    </mesh>
                    {/* GPU modules in each tray */}
                    {[...Array(6)].map((_, j) => (
                        <mesh key={j} position={[-0.24 + j * 0.1, 0, 0.08]}>
                            <boxGeometry args={[0.055, 0.14, 0.1]} />
                            <meshStandardMaterial
                                color="#1e3a5f"
                                emissive="#06b6d4"
                                emissiveIntensity={0.15}
                            />
                        </mesh>
                    ))}
                    {/* Status LED */}
                    <LEDIndicator position={[0.3, 0.04, 0.2]} />
                </group>
            ))}

            {/* Cooling pipes */}
            <mesh position={[-0.48, 1.2, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 2.4]} />
                <meshStandardMaterial color="#0891b2" emissive="#06b6d4" emissiveIntensity={0.15} />
            </mesh>
            <mesh position={[0.48, 1.2, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 2.4]} />
                <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={0.1} />
            </mesh>
        </group>
    );
}

function LEDIndicator({ position }: { position: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null);
    const offset = useMemo(() => Math.random() * 10, []);

    useFrame((state) => {
        if (ref.current) {
            const mat = ref.current.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.sin(state.clock.elapsedTime * 6 + offset) > 0 ? 1 : 0.3;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={1} />
        </mesh>
    );
}

/**
 * Compute Pod - 4x4 grid of racks
 */
function ComputePod() {
    const rackPositions = useMemo(() => {
        const positions: [number, number, number][] = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                // Skip center position where main detailed rack is
                if (row === 1 && col === 1) continue;
                if (row === 1 && col === 2) continue;
                if (row === 2 && col === 1) continue;
                if (row === 2 && col === 2) continue;
                positions.push([col * 1.6 - 2.4, 0, row * 1.2 - 1.8]);
            }
        }
        return positions;
    }, []);

    return (
        <group position={[0, 0, 0]}>
            {/* Raised floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[9, 7]} />
                <meshStandardMaterial color="#0a0a12" />
            </mesh>

            {/* Simplified racks around the detailed center rack */}
            {rackPositions.map((pos, i) => (
                <group key={i} position={pos}>
                    <mesh position={[0, 1.2, 0]}>
                        <boxGeometry args={[0.65, 2.4, 0.5]} />
                        <meshStandardMaterial
                            color="#1f2937"
                            emissive="#06b6d4"
                            emissiveIntensity={0.03}
                        />
                    </mesh>
                </group>
            ))}

            {/* CRAH cooling units */}
            <CRAHUnit position={[-5.5, 0, 0]} />
            <CRAHUnit position={[5.5, 0, 0]} />
        </group>
    );
}

function CRAHUnit({ position }: { position: [number, number, number] }) {
    const fanRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (fanRef.current) {
            fanRef.current.rotation.z = state.clock.elapsedTime * 5;
        }
    });

    return (
        <group position={position}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[1.4, 2, 0.9]} />
                <meshStandardMaterial color="#0891b2" metalness={0.6} />
            </mesh>
            <mesh ref={fanRef} position={[0, 1.5, 0.46]}>
                <circleGeometry args={[0.32, 6]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} />
            </mesh>
        </group>
    );
}

/**
 * Data Center Building - Contains the compute pod
 * Enhanced with better colors for visibility against dark background
 */
function DataCenterBuilding() {
    return (
        <group position={[0, 0, 0]}>
            {/* Main building shell - lighter color with emissive for visibility */}
            <mesh position={[0, 8, 0]}>
                <boxGeometry args={[32, 16, 20]} />
                <meshStandardMaterial
                    color="#3d6a8f"
                    emissive="#1a3a5a"
                    emissiveIntensity={0.15}
                    metalness={0.3}
                    roughness={0.5}
                    transparent
                    opacity={0.92}
                />
            </mesh>

            {/* Building edge highlights for definition */}
            <lineSegments position={[0, 8, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(32, 16, 20)]} />
                <lineBasicMaterial color="#5a9ac9" transparent opacity={0.4} />
            </lineSegments>

            {/* Foundation */}
            <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[36, 0.4, 24]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>

            {/* Window grid */}
            {[...Array(4)].map((_, row) =>
                [...Array(9)].map((_, col) => (
                    <WindowPanel
                        key={`w-${row}-${col}`}
                        position={[-12 + col * 3, 2 + row * 3.5, 10.1]}
                    />
                ))
            )}

            {/* Rooftop equipment - HVAC units */}
            {[...Array(5)].map((_, i) => (
                <mesh key={i} position={[-8 + i * 4, 16.3, -3]}>
                    <boxGeometry args={[1.8, 1, 1.8]} />
                    <meshStandardMaterial color="#4a5568" metalness={0.5} />
                </mesh>
            ))}

            {/* Substation next to building */}
            <Substation position={[-24, 0, 0]} scale={1} />
        </group>
    );
}

function WindowPanel({ position }: { position: [number, number, number] }) {
    const ref = useRef<THREE.Mesh>(null);
    const offset = useMemo(() => Math.random() * 100, []);

    useFrame((state) => {
        if (ref.current) {
            const mat = ref.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 1.2 + offset) * 0.1;
        }
    });

    return (
        <mesh ref={ref} position={position}>
            <planeGeometry args={[2, 2.8]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} />
        </mesh>
    );
}

function Substation({ position, scale }: { position: [number, number, number]; scale: number }) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 2, 0]}>
                <boxGeometry args={[6, 4, 4]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
            {[...Array(3)].map((_, i) => (
                <mesh key={i} position={[-1.5 + i * 1.5, 0.7, 2.5]}>
                    <cylinderGeometry args={[0.4, 0.4, 1.4]} />
                    <meshStandardMaterial color="#4b5563" />
                </mesh>
            ))}
        </group>
    );
}

/**
 * Campus Layout - Multiple buildings and comprehensive infrastructure
 * Includes substations, backup generators, cooling towers, battery storage
 */
function CampusLayout() {
    const buildings = [
        { pos: [-55, 0, -40], scale: 0.85 },
        { pos: [55, 0, -40], scale: 0.85 },
        { pos: [-55, 0, 40], scale: 0.8 },
        { pos: [55, 0, 40], scale: 0.8 },
        { pos: [-100, 0, 0], scale: 0.7 },
        { pos: [100, 0, 0], scale: 0.7 },
    ];

    return (
        <group position={[0, 0, 0]}>
            {/* Additional data center buildings */}
            {buildings.map((b, i) => (
                <SimplifiedBuilding key={i} position={b.pos as [number, number, number]} scale={b.scale} />
            ))}

            {/* === PRIMARY SUBSTATION (345kV/138kV) === */}
            <PrimarySubstation position={[-130, 0, -30]} />

            {/* === SECONDARY SUBSTATIONS (138kV/13.8kV) near buildings === */}
            <SecondarySubstation position={[-75, 0, -40]} />
            <SecondarySubstation position={[75, 0, -40]} />
            <SecondarySubstation position={[-75, 0, 40]} />

            {/* === BACKUP GENERATOR COMPLEX === */}
            <GeneratorComplex position={[120, 0, -50]} />

            {/* === COOLING TOWER FARM === */}
            <CoolingTowerFarm position={[0, 0, -80]} />

            {/* === BATTERY ENERGY STORAGE (BESS) === */}
            <BatteryStorage position={[-90, 0, 70]} />

            {/* Transmission line towers - extended corridor */}
            {[...Array(12)].map((_, i) => (
                <TransmissionTower key={i} position={[-160 - i * 22, 0, -30 + Math.sin(i * 0.6) * 15]} />
            ))}

            {/* Roads/paths connecting buildings */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[320, 5]} />
                <meshStandardMaterial color="#2d3748" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.01, 0]}>
                <planeGeometry args={[180, 5]} />
                <meshStandardMaterial color="#2d3748" />
            </mesh>
            {/* Perimeter road */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -75]}>
                <planeGeometry args={[280, 4]} />
                <meshStandardMaterial color="#2d3748" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 75]}>
                <planeGeometry args={[280, 4]} />
                <meshStandardMaterial color="#2d3748" />
            </mesh>

            {/* Security fence perimeter (visual only) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[140, 145, 4]} />
                <meshBasicMaterial color="#4a5568" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

/**
 * Primary Substation - 345kV/138kV transformer yard
 */
function PrimarySubstation({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Substation pad/foundation */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <planeGeometry args={[50, 35]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>

            {/* Control building */}
            <mesh position={[18, 3, 10]}>
                <boxGeometry args={[8, 6, 8]} />
                <meshStandardMaterial color="#4a5568" metalness={0.3} />
            </mesh>

            {/* Main power transformers (345kV/138kV) */}
            {[[-12, 0, 0], [0, 0, 0], [12, 0, 0]].map((pos, i) => (
                <group key={i} position={pos as [number, number, number]}>
                    {/* Transformer body */}
                    <mesh position={[0, 3, 0]}>
                        <boxGeometry args={[6, 6, 5]} />
                        <meshStandardMaterial color="#374151" metalness={0.6} />
                    </mesh>
                    {/* Radiator fins */}
                    <mesh position={[0, 3, 3.5]}>
                        <boxGeometry args={[5, 4, 1]} />
                        <meshStandardMaterial color="#4b5563" />
                    </mesh>
                    {/* HV bushings */}
                    {[-1.5, 0, 1.5].map((x, j) => (
                        <mesh key={j} position={[x, 7, 0]}>
                            <cylinderGeometry args={[0.3, 0.4, 3]} />
                            <meshStandardMaterial color="#94a3b8" />
                        </mesh>
                    ))}
                </group>
            ))}

            {/* Bus bars */}
            <mesh position={[0, 10, 0]}>
                <boxGeometry args={[45, 0.15, 0.15]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.8} emissive="#f59e0b" emissiveIntensity={0.1} />
            </mesh>

            {/* Disconnect switches */}
            {[-18, -6, 6, 18].map((x, i) => (
                <mesh key={i} position={[x, 8, 5]}>
                    <cylinderGeometry args={[0.15, 0.15, 4]} />
                    <meshStandardMaterial color="#64748b" />
                </mesh>
            ))}

            {/* Insulators on steel structures */}
            {[-20, 0, 20].map((x, i) => (
                <group key={i} position={[x, 0, -8]}>
                    <mesh position={[0, 6, 0]}>
                        <cylinderGeometry args={[0.3, 0.6, 12, 4]} />
                        <meshStandardMaterial color="#64748b" metalness={0.7} />
                    </mesh>
                    <mesh position={[0, 12, 0]}>
                        <cylinderGeometry args={[0.2, 0.3, 2]} />
                        <meshStandardMaterial color="#374151" />
                    </mesh>
                </group>
            ))}

            {/* Grounding grid markers */}
            {[[-22, 0.1, -15], [22, 0.1, -15], [-22, 0.1, 15], [22, 0.1, 15]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
            ))}
        </group>
    );
}

/**
 * Secondary Substation - 138kV/13.8kV step-down
 */
function SecondarySubstation({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <planeGeometry args={[14, 10]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>

            {/* Transformer */}
            <mesh position={[0, 2, 0]}>
                <boxGeometry args={[4, 4, 3]} />
                <meshStandardMaterial color="#374151" metalness={0.5} />
            </mesh>

            {/* Bushings */}
            {[-1, 1].map((x, i) => (
                <mesh key={i} position={[x, 4.5, 0]}>
                    <cylinderGeometry args={[0.2, 0.25, 1.5]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
            ))}

            {/* Small control cabinet */}
            <mesh position={[5, 1.5, 0]}>
                <boxGeometry args={[2, 3, 2]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
        </group>
    );
}

/**
 * Generator Complex - Backup diesel/gas generators with fuel storage
 */
function GeneratorComplex({ position }: { position: [number, number, number] }) {
    const genRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (genRef.current) {
            // Subtle vibration effect
            genRef.current.position.y = Math.sin(state.clock.elapsedTime * 8) * 0.02;
        }
    });

    return (
        <group position={position}>
            {/* Generator pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <planeGeometry args={[45, 25]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>

            {/* Generator units (6 units) */}
            <group ref={genRef}>
                {[[-15, 0, -6], [0, 0, -6], [15, 0, -6], [-15, 0, 6], [0, 0, 6], [15, 0, 6]].map((pos, i) => (
                    <group key={i} position={pos as [number, number, number]}>
                        {/* Generator housing */}
                        <mesh position={[0, 2.5, 0]}>
                            <boxGeometry args={[8, 5, 4]} />
                            <meshStandardMaterial color="#374151" metalness={0.4} />
                        </mesh>
                        {/* Exhaust stack */}
                        <mesh position={[3, 6, 0]}>
                            <cylinderGeometry args={[0.3, 0.4, 3]} />
                            <meshStandardMaterial color="#4b5563" />
                        </mesh>
                        {/* Status light */}
                        <mesh position={[-3.5, 4, 2.1]}>
                            <sphereGeometry args={[0.15, 8, 8]} />
                            <meshBasicMaterial color="#22c55e" />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* Fuel storage tanks */}
            <group position={[25, 0, 0]}>
                {[0, 8].map((z, i) => (
                    <mesh key={i} position={[0, 3, z - 4]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[2.5, 2.5, 12]} />
                        <meshStandardMaterial color="#1f2937" metalness={0.3} />
                    </mesh>
                ))}
                {/* Tank supports */}
                {[-4, 4].map((x, i) => (
                    <mesh key={i} position={[x, 1, 0]}>
                        <boxGeometry args={[1, 2, 14]} />
                        <meshStandardMaterial color="#4b5563" />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/**
 * Cooling Tower Farm - Evaporative cooling structures
 */
function CoolingTowerFarm({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Cooling towers (4 units) */}
            {[[-20, 0, 0], [-7, 0, 0], [7, 0, 0], [20, 0, 0]].map((pos, i) => (
                <CoolingTower key={i} position={pos as [number, number, number]} />
            ))}

            {/* Cooling water pipes */}
            <mesh position={[0, 1, 10]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.8, 0.8, 50]} />
                <meshStandardMaterial color="#0891b2" metalness={0.4} />
            </mesh>
        </group>
    );
}

/**
 * Single Cooling Tower
 */
function CoolingTower({ position }: { position: [number, number, number] }) {
    const steamRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (steamRef.current) {
            const mat = steamRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            steamRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
        }
    });

    return (
        <group position={position}>
            {/* Tower structure */}
            <mesh position={[0, 6, 0]}>
                <cylinderGeometry args={[4, 5, 12, 8]} />
                <meshStandardMaterial color="#4a5568" metalness={0.3} roughness={0.7} />
            </mesh>

            {/* Top opening */}
            <mesh position={[0, 12.1, 0]}>
                <ringGeometry args={[2, 4, 8]} />
                <meshStandardMaterial color="#374151" />
            </mesh>

            {/* Steam effect */}
            <mesh ref={steamRef} position={[0, 15, 0]}>
                <coneGeometry args={[3, 6, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
            </mesh>

            {/* Base */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[5.5, 5.5, 0.5, 8]} />
                <meshStandardMaterial color="#374151" />
            </mesh>
        </group>
    );
}

/**
 * Battery Energy Storage System (BESS)
 */
function BatteryStorage({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Concrete pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <planeGeometry args={[35, 20]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>

            {/* Battery containers (Tesla Megapack style) */}
            {[[-12, 0, -5], [0, 0, -5], [12, 0, -5], [-12, 0, 5], [0, 0, 5], [12, 0, 5]].map((pos, i) => (
                <group key={i} position={pos as [number, number, number]}>
                    <mesh position={[0, 2, 0]}>
                        <boxGeometry args={[7, 4, 3]} />
                        <meshStandardMaterial color="#1f2937" metalness={0.5} />
                    </mesh>
                    {/* Ventilation */}
                    <mesh position={[0, 2, 1.6]}>
                        <boxGeometry args={[5, 2, 0.1]} />
                        <meshStandardMaterial color="#374151" />
                    </mesh>
                    {/* Status indicator */}
                    <mesh position={[3, 3.5, 1.6]}>
                        <boxGeometry args={[0.4, 0.4, 0.1]} />
                        <meshBasicMaterial color="#22c55e" />
                    </mesh>
                </group>
            ))}

            {/* Inverter/transformer unit */}
            <mesh position={[18, 2.5, 0]}>
                <boxGeometry args={[4, 5, 6]} />
                <meshStandardMaterial color="#374151" metalness={0.4} />
            </mesh>
        </group>
    );
}

function SimplifiedBuilding({ position, scale }: { position: [number, number, number]; scale: number }) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 7, 0]}>
                <boxGeometry args={[28, 14, 16]} />
                <meshStandardMaterial
                    color="#3d6a8f"
                    emissive="#1a3a5a"
                    emissiveIntensity={0.12}
                    metalness={0.25}
                    roughness={0.5}
                />
            </mesh>
            {/* Edge highlights */}
            <lineSegments position={[0, 7, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(28, 14, 16)]} />
                <lineBasicMaterial color="#5a9ac9" transparent opacity={0.3} />
            </lineSegments>
            {/* Simplified windows - brighter */}
            {[...Array(3)].map((_, row) =>
                [...Array(6)].map((_, col) => (
                    <mesh key={`${row}-${col}`} position={[-9 + col * 3.6, 2 + row * 4, 8.1]}>
                        <planeGeometry args={[2.5, 3]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={0.25} />
                    </mesh>
                ))
            )}
        </group>
    );
}

function TransmissionTower({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Tower structure */}
            <mesh position={[0, 14, 0]}>
                <cylinderGeometry args={[0.3, 1, 28, 4]} />
                <meshStandardMaterial color="#6b7280" metalness={0.7} />
            </mesh>
            {/* Cross arm */}
            <mesh position={[0, 26, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 12]} />
                <meshStandardMaterial color="#6b7280" />
            </mesh>
            {/* Insulators */}
            {[-4, 0, 4].map((x, i) => (
                <mesh key={i} position={[x, 25, 0]}>
                    <cylinderGeometry args={[0.08, 0.15, 1.5]} />
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
    const gridRef = useRef<THREE.GridHelper>(null);

    // Target sizes for smooth interpolation
    const sizes = [4, 12, 25, 100, 400];
    const gridDivisions = [8, 24, 50, 100, 200];

    const targetSize = sizes[Math.min(currentIndex, sizes.length - 1)];

    useFrame((_, delta) => {
        if (meshRef.current) {
            const currentScale = meshRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetSize, delta * 2);
            meshRef.current.scale.set(newScale, 1, newScale);
        }
    });

    return (
        <group>
            {/* Dark ground plane */}
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} scale={[4, 1, 4]}>
                <planeGeometry args={[2, 2]} />
                <meshStandardMaterial color="#030305" />
            </mesh>

            {/* Grid overlay */}
            <gridHelper
                args={[targetSize * 1.8, gridDivisions[Math.min(currentIndex, gridDivisions.length - 1)], '#1a1a2e', '#0a0a12']}
                position={[0, -0.07, 0]}
            />
        </group>
    );
}

/**
 * Power Indicator UI
 */
function PowerIndicator({ visualState, powerMetric }: {
    visualState: string;
    powerMetric?: { value: string; unit: string; comparison: string };
}) {
    const data: Record<string, { label: string; value: string; unit: string; comparison: string; color: string }> = {
        'chip-glow': { label: 'Single GPU', value: '2.3', unit: 'kW', comparison: '≈ 2 homes', color: '#06b6d4' },
        'rack-zoom': { label: 'Server Rack', value: '120', unit: 'kW', comparison: '≈ 100 homes', color: '#f59e0b' },
        'pod-zoom': { label: 'Compute Pod', value: '1-2', unit: 'MW', comparison: '≈ 1,000 homes', color: '#f59e0b' },
        'building-iso': { label: 'Facility', value: '100+', unit: 'MW', comparison: '≈ 80,000 homes', color: '#ef4444' },
        'campus-grid': { label: 'Campus', value: '500', unit: 'MW', comparison: '≈ half a nuclear plant', color: '#ef4444' },
    };

    const d = data[visualState];
    if (!d) return null;

    return (
        <motion.div
            key={visualState}
            className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-sm rounded-lg px-5 py-4 border border-gray-700 z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{d.label}</div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono" style={{ color: d.color }}>
                    {powerMetric?.value || d.value}
                </span>
                <span className="text-lg font-mono text-gray-300">{powerMetric?.unit || d.unit}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">{powerMetric?.comparison || d.comparison}</div>
        </motion.div>
    );
}

/**
 * Scale Indicator UI
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
            className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Scale</div>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                    <motion.div
                        key={level}
                        className="w-2 rounded-sm"
                        style={{ height: 8 + level * 4 }}
                        animate={{
                            backgroundColor: level <= current.level ? '#06b6d4' : '#374151',
                            opacity: level <= current.level ? 1 : 0.4,
                        }}
                        transition={{ duration: 0.3 }}
                    />
                ))}
            </div>
            <div className="text-sm text-white font-medium mt-2">{current.label}</div>
        </motion.div>
    );
}
