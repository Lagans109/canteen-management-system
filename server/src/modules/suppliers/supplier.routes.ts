import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createSupplierSchema, updateSupplierSchema } from './supplier.validation';
import { listSuppliers, getSupplier, createSupplier, updateSupplier } from './supplier.controller';

export const supplierRouter = Router();

// Supplier management is OWNER-only.
supplierRouter.use(requireAuth, requireRole('OWNER'));

// GET /api/suppliers — full list, unfiltered and not paginated (see note in supplier.controller.ts).
supplierRouter.get('/', listSuppliers);
supplierRouter.get('/:id', getSupplier);
supplierRouter.post('/', validate(createSupplierSchema), createSupplier);
supplierRouter.put('/:id', validate(updateSupplierSchema), updateSupplier);
