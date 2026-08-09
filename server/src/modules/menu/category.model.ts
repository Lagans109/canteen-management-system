import { Schema, model, type Document, type Types } from 'mongoose';

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
    name: { type: String, required: true, trim: true, unique: true },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ displayOrder: 1 });

export const Category = model<CategoryDocument>('Category', categorySchema);
