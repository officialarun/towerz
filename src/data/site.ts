import type { SiteContextMarker } from '@/types';

const address = 'Opposite Inayat Nagar Police Station, Faizabad, Ayodhya, Uttar Pradesh';

/** User-provided location. Scene positions below are illustrative, not map coordinates. */
export const SITE_LOCATION = {
  address,
  roadName: 'Ayodhya–Raebareli Rd',
  roadCode: 'SH15',
  landmark: 'Inayat Nagar Police Station',
  oppositeNote: 'Opposite Police Station',
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
  accuracyNote:
    'Approximate reconstruction from supplied street views; proposed finish and unit layouts are illustrative.',
} as const;

/** Update labels and scene-relative positions here when verified site information is supplied. */
export const SITE_CONTEXT: SiteContextMarker[] = [
  {
    id: 'ayodhya-raebareli-road',
    label: `${SITE_LOCATION.roadName} · ${SITE_LOCATION.roadCode}`,
    position: [17, 0.3, 22],
    kind: 'road',
  },
  {
    id: 'police-station',
    label: SITE_LOCATION.landmark,
    position: [0, 4.5, 43],
    kind: 'landmark',
  },
  {
    id: 'roadside-shrine',
    label: 'Small roadside shrine',
    position: [20.1, 5.9, 8.8],
    kind: 'landmark',
  },
  {
    id: 'neighboring-shops',
    label: 'Neighboring shops',
    position: [-23, 5, 1],
    kind: 'landmark',
  },
  {
    id: 'pedestrian-crossing',
    label: 'Pedestrian crossing / junction',
    position: [-15.4, 0.4, 27],
    kind: 'checkpoint',
  },
];
