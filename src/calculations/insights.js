export function modeChanges(current, prior) {
  const priorByMode = new Map(prior.map(r => [r.mode, r.value]));
  return current
    .filter(r => priorByMode.has(r.mode) && priorByMode.get(r.mode) !== 0)
    .map(r => ({
      mode: r.mode,
      current: r.value,
      prior: priorByMode.get(r.mode),
      changePct: ((r.value - priorByMode.get(r.mode)) / priorByMode.get(r.mode)) * 100
    }))
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}

export function buildInsights(current, prior) {
  const changes = modeChanges(current, prior);
  if (!changes.length) return [];
  const biggest = changes[0];
  const direction = biggest.changePct >= 0 ? 'increased' : 'decreased';
  return [{
    type: 'largest-mode-change',
    mode: biggest.mode,
    changePct: biggest.changePct,
    text: `${biggest.mode} ${direction} ${Math.abs(biggest.changePct).toFixed(1)}% versus the comparable period last year.`
  }];
}
