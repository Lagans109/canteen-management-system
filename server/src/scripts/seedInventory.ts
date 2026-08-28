import mongoose, { Schema, type Model } from 'mongoose';
import { connectDB } from '../config/db';
import { MenuItem, type MenuItemDocument } from '../modules/menu/menuItem.model';
import { InventoryItem } from '../modules/inventory/inventoryItem.model';
import { InventoryTransaction } from '../modules/inventory/inventoryTransaction.model';
import { Sale } from '../modules/sales/sale.model';
import { User } from '../modules/users/user.model';

// Demo-data script (run via `npm run seed:inventory -w server`) that gives
// every menu item a linked InventoryItem and then replays the demo sales
// history (from `npm run seed:sales -w server`) into a day-by-day stock
// timeline: an opening purchase, a SALE-type deduction for each day that
// item actually sold, and periodic restock purchases whenever stock dips to
// the item's reorder threshold — ending at today's actual quantity instead
// of a single static "opening stock" snapshot.
//
// Safe to re-run: like seed:sales, it remembers (via the SeedState marker
// below) the last day it simulated through, and a later run only replays
// the newly-seeded sales days since then — it never touches transactions
// created through the real app (e.g. by the auto-deduction wired into
// createSale, or manual adjustments made through the Inventory screen).
// Set SEED_INVENTORY_RESET=true to wipe this script's own demo transactions
// and regenerate the whole timeline from scratch.

type Tier = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

// A repeating pattern of stock "tiers" assigned to menu items in order, so
// the generated data has a mix of well-stocked and low-stock items rather
// than everything looking identical.
const TIER_PATTERN: Tier[] = ['HIGH', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'HIGH', 'MEDIUM', 'CRITICAL', 'LOW', 'MEDIUM', 'HIGH'];

const TIER_RANGES: Record<Tier, { opening: [number, number]; restock: [number, number]; reorder: [number, number] }> = {
  HIGH: { opening: [180, 260], restock: [120, 180], reorder: [15, 25] },
  MEDIUM: { opening: [90, 150], restock: [60, 100], reorder: [15, 20] },
  LOW: { opening: [40, 70], restock: [30, 50], reorder: [12, 18] },
  CRITICAL: { opening: [15, 30], restock: [10, 20], reorder: [8, 12] },
};

const DEMO_OPEN_REASON = 'Demo opening stock (seed:inventory)';
const DEMO_SALE_REASON = 'Demo sale-driven deduction (seed:inventory)';
const DEMO_RESTOCK_REASON = 'Demo restock (seed:inventory)';
const DEMO_REASONS = [DEMO_OPEN_REASON, DEMO_SALE_REASON, DEMO_RESTOCK_REASON];

const SEED_KEY = 'demo-inventory-history';

// A tiny dedicated collection (shared in spirit with seedSales.ts's own
// copy) used only to remember "this script has simulated stock movement
// through this date already", independent of the actual business models.
const seedStateSchema = new Schema(
  { key: { type: String, required: true, unique: true }, seededAt: Date, dateTo: Date },
  { collection: 'seed_state' },
);
const SeedState: Model<Record<string, unknown>> =
  (mongoose.models.SeedState as Model<Record<string, unknown>> | undefined) ??
  mongoose.model<Record<string, unknown>>('SeedState', seedStateSchema);

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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function todayEnd(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfNextDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Menu items that share the same base name (e.g. "Kurkure" at three
// different prices) need distinct inventory item names, since
// InventoryItem.name has a unique index.
function buildInventoryName(menuItem: MenuItemDocument, duplicateNameCount: number): string {
  if (duplicateNameCount <= 1) return menuItem.name;
  if (menuItem.variantLabel) return `${menuItem.name} - ${menuItem.variantLabel}`;
  return `${menuItem.name} - ₹${menuItem.price}`;
}

interface DaySales {
  day: string; // YYYY-MM-DD
  qty: number;
  lastTime: Date;
}

interface RawTransaction {
  _id: mongoose.Types.ObjectId;
  inventoryItem: mongoose.Types.ObjectId;
  type: 'PURCHASE' | 'SALE';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
  if (menuItems.length === 0) {
    console.error('No menu items found. Run `npm run seed:menu -w server` first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const rangeEnd = todayEnd();
  const force = process.env.SEED_INVENTORY_RESET === 'true';
  const marker = await SeedState.findOne({ key: SEED_KEY });

  if (force) {
    const linkedIds = (await InventoryItem.find({ sourceMenuItem: { $ne: null } }, { _id: 1 })).map((i) => i._id);
    const deleted = await InventoryTransaction.deleteMany({
      inventoryItem: { $in: linkedIds },
      reason: { $in: DEMO_REASONS },
    });
    await InventoryItem.updateMany({ _id: { $in: linkedIds } }, { $set: { quantity: 0 } });
    await SeedState.deleteOne({ key: SEED_KEY });
    console.log(`SEED_INVENTORY_RESET=true: removed ${deleted.deletedCount} previously seeded demo transactions.`);
  }

  const earliestSale = await Sale.findOne().sort({ createdAt: 1 });
  const globalOpeningDate = (() => {
    const base = earliestSale ? new Date(earliestSale.createdAt) : new Date();
    base.setHours(7, 0, 0, 0);
    return base;
  })();

  const priorMarker = force ? null : marker;
  const rangeStart = priorMarker ? startOfNextDay(priorMarker.get('dateTo') as Date) : globalOpeningDate;

  if (priorMarker && rangeStart.getTime() > rangeEnd.getTime()) {
    console.log(
      `Demo inventory history already simulated through ${(priorMarker.get('dateTo') as Date).toISOString().slice(0, 10)}. Nothing to extend.`,
    );
    await mongoose.disconnect();
    return;
  }

  // Aggregate qty sold per (menuItem, day) across the days we need to
  // simulate, so each day's demand can be replayed as one SALE transaction
  // per item instead of one per individual sale.
  const salesByMenuItem = new Map<string, DaySales[]>();
  const salesAgg = await Sale.aggregate<{ _id: { menuItem: mongoose.Types.ObjectId; day: string }; qty: number; lastTime: Date }>([
    { $match: { createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: { menuItem: '$items.menuItem', day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
        qty: { $sum: '$items.quantity' },
        lastTime: { $max: '$createdAt' },
      },
    },
    { $sort: { '_id.day': 1 } },
  ]);
  for (const row of salesAgg) {
    const key = row._id.menuItem.toString();
    const list = salesByMenuItem.get(key) ?? [];
    list.push({ day: row._id.day, qty: row.qty, lastTime: row.lastTime });
    salesByMenuItem.set(key, list);
  }

  const nameCounts = new Map<string, number>();
  for (const item of menuItems) {
    nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1);
  }

  const transactions: RawTransaction[] = [];
  const finalQuantities: { id: mongoose.Types.ObjectId; quantity: number }[] = [];
  let created = 0;
  let updated = 0;
  const tierCounts: Record<Tier, number> = { HIGH: 0, MEDIUM: 0, LOW: 0, CRITICAL: 0 };

  for (let index = 0; index < menuItems.length; index += 1) {
    const menuItem = menuItems[index];
    if (!menuItem) continue;

    const tier = TIER_PATTERN[index % TIER_PATTERN.length] ?? 'MEDIUM';
    const range = TIER_RANGES[tier];
    // Seeding the RNG per-item (rather than sharing one global RNG) keeps
    // each item's generated numbers independent of how many items ran before it.
    const rand = seededRandom(index + 1);
    const minStockThreshold = randInt(rand, range.reorder);
    const name = buildInventoryName(menuItem, nameCounts.get(menuItem.name) ?? 1);

    tierCounts[tier] += 1;

    // Safe to re-run: an item already seeded from this menu item is
    // refreshed in place rather than duplicated (matched via sourceMenuItem).
    // Quantity is intentionally NOT reset here — it's derived below from
    // replaying the simulated transaction timeline on top of whatever it
    // already is.
    const existing = await InventoryItem.findOne({ sourceMenuItem: menuItem._id });
    let itemId: mongoose.Types.ObjectId;
    let runningQty: number;

    if (existing) {
      existing.name = name;
      existing.unit = 'pcs';
      existing.minStockThreshold = minStockThreshold;
      existing.active = true;
      await existing.save();
      itemId = existing._id;
      runningQty = existing.quantity;
      updated += 1;
    } else {
      const openingQty = randInt(rand, range.opening);
      const created_ = await InventoryItem.create({
        name,
        unit: 'pcs',
        quantity: openingQty,
        minStockThreshold,
        costPrice: 0,
        active: true,
        sourceMenuItem: menuItem._id,
      });
      itemId = created_._id;
      runningQty = openingQty;
      transactions.push({
        _id: new mongoose.Types.ObjectId(),
        inventoryItem: itemId,
        type: 'PURCHASE',
        quantityChange: openingQty,
        quantityBefore: 0,
        quantityAfter: openingQty,
        reason: DEMO_OPEN_REASON,
        createdBy: owner._id,
        createdAt: rangeStart,
        updatedAt: rangeStart,
      });
      created += 1;
    }

    const daySales = salesByMenuItem.get(menuItem._id.toString()) ?? [];
    for (const { day, qty, lastTime } of daySales) {
      const before = runningQty;
      const change = -Math.min(qty, before);
      if (change !== 0) {
        const after = round2(before + change);
        transactions.push({
          _id: new mongoose.Types.ObjectId(),
          inventoryItem: itemId,
          type: 'SALE',
          quantityChange: change,
          quantityBefore: before,
          quantityAfter: after,
          reason: DEMO_SALE_REASON,
          createdBy: owner._id,
          createdAt: lastTime,
          updatedAt: lastTime,
        });
        runningQty = after;
      }

      if (runningQty <= minStockThreshold) {
        const restockDate = new Date(`${day}T00:00:00.000`);
        restockDate.setDate(restockDate.getDate() + 1);
        restockDate.setHours(randInt(rand, [7, 9]), randInt(rand, [0, 59]), 0, 0);
        if (restockDate.getTime() <= rangeEnd.getTime()) {
          const restockQty = randInt(rand, range.restock);
          const before2 = runningQty;
          const after2 = round2(before2 + restockQty);
          transactions.push({
            _id: new mongoose.Types.ObjectId(),
            inventoryItem: itemId,
            type: 'PURCHASE',
            quantityChange: restockQty,
            quantityBefore: before2,
            quantityAfter: after2,
            reason: DEMO_RESTOCK_REASON,
            createdBy: owner._id,
            createdAt: restockDate,
            updatedAt: restockDate,
          });
          runningQty = after2;
        }
      }
    }

    finalQuantities.push({ id: itemId, quantity: runningQty });
  }

  // Bulk-insert the raw transaction log (see seedSales.ts for why: far
  // faster than one InventoryTransaction.create() per document across
  // potentially thousands of simulated days/items) and apply each item's
  // final quantity in one bulk update.
  if (transactions.length > 0) {
    await mongoose.connection.collection<RawTransaction>('inventorytransactions').insertMany(transactions);
  }
  if (finalQuantities.length > 0) {
    await InventoryItem.bulkWrite(
      finalQuantities.map(({ id, quantity }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { quantity } } },
      })),
    );
  }

  await SeedState.findOneAndUpdate(
    { key: SEED_KEY },
    { $set: { seededAt: new Date(), dateTo: rangeEnd } },
    { upsert: true },
  );

  console.log(
    `Inventory seed complete: ${created} items created, ${updated} refreshed, ${transactions.length} transactions simulated.`,
  );
  console.log(`Simulated range: ${rangeStart.toISOString()} to ${rangeEnd.toISOString()}.`);
  console.log(
    `Tier distribution — HIGH: ${tierCounts.HIGH}, MEDIUM: ${tierCounts.MEDIUM}, LOW: ${tierCounts.LOW}, CRITICAL: ${tierCounts.CRITICAL}.`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
