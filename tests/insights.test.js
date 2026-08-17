import { describe, expect, it } from 'vitest';
import { buildInsights, modeChanges } from '../src/calculations/insights.js';

describe('transport insights', () => {
  const current = [
    { mode: 'Dublin Bus', value: 120 },
    { mode: 'Irish Rail', value: 90 },
    { mode: 'Luas', value: 105 }
  ];
  const prior = [
    { mode: 'Dublin Bus', value: 100 },
    { mode: 'Irish Rail', value: 100 },
    { mode: 'Luas', value: 100 }
  ];

  it('calculates comparable mode changes', () => {
    const changes = modeChanges(current, prior);
    expect(changes[0].mode).toBe('Dublin Bus');
    expect(changes[0].changePct).toBe(20);
  });

  it('generates a concise largest-change insight', () => {
    const insights = buildInsights(current, prior);
    expect(insights[0].type).toBe('largest-mode-change');
    expect(insights[0].text).toContain('Dublin Bus increased 20.0%');
  });

  it('does not fabricate insights when there is no comparable data', () => {
    expect(buildInsights([{ mode: 'Rail', value: 100 }], [])).toEqual([]);
  });
});
