import * as THREE from 'three';
import { DEFAULT_MODEL_ZOOM } from '@/lib/presentation';

export type LabelPriority = 'unit' | 'secondary' | 'floor' | 'entrance' | 'primary' | 'selected';
export type LabelZoomReference = { distance: number };

/** Dolly, wheel/pinch and camera magnification all use the same relative screen scale. */
export function sceneLabelZoom(
  camera: THREE.Camera,
  target: THREE.Vector3,
  reference: LabelZoomReference,
) {
  const magnification =
    camera instanceof THREE.PerspectiveCamera ? camera.zoom / DEFAULT_MODEL_ZOOM : 1;
  return (reference.distance / Math.max(camera.position.distanceTo(target), 0.01)) * magnification;
}

/** Hide detail before it becomes too small; preserve orientation and the active selection. */
export function labelDetail(zoomRatio: number, priority: LabelPriority, mobile = false) {
  const threshold = (
    mobile
      ? {
          unit: 0.9,
          secondary: 1.15,
          floor: 0.6,
          entrance: 1.08,
          primary: 0,
          selected: 0,
        }
      : {
          unit: 0.72,
          secondary: 0.64,
          floor: 0.54,
          entrance: 0.58,
          primary: 0,
          selected: 0,
        }
  )[priority];
  const important = priority === 'primary' || priority === 'selected';
  const ratio = Number.isFinite(zoomRatio) ? Math.max(0, zoomRatio) : 1;
  return {
    scale: THREE.MathUtils.clamp(ratio * (mobile ? 0.82 : 1), important ? 0.65 : 0.45, 1),
    visible: important || ratio > threshold,
    opacity: important
      ? 1
      : THREE.MathUtils.clamp((ratio - threshold) / (mobile ? 0.08 : 0.12), 0, 1),
  };
}
