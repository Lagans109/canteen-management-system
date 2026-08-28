import { MenuItem } from '../menu/menuItem.model';
import { Sale, type SaleDocument } from './sale.model';
import { AppError } from '../../utils/AppError';
import { deductForSale } from '../inventory/inventory.service';
import type { CreateSaleInput, ListSalesQuery } from './sale.validation';

// A minimal, trusted snapshot of a menu item's name/price at the moment a
// sale is created — used to build each sale line without exposing the full
// MenuItem document to the calculation logic.
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

// Turns the raw {menuItem, quantity} pairs a cashier submitted into fully
// priced line items, using `catalog` (current, trusted prices looked up
// from the database — never prices sent by the client) as the source of
// truth. Throws if a requested menu item isn't in the catalog (e.g. it was
// deleted, deactivated, or made unavailable between page load and submit).
// Exported so the demo data seed script (seedSales.ts) can reuse the exact
// same pricing logic when generating realistic fake sales.
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

// Rounds a monetary value to 2 decimal places, avoiding floating-point
// artifacts (e.g. 19.999999999998) from repeated multiplication/summing.
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Creates a new Sale record. Only menu items that are currently `active`
// and `available` are fetched into the pricing catalog, so a sale can't be
// recorded for an item that's been removed or marked out of stock — even
// if the request still references its id. The resulting line items store a
// name/price *snapshot*, so this sale's numbers never change even if the
// menu item's price changes later.
//
// After the sale is persisted, stock is auto-deducted for any line item
// whose menu item has a linked InventoryItem (see deductForSale). This runs
// after Sale.create so a hiccup in inventory bookkeeping (e.g. a concurrent
// update conflict) never prevents the sale itself from being recorded — the
// sale is already the source of truth; inventory is best-effort follow-up.
export async function createSale(input: CreateSaleInput, createdBy: string): Promise<SaleDocument> {
  const ids = input.items.map((i) => i.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: ids }, active: true, available: true });

  const catalog = new Map<string, MenuItemSnapshot>();
  for (const item of menuItems) {
    catalog.set(item._id.toString(), { id: item._id.toString(), name: item.name, price: item.price });
  }

  const { lines, totalAmount } = calculateLineItems(input.items, catalog);

  const sale = await Sale.create({ items: lines, totalAmount, createdBy });

  await Promise.all(
    lines.map((line) =>
      deductForSale(line.menuItem, line.quantity, createdBy).catch((err: unknown) => {
        console.error(`Inventory auto-deduction failed for menu item ${line.menuItem}:`, err);
      }),
    ),
  );

  return sale;
}

// Returns a page of sale records, optionally filtered by a createdAt date
// range. This is the project's reference implementation of server-side
// pagination:
//   - `filter` is built first (date range), and the SAME filter object is
//     used for both the paginated query and the count below — otherwise
//     `total`/`totalPages` on the frontend wouldn't match what's actually
//     being paged through.
//   - `skip = (page - 1) * limit` — e.g. page 2 with limit 20 skips the
//     first 20 matching sales, so the query returns sales 21-40.
//   - `countDocuments(filter)` counts how many sales match the filter in
//     total (not just this page), which the frontend uses to know how many
//     pages exist.
//   - Both queries run concurrently via Promise.all since neither depends
//     on the other's result.
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

// Fetches a single sale by id, with the creating user's name/email attached.
export async function getSaleById(id: string): Promise<SaleDocument> {
  const sale = await Sale.findById(id).populate('createdBy', 'name email');
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  return sale;
}
