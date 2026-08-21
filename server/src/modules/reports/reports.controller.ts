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

// GET /api/reports/sales
// Query: { preset, from?, to? }. `preset` (e.g. "today", "last7days") is
// turned into a concrete {start, end} Date range by resolveDateRange, which
// all three report queries then share. They run concurrently via
// Promise.all since none of them depends on another's result.
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

// GET /api/reports/top-items
// Query: { preset, from?, to?, limit }. `limit` caps how many top items are
// returned (e.g. top 5 for the dashboard, top 10 by default elsewhere).
export const getTopItemsReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as TopItemsQuery;
  const range = resolveDateRange(query.preset, new Date(), { from: query.from, to: query.to });
  const items = await getTopSellingItems(range, query.limit);
  res.status(200).json({ range, items });
});

// GET /api/reports/daily-sales — used to render the sales-trend bar chart on the dashboard/reports page.
export const getDailySalesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportQuery;
  const range = resolveDateRange(query.preset, new Date(), { from: query.from, to: query.to });
  const days = await getDailySales(range);
  res.status(200).json({ range, days });
});
