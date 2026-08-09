import { z } from 'zod';
import { objectIdSchema } from '../menu/menu.validation';

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        menuItem: objectIdSchema,
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'At least one item is required'),
});

export const listSalesQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
