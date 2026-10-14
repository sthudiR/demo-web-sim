import { useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tideHeight, MEAN_MOON_KM, SYNODIC_DAYS } from './tide';
import type { TideParams } from './tide';

const LEVEL_SCALE = 1.1; // world units per metre of tide
type Hours = MutableRefObject<number>;

function Sea({ params, hours }: { params: TideParams; hours: Hours }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(14, 10, 70, 50);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.setY(i, 0.05 * Math.sin(x * 1.4 + t * 1.6) + 0.04 * Math.sin(z * 2 + t * 1.1));
    }
    pos.needsUpdate = true;
    mesh.current.position.y = tideHeight(hours.current, params) * LEVEL_SCALE;
  });
  return (
    <mesh ref={mesh} geometry={geo}>
      <meshStandardMaterial color="#2b9fb8" transparent opacity={0.82} roughness={0.25} metalness={0.1} />
    </mesh>
  );
}

function Beach() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(14, 10, 40, 1);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + 7) / 14; // 0 sea .. 1 shore
      pos.setY(i, -1.6 + u * 2.9 * (0.6 + 0.4 * u));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#d9c08a" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Pier() {
  return (
    <group position={[-1.5, 0, -3]}>
      <mesh position={[0, 0.9, 0]}><boxGeometry args={[3.2, 0.12, 0.7]} /><meshStandardMaterial color="#7a5a3a" /></mesh>
      {[-1.4, 0, 1.4].map((x) => (
        <mesh key={x} position={[x, -0.2, 0]}><cylinderGeometry args={[0.07, 0.07, 2.4]} /><meshStandardMaterial color="#5c432b" /></mesh>
      ))}
    </group>
  );
}

function Sky({ params, hours }: { params: TideParams; hours: Hours }) {
  const moon = useRef<THREE.Mesh>(null!);
  const sun = useRef<THREE.Mesh>(null!);
  const moonScale = (MEAN_MOON_KM / params.moonKm) * 0.55;
  useFrame(() => {
    const h = hours.current;
    const sa = ((h - 6) / 24) * Math.PI * 2;
    sun.current.position.set(Math.cos(sa) * 9, Math.sin(sa) * 6 + 1, -6);
    const ma = ((h - 6) / 24.84) * Math.PI * 2 - (params.moonAge / SYNODIC_DAYS) * Math.PI * 2;
    moon.current.position.set(Math.cos(ma) * 9, Math.sin(ma) * 6 + 1, -6);
  });
  return (
    <>
      <mesh ref={sun}><sphereGeometry args={[0.6, 24, 24]} /><meshBasicMaterial color="#f2c14e" /></mesh>
      <mesh ref={moon} scale={moonScale}><sphereGeometry args={[0.4, 24, 24]} /><meshBasicMaterial color="#dfe6ee" /></mesh>
    </>
  );
}

export default function Scene({ params, hours }: { params: TideParams; hours: Hours }) {
  return (
    <Canvas camera={{ position: [-1, 4.5, 11], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={['#0f1a26']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} />
      <Beach />
      <Pier />
      <Sea params={params} hours={hours} />
      <Sky params={params} hours={hours} />
    </Canvas>
  );
}
