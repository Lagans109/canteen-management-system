import { Schema, model, type Document, type Types } from 'mongoose';

export interface SaleLineItem {
  menuItem: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface SaleDocument extends Document {
  _id: Types.ObjectId;
  items: SaleLineItem[];
  totalAmount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const saleLineItemSchema = new Schema<SaleLineItem>(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema<SaleDocument>(
  {
    items: { type: [saleLineItemSchema], required: true, validate: (v: SaleLineItem[]) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'items.menuItem': 1 });

export const Sale = model<SaleDocument>('Sale', saleSchema);
