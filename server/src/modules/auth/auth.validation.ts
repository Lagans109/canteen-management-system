import { z } from 'zod';

// Validates the login request body. Rejects requests with a missing/invalid
// email or an empty password before they ever reach the auth service —
// normalizing the email (trim + lowercase) here also means lookups against
// the stored (lowercase) email always match regardless of how the user typed it.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
