import { Schema, model, type Document, type Types } from 'mongoose';
import { ROLES, type Role } from './user.types';

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
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = model<UserDocument>('User', userSchema);
