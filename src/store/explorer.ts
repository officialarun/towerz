'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEMO_UNITS, DEMO_PLAZA, FLOORS } from '@/data/demo';
import type {
  Unit,
  Floor,
  Plaza,
  FloorId,
  ViewMode,
  CameraPreset,
  ArchitecturalObject,
  BuildingView,
  ContextToggle,
} from '@/types';
type State = {
  units: Unit[];
  floors: Floor[];
  plaza: Plaza;
  selectedId: string | null;
  hoveredId: string | null;
  floor: FloorId | 'all' | 'roof';
  view: ViewMode;
  buildingView: BuildingView;
  structuralReview: boolean;
  showRoads: boolean;
  showLandmarks: boolean;
  showCheckpoints: boolean;
  showUnitLabels: boolean;
  exploded: boolean;
  roofVisible: boolean;
  autoRotate: boolean;
  mode: 'leasing' | 'architecture';
  inspected: ArchitecturalObject | null;
  interior: boolean;
  shortlist: string[];
  modal: 'enquiry' | 'shortlist' | null;
  enquiryIds: string[];
  camera: { preset: CameraPreset; nonce: number };
  toast: string | null;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setFloor: (floor: State['floor']) => void;
  setView: (view: ViewMode) => void;
  setBuildingView: (view: BuildingView) => void;
  toggleStructuralReview: () => void;
  toggleContext: (key: ContextToggle) => void;
  toggleExploded: () => void;
  toggleRoof: () => void;
  toggleRotate: () => void;
  setMode: (mode: State['mode']) => void;
  inspect: (object: ArchitecturalObject | null) => void;
  setInterior: (value: boolean) => void;
  toggleShortlist: (id: string) => void;
  openEnquiry: (ids?: string[]) => void;
  setModal: (modal: State['modal']) => void;
  goCamera: (preset: CameraPreset) => void;
  notify: (message: string) => void;
};
export const useExplorer = create<State>()(
  persist(
    (set, get) => ({
      units: DEMO_UNITS,
      floors: FLOORS,
      plaza: DEMO_PLAZA,
      selectedId: null,
      hoveredId: null,
      floor: 'all',
      view: '3d',
      buildingView: 'construction',
      structuralReview: false,
      showRoads: true,
      showLandmarks: true,
      showCheckpoints: true,
      showUnitLabels: true,
      exploded: false,
      roofVisible: true,
      autoRotate: false,
      mode: 'leasing',
      inspected: null,
      interior: false,
      shortlist: [],
      modal: null,
      enquiryIds: [],
      camera: { preset: 'road', nonce: 0 },
      toast: null,
      select: (id) => {
        set({
          selectedId: id,
          inspected: null,
          interior: false,
        });
      },
      hover: (hoveredId) => {
        if (get().hoveredId !== hoveredId) set({ hoveredId });
      },
      setFloor: (floor) => {
        set({
          floor,
          interior: false,
          roofVisible: floor === 'roof' || floor === 'all',
          camera: { preset: floor === 'roof' ? 'top' : 'front', nonce: get().camera.nonce + 1 },
        });
      },
      setView: (view) =>
        set({
          view,
          ...(!['3d', 'split'].includes(view) ? { autoRotate: false, hoveredId: null } : {}),
        }),
      setBuildingView: (buildingView) => {
        const s = get();
        if (s.buildingView === buildingView && !s.structuralReview) return;
        const floor = s.floor;
        set({
          buildingView,
          structuralReview: false,
          floor,
          interior: false,
          inspected: null,
          autoRotate: false,
          roofVisible: floor === 'all' || floor === 'roof',
          camera: { preset: 'road', nonce: s.camera.nonce + 1 },
        });
      },
      toggleStructuralReview: () => set((s) => ({
        structuralReview: !s.structuralReview,
        autoRotate: false,
        ...(s.camera.preset === 'comparison' ? {
          camera: { preset: 'isometric', nonce: s.camera.nonce + 1 },
        } : {}),
      })),
      toggleContext: (key) => set((s) => ({ [key]: !s[key] })),
      toggleExploded: () =>
        set((s) => ({
          exploded: !s.exploded,
          interior: false,
          roofVisible: s.exploded,
          camera: { preset: 'isometric', nonce: s.camera.nonce + 1 },
        })),
      toggleRoof: () => set((s) => ({ roofVisible: !s.roofVisible })),
      toggleRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
      setMode: (mode) => set({ mode, inspected: null, interior: false }),
      inspect: (inspected) => set({ inspected, selectedId: null }),
      setInterior: (interior) => {
        if (interior) {
          const unit = get().units.find((u) => u.id === get().selectedId);
          if (!unit) return;
          set({
            interior: true,
            floor: unit.floor,
            roofVisible: false,
            autoRotate: false,
            camera: { preset: 'interior', nonce: get().camera.nonce + 1 },
          });
        } else
          set({ interior: false, camera: { preset: 'isometric', nonce: get().camera.nonce + 1 } });
      },
      toggleShortlist: (id) => {
        const { shortlist, units, notify } = get();
        if (!shortlist.includes(id) && units.find((u) => u.id === id)?.status !== 'available') {
          notify('Only available units can be added to your shortlist.');
          return;
        }
        set({
          shortlist: shortlist.includes(id)
            ? shortlist.filter((x) => x !== id)
            : [...shortlist, id],
        });
      },
      openEnquiry: (ids) => set({ modal: 'enquiry', enquiryIds: ids || get().shortlist }),
      setModal: (modal) => set({ modal }),
      goCamera: (preset) =>
        set((s) => ({
          camera: { preset, nonce: s.camera.nonce + 1 },
          interior: false,
          autoRotate: false,
          ...(preset === 'comparison' ? {
            structuralReview: true,
            buildingView: 'construction',
            floor: 'all',
            exploded: false,
            roofVisible: false,
          } : {}),
        })),
      notify: (toast) => {
        set({ toast });
        setTimeout(() => set({ toast: null }), 4200);
      },
    }),
    {
      name: 'plaza-shortlist-v1',
      partialize: (s) => ({ shortlist: s.shortlist }),
      skipHydration: true,
    },
  ),
);
