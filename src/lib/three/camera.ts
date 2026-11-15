import * as THREE from 'three';
import { BASE_HEIGHT, FLOOR_HEIGHT, unitPosition } from '@/data/demo';
import { BUILDING, ROOF_ELEVATION, unitLayout } from '@/data/building';
import { SITE_CONTEXT } from '@/data/site';
import { DEFAULT_MODEL_ZOOM, MOBILE_MODEL_FOV, MODEL_FOV } from '@/lib/presentation';
import type { useExplorer } from '@/store/explorer';
import { STRUCTURAL_REFERENCE } from '@/data/structural-reference';
import {
  labelDetail,
  sceneLabelZoom,
  type LabelPriority,
  type LabelZoomReference,
} from './label-detail';
export type SceneState = ReturnType<typeof useExplorer.getState>;
export const sceneCameraFov = (s: SceneState, mobile: boolean) =>
  s.camera.preset === 'comparison' ? STRUCTURAL_REFERENCE.camera.fov : mobile ? MOBILE_MODEL_FOV : MODEL_FOV;
export function sceneCameraPose(s: SceneState, mobile: boolean, aspect = 1) {
  const floor = typeof s.floor === 'number' ? s.floor : 1;
  const y = BASE_HEIGHT + floor * FLOOR_HEIGHT + (s.exploded ? floor * 5 : 0);
  const extent = s.exploded ? 1.24 : 1;
  let position: [number, number, number] = [29, 24 * extent, 43 * extent];
  let target: [number, number, number] = [0, 5.5 + (s.exploded ? 5 : 0), 1];
  switch (s.camera.preset) {
    case 'comparison':
      position = [...STRUCTURAL_REFERENCE.camera.position];
      target = [...STRUCTURAL_REFERENCE.camera.target];
      break;
    case 'road':
    case 'reset':
      // An elevated street perspective reveals the sunken basement approach.
      position = mobile ? [5, 23, 45] : [5, 14.5, 45];
      target = [0, 4.6, 1];
      break;
    case 'front':
      position = [2.8, 3.6, 42];
      target = [-0.4, 4.2, 1];
      break;
    case 'opposite':
      position = mobile ? [48, 26, 9] : [22, 15, 9];
      target = [7, 2.5, 46];
      break;
    case 'rear':
      position = [-12, 20, -40];
      break;
    case 'left':
      position = [-42, 17, 10];
      break;
    case 'right':
      position = [42, 17, 10];
      break;
    case 'top':
      position = [0, 115 * extent, 22.1];
      target = [0, 0, 22];
      break;
    case 'focus':
    case 'interior': {
      const unit = s.units.find((u) => u.id === s.selectedId);
      if (unit) {
        const [x, , z] = unitPosition(unit);
        const uy = BASE_HEIGHT + unit.floor * FLOOR_HEIGHT + (s.exploded ? unit.floor * 5 : 0);
        if (s.camera.preset === 'interior') {
          const depth = unitLayout(unit.slot).depth;
          position = [x, uy + 1.65, z + depth * 0.3];
          target = [x, uy + 1.65, z - depth * 0.25];
        } else {
          position = [x * 0.7, uy + 5, z + 17];
          target = [x, uy + 1.7, z];
        }
      }
      break;
    }
  }
  if (typeof s.floor === 'number' && ['front', 'road', 'reset'].includes(s.camera.preset)) {
    target = [0, y + 1.2, 0];
    position = [14, y + 10, 32];
  }
  if (mobile && s.camera.preset !== 'interior' && s.camera.preset !== 'focus') {
    // Fit visible retail geometry; context presets additionally include the road and opposite edge.
    const center = new THREE.Vector3(...target);
    const eye = new THREE.Vector3(...position);
    const back = eye.clone().sub(center).normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(back).normalize();
    const up = back.clone().cross(right).normalize();
    const tanVertical =
      Math.tan(THREE.MathUtils.degToRad(sceneCameraFov(s, mobile) / 2)) / DEFAULT_MODEL_ZOOM;
    const tanHorizontal = tanVertical * Math.max(aspect, 0.25);
    const isolated = typeof s.floor === 'number';
    const context = !isolated && s.camera.preset === 'top';
    const opposite = !isolated && s.camera.preset === 'opposite';
    const base = isolated
      ? BASE_HEIGHT +
        (s.floor as number) * FLOOR_HEIGHT +
        (s.exploded ? (s.floor as number) * 5 : 0)
      : BASE_HEIGHT - 0.4;
    const top = s.structuralReview && s.camera.preset === 'comparison' ? BASE_HEIGHT + FLOOR_HEIGHT * 2 : isolated
      ? base + FLOOR_HEIGHT + 0.5
      : ROOF_ELEVATION + 3.2 + (s.exploded ? (BUILDING.levels.length - 1) * 5 : 0);
    let distance = eye.distanceTo(center);
    for (const x of opposite ? [-12, 27] : context ? [-38, 38] : [-16.2, 13.3])
      for (const z of opposite ? [41, 59] : context ? [-9, 59] : [-7.5, 13.2])
        for (const y of [base, top]) {
          const offset = new THREE.Vector3(x, y, z).sub(center);
          distance = Math.max(
            distance,
            offset.dot(back) +
              Math.max(
                Math.abs(offset.dot(right)) / tanHorizontal,
                Math.abs(offset.dot(up)) / tanVertical,
              ) *
                1.08,
          );
        }
    position = center.addScaledVector(back, distance).toArray() as [number, number, number];
  }
  return { position, target };
}
export function projectSceneLabels(
  container: HTMLElement,
  camera: THREE.Camera,
  width: number,
  height: number,
  s: SceneState,
  target: THREE.Vector3,
  zoomReference: LabelZoomReference,
) {
  const vector = new THREE.Vector3();
  const zoomRatio = sceneLabelZoom(camera, target, zoomReference);
  container.dataset.labelZoom = zoomRatio.toFixed(3);
  function place(
    selector: string,
    position: [number, number, number],
    visible = true,
    priority: LabelPriority = 'secondary',
  ) {
    const el = container.querySelector<HTMLElement>(selector);
    if (!el) return;
    const detail = labelDetail(zoomRatio, priority);
    vector.set(...position).project(camera);
    const halfWidth = (el.offsetWidth * detail.scale) / 2 + 8;
    const screenX = THREE.MathUtils.clamp(
      (vector.x * 0.5 + 0.5) * width,
      halfWidth,
      Math.max(halfWidth, width - halfWidth),
    );
    el.style.transform = `translate(${screenX}px,${(-vector.y * 0.5 + 0.5) * height}px) translate(-50%,-50%) scale(${detail.scale})`;
    el.style.opacity = String(detail.opacity);
    el.style.display =
      visible &&
      detail.visible &&
      vector.z > -1 &&
      vector.z < 1 &&
      Math.abs(vector.x) < 0.94 &&
      Math.abs(vector.y) < 0.92
        ? ''
        : 'none';
  }
  const last = s.structuralReview && s.camera.preset === 'comparison' ? 1 : BUILDING.levels.length - 1;
  const contextView = ['opposite', 'top'].includes(s.camera.preset);
  for (let f = 0; f < BUILDING.levels.length; f++)
    place(
      `[data-floor-label="${f}"]`,
      [-13.5, BASE_HEIGHT + f * FLOOR_HEIGHT + 1.5 + (s.exploded ? f * 5 : 0), 9.6],
      !s.interior &&
        !contextView &&
        f <= last &&
        (s.floor === 'all' || s.floor === 'roof' || s.floor === f),
      s.floor === f ? 'selected' : 'floor',
    );
  place(
    '[data-entrance]',
    [-8.3, BASE_HEIGHT + FLOOR_HEIGHT + 0.2, BUILDING.walkway.front],
    !s.interior && !contextView,
    'entrance',
  );
  place(
    '[data-basement-entrance]',
    [BUILDING.basementAccess.x, BASE_HEIGHT + 0.3, 10.25],
    !s.interior && !contextView && (s.floor === 'all' || s.floor === 0),
    'entrance',
  );
  place(
    '[data-atm-provision]',
    [3, BASE_HEIGHT + 1.8, unitLayout(4).z + 0.4],
    s.buildingView === 'proposed' &&
      !s.interior &&
      !contextView &&
      (s.floor === 0 || (s.floor === 'all' && s.mode === 'architecture')),
    'secondary',
  );
  for (const marker of SITE_CONTEXT) {
    const enabled =
      marker.kind === 'road'
        ? s.showRoads
        : marker.kind === 'checkpoint'
          ? s.showCheckpoints
          : s.showLandmarks;
    place(
      `[data-site-marker="${marker.id}"]`,
      marker.position,
      !s.interior &&
        enabled &&
        (s.camera.preset !== 'opposite' ||
          ['police-station', 'ayodhya-raebareli-road', 'pedestrian-crossing'].includes(marker.id)),
      ['police-station', 'ayodhya-raebareli-road'].includes(marker.id) ? 'primary' : 'secondary',
    );
  }
  for (const unit of s.units) {
    const [x, , z] = unitPosition(unit);
    place(
      `[data-unit-marker="${unit.id}"]`,
      [
        x,
        BASE_HEIGHT + unit.floor * FLOOR_HEIGHT + 2.1 + (s.exploded ? unit.floor * 5 : 0),
        z + unitLayout(unit.slot).depth / 2,
      ],
      s.showUnitLabels &&
        !s.interior &&
        !contextView &&
        unit.floor <= last &&
        unit.id !== (s.hoveredId || s.selectedId) &&
        (s.floor === unit.floor || (s.floor === 'all' && [0, 4].includes(unit.slot))),
      'unit',
    );
  }
  const unit = s.units.find((u) => u.id === (s.hoveredId || s.selectedId));
  if (unit) {
    const [x, , z] = unitPosition(unit);
    place(
      '[data-unit-label]',
      [x, BASE_HEIGHT + unit.floor * FLOOR_HEIGHT + 3.7 + (s.exploded ? unit.floor * 5 : 0), z],
      s.showUnitLabels &&
        !s.interior &&
        !contextView &&
        unit.floor <= last &&
        (s.floor === 'all' || s.floor === 'roof' || s.floor === unit.floor),
      'selected',
    );
  }
}
