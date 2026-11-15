import gsap from 'gsap';
import type * as THREE from 'three';
import { BASE_HEIGHT, FLOOR_HEIGHT } from '@/data/demo';
import { BUILDING } from '@/data/building';
import type { SceneState } from './camera';
import type { createSiteModel } from './site-model';
export type SiteModel = ReturnType<typeof createSiteModel>;
/** One visibility/motion controller for WebGL and SVG: semi-basement and three above-grade levels. */
export function syncSiteModel(
  model: SiteModel,
  state: SceneState,
  previous: SceneState | undefined,
  invalidate: () => void,
  reduced = false,
) {
  const proposed = state.buildingView === 'proposed';
  const review = state.structuralReview;
  const referenceFrame = review && state.camera.preset === 'comparison';
  const lastBuiltFloor = BUILDING.levels.length - 1;
  const layoutChanged =
    !previous ||
    previous.floor !== state.floor ||
    previous.exploded !== state.exploded ||
    previous.roofVisible !== state.roofVisible ||
    previous.interior !== state.interior ||
    previous.buildingView !== state.buildingView;
  const reviewChanged = !previous || previous.structuralReview !== review;
  const referenceChanged = !previous || (previous.structuralReview && previous.camera.preset === 'comparison') !== referenceFrame;
  if (reviewChanged) model.setStructuralReview(review);
  model.constructionDetails.visible = !proposed && !review;
  model.proposedDetails.visible = proposed && !review;
  model.roads.visible = state.showRoads && !review;
  model.contextLandmarks.visible = !review;
  function move(object: THREE.Object3D, visible: boolean, y: number) {
    gsap.killTweensOf(object.position);
    gsap.killTweensOf(object.scale);
    if (previous && !reduced) {
      object.visible = true;
      gsap.to(object.position, { y, duration: 0.8, ease: 'power2.inOut', onUpdate: invalidate });
      gsap.to(object.scale, {
        y: visible ? 1 : 0.001,
        duration: 0.4,
        onUpdate: invalidate,
        onComplete: () => {
          object.visible = visible;
          invalidate();
        },
      });
    } else {
      object.position.y = y;
      object.scale.y = visible ? 1 : 0.001;
      object.visible = visible;
    }
  }
  if (layoutChanged || reviewChanged || referenceChanged) {
    model.floors.forEach((floor, index) => {
      const visible =
        index <= lastBuiltFloor &&
        (!referenceFrame || index <= 1) &&
        (state.floor === 'all' || state.floor === 'roof' || state.floor === index);
      const y = BASE_HEIGHT + index * FLOOR_HEIGHT + (state.exploded ? index * 5 : 0);
      move(floor, visible, y);
      move(model.constructionFloors[index], visible, y);
      move(model.proposedFloors[index], visible, y);
      move(model.circulationFloors[index], visible, y);
      model.covers[index].visible = !(
        state.interior ||
        state.floor === index ||
        state.exploded ||
        (index === lastBuiltFloor && !state.roofVisible)
      );
    });
    const visible =
      proposed &&
      !review &&
      state.roofVisible &&
      !state.interior &&
      (state.floor === 'all' || state.floor === 'roof');
    const roofY =
      BASE_HEIGHT +
      FLOOR_HEIGHT * (lastBuiltFloor + 1) -
      0.16 +
      (state.exploded ? (lastBuiltFloor + 1) * 5 : 0);
    move(model.roof, visible, roofY);
    move(model.proposedRoof, visible, roofY);
  }
  for (const [id, unit] of model.unitMeshes) {
    unit.highlight.visible = state.selectedId === id || state.hoveredId === id;
    unit.marker.visible = !review;
  }
  invalidate();
}
export function stopSiteMotion(model: SiteModel) {
  for (const object of [
    ...model.floors,
    ...model.constructionFloors,
    ...model.proposedFloors,
    ...model.circulationFloors,
    model.roof,
    model.proposedRoof,
  ]) {
    gsap.killTweensOf(object.position);
    gsap.killTweensOf(object.scale);
  }
}
