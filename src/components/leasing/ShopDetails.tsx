'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Bookmark, Check, Layers } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { UnitPreview, Status } from './UnitPanel';
import { FloorPlan } from '@/components/floor-plan/FloorPlan';
import { area, money } from '@/lib/utils';
import type { Unit } from '@/types';
export function ShopDetails({ initialUnit }: { initialUnit: Unit }) {
  const s = useExplorer();
  const unit = s.units.find((u) => u.id === initialUnit.id) || initialUnit;
  useEffect(() => {
    s.select(initialUnit.id);
    s.setFloor(initialUnit.floor);
  }, [initialUnit.id, initialUnit.floor]);
  return (
    <main id="main" className="page-main content-width">
      <Link className="back-link" href="/shops">
        <ArrowLeft size={14} />
        Back to the spaces
      </Link>
      <div className="unit-page-grid">
        <div className="unit-page-media">
          {unit.images[0] ? <img src={unit.images[0]} alt={`Shop ${unit.id}`} /> : <UnitPreview />}
          <p className="demo-note">
            {unit.images[0]
              ? 'Illustrative unit image.'
              : 'Concept reference. Explore the simplified modeled interior in the 3D explorer.'}
          </p>
          <div className="selected-tags" style={{ marginTop: 20 }}>
            {unit.amenities.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </div>
        <div className="unit-page-content">
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h1>Shop {unit.id}</h1>
          <Status status={unit.status} />
          <p className="unit-location">
            <Layers size={14} />
            {s.floors.find((f) => f.id === unit.floor)?.name} · {unit.category}
          </p>
          <p>{unit.description}</p>
          <dl className="unit-specs">
            {[
              ['Area', `${area(unit.areaSqFt)} (${unit.areaSqFt} sq ft)`],
              ['Frontage × depth', `${unit.frontage} × ${unit.depth} m`],
              ['Ceiling height', `${unit.ceilingHeight} m`],
              ['Orientation', unit.orientation],
              ['Entrance', unit.entrance],
              [
                'Monthly rent',
                unit.pricePublic && unit.price !== undefined ? money(unit.price) : 'On request',
              ],
            ].map(([a, b]) => (
              <div key={a}>
                <dt>{a}</dt>
                <dd>{b}</dd>
              </div>
            ))}
          </dl>
          <div className="unit-page-actions">
            <button className="btn btn-primary" onClick={() => s.openEnquiry([unit.id])}>
              Enquire about this space <ArrowUpRight size={15} />
            </button>
            <button
              className="btn btn-outline"
              disabled={unit.status !== 'available' && !s.shortlist.includes(unit.id)}
              onClick={() => s.toggleShortlist(unit.id)}
            >
              {s.shortlist.includes(unit.id) ? <Check size={15} /> : <Bookmark size={15} />}
              {s.shortlist.includes(unit.id) ? 'Shortlisted' : 'Shortlist'}
            </button>
            <Link
              href="/explore"
              className="text-link"
              onClick={() => {
                s.select(unit.id);
                s.goCamera('focus');
              }}
            >
              Explore in 3D <ArrowUpRight size={15} />
            </Link>
          </div>
          <p className="demo-note">
            {unit.isDemo
              ? 'Demonstration unit. All dimensions, availability, and rental details require confirmation.'
              : 'Confirm availability and specifications with the leasing team.'}
            <br />
            Updated{' '}
            {new Date(unit.updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <div className="unit-page-plan">
        <FloorPlan />
      </div>
    </main>
  );
}
