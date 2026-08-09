interface MiniChartPoint {
  label: string;
  value: number;
}

export function MiniBarChart({ data, formatValue }: { data: MiniChartPoint[]; formatValue?: (v: number) => string }) {
  if (data.length === 0) {
    return <p style={{ color: 'var(--color-muted)' }}>No data for this range.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const format = formatValue ?? ((v: number) => String(v));

  return (
    <div className="mini-chart" role="img" aria-label="Sales trend bar chart">
      {data.map((d) => (
        <div className="bar-col" key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <span className="bar-value">{d.value > 0 ? format(d.value) : ''}</span>
          <div className="bar" style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }} />
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
