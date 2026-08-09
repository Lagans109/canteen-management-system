import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  displayOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

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
