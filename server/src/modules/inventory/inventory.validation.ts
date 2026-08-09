import { z } from 'zod';
import { objectIdSchema } from '../menu/menu.validation';
import { TRANSACTION_TYPES } from './inventoryTransaction.model';

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(20),
  quantity: z.number().nonnegative().default(0),
  minStockThreshold: z.number().nonnegative().default(0),
  costPrice: z.number().nonnegative().default(0),
  supplier: objectIdSchema.optional(),
  active: z.boolean().default(true),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  quantityChange: z.number().refine((v) => v !== 0, 'quantityChange cannot be zero'),
  reason: z.string().trim().max(300).optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
