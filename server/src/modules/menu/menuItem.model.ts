import { Schema, model, type Document, type Types } from 'mongoose';

// Represents one item sold at the canteen (e.g. "Sprite - 1 L"). This is the
// source of truth for name/price/availability — when a sale is recorded,
// its price is copied ("snapshotted") into the Sale document rather than
// referenced live, so changing a price here never rewrites past sales.
export interface MenuItemDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  // Distinguishes otherwise-identical items sold in different sizes, e.g. "250 ml" vs "1 L".
  variantLabel?: string;
  category: Types.ObjectId;
  // Whether the item exists on the menu at all (soft delete / hide entirely).
  active: boolean;
  // Whether the item is currently in stock / sellable; toggled on/off more
  // frequently than `active` (e.g. day to day as stock runs out).
  available: boolean;
  // Controls sort order within a category on the public/admin menu.
  displayOrder: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<MenuItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    variantLabel: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    active: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    imageUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

// Speeds up the common query patterns: listing items within a category in
// display order, and filtering the public menu by active+available.
menuItemSchema.index({ category: 1, displayOrder: 1 });
menuItemSchema.index({ active: 1, available: 1 });

export const MenuItem = model<MenuItemDocument>('MenuItem', menuItemSchema);
