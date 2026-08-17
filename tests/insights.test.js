import { describe, expect, it } from 'vitest';
import { buildInsights, modeChanges, rankChanges } from '../src/calculations/insights.js';

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

  it('calculates both absolute and percentage changes', () => {
    const changes = modeChanges(current, prior);
    expect(changes.find(r => r.mode === 'Dublin Bus')).toMatchObject({ absoluteChange: 20, changePct: 20 });
  });

  it('ranks changes independently by absolute and percentage movement', () => {
    const result = rankChanges(
      [{ mode: 'Large Mode', value: 125000 }, { mode: 'Small Mode', value: 1500 }],
      [{ mode: 'Large Mode', value: 100000 }, { mode: 'Small Mode', value: 1000 }]
    );
    expect(result.byAbsolute[0].mode).toBe('Large Mode');
    expect(result.byPercentage[0].mode).toBe('Small Mode');
  });

  it('uses absolute movement for the primary insight', () => {
    const insights = buildInsights(
      [{ mode: 'Large Mode', value: 125000 }, { mode: 'Small Mode', value: 1500 }],
      [{ mode: 'Large Mode', value: 100000 }, { mode: 'Small Mode', value: 1000 }]
    );
    expect(insights[0].type).toBe('largest-absolute-change');
    expect(insights[0].mode).toBe('Large Mode');
    expect(insights[0].text).toContain('25,000');
  });

  it('does not fabricate insights when there is no comparable data', () => {
    expect(buildInsights([{ mode: 'Rail', value: 100 }], [])).toEqual([]);
  });
});
