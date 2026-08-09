import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { MenuItem, type MenuItemDocument } from '../modules/menu/menuItem.model';
import { InventoryItem } from '../modules/inventory/inventoryItem.model';
import { InventoryTransaction } from '../modules/inventory/inventoryTransaction.model';
import { User } from '../modules/users/user.model';

type Tier = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

const TIER_PATTERN: Tier[] = ['HIGH', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'HIGH', 'MEDIUM', 'CRITICAL', 'LOW', 'MEDIUM', 'HIGH'];

const TIER_RANGES: Record<Tier, { qty: [number, number]; reorder: [number, number] }> = {
  HIGH: { qty: [60, 120], reorder: [10, 20] },
  MEDIUM: { qty: [20, 59], reorder: [10, 15] },
  LOW: { qty: [6, 19], reorder: [15, 20] },
  CRITICAL: { qty: [1, 5], reorder: [15, 20] },
};

const DEMO_REASON = 'Demo opening stock (seed:inventory)';

/** Deterministic pseudo-random generator so repeated seed runs are reproducible. */
function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randInt(rand: () => number, [min, max]: [number, number]): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function buildInventoryName(menuItem: MenuItemDocument, duplicateNameCount: number): string {
  if (duplicateNameCount <= 1) return menuItem.name;
  if (menuItem.variantLabel) return `${menuItem.name} - ${menuItem.variantLabel}`;
  return `${menuItem.name} - ₹${menuItem.price}`;
}

async function main(): Promise<void> {
  await connectDB();

  const owner = await User.findOne({ role: 'OWNER' }).sort({ createdAt: 1 });
  if (!owner) {
    console.error('No OWNER user found. Run `npm run seed:owner -w server` first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const menuItems = await MenuItem.find().sort({ _id: 1 });
  const nameCounts = new Map<string, number>();
  for (const item of menuItems) {
    nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1);
  }

  let created = 0;
  let updated = 0;
  const tierCounts: Record<Tier, number> = { HIGH: 0, MEDIUM: 0, LOW: 0, CRITICAL: 0 };

  for (let index = 0; index < menuItems.length; index += 1) {
    const menuItem = menuItems[index];
    if (!menuItem) continue;

    const tier = TIER_PATTERN[index % TIER_PATTERN.length] ?? 'MEDIUM';
    const range = TIER_RANGES[tier];
    const rand = seededRandom(index + 1);
    const quantity = randInt(rand, range.qty);
    const minStockThreshold = randInt(rand, range.reorder);
    const name = buildInventoryName(menuItem, nameCounts.get(menuItem.name) ?? 1);

    tierCounts[tier] += 1;

    const existing = await InventoryItem.findOne({ sourceMenuItem: menuItem._id });
    if (existing) {
      existing.name = name;
      existing.unit = 'pcs';
      existing.quantity = quantity;
      existing.minStockThreshold = minStockThreshold;
      existing.active = true;
      await existing.save();
      updated += 1;
    } else {
      const inventoryItem = await InventoryItem.create({
        name,
        unit: 'pcs',
        quantity,
        minStockThreshold,
        costPrice: 0,
        active: true,
        sourceMenuItem: menuItem._id,
      });

      await InventoryTransaction.create({
        inventoryItem: inventoryItem._id,
        type: 'PURCHASE',
        quantityChange: quantity,
        quantityBefore: 0,
        quantityAfter: quantity,
        reason: DEMO_REASON,
        createdBy: owner._id,
      });

      created += 1;
    }
  }

  console.log(
    `Inventory seed complete: ${created} created, ${updated} updated. ` +
      `Distribution — HIGH: ${tierCounts.HIGH}, MEDIUM: ${tierCounts.MEDIUM}, LOW: ${tierCounts.LOW}, CRITICAL: ${tierCounts.CRITICAL}.`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
