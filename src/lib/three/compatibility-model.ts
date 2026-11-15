import * as THREE from 'three';
import {
  BASE_HEIGHT,
  FLOOR_HEIGHT,
  UNIT_DEPTH,
  UNIT_WIDTH,
  STATUS_COLORS,
  unitPosition,
} from '@/data/demo';
import type { Unit, ArchitecturalObject } from '@/types';
export function createCompatibilityModel(units: Unit[]) {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight('#e8d4b4', 0.55));
  const light = new THREE.DirectionalLight('#fff2d3', 0.85);
  light.position.set(-14, 24, 20);
  scene.add(light);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const foliage = new THREE.IcosahedronGeometry(1, 0);
  const mat = {
    stone: new THREE.MeshLambertMaterial({ color: '#9e907c' }),
    slab: new THREE.MeshLambertMaterial({ color: '#b4a892' }),
    floor: new THREE.MeshLambertMaterial({ color: '#8f8170' }),
    wood: new THREE.MeshLambertMaterial({ color: '#59422c' }),
    dark: new THREE.MeshLambertMaterial({ color: '#353329' }),
    glass: new THREE.MeshLambertMaterial({
      color: '#93aa9b',
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    }),
    warm: new THREE.MeshLambertMaterial({ color: '#cbb28a' }),
    light: new THREE.MeshBasicMaterial({ color: '#ffe0a4' }),
    leaf: new THREE.MeshLambertMaterial({ color: '#52683a' }),
  };
  const materials: THREE.Material[] = Object.values(mat);
  const floors: THREE.Group[] = [];
  const covers: THREE.Group[] = [];
  const unitMeshes = new Map<
    string,
    { group: THREE.Group; highlight: THREE.Mesh; marker: THREE.Mesh }
  >();
  const pickables: THREE.Mesh[] = [];
  function box(
    parent: THREE.Object3D,
    position: THREE.Vector3Tuple,
    size: THREE.Vector3Tuple,
    material: THREE.Material = mat.stone,
    metadata?: ArchitecturalObject,
  ) {
    const mesh = new THREE.Mesh(cube, material);
    mesh.position.set(...position);
    mesh.scale.set(...size);
    parent.add(mesh);
    if (metadata) {
      mesh.name = metadata.id;
      mesh.userData.inspection = metadata;
      pickables.push(mesh);
    }
    return mesh;
  }
  const metadata = (id: string, name: string, type: string): ArchitecturalObject => ({
    id,
    name,
    type,
    description:
      'A simplified component of the demonstration plaza. Verified construction information requires architectural drawings.',
  });
  box(
    scene,
    [0, 0.12, 0],
    [29, 0.5, 19],
    mat.slab,
    metadata('arrival_platform', 'Arrival plaza', 'Pathway'),
  );
  for (let i = 0; i < 5; i++) {
    box(scene, [0, 0.08 + i * 0.14, 11.3 - i * 0.5], [9, 0.16, 0.58], mat.slab);
    box(scene, [0, 0.16 + i * 0.14, 11.55 - i * 0.5], [9, 0.025, 0.04], mat.light);
  }
  function plant(x: number, z: number) {
    box(scene, [x, 0.55, z], [0.85, 0.6, 0.85], mat.stone);
    box(scene, [x, 1.55, z], [0.12, 1.5, 0.12], mat.wood);
    const crown = new THREE.Mesh(foliage, mat.leaf);
    crown.position.set(x, 2.65, z);
    crown.scale.set(0.85, 1.1, 0.85);
    scene.add(crown);
  }
  for (const side of [-1, 1]) {
    for (const z of [-5, 1, 6, 9]) plant(side * 13.1, z);
    for (const x of [7, 10, 13]) {
      box(scene, [side * x, 0.6, 11.8], [0.13, 1.2, 0.13], mat.wood);
      box(scene, [side * x, 1.2, 11.8], [0.14, 0.22, 0.14], mat.light);
    }
  }
  function rail(
    parent: THREE.Object3D,
    x: number,
    z: number,
    length: number,
    alongZ: boolean,
    id: string,
  ) {
    box(
      parent,
      [x, 0.75, z],
      alongZ ? [0.045, 0.045, length] : [length, 0.045, 0.045],
      mat.dark,
      metadata(id, 'Terrace balustrade', 'Railing'),
    );
    for (let i = 0; i <= Math.ceil(length / 2); i++) {
      const p = -length / 2 + (i * length) / Math.ceil(length / 2);
      box(parent, [x + (alongZ ? 0 : p), 0.37, z + (alongZ ? p : 0)], [0.03, 0.75, 0.03], mat.dark);
    }
  }
  for (let f = 0; f < 3; f++) {
    const level = new THREE.Group();
    level.name = `floor_${f}`;
    level.position.y = BASE_HEIGHT + f * FLOOR_HEIGHT;
    scene.add(level);
    floors.push(level);
    const cap = new THREE.Group();
    cap.name = `ceilings_${f}`;
    level.add(cap);
    covers.push(cap);
    for (const side of [-1, 1]) {
      const x = side * 8.15;
      box(
        level,
        [x, -0.19, 0],
        [8.65, 0.38, 14.7],
        mat.slab,
        metadata(`floor_${f}_slab_${side}`, 'Retail floor slab', 'Floor slab'),
      );
      box(
        level,
        [side * 3.6, -0.08, 0],
        [1.1, 0.16, 14.7],
        mat.floor,
        metadata(`floor_${f}_corridor_${side}`, 'Atrium promenade', 'Corridor'),
      );
      box(level, [x, -0.025, 7.35], [8.6, 0.035, 0.035], mat.light);
      box(
        cap,
        [x, 3.96, 0],
        [8.9, 0.38, 14.9],
        mat.slab,
        metadata(`floor_${f}_ceiling_${side}`, 'Upper structural slab', 'Ceiling'),
      );
      for (const z of [-7.25, 7.25]) box(level, [x, 3.96, z], [8.9, 0.38, 0.4], mat.slab);
      for (const cx of [3.8, 12.4]) {
        box(level, [side * cx, 3.96, 0], [0.4, 0.38, 14.1], mat.slab);
        for (const z of [-7.2, -3.5, 0, 3.5, 7.2])
          box(
            level,
            [side * cx, 1.95, z],
            [0.4, 3.9, 0.42],
            mat.stone,
            metadata(`floor_${f}_column_${side}_${cx}_${z}`, 'Stone structural column', 'Column'),
          );
      }
      box(level, [x, 3.76, 7.48], [8.85, 0.045, 0.045], mat.light);
      box(level, [side * 3.65, 3.76, 0], [0.045, 0.045, 14.8], mat.light);
      if (f > 0) {
        rail(level, side * 3.1, 0, 14.5, true, `floor_${f}_rail_${side}`);
        rail(level, x, 7.4, 8.6, false, `floor_${f}_front_rail_${side}`);
      }
    }
    box(level, [0, -0.19, -6.8], [7.7, 0.38, 1.5], mat.slab);
    if (f > 0) rail(level, 0, -6, 6.2, false, `floor_${f}_bridge_rail`);
    if (f < 2)
      for (const side of [-1, 1]) {
        for (let i = 0; i < 22; i++)
          box(
            level,
            [side * 1.9, ((i + 0.5) * FLOOR_HEIGHT) / 22, 4.9 - i * 0.48],
            [2.6, FLOOR_HEIGHT / 22, 0.51],
            mat.slab,
            i === 10
              ? metadata(`stairs_${f}_${side}`, 'Central staircase', 'Staircase')
              : undefined,
          );
        const handrail = box(
          level,
          [side * 3.15, FLOOR_HEIGHT / 2 + 0.8, -0.1],
          [0.045, 0.045, 11.6],
          mat.dark,
        );
        handrail.rotation.x = 0.383;
      }
    for (const unit of units.filter((u) => u.floor === f)) {
      const group = new THREE.Group();
      const [x, , z] = unitPosition(unit);
      group.position.set(x, 0, z);
      group.name = unit.meshId;
      group.userData.unitId = unit.id;
      level.add(group);
      const inner = x < 0 ? UNIT_WIDTH / 2 : -UNIT_WIDTH / 2;
      box(
        group,
        [0, 0.035, 0],
        [UNIT_WIDTH, 0.07, UNIT_DEPTH - 0.04],
        mat.floor,
        metadata(`${unit.meshId}_floor`, 'Unit floor finish', 'Room'),
      );
      box(
        group,
        [-inner, 1.85, 0],
        [0.16, 3.7, UNIT_DEPTH],
        mat.stone,
        metadata(`${unit.meshId}_wall`, 'Exterior stone wall', 'Exterior wall'),
      );
      box(
        group,
        [0, 1.85, -UNIT_DEPTH / 2],
        [UNIT_WIDTH, 3.7, 0.12],
        mat.warm,
        metadata(`${unit.meshId}_partition`, 'Retail partition', 'Interior wall'),
      );
      const storefront = box(
        group,
        [inner, 1.75, 0],
        [0.035, 3.4, UNIT_DEPTH - 0.1],
        mat.glass,
        metadata(`${unit.meshId}_glass`, 'Atrium storefront', 'Window'),
      );
      storefront.userData.unitId = unit.id;
      for (const dz of [-UNIT_DEPTH / 2, UNIT_DEPTH / 2])
        box(group, [inner, 1.8, dz], [0.06, 3.6, 0.06], mat.dark);
      box(group, [inner, 3.5, 0], [0.1, 0.15, UNIT_DEPTH], mat.wood);
      if (unit.slot % 4 === 0) {
        const front = box(group, [0, 1.75, UNIT_DEPTH / 2], [UNIT_WIDTH, 3.4, 0.035], mat.glass);
        front.userData.unitId = unit.id;
        box(group, [0, 3.4, UNIT_DEPTH / 2], [UNIT_WIDTH, 0.4, 0.1], mat.wood);
        for (const dx of [-3, -1, 1, 3])
          box(group, [dx, 1.8, UNIT_DEPTH / 2], [0.05, 3.6, 0.05], mat.dark);
      }
      box(group, [0, 0.5, -0.5], [1.8, 1, 0.7], mat.wood);
      box(group, [-2, 0.45, 0.4], [0.9, 0.9, 0.9], mat.warm);
      const color = new THREE.Color(STATUS_COLORS[unit.status]);
      const markerMaterial = new THREE.MeshBasicMaterial({ color });
      materials.push(markerMaterial);
      const marker = box(
        group,
        [inner - Math.sign(x) * 0.04, 0.045, 0],
        [0.045, 0.045, UNIT_DEPTH - 0.2],
        markerMaterial,
      );
      const highlightMaterial = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      materials.push(highlightMaterial);
      const highlight = box(
        group,
        [0, 1.8, 0],
        [UNIT_WIDTH + 0.03, 3.65, UNIT_DEPTH + 0.03],
        highlightMaterial,
      );
      highlight.visible = false;
      highlight.userData.ignorePicking = true;
      group.traverse((o) => {
        if (o instanceof THREE.Mesh && !o.userData.ignorePicking && !pickables.includes(o))
          pickables.push(o);
      });
      unitMeshes.set(unit.id, { group, highlight, marker });
    }
  }
  const roof = new THREE.Group();
  roof.name = 'roof';
  roof.position.y = BASE_HEIGHT + FLOOR_HEIGHT * 3 - 0.16;
  scene.add(roof);
  for (const side of [-1, 1]) {
    box(
      roof,
      [side * 8.15, 0, 0],
      [9, 0.27, 15.2],
      mat.slab,
      metadata(`roof_section_${side}`, 'Roof terrace', 'Roof section'),
    );
    box(roof, [side * 8.15, 0.28, -7.5], [9, 0.55, 0.18], mat.stone);
    box(roof, [side * 12.6, 0.28, 0], [0.18, 0.55, 15], mat.stone);
    box(roof, [side * 8.15, 0.17, 7.55], [8.9, 0.04, 0.05], mat.light);
  }
  box(
    roof,
    [0, 0.18, -0.15],
    [6.9, 0.1, 11.6],
    mat.glass,
    metadata('roof_skylight', 'Atrium skylight', 'Skylight'),
  );
  for (const x of [-3.5, -1.8, 0, 1.8, 3.5])
    box(roof, [x, 0.2, -0.15], [0.08, 0.12, 11.9], mat.dark);
  for (let i = 0; i < 8; i++) box(roof, [0, 0.2, -5.9 + i * 1.65], [7, 0.1, 0.07], mat.dark);
  return {
    scene,
    floors,
    covers,
    roof,
    unitMeshes,
    pickables,
    dispose() {
      cube.dispose();
      foliage.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
