import { User, type UserDocument } from '../users/user.model';
import { AppError } from '../../utils/AppError';
import { comparePassword } from './password';
import { signToken } from './jwt';
import type { LoginInput } from './auth.validation';

// Core login business logic, kept separate from the controller so the
// HTTP-specific concerns (reading the request, setting cookies) don't mix
// with the actual authentication rules.
//
// Steps:
//   1. Look up the user by email (passwordHash is normally excluded from
//      queries by the schema's `select: false`, so it must be explicitly
//      requested here to compare it).
//   2. Reject if the account doesn't exist or has been deactivated —
//      using the same generic error message as a wrong password, so a
//      caller can't use this endpoint to discover which emails are registered.
//   3. Verify the submitted password against the stored bcrypt hash.
//   4. Issue a signed JWT containing the user's id and role.
export async function login(input: LoginInput): Promise<{ token: string; user: UserDocument }> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !user.active) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ sub: user._id.toString(), role: user.role });
  return { token, user };
}
