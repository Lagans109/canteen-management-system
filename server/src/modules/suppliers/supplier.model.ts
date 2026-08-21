import { Schema, model, type Document, type Types } from 'mongoose';

// Represents a vendor the canteen buys stock from. Referenced optionally by
// InventoryItem.supplier — a supplier can exist without any inventory items
// linked yet, and an inventory item doesn't have to have a supplier.
export interface SupplierDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<SupplierDocument>(
  {
    // Unique so the same vendor can't be registered twice under the same name.
    name: { type: String, required: true, trim: true, unique: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    // Lets a supplier be retired (hidden from selection) without deleting
    // it, so past inventory items can still reference it.
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

//supplierSchema.index({ name: 1 }, { unique: true });

export const Supplier = model<SupplierDocument>('Supplier', supplierSchema);
