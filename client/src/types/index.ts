export type Role = 'OWNER' | 'CASHIER';

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

export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'week' | 'month' | 'custom';
