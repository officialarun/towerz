'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Expand,
  Layers,
  Maximize2,
  MoveHorizontal,
  Store,
  X,
  DoorOpen,
  ScanLine,
  Box,
} from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { isMobileViewport } from '@/hooks/useIsMobile';
import { area, money } from '@/lib/utils';
import { BUILDING } from '@/data/building';
export function UnitPreview({ className = '' }: { className?: string }) {
  const proposed = useExplorer((s) => s.buildingView === 'proposed');
  return (
    <div className={`unit-preview ${className}`}>
      <svg
        viewBox="0 0 400 230"
        role="img"
        aria-label={`${proposed ? 'Proposed finish' : 'Photo-guided structural frame'} illustrative elevation`}
      >
        <rect width="400" height="230" fill="#c4d2d8" />
        <path d="M0 173h400v57H0z" fill="#a6997c" />
        <path d="M45 173v43h310v-43" fill="#88816e" stroke="#c6bfac" strokeWidth="3" />
        <path d="M55 188h290V28H55z" fill={proposed ? '#756f61' : '#54554e'} />
        {[30, 72, 114, 156].map((y) =>
          [80, 150, 220, 290].map((x) => (
            <g key={`${x}-${y}`}>
              {proposed ? (
                <>
                  <rect x={x - 17} y={y} width="57" height="32" fill="#71898c" />
                  <path d={`M${x + 11} ${y}v32`} stroke="#302f2a" strokeWidth="3" />
                </>
              ) : (
                <path d={`M${x} ${y}l18 31m6-31-19 31`} stroke="#a49470" strokeWidth="3" />
              )}
            </g>
          )),
        )}
        {BUILDING.columns.x.map((column) => {
          const x = 200 + column * 10.5;
          return (
            <g key={x}>
              <path d={`M${x} 28v160`} stroke={proposed ? '#d1c9b6' : '#b0aa96'} strokeWidth="10" />
              {!proposed && <path d={`M${x - 2} 28V8m4 20V5`} stroke="#6d5f49" strokeWidth="1.5" />}
            </g>
          );
        })}
        <path
          d="M49 24h302M49 66h302M49 108h302M49 150h302M49 192h302"
          stroke={proposed ? '#ded7c5' : '#b5af9b'}
          strokeWidth="10"
        />
        <path d="M100 150h65l-7 24H92zM235 150h65l8 24h-66z" fill="#bcb6a3" stroke="#8c897b" />
        <path d="M182 173h36v37h-36z" fill="#bcb6a3" />
        {[179, 185, 191, 197, 203, 209].map((y) => (
          <path key={y} d={`M182 ${y}h36`} stroke="#8c897b" />
        ))}
        <path
          d="M55 150 30 129h25M55 108 30 129M55 108 30 87h25M55 66 30 87"
          fill="none"
          stroke="#a9a491"
          strokeWidth="6"
        />
        <path d="M0 173h45m310 0h45" stroke="#e1ce9f" strokeWidth="2" strokeDasharray="4 3" />
        {[
          ['2F', 53],
          ['1F', 95],
          ['GF', 137],
          ['B', 179],
        ].map(([label, y]) => (
          <text key={label} x="363" y={y} fill="#292d28" fontSize="11">
            {label}
          </text>
        ))}
        <path d="M355 182V82" stroke="#6d6149" strokeWidth="8" />
        <path d="M350 78c-50 2-40-56-6-51 35-36 73 7 47 28 26 19-8 50-41 23" fill="#657853" />
      </svg>
      <span>{proposed ? 'PROPOSED FINISH' : 'RCC FRAME'} · SCHEMATIC</span>
    </div>
  );
}
export function Status({ status }: { status: string }) {
  return (
    <span className={`status-badge ${status}`}>
      <i />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
export function UnitPanel() {
  const s = useExplorer();
  const panel = useRef<HTMLElement>(null);
  const unit = s.units.find((u) => u.id === s.selectedId);
  const available = s.units.filter((u) => u.status === 'available').length;
  function reveal(selector: string) {
    if (!isMobileViewport()) return;
    requestAnimationFrame(() =>
      panel.current
        ?.closest('.explorer')
        ?.querySelector(selector)
        ?.scrollIntoView({
          block: 'start',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        }),
    );
  }
  useEffect(() => {
    if (!unit || !isMobileViewport()) return;
    const frame = requestAnimationFrame(() =>
      panel.current?.scrollIntoView({
        block: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [unit?.id]);
  if (s.inspected)
    return (
      <aside className="unit-panel architecture-panel">
        <div className="panel-heading">
          <Box size={22} />
          <button
            className="round-button"
            aria-label="Close component details"
            onClick={() => s.inspect(null)}
          >
            <X size={16} />
          </button>
        </div>
        <p className="eyebrow">ARCHITECTURE INSPECTION</p>
        <h2>{s.inspected.name}</h2>
        <dl>
          <div>
            <dt>Component</dt>
            <dd>{s.inspected.type}</dd>
          </div>
          <div>
            <dt>Object ID</dt>
            <dd>{s.inspected.id}</dd>
          </div>
        </dl>
        <p className="muted">{s.inspected.description}</p>
      </aside>
    );
  if (!unit)
    return (
      <aside className="unit-panel overview-panel">
        <div className="overview-top">
          <span className="mini-line" />
          <span className="live-label">
            <i /> EXPLORE THE POSSIBILITIES
          </span>
        </div>
        <h2>
          A place for
          <br />
          your next chapter.
        </h2>
        <p>
          Find a space that’s as
          <br />
          ambitious as your business.
        </p>
        <div className="overview-stats">
          <div>
            <strong>{String(s.units.length).padStart(2, '0')}</strong>
            <span>Demo spaces</span>
          </div>
          <div>
            <strong>
              {String(available).padStart(2, '0')}
              <i />
            </strong>
            <span>Demo available</span>
          </div>
          <div>
            <strong>04</strong>
            <span>B + GF · 1F · 2F</span>
          </div>
        </div>
        <button
          className="panel-discover"
          onClick={() => {
            const u =
              s.units.find((u) => u.id === 'S2-05' && u.status === 'available') ||
              s.units.find((u) => u.status === 'available');
            if (u) {
              s.select(u.id);
              s.goCamera('focus');
              reveal('.scene-area');
            }
          }}
        >
          Discover an available space <ArrowUpRight size={17} />
        </button>
        <div className="panel-tip">
          <ScanLine size={15} />
          <span>Select a labeled space. Unit layouts are illustrative.</span>
        </div>
      </aside>
    );
  const saved = s.shortlist.includes(unit.id);
  return (
    <aside
      ref={panel}
      className="unit-panel selected-panel"
      aria-label={`Details for shop ${unit.id}`}
    >
      <div className="unit-card-header">
        <div className="preview-wrap">
          {unit.images[0] ? (
            <img src={unit.images[0]} alt={`Shop ${unit.id}`} className="unit-photo" />
          ) : (
            <UnitPreview />
          )}
          <button
            className="preview-focus round-button"
            aria-label="Focus on this unit in 3D"
            title="Focus in 3D"
            onClick={() => {
              s.setView('3d');
              s.setFloor(unit.floor);
              s.goCamera('focus');
            }}
          >
            <Maximize2 size={13} />
          </button>
        </div>
        <div className="unit-card-summary">
          <div className="unit-title">
            <h2>Shop {unit.id}</h2>
            <Status status={unit.status} />
          </div>
          <p className="unit-location">
            <Layers size={14} />
            {s.floors.find((f) => f.id === unit.floor)?.name}{' '}
            <span>({s.floors.find((f) => f.id === unit.floor)?.label})</span>
          </p>
        </div>
        <button
          className="preview-close round-button"
          aria-label="Close unit details"
          onClick={() => s.select(null)}
        >
          <X size={16} />
        </button>
      </div>
      <dl className="unit-specs">
        <div>
          <dt>
            <ScanLine size={14} />
            Area
          </dt>
          <dd>
            {area(unit.areaSqFt)} <small>({unit.areaSqFt} sq ft)</small>
          </dd>
        </div>
        <div>
          <dt>
            <MoveHorizontal size={14} />
            Frontage
          </dt>
          <dd>{unit.frontage.toFixed(1)} m</dd>
        </div>
        <div>
          <dt>
            <Expand size={14} />
            Ceiling height
          </dt>
          <dd>{unit.ceilingHeight.toFixed(1)} m</dd>
        </div>
        {unit.pricePublic && unit.price !== undefined && (
          <div>
            <dt>Rent / month</dt>
            <dd>{money(unit.price)}</dd>
          </div>
        )}
      </dl>
      <div className="unit-secondary">
        <button
          onClick={() => {
            s.setFloor(unit.floor);
            s.setView(isMobileViewport() ? 'plan' : s.view === '3d' ? 'split' : 'plan');
            reveal('.plan-area');
          }}
        >
          <Layers size={13} />
          Floor plan
        </button>
        <button
          onClick={() => {
            const entering = !s.interior;
            s.setInterior(entering);
            reveal(entering ? '.interior-banner' : '.scene-area');
          }}
        >
          <DoorOpen size={13} />
          {s.interior ? 'Exit interior' : 'Explore interior'}
        </button>
      </div>
      <div className="unit-actions">
        <button
          className="btn btn-primary"
          aria-label="Enquire about this space"
          onClick={() => s.openEnquiry([unit.id])}
        >
          <span className="desktop-action-label">Enquire about this space</span>
          <span className="mobile-action-label">Enquire</span> <ArrowUpRight size={15} />
        </button>
        <button
          className={`btn btn-outline ${saved ? 'is-saved' : ''}`}
          aria-label={saved ? 'Added to shortlist' : 'Add to shortlist'}
          disabled={unit.status !== 'available' && !saved}
          onClick={() => s.toggleShortlist(unit.id)}
        >
          {saved ? <Check size={15} /> : <Bookmark size={15} />}{' '}
          <span className="desktop-action-label">
            {saved ? 'Added to shortlist' : 'Add to shortlist'}
          </span>
          <span className="mobile-action-label">{saved ? 'Saved' : 'Shortlist'}</span>
        </button>
      </div>
      <Link href={`/shops/${unit.id}`} className="unit-detail-link">
        View full details <ChevronRight size={12} />
      </Link>
      <p className="unit-demo">Demo unit layout · Dimensions and status unverified</p>
    </aside>
  );
}
