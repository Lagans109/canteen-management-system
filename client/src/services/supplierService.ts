import { apiRequest } from '../lib/apiClient';
import type { Supplier } from '../types';

// GET /api/suppliers — full supplier list; not paginated on the backend, so
// there's nothing to paginate here either.
export function listSuppliers(): Promise<{ suppliers: Supplier[] }> {
  return apiRequest('/suppliers');
}

export interface SupplierInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  active: boolean;
}

export function createSupplier(input: SupplierInput): Promise<{ supplier: Supplier }> {
  return apiRequest('/suppliers', { method: 'POST', body: input });
}

export function updateSupplier(id: string, input: Partial<SupplierInput>): Promise<{ supplier: Supplier }> {
  return apiRequest(`/suppliers/${id}`, { method: 'PUT', body: input });
}
