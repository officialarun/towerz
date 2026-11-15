import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DEMO_UNITS } from '@/data/demo';
import { pedestrianJourneys, journeySamples } from '@/lib/three/pedestrian-journeys';
import { createSiteModel } from '@/lib/three/site-model';
import { syncSiteModel, stopSiteMotion } from '@/lib/three/site-state';
import { useExplorer } from '@/store/explorer';

let site: ReturnType<typeof createSiteModel> | undefined;
afterEach(() => { if (site) { stopSiteMotion(site); site.dispose(); site = undefined; } });
describe('complete pedestrian journeys over actual geometry', () => {
  for (const view of ['structure', 'finished'] as const) it(`supports every journey without blocked public passages (${view})`, () => {
    site = createSiteModel(DEMO_UNITS, 'compatibility');
    syncSiteModel(site, { ...useExplorer.getInitialState(), buildingView: view === 'finished' ? 'proposed' : 'construction', structuralReview: view === 'structure' }, undefined, () => {}, true);
    site.scene.updateMatrixWorld(true);
    const solids: THREE.Mesh[] = [];
    site.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.userData.ignorePicking) return;
      let parent: THREE.Object3D | null = object;
      while (parent) { if (!parent.visible) return; parent = parent.parent; }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (!materials.every((m) => m.visible)) return;
      for (const material of materials) material.side = THREE.DoubleSide;
      solids.push(object);
    });
    const ray = new THREE.Raycaster();
    const bounds = solids.map((mesh) => ({ mesh, box: new THREE.Box3().setFromObject(mesh) }));
    const nearby = new THREE.Box3();
    const faults: string[] = [];
    for (const journey of pedestrianJourneys()) for (const [index, sample] of journeySamples(journey).entries()) {
      const [x, y, z] = sample;
      nearby.min.set(x - 0.19, y - 0.11, z - 0.19);
      nearby.max.set(x + 0.19, y + 1.81, z + 0.19);
      const candidates = bounds.filter(({ box }) => box.intersectsBox(nearby)).map(({ mesh }) => mesh);
      ray.set(new THREE.Vector3(x, y + 0.12, z), new THREE.Vector3(0, -1, 0));
      ray.near = 0; ray.far = 0.22;
      const support = ray.intersectObjects(candidates, false).find((h) => Math.abs(h.point.y - y) < 0.085);
      if (!support) faults.push(`${journey.id}[${index}]: unsupported at ${sample}`);
      ray.set(new THREE.Vector3(x, y + 0.22, z), new THREE.Vector3(0, 1, 0));
      ray.far = 1.58;
      const overhead = ray.intersectObjects(candidates, false)[0];
      if (overhead) faults.push(`${journey.id}[${index}]: head space blocked by ${overhead.object.name}`);
      for (const direction of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]) {
        ray.set(new THREE.Vector3(x, y + 0.9, z), new THREE.Vector3(...direction));
        ray.far = 0.18;
        const obstruction = ray.intersectObjects(candidates, false)[0];
        if (obstruction) faults.push(`${journey.id}[${index}]: passage blocked by ${obstruction.object.name}`);
      }
    }
    expect(faults.slice(0, 30), `${faults.length} journey failures`).toEqual([]);
    expect(pedestrianJourneys().filter((j) => j.id.startsWith('door-'))).toHaveLength(32);
  });
});
