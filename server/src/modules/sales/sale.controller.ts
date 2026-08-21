import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { createSale, listSales, getSaleById } from './sale.service';
import type { CreateSaleInput, ListSalesQuery } from './sale.validation';
import type { AuthenticatedRequest } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';

// POST /api/sales
// Body: { items: [{ menuItem, quantity }, ...] }.
// `req.user.sub` (set by requireAuth) becomes the sale's `createdBy`, so
// every sale is attributable to the staff member who recorded it.
export const createSaleHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const input = req.body as CreateSaleInput;
  const sale = await createSale(input, req.user.sub);
  res.status(201).json({ sale });
});

// GET /api/sales
// Query params (already validated/coerced to numbers): from, to, page, limit.
// Forwards them straight to the service layer, which performs the actual
// filtering and pagination against MongoDB, and returns { sales, total, page, limit }.
export const listSalesHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListSalesQuery;
  const result = await listSales(query);
  res.status(200).json(result);
});

// GET /api/sales/:id — fetches one sale's full detail by id.
export const getSaleHandler = asyncHandler(async (req: Request, res: Response) => {
  const sale = await getSaleById(req.params.id as string);
  res.status(200).json({ sale });
});
