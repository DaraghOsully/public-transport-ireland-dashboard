const MODES = ['Dublin Bus', 'Regional Bus', 'Irish Rail', 'Luas'];

export function ytdModeContributions(rows, year, endWeek, modes = MODES) {
  const current = rows.filter(r => r.year === year && r.week <= endWeek);
  const prior = rows.filter(r => r.year === year - 1 && r.week <= endWeek);
  const priorWeeks = new Set(prior.map(r => r.week));
  const comparable = current.filter(r => priorWeeks.has(r.week));
  if (!comparable.length) return { totalCurrent: null, totalPrior: null, totalChange: null, contributions: [] };

  const totals = Object.fromEntries(modes.map(mode => [mode, { current: 0, prior: 0 }]));
  for (const row of comparable) {
    const prev = prior.find(r => r.week === row.week);
    for (const mode of modes) {
      const currentValue = row.modes?.[mode];
      const priorValue = prev?.modes?.[mode];
      if (Number.isFinite(currentValue) && Number.isFinite(priorValue)) {
        totals[mode].current += currentValue;
        totals[mode].prior += priorValue;
      }
    }
  }

  const contributions = modes.map(mode => ({
    mode,
    current: totals[mode].current,
    prior: totals[mode].prior,
    change: totals[mode].current - totals[mode].prior
  }));
  const totalCurrent = contributions.reduce((s, r) => s + r.current, 0);
  const totalPrior = contributions.reduce((s, r) => s + r.prior, 0);
  const totalChange = totalCurrent - totalPrior;
  return {
    totalCurrent,
    totalPrior,
    totalChange,
    yoy: totalPrior === 0 ? null : totalChange / totalPrior,
    contributions: contributions.map(r => ({
      ...r,
      percentagePoints: totalPrior === 0 ? null : (r.change / totalPrior) * 100
    })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  };
}
