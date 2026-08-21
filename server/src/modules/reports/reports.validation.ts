import { z } from 'zod';

// Shared shape for report date filtering: either a named preset (today,
// yesterday, last7days, week, month) or a fully custom range. The
// `.refine()` enforces that choosing "custom" also requires both `from`
// and `to` — otherwise there'd be nothing to resolve a range from.
export const reportQuerySchema = z
  .object({
    preset: z.enum(['today', 'yesterday', 'last7days', 'week', 'month', 'custom']).default('today'),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
  })
  .refine((data) => data.preset !== 'custom' || (data.from && data.to), {
    message: 'from and to are required when preset is custom',
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;

// Same as reportQuerySchema, plus a `limit` on how many top-selling items
// to return (default 10, capped at 50 to keep the response small).
export const topItemsQuerySchema = z
  .object({
    preset: z.enum(['today', 'yesterday', 'last7days', 'week', 'month', 'custom']).default('today'),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    limit: z.coerce.number().int().positive().max(50).default(10),
  })
  .refine((data) => data.preset !== 'custom' || (data.from && data.to), {
    message: 'from and to are required when preset is custom',
  });

export type TopItemsQuery = z.infer<typeof topItemsQuerySchema>;
