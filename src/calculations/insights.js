export function modeChanges(current, prior) {
  const priorByMode = new Map(prior.map(r => [r.mode, r.value]));
  return current
    .filter(r => priorByMode.has(r.mode) && priorByMode.get(r.mode) !== 0)
    .map(r => ({
      mode: r.mode,
      current: r.value,
      prior: priorByMode.get(r.mode),
      absoluteChange: r.value - priorByMode.get(r.mode),
      changePct: ((r.value - priorByMode.get(r.mode)) / priorByMode.get(r.mode)) * 100
    }));
}

export function rankChanges(current, prior) {
  const changes = modeChanges(current, prior);
  return {
    byAbsolute: [...changes].sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange)),
    byPercentage: [...changes].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
  };
}

export function buildInsights(current, prior) {
  const { byAbsolute } = rankChanges(current, prior);
  if (!byAbsolute.length) return [];
  const biggest = byAbsolute[0];
  const direction = biggest.absoluteChange >= 0 ? 'increased' : 'decreased';
  return [{
    type: 'largest-absolute-change',
    mode: biggest.mode,
    absoluteChange: biggest.absoluteChange,
    changePct: biggest.changePct,
    text: `${biggest.mode} ${direction} by ${Math.abs(biggest.absoluteChange).toLocaleString()} passenger journeys (${Math.abs(biggest.changePct).toFixed(1)}%) versus the comparable period last year.`
  }];
}
