import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  COOKIE_NAME: z.string().default('canteen_token'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

const INSECURE_DEFAULT_JWT_SECRETS = new Set(['change-this-to-a-long-random-secret']);

function assertProductionSafety(parsed: Env): void {
  if (parsed.NODE_ENV !== 'production') return;

  const problems: string[] = [];
  if (INSECURE_DEFAULT_JWT_SECRETS.has(parsed.JWT_SECRET)) {
    problems.push('JWT_SECRET is still set to the placeholder value from .env.example');
  }
  if (parsed.CLIENT_ORIGIN === 'http://localhost:5173') {
    problems.push('CLIENT_ORIGIN is still the local development default');
  }
  if (parsed.MONGODB_URI.startsWith('mongodb://localhost')) {
    problems.push('MONGODB_URI still points at a local database');
  }

  if (problems.length > 0) {
    throw new Error(`Refusing to start in production with unsafe configuration: ${problems.join('; ')}`);
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  assertProductionSafety(parsed.data);
  return parsed.data;
}

export const env = loadEnv();
