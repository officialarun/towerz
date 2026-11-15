import { BUILDING, floorElevation, type PlanRect } from '@/data/building';

export type Point3 = [number, number, number];
export type StairFlight = {
  id: string;
  ownerFloor: number;
  start: Point3;
  end: Point3;
  width: number;
  steps: number;
  provisional?: boolean;
};
export type Landing = PlanRect & {
  id: string;
  ownerFloor: number;
  elevation: number;
  external?: boolean;
  provisional?: boolean;
};

/** One connected circulation plan shared by the scene, plan view and geometry checks. */
export function circulationPlan() {
  const flights: StairFlight[] = [];
  const landings: Landing[] = [];
  for (const stair of BUILDING.frontStairs) {
    flights.push({
      id: `front_stair_${stair.id}`,
      ownerFloor: 1,
      start: [stair.x, 0, BUILDING.frontStairFoot],
      end: [stair.x, floorElevation(1), BUILDING.walkway.front],
      width: stair.width,
      steps: BUILDING.frontStairSteps,
    });
    landings.push({
      id: `front_approach_${stair.id}`,
      ownerFloor: 1,
      elevation: 0,
      left: stair.x - stair.width / 2,
      right: stair.x + stair.width / 2,
      rear: BUILDING.frontStairFoot,
      front: BUILDING.forecourt.rear,
      external: true,
    });
  }
  const basement = BUILDING.basementAccess;
  flights.push({
    id: 'basement_access_stair',
    ownerFloor: 0,
    start: [basement.x, 0, basement.lowerZ + basement.steps * basement.tread],
    end: [basement.x, floorElevation(0), basement.lowerZ],
    width: basement.width,
    steps: basement.steps,
    provisional: true,
  });
  landings.push({
    id: 'basement_access_landing',
    ownerFloor: 0,
    elevation: floorElevation(0),
    left: basement.x - 1.3,
    right: basement.x + 1.3,
    rear: 8.9,
    front: basement.lowerZ,
    external: true,
    provisional: true,
  });
  const left = BUILDING.leftStair;
  const right = BUILDING.rightStair;
  for (let floor = 1; floor < BUILDING.levels.length; floor++) {
    const elevation = floorElevation(floor);
    landings.push(
      {
        id: `left_floor_landing_${floor}`,
        ownerFloor: floor,
        elevation,
        left: left.left,
        right: left.right,
        rear: left.landingRear,
        front: left.landingFront,
        external: true,
      },
      {
        id: `right_floor_landing_${floor}`,
        ownerFloor: floor,
        elevation,
        left: right.landingLeft,
        right: right.landingRight,
        rear: right.rear,
        front: right.front,
        provisional: true,
      },
    );
    if (floor === BUILDING.levels.length - 1) continue;
    const mid = elevation + BUILDING.floorHeight / 2;
    const top = floorElevation(floor + 1);
    const leftOuter = left.left + left.flightWidth / 2;
    const leftInner = left.right - left.flightWidth / 2;
    flights.push(
      {
        id: `left_stair_${floor}_out`,
        ownerFloor: floor + 1,
        start: [leftOuter, elevation, left.landingFront],
        end: [leftOuter, mid, left.turnRear],
        width: left.flightWidth,
        steps: left.steps,
      },
      {
        id: `left_stair_${floor}_return`,
        ownerFloor: floor + 1,
        start: [leftInner, mid, left.turnRear],
        end: [leftInner, top, left.landingFront],
        width: left.flightWidth,
        steps: left.steps,
      },
    );
    landings.push({
      id: `left_turn_landing_${floor}`,
      ownerFloor: floor + 1,
      elevation: mid,
      left: left.left,
      right: left.right,
      rear: left.turnRear,
      front: left.turnFront,
      external: true,
    });
    const frontLane = right.front - right.flightWidth / 2;
    const rearLane = right.rear + right.flightWidth / 2;
    flights.push(
      {
        id: `right_stair_${floor}_out`,
        ownerFloor: floor + 1,
        start: [right.landingRight, elevation, frontLane],
        end: [right.turnLeft, mid, frontLane],
        width: right.flightWidth,
        steps: right.steps,
        provisional: true,
      },
      {
        id: `right_stair_${floor}_return`,
        ownerFloor: floor + 1,
        start: [right.turnLeft, mid, rearLane],
        end: [right.landingRight, top, rearLane],
        width: right.flightWidth,
        steps: right.steps,
        provisional: true,
      },
    );
    landings.push({
      id: `right_turn_landing_${floor}`,
      ownerFloor: floor + 1,
      elevation: mid,
      left: right.turnLeft,
      right: right.turnRight,
      rear: right.rear,
      front: right.front,
      provisional: true,
    });
  }
  return { flights, landings };
}

export function flightFootprint(flight: StairFlight): PlanRect {
  const alongX = flight.start[0] !== flight.end[0];
  return {
    left: Math.min(flight.start[0], flight.end[0]) - (alongX ? 0 : flight.width / 2),
    right: Math.max(flight.start[0], flight.end[0]) + (alongX ? 0 : flight.width / 2),
    rear: Math.min(flight.start[2], flight.end[2]) - (alongX ? flight.width / 2 : 0),
    front: Math.max(flight.start[2], flight.end[2]) + (alongX ? flight.width / 2 : 0),
  };
}
