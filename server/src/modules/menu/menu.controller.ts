import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { Category } from './category.model';
import { MenuItem } from './menuItem.model';
import {
  listPublicMenuItems,
  listCategories,
  listAllMenuItems,
  assertCategoryExists,
  deleteCategoryOrThrow,
} from './menu.service';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from './menu.validation';

export const getPublicMenu = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listPublicMenuItems();
  res.status(200).json({ items });
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();
  res.status(200).json({ categories });
});

export const getAllMenuItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listAllMenuItems();
  res.status(200).json({ items });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateCategoryInput;
  const category = await Category.create(input);
  res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateCategoryInput;
  const category = await Category.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!category) throw new AppError('Category not found', 404);
  res.status(200).json({ category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await deleteCategoryOrThrow(req.params.id as string);
  res.status(204).send();
});

export const createMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateMenuItemInput;
  await assertCategoryExists(input.category);
  const item = await MenuItem.create(input);
  res.status(201).json({ item });
});

export const updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateMenuItemInput;
  if (input.category) {
    await assertCategoryExists(input.category);
  }
  const item = await MenuItem.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) throw new AppError('Menu item not found', 404);
  res.status(200).json({ item });
});

export const deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await MenuItem.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError('Menu item not found', 404);
  res.status(204).send();
});
