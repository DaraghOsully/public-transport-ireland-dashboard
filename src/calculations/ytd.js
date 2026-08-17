export function comparableYtd(currentRows, priorRows, year) {
  const current = currentRows.filter(r => r.year === year && Number.isFinite(r.value));
  const priorWeeks = new Map(priorRows.filter(r => r.year === year - 1 && Number.isFinite(r.value)).map(r => [r.week, r]));
  const comparable = current.filter(r => priorWeeks.has(r.week));
  const currentTotal = comparable.reduce((sum, r) => sum + r.value, 0);
  const priorTotal = comparable.reduce((sum, r) => sum + priorWeeks.get(r.week).value, 0);
  return {
    year,
    throughWeek: comparable.at(-1)?.week ?? null,
    weeks: comparable.length,
    currentTotal,
    priorTotal,
    yoy: priorTotal !== 0 ? (currentTotal - priorTotal) / priorTotal : null,
  };
}
