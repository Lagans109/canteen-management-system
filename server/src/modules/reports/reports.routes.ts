import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { reportQuerySchema, topItemsQuerySchema } from './reports.validation';
import { getSalesReport, getTopItemsReport, getDailySalesReport } from './reports.controller';

export const reportsRouter = Router();

// Reports are OWNER-only.
reportsRouter.use(requireAuth, requireRole('OWNER'));

// GET /api/reports/sales — totals, sales-by-item, and sales-by-category for a date range.
reportsRouter.get('/sales', validate(reportQuerySchema, 'query'), getSalesReport);

// GET /api/reports/top-items — the best-selling items (by quantity) for a date range.
reportsRouter.get('/top-items', validate(topItemsQuerySchema, 'query'), getTopItemsReport);

// GET /api/reports/daily-sales — totals broken down by calendar day, used for trend charts.
reportsRouter.get('/daily-sales', validate(reportQuerySchema, 'query'), getDailySalesReport);
