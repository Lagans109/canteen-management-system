import { Schema, model, type Document, type Types } from 'mongoose';

// A single line within a sale — deliberately stores a *copy* of the menu
// item's name and price at the time of sale (not just a reference), so
// historical sales stay accurate even if the menu item is later renamed,
// repriced, or deleted.
export interface SaleLineItem {
  menuItem: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

// Represents one recorded transaction at the counter. Intentionally simple:
// no customer name/phone/table, no order status, no receipt number — this
// is a sales *record* for reporting/accounting, not an order-management system.
export interface SaleDocument extends Document {
  _id: Types.ObjectId;
  items: SaleLineItem[];
  totalAmount: number;
  // Which staff member recorded this sale.
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// `_id: false` — line items are embedded sub-documents, not separate
// records, so they don't need their own MongoDB-generated id.
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
    // A sale must have at least one line item — an empty sale doesn't make sense.
    items: { type: [saleLineItemSchema], required: true, validate: (v: SaleLineItem[]) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Speeds up listing sales by most-recent-first (the common case), and
// looking up which sales included a particular menu item (used by the
// reports module's aggregation pipelines).
saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'items.menuItem': 1 });

export const Sale = model<SaleDocument>('Sale', saleSchema);
