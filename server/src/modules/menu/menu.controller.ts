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
  deleteMenuItemOrThrow,
} from './menu.service';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from './menu.validation';

// Returns only the items students should actually see (active + available,
// with category info attached). Currently not wired up in menu.routes.ts
// (see the note there) — kept here as the intended, filtered implementation.
export const getPublicMenu = asyncHandler(async (_req: Request, res: Response) => {

  const items = await listPublicMenuItems();
  res.status(200).json({ items });
});

// GET /api/menu/categories — no filtering; the admin UI needs to see
// inactive categories too so they can be re-activated.
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();
  res.status(200).json({ categories });
});

// GET /api/menu/items — returns every menu item (active or not, available
// or not) for the Menu Management admin screen, regardless of query params.
export const getAllMenuItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listAllMenuItems();
  res.status(200).json( {items} );
});

// POST /api/menu/categories — request body is the validated CreateCategoryInput.
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateCategoryInput;
  const category = await Category.create(input);
  res.status(201).json({ category });
});

// PUT /api/menu/categories/:id — partial update; findByIdAndUpdate with
// { new: true } returns the document after the update is applied.
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateCategoryInput;
  const category = await Category.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!category) throw new AppError('Category not found', 404);
  res.status(200).json({ category });
});

// DELETE /api/menu/categories/:id — the actual "can this be deleted?" rule
// (a category in use by menu items cannot be removed) lives in
// deleteCategoryOrThrow (menu.service.ts) to keep that business rule out of
// the HTTP-handling code.
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await deleteCategoryOrThrow(req.params.id as string);
  res.status(204).send();
});

// POST /api/menu/items — before creating the item, verifies the referenced
// category actually exists (assertCategoryExists), so a menu item can never
// point at a nonexistent category.
export const createMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateMenuItemInput;
  await assertCategoryExists(input.category);
  const item = await MenuItem.create(input);
  res.status(201).json({ item });
});

// PUT /api/menu/items/:id — only re-checks the category if the update
// actually includes a new `category` value (it's optional on a partial update).
export const updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateMenuItemInput;
  if (input.category) {
    await assertCategoryExists(input.category);
  }
  const item = await MenuItem.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) throw new AppError('Menu item not found', 404);
  res.status(200).json({ item });
});

// DELETE /api/menu/items/:id — hard delete, plus deactivating any linked
// InventoryItem (see deleteMenuItemOrThrow in menu.service.ts).
export const deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
  await deleteMenuItemOrThrow(req.params.id as string);
  res.status(204).send();
});
