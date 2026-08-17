import { useMemo, useState } from 'react';

const number = new Intl.NumberFormat('en-IE');
const MODES = ['All Public Transport', 'Dublin Bus', 'Regional Bus', 'Irish Rail', 'Luas'];

function valueFor(row, mode) {
  return mode === 'All Public Transport' ? row.value : (row.modes?.[mode] ?? 0);
}

export default function TransportTrendChart({ rows }) {
  const [mode, setMode] = useState('All Public Transport');
  const [hover, setHover] = useState(null);
  const values = useMemo(() => rows.map(r => valueFor(r, mode)), [rows, mode]);
  const max = Math.max(...values, 1);

  return <section className="panel trend-panel">
    <div className="panel-head trend-head">
      <div><span className="eyebrow">TREND</span><h2>Weekly passenger journeys</h2><span>Hover a week for the exact value</span></div>
      <div className="mode-tabs" role="tablist" aria-label="Transport mode">
        {MODES.map(item => <button key={item} className={item === mode ? 'active' : ''} onClick={() => setMode(item)}>{item}</button>)}
      </div>
    </div>
    <div className="trend-chart" onMouseLeave={() => setHover(null)}>
      <div className="y-axis"><span>{number.format(max)}</span><span>{number.format(Math.round(max / 2))}</span><span>0</span></div>
      <div className="plot">
        <div className="grid-line top"/><div className="grid-line middle"/><div className="grid-line bottom"/>
        <div className="bars">{rows.map((row, i) => { const value = values[i]; return <div key={`${row.year}-${row.week}`} className="point" onMouseEnter={() => setHover({ row, value })}><div className="bar" style={{height:`${Math.max(2, value / max * 100)}%`}}/></div>; })}</div>
        {hover && <div className="chart-tooltip"><strong>{hover.row.year} · W{String(hover.row.week).padStart(2,'0')}</strong><span>{number.format(hover.value)} journeys</span></div>}
      </div>
    </div>
    <div className="trend-footer"><span>{rows[0]?.year} W{String(rows[0]?.week ?? '').padStart(2,'0')}</span><strong>{rows.length} weekly observations</strong><span>{rows.at(-1)?.year} W{String(rows.at(-1)?.week ?? '').padStart(2,'0')}</span></div>
  </section>;
}
