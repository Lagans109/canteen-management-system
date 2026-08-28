import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
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

// Menu management is open to any logged-in staff account (OWNER or
// CASHIER) — both have identical access in this system.
menuRouter.get('/items', requireAuth, getAllMenuItems);
menuRouter.post('/items', requireAuth, validate(createMenuItemSchema), createMenuItem);
menuRouter.put('/items/:id', requireAuth, validate(updateMenuItemSchema), updateMenuItem);
menuRouter.delete('/items/:id', requireAuth, deleteMenuItem);

menuRouter.post('/categories', requireAuth, validate(createCategorySchema), createCategory);
menuRouter.put('/categories/:id', requireAuth, validate(updateCategorySchema), updateCategory);
menuRouter.delete('/categories/:id', requireAuth, deleteCategory);
