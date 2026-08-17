import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { aggregateByWeek, officialNonLuasByWeek, transformTHA25, transformTII03, validateNonLuas, MODES } from './data/transformData.js';

const DATA_BASE = 'https://raw.githubusercontent.com/DaraghOsully/public-transport-ireland-dashboard/v1-foundation/';
const fmt = new Intl.NumberFormat('en-IE');
const pct = new Intl.NumberFormat('en-IE', { style: 'percent', maximumFractionDigits: 1 });

async function csv(path) {
  const res = await fetch(DATA_BASE + path);
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data;
}

function yoyFor(weekly, year, week, mode = null) {
  const pick = (y, w) => weekly.find(r => r.year === y && r.week === w);
  const cur = pick(year, week);
  const prev = pick(year - 1, week);
  if (!cur || !prev) return null;
  const a = mode ? cur.modes?.[mode] : cur.value;
  const b = mode ? prev.modes?.[mode] : prev.value;
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return (a - b) / b;
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedMode, setSelectedMode] = useState('All Public Transport');
  const [year, setYear] = useState('all');
  const [range, setRange] = useState(24);

  useEffect(() => {
    (async () => {
      try {
        const [tha, tii] = await Promise.all([csv('THA25.csv'), csv('TII03.csv')]);
        const thaModes = transformTHA25(tha);
        const maxWeekByYear = {};
        for (const r of thaModes) maxWeekByYear[r.year] = Math.max(maxWeekByYear[r.year] ?? 0, r.week);
        const luas = transformTII03(tii, maxWeekByYear);
        const weekly = validateNonLuas(aggregateByWeek([...thaModes, ...luas]), officialNonLuasByWeek(tha));
        setData(weekly);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  const years = useMemo(() => data ? [...new Set(data.map(d => d.year))].sort((a,b) => b-a) : [], [data]);
  const filtered = useMemo(() => {
    if (!data) return [];
    const rows = year === 'all' ? data : data.filter(d => d.year === Number(year));
    return rows.slice(-range);
  }, [data, year, range]);
  const latest = filtered.at(-1);
  const trend = latest && data ? yoyFor(data, latest.year, latest.week, selectedMode === 'All Public Transport' ? null : selectedMode) : null;
  const modeValue = (r, mode) => mode === 'All Public Transport' ? r.value : (r.modes?.[mode] ?? 0);
  const validation = latest?.validation;

  if (error) return <main className="shell"><div className="error"><h1>Data load failed</h1><p>{error}</p></div></main>;
  if (!data) return <main className="shell"><div className="loading">Loading Ireland's transport data…</div></main>;

  return <main className="shell">
    <header className="hero">
      <div><span className="eyebrow">IRELAND · TRANSPORT MONITOR</span><h1>Public transport, measured week by week.</h1><p>Passenger journeys across Dublin Bus, regional bus, rail and Luas — with built-in data reconciliation.</p></div>
      <div className="hero-stat"><strong>{fmt.format(modeValue(latest, selectedMode))}</strong><span>journeys · {latest.year} W{String(latest.week).padStart(2,'0')}</span></div>
    </header>

    <section className="controls">
      <label>Measure<select value={selectedMode} onChange={e=>setSelectedMode(e.target.value)}><option>All Public Transport</option>{Object.values(MODES).map(m=><option key={m}>{m}</option>)}</select></label>
      <label>Year<select value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option>{years.map(y=><option key={y}>{y}</option>)}</select></label>
      <label>Weeks shown<input type="range" min="8" max="104" value={range} onChange={e=>setRange(Number(e.target.value))}/><span>{range}</span></label>
    </section>

    <section className="cards">
      <article><span>Latest week</span><strong>{fmt.format(modeValue(latest, selectedMode))}</strong><small>passenger journeys</small></article>
      <article><span>Year on year</span><strong className={trend > 0 ? 'up' : trend < 0 ? 'down' : ''}>{trend == null ? '—' : `${trend > 0 ? '+' : ''}${pct.format(trend)}`}</strong><small>same ISO week last year</small></article>
      <article><span>Data validation</span><strong className={validation?.matches ? 'up' : 'down'}>{validation?.matches ? '✓ Match' : validation?.official == null ? '—' : 'Check'}</strong><small>THA25 official non-Luas total</small></article>
    </section>

    <section className="panel"><div className="panel-head"><div><span className="eyebrow">TREND</span><h2>Weekly passenger journeys</h2></div><span>{filtered.length} observations</span></div>
      <div className="chart" role="img" aria-label="Weekly passenger journeys bar chart">
        {filtered.map((r,i) => <div className="bar-wrap" key={`${r.year}-${r.week}`} title={`${r.year} W${r.week}: ${fmt.format(modeValue(r, selectedMode))}`}><div className="bar" style={{height:`${Math.max(2, modeValue(r,selectedMode)/Math.max(...filtered.map(x=>modeValue(x,selectedMode)))*100)}%`}}/><small>{r.week === 1 ? r.year : ''}</small></div>)}
      </div>
    </section>

    <section className="panel validation"><div className="panel-head"><div><span className="eyebrow">QUALITY CONTROL</span><h2>Does our total reconcile?</h2></div><span>{validation?.matches ? 'Validated' : 'Review'}</span></div>
      <p>For the latest week, the sum of Dublin Bus + Regional Bus + Irish Rail is compared with the official THA25 “All public transport, excluding LUAS” figure.</p>
      {validation?.official != null && <div className="reconcile"><div><span>Calculated</span><strong>{fmt.format(validation.calculated)}</strong></div><div><span>Official</span><strong>{fmt.format(validation.official)}</strong></div><div><span>Difference</span><strong>{fmt.format(validation.difference)}</strong></div></div>}
    </section>
    <footer>Sources: CSO THA25 and TII03 · Weekly values · Built as an analytical dashboard, not an official transport statistics publication.</footer>
  </main>;
}
