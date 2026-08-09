import { MenuItem } from '../menu/menuItem.model';
import { Sale, type SaleDocument } from './sale.model';
import { AppError } from '../../utils/AppError';
import type { CreateSaleInput, ListSalesQuery } from './sale.validation';

export interface MenuItemSnapshot {
  id: string;
  name: string;
  price: number;
}

export interface CalculatedLine {
  menuItem: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export function calculateLineItems(
  requested: { menuItem: string; quantity: number }[],
  catalog: Map<string, MenuItemSnapshot>,
): { lines: CalculatedLine[]; totalAmount: number } {
  const lines: CalculatedLine[] = requested.map((req) => {
    const snapshot = catalog.get(req.menuItem);
    if (!snapshot) {
      throw new AppError(`Menu item ${req.menuItem} not found or unavailable`, 400);
    }
    const lineTotal = round2(snapshot.price * req.quantity);
    return {
      menuItem: snapshot.id,
      name: snapshot.name,
      unitPrice: snapshot.price,
      quantity: req.quantity,
      lineTotal,
    };
  });

  const totalAmount = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  return { lines, totalAmount };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function createSale(input: CreateSaleInput, createdBy: string): Promise<SaleDocument> {
  const ids = input.items.map((i) => i.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: ids }, active: true, available: true });

  const catalog = new Map<string, MenuItemSnapshot>();
  for (const item of menuItems) {
    catalog.set(item._id.toString(), { id: item._id.toString(), name: item.name, price: item.price });
  }

  const { lines, totalAmount } = calculateLineItems(input.items, catalog);

  return Sale.create({ items: lines, totalAmount, createdBy });
}

export async function listSales(
  query: ListSalesQuery,
): Promise<{ sales: SaleDocument[]; total: number; page: number; limit: number }> {
  const filter: Record<string, unknown> = {};
  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = new Date(query.from);
    if (query.to) createdAt.$lte = new Date(query.to);
    filter.createdAt = createdAt;
  }

  const skip = (query.page - 1) * query.limit;
  const [sales, total] = await Promise.all([
    Sale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).populate('createdBy', 'name email'),
    Sale.countDocuments(filter),
  ]);

  return { sales, total, page: query.page, limit: query.limit };
}

export async function getSaleById(id: string): Promise<SaleDocument> {
  const sale = await Sale.findById(id).populate('createdBy', 'name email');
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  return sale;
}
