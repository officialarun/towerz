'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { Box, RotateCcw } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { isMobileViewport } from '@/hooks/useIsMobile';
import { createSiteModel } from '@/lib/three/site-model';
import { syncSiteModel, stopSiteMotion } from '@/lib/three/site-state';
import { sceneCameraPose, sceneCameraFov, projectSceneLabels, type SceneState } from '@/lib/three/camera';
import { DEFAULT_MODEL_ZOOM, MODEL_FOV, MOBILE_MODEL_FOV } from '@/lib/presentation';
import { SceneLabels } from './SceneLabels';
export default function CompatibilityScene({ onRetry }: { onRetry: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const units = useExplorer((s) => s.units);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const model = createSiteModel(units, 'compatibility');
    model.scene.add(new THREE.AmbientLight('#f2ede2', 0.6));
    const sun = new THREE.DirectionalLight('#fff5df', 0.7);
    sun.position.set(-30, 50, 35);
    model.scene.add(sun);
    const renderer = new SVGRenderer();
    renderer.setQuality('low');
    renderer.setPrecision(2);
    const svg = renderer.domElement;
    svg.setAttribute('role', 'img');
    svg.setAttribute(
      'aria-label',
      'Interactive Inayat Nagar plaza and roadside context compatibility model',
    );
    container.append(svg);
    const camera = new THREE.PerspectiveCamera(
      isMobileViewport() ? MOBILE_MODEL_FOV : MODEL_FOV,
      1,
      0.1,
      400,
    );
    camera.zoom = DEFAULT_MODEL_ZOOM;
    const controls = new OrbitControls(camera, container);
    controls.enableDamping = true;
    controls.dampingFactor = 0.14;
    controls.zoomSpeed = 0.65;
    controls.rotateSpeed = 0.55;
    controls.autoRotateSpeed = 0.8;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let frame = 0;
    let stopped = false;
    let width = 1;
    let height = 1;
    let mobile = isMobileViewport();
    let pointerStart: { x: number; y: number } | null = null;
    const labelReference = { distance: 1 };
    const tweens: gsap.core.Tween[] = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function requestRender() {
      if (!frame && !stopped) frame = requestAnimationFrame(draw);
    }
    function draw() {
      frame = 0;
      if (stopped) return;
      try {
        controls.update();
        model.scene.updateMatrixWorld(true);
        renderer.render(model.scene, camera);
        if (labels.current)
          projectSceneLabels(
            labels.current,
            camera,
            width,
            height,
            useExplorer.getState(),
            controls.target,
            labelReference,
          );
        if (controls.autoRotate) requestRender();
      } catch (error) {
        stopped = true;
        console.warn('Compatibility scene could not render:', error);
        setFailed(true);
      }
    }
    function resize() {
      width = container!.clientWidth || 1;
      height = container!.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = sceneCameraFov(useExplorer.getState(), isMobileViewport());
      camera.updateProjectionMatrix();
      const nextMobile = isMobileViewport();
      if (nextMobile !== mobile) {
        mobile = nextMobile;
        moveCamera(useExplorer.getState(), false);
      }
      requestRender();
    }
    function moveCamera(state: SceneState, animate: boolean) {
      const pose = sceneCameraPose(state, mobile, width / height);
      camera.fov = sceneCameraFov(state, mobile);
      camera.updateProjectionMatrix();
      labelReference.distance = new THREE.Vector3(...pose.position).distanceTo(
        new THREE.Vector3(...pose.target),
      );
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      controls.minDistance = state.interior ? 0.4 : 18;
      controls.maxDistance = state.interior ? 1.2 : 180;
      controls.minPolarAngle = 0.06;
      controls.maxPolarAngle = state.interior ? Math.PI * 0.7 : Math.PI * 0.495;
      controls.enablePan = !state.interior;
      if (animate && !reduced) {
        tweens.push(
          gsap.to(camera.position, {
            x: pose.position[0],
            y: pose.position[1],
            z: pose.position[2],
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: requestRender,
          }),
          gsap.to(controls.target, {
            x: pose.target[0],
            y: pose.target[1],
            z: pose.target[2],
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: requestRender,
          }),
        );
      } else {
        camera.position.set(...pose.position);
        controls.target.set(...pose.target);
        camera.lookAt(controls.target);
      }
      requestRender();
    }
    function stopCameraTransition() {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
    }
    function sync(state: SceneState, previous?: SceneState) {
      syncSiteModel(model, state, previous, requestRender, reduced);
      controls.autoRotate = state.autoRotate;
      if (
        !previous ||
        previous.camera.nonce !== state.camera.nonce ||
        previous.buildingView !== state.buildingView
      )
        moveCamera(state, !!previous);
      requestRender();
    }
    function hit(event: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      model.scene.updateMatrixWorld(true);
      return raycaster.intersectObjects(model.pickables, false).find((hit) => {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          if (!object.visible) return false;
          object = object.parent;
        }
        return true;
      })?.object;
    }
    function unitId(object?: THREE.Object3D) {
      while (object) {
        if (object.userData.unitId) return object.userData.unitId as string;
        object = object.parent || undefined;
      }
      return null;
    }
    function hover(event: PointerEvent) {
      if (event.buttons) return;
      const object = hit(event);
      const state = useExplorer.getState();
      const id = unitId(object);
      state.hover(state.mode === 'leasing' ? id : null);
      container!.style.cursor =
        state.mode === 'leasing'
          ? id
            ? 'pointer'
            : 'grab'
          : object?.userData.inspection
            ? 'pointer'
            : 'grab';
    }
    function down(event: PointerEvent) {
      stopCameraTransition();
      pointerStart = { x: event.clientX, y: event.clientY };
    }
    function up(event: PointerEvent) {
      if (
        !pointerStart ||
        Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6
      ) {
        pointerStart = null;
        return;
      }
      pointerStart = null;
      const object = hit(event);
      const state = useExplorer.getState();
      if (state.mode === 'leasing') {
        const id = unitId(object);
        if (id) state.select(id);
      } else if (object?.userData.inspection) state.inspect(object.userData.inspection);
    }
    function leave() {
      useExplorer.getState().hover(null);
      container!.style.cursor = 'grab';
    }
    function zoom(event: Event) {
      stopCameraTransition();
      const direction = (event as CustomEvent<number>).detail;
      const state = useExplorer.getState();
      const offset = camera.position.clone().sub(controls.target);
      const distance = THREE.MathUtils.clamp(
        offset.length() * (direction > 0 ? 0.82 : 1.22),
        state.interior ? 0.4 : 18,
        state.interior ? 1.2 : 180,
      );
      offset.setLength(distance);
      camera.position.copy(controls.target).add(offset);
      requestRender();
    }
    controls.addEventListener('change', requestRender);
    container.addEventListener('pointermove', hover);
    container.addEventListener('pointerdown', down);
    container.addEventListener('pointerup', up);
    container.addEventListener('pointerleave', leave);
    container.addEventListener('wheel', stopCameraTransition, { passive: true });
    window.addEventListener('plaza-zoom', zoom);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    sync(useExplorer.getState());
    const unsubscribe = useExplorer.subscribe((state, previous) => sync(state, previous));
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      unsubscribe();
      observer.disconnect();
      for (const tween of tweens) tween.kill();
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      controls.dispose();
      container.removeEventListener('pointermove', hover);
      container.removeEventListener('pointerdown', down);
      container.removeEventListener('pointerup', up);
      container.removeEventListener('pointerleave', leave);
      container.removeEventListener('wheel', stopCameraTransition);
      window.removeEventListener('plaza-zoom', zoom);
      svg.remove();
      stopSiteMotion(model);
      model.dispose();
    };
  }, [units]);
  return (
    <div className="plaza-canvas compatibility-scene" data-renderer="svg">
      <div ref={host} className="compatibility-canvas" />
      <SceneLabels container={labels} />
      {!failed && (
        <div
          className="compatibility-badge"
          role="status"
          title="Your browser has graphics acceleration disabled. This simplified 3D view supports rotation, zoom, floor controls and shop selection."
        >
          <Box size={12} />
          <span>Compatibility 3D</span>
          <button onClick={onRetry}>
            Enhanced view <RotateCcw size={10} />
          </button>
        </div>
      )}
      {failed && (
        <div className="scene-fallback">
          <div>
            <p>Explore the plaza floor by floor.</p>
            <span>
              Interactive 3D is unavailable in this browser. Every unit remains accessible in the
              floor plan.
            </span>
            <button
              className="btn btn-primary"
              onClick={() => useExplorer.getState().setView('plan')}
            >
              Explore floor plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
