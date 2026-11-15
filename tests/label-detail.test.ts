import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { labelDetail, sceneLabelZoom } from '@/lib/three/label-detail';
import { DEFAULT_MODEL_ZOOM } from '@/lib/presentation';

describe('camera-driven label detail', () => {
  it('keeps the mobile overview compact and reveals context as the user zooms closer', () => {
    const overview = labelDetail(1, 'unit', true);
    expect(overview.visible).toBe(true);
    expect(overview.scale).toBeLessThan(labelDetail(1, 'unit').scale);
    for (const priority of ['entrance', 'secondary'] as const) {
      expect(labelDetail(1, priority, true).visible).toBe(false);
      expect(labelDetail(1.4, priority, true)).toMatchObject({ visible: true, opacity: 1 });
    }
    expect(labelDetail(0.8, 'unit', true).visible).toBe(false);
    expect(labelDetail(1.4, 'unit', true).scale).toBeGreaterThan(overview.scale);
    for (const ratio of [0.2, 0.8, 1, 2]) {
      expect(labelDetail(ratio, 'selected', true)).toMatchObject({ visible: true, opacity: 1 });
    }
  });

  it('tracks apparent magnification for dolly and lens zoom, independent of panning', () => {
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
    camera.zoom = DEFAULT_MODEL_ZOOM;
    const target = new THREE.Vector3();
    camera.position.set(0, 0, 40);
    expect(sceneLabelZoom(camera, target, { distance: 40 })).toBeCloseTo(1);
    camera.position.z = 80;
    expect(sceneLabelZoom(camera, target, { distance: 40 })).toBeCloseTo(0.5);
    camera.position.x += 100;
    target.x += 100;
    expect(sceneLabelZoom(camera, target, { distance: 40 })).toBeCloseTo(0.5);
    camera.zoom *= 0.8;
    expect(sceneLabelZoom(camera, target, { distance: 40 })).toBeCloseTo(0.4);
  });

  it('shrinks labels proportionally, then removes units before contextual and floor labels', () => {
    expect(labelDetail(0.8, 'unit').scale).toBeCloseTo(0.8);
    expect(labelDetail(0.8, 'unit').visible).toBe(true);
    expect(labelDetail(0.68, 'unit').visible).toBe(false);
    expect(labelDetail(0.68, 'secondary').visible).toBe(true);
    expect(labelDetail(0.6, 'secondary').visible).toBe(false);
    expect(labelDetail(0.6, 'floor').visible).toBe(true);
    expect(labelDetail(0.5, 'floor').visible).toBe(false);
    expect(labelDetail(0.5, 'entrance').visible).toBe(false);
  });

  it('retains the active selection and main location markers, and restores detail on zoom-in', () => {
    for (const priority of ['primary', 'selected'] as const) {
      const distant = labelDetail(0.3, priority);
      expect(distant.visible).toBe(true);
      expect(distant.scale).toBeGreaterThanOrEqual(0.65);
      expect(distant.scale).toBeLessThan(1);
    }
    expect(labelDetail(1, 'unit')).toMatchObject({ visible: true, scale: 1, opacity: 1 });
    expect(labelDetail(2, 'unit').scale).toBe(1);
  });
});
