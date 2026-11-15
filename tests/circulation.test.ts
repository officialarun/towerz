import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BUILDING, floorElevation, unitLayout, type PlanRect } from '@/data/building';
import { DEMO_UNITS } from '@/data/demo';
import { circulationPlan, flightFootprint } from '@/lib/three/circulation';
import { createSiteModel } from '@/lib/three/site-model';
import { syncSiteModel, stopSiteMotion } from '@/lib/three/site-state';
import { useExplorer } from '@/store/explorer';

let site: ReturnType<typeof createSiteModel> | undefined;
function model() {
  site = createSiteModel(DEMO_UNITS, 'compatibility');
  syncSiteModel(
    site,
    { ...useExplorer.getInitialState(), buildingView: 'proposed' },
    undefined,
    () => {},
    true,
  );
  site.scene.updateMatrixWorld(true);
  return site;
}
afterEach(() => {
  if (site) {
    stopSiteMotion(site);
    site.dispose();
    site = undefined;
  }
});
function overlaps(a: PlanRect, b: PlanRect) {
  return (
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1e-6 &&
    Math.min(a.front, b.front) - Math.max(a.rear, b.rear) > 1e-6
  );
}
function contains(r: PlanRect, x: number, z: number) {
  return x >= r.left - 1e-6 && x <= r.right + 1e-6 && z >= r.rear - 1e-6 && z <= r.front + 1e-6;
}

describe('connected pedestrian circulation', () => {
  it('keeps an open ground setback and recesses both separate front flights behind the column line', () => {
    const front = circulationPlan().flights.filter((f) => f.id.startsWith('front'));
    expect(front).toHaveLength(2);
    expect(BUILDING.forecourt.front - BUILDING.columns.z.at(-1)!).toBeGreaterThan(6);
    for (const flight of front) {
      expect(flight.start[1]).toBe(0);
      expect(flight.start[2]).toBeLessThan(BUILDING.columns.z.at(-1)!);
      expect(flight.end[1]).toBeCloseTo(floorElevation(1));
      expect(flight.end[2]).toBeCloseTo(BUILDING.walkway.front);
      expect(flight.steps).toBe(16);
    }
    expect(overlaps(flightFootprint(front[0]), flightFootprint(front[1]))).toBe(false);
    expect(
      new Set(
        BUILDING.columns.x.slice(1).map((x, i) => Number((x - BUILDING.columns.x[i]).toFixed(2))),
      ).size,
    ).toBeGreaterThan(1);
  });

  it('joins every stair endpoint to grade, a floor walkway or a same-height landing', () => {
    const plan = circulationPlan();
    for (const flight of plan.flights)
      for (const [x, y, z] of [flight.start, flight.end]) {
        const landing = plan.landings.some(
          (l) => Math.abs(l.elevation - y) < 1e-6 && contains(l, x, z),
        );
        const walkway =
          BUILDING.levels.some((level) => Math.abs(level - y) < 1e-6) &&
          contains({ left: -13, right: 13, ...BUILDING.walkway }, x, z);
        const grade =
          Math.abs(y) < 1e-6 && z >= BUILDING.forecourt.rear && z <= BUILDING.forecourt.front;
        expect(
          landing || walkway || grade,
          `${flight.id}: disconnected endpoint ${x},${y},${z}`,
        ).toBe(true);
      }
    for (const side of ['left', 'right'])
      for (const floor of [1, 2]) {
        const flights = plan.flights.filter((f) => f.id.startsWith(`${side}_stair_${floor}_`));
        expect(flights).toHaveLength(2);
        const a = flights[0],
          b = flights[1];
        expect(a.end[1]).toBeCloseTo(b.start[1]);
        expect(b.end[1]).toBeCloseTo(floorElevation(floor + 1));
        const firstDirection = new THREE.Vector3(...a.end).sub(new THREE.Vector3(...a.start));
        const returnDirection = new THREE.Vector3(...b.end).sub(new THREE.Vector3(...b.start));
        expect(
          firstDirection.x * returnDirection.x + firstDirection.z * returnDirection.z,
        ).toBeLessThan(0);
      }
  });

  it('keeps all flights clear of columns and all commercial footprints', () => {
    for (const flight of circulationPlan().flights) {
      const footprint = flightFootprint(flight);
      for (const x of BUILDING.columns.x)
        for (const z of BUILDING.columns.z) {
          const radius = BUILDING.columns.width / 2;
          expect(
            overlaps(footprint, {
              left: x - radius,
              right: x + radius,
              rear: z - radius,
              front: z + radius,
            }),
            `${flight.id}: column clash at ${x},${z}`,
          ).toBe(false);
        }
      for (let slot = 0; slot < 8; slot++) {
        const u = unitLayout(slot);
        expect(
          overlaps(footprint, {
            left: u.x - u.width / 2,
            right: u.x + u.width / 2,
            rear: u.z - u.depth / 2,
            front: u.z + u.depth / 2,
          }),
          `${flight.id}: unit ${slot} clash`,
        ).toBe(false);
      }
    }
  });

  it('keeps the front walkway, central corridor and cross-passage outside shop volumes', () => {
    for (let slot = 0; slot < 8; slot++) {
      const u = unitLayout(slot),
        footprint = {
          left: u.x - u.width / 2,
          right: u.x + u.width / 2,
          rear: u.z - u.depth / 2,
          front: u.z + u.depth / 2,
        };
      for (const path of [
        BUILDING.corridor,
        { left: -13, right: 13, ...BUILDING.walkway },
        { left: -13, right: 13, ...BUILDING.crossPassage },
      ])
        expect(overlaps(footprint, path)).toBe(false);
    }
    expect(BUILDING.walkway.front - BUILDING.walkway.rear).toBeGreaterThan(1.5);
    expect(BUILDING.basementAccess.provisional).toBe(true);
    expect(BUILDING.rightStair.provisional).toBe(true);
  });

  it('keeps neighbouring context and its awnings outside the exposed stair footprint', () => {
    const current = model();
    for (const id of ['cream_neighbour', 'pink_neighbour', 'unfinished_neighbour']) {
      const bounds = new THREE.Box3().setFromObject(current.scene.getObjectByName(id)!);
      for (const flight of current.circulation.flights.filter((f) => f.id.startsWith('left'))) {
        expect(
          overlaps(flightFootprint(flight), {
            left: bounds.min.x,
            right: bounds.max.x,
            rear: bounds.min.z,
            front: bounds.max.z,
          }),
          `${id}: context overlaps ${flight.id}`,
        ).toBe(false);
      }
    }
  });

  it('joins the top of the basement descent directly to forecourt paving', () => {
    const current = model();
    const access = current.circulation.flights.find((f) => f.id === 'basement_access_stair')!;
    const [x, y, z] = access.start;
    const paving = current.scene.getObjectByName('open_ground_setback')!;
    const ray = new THREE.Raycaster(
      new THREE.Vector3(x, y + 0.25, z + 0.005),
      new THREE.Vector3(0, -1, 0),
      0,
      0.3,
    );
    expect(ray.intersectObject(paving, true)).not.toHaveLength(0);
  });

  it('leaves real slab openings and clear head space above the stair routes', () => {
    const current = model();
    const structures = current.pickables.filter((m) =>
      ['Floor slab', 'RCC beam', 'Column', 'Landing', 'Roof slab'].includes(
        m.userData.inspection?.type,
      ),
    );
    for (const flight of current.circulation.flights)
      for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const upward = flight.start[1] < flight.end[1];
        const start = upward ? flight.start : flight.end,
          end = upward ? flight.end : flight.start;
        const step = Math.ceil(t * flight.steps);
        const point = new THREE.Vector3(
          start[0] + (end[0] - start[0]) * t,
          start[1] + ((end[1] - start[1]) * step) / flight.steps + 0.02,
          start[2] + (end[2] - start[2]) * t,
        );
        const ray = new THREE.Raycaster(point, new THREE.Vector3(0, 1, 0), 0.001, 1.8);
        const hits = ray.intersectObjects(structures, false).filter((h) => {
          let node: THREE.Object3D | null = h.object;
          while (node) {
            if (!node.visible) return false;
            node = node.parent;
          }
          return true;
        });
        expect(
          hits.map((h) => h.object.name),
          `${flight.id}: blocked stair head space at ${t}`,
        ).toEqual([]);
      }
  });

  it('provides clear recessed shop door openings and an ATM inside its basement bay', () => {
    const current = model();
    for (const unit of DEMO_UNITS) {
      const layout = unitLayout(unit.slot),
        y = floorElevation(unit.floor) + 1.65;
      const shop = current.proposedFloors[unit.floor].getObjectByName(`${unit.meshId}_concept`)!;
      const direction = layout.x < 0 ? -1 : 1;
      const inner = Math.abs(layout.x) - layout.width / 2;
      const ray = new THREE.Raycaster(
        new THREE.Vector3(0, y, layout.z),
        new THREE.Vector3(direction, 0, 0),
        0.01,
        inner + 0.25,
      );
      expect(ray.intersectObject(shop, true), `Blocked door for ${unit.id}`).toHaveLength(0);
    }
    const atm = current.scene.getObjectByName('basement_atm_provision')!;
    const bounds = new THREE.Box3().setFromObject(atm),
      bay = unitLayout(4);
    expect(bounds.min.x).toBeGreaterThan(bay.x - bay.width / 2);
    expect(bounds.max.x).toBeLessThan(bay.x + bay.width / 2);
    expect(bounds.min.z).toBeGreaterThan(bay.z - bay.depth / 2);
    expect(bounds.max.z).toBeLessThan(bay.z + bay.depth / 2);
    expect(bounds.min.y).toBeCloseTo(floorElevation(0));
  });
});
