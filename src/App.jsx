import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { aggregateByWeek, officialNonLuasByWeek, transformTHA25, transformTII03, validateNonLuas, MODES } from './data/transformData.js';
import { buildInsights } from './calculations/insights.js';
import { comparableYtd } from './calculations/ytd.js';
import TransportTrendChart from './components/TransportTrendChart.jsx';
import ContributionPanel from './components/ContributionPanel.jsx';

const DATA_BASE = './';
const fmt = new Intl.NumberFormat('en-IE');
const pct = new Intl.NumberFormat('en-IE', { style: 'percent', maximumFractionDigits: 1 });
async function csv(path) { const res = await fetch(DATA_BASE + path); if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`); return Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data; }
async function metadata() { const res = await fetch(DATA_BASE + 'data-meta.json'); if (!res.ok) throw new Error(`Could not load data metadata (${res.status})`); return res.json(); }
function yoyFor(weekly, year, week, mode = null) { const pick = (y, w) => weekly.find(r => r.year === y && r.week === w); const cur = pick(year, week), prev = pick(year - 1, week); if (!cur || !prev) return null; const a = mode ? cur.modes?.[mode] : cur.value, b = mode ? prev.modes?.[mode] : prev.value; return Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? (a - b) / b : null; }
function latestLabel(meta) { const values = Object.values(meta?.sources ?? {}).map(s => s.latest).filter(Boolean); if (!values.length) return null; return values.map(v => `${v.year} W${String(v.week).padStart(2,'0')}`).sort().at(-1); }
export default function App() {
  const [data, setData] = useState(null), [meta, setMeta] = useState(null), [error, setError] = useState('');
  const [selectedMode, setSelectedMode] = useState('All Public Transport'), [year, setYear] = useState('all'), [range, setRange] = useState(52);
  useEffect(() => {(async () => { try { const [tha, tii, metaResult] = await Promise.all([csv('THA25.csv'), csv('TII03.csv'), metadata()]); const thaModes = transformTHA25(tha), maxWeekByYear = {}; for (const r of thaModes) maxWeekByYear[r.year] = Math.max(maxWeekByYear[r.year] ?? 0, r.week); setMeta(metaResult); setData(validateNonLuas(aggregateByWeek([...thaModes, ...transformTII03(tii, maxWeekByYear)]), officialNonLuasByWeek(tha))); } catch (e) { setError(e.message); } })(); }, []);
  const years = useMemo(() => data ? [...new Set(data.map(d => d.year))].sort((a,b) => b-a) : [], [data]);
  const filtered = useMemo(() => { if (!data) return []; const rows = year === 'all' ? data : data.filter(d => d.year === Number(year)); return rows.slice(-range); }, [data, year, range]);
  const latest = filtered.at(-1), analysisYear = latest?.year ?? years[0], analysisWeek = latest?.week ?? 0;
  const ytd = useMemo(() => analysisYear && data ? comparableYtd(data, data, analysisYear) : null, [data, analysisYear]);
  const modeValue = (r, mode) => mode === 'All Public Transport' ? r.value : (r.modes?.[mode] ?? 0);
  const trend = latest && data ? yoyFor(data, latest.year, latest.week, selectedMode === 'All Public Transport' ? null : selectedMode) : null;
  const prior = latest && data ? data.find(r => r.year === latest.year - 1 && r.week === latest.week) : null;
  const insights = latest && prior ? buildInsights(Object.entries(latest.modes ?? {}).map(([mode,value]) => ({mode,value})), Object.entries(prior.modes ?? {}).map(([mode,value]) => ({mode,value}))) : [];
  const validation = latest?.validation, sourceLatest = latestLabel(meta), freshness = meta?.checkedAt ? new Date(meta.checkedAt) : null;
  if (error) return <main className="shell"><div className="error"><h1>Data load failed</h1><p>{error}</p></div></main>;
  if (!data) return <main className="shell"><div className="loading">Loading Ireland's transport data…</div></main>;
  return <main className="shell">
    <header className="hero"><div><span className="eyebrow">IRELAND · TRANSPORT MONITOR</span><h1>Public transport, measured week by week.</h1><p>What changed, where it changed, and whether the numbers reconcile.</p></div><div className="hero-stat"><strong>{fmt.format(modeValue(latest, selectedMode))}</strong><span>journeys · {latest.year} W{String(latest.week).padStart(2,'0')}</span></div></header>
    <section className="controls"><label>Measure<select value={selectedMode} onChange={e=>setSelectedMode(e.target.value)}><option>All Public Transport</option>{Object.values(MODES).map(m=><option key={m}>{m}</option>)}</select></label><label>Year<select value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option>{years.map(y=><option key={y}>{y}</option>)}</select></label><label>Weeks shown<input type="range" min="8" max="156" value={range} onChange={e=>setRange(Number(e.target.value))}/><span>{range} weeks</span></label></section>
    <section className="cards"><article><span>Latest week</span><strong>{fmt.format(modeValue(latest, selectedMode))}</strong><small>passenger journeys</small></article><article><span>YTD performance</span><strong className={ytd?.yoy > 0 ? 'up' : ytd?.yoy < 0 ? 'down' : ''}>{ytd?.yoy == null ? '—' : `${ytd.yoy > 0 ? '+' : ''}${pct.format(ytd.yoy)}`}</strong><small>{ytd?.weeks ?? 0} comparable weeks vs {analysisYear - 1}</small></article><article><span>Year on year</span><strong className={trend > 0 ? 'up' : trend < 0 ? 'down' : ''}>{trend == null ? '—' : `${trend > 0 ? '+' : ''}${pct.format(trend)}`}</strong><small>same ISO week last year</small></article><article><span>Data validation</span><strong className={validation?.matches ? 'up' : 'down'}>{validation?.matches ? '✓ Match' : validation?.official == null ? '—' : 'Check'}</strong><small>THA25 official non-Luas total</small></article></section>
    <section className="insight-grid"><div className="insight-main"><span className="eyebrow">WHAT CHANGED?</span><h2>{insights[0]?.text ?? 'No comparable insight available yet.'}</h2><p>Insights are calculated directly from comparable weekly observations — not written by hand.</p></div><div className="insight-side"><span className="eyebrow">DATA FRESHNESS</span><strong>{sourceLatest ? `Latest source: ${sourceLatest}` : 'Freshness not verified'}</strong><span>{freshness ? `Last checked ${freshness.toLocaleDateString('en-IE')}` : 'Automated source check pending'}</span></div></section>
    {analysisYear && <ContributionPanel rows={data} year={analysisYear} endWeek={analysisWeek} />}
    <TransportTrendChart rows={filtered} />
    <section className="panel validation"><div className="panel-head"><div><span className="eyebrow">QUALITY CONTROL</span><h2>Does our total reconcile?</h2></div><span>{validation?.matches ? 'Validated' : 'Review'}</span></div><p>The three non-Luas modes are checked against the official CSO THA25 aggregate for the latest week.</p>{validation?.official != null && <div className="reconcile"><div><span>Calculated</span><strong>{fmt.format(validation.calculated)}</strong></div><div><span>Official</span><strong>{fmt.format(validation.official)}</strong></div><div><span>Difference</span><strong>{fmt.format(validation.difference)}</strong></div></div>}</section>
    <footer>Sources: CSO THA25 and TII03 · Weekly values · Analytical dashboard, not an official transport statistics publication.</footer>
  </main>;
}
