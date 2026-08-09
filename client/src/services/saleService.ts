import { apiRequest } from '../lib/apiClient';
import type { Sale } from '../types';

export interface CreateSaleInput {
  items: { menuItem: string; quantity: number }[];
}

export function createSale(input: CreateSaleInput): Promise<{ sale: Sale }> {
  return apiRequest('/sales', { method: 'POST', body: input });
}

export function listSales(params: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ sales: Sale[]; total: number; page: number; limit: number }> {
  return apiRequest('/sales', { query: params });
}

export function getSale(id: string): Promise<{ sale: Sale }> {
  return apiRequest(`/sales/${id}`);
}
