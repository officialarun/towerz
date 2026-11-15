import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import roadFontData from 'three/examples/fonts/helvetiker_bold.typeface.json';
import { BASE_HEIGHT, FLOOR_HEIGHT, STATUS_COLORS, unitPosition } from '@/data/demo';
import { BUILDING, ROOF_ELEVATION, slabOpenings, unitLayout, type PlanRect } from '@/data/building';
import { circulationPlan, type StairFlight } from './circulation';
import type { ArchitecturalObject, Unit } from '@/types';

type Point = [number, number, number];
type BoxPart = { position: Point; size: Point; rotation?: Point };
export type SiteQuality = 'enhanced' | 'compatibility';
const roadFont = new FontLoader().parse(roadFontData);

/**
 * A screenshot-guided reconstruction, not a surveyed architectural model.
 * Front/SH15 is +Z; the photographed neighbours are -X and shrine/tree +X.
 * Unit IDs/positions deliberately retain the editable demonstration inventory.
 */
export function createSiteModel(units: Unit[], quality: SiteQuality) {
  const enhanced = quality === 'enhanced';
  const scene = new THREE.Scene();
  scene.name = 'inayat_nagar_site_reconstruction';
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const pickables: THREE.Mesh[] = [];
  const cube = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const crownGeometry = ownGeometry(new THREE.IcosahedronGeometry(1, enhanced ? 2 : 1));
  const stoneGeometry = ownGeometry(new THREE.IcosahedronGeometry(1, 0));
  const cylinderGeometry = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, enhanced ? 8 : 5));
  const coneGeometry = ownGeometry(new THREE.ConeGeometry(1, 1, enhanced ? 16 : 8));
  const dummy = new THREE.Object3D();
  const seed = (n: number) => {
    const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  if (enhanced) {
    // Break smooth canopy outlines without a large foliage texture or extra draw calls.
    const positions = crownGeometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        z = positions.getZ(i);
      const roughness =
        1 + 0.09 * Math.sin(x * 23 + y * 17 + z * 31) * Math.sin(x * 11 - y * 29 + z * 19);
      positions.setXYZ(i, x * roughness, y * roughness, z * roughness);
    }
    positions.needsUpdate = true;
  }

  function ownGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
    geometries.add(geometry);
    return geometry;
  }
  function ownMaterial<T extends THREE.Material>(material: T): T {
    materials.add(material);
    return material;
  }
  function surface(color: string, roughness = 0.92, metalness = 0) {
    return ownMaterial(
      enhanced
        ? new THREE.MeshStandardMaterial({ color, roughness, metalness })
        : new THREE.MeshLambertMaterial({ color }),
    );
  }
  // Small deterministic texture provides a broken concrete/asphalt surface without assets.
  function noiseTexture(scale: number) {
    const data = new Uint8Array(64 * 64 * 4);
    for (let i = 0; i < 64 * 64; i++) {
      const value = 105 + Math.floor(seed(i + scale) * 54);
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = value;
      data[i * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, 64, 64, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(scale, scale);
    texture.needsUpdate = true;
    textures.add(texture);
    return texture;
  }
  const mat = {
    concrete: surface('#a59f8c'),
    edge: surface('#b6af9b'),
    underside: surface('#8d8978'),
    floor: surface('#9c9786'),
    soil: surface('#aa9778'),
    soilDark: surface('#8c785b'),
    soilLight: surface('#b4a082'),
    asphalt: surface('#626463'),
    asphaltPatch: surface('#575a59'),
    white: surface('#d6d2be'),
    black: surface('#343b39'),
    yellow: surface('#c7a04d', 0.8),
    rail: surface('#93968b', 0.55, 0.35),
    rust: surface('#6c4933', 0.85, 0.25),
    wood: surface('#746047'),
    woodLight: surface('#9b8766'),
    brick: surface('#895f49'),
    brickLight: surface('#a57759'),
    cream: surface('#c9c0a0'),
    pink: surface('#ad837b'),
    pale: surface('#d3cfb8'),
    red: surface('#9b5147'),
    green: surface('#6e8563'),
    leaf: surface('#49663c'),
    leafLight: surface('#597645'),
    leafDark: surface('#364e32'),
    bark: surface('#665d48'),
    shutter: surface('#89938d', 0.65, 0.2),
    dark: surface('#383d38'),
    blue: surface('#405760'),
    police: surface('#4f5a69'),
    teal: surface('#779b8f'),
    fascia: surface('#b6b19e'),
    proposedFloor: surface('#bab7a6'),
    circulation: surface('#c3bea8'),
    window: surface('#849995', 0.38, 0.15),
  };
  mat.proposedFloor.polygonOffset = true;
  mat.proposedFloor.polygonOffsetFactor = -1;
  mat.proposedFloor.polygonOffsetUnits = -1;
  mat.circulation.polygonOffset = true;
  mat.circulation.polygonOffsetFactor = -2;
  mat.circulation.polygonOffsetUnits = -2;
  if (enhanced) {
    const concreteNoise = noiseTexture(4);
    const roadNoise = noiseTexture(18);
    for (const material of [mat.concrete, mat.edge, mat.underside, mat.floor]) {
      const standard = material as THREE.MeshStandardMaterial;
      standard.bumpMap = concreteNoise;
      standard.bumpScale = 0.055;
      standard.roughnessMap = concreteNoise;
    }
    const asphalt = mat.asphalt as THREE.MeshStandardMaterial;
    asphalt.bumpMap = roadNoise;
    asphalt.bumpScale = 0.025;
  }
  const glass = ownMaterial(
    enhanced
      ? new THREE.MeshStandardMaterial({
          color: '#849f9a',
          roughness: 0.28,
          metalness: 0.15,
          transparent: true,
          opacity: 0.38,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshLambertMaterial({
          color: '#8caaa3',
          transparent: true,
          opacity: 0.38,
          side: THREE.DoubleSide,
        }),
  );
  const light = ownMaterial(new THREE.MeshBasicMaterial({ color: '#d2bd87' }));
  const hitMaterial = ownMaterial(new THREE.MeshBasicMaterial({ visible: false }));
  const reviewMaterial = surface('#b8babb');

  function information(
    id: string,
    name: string,
    type: string,
    description?: string,
  ): ArchitecturalObject {
    return {
      id,
      name,
      type,
      description:
        description ||
        'Approximate reconstruction from the supplied street views. Position, proportions and construction details are illustrative, not surveyed.',
    };
  }
  function tag<T extends THREE.Object3D>(object: T, inspection: ArchitecturalObject) {
    object.name = inspection.id;
    object.userData.inspection = inspection;
    return object;
  }
  function mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: Point,
    scale: Point,
    inspection?: ArchitecturalObject,
  ) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.scale.set(...scale);
    object.castShadow = enhanced;
    object.receiveShadow = enhanced;
    if (inspection) {
      tag(object, inspection);
      pickables.push(object);
    }
    parent.add(object);
    return object;
  }
  function box(
    parent: THREE.Object3D,
    position: Point,
    size: Point,
    material: THREE.Material = mat.concrete,
    inspection?: ArchitecturalObject,
  ) {
    return mesh(parent, cube, material, position, size, inspection);
  }
  /** Merge repeated roadside/construction pieces into ordinary meshes, including for SVG. */
  function boxes(
    parent: THREE.Object3D,
    parts: BoxPart[],
    material: THREE.Material,
    inspection?: ArchitecturalObject,
  ) {
    if (!parts.length) return;
    const pieces = parts.map((part) => {
      dummy.position.set(...part.position);
      dummy.rotation.set(...(part.rotation || [0, 0, 0]));
      dummy.scale.set(...part.size);
      dummy.updateMatrix();
      return cube.clone().applyMatrix4(dummy.matrix);
    });
    const geometry = mergeGeometries(pieces, false);
    pieces.forEach((piece) => piece.dispose());
    if (!geometry) return;
    return mesh(parent, ownGeometry(geometry), material, [0, 0, 0], [1, 1, 1], inspection);
  }
  function rod(
    parent: THREE.Object3D,
    from: Point,
    to: Point,
    radius: number,
    material: THREE.Material = mat.wood,
  ) {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const delta = b.clone().sub(a);
    const object = mesh(
      parent,
      cylinderGeometry,
      material,
      a.add(b).multiplyScalar(0.5).toArray() as Point,
      [radius, delta.length(), radius],
    );
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return object;
  }
  function slab(
    parent: THREE.Object3D,
    y: number,
    thickness: number,
    holes: PlanRect[],
    material: THREE.Material,
    id: string,
  ) {
    const bounds = BUILDING.slab;
    const xs = [
      ...new Set([bounds.left, bounds.right, ...holes.flatMap((h) => [h.left, h.right])]),
    ].sort((a, b) => a - b);
    const zs = [
      ...new Set([bounds.rear, bounds.front, ...holes.flatMap((h) => [h.rear, h.front])]),
    ].sort((a, b) => a - b);
    const parts: BoxPart[] = [];
    for (let i = 0; i < xs.length - 1; i++)
      for (let j = 0; j < zs.length - 1; j++) {
        const x = (xs[i] + xs[i + 1]) / 2,
          z = (zs[j] + zs[j + 1]) / 2;
        if (holes.some((h) => x > h.left && x < h.right && z > h.rear && z < h.front)) continue;
        parts.push({
          position: [x, y, z],
          size: [xs[i + 1] - xs[i], thickness, zs[j + 1] - zs[j]],
        });
      }
    const object = boxes(
      parent,
      parts,
      material,
      information(id, 'RCC slab with circulation openings', 'Floor slab'),
    );
    if (object) object.userData.openings = holes;
    return object;
  }
  function stairFlight(parent: THREE.Object3D, flight: StairFlight, originY: number) {
    const [start, end] =
      flight.start[1] < flight.end[1] ? [flight.start, flight.end] : [flight.end, flight.start];
    const dx = end[0] - start[0],
      dz = end[2] - start[2],
      rise = end[1] - start[1];
    const run = Math.hypot(dx, dz),
      tread = run / flight.steps,
      riser = rise / flight.steps;
    const alongX = Math.abs(dx) > Math.abs(dz);
    const steps: BoxPart[] = [];
    for (let i = 0; i < flight.steps; i++) {
      const t = (i + 0.5) / flight.steps,
        y = start[1] + (i + 1) * riser - originY;
      steps.push({
        position: [start[0] + dx * t, y - 0.08, start[2] + dz * t],
        size: alongX ? [tread + 0.005, 0.16, flight.width] : [flight.width, 0.16, tread + 0.005],
      });
      const edge = i / flight.steps;
      steps.push({
        position: [
          start[0] + dx * edge,
          start[1] + (i + 0.5) * riser - originY,
          start[2] + dz * edge,
        ],
        size: alongX ? [0.035, riser, flight.width] : [flight.width, riser, 0.035],
      });
    }
    const info = information(
      flight.id,
      flight.id.startsWith('front')
        ? 'Broad front stair to raised ground'
        : flight.id.startsWith('basement')
          ? 'Separate semi-basement access stair'
          : flight.id.startsWith('left')
            ? 'Left turning stair flight'
            : 'Recessed right turning stair flight',
      'Staircase',
      flight.provisional
        ? 'Provisional pedestrian access configuration: location and dimensions require floor-plan confirmation. No vehicle ramp is proposed.'
        : 'Photo-guided position with consistent treads, risers, a concrete waist and connected landings. Dimensions remain provisional.',
    );
    const object = boxes(parent, steps, mat.concrete, info);
    if (object) object.userData.flight = flight;
    const waist = box(
      parent,
      [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 - originY - 0.14, (start[2] + end[2]) / 2],
      alongX
        ? [Math.hypot(run, rise), 0.18, flight.width]
        : [flight.width, 0.18, Math.hypot(run, rise)],
      mat.underside,
    );
    if (alongX) waist.rotation.z = Math.atan2(rise, dx);
    else waist.rotation.x = -Math.atan2(rise, dz);
  }
  function group(parent: THREE.Object3D, name: string) {
    const object = new THREE.Group();
    object.name = name;
    parent.add(object);
    return object;
  }

  const roads = group(scene, 'road_context');
  const contextLandmarks = group(scene, 'context_landmarks');
  const constructionDetails = group(scene, 'current_construction_details');
  const proposedDetails = group(scene, 'conceptual_finished_details');
  proposedDetails.visible = false;
  const constructionFloors: THREE.Group[] = [];
  const proposedFloors: THREE.Group[] = [];
  const floors: THREE.Group[] = [];
  const covers: THREE.Group[] = [];
  const circulationFloors: THREE.Group[] = [];
  const unitMeshes = new Map<
    string,
    { group: THREE.Group; highlight: THREE.Mesh; marker: THREE.Mesh }
  >();

  // Keep the site forecourt at grade. Only the building and a narrow pedestrian stair are cut out.
  const access = BUILDING.basementAccess;
  const trenchLeft = access.x - access.width / 2 - 0.2,
    trenchRight = access.x + access.width / 2 + 0.2;
  const trenchFront = access.lowerZ + access.steps * access.tread;
  const groundParts: BoxPart[] = [
    { position: [-46.15, -0.32, 13], size: [65.7, 0.48, 112] },
    { position: [46.15, -0.32, 13], size: [65.7, 0.48, 112] },
    { position: [0, -0.32, -25.3], size: [26.6, 0.48, 35.4] },
    { position: [0, -0.32, (trenchFront + 69) / 2], size: [26.6, 0.48, 69 - trenchFront] },
    {
      position: [(-13.3 + trenchLeft) / 2, -0.32, (9.5 + trenchFront) / 2],
      size: [trenchLeft + 13.3, 0.48, trenchFront - 9.5],
    },
    {
      position: [(13.3 + trenchRight) / 2, -0.32, (9.5 + trenchFront) / 2],
      size: [13.3 - trenchRight, 0.48, trenchFront - 9.5],
    },
  ];
  for (const part of groundParts) {
    const ground = box(scene, part.position, part.size, mat.soil);
    ground.name = 'road_grade_terrain';
    ground.renderOrder = -100;
  }
  const forecourt = group(scene, 'open_forecourt');
  forecourt.userData.bounds = { left: -13, right: 13, rear: 9.5, front: BUILDING.forecourt.front };
  const pavingParts: BoxPart[] = [
    {
      position: [(-13 + trenchLeft) / 2, -0.01, (9.5 + trenchFront) / 2],
      size: [trenchLeft + 13, 0.06, trenchFront - 9.5],
    },
    {
      position: [(13 + trenchRight) / 2, -0.01, (9.5 + trenchFront) / 2],
      size: [13 - trenchRight, 0.06, trenchFront - 9.5],
    },
    {
      position: [0, -0.01, (trenchFront + BUILDING.forecourt.front) / 2],
      size: [26, 0.06, BUILDING.forecourt.front - trenchFront],
    },
  ];
  boxes(
    forecourt,
    pavingParts,
    mat.soilLight,
    information(
      'open_ground_setback',
      'Open pedestrian forecourt',
      'Site approach',
      'Road → open ground setback → front column line → recessed stairs. This is at road grade, not a raised podium.',
    ),
  )!.renderOrder = -98;
  const forecourtPaving = boxes(
    proposedDetails,
    pavingParts,
    mat.proposedFloor,
    information('forecourt_paving', 'Forecourt paving at existing grade', 'Concept finish'),
  )!;
  forecourtPaving.position.y = 0.02;
  forecourtPaving.renderOrder = -97;
  const basementAccess = group(scene, 'basement_access');
  for (const x of [trenchLeft - 0.08, trenchRight + 0.08])
    box(
      basementAccess,
      [x, BASE_HEIGHT / 2, (9.25 + trenchFront) / 2],
      [0.16, -BASE_HEIGHT, trenchFront - 9.25],
      mat.concrete,
      information(
        `basement_retaining_wall_${x}`,
        'Local basement stair cheek wall',
        'Access wall',
        'A narrow provisional pedestrian access, without a full-width forecourt excavation.',
      ),
    );
  for (const x of [-13.15, 13.15])
    box(scene, [x, BASE_HEIGHT / 2, 1], [0.25, -BASE_HEIGHT, 16.5], mat.concrete);
  box(scene, [0, BASE_HEIGHT / 2, -7.4], [26.5, -BASE_HEIGHT, 0.25], mat.concrete);

  // A full rectangular RCC frame; the central strip is circulation, not a roof opening.
  const columns = BUILDING.columns.x;
  const columnRows = BUILDING.columns.z;
  for (let floor = 0; floor < BUILDING.levels.length; floor++) {
    const level = group(scene, `floor_${floor}`);
    level.position.y = BASE_HEIGHT + floor * FLOOR_HEIGHT;
    level.userData.floor = floor;
    floors.push(level);
    const circulation = group(scene, `circulation_floor_${floor}`);
    circulation.position.y = level.position.y;
    circulationFloors.push(circulation);
    const cap = group(level, `ceilings_${floor}`);
    covers.push(cap);
    const raw = group(constructionDetails, `construction_floor_${floor}`);
    const finished = group(proposedDetails, `proposed_floor_${floor}`);
    raw.position.y = finished.position.y = level.position.y;
    raw.userData.floor = finished.userData.floor = floor;
    constructionFloors.push(raw);
    proposedFloors.push(finished);
    slab(
      level,
      -BUILDING.slab.thickness / 2,
      BUILDING.slab.thickness,
      slabOpenings(floor),
      mat.floor,
      `floor_${floor}_slab`,
    );
    slab(
      cap,
      FLOOR_HEIGHT - 0.32,
      0.04,
      slabOpenings(floor + 1),
      mat.edge,
      `floor_${floor}_ceiling`,
    );
    const beams: BoxPart[] = [];
    for (const z of columnRows)
      beams.push({ position: [0, FLOOR_HEIGHT - 0.42, z], size: [25.7, 0.5, 0.48] });
    for (const x of columns)
      beams.push({ position: [x, FLOOR_HEIGHT - 0.42, 1.15], size: [0.46, 0.5, 15.7] });
    boxes(
      level,
      beams,
      mat.underside,
      information(`floor_${floor}_beams`, 'Exposed concrete beam grid', 'RCC beam'),
    );
    for (const x of columns)
      for (const z of columnRows)
        box(
          level,
          [x, (FLOOR_HEIGHT - 0.42) / 2, z],
          [BUILDING.columns.width, FLOOR_HEIGHT - 0.42, BUILDING.columns.width],
          mat.concrete,
          information(`floor_${floor}_column_${x}_${z}`, 'RCC frame column', 'Column'),
        );

    // Minimal current brickwork: the photographed bays remain largely open.
    box(
      raw,
      [0, 0.62, -6.82],
      [24.1, 1.24, 0.18],
      mat.brick,
      information(`floor_${floor}_unfinished_infill`, 'Unfinished rear brick infill', 'Brickwork'),
    );
    box(raw, [12.2, 0.42, -3.5], [0.16, 0.84, 6.5], mat.brickLight);
    if (floor === 1 || floor === BUILDING.levels.length - 1) {
      const props: BoxPart[] = [];
      for (let i = 0; i < (enhanced ? 42 : 24); i++) {
        const x = -11.5 + seed(i * 5 + 2) * 23;
        const z = -5.9 + seed(i * 7 + 3) * 12;
        props.push({
          position: [x, (FLOOR_HEIGHT - 0.5) / 2, z],
          size: [0.095, FLOOR_HEIGHT - 0.5, 0.09],
          rotation: [(seed(i + 55) - 0.5) * 0.12, 0, (seed(i + 11) - 0.5) * 0.18],
        });
      }
      for (let i = 0; i < 7; i++)
        props.push({
          position: [-10.6 + i * 3.5, FLOOR_HEIGHT - 0.58, 0],
          size: [0.15, 0.16, 12.8],
        });
      boxes(
        raw,
        props,
        mat.wood,
        information(
          `timber_formwork_supports_${floor}`,
          'Timber slab supports',
          'Temporary construction',
        ),
      );
      const bars: BoxPart[] = [];
      for (const x of columns)
        for (const z of columnRows) {
          for (const dx of [-0.13, 0.13])
            for (const dz of [-0.13, 0.13])
              bars.push({
                position: [x + dx, FLOOR_HEIGHT + 1.42, z + dz],
                size: [0.025, 2.95, 0.025],
              });
          for (const height of [0.35, 1.1, 1.9, 2.6]) {
            bars.push({
              position: [x, FLOOR_HEIGHT + height, z - 0.14],
              size: [0.32, 0.024, 0.024],
            });
            bars.push({
              position: [x, FLOOR_HEIGHT + height, z + 0.14],
              size: [0.32, 0.024, 0.024],
            });
            bars.push({
              position: [x - 0.14, FLOOR_HEIGHT + height, z],
              size: [0.024, 0.024, 0.32],
            });
            bars.push({
              position: [x + 0.14, FLOOR_HEIGHT + height, z],
              size: [0.024, 0.024, 0.32],
            });
          }
        }
      boxes(
        raw,
        bars,
        mat.rust,
        information(
          `exposed_roof_rebar_${floor}`,
          'Exposed reinforcing bars above slab',
          'Reinforcement',
        ),
      );
    }

    // The concept adds practical glazing and painted fascia, retaining the RCC footprint.
    slab(finished, -0.01, 0.02, slabOpenings(floor), mat.proposedFloor, `floor_${floor}_finish`);
    box(
      finished,
      [0, FLOOR_HEIGHT - 0.47, 9.32],
      [26, 0.54, 0.16],
      mat.fascia,
      information(
        `floor_${floor}_concept_fascia`,
        'Conceptual retail signage band',
        'Signage area',
        'A restrained, unbranded signage area in the finished concept; not an approved elevation.',
      ),
    );
    box(finished, [0, 0.62, -7.07], [25, 1.24, 0.16], mat.pale);
    for (const x of [-12.6, 12.6]) box(finished, [x, 1.65, -2.45], [0.16, 3.3, 9.2], mat.cream);
    // Side stairs open onto the shared front walkway; no barrier crosses its arrivals.
    if (floor > 1) {
      const railing: BoxPart[] = [];
      for (let x = -12.5; x <= 12.5; x += 1.45)
        railing.push({ position: [x, 0.55, 9.25], size: [0.045, 1.1, 0.045] });
      railing.push({ position: [0, 1.1, 9.25], size: [25, 0.05, 0.05] });
      boxes(
        finished,
        railing,
        mat.dark,
        information(`floor_${floor}_concept_rail`, 'Upper frontage railing', 'Railing'),
      );
    }
    const walk = BUILDING.walkway,
      passage = BUILDING.crossPassage;
    box(
      circulation,
      [0, -0.019, (walk.rear + walk.front) / 2],
      [26, 0.04, walk.front - walk.rear],
      mat.circulation,
      information(
        `front_walkway_${floor}`,
        'Continuous shared front walkway',
        'Circulation',
        floor === 1
          ? 'Both front stair landings connect here. Shopfronts are recessed behind this clear circulation strip; width is provisional.'
          : 'Shared front circulation connects shop doors to the central corridor and turning-stair landings. Exact widths remain provisional.',
      ),
    );
    box(
      circulation,
      [0, -0.019, 1.125],
      [4, 0.04, 16.25],
      mat.circulation,
      information(
        `internal_corridor_${floor}`,
        'Central internal corridor',
        'Circulation',
        'Connects the front walkway, semi-basement entrance, shop doors and transverse passage.',
      ),
    );
    box(
      circulation,
      [0, -0.019, (passage.rear + passage.front) / 2],
      [26, 0.04, passage.front - passage.rear],
      mat.circulation,
      information(
        `cross_passage_${floor}`,
        'Passage to recessed right stair',
        'Circulation',
        'A clear cross-passage connects the central corridor to the separately configured right stair. Exact layout is provisional.',
      ),
    );
    for (const unit of units.filter((unit) => unit.floor === floor)) {
      const unitGroup = group(level, unit.meshId);
      const [x, , z] = unitPosition(unit);
      const { width: UNIT_WIDTH, depth: UNIT_DEPTH } = unitLayout(unit.slot);
      unitGroup.position.set(x, 0, z);
      unitGroup.userData.unitId = unit.id;
      const plate = box(
        unitGroup,
        [0, 0.002, 0],
        [UNIT_WIDTH - 0.08, 0.004, UNIT_DEPTH - 0.08],
        mat.floor,
        information(
          `${unit.meshId}_footprint`,
          `Demo unit ${unit.id}`,
          'Demonstration unit',
          'Illustrative leasable area. Unit subdivision, dimensions and availability need confirmation against architectural drawings.',
        ),
      );
      plate.userData.unitId = unit.id;
      // An undrawn raycast target keeps the open construction bays selectable.
      const hit = box(
        unitGroup,
        [0, (FLOOR_HEIGHT - 0.65) / 2, 0],
        [UNIT_WIDTH - 0.15, FLOOR_HEIGHT - 0.65, UNIT_DEPTH - 0.1],
        hitMaterial,
      );
      hit.userData.unitId = unit.id;
      hit.userData.inspection = plate.userData.inspection;
      hit.name = `${unit.meshId}_selection_volume`;
      pickables.push(hit);
      const color = new THREE.Color(STATUS_COLORS[unit.status]);
      const markerMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color }));
      const marker = box(
        unitGroup,
        [0, 0.055, UNIT_DEPTH / 2 - 0.08],
        [UNIT_WIDTH - 0.24, 0.045, 0.075],
        markerMaterial,
      );
      marker.userData.unitId = unit.id;
      const highlightMaterial = ownMaterial(
        new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0.9,
        }),
      );
      const highlight = box(
        unitGroup,
        [0, (FLOOR_HEIGHT - 0.55) / 2, 0],
        [UNIT_WIDTH - 0.02, FLOOR_HEIGHT - 0.5, UNIT_DEPTH - 0.02],
        highlightMaterial,
      );
      highlight.visible = false;
      highlight.userData.ignorePicking = true;
      unitMeshes.set(unit.id, { group: unitGroup, highlight, marker });

      const shop = group(finished, `${unit.meshId}_concept`);
      shop.position.set(x, 0, z);
      shop.userData.unitId = unit.id;
      const innerX = (-Math.sign(x) * UNIT_WIDTH) / 2;
      box(shop, [0, 1.5, -UNIT_DEPTH / 2], [UNIT_WIDTH, 3, 0.1], mat.pale);
      const door = BUILDING.shopDoorWidth;
      for (const side of [-1, 1]) {
        const pane = box(
          shop,
          [innerX, 1.55, (side * (UNIT_DEPTH + door)) / 4],
          [0.035, 3.05, (UNIT_DEPTH - door) / 2],
          glass,
          information(
            `${unit.meshId}_concept_glazing_${side}`,
            `Recessed storefront · ${unit.id}`,
            'Conceptual storefront',
            'Glazing stops at a clear door opening from the shared circulation.',
          ),
        );
        pane.userData.unitId = unit.id;
        pickables.push(pane);
      }
      for (const dz of [-UNIT_DEPTH / 2, -door / 2, door / 2, UNIT_DEPTH / 2])
        box(shop, [innerX, 1.55, dz], [0.06, 3.1, 0.06], mat.dark);
      box(shop, [innerX, 2.8, 0], [0.035, 0.55, door], glass);
      box(shop, [innerX, 3.08, 0], [0.1, 0.16, UNIT_DEPTH], mat.fascia);
      if (unit.slot % 4 === 0) {
        for (const side of [-1, 1]) {
          const frontPane = box(
            shop,
            [(side * (UNIT_WIDTH + door)) / 4, 1.55, UNIT_DEPTH / 2],
            [(UNIT_WIDTH - door) / 2, 3.05, 0.04],
            glass,
          );
          frontPane.userData.unitId = unit.id;
          pickables.push(frontPane);
        }
        box(shop, [0, 2.8, UNIT_DEPTH / 2], [door, 0.55, 0.04], glass);
        for (const dx of [-UNIT_WIDTH / 2, -door / 2, door / 2, UNIT_WIDTH / 2])
          box(shop, [dx, 1.55, UNIT_DEPTH / 2], [0.065, 3.1, 0.065], mat.dark);
        box(shop, [0, 3.2, UNIT_DEPTH / 2], [UNIT_WIDTH, 0.28, 0.12], mat.dark);
        box(shop, [0, 3.03, UNIT_DEPTH / 2 + 0.07], [UNIT_WIDTH - 0.3, 0.025, 0.025], light);
      }
    }
  }
  const circulation = circulationPlan();
  for (const flight of circulation.flights)
    stairFlight(
      circulationFloors[flight.ownerFloor],
      flight,
      BASE_HEIGHT + flight.ownerFloor * FLOOR_HEIGHT,
    );
  for (const landing of circulation.landings) {
    const thickness = landing.external ? 0.22 : 0.04;
    box(
      circulationFloors[landing.ownerFloor],
      [
        (landing.left + landing.right) / 2,
        landing.elevation - (BASE_HEIGHT + landing.ownerFloor * FLOOR_HEIGHT) - thickness / 2,
        (landing.rear + landing.front) / 2,
      ],
      [landing.right - landing.left, thickness, landing.front - landing.rear],
      mat.concrete,
      information(
        landing.id,
        landing.id.includes('turn') ? 'Intermediate turning landing' : 'Connected stair landing',
        'Landing',
        landing.provisional
          ? 'Right-side or basement access configuration is provisional until verified floor plans are supplied.'
          : 'Landing meets its stair flight and the shared floor walkway at the same elevation.',
      ),
    );
  }
  // An ATM provision occupies the front-right basement bay, away from its clear door route.
  const atm = group(proposedFloors[0], 'basement_atm_provision');
  tag(
    atm,
    information(
      'basement_atm_provision',
      'SBI ATM provision',
      'Illustrative commercial provision',
      'A provisional ATM fit-out inside basement bay G-05, not a confirmed tenancy. The cabinet does not occupy the central entrance or shop doorway.',
    ),
  );
  const atmZ = unitLayout(4).z - 0.3;
  box(atm, [3, 0.8, atmZ], [0.8, 1.6, 0.5], mat.blue);
  box(atm, [3, 1.15, atmZ + 0.26], [0.55, 0.38, 0.025], mat.dark);
  box(atm, [3, 0.73, atmZ + 0.29], [0.5, 0.12, 0.08], mat.pale);
  box(atm, [3, 1.53, atmZ + 0.27], [0.7, 0.14, 0.025], mat.white);

  const roof = group(scene, 'roof');
  roof.position.y = ROOF_ELEVATION - 0.16;
  box(
    roof,
    [0, 0, 1],
    [26.35, 0.3, 16.8],
    mat.edge,
    information(
      'full_rectangular_roof',
      'Full concrete roof slab',
      'Roof slab',
      'The aligned roof caps a semi-basement and three above-grade commercial levels. Upper floors are extrapolated from the photographed structural grid; dimensions remain provisional.',
    ),
  );
  const proposedRoof = group(proposedDetails, 'proposed_roof_details');
  // Renderer positions these details at the current conceptual roof height.
  proposedRoof.position.y = 0;
  for (const z of [-7.25, 9.25]) box(proposedRoof, [0, 0.44, z], [26.2, 0.7, 0.16], mat.fascia);
  for (const x of [-13, 13]) box(proposedRoof, [x, 0.44, 1], [0.16, 0.7, 16.5], mat.fascia);

  // Construction materials are irregular, sparse and grouped away from the entry routes.
  for (const [i, x, z, size] of [
    [0, -16.4, 11.5, 2],
    [1, 16.2, 12.8, 2.6],
    [2, 15.7, 8.7, 1.5],
  ]) {
    mesh(
      constructionDetails,
      stoneGeometry,
      i === 1 ? mat.soilDark : mat.soilLight,
      [x, size * 0.25, z],
      [size, size * 0.55, size * 0.8],
      information(
        `construction_aggregate_${i}`,
        'Sand and aggregate pile',
        'Construction material',
      ),
    );
  }
  const scraps: BoxPart[] = [];
  const reinforcement: BoxPart[] = [];
  for (let i = 0; i < (enhanced ? 23 : 13); i++) {
    scraps.push({
      position: [-18 + seed(i + 5) * 3, 0.06 + seed(i + 3) * 0.23, 10.3 + seed(i) * 3.2],
      size: [1.5 + seed(i + 2) * 2.5, 0.09, 0.2],
      rotation: [0, seed(i + 33) * 1.2, 0],
    });
    reinforcement.push({
      position: [-14.9 + seed(i + 3) * 1.4, 0.1 + i * 0.013, 8.5],
      size: [0.025, 0.025, 5 + seed(i + 7) * 2],
      rotation: [0, seed(i + 23) * 0.18, 0],
    });
  }
  boxes(
    constructionDetails,
    scraps,
    mat.woodLight,
    information('stacked_formwork', 'Loose formwork timber', 'Construction material'),
  );
  boxes(
    constructionDetails,
    reinforcement,
    mat.rust,
    information('stacked_reinforcement', 'Stacked reinforcing steel', 'Construction material'),
  );
  const rubble: THREE.BufferGeometry[] = [];
  for (let i = 0; i < (enhanced ? 34 : 14); i++) {
    dummy.position.set(-15 + seed(i * 3) * 31, 0.08, 12 + seed(i * 7) * 3.8);
    dummy.scale.set(0.08 + seed(i + 20) * 0.23, 0.1, 0.13 + seed(i + 9) * 0.2);
    dummy.rotation.set(seed(i), seed(i + 2), 0);
    dummy.updateMatrix();
    rubble.push(stoneGeometry.clone().applyMatrix4(dummy.matrix));
  }
  const rubbleGeometry = mergeGeometries(rubble, false);
  rubble.forEach((item) => item.dispose());
  if (rubbleGeometry)
    mesh(constructionDetails, ownGeometry(rubbleGeometry), mat.concrete, [0, 0, 0], [1, 1, 1]);

  function matureTree(
    parent: THREE.Object3D,
    x: number,
    z: number,
    height: number,
    spread: number,
    id: string,
  ) {
    const tree = tag(group(parent, id), information(id, 'Existing mature roadside tree', 'Tree'));
    const trunk = rod(
      tree,
      [x, 0, z],
      [x + 0.35, height * 0.65, z - 0.18],
      spread * 0.09,
      mat.bark,
    );
    trunk.userData.inspection = tree.userData.inspection;
    pickables.push(trunk);
    for (let branch = 0; branch < 5; branch++) {
      const angle = branch * 2.4;
      rod(
        tree,
        [x + 0.2, height * 0.37, z],
        [
          x + Math.sin(angle) * spread * 0.62,
          height * (0.65 + seed(branch) * 0.22),
          z + Math.cos(angle) * spread * 0.55,
        ],
        spread * 0.036,
        mat.bark,
      );
    }
    // Asymmetric overlapping broad crowns avoid the ornamental lollipop silhouette.
    const foliage: THREE.BufferGeometry[][] = [[], [], []];
    for (let i = 0; i < (enhanced ? 50 : 13); i++) {
      const angle = i * 2.39996;
      const radius = Math.sqrt(seed(i + height)) * spread * 0.8;
      dummy.position.set(
        x + Math.sin(angle) * radius,
        height * 0.7 + seed(i + 31) * height * 0.24,
        z + Math.cos(angle) * radius * 0.8,
      );
      dummy.scale.set(
        spread * ((enhanced ? 0.19 : 0.28) + seed(i + 22) * 0.13),
        height * ((enhanced ? 0.11 : 0.16) + seed(i + 49) * 0.1),
        spread * ((enhanced ? 0.2 : 0.3) + seed(i + 74) * 0.15),
      );
      dummy.rotation.set(seed(i), seed(i * 2), seed(i * 3));
      dummy.updateMatrix();
      foliage[i % 3].push(crownGeometry.clone().applyMatrix4(dummy.matrix));
    }
    foliage.forEach((pieces, i) => {
      const geometry = mergeGeometries(pieces, false);
      pieces.forEach((piece) => piece.dispose());
      if (geometry)
        mesh(
          tree,
          ownGeometry(geometry),
          [mat.leaf, mat.leafLight, mat.leafDark][i],
          [0, 0, 0],
          [1, 1, 1],
        );
    });
    return tree;
  }
  matureTree(contextLandmarks, 16.7, 3.5, 13.7, 6.7, 'mature_tree_beside_plaza');
  matureTree(contextLandmarks, 25.6, -6, 11, 5.4, 'rear_roadside_tree');
  matureTree(contextLandmarks, 37, 6, 11, 5, 'right_roadside_tree');
  matureTree(contextLandmarks, 22, 53, 12, 6, 'police_compound_tree');
  matureTree(contextLandmarks, -15, 53, 12.5, 6, 'opposite_road_tree');

  // Small roadside shrine, explicitly visible beside the large tree in the references.
  const shrine = tag(
    group(contextLandmarks, 'roadside_shrine'),
    information('roadside_shrine', 'Small roadside shrine', 'Visible site landmark'),
  );
  box(shrine, [20.1, 0.32, 8.8], [3.4, 0.64, 3.3], mat.concrete);
  box(shrine, [20.1, 1.53, 8.8], [2.8, 1.85, 2.6], mat.pale);
  box(shrine, [20.1, 2.51, 8.8], [3.15, 0.18, 2.95], mat.red);
  box(
    shrine,
    [20.1, 1.34, 10.13],
    [0.8, 1.5, 0.035],
    mat.dark,
    information('shrine_entry', 'Shrine entrance', 'Entrance'),
  );
  mesh(shrine, coneGeometry, mat.pale, [20.1, 4.15, 8.8], [1.42, 3.1, 1.42]);
  mesh(shrine, crownGeometry, mat.yellow, [20.1, 5.8, 8.8], [0.18, 0.32, 0.18]);
  box(shrine, [16.9, 1.09, 9.25], [2.65, 1.8, 2.6], mat.pale);
  box(shrine, [16.9, 2.06, 9.25], [2.95, 0.2, 2.9], mat.red);
  const drain = ownGeometry(
    new THREE.CylinderGeometry(0.82, 0.82, 2.3, enhanced ? 18 : 10, 1, true),
  );
  const drainagePipe = mesh(
    constructionDetails,
    drain,
    mat.concrete,
    [23.4, 0.77, 12.6],
    [1, 1, 1],
    information('roadside_concrete_pipe', 'Concrete drainage pipe', 'Roadside material'),
  );
  drainagePipe.rotation.z = Math.PI / 2;

  function neighbour(
    x: number,
    z: number,
    width: number,
    height: number,
    paint: THREE.Material,
    id: string,
  ) {
    const building = tag(
      group(contextLandmarks, id),
      information(id, 'Existing neighbouring mixed-use building', 'Neighbouring context'),
    );
    box(
      building,
      [x, height / 2, z - 1],
      [width, height, 11.8],
      paint,
      information(`${id}_mass`, 'Neighbouring plastered building', 'Neighbouring context'),
    );
    for (let level = 0; level < 3; level++) {
      const y = (level * height) / 3;
      box(building, [x, y + 0.18, z + 5.1], [width + 0.15, 0.2, 1.25], mat.cream);
      if (level) {
        const balcony: BoxPart[] = [
          { position: [x, y + 1.05, z + 5.68], size: [width - 0.3, 0.09, 0.09] },
        ];
        for (let i = 0; i < 7; i++)
          balcony.push({
            position: [x - width / 2 + 0.3 + (i * (width - 0.6)) / 6, y + 0.6, z + 5.68],
            size: [0.075, 0.9, 0.075],
          });
        boxes(building, balcony, mat.dark);
      }
      for (const side of [-1, 1]) {
        const wx = x + side * width * 0.24;
        box(
          building,
          [wx, y + 1.55, z + 5],
          [width * 0.23, 1.7, 0.12],
          level ? mat.dark : mat.shutter,
        );
        if (level) box(building, [wx, y + 1.5, z + 5.08], [width * 0.18, 1.35, 0.04], mat.window);
      }
    }
    box(building, [x + width * 0.19, height * 0.5, z + 5.08], [0.65, height, 0.2], mat.pale);
    box(building, [x, height + 0.33, z - 1], [width + 0.05, 0.65, 11.8], paint);
    box(building, [x, 2.95, z + 6.1], [width + 0.7, 0.11, 2.7], mat.shutter).rotation.x = 0.08;
    box(building, [x, 2.45, z + 7.3], [width + 0.35, 0.4, 0.12], mat.cream);
  }
  // Leave the exposed return stair clear of the approximate neighbouring masses and awnings.
  const neighbourOffset = BUILDING.leftStair.left - 0.6 - 7.8 / 2 + 19.6;
  neighbour(-19.6 + neighbourOffset, -0.5, 7.8, 10.7, mat.cream, 'cream_neighbour');
  neighbour(-28.2 + neighbourOffset, -0.2, 8.5, 11.6, mat.pink, 'pink_neighbour');
  neighbour(-38 + neighbourOffset, -1.6, 8, 8.8, mat.brick, 'unfinished_neighbour');

  // Unbranded low shops and corrugated canopies indicate the roadside commercial belt.
  function stall(x: number, z: number, width: number, id: string) {
    const object = tag(
      group(contextLandmarks, id),
      information(id, 'Roadside shop / stall', 'Neighbouring context'),
    );
    box(object, [x, 1.15, z], [width, 2.3, 2.8], mat.soilDark);
    box(object, [x, 2.38, z + 0.35], [width + 0.35, 0.12, 4], mat.shutter).rotation.x = -0.06;
    box(object, [x, 1.05, z + 1.44], [width - 0.2, 2.1, 0.04], mat.dark);
    box(object, [x, 0.75, z + 1.63], [width - 0.3, 0.85, 0.48], mat.wood);
    for (const side of [-1, 1])
      rod(
        object,
        [x + (side * width) / 2, 0, z + 2],
        [x + (side * width) / 2, 2.5, z + 2],
        0.045,
        mat.wood,
      );
  }
  stall(-37, 9.8, 4.5, 'left_roadside_stall');
  stall(-31.5, 10, 4.7, 'left_roadside_shop');
  stall(30.4, 10.4, 4.7, 'right_roadside_shop');
  stall(36.1, 10.1, 4.9, 'right_roadside_stall');

  // SH15: broad divided roadway, marked lanes, planted median and practical crash barrier.
  box(
    roads,
    [0, -0.005, 27.9],
    [158, 0.12, 22.8],
    mat.asphalt,
    information(
      'sh15_road_surface',
      'Ayodhya–Raebareli Road / SH15',
      'Road',
      'Approximate divided-road context reconstructed from the supplied street views. Lane widths, junction geometry and distances are not surveyed.',
    ),
  ).renderOrder = -90;
  box(roads, [0, 0.03, 17.5], [158, 0.025, 0.11], mat.white);
  box(roads, [0, 0.03, 38.3], [158, 0.025, 0.11], mat.white);
  // Flat letter meshes also render in SVG and stay attached to the asphalt.
  const roadLettering = group(roads, 'sh15_road_lettering');
  roadLettering.userData.text = 'Ayodhya Raebareli Road SH15';
  const roadPaint = ownMaterial(new THREE.MeshBasicMaterial({
    color: '#f5ead0',
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  }));
  for (const line of [
    { text: 'AYODHYA RAEBARELI ROAD', width: 28, depth: 2.6, z: 20.4 },
    { text: 'SH15', width: 8, depth: 2.4, z: 24.7 },
  ]) {
    const geometry = ownGeometry(new THREE.ShapeGeometry(
      roadFont.generateShapes(line.text, 1), enhanced ? 4 : 2,
    ));
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    const scaleX = line.width / (bounds.max.x - bounds.min.x);
    const scaleY = line.depth / (bounds.max.y - bounds.min.y);
    geometry.translate(-(bounds.min.x + bounds.max.x) / 2, -bounds.min.y, 0);
    geometry.scale(scaleX, scaleY, 1);
    geometry.rotateX(-Math.PI / 2);
    const lettering = mesh(roadLettering, geometry, roadPaint, [1.5, 0.105, line.z], [1, 1, 1]);
    lettering.name = `road_paint_${line.text}`;
    lettering.userData.ignorePicking = true;
  }
  const markings: BoxPart[] = [];
  for (let x = -75; x < 76; x += 8.5)
    for (const z of [21.95, 33.75])
      markings.push({ position: [x, 0.07, z], size: [3.4, 0.015, 0.13] });
  // The photographed junction has a zebra crossing near the site, not a formal forecourt.
  for (let z = 18; z < 26; z += 1.18)
    markings.push({ position: [-15.4, 0.075, z], size: [3.65, 0.017, 0.65] });
  for (let z = 30; z < 38; z += 1.18)
    markings.push({ position: [-15.4, 0.075, z], size: [3.65, 0.017, 0.65] });
  boxes(
    roads,
    markings,
    mat.white,
    information('road_markings', 'Lane markings and pedestrian crossing', 'Road marking'),
  );
  for (const [x, length] of [
    [-48.5, 61],
    [33.5, 91],
  ])
    box(
      roads,
      [x, 0.15, 27.85],
      [length, 0.3, 2.35],
      mat.soilDark,
      information(`planted_median_${x}`, 'Planted road divider', 'Road divider'),
    );
  const curbLight: BoxPart[] = [];
  const curbDark: BoxPart[] = [];
  for (let x = -77; x < 79; x += 2) {
    if (x > -19 && x < -11) continue;
    for (const z of [26.65, 29.05])
      (((x + 77) / 2) % 2 === 0 ? curbLight : curbDark).push({
        position: [x, 0.24, z],
        size: [2, 0.48, 0.3],
      });
  }
  boxes(roads, curbLight, mat.white);
  boxes(roads, curbDark, mat.black);
  const medianPlanting: BoxPart[] = [];
  for (let x = -76; x < 78; x += 2.7) {
    if (x > -20 && x < -10) continue;
    medianPlanting.push({
      position: [x, 0.38 + seed(x + 99) * 0.06, 27.85],
      size: [2.5, 0.24, 1.15],
    });
  }
  boxes(roads, medianPlanting, mat.green);
  const barrier: BoxPart[] = [];
  for (let x = -76; x < 78; x += 4.5) {
    if (x > -19 && x < -11) continue;
    barrier.push({ position: [x, 0.75, 27.25], size: [0.13, 1.25, 0.16] });
  }
  barrier.push({ position: [-48.5, 1.17, 27.25], size: [61, 0.3, 0.13] });
  barrier.push({ position: [33.5, 1.17, 27.25], size: [91, 0.3, 0.13] });
  boxes(
    roads,
    barrier,
    mat.rail,
    information('median_guardrail', 'Median steel guardrail', 'Road safety barrier'),
  );
  // Worn shoulder patches add visual scale without overlaying screenshot imagery.
  for (let i = 0; i < 9; i++)
    box(
      roads,
      [-55 + i * 14, 0.065, 17.05 + seed(i) * 0.2],
      [2 + seed(i) * 5, 0.015, 0.3],
      mat.asphaltPatch,
    );

  function pedestrianFence(z: number, start: number, end: number, gap?: [number, number]) {
    const parts: BoxPart[] = [];
    const hoops: THREE.BufferGeometry[] = [];
    for (let x = start; x < end; x += 1.3) {
      if (gap && x > gap[0] && x < gap[1]) continue;
      parts.push({ position: [x, 0.68, z], size: [0.065, 1.36, 0.065] });
      parts.push({ position: [x + 0.65, 0.27, z], size: [1.3, 0.055, 0.055] });
      parts.push({ position: [x + 0.65, 1.07, z], size: [1.3, 0.055, 0.055] });
      if (enhanced || Math.round(x * 10) % 2 === 0) {
        const curve = new THREE.EllipseCurve(0, 0, 0.3, 0.3, 0, Math.PI, false, 0);
        const points = curve
          .getPoints(enhanced ? 6 : 4)
          .map((point) => new THREE.Vector3(x + 0.65 + point.x, 1.08 + point.y, z));
        for (let p = 1; p < points.length; p++) {
          const a = points[p - 1];
          const b = points[p];
          dummy.position.copy(a).add(b).multiplyScalar(0.5);
          dummy.scale.set(0.04, a.distanceTo(b), 0.04);
          dummy.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            b.clone().sub(a).normalize(),
          );
          dummy.updateMatrix();
          hoops.push(cylinderGeometry.clone().applyMatrix4(dummy.matrix));
        }
      }
    }
    boxes(roads, parts, mat.yellow);
    const geometry = hoops.length ? mergeGeometries(hoops, false) : null;
    hoops.forEach((piece) => piece.dispose());
    if (geometry) mesh(roads, ownGeometry(geometry), mat.yellow, [0, 0, 0], [1, 1, 1]);
  }
  pedestrianFence(15.8, -56, 57, [-12.5, 12.5]);
  pedestrianFence(40.2, -56, 57, [2, 9]);

  // White/red opposite-side compound and a simple sign represent the provided landmark.
  const policeStation = tag(
    group(contextLandmarks, 'inayat_nagar_police_station'),
    information(
      'inayat_nagar_police_station',
      'Inayat Nagar Police Station · opposite plaza',
      'Provided landmark',
      'The police-station relationship is supplied by the project brief and reference street views. This compound placement and appearance are approximate.',
    ),
  );
  box(policeStation, [7, 0.09, 48.3], [36, 0.18, 13], mat.soilLight);
  for (const [x, width] of [
    [-4, 15],
    [19, 14],
  ]) {
    box(policeStation, [x, 1.53, 43.4], [width, 3.05, 0.35], mat.pale);
    box(policeStation, [x, 3.12, 43.4], [width + 0.1, 0.24, 0.45], mat.red);
  }
  for (const x of [3.7, 10.9]) {
    box(policeStation, [x, 1.9, 43.4], [0.6, 3.8, 0.75], mat.pale);
    box(policeStation, [x, 3.88, 43.4], [1, 0.2, 1], mat.red);
  }
  box(
    policeStation,
    [7.3, 3.8, 43.4],
    [7.3, 0.8, 0.3],
    mat.police,
    information('police_station_entry', 'Inayat Nagar Police Station gate', 'Landmark entrance'),
  );
  box(policeStation, [-4.3, 2, 43.17], [9, 1.3, 0.08], mat.teal);
  box(policeStation, [19.2, 2, 43.17], [8, 1.3, 0.08], mat.police);
  box(policeStation, [8, 2.65, 53.6], [17, 5.3, 8.3], mat.cream);
  box(policeStation, [8, 5.36, 53.6], [17.6, 0.22, 8.8], mat.red);
  for (const x of [2, 8, 14]) box(policeStation, [x, 2.35, 49.38], [2.3, 2.3, 0.08], mat.window);

  function utilityPole(x: number, z: number, height: number, id: string) {
    const pole = group(contextLandmarks, id);
    box(
      pole,
      [x, height / 2, z],
      [0.25, height, 0.3],
      mat.concrete,
      information(id, 'Roadside utility pole', 'Utility infrastructure'),
    );
    box(pole, [x, height - 0.8, z], [2.7, 0.12, 0.15], mat.rust);
    for (const dx of [-1, 0, 1])
      box(pole, [x + dx, height - 0.58, z], [0.12, 0.35, 0.12], mat.pale);
  }
  utilityPole(-18, 13.4, 10.6, 'left_electric_pole');
  utilityPole(24.5, 13.7, 11.4, 'right_electric_pole');
  utilityPole(57, 13.5, 10.8, 'far_electric_pole');
  // Slight sag is reconstructed with thin regular cylinders, supported by SVGRenderer.
  for (const offset of [-0.85, 0, 0.85]) {
    const segments = enhanced ? 10 : 6;
    for (const [start, end, h1, h2] of [
      [-18, 24.5, 10.1, 10.9],
      [24.5, 57, 10.9, 10.3],
    ]) {
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        const point = (t: number): Point => [
          start + (end - start) * t,
          h1 + (h2 - h1) * t - Math.sin(t * Math.PI) * 0.9,
          13.6 + offset,
        ];
        rod(contextLandmarks, point(t1), point(t2), 0.014, mat.dark);
      }
    }
  }
  const streetlights: BoxPart[] = [];
  for (const x of [-55, -29, 26, 54]) {
    streetlights.push({ position: [x, 5.6, 28.2], size: [0.13, 11.2, 0.13] });
    streetlights.push({ position: [x, 11.05, 28.2], size: [0.13, 0.11, 5.9] });
    for (const side of [-1, 1])
      box(roads, [x, 11.02, 28.2 + side * 2.8], [0.45, 0.15, 1], mat.dark);
  }
  boxes(
    roads,
    streetlights,
    mat.rail,
    information('sh15_street_lighting', 'Highway street lighting', 'Road infrastructure'),
  );

  // Scene labels are DOM overlays in both renderers; no borrowed screenshot is used here.
  const reviewMeshes: { mesh: THREE.Mesh; original: THREE.Material | THREE.Material[] }[] = [];
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material !== hitMaterial && !object.userData.ignorePicking)
      reviewMeshes.push({ mesh: object, original: object.material });
  });
  return {
    scene,
    floors,
    covers,
    circulationFloors,
    circulation,
    roof,
    unitMeshes,
    pickables,
    constructionDetails,
    proposedDetails,
    roads,
    contextLandmarks,
    constructionFloors,
    proposedFloors,
    proposedRoof,
    setStructuralReview(active: boolean) {
      for (const { mesh, original } of reviewMeshes) mesh.material = active ? reviewMaterial : original;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      scene.clear();
    },
  };
}
