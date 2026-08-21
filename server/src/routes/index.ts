import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { menuRouter } from '../modules/menu/menu.routes';
import { saleRouter } from '../modules/sales/sale.routes';
import { inventoryRouter } from '../modules/inventory/inventory.routes';
import { supplierRouter } from '../modules/suppliers/supplier.routes';
import { reportsRouter } from '../modules/reports/reports.routes';

// Combines every feature module's router into a single router that gets
// mounted at /api in app.ts. This is the top-level map of the whole API
// surface: /api/auth/*, /api/menu/*, /api/sales/*, /api/inventory/*,
// /api/suppliers/*, /api/reports/*.
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/sales', saleRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/reports', reportsRouter);
