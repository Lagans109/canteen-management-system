import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
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

inventoryRouter.use(requireAuth, requireRole('OWNER'));

inventoryRouter.get('/', listInventoryItems);
inventoryRouter.get('/low-stock', getLowStockItems);
inventoryRouter.post('/', validate(createInventoryItemSchema), createInventoryItem);
inventoryRouter.put('/:id', validate(updateInventoryItemSchema), updateInventoryItem);
inventoryRouter.get('/:id/transactions', listItemTransactions);
inventoryRouter.post('/:id/transactions', validate(createTransactionSchema), createTransactionHandler);
