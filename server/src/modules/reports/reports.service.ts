import { Sale } from '../sales/sale.model';
import type { DateRange } from './dateRange';

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

export interface DailySales {
  date: string;
  totalSales: number;
  numberOfSales: number;
}

function dateMatch(range: DateRange): Record<string, unknown> {
  return { createdAt: { $gte: range.start, $lte: range.end } };
}

export async function getSalesSummary(range: DateRange): Promise<SalesSummary> {
  const result = await Sale.aggregate<{ totalSales: number; numberOfSales: number; totalItemsSold: number }>([
    { $match: dateMatch(range) },
    {
      $project: {
        totalAmount: 1,
        itemCount: { $sum: '$items.quantity' },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        numberOfSales: { $sum: 1 },
        totalItemsSold: { $sum: '$itemCount' },
      },
    },
  ]);

  const summary = result[0];
  return {
    totalSales: summary?.totalSales ?? 0,
    numberOfSales: summary?.numberOfSales ?? 0,
    totalItemsSold: summary?.totalItemsSold ?? 0,
  };
}

export async function getSalesByItem(range: DateRange): Promise<ItemSales[]> {
  return Sale.aggregate<ItemSales>([
    { $match: dateMatch(range) },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: '$items.lineTotal' },
      },
    },
    { $project: { _id: 0, name: '$_id', quantity: 1, totalAmount: 1 } },
    { $sort: { totalAmount: -1 } },
  ]);
}

export async function getTopSellingItems(range: DateRange, limit: number): Promise<ItemSales[]> {
  const items = await getSalesByItem(range);
  return items.sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

export interface CategorySales {
  category: string;
  quantity: number;
  totalAmount: number;
}

export async function getSalesByCategory(range: DateRange): Promise<CategorySales[]> {
  return Sale.aggregate<CategorySales>([
    { $match: dateMatch(range) },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'menuitems',
        localField: 'items.menuItem',
        foreignField: '_id',
        as: 'menuItemDoc',
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'menuItemDoc.category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    {
      $addFields: {
        categoryName: { $ifNull: [{ $arrayElemAt: ['$categoryDoc.name', 0] }, 'Uncategorized'] },
      },
    },
    {
      $group: {
        _id: '$categoryName',
        quantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: '$items.lineTotal' },
      },
    },
    { $project: { _id: 0, category: '$_id', quantity: 1, totalAmount: 1 } },
    { $sort: { totalAmount: -1 } },
  ]);
}

export async function getDailySales(range: DateRange): Promise<DailySales[]> {
  return Sale.aggregate<DailySales>([
    { $match: dateMatch(range) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalSales: { $sum: '$totalAmount' },
        numberOfSales: { $sum: 1 },
      },
    },
    { $project: { _id: 0, date: '$_id', totalSales: 1, numberOfSales: 1 } },
    { $sort: { date: 1 } },
  ]);
}
