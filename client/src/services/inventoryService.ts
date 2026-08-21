import { apiRequest } from '../lib/apiClient';
import type { InventoryItem, InventoryTransaction, TransactionType } from '../types';

// GET /api/inventory — returns a paginated inventory list.
// page and limit are sent as query parameters.
export function listInventoryItems(
  page = 1,
  limit = 10,
): Promise<{
  items: InventoryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  return apiRequest('/inventory', {
    query: {
      page,
      limit,
    },
  });
}

// GET /api/inventory/low-stock — items at or below their reorder threshold.
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

// PUT /api/inventory/:id — updates static item fields only. Quantity is
// changed exclusively through createTransaction below, never here.
export function updateInventoryItem(
  id: string,
  input: Partial<InventoryItemInput>,
): Promise<{ item: InventoryItem }> {
  return apiRequest(`/inventory/${id}`, { method: 'PUT', body: input });
}

// GET /api/inventory/:id/transactions — full stock-change history for one item.
export function listItemTransactions(id: string): Promise<{ transactions: InventoryTransaction[] }> {
  return apiRequest(`/inventory/${id}/transactions`);
}

// POST /api/inventory/:id/transactions
// Body: { type, quantityChange, reason? }. This is the only way stock
// quantity changes — the backend records it as an auditable transaction
// and updates the item's quantity atomically (see inventory.service.ts's recordTransaction).
export function createTransaction(
  id: string,
  input: { type: TransactionType; quantityChange: number; reason?: string },
): Promise<{ item: InventoryItem; transaction: InventoryTransaction }> {
  return apiRequest(`/inventory/${id}/transactions`, { method: 'POST', body: input });
}
