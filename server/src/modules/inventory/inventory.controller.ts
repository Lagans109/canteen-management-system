import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { InventoryItem } from './inventoryItem.model';
import { recordTransaction, listTransactionsForItem, listLowStockItems } from './inventory.service';
import type { CreateInventoryItemInput, UpdateInventoryItemInput, CreateTransactionInput } from './inventory.validation';
import type { AuthenticatedRequest } from '../../middlewares/auth';

export const listInventoryItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await InventoryItem.find().sort({ name: 1 }).populate('supplier', 'name');
  res.status(200).json({ items });
});

export const getLowStockItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listLowStockItems();
  res.status(200).json({ items });
});

export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateInventoryItemInput;
  const item = await InventoryItem.create(input);
  res.status(201).json({ item });
});

export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateInventoryItemInput;
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) throw new AppError('Inventory item not found', 404);
  res.status(200).json({ item });
});

export const createTransactionHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const input = req.body as CreateTransactionInput;
  const result = await recordTransaction(req.params.id as string, input, req.user.sub);
  res.status(201).json(result);
});

export const listItemTransactions = asyncHandler(async (req: Request, res: Response) => {
  const transactions = await listTransactionsForItem(req.params.id as string);
  res.status(200).json({ transactions });
});
