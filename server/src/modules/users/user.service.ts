import type { UserDocument } from './user.model';
import type { UserPublic } from './user.types';

export function toUserPublic(user: UserDocument): UserPublic {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
