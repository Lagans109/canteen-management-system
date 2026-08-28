import { useEffect, useState } from 'react';
import * as reportService from '../../services/reportService';
import type {
  CategorySales,
  DailySales,
  DatePreset,
  ItemProfitability,
  ItemSales,
  ProfitSummary,
  SalesSummary,
} from '../../types';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews';
import { MiniBarChart } from '../../components/MiniBarChart';
import { IconReceipt, IconSales, IconTrend } from '../../components/Icons';

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'week', label: 'Current Week' },
  { value: 'month', label: 'Current Month' },
  { value: 'year', label: 'Current Year' },
  { value: 'custom', label: 'Custom Range' },
];

// Reporting screen, open to OWNER and CASHIER alike: lets you pick a date range (a named
// preset, or a custom from/to pair) and see sales totals, breakdowns by
// item/category, and a daily trend chart for that range.
export function ReportsPage() {
  // Which date-range preset is selected; drives what gets sent as the
  // `preset` query param to every report endpoint.
  const [preset, setPreset] = useState<DatePreset>('today');
  // Only used when preset === 'custom'.
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [byItem, setByItem] = useState<ItemSales[]>([]);
  const [byCategory, setByCategory] = useState<CategorySales[]>([]);
  const [daily, setDaily] = useState<DailySales[]>([]);
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [byItemProfit, setByItemProfit] = useState<ItemProfitability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetches the sales, daily-sales, and profit reports together for the
  // current preset/from/to. For a custom range, waits until both `from`
  // and `to` are filled in before calling the API (there's nothing useful
  // to query otherwise).
  const load = async () => {
    if (preset === 'custom' && (!from || !to)) return;
    setLoading(true);
    setError(null);
    try {
      const params = { preset, from: from || undefined, to: to || undefined };
      const [salesReport, dailyReport, profitReport] = await Promise.all([
        reportService.getSalesReport(params),
        reportService.getDailySalesReport(params),
        reportService.getProfitReport(params),
      ]);
      setSummary(salesReport.summary);
      setByItem(salesReport.byItem);
      setByCategory(salesReport.byCategory);
      setDaily(dailyReport.days);
      setProfitSummary(profitReport.summary);
      setByItemProfit(profitReport.byItem);
    } catch {
      setError('Unable to load report data.');
    } finally {
      setLoading(false);
    }
  };

  // Labels the profit stat tiles with the currently-selected period (e.g.
  // "Today's Profit", "Current Month Cost of Goods") so it's clear at a
  // glance which range the totals below belong to.
  const periodLabel =
    preset === 'today' || preset === 'yesterday'
      ? `${PRESETS.find((p) => p.value === preset)!.label}'s`
      : preset === 'custom'
        ? 'Range'
        : (PRESETS.find((p) => p.value === preset)?.label ?? 'Period');

  // Re-fetches automatically whenever the preset changes (e.g. clicking
  // "Last 7 Days"). For 'custom', the user instead triggers the fetch
  // manually via the "Apply" button, which is why `from`/`to` are
  // deliberately excluded from this effect's dependencies.
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

          {profitSummary && (
            <>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-tile">
                  <div>
                    <div className="value">₹{profitSummary.totalRevenue.toFixed(2)}</div>
                    <div className="label">{periodLabel} Revenue</div>
                  </div>
                  <span className="icon-wrap">
                    <IconSales />
                  </span>
                </div>
                <div className="stat-tile warning">
                  <div>
                    <div className="value">₹{profitSummary.totalCost.toFixed(2)}</div>
                    <div className="label">{periodLabel} Cost of Goods</div>
                  </div>
                  <span className="icon-wrap">
                    <IconReceipt />
                  </span>
                </div>
                <div className={`stat-tile ${profitSummary.totalProfit < 0 ? 'danger' : 'accent'}`}>
                  <div>
                    <div className="value">₹{profitSummary.totalProfit.toFixed(2)}</div>
                    <div className="label">
                      {periodLabel} Profit ({profitSummary.marginPercent.toFixed(1)}% margin)
                    </div>
                  </div>
                  <span className="icon-wrap">
                    <IconTrend />
                  </span>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <h2 className="section-title">Profit by Item</h2>
                {profitSummary.itemsWithoutCost > 0 && (
                  <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: -6, marginBottom: 12 }}>
                    {profitSummary.itemsWithoutCost} item{profitSummary.itemsWithoutCost === 1 ? '' : 's'} sold in
                    this range {profitSummary.itemsWithoutCost === 1 ? "isn't" : "aren't"} linked to an inventory
                    cost price — shown with "—" below and excluded from the totals above.
                  </p>
                )}
                {byItemProfit.length === 0 ? (
                  <EmptyState label="No sales in this range." />
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Revenue</th>
                          <th>Cost</th>
                          <th>Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byItemProfit.map((i) => (
                          <tr key={i.name}>
                            <td>{i.name}</td>
                            <td>{i.quantity}</td>
                            <td>₹{i.revenue.toFixed(2)}</td>
                            <td>{i.cost === null ? '—' : `₹${i.cost.toFixed(2)}`}</td>
                            <td
                              style={
                                i.profit !== null
                                  ? { color: i.profit < 0 ? 'var(--color-danger)' : 'var(--color-accent)', fontWeight: 600 }
                                  : undefined
                              }
                            >
                              {i.profit === null ? '—' : `₹${i.profit.toFixed(2)}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

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
