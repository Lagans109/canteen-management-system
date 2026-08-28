import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createInventoryItemSchema, updateInventoryItemSchema, createTransactionSchema } from './inventory.validation';
import {
  listInventoryItems,
  getLowStockItems,
  createInventoryItem,
  updateInventoryItem,
  createTransactionHandler,
  listItemTransactions,
} from './inventory.controller';


export const inventoryRouter = Router();

// Inventory management is open to any logged-in staff account (OWNER or
// CASHIER) — both have identical access in this system.
inventoryRouter.use(requireAuth);

// GET /api/inventory
// Returns a paginated list of inventory items.
// Supports ?page=1&limit=10 query parameters.
inventoryRouter.get ('/', listInventoryItems);

// GET /api/inventory/low-stock — items at or below their reorder threshold,
// used by the dashboard's "Low Stock Items" panel.
inventoryRouter.get('/low-stock', getLowStockItems);

inventoryRouter.post('/', validate(createInventoryItemSchema), createInventoryItem);
inventoryRouter.put('/:id', validate(updateInventoryItemSchema), updateInventoryItem);

// GET /api/inventory/:id/transactions — the full stock-change history for one item.
inventoryRouter.get('/:id/transactions', listItemTransactions);

// POST /api/inventory/:id/transactions — records a stock change (purchase,
// sale-related adjustment, waste, correction, or return). This is how
// quantity actually changes — it is never auto-adjusted elsewhere.
inventoryRouter.post('/:id/transactions', validate(createTransactionSchema), createTransactionHandler);
