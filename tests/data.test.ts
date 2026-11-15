import { describe, it, expect } from 'vitest';
import { DEMO_UNITS, FLOORS, unitPosition } from '@/data/demo';

describe('public architectural data', () => {
  it('has a semi-basement and three above-grade levels and unique unit, mesh and floor-plan mappings', () => {
    expect(FLOORS.map((f) => f.id)).toEqual([0, 1, 2, 3]);
    expect(FLOORS.map((f) => f.label)).toEqual(['B', 'GF', '1F', '2F']);
    expect(DEMO_UNITS).toHaveLength(32);
    expect(new Set(DEMO_UNITS.map((u) => u.id)).size).toBe(32);
    expect(new Set(DEMO_UNITS.map((u) => u.meshId)).size).toBe(32);
    for (const floor of FLOORS) {
      const units = DEMO_UNITS.filter((u) => u.floor === floor.id);
      expect(units).toHaveLength(8);
      expect(new Set(units.map((u) => unitPosition(u).join(','))).size).toBe(8);
      for (const unit of units) {
        expect(unit.floorPlanRef).toBe(`floor-${floor.id}`);
        expect(unit.areaSqFt).toBeGreaterThan(0);
        expect(unit.frontage).toBeGreaterThan(0);
        expect(unit.depth).toBeGreaterThan(0);
      }
    }
  });
});
