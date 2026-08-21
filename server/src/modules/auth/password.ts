import bcrypt from 'bcryptjs';

// Higher salt rounds make each hash slower to compute, which makes
// brute-forcing stolen hashes more expensive — 12 is a common baseline for
// this trade-off between security and login latency.
const SALT_ROUNDS = 12;

// Hashes a plaintext password before it's stored (User.passwordHash).
// Plaintext passwords are never persisted anywhere in the database.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compares a plaintext password (submitted at login) against the stored
// bcrypt hash, without ever needing to reverse/decrypt the hash.
export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
