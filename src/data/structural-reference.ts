import { BUILDING, floorElevation } from './building';

/** Manual image-space observations, not surveyed or photogrammetrically calibrated points. */
export const STRUCTURAL_REFERENCE = {
  source: 'Screenshot from 2026-11-15 02-04-35.png',
  image: { width: 1650, height: 970, viewportTop: 103, viewportHeight: 837 },
  camera: {
    position: [7.254, 1.669, 36.261] as [number, number, number],
    target: [9.325, 1.591, 0] as [number, number, number],
    fov: 60.99,
  },
  columns: [
    { head: [267, 313], foot: [267, 608] },
    { head: [495, 327], foot: [495, 594] },
    { head: [671, 337], foot: [671, 582] },
    { head: [879, 350], foot: [879, 567] },
  ],
} as const;

export function structuralReferencePoints() {
  return STRUCTURAL_REFERENCE.columns.flatMap((column, index) =>
    (['head', 'foot'] as const).map((datum) => ({
      id: `C${index + 1}-${datum}`,
      world: [
        BUILDING.columns.x[index],
        datum === 'head' ? floorElevation(2) - 0.42 : 0,
        BUILDING.columns.z.at(-1)!,
      ] as [number, number, number],
      image: [...column[datum]] as [number, number],
    })),
  );
}
