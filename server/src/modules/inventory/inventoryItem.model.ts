import { Schema, model, type Document, type Types } from 'mongoose';

// Represents a tracked stock line (e.g. raw materials or resale goods) held
// by the canteen. Quantity here is managed explicitly through
// InventoryTransaction records (see inventory.service.ts) — it is never
// automatically deducted when a Sale is created.
export interface InventoryItemDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  unit: string;
  quantity: number;
  // The stock level at/below which this item is considered "low stock" (see listLowStockItems).
  minStockThreshold: number;
  costPrice: number;
  supplier?: Types.ObjectId;
  // Optionally links this inventory item back to the menu item it was
  // generated from (used by the seed:inventory script); not otherwise
  // read/populated elsewhere in the app today.
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

export const InventoryItem = model<InventoryItemDocument>('InventoryItem', inventoryItemSchema);
