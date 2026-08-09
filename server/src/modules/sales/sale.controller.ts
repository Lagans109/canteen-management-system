import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { createSale, listSales, getSaleById } from './sale.service';
import type { CreateSaleInput, ListSalesQuery } from './sale.validation';
import type { AuthenticatedRequest } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';

export const createSaleHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const input = req.body as CreateSaleInput;
  const sale = await createSale(input, req.user.sub);
  res.status(201).json({ sale });
});

export const listSalesHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListSalesQuery;
  const result = await listSales(query);
  res.status(200).json(result);
});

export const getSaleHandler = asyncHandler(async (req: Request, res: Response) => {
  const sale = await getSaleById(req.params.id as string);
  res.status(200).json({ sale });
});
