interface MiniChartPoint {
  label: string;
  value: number;
}

// A small, dependency-free bar chart (no charting library) used by the
// Dashboard and Reports pages to visualize sales trends. Bar heights are
// scaled relative to the largest value in the dataset so the tallest bar
// always fills the chart, and a minimum 2% height keeps zero-value bars
// visibly present rather than invisible.
export function MiniBarChart({ data, formatValue }: { data: MiniChartPoint[]; formatValue?: (v: number) => string }) {
  if (data.length === 0) {
    return <p style={{ color: 'var(--color-muted)' }}>No data for this range.</p>;
  }

  // Math.max(..., 1) avoids a divide-by-zero if every value in the range is 0.
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
