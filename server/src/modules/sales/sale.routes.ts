import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createSaleSchema, listSalesQuerySchema } from './sale.validation';
import { createSaleHandler, listSalesHandler, getSaleHandler } from './sale.controller';

export const saleRouter = Router();

saleRouter.use(requireAuth, requireRole('OWNER', 'CASHIER'));

saleRouter.get('/', validate(listSalesQuerySchema, 'query'), listSalesHandler);
saleRouter.post('/', validate(createSaleSchema), createSaleHandler);
saleRouter.get('/:id', getSaleHandler);
