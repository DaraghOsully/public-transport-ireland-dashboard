import { useMemo, useState } from 'react';

const number = new Intl.NumberFormat('en-IE');
const percent = new Intl.NumberFormat('en-IE', { style: 'percent', maximumFractionDigits: 1 });
const MODES = ['All Public Transport', 'Dublin Bus', 'Regional Bus', 'Irish Rail', 'Luas'];

function valueFor(row, mode) {
  return mode === 'All Public Transport' ? row.value : (row.modes?.[mode] ?? null);
}

export default function TransportTrendChart({ rows }) {
  const [mode, setMode] = useState('All Public Transport');
  const [showYoY, setShowYoY] = useState(false);
  const [hover, setHover] = useState(null);
  const values = useMemo(() => rows.map(r => valueFor(r, mode)), [rows, mode]);
  const byYearWeek = useMemo(() => new Map(rows.map(r => [`${r.year}-${r.week}`, r])), [rows]);
  const points = useMemo(() => rows.map((row, index) => {
    const value = values[index];
    const prior = byYearWeek.get(`${row.year - 1}-${row.week}`);
    const priorValue = prior ? valueFor(prior, mode) : null;
    const yoy = Number.isFinite(value) && Number.isFinite(priorValue) && priorValue !== 0 ? (value - priorValue) / priorValue : null;
    return { row, value, priorValue, yoy };
  }), [rows, values, byYearWeek, mode]);
  const max = Math.max(...values.filter(Number.isFinite), 1);

  return <section className="panel trend-panel">
    <div className="panel-head trend-head">
      <div><span className="eyebrow">TREND</span><h2>Weekly passenger journeys</h2><span>{showYoY ? 'Current week shown with same-week-last-year comparison' : 'Hover a week for the exact value'}</span></div>
      <div className="trend-actions">
        <button className={showYoY ? 'toggle active' : 'toggle'} onClick={() => setShowYoY(v => !v)}>{showYoY ? 'Hide YoY' : 'Show YoY'}</button>
        <div className="mode-tabs" role="tablist" aria-label="Transport mode">
          {MODES.map(item => <button key={item} className={item === mode ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>)}
        </div>
      </div>
    </div>
    <div className="trend-chart" onMouseLeave={() => setHover(null)}>
      <div className="y-axis"><span>{number.format(max)}</span><span>{number.format(Math.round(max / 2))}</span><span>0</span></div>
      <div className="plot">
        <div className="grid-line top"/><div className="grid-line middle"/><div className="grid-line bottom"/>
        <div className="bars">{points.map(point => <div key={`${point.row.year}-${point.row.week}`} className="point" onMouseEnter={() => setHover(point)}><div className="bar" style={{height:`${Math.max(2, (point.value ?? 0) / max * 100)}%`}}/></div>)}</div>
        {showYoY && <div className="yoy-band">{points.map(point => <div key={`${point.row.year}-${point.row.week}`} className="yoy-point" style={{height: point.yoy == null ? '0%' : `${Math.min(100, Math.max(4, Math.abs(point.yoy) * 100))}%`}} title={point.yoy == null ? 'No comparable week' : `${point.row.year} W${String(point.row.week).padStart(2,'0')}: ${percent.format(point.yoy)} YoY`}><span className={point.yoy >= 0 ? 'positive' : 'negative'}/></div>)}</div>}
        {hover && <div className="chart-tooltip"><strong>{hover.row.year} · W{String(hover.row.week).padStart(2,'0')}</strong><span>{number.format(hover.value)} journeys</span>{showYoY && <span>{hover.yoy == null ? 'No comparable YoY' : `${percent.format(hover.yoy)} YoY`}</span>}</div>}
      </div>
    </div>
    <div className="trend-footer"><span>{rows[0]?.year} W{String(rows[0]?.week ?? '').padStart(2,'0')}</span><strong>{rows.length} weekly observations</strong><span>{rows.at(-1)?.year} W{String(rows.at(-1)?.week ?? '').padStart(2,'0')}</span></div>
  </section>;
}
