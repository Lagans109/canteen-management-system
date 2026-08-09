import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Category } from '../modules/menu/category.model';
import { MenuItem } from '../modules/menu/menuItem.model';

interface SeedItem {
  name: string;
  price: number;
  variantLabel?: string;
}

interface SeedCategory {
  name: string;
  items: SeedItem[];
}

const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: 'Chocolates',
    items: [
      { name: 'Crispello', price: 40 },
      { name: 'Dairy Milk', price: 10 },
      { name: 'Dairy Milk', price: 20 },
      { name: '5 Star', price: 10 },
      { name: '5 Star', price: 20 },
      { name: 'KitKat', price: 10 },
      { name: 'KitKat', price: 20 },
      { name: 'Hunks', price: 5 },
      { name: 'Snickers', price: 5 },
    ],
  },
  {
    name: 'Cold Drinks',
    items: [
      { name: 'Sprite', price: 50, variantLabel: '1 L' },
      { name: 'Mountain Dew', price: 50, variantLabel: '1.25 L' },
      { name: 'Pepsi', price: 20, variantLabel: '400 ml' },
      { name: 'Fizz', price: 20, variantLabel: '250 ml' },
      { name: 'Sprite', price: 20, variantLabel: '250 ml' },
      { name: 'Mountain Dew', price: 20, variantLabel: '400 ml' },
      { name: 'Orange Drink', price: 10, variantLabel: '160 ml' },
      { name: 'Banta', price: 10, variantLabel: '160 ml' },
      { name: 'Cola', price: 10, variantLabel: '160 ml' },
      { name: 'Campa', price: 20, variantLabel: '250 ml' },
      { name: 'Cola', price: 50, variantLabel: '1 L' },
    ],
  },
  {
    name: 'Biscuits',
    items: [
      { name: 'Oreo', price: 10 },
      { name: 'Chocolate Biscuit', price: 5 },
      { name: 'Crunchy Biscuit', price: 5 },
      { name: '20-20 Britannia Biscuit', price: 5 },
    ],
  },
  {
    name: 'Chips & Snacks',
    items: [
      { name: 'Uncle Chips', price: 5 },
      { name: 'Uncle Chips', price: 10 },
      { name: 'Tedhe Medhe', price: 5 },
      { name: 'Tedhe Medhe', price: 10 },
      { name: 'Soya Stix', price: 10 },
      { name: 'Kurkure', price: 5 },
      { name: 'Kurkure', price: 10 },
      { name: 'Kurkure', price: 30 },
      { name: 'Mad Angle', price: 5 },
      { name: 'Mad Angle', price: 10 },
      { name: '2 Yum', price: 5 },
      { name: '2 Yum', price: 40 },
      { name: '2 Yum', price: 50 },
      { name: 'Noodles', price: 5 },
      { name: 'Katori', price: 10 },
      { name: 'Pulse Shot', price: 5 },
    ],
  },
  {
    name: 'Bakery Items',
    items: [
      { name: 'Normal Patties', price: 20 },
      { name: 'Masala Patties', price: 30 },
    ],
  },
];

async function main(): Promise<void> {
  await connectDB();

  let categoriesUpserted = 0;
  let itemsUpserted = 0;

  for (let categoryIndex = 0; categoryIndex < SEED_CATEGORIES.length; categoryIndex += 1) {
    const seedCategory = SEED_CATEGORIES[categoryIndex];
    if (!seedCategory) continue;

    const category = await Category.findOneAndUpdate(
      { name: seedCategory.name },
      { $set: { displayOrder: categoryIndex, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoriesUpserted += 1;

    for (let itemIndex = 0; itemIndex < seedCategory.items.length; itemIndex += 1) {
      const seedItem = seedCategory.items[itemIndex];
      if (!seedItem) continue;

      const filter: Record<string, unknown> = {
        name: seedItem.name,
        category: category._id,
        price: seedItem.price,
      };
      filter.variantLabel = seedItem.variantLabel ? seedItem.variantLabel : { $exists: false };

      const update: Record<string, unknown> = {
        name: seedItem.name,
        price: seedItem.price,
        category: category._id,
        displayOrder: itemIndex,
        active: true,
        available: true,
      };
      if (seedItem.variantLabel) {
        update.variantLabel = seedItem.variantLabel;
      }

      await MenuItem.findOneAndUpdate(filter, { $set: update }, { upsert: true, setDefaultsOnInsert: true });
      itemsUpserted += 1;
    }
  }

  console.log(`Seed complete: ${categoriesUpserted} categories, ${itemsUpserted} menu items upserted.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
