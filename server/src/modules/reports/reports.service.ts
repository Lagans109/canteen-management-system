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

// Shared MongoDB match condition used by every report query below: only
// consider sales whose createdAt falls within the resolved date range.
function dateMatch(range: DateRange): Record<string, unknown> {
  return { createdAt: { $gte: range.start, $lte: range.end } };
}

// Aggregates high-level totals (revenue, number of transactions, total
// items sold) for the given date range. `$project` first computes each
// sale's item count, then `$group` (with `_id: null`, meaning "one group
// for everything") sums across all matching sales in a single pass.
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

  // If there were no sales in the range, `result` is empty — default to zeros
  // instead of returning undefined values.
  const summary = result[0];
  return {
    totalSales: summary?.totalSales ?? 0,
    numberOfSales: summary?.numberOfSales ?? 0,
    totalItemsSold: summary?.totalItemsSold ?? 0,
  };
}

// Breaks total sales down by item name, sorted highest revenue first.
// `$unwind` turns each sale's `items` array into one pipeline document per
// line item, so quantities/amounts can be grouped by item name across all sales.
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

// Reuses getSalesByItem's per-item totals, then re-sorts by quantity sold
// (rather than revenue) and trims to the requested count — this is what
// powers the dashboard's "Top Selling Items" panel.
export async function getTopSellingItems(range: DateRange, limit: number): Promise<ItemSales[]> {
  const items = await getSalesByItem(range);
  return items.sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

export interface CategorySales {
  category: string;
  quantity: number;
  totalAmount: number;
}

// Breaks total sales down by category. Since a Sale's line items only
// store the menu item's id (not its category), this pipeline has to
// `$lookup` (MongoDB's equivalent of a SQL join) from items → MenuItem →
// Category to recover the category name for each line, then group by it.
// Items whose category can't be resolved (e.g. a deleted category) fall
// back to "Uncategorized" rather than being silently dropped.
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

export interface ItemProfitability {
  name: string;
  quantity: number;
  revenue: number;
  // `cost`/`profit` are null when the item has no linked InventoryItem (no
  // recorded costPrice) — its cost is unknown, not zero, so it's kept out
  // of the cost/profit totals rather than silently counted as pure profit.
  cost: number | null;
  profit: number | null;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  // Profit margin over only the revenue from cost-tracked items — mixing in
  // untracked-item revenue (unknown cost) would understate the true margin.
  marginPercent: number;
  itemsWithoutCost: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Breaks total sales down by item name with per-item cost/profit, using the
// item's *current* InventoryItem.costPrice (there's no historical cost
// snapshot on the sale line itself — see sale.model.ts) looked up via
// sourceMenuItem, the same link deductForSale uses. Items never linked to
// an InventoryItem (or whose link was later removed) come back with
// cost/profit as null instead of 0, since their cost is unknown, not free.
export async function getItemProfitability(range: DateRange): Promise<ItemProfitability[]> {
  return Sale.aggregate<ItemProfitability>([
    { $match: dateMatch(range) },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'inventoryitems',
        localField: 'items.menuItem',
        foreignField: 'sourceMenuItem',
        as: 'inventoryDoc',
      },
    },
    { $addFields: { unitCost: { $arrayElemAt: ['$inventoryDoc.costPrice', 0] } } },
    {
      $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
        cost: {
          $sum: {
            $cond: [{ $eq: ['$unitCost', null] }, 0, { $multiply: ['$unitCost', '$items.quantity'] }],
          },
        },
        // 1 if ANY line contributing to this item had no known cost, so the
        // group's cost/profit can be nulled out below rather than
        // understated by treating that line's cost as zero.
        hasUnknownCost: { $max: { $cond: [{ $eq: ['$unitCost', null] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        quantity: 1,
        revenue: 1,
        cost: { $cond: ['$hasUnknownCost', null, '$cost'] },
        profit: { $cond: ['$hasUnknownCost', null, { $subtract: ['$revenue', '$cost'] }] },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
}

// Rolls per-item profitability up into report-level totals. Revenue counts
// every sold item; cost/profit/margin only count items with a known cost
// price, and `itemsWithoutCost` surfaces how many distinct items were
// excluded so the UI can flag that the profit figure is partial.
export function summarizeProfitability(items: ItemProfitability[]): ProfitSummary {
  let totalRevenue = 0;
  let totalCost = 0;
  let trackedRevenue = 0;
  let itemsWithoutCost = 0;

  for (const item of items) {
    totalRevenue += item.revenue;
    if (item.cost === null) {
      itemsWithoutCost += 1;
    } else {
      totalCost += item.cost;
      trackedRevenue += item.revenue;
    }
  }

  const totalProfit = round2(trackedRevenue - totalCost);
  const marginPercent = trackedRevenue > 0 ? round2((totalProfit / trackedRevenue) * 100) : 0;

  return {
    totalRevenue: round2(totalRevenue),
    totalCost: round2(totalCost),
    totalProfit,
    marginPercent,
    itemsWithoutCost,
  };
}

// Groups sales by calendar day (in "YYYY-MM-DD" form) within the range —
// used to draw the daily sales trend chart.
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
