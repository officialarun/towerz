'use client';
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import {
  ArrowLeftRight,
  ArrowDown,
  ArrowUpRight,
  Bookmark,
  Box,
  Eye,
  Layers,
  Minus,
  Mouse,
  Pause,
  Plus,
  RotateCw,
  ImageIcon,
  X,
} from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { isMobileViewport } from '@/hooks/useIsMobile';
import { UnitPanel } from '@/components/leasing/UnitPanel';
import { SiteContextControls } from './SiteContextControls';
import { ModelOptions, ModelControlButton } from './ModelOptions';
import { FloorPlan } from '@/components/floor-plan/FloorPlan';
import { FinalLook } from './FinalLook';
const PlazaScene = dynamic(() => import('./PlazaScene'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <Box size={24} />
      <span>Preparing the plaza…</span>
    </div>
  ),
});
export function Explorer({
  dedicated = false,
  initialView,
}: {
  dedicated?: boolean;
  initialView?: 'plan';
}) {
  const s = useExplorer();
  const initialMode = initialView ?? '3d';
  const [initialized, setInitialized] = useState(false);
  const view = initialized ? s.view : initialMode;
  const modelActive = view === '3d' || view === 'split';
  const [modelVisited, setModelVisited] = useState(initialMode === '3d');
  useEffect(() => {
    if (modelActive) setModelVisited(true);
  }, [modelActive]);
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = root.current;
    const tray = navigation.current;
    const primary = tray?.querySelector<HTMLElement>('.camera-toolbar');
    const presentation = host?.querySelector<HTMLElement>('[aria-label="Building presentation"]');
    const scene = tray?.closest('.scene-area');
    if (!host || !tray || !primary || !presentation || !scene) return;
    function align() {
      if (isMobileViewport()) {
        tray!.style.removeProperty('--navigation-left');
        tray!.style.removeProperty('--navigation-top');
        return;
      }
      const controls = presentation!.getBoundingClientRect();
      const stage = scene!.getBoundingClientRect();
      const bounds = host!.getBoundingClientRect();
      const navigationBounds = tray!.getBoundingClientRect();
      const primaryBounds = primary!.getBoundingClientRect();
      const viewerCenter =
        (Math.max(bounds.left, stage.left) + Math.min(bounds.right, stage.right)) / 2;
      const primaryCenterOffset =
        primaryBounds.left + primaryBounds.width / 2 - navigationBounds.left;
      tray!.style.setProperty(
        '--navigation-left',
        `${viewerCenter - stage.left + navigationBounds.width / 2 - primaryCenterOffset}px`,
      );
      tray!.style.setProperty('--navigation-top', `${controls.bottom - stage.top + 12}px`);
    }
    align();
    const observer = new ResizeObserver(align);
    observer.observe(host);
    observer.observe(presentation);
    observer.observe(primary);
    window.addEventListener('resize', align);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', align);
    };
  }, [view]);
  useEffect(() => {
    s.setView(initialMode);
    setInitialized(true);
    return () => {
      useExplorer.setState({ interior: false, autoRotate: false });
    };
  }, [initialMode]);
  useEffect(() => {
    if (!title.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-copy > *', {
        y: 18,
        duration: 0.85,
        stagger: 0.11,
        ease: 'power2.out',
        delay: 0.1,
      });
    }, title);
    return () => ctx.revert();
  }, []);
  const zoom = (n: number) => window.dispatchEvent(new CustomEvent('plaza-zoom', { detail: n }));
  return (
    <section
      ref={root}
      id="main"
      className={`explorer site-explorer ${dedicated ? 'dedicated' : ''} view-${view} ${modelActive && s.interior ? 'interior-mode' : ''}`}
    >
      <div className="explorer-backdrop" />
      {(modelVisited || modelActive) && (
        <div
          className={`scene-area ${modelActive ? '' : 'scene-inactive'}`}
          aria-hidden={!modelActive}
          inert={!modelActive}
        >
          <div className="scene-viewport">
            <PlazaScene />
          </div>
          <div ref={navigation} className="model-navigation">
            <div
              className="camera-toolbar model-overlay-controls"
              role="group"
              aria-label="3D navigation controls"
            >
              <ModelControlButton
                className="tool"
                label="Reset 3D model"
                icon={Box}
                active
                onClick={() => {
                  s.setView('3d');
                  s.setFloor('all');
                  s.goCamera('reset');
                }}
              />
              <ModelControlButton
                className="tool"
                label={s.autoRotate ? 'Pause' : 'Rotate'}
                icon={s.autoRotate ? Pause : RotateCw}
                active={s.autoRotate}
                aria-pressed={s.autoRotate}
                onClick={s.toggleRotate}
              />
              <ModelControlButton
                className="tool"
                label="Zoom in"
                icon={Plus}
                onClick={() => zoom(5)}
              />
              <ModelControlButton
                className="tool"
                label="Zoom out"
                icon={Minus}
                onClick={() => zoom(-5)}
              />
              <ModelControlButton
                className="tool"
                label="Opposite side context"
                icon={ArrowLeftRight}
                active={s.camera.preset === 'opposite'}
                aria-pressed={s.camera.preset === 'opposite'}
                onClick={() => s.goCamera('opposite')}
              />
            </div>
            <ModelOptions container={root} active={modelActive} />
          </div>
        </div>
      )}
      {view === 'final' && <FinalLook />}
      {(view === 'plan' || view === 'split') && (
        <div className="plan-area">
          <FloorPlan compact={view === 'split'} />
        </div>
      )}
      {!dedicated && view === '3d' && !s.interior && (
        <div className="hero-copy" ref={title}>
          <p className="eyebrow">
            <span /> INAYAT NAGAR · SH15
          </p>
          <h1>
            A real place.
            <br /> A new chapter
            <br />
            <em>for business.</em>
          </h1>
          <p className="hero-description">
            <span className="desktop-hero-description">
              Explore the plaza opposite Inayat Nagar Police Station. See the photo-guided RCC
              frame, its aligned upper-floor proposal, and connected circulation.
            </span>
            <span className="mobile-hero-description">
              Opposite Inayat Nagar Police Station, Ayodhya. Explore the construction and proposed
              finish along SH15.
            </span>
          </p>
          <Link className="shortlist-link" href="/shops">
            <span>View available shops</span>
            <ArrowUpRight size={13} />
          </Link>
          <div className="hero-property-note">
            <span>AYODHYA–RAEBARELI ROAD / SH15</span>
            <div>
              <i />
              Photo-based site approximation
            </div>
          </div>
        </div>
      )}
      {dedicated && view === '3d' && !s.interior && (
        <div className="explorer-title">
          <p className="eyebrow">INAYAT NAGAR · SITE EXPLORER</p>
          <h1>The site, in perspective.</h1>
          <p>Photo-guided structure. Connected circulation.</p>
        </div>
      )}
      <div className="view-switch" aria-label="Explorer view">
        <button
          aria-pressed={view === 'final'}
          className={view === 'final' ? 'active' : ''}
          onClick={() => s.setView('final')}
        >
          <ImageIcon size={14} />
          <span>Final Look</span>
        </button>
        <button
          aria-pressed={modelActive}
          className={modelActive ? 'active' : ''}
          onClick={() => s.setView('3d')}
        >
          <Box size={14} />
          <span>3D Model</span>
        </button>
        <button
          aria-pressed={view === 'plan'}
          className={view === 'plan' ? 'active' : ''}
          onClick={() => s.setView('plan')}
        >
          <Layers size={14} />
          <span>Floor Plan</span>
        </button>
      </div>
      {view !== 'final' && (
        <>
          <SiteContextControls />
          <div className="floor-navigation" aria-label="Select floor">
            <span className="floor-nav-label">LEVEL</span>
            <div className="floor-pills">
              {[...s.floors].reverse().map((f) => (
                <button
                  key={f.id}
                  className={s.floor === f.id ? 'active' : ''}
                  onClick={() => s.setFloor(s.floor === f.id ? 'all' : f.id)}
                  title={f.name}
                  aria-label={f.name}
                  aria-pressed={s.floor === f.id}
                >
                  {f.label}
                </button>
              ))}
              <span />
              <button
                className={s.floor === 'all' ? 'active all' : ''}
                onClick={() => s.setFloor('all')}
                title="All floors"
                aria-label="All floors"
              >
                <Layers size={17} />
              </button>
              <button
                className={s.floor === 'roof' ? 'active' : ''}
                onClick={() => {
                  s.setFloor('roof');
                  s.goCamera('top');
                }}
                title="Roof view"
                aria-label="Roof view"
              >
                <Box size={16} />
              </button>
            </div>
          </div>
          {(!s.interior || s.selectedId) && <UnitPanel />}
          {s.interior && (
            <div className="interior-banner">
              <span>
                <Eye size={15} /> Simplified modeled interior · {s.selectedId}
              </span>
              <button onClick={() => s.setInterior(false)}>
                Exit interior <X size={14} />
              </button>
            </div>
          )}
          <div className="interaction-hint">
            <Mouse size={15} />
            <span>Drag to rotate</span>
            <i />
            <span>Scroll to zoom</span>
            <i />
            <span>Click a space to explore</span>
          </div>
          <div className="availability-legend">
            <span>
              <i className="available" />
              Available
            </span>
            <span>
              <i className="reserved" />
              Reserved
            </span>
            <span>
              <i className="leased" />
              Leased
            </span>
            <button onClick={() => s.setModal('shortlist')}>
              <Bookmark size={13} />
              Shortlist <b>{s.shortlist.length}</b>
            </button>
          </div>
          <div className="scene-disclaimer">
            {s.structuralReview
              ? s.camera.preset === 'comparison'
                ? 'PHOTO COMPARISON · OBSERVED LOWER FRAME · APPROXIMATE PERSPECTIVE'
                : 'GREY STRUCTURAL REVIEW · UPPER FLOORS EXTRAPOLATED'
              : <>PHOTO-GUIDED LOWER FRAME <span>·</span> UPPER FLOORS EXTRAPOLATED</>}
          </div>
        </>
      )}
      {!dedicated && (
        <a
          href="#introduction"
          className="scroll-explore"
          aria-label="Discover more about the plaza"
        >
          <span>MORE TO DISCOVER</span>
          <ArrowDown size={14} />
        </a>
      )}
    </section>
  );
}
