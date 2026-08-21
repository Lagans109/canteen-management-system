import { apiRequest } from '../lib/apiClient';
import type { CategorySales, DailySales, DatePreset, ItemSales, SalesSummary } from '../types';

export interface ReportQueryParams {
  preset: DatePreset;
  from?: string;
  to?: string;
}

interface DateRangeResponse {
  start: string;
  end: string;
}

// GET /api/reports/sales — totals plus breakdowns by item and by category
// for the requested date range (`preset`, or `from`/`to` for a custom range).
export function getSalesReport(params: ReportQueryParams): Promise<{
  range: DateRangeResponse;
  summary: SalesSummary;
  byItem: ItemSales[];
  byCategory: CategorySales[];
}> {
  return apiRequest('/reports/sales', { query: params });
}

// GET /api/reports/top-items — best-selling items by quantity; `limit`
// caps how many are returned (used for a "top 5" panel on the dashboard).
export function getTopItemsReport(
  params: ReportQueryParams & { limit?: number },
): Promise<{ range: DateRangeResponse; items: ItemSales[] }> {
  return apiRequest('/reports/top-items', { query: params });
}

// GET /api/reports/daily-sales — day-by-day totals, used to draw the sales trend chart.
export function getDailySalesReport(
  params: ReportQueryParams,
): Promise<{ range: DateRangeResponse; days: DailySales[] }> {
  return apiRequest('/reports/daily-sales', { query: params });
}
