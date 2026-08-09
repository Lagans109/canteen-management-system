import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { resolveDateRange } from './dateRange';
import {
  getSalesSummary,
  getSalesByItem,
  getSalesByCategory,
  getDailySales,
  getTopSellingItems,
} from './reports.service';
import type { ReportQuery, TopItemsQuery } from './reports.validation';

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportQuery;
  const range = resolveDateRange(query.preset, new Date(), { from: query.from, to: query.to });
  const [summary, byItem, byCategory] = await Promise.all([
    getSalesSummary(range),
    getSalesByItem(range),
    getSalesByCategory(range),
  ]);
  res.status(200).json({ range, summary, byItem, byCategory });
});

export const getTopItemsReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as TopItemsQuery;
  const range = resolveDateRange(query.preset, new Date(), { from: query.from, to: query.to });
  const items = await getTopSellingItems(range, query.limit);
  res.status(200).json({ range, items });
});

export const getDailySalesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportQuery;
  const range = resolveDateRange(query.preset, new Date(), { from: query.from, to: query.to });
  const days = await getDailySales(range);
  res.status(200).json({ range, days });
});
