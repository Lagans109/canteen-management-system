import mongoose, { Schema, type Model } from 'mongoose';
import { connectDB } from '../config/db';
import { Category } from '../modules/menu/category.model';
import { MenuItem } from '../modules/menu/menuItem.model';
import { User } from '../modules/users/user.model';
import { Sale } from '../modules/sales/sale.model';
import { calculateLineItems, round2, type MenuItemSnapshot } from '../modules/sales/sale.service';

// Generates several months of realistic-looking demo sales history (run
// via `npm run seed:sales -w server`), so Reports/Dashboard charts have
// enough data to be meaningful instead of showing empty/flat graphs.
// Inserted directly via the raw MongoDB collection (see `salesCollection`
// below) rather than one-by-one through Sale.create(), since generating
// months of data one Mongoose document at a time would be far slower.

interface RawSaleLineItem {
  menuItem: mongoose.Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface RawSaleDoc {
  _id: mongoose.Types.ObjectId;
  items: RawSaleLineItem[];
  totalAmount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SEEDED_CATEGORY_NAMES = ['Chocolates', 'Cold Drinks', 'Biscuits', 'Chips & Snacks', 'Bakery Items'];

const HISTORY_START = new Date('2026-02-09T00:00:00.000');
const HISTORY_END = new Date('2026-08-09T23:59:59.999');

// Identifies this specific seed run (by its date range) so re-running the
// script doesn't keep appending duplicate history — see the SeedState
// model and the "already seeded" check in main() below.
const SEED_KEY = `demo-sales_${HISTORY_START.toISOString().slice(0, 10)}_${HISTORY_END.toISOString().slice(0, 10)}`;

/** Month multipliers (0 = January) reflecting the requested seasonal pattern. */
const MONTH_MULTIPLIER: Record<number, number> = {
  1: 0.85, // February - moderate
  2: 0.95, // March - moderate/high
  3: 1.1, // April - high
  4: 1.15, // May - high
  5: 0.85, // June - moderate
  6: 1.1, // July - high
  7: 0.95, // August - partial month
};

// Sales aren't spread evenly through the day — this models a lunchtime
// rush and lighter morning/evening traffic when picking a random sale time.
const TIME_BUCKETS: { startHour: number; endHour: number; weight: number }[] = [
  { startHour: 8, endHour: 10, weight: 0.15 }, // morning
  { startHour: 11, endHour: 14, weight: 0.45 }, // lunch
  { startHour: 14, endHour: 17, weight: 0.25 }, // afternoon
  { startHour: 17, endHour: 19, weight: 0.15 }, // evening
];

// A tiny dedicated collection used only to remember "this date range has
// already been seeded", independent of the actual Sale/business models.
const seedStateSchema = new Schema(
  { key: { type: String, required: true, unique: true }, seededAt: Date, count: Number, dateFrom: Date, dateTo: Date },
  { collection: 'seed_state' },
);
const SeedState: Model<Record<string, unknown>> =
  (mongoose.models.SeedState as Model<Record<string, unknown>> | undefined) ??
  mongoose.model<Record<string, unknown>>('SeedState', seedStateSchema);

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Picks one entry from a weighted list — higher `weight` values are
// proportionally more likely to be chosen. Used throughout this script to
// bias random choices (e.g. cheaper items sell more often, lunch hour has
// more sales) instead of picking uniformly at random.
function pickWeighted<T>(entries: { value: T; weight: number }[]): T {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1]!.value;
}

// Cheaper items and certain categories (bakery, biscuits) are weighted to
// sell more often, approximating real canteen buying patterns.
function itemWeight(price: number, categoryName: string): number {
  let weight = price <= 10 ? 6 : price <= 20 ? 4 : price <= 30 ? 3 : 1.5;
  if (categoryName === 'Bakery Items') weight *= 1.5;
  if (categoryName === 'Biscuits') weight *= 1.3;
  if (categoryName === 'Cold Drinks') weight *= 1.15;
  if (categoryName === 'Chocolates') weight *= 1.1;
  return weight;
}

// Decides how many sales happen on a given day: weekends are quieter on
// average (with an occasional busy event day), and each month's overall
// level is scaled by MONTH_MULTIPLIER.
function dailySalesCount(date: Date, monthMultiplier: number): number {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const roll = Math.random();
  let base: number;

  if (isWeekend) {
    base = roll < 0.15 ? randInt(35, 45) : randInt(5, 15);
  } else if (roll < 0.12) {
    base = randInt(35, 50);
  } else if (roll < 0.22) {
    base = randInt(5, 10);
  } else {
    base = randInt(15, 35);
  }

  return Math.max(1, Math.round(base * monthMultiplier));
}

function randomSaleTime(date: Date): Date {
  const bucket = pickWeighted(TIME_BUCKETS.map((b) => ({ value: b, weight: b.weight })));
  const hour = randInt(bucket.startHour, bucket.endHour - 1);
  const minute = randInt(0, 59);
  const second = randInt(0, 59);
  const result = new Date(date);
  result.setHours(hour, minute, second, 0);
  return result;
}

interface WeightedItem {
  snapshot: MenuItemSnapshot;
  weight: number;
}

// Picks `count` distinct items from the weighted pool for one sale (so the
// same item never appears twice as separate lines in a single sale),
// removing each chosen item from the remaining pool before the next pick.
function pickDistinctItems(pool: WeightedItem[], count: number): MenuItemSnapshot[] {
  const chosen: MenuItemSnapshot[] = [];
  const remaining = [...pool];
  const target = Math.min(count, remaining.length);

  for (let i = 0; i < target; i += 1) {
    const picked = pickWeighted(remaining.map((w) => ({ value: w, weight: w.weight })));
    chosen.push(picked.snapshot);
    const index = remaining.indexOf(picked);
    remaining.splice(index, 1);
  }

  return chosen;
}

async function main(): Promise<void> {
  await connectDB();

  // Guards against accidentally generating duplicate history if the script
  // is run more than once for the same date range. Set SEED_SALES_RESET=true
  // to intentionally wipe and regenerate it.
  const force = process.env.SEED_SALES_RESET === 'true';
  const existingMarker = await SeedState.findOne({ key: SEED_KEY });

  if (existingMarker && !force) {
    console.log(
      `Demo sales already seeded for ${HISTORY_START.toISOString().slice(0, 10)} to ${HISTORY_END.toISOString().slice(0, 10)} ` +
        `(${existingMarker.get('count')} sales). Skipping. Set SEED_SALES_RESET=true to regenerate.`,
    );
    await mongoose.disconnect();
    return;
  }

  if (existingMarker && force) {
    const deleted = await Sale.deleteMany({ createdAt: { $gte: HISTORY_START, $lte: HISTORY_END } });
    await SeedState.deleteOne({ key: SEED_KEY });
    console.log(`SEED_SALES_RESET=true: removed ${deleted.deletedCount} previously seeded demo sales.`);
  }

  const categories = await Category.find({ name: { $in: SEEDED_CATEGORY_NAMES } });
  const categoryNameById = new Map(categories.map((c) => [c._id.toString(), c.name]));
  const menuItems = await MenuItem.find({ category: { $in: categories.map((c) => c._id) }, active: true });

  if (menuItems.length === 0) {
    console.error('No seeded menu items found. Run `npm run seed:menu -w server` first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const users = await User.find({ active: true });
  if (users.length === 0) {
    console.error('No active users found. Run `npm run seed:owner -w server` first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Builds the same {id, name, price} catalog shape that the real
  // createSale() flow uses, so generated sales are priced with the exact
  // same calculateLineItems()/round2() logic as a real sale.
  const catalog = new Map<string, MenuItemSnapshot>();
  const weightedPool: WeightedItem[] = [];
  for (const item of menuItems) {
    const snapshot: MenuItemSnapshot = { id: item._id.toString(), name: item.name, price: item.price };
    catalog.set(snapshot.id, snapshot);
    const categoryName = categoryNameById.get(item.category.toString()) ?? '';
    weightedPool.push({ snapshot, weight: itemWeight(item.price, categoryName) });
  }

  // Most sales are for 1-2 items with quantity 1 — occasional larger baskets.
  const itemCountDistribution = [
    { value: 1, weight: 0.35 },
    { value: 2, weight: 0.35 },
    { value: 3, weight: 0.2 },
    { value: 4, weight: 0.1 },
  ];
  const quantityDistribution = [
    { value: 1, weight: 0.65 },
    { value: 2, weight: 0.25 },
    { value: 3, weight: 0.1 },
  ];

  // Inserts are buffered and flushed in batches rather than one insert per
  // sale, since this script can generate tens of thousands of documents
  // across ~6 months of history.
  const BATCH_SIZE = 2000;
  const salesCollection = mongoose.connection.collection<RawSaleDoc>('sales');
  let batch: RawSaleDoc[] = [];
  let totalInserted = 0;
  let totalAmount = 0;
  const monthlyTotals = new Map<string, { count: number; amount: number }>();
  const itemTotals = new Map<string, number>();

  const flush = async () => {
    if (batch.length === 0) return;
    await salesCollection.insertMany(batch);
    totalInserted += batch.length;
    batch = [];
  };

  // Walks one calendar day at a time across the whole history window,
  // generating a random number of sales (with random items/times) for each day.
  for (
    let day = new Date(HISTORY_START);
    day.getTime() <= HISTORY_END.getTime();
    day.setDate(day.getDate() + 1)
  ) {
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
    const multiplier = MONTH_MULTIPLIER[day.getMonth()] ?? 1;
    const salesToday = dailySalesCount(day, multiplier);

    for (let i = 0; i < salesToday; i += 1) {
      const itemCount = pickWeighted(itemCountDistribution);
      const chosenItems = pickDistinctItems(weightedPool, itemCount);
      const requested = chosenItems.map((item) => ({
        menuItem: item.id,
        quantity: pickWeighted(quantityDistribution),
      }));

      const { lines, totalAmount: saleTotal } = calculateLineItems(requested, catalog);
      const createdAt = randomSaleTime(day);
      const createdBy = users[randInt(0, users.length - 1)]!;

      batch.push({
        _id: new mongoose.Types.ObjectId(),
        items: lines.map((line) => ({
          menuItem: new mongoose.Types.ObjectId(line.menuItem),
          name: line.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
        totalAmount: saleTotal,
        createdBy: createdBy._id,
        createdAt,
        updatedAt: createdAt,
      });

      totalAmount = round2(totalAmount + saleTotal);
      const month = monthlyTotals.get(monthKey) ?? { count: 0, amount: 0 };
      month.count += 1;
      month.amount = round2(month.amount + saleTotal);
      monthlyTotals.set(monthKey, month);

      for (const line of lines) {
        itemTotals.set(line.name, (itemTotals.get(line.name) ?? 0) + line.quantity);
      }

      if (batch.length >= BATCH_SIZE) {
        await flush();
      }
    }
  }

  await flush();

  // Records that this date range has now been seeded, so a second run
  // without SEED_SALES_RESET=true will skip instead of duplicating data.
  await SeedState.create({
    key: SEED_KEY,
    seededAt: new Date(),
    count: totalInserted,
    dateFrom: HISTORY_START,
    dateTo: HISTORY_END,
  });

  const topItems = Array.from(itemTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log(`Demo sales seed complete: ${totalInserted} sales inserted.`);
  console.log(`Date range: ${HISTORY_START.toISOString()} to ${HISTORY_END.toISOString()}`);
  console.log(`Total demo sales amount: ₹${totalAmount.toFixed(2)}`);
  console.log(`Average sale value: ₹${(totalAmount / totalInserted).toFixed(2)}`);
  console.log('Monthly breakdown:');
  for (const [month, data] of Array.from(monthlyTotals.entries()).sort()) {
    console.log(`  ${month}: ${data.count} sales, ₹${data.amount.toFixed(2)}`);
  }
  console.log('Top 5 items by quantity sold:');
  for (const [name, qty] of topItems) {
    console.log(`  ${name}: ${qty}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
