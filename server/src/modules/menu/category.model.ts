import { Schema, model, type Document, type Types } from 'mongoose';

// Groups menu items for display (e.g. "Cold Drinks", "Biscuits"). Categories
// are referenced by MenuItem.category, and cannot be deleted while any menu
// item still points at them (see deleteCategoryOrThrow in menu.service.ts).
export interface CategoryDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    // Unique so the same category name can't be created twice.
    name: { type: String, required: true, trim: true, unique: true },
    displayOrder: { type: Number, default: 0 },
    // Deactivating a category hides it (and, via listPublicMenuItems, its
    // items) from the public menu without deleting any data.
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ displayOrder: 1 });

export const Category = model<CategoryDocument>('Category', categorySchema);
