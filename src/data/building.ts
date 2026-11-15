/** Photo-guided model parameters in metres, not surveyed construction dimensions. +Z faces SH15. */
const semiBasementElevation = -1.45;
const floorToFloorHeight = 4.25;
const frontStairFoot = 8.5;
const frontStairSteps = 16;
const frontStairTread = 0.28;
export const BUILDING = {
  levels: Array.from(
    { length: 4 },
    (_, floor) => semiBasementElevation + floor * floorToFloorHeight,
  ),
  floorHeight: floorToFloorHeight,
  slab: { left: -13, right: 13, rear: -7.25, front: 9.25, thickness: 0.3 },
  columns: { x: [-12.2, -4.4, 3.1, 11.4], z: [-6.7, -0.8, 9], width: 0.55 },
  forecourt: { rear: 9.5, front: 16.3, grade: 0 },
  frontStairs: [
    { id: 'left', x: -8.3, width: 6.6 },
    { id: 'right', x: 7.25, width: 6.4 },
  ],
  frontStairFoot,
  frontStairSteps,
  frontStairTread,
  walkway: { rear: 2.2, front: frontStairFoot - frontStairSteps * frontStairTread },
  corridor: { left: -2, right: 2, rear: -7, front: 9.25 },
  crossPassage: { rear: -2.95, front: -1.65 },
  basementAccess: { x: -0.6, width: 2.2, lowerZ: 10.25, steps: 9, tread: 0.3, provisional: true },
  leftStair: {
    left: -16,
    right: -13,
    landingRear: 2.2,
    landingFront: 3.5,
    turnRear: 6.5,
    turnFront: 7.8,
    flightWidth: 1.35,
    steps: 12,
  },
  // Separately configured, recessed transverse switchback; the photograph obscures this stair.
  rightStair: {
    landingLeft: 5.5,
    landingRight: 6.8,
    turnLeft: 9.8,
    turnRight: 11.1,
    rear: -5.85,
    front: -2.95,
    flightWidth: 1.35,
    steps: 12,
    provisional: true,
  },
  shopRows: [
    { front: 2.15, rear: 0.25 },
    { front: 0.25, rear: -1.65 },
    { front: -2.95, rear: -4.975 },
    { front: -4.975, rear: -7 },
  ],
  shopDoorWidth: 1,
} as const;

export type PlanRect = { left: number; right: number; rear: number; front: number };
export function unitLayout(slot: number) {
  const row = BUILDING.shopRows[slot % 4];
  const right = slot >= 4;
  const width = right && slot % 4 >= 2 ? 3.2 : 8.6;
  const x = right ? 2 + width / 2 : -7.4;
  return {
    x,
    z: (row.front + row.rear) / 2,
    width,
    depth: Number((row.front - row.rear).toFixed(3)),
  };
}
export function floorElevation(floor: number) {
  return BUILDING.levels[0] + floor * BUILDING.floorHeight;
}
export const ROOF_ELEVATION = floorElevation(BUILDING.levels.length);
export function frontStairOpenings(): PlanRect[] {
  return BUILDING.frontStairs.map(({ x, width }) => ({
    left: x - width / 2,
    right: x + width / 2,
    rear: BUILDING.walkway.front,
    front: BUILDING.frontStairFoot,
  }));
}
export const RIGHT_STAIR_OPENING: PlanRect = {
  left: BUILDING.rightStair.landingRight,
  right: BUILDING.rightStair.turnRight,
  rear: BUILDING.rightStair.rear,
  front: BUILDING.rightStair.front,
};
export function slabOpenings(level: number): PlanRect[] {
  if (level === 1) return frontStairOpenings();
  return level === 2 || level === 3 ? [RIGHT_STAIR_OPENING] : [];
}
