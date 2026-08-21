import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { Supplier } from './supplier.model';
import type { CreateSupplierInput, UpdateSupplierInput } from './supplier.validation';

// This module has no separate *.service.ts file — supplier operations are
// simple enough CRUD that the controller queries the Supplier model
// directly, unlike menu/sales/inventory/reports which have business logic
// substantial enough to warrant a dedicated service layer.

// GET /api/suppliers — returns every supplier, alphabetically. Not
// paginated: fine for a small vendor list, but would need skip/limit +
// countDocuments (like sale.service.ts's listSales) if it grew large.
export const listSuppliers = asyncHandler(async (_req: Request, res: Response) => {
  const suppliers = await Supplier.find().sort({ name: 1 });
  res.status(200).json({ suppliers });
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new AppError('Supplier not found', 404);
  res.status(200).json({ supplier });
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateSupplierInput;
  const supplier = await Supplier.create(input);
  res.status(201).json({ supplier });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateSupplierInput;
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!supplier) throw new AppError('Supplier not found', 404);
  res.status(200).json({ supplier });
});
