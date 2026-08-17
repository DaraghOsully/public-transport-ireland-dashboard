import { describe, expect, it } from 'vitest';
import { comparableYtd } from '../src/calculations/ytd.js';

describe('comparable YTD', () => {
  it('compares only weeks available in both years', () => {
    const current = [
      { year: 2026, week: 1, value: 100 },
      { year: 2026, week: 2, value: 120 },
      { year: 2026, week: 3, value: 130 }
    ];
    const prior = [
      { year: 2025, week: 1, value: 90 },
      { year: 2025, week: 2, value: 100 }
    ];
    const result = comparableYtd(current, prior, 2026);
    expect(result.weeks).toBe(2);
    expect(result.currentTotal).toBe(220);
    expect(result.priorTotal).toBe(190);
    expect(result.yoy).toBeCloseTo(30 / 190);
    expect(result.throughWeek).toBe(2);
  });

  it('returns a null YoY when the prior total is zero', () => {
    const result = comparableYtd(
      [{ year: 2026, week: 1, value: 100 }],
      [{ year: 2025, week: 1, value: 0 }],
      2026
    );
    expect(result.currentTotal).toBe(100);
    expect(result.priorTotal).toBe(0);
    expect(result.yoy).toBeNull();
  });
});
