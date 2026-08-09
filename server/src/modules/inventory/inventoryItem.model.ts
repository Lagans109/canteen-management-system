import { Schema, model, type Document, type Types } from 'mongoose';

export interface InventoryItemDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  unit: string;
  quantity: number;
  minStockThreshold: number;
  costPrice: number;
  supplier?: Types.ObjectId;
  sourceMenuItem?: Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<InventoryItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minStockThreshold: { type: Number, required: true, min: 0, default: 0 },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    sourceMenuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

inventoryItemSchema.index({ name: 1 }, { unique: true });
inventoryItemSchema.index({ sourceMenuItem: 1 });

export const InventoryItem = model<InventoryItemDocument>('InventoryItem', inventoryItemSchema);
