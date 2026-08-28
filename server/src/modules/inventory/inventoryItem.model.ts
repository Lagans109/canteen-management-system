import { Schema, model, type Document, type Types } from 'mongoose';

// Represents a tracked stock line (e.g. raw materials or resale goods) held
// by the canteen. Quantity is always changed through InventoryTransaction
// records (see inventory.service.ts), whether created manually (purchase,
// adjustment, waste, return) or automatically: if this item is linked to a
// menu item via `sourceMenuItem`, recording a Sale for that menu item
// auto-deducts stock here (see deductForSale in inventory.service.ts).
export interface InventoryItemDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  unit: string;
  quantity: number;
  // The stock level at/below which this item is considered "low stock" (see listLowStockItems).
  minStockThreshold: number;
  costPrice: number;
  supplier?: Types.ObjectId;
  // Optionally links this inventory item to the menu item it tracks stock
  // for. When set, recording a Sale for that menu item auto-deducts this
  // item's quantity (see deductForSale in inventory.service.ts). Also used
  // by the seed:inventory script to match generated items back to menu items.
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
