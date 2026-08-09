import { Schema, model, type Document, type Types } from 'mongoose';

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
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

supplierSchema.index({ name: 1 }, { unique: true });

export const Supplier = model<SupplierDocument>('Supplier', supplierSchema);
