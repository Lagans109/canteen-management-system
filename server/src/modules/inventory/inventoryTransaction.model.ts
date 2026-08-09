import { Schema, model, type Document, type Types } from 'mongoose';

export const TRANSACTION_TYPES = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'RETURN'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

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

inventoryTransactionSchema.index({ inventoryItem: 1, createdAt: -1 });

export const InventoryTransaction = model<InventoryTransactionDocument>(
  'InventoryTransaction',
  inventoryTransactionSchema,
);
