'use client';
import { useEffect, useMemo } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useExplorer } from '@/store/explorer';
import { createSiteModel } from '@/lib/three/site-model';
import { syncSiteModel, stopSiteMotion } from '@/lib/three/site-state';
function selection(object: THREE.Object3D) {
  const state = useExplorer.getState();
  let node: THREE.Object3D | null = object;
  if (state.mode === 'architecture') {
    while (node) {
      if (node.userData.inspection) {
        state.inspect(node.userData.inspection);
        return;
      }
      node = node.parent;
    }
  } else {
    while (node) {
      if (node.userData.unitId) {
        state.select(node.userData.unitId);
        return;
      }
      node = node.parent;
    }
  }
}
function hover(object: THREE.Object3D) {
  const state = useExplorer.getState();
  let node: THREE.Object3D | null = object;
  while (node) {
    if (state.mode === 'leasing' && node.userData.unitId) {
      state.hover(node.userData.unitId);
      document.body.style.cursor = 'pointer';
      return;
    }
    if (state.mode === 'architecture' && node.userData.inspection) {
      document.body.style.cursor = 'pointer';
      return;
    }
    node = node.parent;
  }
}
export function GroundedSiteModel() {
  const units = useExplorer((s) => s.units);
  const { invalidate } = useThree();
  const model = useMemo(() => createSiteModel(units, 'enhanced'), [units]);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    syncSiteModel(model, useExplorer.getState(), undefined, invalidate, reduced);
    const unsubscribe = useExplorer.subscribe((state, previous) =>
      syncSiteModel(model, state, previous, invalidate, reduced),
    );
    return () => {
      unsubscribe();
      stopSiteMotion(model);
      model.dispose();
      document.body.style.cursor = 'auto';
    };
  }, [model, invalidate]);
  return (
    <primitive
      object={model.scene}
      dispose={null}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (event.delta > 6) return;
        event.stopPropagation();
        selection(event.object);
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        hover(event.object);
      }}
      onPointerOut={() => {
        useExplorer.getState().hover(null);
        document.body.style.cursor = 'auto';
      }}
    />
  );
}
