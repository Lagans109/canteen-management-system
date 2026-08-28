import { Category, type CategoryDocument } from './category.model';
import { MenuItem, type MenuItemDocument } from './menuItem.model';
import { InventoryItem } from '../inventory/inventoryItem.model';
import { AppError } from '../../utils/AppError';
import type { PublicMenuItem } from './menu.types';

// Builds the list of items meant for the public, unauthenticated menu page.
// Filters out items that are `active: false` (removed from the menu
// entirely) or `available: false` (temporarily out of stock), and also
// drops items whose category itself has been deactivated — a category can
// be turned off without having to touch every item inside it.
// `.lean()` returns plain JS objects instead of Mongoose documents, which is
// faster since this data is read-only and going straight into a JSON response.
export async function listPublicMenuItems(): Promise<PublicMenuItem[]> {
  const items = await MenuItem.find({ active: true, available: true })
    .populate<{ category: CategoryDocument }>('category')
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return items
    .filter((item) => item.category && (item.category as unknown as CategoryDocument).active)
    .map((item) => {
      const category = item.category as unknown as CategoryDocument;
      const publicItem: PublicMenuItem = {
        id: item._id.toString(),
        name: item.name,
        price: item.price,
        category: { id: category._id.toString(), name: category.name },
      };
      if (item.description) publicItem.description = item.description;
      if (item.variantLabel) publicItem.variantLabel = item.variantLabel;
      if (item.imageUrl) publicItem.imageUrl = item.imageUrl;
      return publicItem;
    });
}
// All categories, active or not — used by the admin screen, which needs to
// show and let owners re-enable inactive categories.
export function listCategories(): Promise<CategoryDocument[]> {
  return Category.find().sort({ displayOrder: 1, name: 1 });
}

// All menu items, active or not, with their category populated — used by
// the admin Menu Management screen. Unlike listPublicMenuItems, nothing is filtered out here.
export function listAllMenuItems(): Promise<MenuItemDocument[]> {
  return MenuItem.find().populate('category').sort({ displayOrder: 1, name: 1 });
}

// Guards menu item create/update against referencing a category id that
// doesn't exist in the database (e.g. a stale id from the client).
export async function assertCategoryExists(categoryId: string): Promise<void> {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) {
    throw new AppError('Category not found', 404);
  }
}

// Business rule: a category cannot be deleted while any menu item still
// references it — otherwise those items would be left pointing at a
// nonexistent category. The owner must first move/delete those items.
export async function deleteCategoryOrThrow(categoryId: string): Promise<void> {
  const inUse = await MenuItem.exists({ category: categoryId });
  if (inUse) {
    throw new AppError('Cannot delete a category that has menu items', 400);
  }
  const deleted = await Category.findByIdAndDelete(categoryId);
  if (!deleted) {
    throw new AppError('Category not found', 404);
  }
}

// Hard-deletes a menu item. Sales keep a name/price snapshot independent of
// this document, so historical sales are unaffected (see sale.model.ts).
// Any InventoryItem still linked to it via sourceMenuItem is deactivated
// rather than left pointing at a now-nonexistent menu item — its quantity
// and transaction history stay intact for the audit trail, it's just no
// longer tracked as an active stock line (and deductForSale/low-stock
// already ignore inactive items).
export async function deleteMenuItemOrThrow(menuItemId: string): Promise<void> {
  const deleted = await MenuItem.findByIdAndDelete(menuItemId);
  if (!deleted) {
    throw new AppError('Menu item not found', 404);
  }
  await InventoryItem.updateMany({ sourceMenuItem: menuItemId }, { $set: { active: false } });
}
