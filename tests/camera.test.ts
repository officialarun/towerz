import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { sceneCameraPose } from '@/lib/three/camera';
import { useExplorer } from '@/store/explorer';
import { BASE_HEIGHT, FLOOR_HEIGHT } from '@/data/demo';
import { DEFAULT_MODEL_ZOOM, MOBILE_MODEL_FOV } from '@/lib/presentation';
describe('mobile camera framing', () => {
  for (const width of [320, 390, 430])
    it(`keeps every selected-level storefront inside a ${width}px viewport`, () => {
      const aspect = width / 405;
      for (const floor of [0, 1, 2, 3] as const)
        for (const preset of ['front', 'isometric', 'left', 'right', 'top'] as const) {
          const state = { ...useExplorer.getState(), floor, camera: { preset, nonce: 1 } };
          const pose = sceneCameraPose(state, true, aspect);
          const camera = new THREE.PerspectiveCamera(MOBILE_MODEL_FOV, aspect, 0.1, 400);
          camera.zoom = DEFAULT_MODEL_ZOOM;
          camera.updateProjectionMatrix();
          camera.position.set(...pose.position);
          camera.lookAt(...pose.target);
          camera.updateMatrixWorld(true);
          for (const x of [-12.6, 12.6])
            for (const z of [-7.5, 9.5])
              for (const y of [
                BASE_HEIGHT + floor * FLOOR_HEIGHT,
                BASE_HEIGHT + (floor + 1) * FLOOR_HEIGHT,
              ]) {
                const projected = new THREE.Vector3(x, y, z).project(camera);
                expect(Math.abs(projected.x)).toBeLessThan(1);
                expect(Math.abs(projected.y)).toBeLessThan(1);
              }
        }
    });
});
