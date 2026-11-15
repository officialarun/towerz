import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BUILDING } from '@/data/building';
import { BASE_HEIGHT, FLOOR_HEIGHT, DEMO_UNITS } from '@/data/demo';
import { SITE_CONTEXT, SITE_LOCATION } from '@/data/site';
import { createSiteModel } from '@/lib/three/site-model';
import { syncSiteModel, stopSiteMotion } from '@/lib/three/site-state';
import { useExplorer } from '@/store/explorer';
import type { SceneState } from '@/lib/three/camera';

const models: ReturnType<typeof createSiteModel>[] = [];

function model(quality: 'enhanced' | 'compatibility' = 'compatibility') {
  const result = createSiteModel(DEMO_UNITS, quality);
  models.push(result);
  return result;
}

function state(overrides: Partial<SceneState> = {}): SceneState {
  return {
    ...useExplorer.getInitialState(),
    units: DEMO_UNITS,
    floor: 'all',
    buildingView: 'construction',
    selectedId: null,
    hoveredId: null,
    interior: false,
    exploded: false,
    roofVisible: true,
    ...overrides,
  };
}

function sync(site: ReturnType<typeof createSiteModel>, current: SceneState) {
  // Reduced motion also makes visibility deterministic without a browser animation clock.
  syncSiteModel(site, current, undefined, () => {}, true);
  site.scene.updateMatrixWorld(true);
}

afterEach(() => {
  for (const site of models.splice(0)) {
    stopSiteMotion(site);
    site.dispose();
  }
});

describe('grounded site reconstruction', () => {
  it('keeps semi-basement, GF, 1F and 2F in both presentation modes', () => {
    const site = model();
    sync(site, state());
    expect(site.floors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.constructionFloors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.constructionDetails.visible).toBe(true);
    expect(site.proposedDetails.visible).toBe(false);
    const placement = site.floors.map((floor) => floor.position.toArray());
    const roofElevation = site.roof.position.y;

    sync(site, state({ buildingView: 'proposed' }));
    expect(site.floors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.proposedFloors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.constructionDetails.visible).toBe(false);
    expect(site.proposedDetails.visible).toBe(true);
    expect(site.floors.map((floor) => floor.position.toArray())).toEqual(placement);
    expect(site.roof.position.y).toBe(roofElevation);
    expect(site.proposedRoof.position.y).toBe(roofElevation);
  });

  it('isolates the first floor without changing the inventory references', () => {
    const site = model();
    sync(site, state({ buildingView: 'proposed', floor: 2, selectedId: 'S2-05' }));
    expect(site.floors.map((floor) => floor.visible)).toEqual([false, false, true, false]);
    expect(site.proposedFloors.map((floor) => floor.visible)).toEqual([false, false, true, false]);
    expect(site.unitMeshes.get('S2-05')?.highlight.visible).toBe(true);

    sync(site, state());
    expect(site.floors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.unitMeshes.get('S2-05')?.highlight.visible).toBe(false);
  });

  it('preserves all four levels when an upper unit is selected or cleared', () => {
    const site = model();
    const initial = state({ buildingView: 'proposed' });
    const selected = state({ buildingView: 'proposed', selectedId: 'S2-05' });
    sync(site, initial);
    syncSiteModel(site, selected, initial, () => {}, true);
    expect(site.floors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.proposedFloors[2].visible).toBe(true);
    syncSiteModel(site, initial, selected, () => {}, true);
    expect(site.floors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.proposedFloors[2].visible).toBe(true);
  });

  it('excavates the road-grade terrain and connects the below-grade basement to the street', () => {
    const site = model();
    sync(site, state());
    expect(site.floors.map((floor) => floor.position.y)).toEqual([
      BASE_HEIGHT,
      BASE_HEIGHT + FLOOR_HEIGHT,
      BASE_HEIGHT + 2 * FLOOR_HEIGHT,
      BASE_HEIGHT + 3 * FLOOR_HEIGHT,
    ]);
    expect(BASE_HEIGHT).toBeLessThan(0);
    expect(BASE_HEIGHT + FLOOR_HEIGHT).toBeGreaterThan(0);
    const well = new THREE.Box3(
      new THREE.Vector3(-1.8, BASE_HEIGHT, 9.6),
      new THREE.Vector3(0.6, 0, 12.9),
    );
    site.scene.traverse((object) => {
      if (object.name === 'road_grade_terrain')
        expect(new THREE.Box3().setFromObject(object).intersectsBox(well)).toBe(false);
    });
    const stair = site.scene.getObjectByName('basement_access_stair')!;
    expect(stair).toBeDefined();
    const bounds = new THREE.Box3().setFromObject(stair);
    expect(bounds.min.y).toBeCloseTo(BASE_HEIGHT);
    expect(bounds.max.y).toBeCloseTo(0);
    expect(site.scene.getObjectByName('open_forecourt')).toBeDefined();
    expect(site.scene.getObjectByName('raised_entry_walkway_-1')).toBeUndefined();
  });

  it('preserves unit picking and placement in the simplified renderer', () => {
    const enhanced = model('enhanced');
    const compatibility = model('compatibility');
    for (const site of [enhanced, compatibility]) sync(site, state());
    expect([...enhanced.unitMeshes.keys()].sort()).toEqual(
      DEMO_UNITS.map((unit) => unit.id).sort(),
    );
    expect([...compatibility.unitMeshes.keys()].sort()).toEqual(
      [...enhanced.unitMeshes.keys()].sort(),
    );
    for (const unit of DEMO_UNITS) {
      const a = enhanced.unitMeshes.get(unit.id)!;
      const b = compatibility.unitMeshes.get(unit.id)!;
      expect(a.group.getWorldPosition(new THREE.Vector3()).toArray()).toEqual(
        b.group.getWorldPosition(new THREE.Vector3()).toArray(),
      );
      for (const site of [enhanced, compatibility]) {
        expect(site.pickables.some((mesh) => mesh.userData.unitId === unit.id)).toBe(true);
      }
    }
  });

  it('can hide road geometry without changing shop selection or building visibility', () => {
    const site = model();
    sync(site, state({ showRoads: false, selectedId: 'G-01' }));
    expect(site.roads.visible).toBe(false);
    expect(site.floors.map((floor) => floor.visible)).toEqual([true, true, true, true]);
    expect(site.unitMeshes.get('G-01')?.highlight.visible).toBe(true);
    sync(site, state({ showRoads: true, selectedId: 'G-01' }));
    expect(site.roads.visible).toBe(true);
    expect(site.unitMeshes.get('G-01')?.highlight.visible).toBe(true);
  });
});

describe('location claims', () => {
  it('uses the supplied address for directions instead of street-view camera coordinates', () => {
    const directions = new URL(SITE_LOCATION.directionsUrl);
    expect(directions.hostname).toBe('www.google.com');
    expect(directions.searchParams.get('destination')).toBe(SITE_LOCATION.address);
    expect(SITE_LOCATION.address).toContain('Opposite Inayat Nagar Police Station');
    expect(SITE_LOCATION.accuracyNote).toMatch(/approximate/i);
    expect(SITE_LOCATION.accuracyNote).toMatch(/illustrative/i);
  });

  it('places the provided station across the road and reserves checkpoints for the observed crossing', () => {
    const road = SITE_CONTEXT.find((marker) => marker.id === 'ayodhya-raebareli-road')!;
    const station = SITE_CONTEXT.find((marker) => marker.id === 'police-station')!;
    expect(station.label).toBe(SITE_LOCATION.landmark);
    expect(station.position[2]).toBeGreaterThan(road.position[2]);
    expect(road.position[2]).toBeGreaterThan(0);
    expect(new Set(SITE_CONTEXT.map((marker) => marker.id)).size).toBe(SITE_CONTEXT.length);
    const checkpoints = SITE_CONTEXT.filter((marker) => marker.kind === 'checkpoint');
    expect(checkpoints).toHaveLength(1);
    expect(checkpoints[0].label).toMatch(/pedestrian crossing.*junction/i);
  });
});
