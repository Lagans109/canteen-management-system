import { User, type UserDocument } from '../users/user.model';
import { AppError } from '../../utils/AppError';
import { comparePassword } from './password';
import { signToken } from './jwt';
import type { LoginInput } from './auth.validation';

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
