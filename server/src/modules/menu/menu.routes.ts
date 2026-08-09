import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from './menu.validation';
import {
  getPublicMenu,
  getCategories,
  getAllMenuItems,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from './menu.controller';

export const menuRouter = Router();

menuRouter.get('/', getPublicMenu);
menuRouter.get('/categories', getCategories);

menuRouter.get('/items', requireAuth, getAllMenuItems);
menuRouter.post(
  '/items',
  requireAuth,
  requireRole('OWNER'),
  validate(createMenuItemSchema),
  createMenuItem,
);
menuRouter.put(
  '/items/:id',
  requireAuth,
  requireRole('OWNER'),
  validate(updateMenuItemSchema),
  updateMenuItem,
);
menuRouter.delete('/items/:id', requireAuth, requireRole('OWNER'), deleteMenuItem);

menuRouter.post(
  '/categories',
  requireAuth,
  requireRole('OWNER'),
  validate(createCategorySchema),
  createCategory,
);
menuRouter.put(
  '/categories/:id',
  requireAuth,
  requireRole('OWNER'),
  validate(updateCategorySchema),
  updateCategory,
);
menuRouter.delete('/categories/:id', requireAuth, requireRole('OWNER'), deleteCategory);
