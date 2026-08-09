import { z } from 'zod';

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
