'use client';
import { useId, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, Move } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { STATUS_COLORS, FLOORS } from '@/data/demo';
import { BUILDING, unitLayout, slabOpenings, type PlanRect } from '@/data/building';
import { circulationPlan, flightFootprint } from '@/lib/three/circulation';
import { DEFAULT_PLAN_ZOOM } from '@/lib/presentation';
const px = (x: number) => 360 + x * 17.5;
const py = (z: number) => 70 + (z - BUILDING.slab.rear) * 22;
function rect(r: PlanRect) {
  return {
    x: px(r.left),
    y: py(r.rear),
    width: (r.right - r.left) * 17.5,
    height: (r.front - r.rear) * 22,
  };
}
export function FloorPlan({ compact = false }: { compact?: boolean }) {
  const s = useExplorer();
  const gridId = useId();
  const [scale, setScale] = useState(DEFAULT_PLAN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const floor =
    typeof s.floor === 'number'
      ? s.floor
      : (s.units.find((u) => u.id === s.selectedId)?.floor ?? 0);
  const units = s.units.filter((u) => u.floor === floor);
  const circulation = circulationPlan();
  const upperDestination = Math.min(floor + 1, FLOORS.length - 1);
  const flights = circulation.flights.filter((f) =>
    floor === 0
      ? f.ownerFloor === 0
      : f.id.startsWith('front')
        ? floor === 1
        : f.ownerFloor === upperDestination && !f.id.startsWith('basement'),
  );
  return (
    <div className={`floor-plan ${compact ? 'compact' : ''}`}>
      <div className="plan-heading">
        <div>
          <p className="eyebrow">A DIFFERENT PERSPECTIVE</p>
          <h2>{s.floors.find((f) => f.id === floor)?.name}</h2>
          <p>
            {floor === 0
              ? 'Semi-basement access provisional · ATM provision in G-05.'
              : 'Shared walkway, corridor and turning stairs · dimensions provisional.'}
          </p>
        </div>
        <div className="floor-tabs" aria-label="Floor plan floor">
          {s.floors.map((f) => (
            <button
              key={f.id}
              className={floor === f.id ? 'active' : ''}
              onClick={() => s.setFloor(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <svg
        className="plan-svg"
        viewBox="0 0 720 720"
        role="img"
        aria-label={`${s.floors.find((f) => f.id === floor)?.name || FLOORS[floor].name} interactive demonstration floor plan`}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('[data-unit]')) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setPan({
              x: drag.current.px + e.clientX - drag.current.x,
              y: drag.current.py + e.clientY - drag.current.y,
            });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onWheel={(e) => setScale((x) => Math.max(0.6, Math.min(2.5, x - e.deltaY * 0.001)))}
      >
        <defs>
          <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0v24" fill="none" stroke="#e9d9be" strokeOpacity=".05" />
          </pattern>
        </defs>
        <rect width="720" height="720" fill={`url(#${gridId})`} />
        <g
          className="plan-content"
          transform={`translate(${360 + pan.x} ${360 + pan.y}) scale(${scale}) translate(-360 -360)`}
        >
          <rect {...rect(BUILDING.slab)} fill="#cbb99508" stroke="#b8a68b" strokeWidth="2" />
          <rect
            {...rect({
              left: -13,
              right: 13,
              rear: BUILDING.forecourt.rear,
              front: BUILDING.forecourt.front,
            })}
            fill="#d7c7ab08"
            stroke="#8d826e"
            strokeDasharray="5 4"
          />
          <text x="470" y={py(14.8)} textAnchor="middle" className="plan-annotation">
            OPEN FORECOURT · ROAD GRADE
          </text>
          <rect
            data-plan-walkway
            {...rect({ left: -13, right: 13, ...BUILDING.walkway })}
            fill="#e4d2a51c"
            stroke="#e4d2a56b"
          />
          <rect data-plan-corridor {...rect(BUILDING.corridor)} fill="#d7c7ab0e" />
          <rect
            data-plan-cross-passage
            {...rect({ left: -13, right: 13, ...BUILDING.crossPassage })}
            fill="#e4d2a51c"
          />
          <text x="360" y={py(3.1)} textAnchor="middle" className="plan-annotation">
            SHARED FRONT WALKWAY
          </text>
          <text
            x="360"
            y="175"
            textAnchor="middle"
            className="plan-annotation"
            transform="rotate(-90 360 175)"
          >
            INTERNAL CORRIDOR
          </text>
          <text x={px(6.6)} y={py(-2.2)} textAnchor="middle" className="plan-annotation">
            CROSS-PASSAGE
          </text>
          {slabOpenings(floor).map((h, i) => (
            <rect key={i} {...rect(h)} fill="#211f1b" stroke="#8d826e" strokeDasharray="3 3" />
          ))}
          {circulation.landings
            .filter((l) => l.ownerFloor === floor && !l.id.includes('turn'))
            .map((l) => (
              <rect key={l.id} {...rect(l)} fill="#c8b99518" stroke="#b8a68b" strokeWidth=".8" />
            ))}
          {units.map((u) => {
            const layout = unitLayout(u.slot),
              x = px(layout.x - layout.width / 2),
              y = py(layout.z - layout.depth / 2);
            const width = layout.width * 17.5,
              height = layout.depth * 22,
              selected = s.selectedId === u.id,
              saved = s.shortlist.includes(u.id),
              color = STATUS_COLORS[u.status];
            return (
              <g
                key={u.id}
                data-unit={u.id}
                role="button"
                tabIndex={0}
                aria-label={`${u.id}, ${u.areaSqFt} square feet, ${u.status}`}
                onClick={() => s.select(u.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    s.select(u.id);
                  }
                }}
                className="plan-unit"
              >
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="1"
                  fill={color}
                  fillOpacity={selected ? 0.3 : 0.1}
                  stroke={selected ? '#f4e7d2' : color}
                  strokeWidth={selected ? 2.5 : 1}
                  strokeDasharray={saved ? '5 3' : undefined}
                />
                <rect
                  x={layout.x < 0 ? x + width - 3 : x}
                  y={y + height / 2 - 8}
                  width="3"
                  height="16"
                  fill={color}
                />
                <text
                  x={x + width / 2}
                  y={y + height / 2 - 2}
                  textAnchor="middle"
                  fill={selected ? '#fff0d5' : '#e4d5bb'}
                  fontSize="calc(14px * var(--font-scale))"
                  fontWeight="500"
                >
                  {u.id}
                </text>
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 13}
                  textAnchor="middle"
                  fill="#aca394"
                  fontSize="calc(8px * var(--font-scale))"
                >
                  {u.areaSqFt} sq ft
                </text>
              </g>
            );
          })}
          {floor === 0 && (
            <g>
              <rect x={px(2.6)} y={py(0.7)} width="14" height="13" fill="#5477a2" />
            </g>
          )}
          {flights.map((f) => {
            const bounds = flightFootprint(f),
              alongX = f.start[0] !== f.end[0];
            return (
              <g key={f.id} data-plan-stair={f.id}>
                <rect {...rect(bounds)} fill="#cbb99512" stroke="#b8a68b" />
                {Array.from({ length: f.steps }, (_, i) => {
                  const t = i / f.steps;
                  return alongX ? (
                    <path
                      key={i}
                      d={`M${px(f.start[0] + (f.end[0] - f.start[0]) * t)} ${py(bounds.rear)}v${(bounds.front - bounds.rear) * 22}`}
                      stroke="#b8a68b"
                      strokeWidth=".7"
                    />
                  ) : (
                    <path
                      key={i}
                      d={`M${px(bounds.left)} ${py(f.start[2] + (f.end[2] - f.start[2]) * t)}h${(bounds.right - bounds.left) * 17.5}`}
                      stroke="#b8a68b"
                      strokeWidth=".7"
                    />
                  );
                })}
                <path
                  d={`M${px(f.start[0])} ${py(f.start[2])}L${px(f.end[0])} ${py(f.end[2])}`}
                  stroke="#f2ddb7"
                  strokeWidth="1.3"
                />
                <circle cx={px(f.end[0])} cy={py(f.end[2])} r="2.5" fill="#f2ddb7" />
              </g>
            );
          })}
          {BUILDING.columns.x.flatMap((x) =>
            BUILDING.columns.z.map((z) => (
              <rect
                key={`${x}-${z}`}
                x={px(x) - 4}
                y={py(z) - 4}
                width="8"
                height="8"
                fill="#c7b897"
              />
            )),
          )}
          <text
            x={px(-14.5)}
            y={py(8.6)}
            textAnchor="middle"
            fill="#c9b898"
            fontSize="calc(7px * var(--font-scale))"
          >
            LEFT RETURN STAIR
          </text>
          <text
            x={px(9)}
            y={py(-6.45)}
            textAnchor="middle"
            fill="#c9b898"
            fontSize="calc(7px * var(--font-scale))"
          >
            RIGHT STAIR · PROVISIONAL
          </text>
          <path d="M300 635h120" stroke="#e6d1ab" />
          <text
            x="360"
            y="658"
            textAnchor="middle"
            fill="#b6a68c"
            fontSize="calc(9px * var(--font-scale))"
            letterSpacing="2"
          >
            ROAD → FORECOURT → COLUMNS → STAIRS
          </text>
        </g>
      </svg>
      <div className="plan-bottom">
        <span>
          <Move size={13} /> Drag to pan
        </span>
        <div>
          <button
            className="round-button"
            aria-label="Zoom out floor plan"
            onClick={() => setScale((x) => Math.max(0.6, x - 0.2))}
          >
            <Minus size={16} />
          </button>
          <button
            className="round-button"
            aria-label="Reset floor plan"
            onClick={() => {
              setScale(DEFAULT_PLAN_ZOOM);
              setPan({ x: 0, y: 0 });
            }}
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="round-button"
            aria-label="Zoom in floor plan"
            onClick={() => setScale((x) => Math.min(2.5, x + 0.2))}
          >
            <Plus size={16} />
          </button>
        </div>
        <span>CONCEPT · NOT TO SCALE</span>
      </div>
    </div>
  );
}
