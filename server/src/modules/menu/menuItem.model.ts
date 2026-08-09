import { Schema, model, type Document, type Types } from 'mongoose';

export interface MenuItemDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  variantLabel?: string;
  category: Types.ObjectId;
  active: boolean;
  available: boolean;
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

menuItemSchema.index({ category: 1, displayOrder: 1 });
menuItemSchema.index({ active: 1, available: 1 });

export const MenuItem = model<MenuItemDocument>('MenuItem', menuItemSchema);
