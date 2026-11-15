'use client';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Edges, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useExplorer } from '@/store/explorer';
import {
  BASE_HEIGHT,
  FLOOR_HEIGHT,
  UNIT_WIDTH,
  UNIT_DEPTH,
  unitPosition,
  STATUS_COLORS,
  FLOORS,
} from '@/data/demo';
import type { ArchitecturalObject, FloorId, Unit } from '@/types';
const CUBE = new THREE.BoxGeometry(1, 1, 1);
const MAT = {
  stone: new THREE.MeshStandardMaterial({ color: '#a89b88', roughness: 0.79, metalness: 0.06 }),
  slab: new THREE.MeshStandardMaterial({ color: '#b4aa99', roughness: 0.63 }),
  dark: new THREE.MeshStandardMaterial({ color: '#35332d', roughness: 0.48, metalness: 0.35 }),
  bronze: new THREE.MeshStandardMaterial({ color: '#5a4834', roughness: 0.36, metalness: 0.76 }),
  wood: new THREE.MeshStandardMaterial({ color: '#6a4a2b', roughness: 0.8 }),
  floor: new THREE.MeshStandardMaterial({ color: '#a99e8d', roughness: 0.38, metalness: 0.1 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: '#899987',
    metalness: 0.48,
    roughness: 0.08,
    transparent: true,
    opacity: 0.23,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  warm: new THREE.MeshStandardMaterial({
    color: '#cbb492',
    roughness: 0.75,
    emissive: '#e2a85f',
    emissiveIntensity: 0.12,
  }),
  light: new THREE.MeshStandardMaterial({
    color: '#fff0ce',
    emissive: '#ffbb65',
    emissiveIntensity: 4.5,
    toneMapped: false,
  }),
  earth: new THREE.MeshStandardMaterial({ color: '#3b3529', roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#4f6233', roughness: 0.85 }),
  leafLight: new THREE.MeshStandardMaterial({ color: '#748153', roughness: 0.9 }),
  pot: new THREE.MeshStandardMaterial({ color: '#b9ad97', roughness: 0.88 }),
};
type BoxProps = {
  position: [number, number, number];
  size: [number, number, number];
  material?: keyof typeof MAT;
  rotation?: [number, number, number];
  object?: ArchitecturalObject;
  cast?: boolean;
};
function Box({ position, size, material = 'stone', rotation, object, cast = true }: BoxProps) {
  const mode = useExplorer((s) => s.mode);
  const inspected = useExplorer((s) => s.inspected?.id);
  const inspect = useExplorer((s) => s.inspect);
  return (
    <mesh
      geometry={CUBE}
      material={MAT[material]}
      position={position}
      scale={size}
      rotation={rotation}
      castShadow={cast}
      receiveShadow
      name={object?.id}
      userData={object}
      onClick={
        object && mode === 'architecture'
          ? (e) => {
              if (e.delta > 6) return;
              e.stopPropagation();
              inspect(object);
            }
          : undefined
      }
      onPointerOver={
        object && mode === 'architecture'
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }
          : undefined
      }
      onPointerOut={
        object && mode === 'architecture'
          ? () => {
              document.body.style.cursor = 'auto';
            }
          : undefined
      }
    >
      {object && inspected === object.id && <Edges scale={1.004} threshold={15} color="#edd3a4" />}
    </mesh>
  );
}
type Transform = {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
};
const LEAF_GEOMETRY = new THREE.IcosahedronGeometry(1, 1);
const OUTFIT_MATERIAL = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
function Repeated({
  items,
  material = MAT.bronze,
  geometry = CUBE,
  inspection,
}: {
  items: Transform[];
  material?: THREE.Material;
  geometry?: THREE.BufferGeometry;
  inspection?: { prefix: string; name: string; type: string };
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mode = useExplorer((s) => s.mode);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    items.forEach((item, i) => {
      dummy.position.set(...item.position);
      dummy.scale.set(...item.scale);
      dummy.rotation.set(...(item.rotation || [0, 0, 0]));
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      if (item.color) ref.current!.setColorAt(i, new THREE.Color(item.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow
      receiveShadow
      onClick={
        inspection && mode === 'architecture'
          ? (e) => {
              e.stopPropagation();
              useExplorer
                .getState()
                .inspect(
                  object(`${inspection.prefix}_${e.instanceId}`, inspection.name, inspection.type),
                );
            }
          : undefined
      }
    />
  );
}
function MaterialDetail() {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const n = 176 + Math.sin(i * 12.9898) * 25;
      data.data[i] = n;
      data.data[i + 1] = n;
      data.data[i + 2] = n;
      data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  }, []);
  useEffect(() => {
    for (const mat of [MAT.stone, MAT.slab, MAT.pot]) {
      mat.bumpMap = tex;
      mat.bumpScale = 0.018;
      mat.needsUpdate = true;
    }
    return () => {
      for (const mat of [MAT.stone, MAT.slab, MAT.pot]) {
        mat.bumpMap = null;
        mat.needsUpdate = true;
      }
      tex.dispose();
    };
  }, [tex]);
  return null;
}
function object(id: string, name: string, type: string): ArchitecturalObject {
  return {
    id,
    name,
    type,
    description:
      'A modeled architectural component of the demonstration plaza. Final construction details require verified architectural drawings.',
  };
}
function Rail({
  x,
  z,
  length,
  alongZ = false,
  id,
}: {
  x: number;
  z: number;
  length: number;
  alongZ?: boolean;
  id: string;
}) {
  return (
    <group name={id}>
      <Box
        position={[x, 0.75, z]}
        size={alongZ ? [0.045, 0.055, length] : [length, 0.055, 0.045]}
        material="bronze"
        object={object(id, 'Terrace balustrade', 'Railing')}
      />
      <Box
        position={[x, 0.35, z]}
        size={alongZ ? [0.025, 0.6, length] : [length, 0.6, 0.025]}
        material="glass"
        cast={false}
      />
      <Repeated
        items={Array.from({ length: Math.ceil(length / 1.4) + 1 }, (_, i) => {
          const p = -length / 2 + i * (length / Math.ceil(length / 1.4));
          return {
            position: [x + (alongZ ? 0 : p), 0.36, z + (alongZ ? p : 0)] as [
              number,
              number,
              number,
            ],
            scale: [0.035, 0.75, 0.035] as [number, number, number],
          };
        })}
      />
    </group>
  );
}
function Plant({
  position,
  scale = 1,
  tree = false,
}: {
  position: [number, number, number];
  scale?: number;
  tree?: boolean;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow material={MAT.pot} position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 0.52, 8]} />
      </mesh>
      <mesh material={MAT.earth} position={[0, 0.53, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.47, 10]} />
      </mesh>
      {tree ? (
        <>
          <mesh material={MAT.wood} position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.055, 0.09, 2.8, 6]} />
          </mesh>
          <Repeated
            geometry={LEAF_GEOMETRY}
            material={MAT.leaf}
            items={Array.from({ length: 18 }, (_, i) => {
              const a = i * 2.399;
              const radius = 0.2 + (i % 5) * 0.14;
              return {
                position: [Math.cos(a) * radius, 2.7 + (i % 6) * 0.2, Math.sin(a) * radius] as [
                  number,
                  number,
                  number,
                ],
                scale: [0.43 + (i % 3) * 0.06, 0.5, 0.4] as [number, number, number],
                color: i % 3 === 0 ? '#9aa35d' : '#718645',
              };
            })}
          />
        </>
      ) : (
        <Repeated
          geometry={LEAF_GEOMETRY}
          material={MAT.leaf}
          items={Array.from({ length: 9 }, (_, i) => ({
            position: [Math.cos(i * 2.4) * 0.23, 0.79, Math.sin(i * 2.4) * 0.23] as [
              number,
              number,
              number,
            ],
            rotation: [Math.sin(i) * 0.7, i, 0.5] as [number, number, number],
            scale: [0.12, 0.53, 0.22] as [number, number, number],
            color: i % 2 ? '#9aab61' : '#71863d',
          }))}
        />
      )}
    </group>
  );
}
function ShopMesh({ unit }: { unit: Unit }) {
  const [x, , z] = unitPosition(unit);
  const s = useExplorer();
  const active = s.selectedId === unit.id;
  const hovered = s.hoveredId === unit.id;
  const width = UNIT_WIDTH;
  const depth = UNIT_DEPTH;
  const inner = x < 0 ? width / 2 : -width / 2;
  const warmColors = ['#aa7050', '#9f9a7d', '#6c7d78', '#c1af86'];
  function select(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 6 || s.mode !== 'leasing') return;
    e.stopPropagation();
    s.select(unit.id);
  }
  return (
    <group
      name={unit.meshId}
      position={[x, 0, z]}
      userData={{ unitId: unit.id, type: 'shop', floor: unit.floor }}
      onClick={select}
      onPointerOver={(e) => {
        if (s.mode !== 'leasing') return;
        e.stopPropagation();
        s.hover(unit.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        s.hover(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* A real open room, partition walls, glazed front and atrium-facing storefront. */}
      <Box
        position={[0, 0.04, 0]}
        size={[width, 0.08, depth - 0.04]}
        material="floor"
        object={object(`${unit.meshId}_floor`, 'Unit floor finish', 'Room')}
      />
      <Box
        position={[-inner, 1.85, 0]}
        size={[0.16, 3.7, depth]}
        object={object(`${unit.meshId}_wall`, 'Exterior stone wall', 'Exterior wall')}
      />
      <Box
        position={[0, 1.85, -depth / 2]}
        size={[width, 3.7, 0.12]}
        material="warm"
        object={object(`${unit.meshId}_partition`, 'Retail partition', 'Interior wall')}
      />
      <Box
        position={[inner, 1.75, 0]}
        size={[0.025, 3.35, depth - 0.12]}
        material="glass"
        object={object(`${unit.meshId}_window`, 'Glazed atrium frontage', 'Window')}
      />
      {unit.slot % 4 === 0 && (
        <Box
          position={[0, 1.75, depth / 2]}
          size={[width, 3.35, 0.03]}
          material="glass"
          object={object(`${unit.meshId}_front`, 'Front storefront glazing', 'Window')}
        />
      )}
      {[-1, 0, 1].map((i) => (
        <Box
          key={i}
          position={[inner, 1.8, i * (depth / 2 - 0.1)]}
          size={[0.07, 3.6, 0.07]}
          material="bronze"
        />
      ))}
      {unit.slot % 4 === 0 && (
        <group>
          <Box position={[0, 3.42, depth / 2 + 0.035]} size={[width, 0.38, 0.09]} material="wood" />
          {Array.from({ length: 6 }, (_, i) => (
            <Box
              key={i}
              position={[0, 3.27 + i * 0.065, depth / 2 + 0.09]}
              size={[width, 0.025, 0.04]}
              material="bronze"
            />
          ))}
        </group>
      )}
      {unit.slot % 4 === 0 &&
        [-3, -1, 1, 3].map((p) => (
          <Box key={p} position={[p, 1.8, depth / 2]} size={[0.055, 3.6, 0.06]} material="bronze" />
        ))}
      <Box position={[inner, 3.5, 0]} size={[0.12, 0.11, depth]} material="wood" />
      <Box
        position={[inner - 0.025 * Math.sign(x), 3.55, 0]}
        size={[0.055, 0.035, depth - 0.1]}
        material="light"
        cast={false}
      />
      {!s.interior &&
        s.floor !== unit.floor &&
        !(unit.floor === 2 && !s.roofVisible) &&
        !s.exploded && (
          <Box
            position={[0, 3.7, 0]}
            size={[width - 0.05, 0.1, depth - 0.05]}
            material="warm"
            object={object(`${unit.meshId}_ceiling`, 'Retail ceiling', 'Ceiling')}
          />
        )}
      <Box
        position={[0, 3.63, depth / 2 - 0.4]}
        size={[width - 0.4, 0.025, 0.04]}
        material="light"
        cast={false}
      />
      <Box
        position={[inner, 1.2, 0.55]}
        size={[0.05, 0.65, 0.03]}
        material="bronze"
        object={object(`${unit.meshId}_door`, 'Storefront entrance', 'Door')}
      />
      {/* Simplified retail fit-out, fitted to the actual unit footprint. */}
      <Box position={[-inner * 0.58, 0.57, -0.68]} size={[1.7, 1.1, 0.55]} material="wood" />
      <Box position={[-inner * 0.58, 1.14, -0.68]} size={[1.85, 0.05, 0.66]} material="warm" />
      {[-1.1, 1.4].map((p, j) => (
        <group key={j} position={[p, 0, -0.75]}>
          <Box position={[0, 1.05, 0]} size={[1.35, 0.045, 0.045]} material="bronze" />
          <Box position={[-0.64, 0.55, 0]} size={[0.03, 1.05, 0.03]} material="bronze" />
          <Box position={[0.64, 0.55, 0]} size={[0.03, 1.05, 0.03]} material="bronze" />
          <Repeated
            material={OUTFIT_MATERIAL}
            items={Array.from({ length: 5 }, (_, i) => ({
              position: [-0.45 + i * 0.23, 0.72, 0] as [number, number, number],
              scale: [0.17, 0.55, 0.16] as [number, number, number],
              color: warmColors[(i + unit.slot) % 4],
            }))}
          />
        </group>
      ))}
      <Box position={[inner * 0.35, 0.35, 0.6]} size={[0.8, 0.7, 0.7]} material="warm" />
      {(active || hovered) && (
        <mesh position={[0, 1.8, 0.01]}>
          <boxGeometry args={[width + 0.035, 3.65, depth + 0.035]} />
          <meshBasicMaterial
            color={STATUS_COLORS[unit.status]}
            transparent
            opacity={active ? 0.1 : 0.05}
            depthWrite={false}
          />
          <Edges threshold={15} color={STATUS_COLORS[unit.status]} lineWidth={active ? 2 : 1} />
        </mesh>
      )}
      {!s.interior && (
        <mesh position={[inner - 0.05 * Math.sign(x), 0.035, 0]}>
          <boxGeometry args={[0.035, 0.03, depth - 0.18]} />
          <meshBasicMaterial color={STATUS_COLORS[unit.status]} />
        </mesh>
      )}
    </group>
  );
}
function FloorLevel({ floor }: { floor: FloorId }) {
  const group = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const s = useExplorer();
  const visible = s.floor === 'all' || s.floor === 'roof' || s.floor === floor;
  const base = BASE_HEIGHT + floor * FLOOR_HEIGHT;
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (!group.current) return;
    const g = group.current;
    g.visible = true;
    const ctx = gsap.context(() => {
      gsap.to(g.position, {
        y: base + (s.exploded ? floor * 5 : 0),
        onUpdate: invalidate,
        duration: reduced ? 0 : 0.9,
        ease: 'power2.inOut',
      });
      gsap.to(g.scale, {
        y: visible ? 1 : 0.001,
        onUpdate: invalidate,
        duration: reduced ? 0 : 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          g.visible = visible;
        },
      });
    });
    return () => ctx.revert();
  }, [base, floor, s.exploded, visible, reduced]);
  return (
    <group ref={group} position={[0, base, 0]} name={`floor_${floor}`}>
      {[-8.15, 8.15].map((x, i) => (
        <group key={x}>
          <Box
            position={[x, -0.19, 0]}
            size={[8.65, 0.38, 14.7]}
            material="slab"
            object={object(
              `floor_${floor}_slab_${i}`,
              `${s.floors.find((f) => f.id === floor)?.name || FLOORS[floor].name} slab`,
              'Floor slab',
            )}
          />
          <Box
            position={[x, -0.035, 7.35]}
            size={[8.6, 0.035, 0.035]}
            material="light"
            cast={false}
          />
          <Box
            position={[Math.sign(x) * 3.85, -0.035, 0]}
            size={[0.035, 0.035, 14.7]}
            material="light"
            cast={false}
          />
          <Box
            position={[Math.sign(x) * 3.6, -0.12, 0]}
            size={[1.1, 0.22, 14.7]}
            material="floor"
            object={object(`floor_${floor}_corridor_${i}`, 'Atrium promenade', 'Corridor')}
          />
          {floor > 0 && (
            <>
              <Rail
                x={Math.sign(x) * 3.1}
                z={0}
                length={14.5}
                alongZ
                id={`floor_${floor}_railing_${i}`}
              />
              <Rail x={x} z={7.4} length={8.6} id={`floor_${floor}_front_railing_${i}`} />
            </>
          )}
          <Repeated
            material={MAT.stone}
            inspection={{
              prefix: `floor_${floor}_columns_${i}`,
              name: 'Stone structural column',
              type: 'Column',
            }}
            items={[-7.2, -3.5, 0, 3.5, 7.2].flatMap((z) =>
              [12.4, 3.8].map((cx) => ({
                position: [Math.sign(x) * cx, 1.95, z] as [number, number, number],
                scale: [0.4, 3.9, 0.42] as [number, number, number],
              })),
            )}
          />
          {s.interior || s.floor === floor || s.exploded || (floor === 2 && !s.roofVisible) ? (
            <group name={`floor_${floor}_open_beams_${i}`}>
              {[-7.25, 7.25].map((z) => (
                <Box
                  key={z}
                  position={[x, 3.96, z]}
                  size={[8.9, 0.38, 0.4]}
                  material="slab"
                  object={object(`floor_${floor}_beam_${i}_${z}`, 'Stone perimeter beam', 'Beam')}
                />
              ))}
              {[-4.25, 4.25].map((offset) => (
                <Box
                  key={offset}
                  position={[x + offset, 3.96, 0]}
                  size={[0.4, 0.38, 14.1]}
                  material="slab"
                  object={object(
                    `floor_${floor}_beam_${i}_${offset}`,
                    'Stone perimeter beam',
                    'Beam',
                  )}
                />
              ))}
            </group>
          ) : (
            <Box
              position={[x, 3.96, 0]}
              size={[8.9, 0.38, 14.9]}
              material="slab"
              object={object(
                `floor_${floor}_ceiling_slab_${i}`,
                'Upper structural slab',
                'Floor slab',
              )}
            />
          )}
          <Box position={[x, 3.78, 7.48]} size={[8.85, 0.04, 0.04]} material="light" cast={false} />
          <Box
            position={[Math.sign(x) * 3.65, 3.78, 0]}
            size={[0.04, 0.04, 14.8]}
            material="light"
            cast={false}
          />
          {[4.8, -2.2, -5.7].map((z, j) => (
            <Plant key={z} position={[Math.sign(x) * 3.1, 0, z]} scale={0.55 + j * 0.04} />
          ))}
        </group>
      ))}
      <Box
        position={[0, -0.19, -6.8]}
        size={[7.7, 0.38, 1.5]}
        material="slab"
        object={object(`floor_${floor}_bridge`, 'Rear connecting bridge', 'Corridor')}
      />
      {floor > 0 && <Rail x={0} z={-6} length={6.2} id={`floor_${floor}_bridge_rail`} />}
      {s.units
        .filter((u) => u.floor === floor)
        .map((unit) => (
          <ShopMesh key={unit.id} unit={unit} />
        ))}
      {floor < 2 && <CentralStair floor={floor} />}
    </group>
  );
}
function CentralStair({ floor }: { floor: number }) {
  return (
    <group name={`staircase_${floor}`}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.9, 0, 0]}>
          {Array.from({ length: 22 }, (_, i) => (
            <Box
              key={i}
              position={[0, ((i + 0.5) * FLOOR_HEIGHT) / 22, 4.9 - i * 0.48]}
              size={[2.6, FLOOR_HEIGHT / 22, 0.51]}
              material="slab"
              object={
                i === 10
                  ? object(`stairs_${floor}_${side}`, 'Central connecting staircase', 'Staircase')
                  : undefined
              }
            />
          ))}
          <Box
            position={[side * 1.25, FLOOR_HEIGHT / 2 + 0.8, -0.1]}
            size={[0.045, 0.045, 11.6]}
            rotation={[0.383, 0, 0]}
            material="bronze"
          />
          {Array.from({ length: 7 }, (_, i) => (
            <Box
              key={i}
              position={[side * 1.25, ((i + 0.7) * FLOOR_HEIGHT) / 7 + 0.4, 4.6 - i * 1.45]}
              size={[0.035, 0.85, 0.035]}
              material="bronze"
            />
          ))}
        </group>
      ))}
    </group>
  );
}
function Roof() {
  const { invalidate } = useThree();
  const ref = useRef<THREE.Group>(null);
  const s = useExplorer();
  const show = s.roofVisible && !s.interior && (s.floor === 'all' || s.floor === 'roof');
  useEffect(() => {
    if (!ref.current) return;
    const g = ref.current;
    g.visible = true;
    const tween = gsap.to(g.scale, {
      y: show ? 1 : 0.001,
      onUpdate: invalidate,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.6,
      onComplete: () => {
        g.visible = show;
      },
    });
    return () => {
      tween.kill();
    };
  }, [show]);
  return (
    <group
      ref={ref}
      name="roof"
      position={[0, BASE_HEIGHT + FLOOR_HEIGHT * 3 + (s.exploded ? 15 : 0) - 0.16, 0]}
    >
      {[-8.15, 8.15].map((x, i) => (
        <group key={x}>
          <Box
            position={[x, 0, 0]}
            size={[9, 0.27, 15.2]}
            material="slab"
            object={object(`roof_section_${i}`, 'Stone roof terrace', 'Roof section')}
          />
          <Box
            position={[x, 0.28, -7.5]}
            size={[9, 0.55, 0.18]}
            object={object(`roof_parapet_${i}`, 'Roof parapet', 'Parapet')}
          />
          <Box position={[Math.sign(x) * 12.6, 0.28, 0]} size={[0.18, 0.55, 15]} />
          <Box position={[x, 0.17, 7.55]} size={[8.9, 0.04, 0.05]} material="light" cast={false} />
        </group>
      ))}
      <Box position={[0, 0, -6.7]} size={[7.4, 0.27, 1.8]} material="slab" />
      <Box position={[0, 0, 6.8]} size={[7.4, 0.27, 1.5]} material="slab" />
      <Box
        position={[0, 0.18, -0.15]}
        size={[6.9, 0.1, 11.6]}
        material="glass"
        object={object('roof_skylight', 'Central atrium skylight', 'Skylight')}
      />
      {[-3.5, 3.5].map((x) => (
        <group key={x}>
          <Box position={[x, 0.2, -0.15]} size={[0.12, 0.18, 11.9]} material="bronze" />
          <Box position={[x, 0.3, -0.15]} size={[0.06, 0.04, 12]} material="light" cast={false} />
        </group>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          position={[0, 0.2, -5.9 + i * 1.65]}
          size={[7, 0.12, 0.07]}
          material="bronze"
        />
      ))}
      {[-1.8, 0, 1.8].map((x) => (
        <Box key={x} position={[x, 0.2, -0.15]} size={[0.06, 0.12, 11.9]} material="bronze" />
      ))}
      {[-9.7, 9.7].map((x) => (
        <Box
          key={x}
          position={[x, 0.3, -3.6]}
          size={[2.4, 0.65, 3.1]}
          material="stone"
          object={object(`roof_service_${x}`, 'Rooftop service enclosure', 'Roof section')}
        />
      ))}
    </group>
  );
}
export function Landscape() {
  const tiles = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8e8678';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#736c62';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(0, 0, 256, 128);
    ctx.strokeRect(-128, 128, 256, 128);
    ctx.strokeRect(128, 128, 256, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(100, 100);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => tiles.dispose(), [tiles]);
  return (
    <group name="ground_and_landscape">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#504c44" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={tiles} roughness={0.65} color="#9d9180" />
      </mesh>
      <Box
        position={[0, 0.16, 0]}
        size={[29, 0.55, 19]}
        material="slab"
        object={object('arrival_platform', 'Raised arrival plaza', 'Pathway')}
      />
      <Box position={[0, 0.48, 0]} size={[26.5, 0.16, 16]} material="floor" />
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i}>
          <Box
            position={[0, 0.08 + i * 0.14, 11.3 - i * 0.5]}
            size={[9, 0.16, 0.58]}
            material="slab"
            object={object(`entry_step_${i}`, 'Main entrance steps', 'Entrance')}
          />
          <Box
            position={[0, 0.16 + i * 0.14, 11.55 - i * 0.5]}
            size={[8.95, 0.025, 0.035]}
            material="light"
            cast={false}
          />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * 10.3, 0.48, 9.1]}
            size={[8, 0.45, 1.7]}
            material="stone"
            object={object(`landscape_bed_${side}`, 'Planted entrance terrace', 'Landscaping')}
          />
          <Box position={[side * 10.3, 0.72, 9.1]} size={[7.7, 0.04, 1.4]} material="earth" />
          {[6.9, 9.5, 12.5].map((x, i) => (
            <Plant
              key={x}
              position={[side * x, 0.72, 9]}
              scale={i === 1 ? 1 : 0.7}
              tree={i === 1}
            />
          ))}
          {[-6, 1.5, 6].map((z, i) => (
            <Plant key={z} position={[side * 13.5, 0.45, z]} scale={0.8 + i * 0.12} tree />
          ))}
          {[7, 10, 13].map((x) => (
            <group key={x}>
              <Box position={[side * x, 0.5, 12]} size={[0.13, 1.15, 0.13]} material="bronze" />
              <Box
                position={[side * x, 1.08, 12]}
                size={[0.14, 0.22, 0.14]}
                material="light"
                cast={false}
              />
            </group>
          ))}
        </group>
      ))}
      <Box position={[0, 0.025, 9.7]} size={[28, 0.035, 0.04]} material="light" cast={false} />
    </group>
  );
}
function ExternalModel() {
  const { invalidate } = useThree();
  const url = process.env.NEXT_PUBLIC_BUILDING_MODEL_URL!;
  const gltf = useGLTF(url, true, true);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const s = useExplorer();
  useEffect(() => {
    scene.traverse((o) => {
      if (/^floor_[0-2]$/.test(o.name)) {
        const floor = Number(o.name.split('_')[1]);
        if (Number.isFinite(floor)) {
          o.visible = s.floor === 'all' || s.floor === 'roof' || s.floor === floor;
          gsap.to(o.position, {
            y: floor * FLOOR_HEIGHT + (s.exploded ? floor * 5 : 0),
            duration: 0.8,
            onUpdate: invalidate,
          });
        }
      }
      if (o.name === 'roof') o.visible = s.roofVisible;
    });
  }, [scene, s.floor, s.exploded, s.roofVisible]);
  return (
    <primitive
      object={scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        let node: THREE.Object3D | null = e.object;
        while (node) {
          const unit = s.units.find((u) => u.meshId === node!.name);
          if (unit) {
            s.select(unit.id);
            e.stopPropagation();
            return;
          }
          node = node.parent;
        }
      }}
    />
  );
}
export function BuildingModel() {
  return process.env.NEXT_PUBLIC_BUILDING_MODEL_URL ? (
    <ExternalModel />
  ) : (
    <group name="building">
      <MaterialDetail />
      <FloorLevel floor={0} />
      <FloorLevel floor={1} />
      <FloorLevel floor={2} />
      <Roof />
    </group>
  );
}
