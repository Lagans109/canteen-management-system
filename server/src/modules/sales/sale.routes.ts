import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createSaleSchema, listSalesQuerySchema } from './sale.validation';
import { createSaleHandler, listSalesHandler, getSaleHandler } from './sale.controller';

export const saleRouter = Router();

// Both OWNER and CASHIER can record and view sales — this is the everyday
// point-of-sale workflow, not an owner-only management feature.
saleRouter.use(requireAuth, requireRole('OWNER', 'CASHIER'));

// GET /api/sales — list sale records. Query params (page, limit, from, to)
// are validated/coerced by listSalesQuerySchema before reaching the
// controller, e.g. turning the query string "2" into the number 2.
saleRouter.get('/', validate(listSalesQuerySchema, 'query'), listSalesHandler);

// POST /api/sales — records a new sale for the items a cashier/owner picked
// at the counter.
saleRouter.post('/', validate(createSaleSchema), createSaleHandler);

// GET /api/sales/:id — a single sale's full detail.
saleRouter.get('/:id', getSaleHandler);
