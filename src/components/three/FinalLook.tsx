'use client';
import Image from 'next/image';
import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bookmark, Box, Minus, Plus, RotateCcw } from 'lucide-react';
import { useExplorer } from '@/store/explorer';

/** The supplied streetside impression, kept distinct from the selectable 3D model. */
export function FinalLook() {
  const s = useExplorer();
  const unit = s.units.find((u) => u.id === s.selectedId);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  useLayoutEffect(() => {
    stage.current
      ?.closest('.site-explorer')
      ?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, []);
  function changeZoom(next: number) {
    setZoom(Math.min(2.5, Math.max(1, next)));
    setPan({ x: 0, y: 0 });
  }
  return (
    <div className="final-look">
      <div
        ref={stage}
        className={`final-image-stage ${zoom > 1 ? 'is-zoomed' : ''}`}
        onPointerDown={(event) => {
          if (zoom === 1) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(event) => {
          if (!drag.current || !stage.current) return;
          const bounds = stage.current.getBoundingClientRect();
          const limitX = (bounds.width * (zoom - 1)) / 2;
          const limitY = (bounds.height * (zoom - 1)) / 2;
          setPan({
            x: Math.max(
              -limitX,
              Math.min(limitX, drag.current.px + event.clientX - drag.current.x),
            ),
            y: Math.max(
              -limitY,
              Math.min(limitY, drag.current.py + event.clientY - drag.current.y),
            ),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="final-image-transform"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <Image
            src="/kedarnath-plaza-final-look.png"
            alt="Artist’s impression of Kedarnath Plaza’s finished frontage beside the neighbourhood shrine, with glazed retail levels, entrance stairs and the surrounding street."
            fill
            sizes="(max-aspect-ratio: 1672/941) 178vh, 100vw"
            preload
            draggable={false}
          />
        </div>
      </div>
      <div className="final-image-tools" role="group" aria-label="Final look image controls">
        <button
          type="button"
          aria-label="Zoom out final image"
          disabled={zoom === 1}
          onClick={() => changeZoom(zoom - 0.25)}
        >
          <Minus size={17} />
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button
          type="button"
          aria-label="Zoom in final image"
          disabled={zoom === 2.5}
          onClick={() => changeZoom(zoom + 0.25)}
        >
          <Plus size={17} />
        </button>
        <button type="button" aria-label="Reset final image" onClick={() => changeZoom(1)}>
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="final-look-copy">
        <div>
          <p className="eyebrow">KEDARNATH PLAZA · THE FINAL LOOK</p>
          <h1>A place for your next chapter.</h1>
          <p className="final-look-description">
            Three commercial floors above a semi-basement. Discover the vision, then explore GF, 1F
            and 2F in 3D.
          </p>
          <p className="final-image-caption">
            Artist’s impression · Finishes and tenant signage are illustrative.
            {s.shortlist.length > 0 && (
              <button
                type="button"
                className="final-shortlist"
                onClick={() => s.setModal('shortlist')}
              >
                <Bookmark size={13} /> Shortlist {s.shortlist.length}
              </button>
            )}
          </p>
        </div>
        <div className="final-look-actions">
          {unit && (
            <p className="final-selected-unit">
              Selected: {unit.id} · {s.floors.find((f) => f.id === unit.floor)?.name}
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={() => s.setView('3d')}>
            <Box size={18} /> {unit ? 'Back to my space in 3D' : 'Explore in 3D'}{' '}
            <ArrowUpRight size={17} />
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => s.openEnquiry(unit ? [unit.id] : [])}
          >
            {unit ? 'Enquire about this space' : 'Enquire about the plaza'}{' '}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
