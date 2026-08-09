import { apiRequest } from '../lib/apiClient';
import type { InventoryItem, InventoryTransaction, TransactionType } from '../types';

export function listInventoryItems(): Promise<{ items: InventoryItem[] }> {
  return apiRequest('/inventory');
}

export function listLowStockItems(): Promise<{ items: InventoryItem[] }> {
  return apiRequest('/inventory/low-stock');
}

export interface InventoryItemInput {
  name: string;
  unit: string;
  quantity: number;
  minStockThreshold: number;
  costPrice: number;
  supplier?: string;
  active: boolean;
}

export function createInventoryItem(input: InventoryItemInput): Promise<{ item: InventoryItem }> {
  return apiRequest('/inventory', { method: 'POST', body: input });
}

export function updateInventoryItem(
  id: string,
  input: Partial<InventoryItemInput>,
): Promise<{ item: InventoryItem }> {
  return apiRequest(`/inventory/${id}`, { method: 'PUT', body: input });
}

export function listItemTransactions(id: string): Promise<{ transactions: InventoryTransaction[] }> {
  return apiRequest(`/inventory/${id}/transactions`);
}

export function createTransaction(
  id: string,
  input: { type: TransactionType; quantityChange: number; reason?: string },
): Promise<{ item: InventoryItem; transaction: InventoryTransaction }> {
  return apiRequest(`/inventory/${id}/transactions`, { method: 'POST', body: input });
}
