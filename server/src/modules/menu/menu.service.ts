import { Category, type CategoryDocument } from './category.model';
import { MenuItem, type MenuItemDocument } from './menuItem.model';
import { AppError } from '../../utils/AppError';
import type { PublicMenuItem } from './menu.types';

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

export function listCategories(): Promise<CategoryDocument[]> {
  return Category.find().sort({ displayOrder: 1, name: 1 });
}

export function listAllMenuItems(): Promise<MenuItemDocument[]> {
  return MenuItem.find().populate('category').sort({ displayOrder: 1, name: 1 });
}

export async function assertCategoryExists(categoryId: string): Promise<void> {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) {
    throw new AppError('Category not found', 404);
  }
}

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
