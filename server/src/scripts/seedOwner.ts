import { connectDB } from '../config/db';
import { User } from '../modules/users/user.model';
import { hashPassword } from '../modules/auth/password';
import mongoose from 'mongoose';

// One-off setup script (run via `npm run seed:owner -w server`) for
// creating the very first OWNER account, since there's no public sign-up
// flow — someone has to exist before anyone can log in at all.
// Credentials are read from environment variables rather than hard-coded,
// so no password ever ends up committed to source control.
async function main(): Promise<void> {
  const name = process.env.SEED_OWNER_NAME ?? 'Owner';
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !password) {
    console.error('Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD environment variables to seed an owner.');
    process.exit(1);
  }

  await connectDB();

  // Safe to run repeatedly: if the account already exists, it's left
  // untouched rather than being recreated or having its password overwritten.
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`User with email ${email} already exists.`);
  } else {
    const passwordHash = await hashPassword(password);
    await User.create({ name, email, passwordHash, role: 'OWNER', active: true });
    console.log(`Owner account created for ${email}.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
