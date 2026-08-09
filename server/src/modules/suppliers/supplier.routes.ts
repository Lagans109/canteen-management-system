import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createSupplierSchema, updateSupplierSchema } from './supplier.validation';
import { listSuppliers, getSupplier, createSupplier, updateSupplier } from './supplier.controller';

export const supplierRouter = Router();

supplierRouter.use(requireAuth, requireRole('OWNER'));

supplierRouter.get('/', listSuppliers);
supplierRouter.get('/:id', getSupplier);
supplierRouter.post('/', validate(createSupplierSchema), createSupplier);
supplierRouter.put('/:id', validate(updateSupplierSchema), updateSupplier);
