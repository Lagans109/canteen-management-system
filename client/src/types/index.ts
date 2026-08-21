// Shared TypeScript types used across the frontend, mirroring (but
// intentionally simplified from) the backend's Mongoose models and API
// response shapes. Kept in one place so services/components import a
// single consistent definition instead of redefining these shapes locally.

export type Role = 'OWNER' | 'CASHIER';

// The authenticated user's public profile, as returned by /auth/login and
// /auth/me (never includes the password hash — see the backend's toUserPublic()).
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  displayOrder: number;
  active: boolean;
}

// Full menu item shape used in the admin Menu Management screen — includes
// internal fields (active/available/displayOrder) that the public menu
// doesn't expose. `category` can be either a populated object or a raw id
// string depending on which endpoint returned it.
export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  variantLabel?: string;
  category: Category | string;
  active: boolean;
  available: boolean;
  displayOrder: number;
  imageUrl?: string;
}

// The trimmed-down item shape shown on the public, unauthenticated menu
// (see the backend's PublicMenuItem type) — no internal flags, category
// already expanded to {id, name}.
export interface PublicMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  variantLabel?: string;
  imageUrl?: string;
  category: { id: string; name: string };
}

export interface SaleLineItem {
  menuItem: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Sale {
  _id: string;
  items: SaleLineItem[];
  totalAmount: number;
  createdBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
}

export type TransactionType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'WASTE' | 'RETURN';

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  active: boolean;
}

export interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  quantity: number;
  minStockThreshold: number;
  costPrice: number;
  supplier?: { _id: string; name: string } | string;
  active: boolean;
}

export interface InventoryTransaction {
  _id: string;
  inventoryItem: string;
  type: TransactionType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string;
  createdBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
}

export interface SalesSummary {
  totalSales: number;
  numberOfSales: number;
  totalItemsSold: number;
}

export interface ItemSales {
  name: string;
  quantity: number;
  totalAmount: number;
}

export interface CategorySales {
  category: string;
  quantity: number;
  totalAmount: number;
}

export interface DailySales {
  date: string;
  totalSales: number;
  numberOfSales: number;
}

// Named date-range shortcuts accepted by the Reports endpoints (see
// server/src/modules/reports/dateRange.ts for how these resolve to actual dates).
export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'week' | 'month' | 'custom';
