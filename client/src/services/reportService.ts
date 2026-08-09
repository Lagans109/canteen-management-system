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

export function getSalesReport(params: ReportQueryParams): Promise<{
  range: DateRangeResponse;
  summary: SalesSummary;
  byItem: ItemSales[];
  byCategory: CategorySales[];
}> {
  return apiRequest('/reports/sales', { query: params });
}

export function getTopItemsReport(
  params: ReportQueryParams & { limit?: number },
): Promise<{ range: DateRangeResponse; items: ItemSales[] }> {
  return apiRequest('/reports/top-items', { query: params });
}

export function getDailySalesReport(
  params: ReportQueryParams,
): Promise<{ range: DateRangeResponse; days: DailySales[] }> {
  return apiRequest('/reports/daily-sales', { query: params });
}
