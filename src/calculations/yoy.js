export function indexByYearWeek(rows) {
  return new Map(rows.map((r) => [`${r.year}-${r.week}`, r]));
}

export function calculateYoY(rows) {
  const byKey = indexByYearWeek(rows);
  return rows.map((row) => {
    const prior = byKey.get(`${row.year - 1}-${row.week}`);
    if (!prior || prior.value == null || prior.value === 0) {
      return { ...row, yoy: null, priorValue: prior?.value ?? null };
    }
    return {
      ...row,
      yoy: ((row.value - prior.value) / prior.value) * 100,
      priorValue: prior.value
    };
  });
}
