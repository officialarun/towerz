import { BUILDING, floorElevation, unitLayout } from '@/data/building';
import { circulationPlan, type Point3, type StairFlight } from './circulation';

export type JourneyLeg = { from: Point3; to: Point3; stair?: StairFlight };
export type PedestrianJourney = { id: string; description: string; legs: JourneyLeg[] };

/** Explicit routes through public circulation. These are QA paths, not a first-person controller. */
export function pedestrianJourneys(): PedestrianJourney[] {
  const { flights } = circulationPlan();
  const journeys: PedestrianJourney[] = [];
  function route(id: string, description: string, start: Point3) {
    let current = start;
    const legs: JourneyLeg[] = [];
    journeys.push({ id, description, legs });
    return {
      via(to: Point3) { legs.push({ from: current, to }); current = to; return this; },
      stair(id: string) {
        const stair = flights.find((f) => f.id === id)!;
        this.via(stair.start);
        legs.push({ from: stair.start, to: stair.end, stair });
        current = stair.end;
        return this;
      },
    };
  }
  const y = floorElevation(1), walkZ = (BUILDING.walkway.rear + BUILDING.walkway.front) / 2;
  for (const side of ['left', 'right']) {
    const front = flights.find((f) => f.id === `front_stair_${side}`)!;
    const layout = unitLayout(side === 'left' ? 0 : 4);
    route(`road-gf-${side}`, `Roadside → forecourt → ${side} front stair → GF walkway → shop`, [front.start[0], 0, 16.4])
      .via([front.start[0], 0, 9.3]).stair(front.id)
      .via([front.end[0], y, walkZ]).via([layout.x, y, walkZ])
      .via([layout.x, y, BUILDING.shopRows[0].front - 0.35]);
  }
  const basement = flights.find((f) => f.id === 'basement_access_stair')!;
  route('road-basement-atm', 'Roadside → provisional descent → B corridor → G-05 door → ATM approach', [basement.start[0], 0, 16.4])
    .stair(basement.id).via([basement.end[0], floorElevation(0), 9.1])
    .via([0, floorElevation(0), 9.1]).via([0, floorElevation(0), unitLayout(4).z])
    .via([2.3, floorElevation(0), unitLayout(4).z])
    .via([2.3, floorElevation(0), unitLayout(4).z + 0.65])
    .via([3, floorElevation(0), unitLayout(4).z + 0.65]);

  for (const floor of [1, 2]) for (const side of ['left', 'right']) {
    const lower = floorElevation(floor), upper = floorElevation(floor + 1);
    const out = flights.find((f) => f.id === `${side}_stair_${floor}_out`)!;
    const back = flights.find((f) => f.id === `${side}_stair_${floor}_return`)!;
    const path = route(`${side}-${floor}-to-${floor + 1}`, `${side} turning stair: level ${floor} → landing → level ${floor + 1} corridor → shop`, [0, lower, walkZ]);
    if (side === 'left') {
      path.via([out.start[0], lower, 2.85]).stair(out.id)
        .via([out.end[0], out.end[1], 7.1]).via([back.start[0], back.start[1], 7.1])
        .stair(back.id).via([back.end[0], upper, 2.85]).via([0, upper, 2.85]);
    } else {
      path.via([0, lower, -2.3]).via([6.15, lower, -2.3]).via([6.15, lower, out.start[2]])
        .stair(out.id).via([10.45, out.end[1], out.end[2]])
        .via([10.45, back.start[1], back.start[2]]).stair(back.id)
        .via([6.15, upper, back.end[2]]).via([6.15, upper, -2.3])
        .via([0, upper, -2.3]).via([0, upper, 2.85]);
    }
    path.via([0, upper, unitLayout(1).z]).via([-3.45, upper, unitLayout(1).z]);
  }
  for (let floor = 0; floor < BUILDING.levels.length; floor++) {
    const y = floorElevation(floor);
    // Traverse both public storefront edges, then approach every corridor-side door.
    route(`horizontal-${floor}`, 'Shared walkway → past multiple storefronts → central passage → cross-passage', [-11.5, y, walkZ])
      .via([10.5, y, walkZ]).via([0, y, walkZ]).via([0, y, -2.3])
      .via([5.9, y, -2.3]);
    for (let slot = 0; slot < 8; slot++) {
      const unit = unitLayout(slot), sign = Math.sign(unit.x);
      route(`door-${floor}-${slot}`, 'Public corridor → recessed commercial doorway', [0, y, walkZ])
        .via([0, y, unit.z]).via([unit.x - sign * (unit.width / 2 - 0.35), y, unit.z]);
    }
  }
  return journeys;
}

/** Samples actual tread elevations, including the descent, rather than an imaginary smooth ramp. */
export function journeySamples(journey: PedestrianJourney, spacing = 0.18): Point3[] {
  return journey.legs.flatMap((leg) => {
    if (leg.stair) {
      const f = leg.stair, ascending = f.end[1] > f.start[1];
      return Array.from({ length: f.steps }, (_, i) => {
        const t = (i + 0.5) / f.steps;
        const step = ascending ? i + 1 : i;
        return [f.start[0] + (f.end[0] - f.start[0]) * t,
          f.start[1] + (f.end[1] - f.start[1]) * step / f.steps,
          f.start[2] + (f.end[2] - f.start[2]) * t] as Point3;
      });
    }
    const length = Math.hypot(...leg.to.map((v, i) => v - leg.from[i]));
    const count = Math.max(1, Math.ceil(length / spacing));
    return Array.from({ length: count + 1 }, (_, i) =>
      leg.from.map((v, axis) => v + (leg.to[axis] - v) * i / count) as Point3);
  });
}
