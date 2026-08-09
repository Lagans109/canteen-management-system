import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { Supplier } from './supplier.model';
import type { CreateSupplierInput, UpdateSupplierInput } from './supplier.validation';

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
