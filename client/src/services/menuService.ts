import { apiRequest } from '../lib/apiClient';
import type { Category, MenuItem, PublicMenuItem } from '../types';

export function getPublicMenu(): Promise<{ items: PublicMenuItem[] }> {
  return apiRequest('/menu');
}

export function getCategories(): Promise<{ categories: Category[] }> {
  return apiRequest('/menu/categories');
}

export function getAllMenuItems(): Promise<{ items: MenuItem[] }> {
  return apiRequest('/menu/items');
}

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  variantLabel?: string;
  category: string;
  active: boolean;
  available: boolean;
  displayOrder: number;
  imageUrl?: string;
}

export function createMenuItem(input: MenuItemInput): Promise<{ item: MenuItem }> {
  return apiRequest('/menu/items', { method: 'POST', body: input });
}

export function updateMenuItem(id: string, input: Partial<MenuItemInput>): Promise<{ item: MenuItem }> {
  return apiRequest(`/menu/items/${id}`, { method: 'PUT', body: input });
}

export function deleteMenuItem(id: string): Promise<void> {
  return apiRequest(`/menu/items/${id}`, { method: 'DELETE' });
}

export interface CategoryInput {
  name: string;
  displayOrder: number;
  active: boolean;
}

export function createCategory(input: CategoryInput): Promise<{ category: Category }> {
  return apiRequest('/menu/categories', { method: 'POST', body: input });
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Promise<{ category: Category }> {
  return apiRequest(`/menu/categories/${id}`, { method: 'PUT', body: input });
}

export function deleteCategory(id: string): Promise<void> {
  return apiRequest(`/menu/categories/${id}`, { method: 'DELETE' });
}
