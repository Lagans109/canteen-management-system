import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { reportQuerySchema, topItemsQuerySchema } from './reports.validation';
import { getSalesReport, getTopItemsReport, getDailySalesReport } from './reports.controller';

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireRole('OWNER'));

reportsRouter.get('/sales', validate(reportQuerySchema, 'query'), getSalesReport);
reportsRouter.get('/top-items', validate(topItemsQuerySchema, 'query'), getTopItemsReport);
reportsRouter.get('/daily-sales', validate(reportQuerySchema, 'query'), getDailySalesReport);
