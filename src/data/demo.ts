import { BUILDING, unitLayout } from './building';
import type { Floor, Plaza, Unit } from '@/types';
import { SITE_LOCATION } from './site';
export const FLOORS: Floor[] = [
  {
    id: 0,
    label: 'B',
    name: 'Semi-basement',
    description:
      'Partly below road grade, with visible openings beneath the raised ground floor. The separate pedestrian access position is provisional.',
  },
  {
    id: 1,
    label: 'GF',
    name: 'Ground Floor',
    description:
      'Raised ground-level retail reached by the broad front stairs. Proposed shop divisions require verified drawings.',
  },
  {
    id: 2,
    label: '1F',
    name: 'First Floor',
    description:
      'First-floor retail, connected by the left turning stair and a provisional recessed right stair.',
  },
  {
    id: 3,
    label: '2F',
    name: 'Second Floor',
    description:
      'Additional completed commercial level on the same column grid. Upper structure and unit divisions are extrapolated.',
  },
];
export const STATUS_COLORS = { available: '#80b86b', reserved: '#d7a752', leased: '#8e8e87' };
export const FLOOR_HEIGHT = BUILDING.floorHeight;
export const BASE_HEIGHT = BUILDING.levels[0];
// Retained for the inactive legacy model; the active model uses unitLayout per bay.
export const UNIT_WIDTH = 8.6;
export const UNIT_DEPTH = 1.9;
export function unitPosition(unit: Pick<Unit, 'slot'>): [number, number, number] {
  const { x, z } = unitLayout(unit.slot);
  return [x, 0, z];
}
export const DEMO_UNITS: Unit[] = Array.from({ length: FLOORS.length * 8 }, (_, i) => {
  const floor = Math.floor(i / 8) as Unit['floor'];
  const slot = i % 8;
  const layout = unitLayout(slot);
  const id = `${floor === 0 ? 'G' : `S${floor}`}-${String(slot + 1).padStart(2, '0')}`;
  return {
    id,
    floor,
    slot,
    meshId: `unit_${id}`,
    category: ['Retail', 'Showroom', 'Studio', 'Retail'][slot % 4],
    areaSqFt: Math.round(layout.width * layout.depth * 10.764),
    frontage: layout.width,
    depth: layout.depth,
    ceilingHeight: Number((FLOOR_HEIGHT - 0.7).toFixed(2)),
    orientation: [0, 4].includes(slot)
      ? 'Road-side concept frontage'
      : 'Common access concept frontage',
    entrance:
      floor === 0
        ? 'Separate semi-basement access and central corridor (provisional)'
        : 'Raised front entrance and common circulation (illustrative)',
    description:
      'Illustrative leasing allocation within the plaza concept. Area, frontage, fit-out and availability are demonstration data awaiting owner verification.' +
      (floor === 0 && slot === 4
        ? ' Includes a provisional SBI ATM fit-out within the bay, not a confirmed tenancy.'
        : ''),
    status: [2, 9, 19, 27].includes(i)
      ? 'leased'
      : [3, 6, 12, 17, 23, 25, 31].includes(i)
        ? 'reserved'
        : 'available',
    pricePublic: false,
    images: [],
    amenities: ['Illustrative layout', 'Proposed shopfront', 'Dimensions unverified'],
    floorPlanRef: `floor-${floor}`,
    updatedAt: '2026-11-14T00:00:00.000Z',
    isDemo: true,
  };
});
export const DEMO_PLAZA: Plaza = {
  name: 'The Plaza',
  tagline: 'A roadside setting. Room for what comes next.',
  description:
    'A commercial plaza along Ayodhya–Raebareli Road / SH15, opposite Inayat Nagar Police Station. Explore its photo-guided lower frame, aligned upper-floor proposal and connected circulation.',
  address: SITE_LOCATION.address,
  mapUrl: SITE_LOCATION.directionsUrl,
  contactEmail: '',
  contactPhone: '',
  gallery: [],
  amenities: [
    {
      title: 'Roadside frontage',
      description: 'The reference views place the plaza along Ayodhya–Raebareli Road / SH15.',
      icon: 'layout',
    },
    {
      title: 'RCC construction',
      description:
        'Open column bays, broad slabs and unfinished concrete are visible in the supplied photographs.',
      icon: 'atrium',
    },
    {
      title: 'Front and side stairs',
      description:
        'Broad front stair runs and a narrower stair at the left edge guide the reconstructed access.',
      icon: 'stairs',
    },
    {
      title: 'Established surroundings',
      description:
        'Mixed-use shops, mature trees and a small roadside shrine form the surrounding context.',
      icon: 'tree',
    },
    {
      title: 'Opposite the police station',
      description:
        'Inayat Nagar Police Station is the location landmark provided for this project.',
      icon: 'light',
    },
    {
      title: 'Proposed fit-out',
      description:
        'Glazed shopfronts and clean fascia are a concept for discussion, subject to drawings and approvals.',
      icon: 'glass',
    },
  ],
};
