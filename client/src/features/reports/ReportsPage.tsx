import { useEffect, useState } from 'react';
import * as reportService from '../../services/reportService';
import type { CategorySales, DailySales, DatePreset, ItemSales, SalesSummary } from '../../types';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews';
import { MiniBarChart } from '../../components/MiniBarChart';
import { IconReceipt, IconSales, IconTrend } from '../../components/Icons';

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'week', label: 'Current Week' },
  { value: 'month', label: 'Current Month' },
  { value: 'custom', label: 'Custom Range' },
];

export function ReportsPage() {
  const [preset, setPreset] = useState<DatePreset>('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [byItem, setByItem] = useState<ItemSales[]>([]);
  const [byCategory, setByCategory] = useState<CategorySales[]>([]);
  const [daily, setDaily] = useState<DailySales[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (preset === 'custom' && (!from || !to)) return;
    setLoading(true);
    setError(null);
    try {
      const params = { preset, from: from || undefined, to: to || undefined };
      const [salesReport, dailyReport] = await Promise.all([
        reportService.getSalesReport(params),
        reportService.getDailySalesReport(params),
      ]);
      setSummary(salesReport.summary);
      setByItem(salesReport.byItem);
      setByCategory(salesReport.byCategory);
      setDaily(dailyReport.days);
    } catch {
      setError('Unable to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Analyze sales performance across any date range.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="chip-row" style={{ marginBottom: preset === 'custom' ? 12 : 0 }} role="tablist" aria-label="Date range preset">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={preset === p.value}
              className={`chip-btn ${preset === p.value ? 'active' : ''}`}
              onClick={() => setPreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
            <div className="field">
              <label htmlFor="from-date">From</label>
              <input id="from-date" className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="to-date">To</label>
              <input id="to-date" className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="field" style={{ flex: '0 0 auto' }}>
              <button className="btn btn-primary" onClick={load} disabled={!from || !to}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <ErrorState label={error} />}
      {loading && <LoadingState label="Loading report..." />}

      {!loading && summary && (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div>
                <div className="value">₹{summary.totalSales.toFixed(2)}</div>
                <div className="label">Total Sales</div>
              </div>
              <span className="icon-wrap">
                <IconSales />
              </span>
            </div>
            <div className="stat-tile accent">
              <div>
                <div className="value">{summary.numberOfSales}</div>
                <div className="label">Sales Records</div>
              </div>
              <span className="icon-wrap">
                <IconReceipt />
              </span>
            </div>
            <div className="stat-tile warning">
              <div>
                <div className="value">{summary.totalItemsSold}</div>
                <div className="label">Items Sold</div>
              </div>
              <span className="icon-wrap">
                <IconTrend />
              </span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Daily Sales</h2>
            <MiniBarChart
              data={daily.map((d) => ({ label: d.date.slice(5), value: d.totalSales }))}
              formatValue={(v) => `₹${v.toFixed(0)}`}
            />
          </div>

          <div className="panel-grid">
            <div className="card">
              <h2 className="section-title">Sales by Item</h2>
              {byItem.length === 0 ? (
                <EmptyState label="No sales in this range." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byItem.map((i) => (
                        <tr key={i.name}>
                          <td>{i.name}</td>
                          <td>{i.quantity}</td>
                          <td>₹{i.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="section-title">Sales by Category</h2>
              {byCategory.length === 0 ? (
                <EmptyState label="No sales in this range." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCategory.map((c) => (
                        <tr key={c.category}>
                          <td>{c.category}</td>
                          <td>{c.quantity}</td>
                          <td>₹{c.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
