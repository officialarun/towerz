'use client';
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  Component,
  type ErrorInfo,
} from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { CameraControls, Environment, Lightformer, AdaptiveDpr } from '@react-three/drei';
import { LoaderCircle } from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { GroundedSiteModel } from './GroundedSiteModel';
import { useExplorer } from '@/store/explorer';
import { sceneCameraPose, sceneCameraFov, projectSceneLabels } from '@/lib/three/camera';
import { SceneLabels } from './SceneLabels';
import CompatibilityScene from './CompatibilityScene';
import { useIsMobile, isMobileViewport } from '@/hooks/useIsMobile';
import { DEFAULT_MODEL_ZOOM, MODEL_FOV, MOBILE_MODEL_FOV } from '@/lib/presentation';
import type { LabelZoomReference } from '@/lib/three/label-detail';
class SceneBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Enhanced 3D unavailable:', error.message, info.componentStack);
    this.props.onError();
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}
type LabelCameraRefs = {
  controls: React.RefObject<CameraControls | null>;
  reference: React.RefObject<LabelZoomReference>;
};
function CameraController({ controls: ref, reference }: LabelCameraRefs) {
  const initialized = useRef(false);
  const cameraTween = useRef<gsap.core.Tween | null>(null);
  const stopTransition = useCallback(() => {
    cameraTween.current?.kill();
    cameraTween.current = null;
  }, []);
  const s = useExplorer();
  const { size, camera, invalidate } = useThree();
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const { position: pos, target } = sceneCameraPose(
      s,
      isMobileViewport(),
      size.width / size.height,
    );
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = sceneCameraFov(s, isMobileViewport());
      camera.updateProjectionMatrix();
    }
    reference.current.distance = new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(...target));
    if (!initialized.current) {
      controls.setLookAt(...pos, ...target, false);
      initialized.current = true;
      invalidate();
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: controls.getTarget(new THREE.Vector3()).x,
      ty: controls.getTarget(new THREE.Vector3()).y,
      tz: controls.getTarget(new THREE.Vector3()).z,
    };
    const tween = gsap.to(start, {
      x: pos[0],
      y: pos[1],
      z: pos[2],
      tx: target[0],
      ty: target[1],
      tz: target[2],
      duration: reduced ? 0 : 1.25,
      ease: 'power2.inOut',
      onUpdate: () => {
        controls.setLookAt(start.x, start.y, start.z, start.tx, start.ty, start.tz, false);
        invalidate();
      },
    });
    cameraTween.current = tween;
    return () => {
      tween.kill();
    };
  }, [
    s.camera.nonce,
    s.camera.preset,
    s.exploded,
    s.buildingView,
    s.floor,
    s.selectedId,
    size.width,
    size.height,
    camera,
    s.units,
  ]);
  useEffect(() => {
    const controls = ref.current;
    if (!controls || !s.autoRotate) return;
    let last = 0;
    let frame = 0;
    const tick = (now: number) => {
      if (last) controls.rotate((now - last) * 0.00013, 0, false);
      invalidate();
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [s.autoRotate]);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const zoom = (e: Event) => {
      stopTransition();
      const detail = (e as CustomEvent<number>).detail;
      void controls.dolly(detail, true);
    };
    window.addEventListener('plaza-zoom', zoom);
    return () => window.removeEventListener('plaza-zoom', zoom);
  }, [stopTransition]);
  return (
    <CameraControls
      ref={ref}
      makeDefault
      onControlStart={stopTransition}
      onControl={stopTransition}
      smoothTime={0.2}
      minDistance={s.interior ? 0.4 : 18}
      maxDistance={s.interior ? 1.2 : 180}
      minPolarAngle={0.06}
      maxPolarAngle={s.interior ? Math.PI * 0.7 : Math.PI * 0.495}
      dollySpeed={0.65}
      truckSpeed={s.interior ? 0 : 1}
      touches={{ one: 64, two: 4096, three: 0 }}
    />
  );
}
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}
function LabelProjection({
  container,
  controls,
  reference,
}: LabelCameraRefs & { container: React.RefObject<HTMLDivElement | null> }) {
  const { camera, size } = useThree();
  const s = useExplorer();
  const target = useRef(new THREE.Vector3());
  useFrame(() => {
    if (container.current && controls.current) {
      controls.current.getTarget(target.current);
      projectSceneLabels(
        container.current,
        camera,
        size.width,
        size.height,
        s,
        target.current,
        reference.current,
        isMobileViewport(),
      );
    }
  });
  return null;
}
function ContextGuard({ onUnavailable }: { onUnavailable: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onUnavailable();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onUnavailable]);
  return null;
}
function EnhancedScene({ onUnavailable }: { onUnavailable: () => void }) {
  const labelContainer = useRef<HTMLDivElement>(null);
  const controls = useRef<CameraControls>(null);
  const labelReference = useRef<LabelZoomReference>({ distance: 1 });
  const [ready, setReady] = useState(false);
  const mobile = useIsMobile();
  return (
    <div
      className="plaza-canvas"
      aria-label="Interactive Inayat Nagar plaza and roadside setting. Drag to rotate, scroll to zoom, and select an illustrative unit."
    >
      <SceneBoundary onError={onUnavailable}>
        <Canvas
          frameloop="demand"
          shadows={!mobile}
          dpr={[1, mobile ? 1.25 : 1.65]}
          camera={{
            position: [22, 22, 40],
            fov: mobile ? MOBILE_MODEL_FOV : MODEL_FOV,
            zoom: DEFAULT_MODEL_ZOOM,
            near: 0.1,
            far: 400,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'default',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#b4c8d5', 0);
          }}
        >
          <fog attach="fog" args={['#b4c6d1', 90, 220]} />
          <ambientLight intensity={0.65} color="#f2ece0" />
          <hemisphereLight args={['#d8e8f2', '#84715b', 1]} />
          <directionalLight
            position={[-30, 50, 35]}
            intensity={2.2}
            color="#fff5df"
            castShadow
            shadow-mapSize={mobile ? [512, 512] : [2048, 2048]}
            shadow-camera-left={-70}
            shadow-camera-right={70}
            shadow-camera-top={80}
            shadow-camera-bottom={-70}
            shadow-normalBias={0.035}
          />
          <Suspense fallback={null}>
            <Environment resolution={128}>
              <Lightformer
                intensity={1.2}
                position={[-10, 12, 10]}
                scale={[25, 15, 1]}
                target={[0, 4, 0]}
              />
              <Lightformer
                intensity={0.7}
                position={[10, 8, -12]}
                scale={[25, 8, 1]}
                target={[0, 4, 0]}
              />
            </Environment>
            <GroundedSiteModel />
            <Ready onReady={() => setReady(true)} />
          </Suspense>
          <CameraController controls={controls} reference={labelReference} />
          <ContextGuard onUnavailable={onUnavailable} />
          <LabelProjection
            container={labelContainer}
            controls={controls}
            reference={labelReference}
          />
          <AdaptiveDpr pixelated />
        </Canvas>
      </SceneBoundary>
      <SceneLabels container={labelContainer} />
      {!ready && (
        <div className="scene-loading">
          <LoaderCircle size={23} className="spin" />
          <span>
            Preparing your perspective<span className="loading-dots">…</span>
          </span>
          <small>Building the interactive plaza</small>
        </div>
      )}
    </div>
  );
}

export default function PlazaScene() {
  const [renderer, setRenderer] = useState<'checking' | 'webgl' | 'svg'>('checking');
  function detectRenderer() {
    // Check support before mounting R3F, so a disabled GPU does not throw through React.
    try {
      const probe = document.createElement('canvas');
      const context = probe.getContext('webgl2', { powerPreference: 'default' });
      if (context) {
        context.getExtension('WEBGL_lose_context')?.loseContext();
        setRenderer('webgl');
        return 'webgl';
      } else {
        setRenderer('svg');
        return 'svg';
      }
    } catch {
      setRenderer('svg');
      return 'svg';
    }
  }
  useEffect(() => {
    detectRenderer();
  }, []);
  if (renderer === 'checking')
    return (
      <div className="scene-loading">
        <LoaderCircle size={23} className="spin" />
        <span>Preparing your perspective…</span>
      </div>
    );
  if (renderer === 'svg')
    return (
      <CompatibilityScene
        onRetry={() => {
          if (detectRenderer() === 'svg')
            useExplorer
              .getState()
              .notify(
                'Enhanced 3D needs browser graphics acceleration. You can keep exploring in compatibility mode.',
              );
        }}
      />
    );
  return <EnhancedScene onUnavailable={() => setRenderer('svg')} />;
}
