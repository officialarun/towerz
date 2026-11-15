export type FloorId = 0 | 1 | 2 | 3;
export type Availability = 'available' | 'reserved' | 'leased';
export type Unit = {
  id: string;
  floor: FloorId;
  slot: number;
  meshId: string;
  category: string;
  areaSqFt: number;
  frontage: number;
  depth: number;
  ceilingHeight: number;
  orientation: string;
  entrance: string;
  description: string;
  status: Availability;
  price?: number;
  pricePublic: boolean;
  images: string[];
  amenities: string[];
  floorPlanRef: string;
  updatedAt: string;
  isDemo: boolean;
};
export type Floor = { id: FloorId; label: string; name: string; description: string };
export type Plaza = {
  name: string;
  tagline: string;
  description: string;
  address: string;
  mapUrl: string;
  contactEmail: string;
  contactPhone: string;
  gallery: string[];
  amenities: { title: string; description: string; icon: string }[];
};
export type ArchitecturalObject = { id: string; name: string; type: string; description: string };
export type CameraPreset =
  | 'comparison'
  | 'front'
  | 'road'
  | 'opposite'
  | 'rear'
  | 'left'
  | 'right'
  | 'top'
  | 'isometric'
  | 'reset'
  | 'focus'
  | 'interior';
export type ViewMode = 'final' | '3d' | 'plan' | 'split';
export type BuildingView = 'construction' | 'proposed';
export type ContextToggle = 'showRoads' | 'showLandmarks' | 'showCheckpoints' | 'showUnitLabels';
export type SiteContextMarker = {
  id: string;
  label: string;
  position: [number, number, number];
  kind: 'road' | 'landmark' | 'checkpoint';
};
