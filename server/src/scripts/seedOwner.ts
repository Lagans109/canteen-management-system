import { connectDB } from '../config/db';
import { User } from '../modules/users/user.model';
import { hashPassword } from '../modules/auth/password';
import mongoose from 'mongoose';

async function main(): Promise<void> {
  const name = process.env.SEED_OWNER_NAME ?? 'Owner';
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !password) {
    console.error('Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD environment variables to seed an owner.');
    process.exit(1);
  }

  await connectDB();

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
