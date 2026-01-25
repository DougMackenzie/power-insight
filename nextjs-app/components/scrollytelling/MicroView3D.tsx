'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

interface MicroView3DProps {
    visualState: string;
    powerMetric?: {
        value: string;
        unit: string;
        comparison: string;
    };
    scrollProgress?: number;
}

// Smooth camera configurations for each scale - positioned to maintain GPU as focal point
const cameraConfig: Record<string, {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
}> = {
    'chip-glow': { position: [0, 0.5, 2.5], target: [0, 0, 0], fov: 45 },
    'rack-zoom': { position: [1.5, 2, 5], target: [0, 1.5, 0], fov: 40 },
    'pod-zoom': { position: [8, 6, 12], target: [0, 2, 0], fov: 45 },
    'building-iso': { position: [25, 20, 40], target: [0, 8, 0], fov: 50 },
    'campus-grid': { position: [80, 60, 120], target: [0, 15, 0], fov: 55 },
};

// Scale levels for progressive reveal
const scaleOrder = ['chip-glow', 'rack-zoom', 'pod-zoom', 'building-iso', 'campus-grid'];

/**
 * MicroView3D - Seamless 3D zoom from GPU to data center campus
 * Uses React Three Fiber with smooth camera interpolation
 */
export default function MicroView3D({ visualState, powerMetric }: MicroView3DProps) {
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
            <Canvas
                camera={{ position: [0, 0.5, 2.5], fov: 45, near: 0.1, far: 1000 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                dpr={[1, 2]}
                shadows
            >
                <Scene visualState={visualState} />
            </Canvas>

            {/* UI Overlays */}
            <PowerIndicator visualState={visualState} powerMetric={powerMetric} />
            <ScaleIndicator visualState={visualState} />
            <YearIndicator visualState={visualState} />
        </div>
    );
}

/**
 * Main 3D Scene - All infrastructure layers
 */
function Scene({ visualState }: { visualState: string }) {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    const currentIndex = scaleOrder.indexOf(visualState);
    const targetConfig = cameraConfig[visualState] || cameraConfig['chip-glow'];

    // Smooth camera dolly animation
    useFrame((state, delta) => {
        const targetPos = new THREE.Vector3(...targetConfig.position);
        const targetLook = new THREE.Vector3(...targetConfig.target);

        // Smooth exponential interpolation for cinematic feel
        const lerpFactor = 1 - Math.pow(0.001, delta);
        camera.position.lerp(targetPos, lerpFactor * 2);

        // Smooth look-at transition
        const currentTarget = new THREE.Vector3();
        camera.getWorldDirection(currentTarget);
        currentTarget.multiplyScalar(10).add(camera.position);
        currentTarget.lerp(targetLook, lerpFactor * 2);
        camera.lookAt(targetLook);

        // Update FOV smoothly
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetConfig.fov, lerpFactor * 2);
            camera.updateProjectionMatrix();
        }

        // Subtle scene breathing
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.01;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Dynamic lighting that follows scale */}
            <ambientLight intensity={0.2} />
            <directionalLight
                position={[20, 40, 30]}
                intensity={0.8}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />
            <pointLight position={[5, 10, 5]} intensity={0.6} color="#06b6d4" />
            <pointLight position={[-10, 5, -5]} intensity={0.3} color="#f59e0b" />

            {/* Fog for depth */}
            <fog attach="fog" args={['#0a0a0f', 50, 300]} />

            {/* === LAYER 1: GPU Chip (always visible, focal point) === */}
            <GPU visible={true} scale={currentIndex >= 0 ? 1 : 0} />

            {/* === LAYER 2: Server Rack === */}
            <ServerRack
                visible={currentIndex >= 1}
                animationProgress={currentIndex >= 1 ? 1 : 0}
            />

            {/* === LAYER 3: Compute Pod === */}
            <ComputePod
                visible={currentIndex >= 2}
                animationProgress={currentIndex >= 2 ? 1 : 0}
            />

            {/* === LAYER 4: Data Center Building === */}
            <DataCenterBuilding
                visible={currentIndex >= 3}
                animationProgress={currentIndex >= 3 ? 1 : 0}
            />

            {/* === LAYER 5: Campus & Grid Connection === */}
            <CampusAndGrid
                visible={currentIndex >= 4}
                animationProgress={currentIndex >= 4 ? 1 : 0}
                showGrowth={currentIndex >= 4}
            />

            {/* Ground with expanding grid */}
            <ExpandingGround currentIndex={currentIndex} />

            <Environment preset="night" />
        </group>
    );
}

/**
 * GPU Chip - The central focal point that everything builds around
 */
function GPU({ visible, scale }: { visible: boolean; scale: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
        }
        if (glowRef.current) {
            // Pulsing heat glow
            const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
            (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
        }
    });

    if (!visible) return null;

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Outer glow ring */}
            <mesh ref={glowRef} position={[0, 0, 0]} scale={1.4}>
                <boxGeometry args={[0.8, 0.08, 0.8]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
            </mesh>

            {/* Main chip substrate */}
            <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.7, 0.08, 0.7]} />
                    <meshStandardMaterial
                        color="#0c1929"
                        metalness={0.9}
                        roughness={0.1}
                        emissive="#06b6d4"
                        emissiveIntensity={0.15}
                    />
                </mesh>

                {/* Silicon die (hot center) */}
                <mesh position={[0, 0.05, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.03, 0.4]} />
                    <meshStandardMaterial
                        color="#1a1a2e"
                        metalness={0.95}
                        roughness={0.05}
                        emissive="#f59e0b"
                        emissiveIntensity={0.6}
                    />
                </mesh>

                {/* HBM memory stacks */}
                {[
                    [-0.22, 0.07, -0.22],
                    [0.22, 0.07, -0.22],
                    [-0.22, 0.07, 0.22],
                    [0.22, 0.07, 0.22],
                ].map((pos, i) => (
                    <mesh key={i} position={pos as [number, number, number]} castShadow>
                        <boxGeometry args={[0.1, 0.08, 0.1]} />
                        <meshStandardMaterial
                            color="#1f2937"
                            metalness={0.8}
                            roughness={0.2}
                            emissive="#06b6d4"
                            emissiveIntensity={0.1}
                        />
                    </mesh>
                ))}

                {/* Connection traces radiating outward */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const innerR = 0.38;
                    const outerR = 0.48;
                    return (
                        <mesh
                            key={i}
                            position={[
                                Math.cos(angle) * (innerR + outerR) / 2,
                                -0.035,
                                Math.sin(angle) * (innerR + outerR) / 2,
                            ]}
                            rotation={[0, -angle, 0]}
                        >
                            <boxGeometry args={[0.02, 0.01, outerR - innerR]} />
                            <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
                        </mesh>
                    );
                })}

                {/* BGA balls underneath */}
                {[...Array(6)].map((_, row) =>
                    [...Array(6)].map((_, col) => (
                        <mesh
                            key={`${row}-${col}`}
                            position={[
                                -0.25 + col * 0.1,
                                -0.06,
                                -0.25 + row * 0.1,
                            ]}
                        >
                            <sphereGeometry args={[0.015, 8, 8]} />
                            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
                        </mesh>
                    ))
                )}
            </Float>

            {/* Label */}
            <Html position={[0, -0.25, 0]} center distanceFactor={3}>
                <div className="text-[9px] font-mono text-cyan-400 bg-black/70 px-2 py-0.5 rounded whitespace-nowrap backdrop-blur-sm">
                    NVIDIA RUBIN • 2.3 kW
                </div>
            </Html>
        </group>
    );
}

/**
 * Server Rack - Contains the GPU, shows compute density
 */
function ServerRack({ visible, animationProgress }: { visible: boolean; animationProgress: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const [opacity, setOpacity] = useState(0);

    useFrame((state, delta) => {
        if (visible) {
            setOpacity((prev) => THREE.MathUtils.lerp(prev, 1, delta * 3));
        } else {
            setOpacity((prev) => THREE.MathUtils.lerp(prev, 0, delta * 5));
        }
    });

    if (opacity < 0.01) return null;

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Rack frame - positioned so GPU is in the center tray */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 3.2, 0.9]} />
                <meshStandardMaterial
                    color="#111827"
                    metalness={0.7}
                    roughness={0.3}
                    transparent
                    opacity={opacity * 0.95}
                />
            </mesh>

            {/* Rack rails */}
            <mesh position={[-0.5, 1.5, 0.35]}>
                <boxGeometry args={[0.05, 3, 0.05]} />
                <meshStandardMaterial color="#374151" metalness={0.8} transparent opacity={opacity} />
            </mesh>
            <mesh position={[0.5, 1.5, 0.35]}>
                <boxGeometry args={[0.05, 3, 0.05]} />
                <meshStandardMaterial color="#374151" metalness={0.8} transparent opacity={opacity} />
            </mesh>

            {/* Server trays - 8 units */}
            {[...Array(8)].map((_, i) => (
                <ServerTray
                    key={i}
                    position={[0, 0.2 + i * 0.38, 0.2]}
                    opacity={opacity}
                    isHighlighted={i === 4} // Middle tray contains our focal GPU
                    delay={i * 0.05}
                />
            ))}

            {/* Cooling pipes */}
            <mesh position={[-0.65, 1.5, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 3.2]} />
                <meshStandardMaterial
                    color="#0891b2"
                    metalness={0.9}
                    roughness={0.1}
                    transparent
                    opacity={opacity * 0.8}
                    emissive="#06b6d4"
                    emissiveIntensity={0.2}
                />
            </mesh>
            <mesh position={[0.65, 1.5, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 3.2]} />
                <meshStandardMaterial
                    color="#dc2626"
                    metalness={0.9}
                    roughness={0.1}
                    transparent
                    opacity={opacity * 0.8}
                    emissive="#ef4444"
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Power indicator */}
            <Html position={[0, 3.3, 0]} center distanceFactor={5}>
                <div className="text-[8px] font-mono text-amber-400 bg-black/70 px-2 py-0.5 rounded whitespace-nowrap">
                    DGX RACK • 120 kW
                </div>
            </Html>
        </group>
    );
}

function ServerTray({ position, opacity, isHighlighted, delay }: {
    position: [number, number, number];
    opacity: number;
    isHighlighted: boolean;
    delay: number;
}) {
    const ledRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (ledRef.current) {
            const blink = Math.sin(state.clock.elapsedTime * 10 + delay * 20) > 0.3 ? 1 : 0.3;
            (ledRef.current.material as THREE.MeshBasicMaterial).opacity = blink * opacity;
        }
    });

    return (
        <group position={position}>
            {/* Tray body */}
            <mesh castShadow>
                <boxGeometry args={[0.95, 0.32, 0.6]} />
                <meshStandardMaterial
                    color={isHighlighted ? '#1e3a5f' : '#0f172a'}
                    metalness={0.6}
                    roughness={0.4}
                    transparent
                    opacity={opacity}
                    emissive={isHighlighted ? '#06b6d4' : '#000000'}
                    emissiveIntensity={isHighlighted ? 0.15 : 0}
                />
            </mesh>

            {/* GPU modules */}
            {[...Array(8)].map((_, j) => (
                <mesh key={j} position={[-0.35 + j * 0.1, 0, 0.15]}>
                    <boxGeometry args={[0.06, 0.22, 0.2]} />
                    <meshStandardMaterial
                        color="#1e3a5f"
                        emissive="#06b6d4"
                        emissiveIntensity={0.25}
                        transparent
                        opacity={opacity}
                    />
                </mesh>
            ))}

            {/* Status LEDs */}
            <mesh ref={ledRef} position={[0.42, 0.1, 0.31]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#22c55e" transparent opacity={opacity} />
            </mesh>
            <mesh position={[0.42, -0.05, 0.31]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={opacity * 0.8} />
            </mesh>
        </group>
    );
}

/**
 * Compute Pod - 16 racks in formation
 */
function ComputePod({ visible, animationProgress }: { visible: boolean; animationProgress: number }) {
    const [opacity, setOpacity] = useState(0);

    useFrame((_, delta) => {
        const target = visible ? 1 : 0;
        setOpacity((prev) => THREE.MathUtils.lerp(prev, target, delta * 2.5));
    });

    if (opacity < 0.01) return null;

    // 4x4 rack grid
    const rackPositions = useMemo(() => {
        const positions: [number, number, number][] = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                // Skip center position where our detailed rack is
                if (row === 2 && col === 2) continue;
                positions.push([col * 2.5 - 3.75, 0, row * 2 - 3]);
            }
        }
        return positions;
    }, []);

    return (
        <group position={[0, 0, 0]}>
            {/* Raised floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[14, 12]} />
                <meshStandardMaterial
                    color="#1a1a2e"
                    metalness={0.3}
                    roughness={0.8}
                    transparent
                    opacity={opacity * 0.9}
                />
            </mesh>

            {/* Floor tiles pattern */}
            {[...Array(7)].map((_, row) =>
                [...Array(6)].map((_, col) => (
                    <mesh
                        key={`tile-${row}-${col}`}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[col * 2 - 5, -0.08, row * 2 - 5]}
                    >
                        <planeGeometry args={[1.9, 1.9]} />
                        <meshStandardMaterial
                            color="#0f172a"
                            transparent
                            opacity={opacity * 0.5}
                        />
                    </mesh>
                ))
            )}

            {/* Simplified racks */}
            {rackPositions.map((pos, i) => (
                <SimplifiedRack
                    key={i}
                    position={pos}
                    opacity={opacity}
                    delay={i * 0.03}
                />
            ))}

            {/* CRAH cooling units */}
            <CRAHUnit position={[-7, 0, 0]} opacity={opacity} />
            <CRAHUnit position={[7, 0, 0]} opacity={opacity} />
            <CRAHUnit position={[0, 0, -6]} opacity={opacity} rotation={Math.PI / 2} />
            <CRAHUnit position={[0, 0, 6]} opacity={opacity} rotation={-Math.PI / 2} />

            {/* Overhead cable trays */}
            <mesh position={[0, 4, 0]}>
                <boxGeometry args={[12, 0.1, 0.5]} />
                <meshStandardMaterial color="#374151" transparent opacity={opacity * 0.7} />
            </mesh>
            <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[10, 0.1, 0.5]} />
                <meshStandardMaterial color="#374151" transparent opacity={opacity * 0.7} />
            </mesh>

            <Html position={[0, 4.5, 0]} center distanceFactor={8}>
                <div className="text-[10px] font-mono text-amber-400 bg-black/70 px-3 py-1 rounded whitespace-nowrap">
                    COMPUTE POD • 16 RACKS • 2 MW
                </div>
            </Html>
        </group>
    );
}

function SimplifiedRack({ position, opacity, delay }: {
    position: [number, number, number];
    opacity: number;
    delay: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [localOpacity, setLocalOpacity] = useState(0);

    useFrame((state, delta) => {
        // Staggered fade-in
        const targetOpacity = opacity * Math.min(1, Math.max(0, state.clock.elapsedTime - delay) / 0.5);
        setLocalOpacity((prev) => THREE.MathUtils.lerp(prev, targetOpacity, delta * 5));
    });

    return (
        <group position={position}>
            <mesh ref={meshRef} position={[0, 1.6, 0]} castShadow>
                <boxGeometry args={[1, 3.2, 0.8]} />
                <meshStandardMaterial
                    color="#1f2937"
                    metalness={0.5}
                    roughness={0.5}
                    transparent
                    opacity={localOpacity}
                    emissive="#06b6d4"
                    emissiveIntensity={0.05}
                />
            </mesh>
            {/* Front panel lights */}
            <mesh position={[0, 2.5, 0.41]}>
                <planeGeometry args={[0.8, 0.1]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={localOpacity * 0.4} />
            </mesh>
        </group>
    );
}

function CRAHUnit({ position, opacity, rotation = 0 }: {
    position: [number, number, number];
    opacity: number;
    rotation?: number;
}) {
    const fanRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (fanRef.current) {
            fanRef.current.rotation.z = state.clock.elapsedTime * 8;
        }
    });

    return (
        <group position={position} rotation={[0, rotation, 0]}>
            <mesh position={[0, 1.2, 0]} castShadow>
                <boxGeometry args={[2, 2.4, 1.2]} />
                <meshStandardMaterial
                    color="#0891b2"
                    metalness={0.6}
                    roughness={0.3}
                    transparent
                    opacity={opacity}
                />
            </mesh>
            {/* Fan grille */}
            <mesh ref={fanRef} position={[0, 1.8, 0.61]}>
                <circleGeometry args={[0.4, 6]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={opacity * 0.6} />
            </mesh>
            <mesh position={[0, 0.6, 0.61]}>
                <circleGeometry args={[0.4, 6]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={opacity * 0.4} />
            </mesh>
        </group>
    );
}

/**
 * Data Center Building - Contains multiple pods
 */
function DataCenterBuilding({ visible, animationProgress }: { visible: boolean; animationProgress: number }) {
    const [opacity, setOpacity] = useState(0);

    useFrame((_, delta) => {
        const target = visible ? 1 : 0;
        setOpacity((prev) => THREE.MathUtils.lerp(prev, target, delta * 2));
    });

    if (opacity < 0.01) return null;

    return (
        <group position={[0, 0, 0]}>
            {/* Main building structure */}
            <mesh position={[0, 8, 0]} castShadow receiveShadow>
                <boxGeometry args={[40, 16, 25]} />
                <meshStandardMaterial
                    color="#1e3a5f"
                    metalness={0.4}
                    roughness={0.6}
                    transparent
                    opacity={opacity * 0.95}
                />
            </mesh>

            {/* Building base/foundation */}
            <mesh position={[0, -0.5, 0]}>
                <boxGeometry args={[44, 1, 29]} />
                <meshStandardMaterial color="#374151" transparent opacity={opacity * 0.9} />
            </mesh>

            {/* Windows - front face */}
            {[...Array(4)].map((_, row) =>
                [...Array(10)].map((_, col) => (
                    <WindowPanel
                        key={`front-${row}-${col}`}
                        position={[-16 + col * 3.5, 3 + row * 3.5, 12.6]}
                        opacity={opacity}
                        delay={(row + col) * 0.02}
                    />
                ))
            )}

            {/* Windows - back face */}
            {[...Array(4)].map((_, row) =>
                [...Array(10)].map((_, col) => (
                    <WindowPanel
                        key={`back-${row}-${col}`}
                        position={[-16 + col * 3.5, 3 + row * 3.5, -12.6]}
                        opacity={opacity}
                        delay={(row + col) * 0.02}
                        rotation={Math.PI}
                    />
                ))
            )}

            {/* Rooftop equipment */}
            <RooftopEquipment opacity={opacity} />

            {/* Substation */}
            <Substation position={[-28, 0, 0]} opacity={opacity} />

            {/* Generators */}
            <GeneratorYard position={[28, 0, 0]} opacity={opacity} />

            <Html position={[0, 18, 0]} center distanceFactor={15}>
                <div className="text-xs font-mono text-red-400 bg-black/70 px-4 py-2 rounded whitespace-nowrap border border-red-500/30">
                    HYPERSCALE FACILITY • 100+ MW
                </div>
            </Html>
        </group>
    );
}

function WindowPanel({ position, opacity, delay, rotation = 0 }: {
    position: [number, number, number];
    opacity: number;
    delay: number;
    rotation?: number;
}) {
    const [glow, setGlow] = useState(0);

    useFrame((state) => {
        // Random flickering glow
        const flicker = Math.sin(state.clock.elapsedTime * 2 + delay * 50) * 0.5 + 0.5;
        setGlow(flicker * opacity * 0.5);
    });

    return (
        <mesh position={position} rotation={[0, rotation, 0]}>
            <planeGeometry args={[2.5, 2.8]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={glow} />
        </mesh>
    );
}

function RooftopEquipment({ opacity }: { opacity: number }) {
    return (
        <group position={[0, 16, 0]}>
            {/* HVAC units */}
            {[...Array(8)].map((_, i) => (
                <group key={i} position={[-14 + i * 4, 0.8, -5]}>
                    <mesh>
                        <boxGeometry args={[2.5, 1.6, 2.5]} />
                        <meshStandardMaterial color="#374151" transparent opacity={opacity} />
                    </mesh>
                    {/* Fan */}
                    <mesh position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.8, 0.8, 0.1]} />
                        <meshStandardMaterial color="#4b5563" transparent opacity={opacity} />
                    </mesh>
                </group>
            ))}

            {/* Cooling towers */}
            {[...Array(4)].map((_, i) => (
                <mesh key={`tower-${i}`} position={[-6 + i * 4, 2, 8]}>
                    <cylinderGeometry args={[1.5, 2, 4]} />
                    <meshStandardMaterial color="#4b5563" transparent opacity={opacity} />
                </mesh>
            ))}
        </group>
    );
}

function Substation({ position, opacity }: { position: [number, number, number]; opacity: number }) {
    return (
        <group position={position}>
            {/* Substation building */}
            <mesh position={[0, 2, 0]}>
                <boxGeometry args={[8, 4, 6]} />
                <meshStandardMaterial color="#374151" transparent opacity={opacity} />
            </mesh>

            {/* Transformers */}
            {[...Array(3)].map((_, i) => (
                <group key={i} position={[-2 + i * 2, 0, 4]}>
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.6, 0.6, 2]} />
                        <meshStandardMaterial color="#4b5563" transparent opacity={opacity} />
                    </mesh>
                    {/* Bushings */}
                    <mesh position={[0, 2.2, 0]}>
                        <cylinderGeometry args={[0.15, 0.1, 0.5]} />
                        <meshStandardMaterial color="#fbbf24" metalness={0.9} transparent opacity={opacity} />
                    </mesh>
                </group>
            ))}

            {/* High voltage warning sign */}
            <Html position={[0, 4.5, 0]} center distanceFactor={10}>
                <div className="text-[8px] font-mono text-amber-400 bg-black/70 px-2 py-0.5 rounded">
                    ⚡ 138kV SUBSTATION
                </div>
            </Html>
        </group>
    );
}

function GeneratorYard({ position, opacity }: { position: [number, number, number]; opacity: number }) {
    return (
        <group position={position}>
            {/* Generators */}
            {[...Array(4)].map((_, i) => (
                <group key={i} position={[0, 0, -4 + i * 3]}>
                    <mesh position={[0, 1.5, 0]}>
                        <boxGeometry args={[5, 3, 2]} />
                        <meshStandardMaterial color="#1f2937" transparent opacity={opacity} />
                    </mesh>
                    {/* Exhaust stack */}
                    <mesh position={[1.5, 3, 0]}>
                        <cylinderGeometry args={[0.2, 0.3, 1.5]} />
                        <meshStandardMaterial color="#4b5563" transparent opacity={opacity} />
                    </mesh>
                </group>
            ))}

            <Html position={[0, 4, 0]} center distanceFactor={10}>
                <div className="text-[8px] font-mono text-gray-400 bg-black/70 px-2 py-0.5 rounded">
                    BACKUP GENERATORS
                </div>
            </Html>
        </group>
    );
}

/**
 * Campus and Grid Connection - Multiple buildings with growth animation
 */
function CampusAndGrid({ visible, animationProgress, showGrowth }: {
    visible: boolean;
    animationProgress: number;
    showGrowth: boolean;
}) {
    const [opacity, setOpacity] = useState(0);

    useFrame((_, delta) => {
        const target = visible ? 1 : 0;
        setOpacity((prev) => THREE.MathUtils.lerp(prev, target, delta * 1.5));
    });

    if (opacity < 0.01) return null;

    // Building positions for campus - representing growth over time
    const campusBuildings = [
        { pos: [0, 0, 0] as [number, number, number], size: 1.2, year: 2020 },
        { pos: [-60, 0, 40] as [number, number, number], size: 1, year: 2022 },
        { pos: [60, 0, 40] as [number, number, number], size: 1, year: 2023 },
        { pos: [-60, 0, -40] as [number, number, number], size: 0.9, year: 2024 },
        { pos: [60, 0, -40] as [number, number, number], size: 0.9, year: 2025 },
        { pos: [-100, 0, 0] as [number, number, number], size: 0.8, year: 2027 },
        { pos: [100, 0, 0] as [number, number, number], size: 0.8, year: 2028 },
        { pos: [0, 0, 80] as [number, number, number], size: 1.1, year: 2030 },
    ];

    return (
        <group>
            {/* Campus buildings */}
            {campusBuildings.map((building, i) => (
                <CampusBuilding
                    key={i}
                    position={building.pos}
                    size={building.size}
                    opacity={opacity}
                    delay={i * 0.15}
                    year={building.year}
                />
            ))}

            {/* Central substation complex */}
            <CentralSubstation position={[-120, 0, 0]} opacity={opacity} />

            {/* Transmission towers leading away */}
            {[...Array(8)].map((_, i) => (
                <TransmissionTower
                    key={i}
                    position={[-150 - i * 25, 0, Math.sin(i * 0.5) * 20]}
                    opacity={opacity}
                    delay={i * 0.1}
                />
            ))}

            {/* Power lines connecting towers */}
            <PowerLineNetwork opacity={opacity} />

            <Html position={[0, 40, 0]} center distanceFactor={30}>
                <div className="text-sm font-mono text-red-500 bg-black/80 px-6 py-3 rounded whitespace-nowrap border border-red-500/50">
                    DATA CENTER CAMPUS • 500+ MW
                </div>
            </Html>
        </group>
    );
}

function CampusBuilding({ position, size, opacity, delay, year }: {
    position: [number, number, number];
    size: number;
    opacity: number;
    delay: number;
    year: number;
}) {
    const [localOpacity, setLocalOpacity] = useState(0);
    const [scale, setScale] = useState(0);

    useFrame((state, delta) => {
        // Growth animation - buildings "grow" from the ground
        const elapsed = state.clock.elapsedTime;
        const growthProgress = Math.min(1, Math.max(0, (elapsed - delay) / 1));

        setLocalOpacity(opacity * growthProgress);
        setScale(size * growthProgress);
    });

    if (localOpacity < 0.01) return null;

    return (
        <group position={position} scale={[scale, scale, scale]}>
            {/* Building */}
            <mesh position={[0, 8, 0]} castShadow>
                <boxGeometry args={[35, 16, 22]} />
                <meshStandardMaterial
                    color="#1e3a5f"
                    metalness={0.4}
                    roughness={0.6}
                    transparent
                    opacity={localOpacity}
                />
            </mesh>

            {/* Glowing windows */}
            {[...Array(3)].map((_, row) =>
                [...Array(8)].map((_, col) => (
                    <mesh
                        key={`${row}-${col}`}
                        position={[-12 + col * 3.5, 3 + row * 4, 11.1]}
                    >
                        <planeGeometry args={[2.5, 3]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={localOpacity * 0.35} />
                    </mesh>
                ))
            )}

            {/* Year label */}
            <Html position={[0, -2, 15]} center distanceFactor={20}>
                <div className="text-[8px] font-mono text-gray-500 bg-black/60 px-1.5 py-0.5 rounded">
                    {year}
                </div>
            </Html>
        </group>
    );
}

function CentralSubstation({ position, opacity }: { position: [number, number, number]; opacity: number }) {
    return (
        <group position={position}>
            <mesh position={[0, 5, 0]}>
                <boxGeometry args={[20, 10, 15]} />
                <meshStandardMaterial color="#374151" transparent opacity={opacity} />
            </mesh>

            {/* Large transformers */}
            {[...Array(4)].map((_, i) => (
                <mesh key={i} position={[-6 + i * 4, 2, 10]}>
                    <cylinderGeometry args={[1.2, 1.2, 4]} />
                    <meshStandardMaterial color="#4b5563" transparent opacity={opacity} />
                </mesh>
            ))}

            <Html position={[0, 12, 0]} center distanceFactor={20}>
                <div className="text-xs font-mono text-amber-400 bg-black/70 px-3 py-1 rounded">
                    ⚡ 500 MW SUBSTATION
                </div>
            </Html>
        </group>
    );
}

function TransmissionTower({ position, opacity, delay }: {
    position: [number, number, number];
    opacity: number;
    delay: number;
}) {
    const [localOpacity, setLocalOpacity] = useState(0);

    useFrame((state, delta) => {
        const elapsed = state.clock.elapsedTime;
        const progress = Math.min(1, Math.max(0, (elapsed - delay) / 0.5));
        setLocalOpacity(opacity * progress);
    });

    return (
        <group position={position}>
            {/* Tower base */}
            <mesh position={[0, 0, 0]}>
                <coneGeometry args={[3, 1, 4]} />
                <meshStandardMaterial color="#4b5563" transparent opacity={localOpacity} />
            </mesh>

            {/* Tower body - tapered */}
            <mesh position={[0, 15, 0]}>
                <cylinderGeometry args={[0.5, 1.5, 30, 4]} />
                <meshStandardMaterial
                    color="#6b7280"
                    metalness={0.8}
                    roughness={0.3}
                    transparent
                    opacity={localOpacity}
                />
            </mesh>

            {/* Cross arms */}
            <mesh position={[0, 28, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 12]} />
                <meshStandardMaterial color="#6b7280" transparent opacity={localOpacity} />
            </mesh>
            <mesh position={[0, 24, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.15, 0.15, 8]} />
                <meshStandardMaterial color="#6b7280" transparent opacity={localOpacity} />
            </mesh>

            {/* Insulators */}
            {[-5, -2, 2, 5].map((x, i) => (
                <mesh key={i} position={[x, 28, 0]}>
                    <cylinderGeometry args={[0.15, 0.1, 0.8]} />
                    <meshStandardMaterial color="#60a5fa" metalness={0.9} transparent opacity={localOpacity} />
                </mesh>
            ))}
        </group>
    );
}

function PowerLineNetwork({ opacity }: { opacity: number }) {
    // Create catenary curves for power lines
    const linePositions = useMemo(() => {
        const lines: THREE.Vector3[][] = [];

        // Main transmission line
        for (let i = 0; i < 7; i++) {
            const startX = -150 - i * 25;
            const endX = -150 - (i + 1) * 25;
            const startZ = Math.sin(i * 0.5) * 20;
            const endZ = Math.sin((i + 1) * 0.5) * 20;

            const points: THREE.Vector3[] = [];
            for (let t = 0; t <= 10; t++) {
                const progress = t / 10;
                const x = startX + (endX - startX) * progress;
                const z = startZ + (endZ - startZ) * progress;
                // Catenary sag
                const sag = Math.sin(progress * Math.PI) * 3;
                points.push(new THREE.Vector3(x, 28 - sag, z));
            }
            lines.push(points);
        }

        return lines;
    }, []);

    return (
        <group>
            {linePositions.map((points, i) => (
                <CatenaryLine key={i} points={points} opacity={opacity} />
            ))}
        </group>
    );
}

function CatenaryLine({ points, opacity }: { points: THREE.Vector3[]; opacity: number }) {
    const geometry = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [points]);

    const material = useMemo(() => {
        return new THREE.LineBasicMaterial({
            color: '#fbbf24',
            transparent: true,
            opacity: opacity * 0.8,
        });
    }, [opacity]);

    const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

    return <primitive object={line} />;
}

/**
 * Expanding Ground - Grid that grows with scale
 */
function ExpandingGround({ currentIndex }: { currentIndex: number }) {
    const gridSizes = [5, 15, 30, 100, 400];
    const gridDivisions = [10, 30, 60, 100, 200];

    const size = gridSizes[Math.min(currentIndex, gridSizes.length - 1)];
    const divisions = gridDivisions[Math.min(currentIndex, gridDivisions.length - 1)];

    return (
        <group>
            {/* Main ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                <planeGeometry args={[size * 2, size * 2]} />
                <meshStandardMaterial
                    color="#050508"
                    metalness={0.1}
                    roughness={0.9}
                />
            </mesh>

            {/* Grid overlay */}
            <gridHelper
                args={[size * 1.5, divisions, '#1a1a2e', '#0f0f1a']}
                position={[0, -0.48, 0]}
            />
        </group>
    );
}

/**
 * Year Indicator - Shows growth timeline
 */
function YearIndicator({ visualState }: { visualState: string }) {
    const yearData: Record<string, { year: string; context: string }> = {
        'chip-glow': { year: '2024', context: 'Current Generation' },
        'rack-zoom': { year: '2024', context: 'DGX SuperPOD' },
        'pod-zoom': { year: '2024', context: 'AI Compute Cluster' },
        'building-iso': { year: '2025', context: 'Hyperscale Facility' },
        'campus-grid': { year: '2024-2035', context: 'Projected Growth' },
    };

    const data = yearData[visualState];
    if (!data) return null;

    return (
        <motion.div
            className="absolute top-8 left-8 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700 z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={visualState}
        >
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{data.context}</div>
            <div className="text-lg font-mono text-white font-bold">{data.year}</div>
        </motion.div>
    );
}

/**
 * Power Indicator UI
 */
function PowerIndicator({ visualState, powerMetric }: {
    visualState: string;
    powerMetric?: { value: string; unit: string; comparison: string };
}) {
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
