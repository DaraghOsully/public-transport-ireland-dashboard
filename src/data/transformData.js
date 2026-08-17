const MODES = {
  DUBLIN_BUS: 'Dublin Bus',
  REGIONAL_BUS: 'Regional Bus',
  RAIL: 'Irish Rail',
  LUAS: 'Luas'
};

function parseWeekCode(code) {
  const match = String(code ?? '').match(/^(\d{4})W(\d{1,2})$/i);
  if (!match) return null;
  return { year: Number(match[1]), week: Number(match[2]) };
}

export function transformTHA25(rows) {
  return rows.flatMap((row) => {
    const parsed = parseWeekCode(row['TLIST(W1)']);
    const value = Number(row.VALUE);
    if (!parsed || !Number.isFinite(value)) return [];

    const label = String(row['Mode of Transport'] ?? row.C03935V04687 ?? '').toLowerCase();
    let mode;
    if (label === 'dublin metro bus') mode = MODES.DUBLIN_BUS;
    else if (label.includes('bus') && label.includes('excluding')) mode = MODES.REGIONAL_BUS;
    else if (label === 'rail') mode = MODES.RAIL;
    else return [];

    return [{ ...parsed, mode, value, source: 'THA25' }];
  });
}

export function transformTII03(rows, maxWeekByYear) {
  return rows.flatMap((row) => {
    const line = String(row['Luas Line'] ?? row.C03132V03784 ?? '').toLowerCase();
    const parsed = parseWeekCode(row['TLIST(W1)'] ?? row.Week);
    const value = Number(row.VALUE);
    if (!line.includes('all') || !parsed || !Number.isFinite(value)) return [];
    if (maxWeekByYear[parsed.year] !== undefined && parsed.week > maxWeekByYear[parsed.year]) return [];
    return [{ ...parsed, mode: MODES.LUAS, value, source: 'TII03' }];
  });
}

export function aggregateByWeek(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.year}-W${String(row.week).padStart(2, '0')}`;
    const current = map.get(key) ?? { year: row.year, week: row.week, value: 0, modes: {} };
    current.value += row.value;
    current.modes[row.mode] = (current.modes[row.mode] ?? 0) + row.value;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => a.year - b.year || a.week - b.week);
}

export function officialNonLuasByWeek(rows) {
  const map = new Map();
  for (const row of rows) {
    const label = String(row['Mode of Transport'] ?? row.C03935V04687 ?? '').toLowerCase();
    const parsed = parseWeekCode(row['TLIST(W1)']);
    const value = Number(row.VALUE);
    if (!parsed || !label.includes('all public transport') || !Number.isFinite(value)) continue;
    map.set(`${parsed.year}-W${String(parsed.week).padStart(2, '0')}`, { ...parsed, value });
  }
  return map;
}

export function validateNonLuas(weekly, official) {
  return weekly.map((item) => {
    const key = `${item.year}-W${String(item.week).padStart(2, '0')}`;
    const expected = official.get(key);
    const calculated = Object.entries(item.modes)
      .filter(([mode]) => mode !== MODES.LUAS)
      .reduce((sum, [, value]) => sum + value, 0);
    return {
      ...item,
      validation: expected ? {
        official: expected.value,
        calculated,
        difference: calculated - expected.value,
        matches: calculated === expected.value
      } : { official: null, calculated, difference: null, matches: null }
    };
  });
}

export { MODES };
