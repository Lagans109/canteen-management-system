import { z } from 'zod';

// Shared by every module that accepts a MongoDB ObjectId in a request
// (e.g. a `category` or `supplier` reference) — a 24-character hex string.
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Validates category creation input. `displayOrder` controls the order
// categories appear in on the menu; `active` lets a category be hidden
// from the public menu without deleting it.
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  displayOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

// `.partial()` makes every field optional, since an update may only change one field.
export const updateCategorySchema = createCategorySchema.partial();

// Validates menu item creation input. `active` controls whether the item
// exists on the menu at all; `available` is for temporary out-of-stock
// items that should stay visible in the admin UI but disappear from the
// public menu (see listPublicMenuItems in menu.service.ts).
export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  price: z.number().nonnegative(),
  variantLabel: z.string().trim().max(30).optional(),
  category: objectIdSchema,
  active: z.boolean().default(true),
  available: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  imageUrl: z.string().trim().url().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
