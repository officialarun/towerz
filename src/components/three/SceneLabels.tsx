'use client';
import type { RefObject } from 'react';
import { MapPin } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { SITE_CONTEXT } from '@/data/site';
export function SceneLabels({ container }: { container: RefObject<HTMLDivElement | null> }) {
  const state = useExplorer();
  const unit = state.units.find((u) => u.id === (state.hoveredId || state.selectedId));
  return (
    <div className="scene-labels" ref={container}>
      {state.floors.map((f) => (
        <button
          key={f.id}
          data-floor-label={f.id}
          className={`floor-label ${state.floor === f.id ? 'selected' : ''}`}
          onClick={() => state.setFloor(state.floor === f.id ? 'all' : f.id)}
        >
          <strong>{f.label}</strong>
          <span>{f.name}</span>
        </button>
      ))}
      <div data-entrance className="entrance-label">
        ↑&nbsp; Raised ground entry
      </div>
      <div data-basement-entrance className="entrance-label">
        ↓&nbsp; Semi-basement access · provisional
      </div>
      <div data-atm-provision className="site-marker landmark" style={{ display: 'none' }}>
        SBI ATM · provision
      </div>
      {SITE_CONTEXT.map((marker) => (
        <button
          key={marker.id}
          data-site-marker={marker.id}
          className={`site-marker ${marker.kind}`}
          onClick={() =>
            state.goCamera(
              marker.id === 'police-station'
                ? 'opposite'
                : marker.kind === 'checkpoint'
                  ? 'top'
                  : 'road',
            )
          }
          style={{ display: 'none' }}
        >
          <MapPin size={12} />
          <span>{marker.label}</span>
        </button>
      ))}
      {state.units.map((u) => (
        <button
          key={u.id}
          data-unit-marker={u.id}
          className={`site-unit-marker ${u.status}`}
          style={{ display: 'none' }}
          onClick={() => state.select(u.id)}
          aria-label={`Explore unit ${u.id}`}
        >
          {u.id}
        </button>
      ))}
      {unit && (
        <div data-unit-label className="unit-tooltip">
          <span className={`status-dot ${unit.status}`} />
          <strong>{unit.id}</strong>
          {state.hoveredId && (
            <small>
              {unit.areaSqFt} sq ft · {unit.status}
            </small>
          )}
        </div>
      )}
    </div>
  );
}
