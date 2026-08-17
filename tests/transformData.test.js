import { describe, expect, it } from 'vitest';
import { aggregateByWeek, transformTHA25, validateNonLuas } from '../src/data/transformData.js';

describe('transport data transformations', () => {
  it('maps THA25 transport modes', () => {
    const rows = [
      { 'Mode of Transport': 'Dublin Metro Bus', 'TLIST(W1)': '2025W01', VALUE: '100' },
      { 'Mode of Transport': 'Bus, Excluding Dublin Metro', 'TLIST(W1)': '2025W01', VALUE: '200' },
      { 'Mode of Transport': 'Rail', 'TLIST(W1)': '2025W01', VALUE: '300' },
      { 'Mode of Transport': 'All public transport, excluding LUAS', 'TLIST(W1)': '2025W01', VALUE: '600' }
    ];
    expect(transformTHA25(rows)).toMatchObject([
      { mode: 'Dublin Bus', year: 2025, week: 1, value: 100 },
      { mode: 'Regional Bus', year: 2025, week: 1, value: 200 },
      { mode: 'Irish Rail', year: 2025, week: 1, value: 300 }
    ]);
  });

  it('aggregates modes by year and ISO week', () => {
    const rows = [
      { mode: 'Dublin Bus', year: 2025, week: 1, value: 100 },
      { mode: 'Irish Rail', year: 2025, week: 1, value: 300 },
      { mode: 'Luas', year: 2025, week: 1, value: 50 }
    ];
    const result = aggregateByWeek(rows);
    expect(result[0].value).toBe(450);
    expect(result[0].modes['Dublin Bus']).toBe(100);
  });

  it('reconciles the calculated non-Luas total against the official total', () => {
    const rows = [
      { mode: 'Dublin Bus', year: 2025, week: 1, value: 100 },
      { mode: 'Regional Bus', year: 2025, week: 1, value: 200 },
      { mode: 'Irish Rail', year: 2025, week: 1, value: 300 }
    ];
    const official = new Map([['2025-W01', { year: 2025, week: 1, value: 600 }]]);
    const result = validateNonLuas(aggregateByWeek(rows), official);
    expect(result[0].validation.matches).toBe(true);
    expect(result[0].validation.difference).toBe(0);
  });

  it('flags a reconciliation mismatch', () => {
    const rows = [
      { mode: 'Dublin Bus', year: 2025, week: 1, value: 100 },
      { mode: 'Regional Bus', year: 2025, week: 1, value: 200 },
      { mode: 'Irish Rail', year: 2025, week: 1, value: 300 }
    ];
    const official = new Map([['2025-W01', { year: 2025, week: 1, value: 601 }]]);
    const result = validateNonLuas(aggregateByWeek(rows), official);
    expect(result[0].validation.matches).toBe(false);
    expect(result[0].validation.difference).toBe(-1);
  });
});
