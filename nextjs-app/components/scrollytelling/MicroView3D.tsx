'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, MeshTransmissionMaterial, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface MicroView3DProps {
    visualState: string;
    powerMetric?: {
        value: string;
        unit: string;
        comparison: string;
    };
    scrollProgress?: number; // 0-1 progress through current step
}

// Camera positions for each scale level
const cameraConfig: Record<string, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
    'chip-glow': { position: [0, 0, 3], target: [0, 0, 0], fov: 50 },
    'rack-zoom': { position: [0, 2, 8], target: [0, 1, 0], fov: 45 },
    'pod-zoom': { position: [5, 8, 15], target: [0, 2, 0], fov: 50 },
    'building-iso': { position: [20, 25, 35], target: [0, 5, 0], fov: 50 },
    'campus-grid': { position: [60, 80, 100], target: [0, 10, 0], fov: 55 },
};

/**
 * MicroView3D - True 3D visualization using React Three Fiber
 * Implements seamless zoom from GPU chip to data center campus
 */
export default function MicroView3D({ visualState, powerMetric, scrollProgress = 0 }: MicroView3DProps) {
    const config = cameraConfig[visualState] || cameraConfig['chip-glow'];

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <Canvas
                camera={{ position: config.position, fov: config.fov }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                <Scene visualState={visualState} scrollProgress={scrollProgress} />
            </Canvas>

            {/* UI Overlays */}
            <PowerIndicator visualState={visualState} powerMetric={powerMetric} />
            <ScaleIndicator visualState={visualState} />
        </div>
    );
}

/**
 * Main 3D Scene with all objects
 */
function Scene({ visualState, scrollProgress }: { visualState: string; scrollProgress: number }) {
    const groupRef = useRef<THREE.Group>(null);

    // Smooth camera animation
    const { camera } = useThree();
    const targetConfig = cameraConfig[visualState] || cameraConfig['chip-glow'];

    useFrame((state, delta) => {
        // Smooth camera movement
        const targetPos = new THREE.Vector3(...targetConfig.position);
        const targetLook = new THREE.Vector3(...targetConfig.target);

        camera.position.lerp(targetPos, delta * 1.5);

        const currentLook = new THREE.Vector3();
        camera.getWorldDirection(currentLook);
        currentLook.add(camera.position);
        currentLook.lerp(targetLook, delta * 1.5);
        camera.lookAt(targetLook);

        // Subtle rotation for life
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
        }
    });

    // Determine visibility based on state
    const scales = ['chip-glow', 'rack-zoom', 'pod-zoom', 'building-iso', 'campus-grid'];
    const currentIndex = scales.indexOf(visualState);

    return (
        <group ref={groupRef}>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 20, 10]} intensity={1} color="#06b6d4" />
            <pointLight position={[-10, 5, -10]} intensity={0.5} color="#f59e0b" />
            <spotLight position={[0, 30, 0]} angle={0.3} penumbra={1} intensity={0.5} />

            {/* GPU Chip - always visible as focal point */}
            <GPU position={[0, 0, 0]} visible={true} opacity={currentIndex >= 0 ? 1 : 0} />

            {/* Server Rack */}
            <ServerRack position={[0, 1.5, 0]} visible={currentIndex >= 1} opacity={currentIndex >= 1 ? 1 : 0} />

            {/* Compute Pod (multiple racks) */}
            <ComputePod position={[0, 2, 0]} visible={currentIndex >= 2} opacity={currentIndex >= 2 ? 1 : 0} />

            {/* Data Center Building */}
            <DataCenterBuilding position={[0, 5, 0]} visible={currentIndex >= 3} opacity={currentIndex >= 3 ? 1 : 0} />

            {/* Campus with multiple buildings */}
            <Campus position={[0, 10, 0]} visible={currentIndex >= 4} opacity={currentIndex >= 4 ? 1 : 0} />

            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#0a0a0a" transparent opacity={0.8} />
            </mesh>

            {/* Grid helper */}
            <gridHelper args={[200, 100, '#1a1a2e', '#1a1a2e']} position={[0, -0.49, 0]} />

            {/* Environment for reflections */}
            <Environment preset="night" />
        </group>
    );
}

/**
 * GPU Chip - The core focal point
 */
function GPU({ position, visible, opacity }: { position: [number, number, number]; visible: boolean; opacity: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Subtle floating animation
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
        }
        if (glowRef.current) {
            // Pulsing glow
            const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
            (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * opacity;
        }
    });

    if (!visible) return null;

    return (
        <group position={position}>
            {/* Glow effect */}
            <mesh ref={glowRef} scale={1.3}>
                <boxGeometry args={[0.8, 0.15, 0.8]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
            </mesh>

            {/* GPU chip body */}
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                <mesh ref={meshRef} castShadow>
                    <boxGeometry args={[0.7, 0.1, 0.7]} />
                    <meshStandardMaterial
                        color="#0c1929"
                        metalness={0.8}
                        roughness={0.2}
                        emissive="#06b6d4"
                        emissiveIntensity={0.2}
                    />
                </mesh>

                {/* Die (hot center) */}
                <mesh position={[0, 0.06, 0]}>
                    <boxGeometry args={[0.4, 0.02, 0.4]} />
                    <meshStandardMaterial
                        color="#1a1a2e"
                        metalness={0.9}
                        roughness={0.1}
                        emissive="#f59e0b"
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* HBM stacks */}
                {[[-0.25, 0], [0.25, 0], [0, -0.25], [0, 0.25]].map(([x, z], i) => (
                    <mesh key={i} position={[x, 0.08, z]}>
                        <boxGeometry args={[0.08, 0.06, 0.08]} />
                        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
                    </mesh>
                ))}

                {/* Connection pins */}
                {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2;
                    const x = Math.cos(angle) * 0.4;
                    const z = Math.sin(angle) * 0.4;
                    return (
                        <mesh key={i} position={[x, -0.05, z]}>
                            <cylinderGeometry args={[0.01, 0.01, 0.05]} />
                            <meshStandardMaterial color="#fbbf24" metalness={0.9} />
                        </mesh>
                    );
                })}
            </Float>

            {/* Label */}
            <Html position={[0, -0.3, 0]} center>
                <div className="text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-0.5 rounded whitespace-nowrap">
                    NVIDIA RUBIN • 2.3 kW
                </div>
            </Html>
        </group>
    );
}

/**
 * Server Rack containing GPUs
 */
function ServerRack({ position, visible, opacity }: { position: [number, number, number]; visible: boolean; opacity: number }) {
    const rackRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (rackRef.current && visible) {
            // Fade in animation
            rackRef.current.children.forEach((child) => {
                if ((child as THREE.Mesh).material) {
                    const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                    if (mat.opacity !== undefined) {
                        mat.transparent = true;
                        mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity, 0.1);
                    }
                }
            });
        }
    });

    if (!visible) return null;

    return (
        <group ref={rackRef} position={position}>
            {/* Rack frame */}
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1, 3, 0.8]} />
                <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.4} transparent opacity={opacity} />
            </mesh>

            {/* Server trays */}
            {[...Array(8)].map((_, i) => (
                <group key={i} position={[0, 0.3 + i * 0.35, 0.15]}>
                    {/* Tray */}
                    <mesh>
                        <boxGeometry args={[0.85, 0.3, 0.5]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.5} transparent opacity={opacity} />
                    </mesh>

                    {/* GPU modules in tray */}
                    {[...Array(6)].map((_, j) => (
                        <mesh key={j} position={[-0.3 + j * 0.12, 0, 0.1]}>
                            <boxGeometry args={[0.08, 0.2, 0.15]} />
                            <meshStandardMaterial
                                color="#1e3a5f"
                                emissive="#06b6d4"
                                emissiveIntensity={0.2}
                                transparent
                                opacity={opacity}
                            />
                        </mesh>
                    ))}

                    {/* Status LED */}
                    <mesh position={[0.35, 0, 0.26]}>
                        <sphereGeometry args={[0.02]} />
                        <meshBasicMaterial color="#22c55e" />
                    </mesh>
                </group>
            ))}

            {/* Cooling pipes */}
            <mesh position={[-0.55, 1.5, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 3]} />
                <meshStandardMaterial color="#0891b2" metalness={0.8} transparent opacity={opacity * 0.8} />
            </mesh>
            <mesh position={[0.55, 1.5, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 3]} />
                <meshStandardMaterial color="#0891b2" metalness={0.8} transparent opacity={opacity * 0.8} />
            </mesh>
        </group>
    );
}

/**
 * Compute Pod - Multiple racks in a row
 */
function ComputePod({ position, visible, opacity }: { position: [number, number, number]; visible: boolean; opacity: number }) {
    if (!visible) return null;

    const rackPositions = useMemo(() => {
        const positions: [number, number, number][] = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                positions.push([col * 2 - 3, 0, row * 1.5 - 2.25]);
            }
        }
        return positions;
    }, []);

    return (
        <group position={position}>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[12, 10]} />
                <meshStandardMaterial color="#1f2937" transparent opacity={opacity * 0.5} />
            </mesh>

            {/* Racks */}
            {rackPositions.map((pos, i) => (
                <SimplifiedRack key={i} position={pos} opacity={opacity} delay={i * 0.05} />
            ))}

            {/* CRAH cooling units */}
            <CoolingUnit position={[-6, 0, 0]} opacity={opacity} />
            <CoolingUnit position={[6, 0, 0]} opacity={opacity} />

            {/* Pod label */}
            <Html position={[0, -0.5, 5]} center>
                <div className="text-xs font-mono text-amber-400 bg-black/70 px-3 py-1 rounded whitespace-nowrap">
                    COMPUTE POD • 16 RACKS • 2 MW
                </div>
            </Html>
        </group>
    );
}

function SimplifiedRack({ position, opacity, delay }: { position: [number, number, number]; opacity: number; delay: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.MeshStandardMaterial;
            const targetOpacity = opacity * (1 - Math.max(0, delay - state.clock.elapsedTime * 0.5));
            material.opacity = THREE.MathUtils.lerp(material.opacity, Math.min(opacity, targetOpacity), 0.1);
        }
    });

    return (
        <mesh ref={meshRef} position={[position[0], position[1] + 1.5, position[2]]}>
            <boxGeometry args={[0.8, 3, 0.6]} />
            <meshStandardMaterial
                color="#1f2937"
                emissive="#06b6d4"
                emissiveIntensity={0.1}
                transparent
                opacity={opacity}
            />
        </mesh>
    );
}

function CoolingUnit({ position, opacity }: { position: [number, number, number]; opacity: number }) {
    const fanRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (fanRef.current) {
            fanRef.current.rotation.z = state.clock.elapsedTime * 5;
        }
    });

    return (
        <group position={position}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[1.5, 2, 1]} />
                <meshStandardMaterial color="#0891b2" metalness={0.7} transparent opacity={opacity} />
            </mesh>
            {/* Fan */}
            <mesh ref={fanRef} position={[0, 1.5, 0.51]}>
                <circleGeometry args={[0.3, 6]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={opacity * 0.8} />
            </mesh>
        </group>
    );
}

/**
 * Data Center Building
 */
function DataCenterBuilding({ position, visible, opacity }: { position: [number, number, number]; visible: boolean; opacity: number }) {
    if (!visible) return null;

    return (
        <group position={position}>
            {/* Main building */}
            <mesh position={[0, 5, 0]}>
                <boxGeometry args={[30, 10, 20]} />
                <meshStandardMaterial color="#1e3a5f" metalness={0.4} roughness={0.6} transparent opacity={opacity} />
            </mesh>

            {/* Windows */}
            {[...Array(5)].map((_, row) =>
                [...Array(8)].map((_, col) => (
                    <mesh key={`${row}-${col}`} position={[-12 + col * 3.5, 2 + row * 2, 10.1]}>
                        <planeGeometry args={[2, 1.5]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={opacity * 0.4} />
                    </mesh>
                ))
            )}

            {/* Rooftop HVAC units */}
            {[...Array(6)].map((_, i) => (
                <mesh key={i} position={[-10 + i * 4, 10.5, 0]}>
                    <boxGeometry args={[2, 1, 2]} />
                    <meshStandardMaterial color="#374151" transparent opacity={opacity} />
                </mesh>
            ))}

            {/* Substation */}
            <group position={[-20, 0, 0]}>
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[5, 3, 4]} />
                    <meshStandardMaterial color="#374151" transparent opacity={opacity} />
                </mesh>
                {/* Transformers */}
                {[...Array(3)].map((_, i) => (
                    <mesh key={i} position={[-1.5 + i * 1.5, 0.5, 2.5]}>
                        <cylinderGeometry args={[0.4, 0.4, 1]} />
                        <meshStandardMaterial color="#4b5563" transparent opacity={opacity} />
                    </mesh>
                ))}
            </group>

            {/* Power lines to building */}
            <PowerLines start={[-17, 3, 0]} end={[-15, 5, 0]} opacity={opacity} />

            {/* Label */}
            <Html position={[0, -2, 15]} center>
                <div className="text-sm font-mono text-red-400 bg-black/70 px-4 py-2 rounded whitespace-nowrap">
                    HYPERSCALE FACILITY • 100+ MW
                </div>
            </Html>
        </group>
    );
}

function PowerLines({ start, end, opacity }: { start: [number, number, number]; end: [number, number, number]; opacity: number }) {
    const lineRef = useRef<THREE.Line>(null);

    const lineGeometry = useMemo(() => {
        const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return geometry;
    }, [start, end]);

    const lineMaterial = useMemo(() => {
        return new THREE.LineBasicMaterial({ color: '#fbbf24', transparent: true, opacity: opacity });
    }, [opacity]);

    return <primitive ref={lineRef} object={new THREE.Line(lineGeometry, lineMaterial)} />;
}

/**
 * Campus - Multiple buildings
 */
function Campus({ position, visible, opacity }: { position: [number, number, number]; visible: boolean; opacity: number }) {
    if (!visible) return null;

    return (
        <group position={position}>
            {/* Multiple data center buildings */}
            {[
                [-40, 0, -30],
                [40, 0, -30],
                [-40, 0, 30],
                [40, 0, 30],
                [0, 0, 0],
            ].map((pos, i) => (
                <CampusBuilding key={i} position={pos as [number, number, number]} opacity={opacity} size={i === 4 ? 1.5 : 1} />
            ))}

            {/* Power substation complex */}
            <group position={[-80, 0, 0]}>
                <mesh position={[0, 3, 0]}>
                    <boxGeometry args={[15, 6, 10]} />
                    <meshStandardMaterial color="#374151" transparent opacity={opacity} />
                </mesh>
                <Html position={[0, 7, 0]} center>
                    <div className="text-xs font-mono text-amber-400 bg-black/70 px-2 py-1 rounded">
                        500 MW SUBSTATION
                    </div>
                </Html>
            </group>

            {/* Transmission towers */}
            {[...Array(5)].map((_, i) => (
                <TransmissionTower key={i} position={[-100 - i * 20, 0, 0]} opacity={opacity} />
            ))}

            {/* Campus label */}
            <Html position={[0, 30, 0]} center>
                <div className="text-base font-mono text-red-500 bg-black/80 px-6 py-3 rounded whitespace-nowrap border border-red-500/50">
                    DATA CENTER CAMPUS • 500+ MW
                </div>
            </Html>
        </group>
    );
}

function CampusBuilding({ position, opacity, size = 1 }: { position: [number, number, number]; opacity: number; size?: number }) {
    return (
        <group position={position} scale={size}>
            <mesh position={[0, 4, 0]}>
                <boxGeometry args={[25, 8, 15]} />
                <meshStandardMaterial color="#1e3a5f" metalness={0.3} roughness={0.7} transparent opacity={opacity} />
            </mesh>
            {/* Glowing windows */}
            {[...Array(3)].map((_, row) =>
                [...Array(6)].map((_, col) => (
                    <mesh key={`${row}-${col}`} position={[-9 + col * 3.6, 1.5 + row * 2.5, 7.6]}>
                        <planeGeometry args={[2.5, 2]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={opacity * 0.3} />
                    </mesh>
                ))
            )}
        </group>
    );
}

function TransmissionTower({ position, opacity }: { position: [number, number, number]; opacity: number }) {
    return (
        <group position={position}>
            {/* Tower structure */}
            <mesh position={[0, 10, 0]}>
                <cylinderGeometry args={[0.3, 0.8, 20]} />
                <meshStandardMaterial color="#4b5563" metalness={0.8} transparent opacity={opacity} />
            </mesh>
            {/* Cross arms */}
            <mesh position={[0, 18, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 8]} />
                <meshStandardMaterial color="#4b5563" transparent opacity={opacity} />
            </mesh>
        </group>
    );
}

/**
 * Power Indicator UI
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
            className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-sm rounded-lg px-5 py-4 border border-gray-700 z-10"
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
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <motion.div
                        key={level}
                        className="w-2 h-8 rounded-sm"
                        animate={{
                            backgroundColor: level <= current.level ? '#06b6d4' : '#374151',
                        }}
                        transition={{ duration: 0.3 }}
                    />
                ))}
            </div>
            <div className="text-sm text-white font-medium mt-2">{current.label}</div>
        </motion.div>
    );
}
