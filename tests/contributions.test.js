import { describe, expect, it } from 'vitest';
import { ytdModeContributions } from '../src/calculations/contributions.js';

describe('YTD mode contribution attribution', () => {
  const rows = [
    { year: 2025, week: 1, modes: { 'Dublin Bus': 100, 'Regional Bus': 50, 'Irish Rail': 200, 'Luas': 50 } },
    { year: 2025, week: 2, modes: { 'Dublin Bus': 100, 'Regional Bus': 50, 'Irish Rail': 200, 'Luas': 50 } },
    { year: 2026, week: 1, modes: { 'Dublin Bus': 110, 'Regional Bus': 45, 'Irish Rail': 240, 'Luas': 55 } },
    { year: 2026, week: 2, modes: { 'Dublin Bus': 110, 'Regional Bus': 45, 'Irish Rail': 240, 'Luas': 55 } }
  ];

  it('uses only comparable weeks', () => {
    const result = ytdModeContributions(rows, 2026, 2);
    expect(result.totalPrior).toBe(800);
    expect(result.totalCurrent).toBe(900);
    expect(result.totalChange).toBe(100);
  });

  it('attributes the total change across modes', () => {
    const result = ytdModeContributions(rows, 2026, 2);
    const sum = result.contributions.reduce((s, r) => s + r.change, 0);
    expect(sum).toBe(result.totalChange);
    expect(result.contributions[0].mode).toBe('Irish Rail');
    expect(result.contributions[0].percentagePoints).toBeCloseTo(10);
  });

  it('returns null totals where no comparable weeks exist', () => {
    expect(ytdModeContributions(rows, 2027, 2).contributions).toEqual([]);
  });
});
