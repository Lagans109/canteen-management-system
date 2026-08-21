import { z } from 'zod';
import { objectIdSchema } from '../menu/menu.validation';

// Validates a new sale request: a non-empty array of {menuItem, quantity}
// pairs. Prices are never accepted from the client — they're always looked
// up server-side (see createSale in sale.service.ts) so a request can't
// manipulate totals by sending a fake price.
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

// Validates the GET /api/sales query string. `page`/`limit` use
// `z.coerce.number()` because query string values always arrive as text
// (e.g. "2"), so this converts them to actual numbers with sane defaults
// (page 1, limit 20) and an upper bound on limit (100) to prevent a client
// from requesting an unreasonably large page.
export const listSalesQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
