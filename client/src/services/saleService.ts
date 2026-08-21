import { apiRequest } from '../lib/apiClient';
import type { Sale } from '../types';

export interface CreateSaleInput {
  items: { menuItem: string; quantity: number }[];
}

// POST /api/sales — records a sale for the items picked at the counter.
// Prices aren't sent here; the backend looks them up itself.
export function createSale(input: CreateSaleInput): Promise<{ sale: Sale }> {
  return apiRequest('/sales', { method: 'POST', body: input });
}

// GET /api/sales — lists sales, optionally filtered by date range and
// paginated via `page`/`limit`. This is the one place in the app where the
// backend fully implements server-side pagination (see sale.service.ts's
// listSales: it computes `skip = (page - 1) * limit` and returns
// `total`/`page`/`limit` alongside the results). Callers such as
// SalesPage/DashboardPage currently only ever request a fixed `limit`
// without varying `page`, so no "next page" UI exists yet even though the
// backend supports it.
export function listSales(params: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ sales: Sale[]; total: number; page: number; limit: number }> {
  return apiRequest('/sales', { query: params });
}

// GET /api/sales/:id — a single sale's full detail.
export function getSale(id: string): Promise<{ sale: Sale }> {
  return apiRequest(`/sales/${id}`);
}
