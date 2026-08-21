import { Schema, model, type Document, type Types } from 'mongoose';
import { ROLES, type Role } from './user.types';

// Represents a staff account (OWNER or CASHIER) — the only kind of "user"
// in this system. There is no student/customer account; the public menu
// requires no login at all.
export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    // Unique so no two accounts can share an email — this is also what login looks up by.
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // `select: false` means this field is excluded from query results by
    // default; it must be explicitly requested (e.g. `.select('+passwordHash')`)
    // as auth.service.ts does during login. This prevents the hash from
    // accidentally leaking into any other response.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    // Deactivated accounts (active: false) are rejected at login even with
    // a correct password — used instead of deleting an account.
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = model<UserDocument>('User', userSchema);
