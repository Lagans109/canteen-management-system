import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Supplier } from '../modules/suppliers/supplier.model';

// Demo/reference supplier data (run via `npm run seed:suppliers -w server`).
// These are real, publicly-listed businesses used only as realistic sample
// data — the disclaimer below is stored on each record to make clear no
// actual business relationship with the canteen is implied.
const DEMO_DISCLAIMER =
  'Publicly listed business used for demo/reference supplier data. Relationship with canteen is fictional.';

interface SeedSupplier {
  name: string;
  address: string;
  type: string;
  relevantProducts: string;
  phone?: string;
  gst?: string;
}

const SEED_SUPPLIERS: SeedSupplier[] = [
  {
    name: 'Pepsico',
    address: 'Matsya Industrial Area, Alwar, Desoola, Rajasthan 301030, India',
    type: 'Beverage distributor',
    relevantProducts: 'Pepsi / beverage products',
    phone: '0522 430 2858',
  },
  {
    name: 'Varun Beverage Ltd warehouse',
    address: 'Matsya Industrial Area, Goondpur, Alwar, Rajasthan 301030, India',
    type: 'Beverage/grocery distribution',
    relevantProducts: 'Cold drinks / beverages',
  },
  {
    name: 'Raj Trading Company Wholesale store',
    address: 'Church Road, Kedalganj, Sector 7, Alwar, Rajasthan 301001, India',
    type: 'FMCG goods wholesaler',
    relevantProducts: 'General FMCG / snacks / biscuits / confectionery',
  },
  {
    name: 'Happy Trading Company',
    address: '135, 160 Feet Road, near Goyal Hospital, Jyoti Nagar, Alwar, Rajasthan 301001, India',
    type: 'Confectionery wholesaler',
    relevantProducts: 'Chocolates / confectionery / snacks',
  },
  {
    name: 'Hovis Foods India Pvt Ltd.',
    address: 'F-184B, M.I.A., Alwar, Rajasthan 301030, India',
    type: 'Food products supplier',
    relevantProducts: 'Food products',
    phone: '+91 92140 16501',
  },
  {
    name: 'Khandelwal Namkeens And Snacks Pvt. Ltd.',
    address: 'Matsya Industrial Area, Desoola, Rajasthan 301030, India',
    type: 'Snack/food manufacturer',
    relevantProducts: 'Namkeen / snacks',
    phone: '+91 93522 04349',
  },
  {
    name: 'Jayanti Food Products',
    address: 'Rajgarh-Alwar Road, Dadar, Palkhari, Rajasthan 301001, India',
    type: 'Food manufacturer',
    relevantProducts: 'Food products / snacks',
    phone: '+91 91160 39090',
  },
  {
    name: 'JP Soya Beverage',
    address: 'Near Bus Stand, Thanagazi, Sariska, Alwar, Rajasthan 301022, India',
    type: 'Trader / retailer / wholesaler',
    relevantProducts: 'Beverage / food products',
    gst: '08AGWPJ1808P1ZN',
  },
];

function buildNotes(seed: SeedSupplier): string {
  const parts = [`Type: ${seed.type}.`, `Relevant products: ${seed.relevantProducts}.`];
  if (seed.gst) parts.push(`GST: ${seed.gst}.`);
  parts.push(DEMO_DISCLAIMER);
  return parts.join(' ');
}

async function main(): Promise<void> {
  await connectDB();

  let created = 0;
  let updated = 0;

  for (const seed of SEED_SUPPLIERS) {
    const update: Record<string, unknown> = {
      name: seed.name,
      address: seed.address,
      notes: buildNotes(seed),
      active: true,
    };
    if (seed.phone) update.phone = seed.phone;

    // `upsert: true` makes this safe to re-run — existing suppliers (matched
    // by name) are refreshed in place instead of duplicated.
    const existing = await Supplier.exists({ name: seed.name });
    await Supplier.findOneAndUpdate({ name: seed.name }, { $set: update }, { upsert: true, setDefaultsOnInsert: true });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  console.log(`Supplier seed complete: ${created} created, ${updated} updated (${SEED_SUPPLIERS.length} total demo suppliers).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
