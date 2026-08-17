import { describe, expect, it } from 'vitest';
import { calculateYoY } from '../src/calculations/yoy.js';

describe('year-over-year calculation', () => {
  it('matches the same calendar week in the prior year', () => {
    const rows = [
      { year: 2025, week: 52, value: 100 },
      { year: 2026, week: 1, value: 120 },
      { year: 2026, week: 52, value: 150 }
    ];
    const result = calculateYoY(rows);
    expect(result[1].yoy).toBeNull();
    expect(result[2].yoy).toBe(50);
  });

  it('returns null where the prior-year observation is missing', () => {
    const result = calculateYoY([{ year: 2026, week: 10, value: 100 }]);
    expect(result[0].yoy).toBeNull();
  });

  it('returns null where the prior-year denominator is zero', () => {
    const result = calculateYoY([
      { year: 2025, week: 10, value: 0 },
      { year: 2026, week: 10, value: 100 }
    ]);
    expect(result[1].yoy).toBeNull();
  });
});
