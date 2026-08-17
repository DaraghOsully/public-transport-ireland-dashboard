import { useMemo } from 'react';

const number = new Intl.NumberFormat('en-IE');
const percent = new Intl.NumberFormat('en-IE', { style: 'percent', maximumFractionDigits: 1 });

export default function ContributionPanel({ rows, year, endWeek }) {
  const analysis = useMemo(() => {
    const current = rows.filter(r => r.year === year && r.week <= endWeek);
    const prior = rows.filter(r => r.year === year - 1 && r.week <= endWeek);
    const priorByWeek = new Map(prior.map(r => [r.week, r]));
    const comparable = current.filter(r => priorByWeek.has(r.week));
    const modes = ['Dublin Bus', 'Regional Bus', 'Irish Rail', 'Luas'];
    const values = modes.map(mode => {
      let currentTotal = 0, priorTotal = 0;
      for (const row of comparable) {
        const prev = priorByWeek.get(row.week);
        if (Number.isFinite(row.modes?.[mode]) && Number.isFinite(prev?.modes?.[mode])) {
          currentTotal += row.modes[mode];
          priorTotal += prev.modes[mode];
        }
      }
      return { mode, current: currentTotal, prior: priorTotal, change: currentTotal - priorTotal };
    });
    const totalCurrent = values.reduce((s, r) => s + r.current, 0);
    const totalPrior = values.reduce((s, r) => s + r.prior, 0);
    const totalChange = totalCurrent - totalPrior;
    const maxAbsChange = Math.max(...values.map(v => Math.abs(v.change)), 1);
    return {
      comparableWeeks: comparable.length,
      totalCurrent,
      totalPrior,
      totalChange,
      yoy: totalPrior ? totalChange / totalPrior : null,
      maxAbsChange,
      values: values.sort((a,b) => Math.abs(b.change) - Math.abs(a.change)),
    };
  }, [rows, year, endWeek]);

  const driver = analysis.values[0];
  return <section className="panel contribution-panel">
    <div className="panel-head">
      <div><span className="eyebrow">DRIVERS</span><h2>What is driving the change?</h2></div>
      <span>{analysis.comparableWeeks} comparable weeks</span>
    </div>
    <div className="driver-lead">
      <strong>{analysis.yoy == null ? '—' : `${analysis.yoy >= 0 ? '+' : ''}${percent.format(analysis.yoy)}`}</strong>
      <span>{year} YTD versus {year - 1} through week {String(endWeek).padStart(2,'0')}</span>
      {driver && <p>{driver.mode} is the largest contributor to the movement, changing by <strong>{number.format(Math.abs(driver.change))}</strong> passenger journeys.</p>}
    </div>
    <div className="contribution-total">
      <span>Net change</span>
      <strong className={analysis.totalChange >= 0 ? 'up' : 'down'}>{analysis.totalChange >= 0 ? '+' : '−'}{number.format(Math.abs(analysis.totalChange))}</strong>
      <small>{analysis.totalCurrent >= analysis.totalPrior ? 'more' : 'fewer'} passenger journeys than the comparable period</small>
    </div>
    <div className="contribution-list">
      {analysis.values.map(item => {
        const width = `${Math.max(8, Math.min(100, Math.abs(item.change) / analysis.maxAbsChange * 100))}%`;
        return <div className="contribution-row" key={item.mode}>
          <div className="contribution-label"><strong>{item.mode}</strong><span>{item.change >= 0 ? '+' : '−'}{number.format(Math.abs(item.change))} journeys</span></div>
          <div className="contribution-track"><span className={item.change >= 0 ? 'contribution-bar positive' : 'contribution-bar negative'} style={{ width }} /></div>
          <div className={item.change >= 0 ? 'up' : 'down'}>{item.change >= 0 ? '+' : '−'}{number.format(Math.abs(item.change))}</div>
        </div>;
      })}
    </div>
  </section>;
}
