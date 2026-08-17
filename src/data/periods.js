export function isValidWeek(week) {
  return Number.isInteger(week) && week >= 1 && week <= 53;
}

export function completeWeeks(rows, year) {
  const byWeek = new Map(rows.filter(r => r.year === year).map(r => [r.week, r]));
  return Array.from({ length: 53 }, (_, i) => {
    const week = i + 1;
    return { year, week, ...byWeek.get(week), available: byWeek.has(week) };
  });
}

export function comparableWeeks(currentRows, priorRows) {
  const prior = new Set(priorRows.map(r => `${r.year}-${r.week}`));
  return currentRows.filter(r => prior.has(`${r.year - 1}-${r.week}`));
}
