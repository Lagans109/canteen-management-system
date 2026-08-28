import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as reportService from '../../services/reportService';
import * as saleService from '../../services/saleService';
import * as inventoryService from '../../services/inventoryService';
import type { DailySales, InventoryItem, ItemSales, ProfitSummary, Sale, SalesSummary } from '../../types';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews';
import { MiniBarChart } from '../../components/MiniBarChart';
import { IconAlert, IconReceipt, IconSales, IconTrend } from '../../components/Icons';

// Data only OWNER users see: today's summary, top items, low-stock items,
// and the last-7-days trend. Grouped in one object so the page can tell
// "not loaded yet" (null) apart from "loaded" in a single check.
interface OwnerData {
  summary: SalesSummary;
  profit: ProfitSummary;
  topItems: ItemSales[];
  lowStock: InventoryItem[];
  trend: DailySales[];
}

// The landing page after login for both OWNER and CASHIER — both see the
// exact same dashboard (recent sales, today's summary/profit, top items,
// low stock, and the 7-day trend); there's no role-based restriction here.
export function DashboardPage() {
  const { user } = useAuth();
  const [recentSales, setRecentSales] = useState<Sale[] | null>(null);
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Runs once on mount: fetches the 5 most recent sales plus today's
  // summary/profit/top-items/low-stock/trend data, all in one pass.
  useEffect(() => {
    const load = async () => {
      try {
        // Requests only the first 5 sales (no page controls) — enough for
        // a "recent activity" preview, not a full paginated history.
        const salesRes = await saleService.listSales({ limit: 5 });
        setRecentSales(salesRes.sales);

        const [salesReport, profitReport, topItemsReport, lowStock, trendReport] = await Promise.all([
          reportService.getSalesReport({ preset: 'today' }),
          reportService.getProfitReport({ preset: 'today' }),
          reportService.getTopItemsReport({ preset: 'today', limit: 5 }),
          inventoryService.listLowStockItems(),
          reportService.getDailySalesReport({ preset: 'last7days' }),
        ]);
        setOwnerData({
          summary: salesReport.summary,
          profit: profitReport.summary,
          topItems: topItemsReport.items,
          lowStock: lowStock.items,
          trend: trendReport.days,
        });
      } catch {
        setError('Unable to load dashboard data.');
      }
    };
    load();
  }, []);

  if (error) return <ErrorState label={error} />;
  if (!recentSales) return <LoadingState label="Loading dashboard..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name?.split(' ')[0]}. Here's how today looks.</p>
        </div>
      </div>

      {ownerData && (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div>
                <div className="value">₹{ownerData.summary.totalSales.toFixed(2)}</div>
                <div className="label">Today's Sales</div>
              </div>
              <span className="icon-wrap">
                <IconSales />
              </span>
            </div>
            <div className="stat-tile accent">
              <div>
                <div className="value">{ownerData.summary.numberOfSales}</div>
                <div className="label">Transactions</div>
              </div>
              <span className="icon-wrap">
                <IconReceipt />
              </span>
            </div>
            <div className="stat-tile warning">
              <div>
                <div className="value">{ownerData.summary.totalItemsSold}</div>
                <div className="label">Items Sold</div>
              </div>
              <span className="icon-wrap">
                <IconTrend />
              </span>
            </div>
            <div className={`stat-tile ${ownerData.profit.totalProfit < 0 ? 'danger' : 'accent'}`}>
              <div>
                <div className="value">₹{ownerData.profit.totalProfit.toFixed(2)}</div>
                <div className="label">Today's Profit</div>
              </div>
              <span className="icon-wrap">
                <IconTrend />
              </span>
            </div>
            <div className={`stat-tile ${ownerData.lowStock.length > 0 ? 'danger' : 'accent'}`}>
              <div>
                <div className="value">{ownerData.lowStock.length}</div>
                <div className="label">Low Stock Items</div>
              </div>
              <span className="icon-wrap">
                <IconAlert />
              </span>
            </div>
          </div>

          <div className="panel-grid">
            <div className="card">
              <h2 className="section-title">Top Selling Items Today</h2>
              {ownerData.topItems.length === 0 ? (
                <EmptyState label="No sales recorded yet today." />
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
                      {ownerData.topItems.map((item) => (
                        <tr key={item.name}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="section-title">Low Stock Items</h2>
              {ownerData.lowStock.length === 0 ? (
                <EmptyState label="All stock levels are healthy." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Threshold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerData.lowStock.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <span className="low-stock-dot" aria-hidden="true" />
                            {item.name}
                          </td>
                          <td>
                            {item.quantity} {item.unit}
                          </td>
                          <td>{item.minStockThreshold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="section-title">Sales Trend (Last 7 Days)</h2>
            <MiniBarChart
              data={ownerData.trend.map((d) => ({ label: d.date.slice(5), value: d.totalSales }))}
              formatValue={(v) => `₹${v.toFixed(0)}`}
            />
          </div>
        </>
      )}

      <div className="card">
        <h2 className="section-title">Recent Sales</h2>
        {recentSales.length === 0 ? (
          <EmptyState label="No sales recorded yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale._id}>
                    <td>{new Date(sale.createdAt).toLocaleString()}</td>
                    <td>{sale.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</td>
                    <td>₹{sale.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
