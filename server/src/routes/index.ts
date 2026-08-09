import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { menuRouter } from '../modules/menu/menu.routes';
import { saleRouter } from '../modules/sales/sale.routes';
import { inventoryRouter } from '../modules/inventory/inventory.routes';
import { supplierRouter } from '../modules/suppliers/supplier.routes';
import { reportsRouter } from '../modules/reports/reports.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/sales', saleRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/reports', reportsRouter);
