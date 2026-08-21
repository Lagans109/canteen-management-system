import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { InventoryItem } from './inventoryItem.model';
import { recordTransaction, listTransactionsForItem, listLowStockItems } from './inventory.service';
import type { CreateInventoryItemInput, UpdateInventoryItemInput, CreateTransactionInput } from './inventory.validation';
import type { AuthenticatedRequest } from '../../middlewares/auth';

// GET /api/inventory
// Returns every inventory item with its supplier's name populated.
// No page/limit query params are read here — the entire collection is
// fetched every time. Fine while item counts are small, but this would
// need server-side pagination (skip/limit + a total count, following the
// pattern in sale.service.ts's listSales) if the list grows large.
export const listInventoryItems = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InventoryItem.find()
        .sort({ name: 1 })
        .populate('supplier', 'name')
        .skip(skip)
        .limit(limit),

      InventoryItem.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages,
    });
  }
);

// GET /api/inventory/low-stock — delegates the "what counts as low stock"
// rule to the service layer.
export const getLowStockItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listLowStockItems();
  res.status(200).json({ items });
});

// POST /api/inventory — creates a new inventory item (e.g. a raw material
// or stock line) with an initial quantity/threshold/cost price.
export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateInventoryItemInput;
  const item = await InventoryItem.create(input);
  res.status(201).json({ item });
});

// PUT /api/inventory/:id — updates an item's static fields (name, unit,
// threshold, cost price, supplier, active flag). Quantity is intentionally
// NOT changed through this endpoint — stock changes always go through
// createTransactionHandler below, so every quantity change leaves an audit trail.
export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateInventoryItemInput;
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) throw new AppError('Inventory item not found', 404);
  res.status(200).json({ item });
});

// POST /api/inventory/:id/transactions
// Body: { type, quantityChange, reason? }. `req.user.sub` (the logged-in
// owner) is recorded as who made the change. The actual quantity math and
// concurrency-safe update happen in recordTransaction (inventory.service.ts).
export const createTransactionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const input = req.body as CreateTransactionInput;
  const result = await recordTransaction(req.params.id as string, input, req.user.sub);
  res.status(201).json(result);
});

// GET /api/inventory/:id/transactions — full history of quantity changes for one item.
export const listItemTransactions = asyncHandler(async (req: Request, res: Response) => {
  const transactions = await listTransactionsForItem(req.params.id as string);
  res.status(200).json({ transactions });
});
