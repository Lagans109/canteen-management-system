import { z } from 'zod';
import { objectIdSchema } from '../menu/menu.validation';
import { TRANSACTION_TYPES } from './inventoryTransaction.model';

// Validates a new inventory item. `unit` is a free-text label (kg, pcs,
// ltr...) rather than an enum, since a canteen may stock very varied goods.
export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(20),
  quantity: z.number().nonnegative().default(0),
  minStockThreshold: z.number().nonnegative().default(0),
  costPrice: z.number().nonnegative().default(0),
  supplier: objectIdSchema.optional(),
  active: z.boolean().default(true),
});

// `quantity` is deliberately excluded here (unlike createInventoryItemSchema)
// — stock quantity only ever changes through a recorded InventoryTransaction
// (see createTransactionSchema/recordTransaction), never a plain field edit,
// so every change to it stays in the audit trail.
export const updateInventoryItemSchema = createInventoryItemSchema.omit({ quantity: true }).partial();

// Validates a stock transaction request. `quantityChange` can be positive
// or negative (its sign/meaning depends on `type`, decided by the
// frontend), but zero is rejected since a "no-op" transaction wouldn't
// make sense as an audit record.
export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  quantityChange: z.number().refine((v) => v !== 0, 'quantityChange cannot be zero'),
  reason: z.string().trim().max(300).optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
