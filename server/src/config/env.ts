import 'dotenv/config';
import { z } from 'zod';

// Defines every environment variable the server needs, with types and
// sensible defaults. Validating this once at startup means the rest of the
// codebase can trust `env.X` is present and correctly typed, instead of
// checking `process.env.X` for undefined everywhere it's used.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // Connection string for the MongoDB database (see server/.env.example for the variable name only).
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  // Secret key used to sign/verify JWTs — must be long enough to resist guessing.
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  // How long an issued JWT (and its cookie) stays valid, e.g. "1d".
  JWT_EXPIRES_IN: z.string().default('1d'),
  // Name of the cookie that stores the JWT.
  COOKIE_NAME: z.string().default('canteen_token'),
  // Cookie SameSite policy — 'lax' works when frontend and API share a site;
  // 'none' is needed only for cross-origin deployments (requires HTTPS).
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  // The frontend's origin — used to configure CORS so only this origin can call the API with credentials.
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

const INSECURE_DEFAULT_JWT_SECRETS = new Set(['change-this-to-a-long-random-secret']);

// Extra guardrail beyond basic schema validation: refuses to boot in
// production if the config still looks like the local-development example
// values (placeholder secret, localhost DB/origin). This prevents an
// accidental production deploy with insecure defaults.
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

// Reads and validates environment variables. Accepts a source map (defaults
// to `process.env`) so tests can pass in a custom set of variables.
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  assertProductionSafety(parsed.data);
  return parsed.data;
}

// Loaded once at module import time — every other file imports this
// singleton instead of calling loadEnv() again.
export const env = loadEnv();
