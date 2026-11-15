'use client';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Box,
  Eye,
  EyeOff,
  Grid2X2,
  Route,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
  Camera,
  Building2,
  SquareStack,
  Split,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { isMobileViewport } from '@/hooks/useIsMobile';

export function ModelControlButton({
  label,
  icon: Icon,
  active = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      aria-label={label}
      data-tooltip={label}
      className={`model-control ${active ? 'is-active' : ''} ${className}`}
    >
      <span>
        <Icon size={19} aria-hidden="true" />
      </span>
    </button>
  );
}
const viewpoints = [
  { id: 'comparison', label: 'Photo comparison', icon: Camera },
  { id: 'road', label: 'Road view', icon: Route },
  { id: 'front', label: 'Front view', icon: ArrowDownToLine },
  { id: 'rear', label: 'Rear view', icon: ArrowUpToLine },
  { id: 'left', label: 'Left side', icon: ArrowRightToLine },
  { id: 'right', label: 'Right side', icon: ArrowLeftToLine },
  { id: 'top', label: 'Top view', icon: Grid2X2 },
  { id: 'isometric', label: 'Isometric', icon: Box },
] as const;

/** Additional options are separate from the five-button navigation tray. */
export function ModelOptions({
  container,
  active = true,
}: {
  container: RefObject<HTMLElement | null>;
  active?: boolean;
}) {
  const s = useExplorer();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) setExpanded(false);
  }, [active]);
  function close(restoreFocus = false) {
    setExpanded(false);
    if (restoreFocus) trigger.current?.querySelector('button')?.focus({ preventScroll: true });
  }
  useLayoutEffect(() => {
    if (!expanded || !panel.current || !trigger.current || !container.current) return;
    const element = panel.current;
    function position() {
      if (!trigger.current || !container.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const host = container.current.getBoundingClientRect();
      const stage = trigger.current.closest('.scene-area')?.getBoundingClientRect();
      const mobile = isMobileViewport();
      const left = mobile
        ? Math.max(
            8 - host.left,
            Math.min(stage?.right ?? host.right, window.innerWidth) -
              host.left -
              element.offsetWidth -
              8,
          )
        : Math.max(
            12,
            Math.min(
              anchor.right - host.left - element.offsetWidth,
              host.width - element.offsetWidth - 12,
            ),
          );
      const minimumTop = Math.max(8, (stage?.top ?? host.top) - host.top + 8);
      const above = anchor.top - host.top - element.offsetHeight - 12;
      const top =
        mobile || above >= minimumTop ? Math.max(minimumTop, above) : anchor.bottom - host.top + 12;
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
    }
    position();
    element.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() =>
      element.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
    );
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener('resize', position);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', position);
    };
  }, [expanded, container]);
  useEffect(() => {
    if (!expanded) return;
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !panel.current?.contains(target))
        setExpanded(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
    };
  }, [expanded]);
  return (
    <>
      <div ref={trigger} className="model-menu-trigger">
        <ModelControlButton
          label="Controls"
          icon={SlidersHorizontal}
          active={expanded}
          aria-haspopup="dialog"
          aria-expanded={expanded}
          aria-controls={expanded ? id : undefined}
          onClick={() => setExpanded(!expanded)}
        />
      </div>
      {expanded &&
        active &&
        container.current &&
        createPortal(
          <div
            ref={panel}
            id={id}
            className="model-options-panel"
            role="dialog"
            aria-label="Model controls"
          >
            <div className="model-options-heading">
              <span>Controls</span>
              <button type="button" aria-label="Close controls" onClick={() => close(true)}>
                <X size={17} />
              </button>
            </div>
            <div className="model-options-scroll">
              <div className="model-view-options" role="group" aria-label="Camera views">
                {viewpoints.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={s.camera.preset === id}
                    onClick={() => s.goCamera(id)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="model-extra-options" role="group" aria-label="Building controls">
                <button
                  type="button"
                  aria-pressed={s.structuralReview}
                  onClick={s.toggleStructuralReview}
                >
                  <Building2 size={16} />
                  <span>Grey structure</span>
                </button>
                <button
                  type="button"
                  aria-pressed={s.view === 'split'}
                  onClick={() => {
                    s.setView(s.view === 'split' ? '3d' : 'split');
                    close();
                  }}
                >
                  <Split size={16} />
                  <span>{s.view === 'split' ? '3D only' : 'Split View'}</span>
                </button>
                <button type="button" aria-pressed={s.exploded} onClick={s.toggleExploded}>
                  <SquareStack size={16} />
                  <span>{s.exploded ? 'Assemble floors' : 'Explode floors'}</span>
                </button>
                <button type="button" onClick={s.toggleRoof}>
                  {s.roofVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span>{s.roofVisible ? 'Hide roof' : 'Restore roof'}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={s.mode === 'architecture'}
                  onClick={() => s.setMode(s.mode === 'leasing' ? 'architecture' : 'leasing')}
                >
                  {s.mode === 'leasing' ? <ScanLine size={16} /> : <Store size={16} />}
                  <span>{s.mode === 'leasing' ? 'Architecture mode' : 'Leasing mode'}</span>
                </button>
                <button type="button" onClick={() => s.goCamera('reset')}>
                  <RotateCcw size={16} />
                  <span>Reset camera</span>
                </button>
              </div>
            </div>
          </div>,
          container.current,
        )}
    </>
  );
}
