import { describe, expect, it } from 'vitest';
import { completeWeeks, comparableWeeks, isValidWeek } from '../src/data/periods.js';

describe('period handling', () => {
  it('accepts weeks 1 through 53 only', () => {
    expect(isValidWeek(1)).toBe(true);
    expect(isValidWeek(53)).toBe(true);
    expect(isValidWeek(0)).toBe(false);
    expect(isValidWeek(54)).toBe(false);
  });

  it('represents missing weeks explicitly without inventing values', () => {
    const result = completeWeeks([{ year: 2026, week: 1, value: 100 }], 2026);
    expect(result).toHaveLength(53);
    expect(result[0]).toMatchObject({ week: 1, value: 100, available: true });
    expect(result[1]).toMatchObject({ week: 2, available: false });
  });

  it('only returns weeks that exist in both years for comparisons', () => {
    const current = [
      { year: 2026, week: 1, value: 100 },
      { year: 2026, week: 2, value: 110 },
      { year: 2026, week: 53, value: 120 }
    ];
    const prior = [
      { year: 2025, week: 1, value: 90 },
      { year: 2025, week: 2, value: 95 }
    ];
    expect(comparableWeeks(current, prior).map(r => r.week)).toEqual([1, 2]);
  });
});
