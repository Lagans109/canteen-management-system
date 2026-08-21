import { Schema, model, type Document, type Types } from 'mongoose';

// The kinds of stock movement this system recognizes. The frontend decides
// what sign to send for `quantityChange` based on this type (e.g. WASTE and
// SALE reduce stock, PURCHASE and RETURN increase it, ADJUSTMENT can go
// either way as a manual correction).
export const TRANSACTION_TYPES = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'RETURN'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// An immutable audit record of one stock change — never edited or deleted
// after creation, so the full history of an item's quantity is always
// reconstructable. `quantityBefore`/`quantityAfter` are stored (not just
// derived) so this record stays accurate even if it's read out of order.
export interface InventoryTransactionDocument extends Document {
  _id: Types.ObjectId;
  inventoryItem: Types.ObjectId;
  type: TransactionType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryTransactionSchema = new Schema<InventoryTransactionDocument>(
  {
    inventoryItem: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    quantityChange: { type: Number, required: true },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    reason: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Speeds up fetching one item's history in most-recent-first order (used by listTransactionsForItem).
inventoryTransactionSchema.index({ inventoryItem: 1, createdAt: -1 });

export const InventoryTransaction = model<InventoryTransactionDocument>(
  'InventoryTransaction',
  inventoryTransactionSchema,
);
