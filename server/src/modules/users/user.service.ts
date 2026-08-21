import type { UserDocument } from './user.model';
import type { UserPublic } from './user.types';

// Converts a full Mongoose User document into the safe shape that's ever
// sent to the frontend. Notably omits `passwordHash` entirely — even though
// the schema already hides it by default, this function is the explicit,
// single place responsible for shaping what a client is allowed to see.
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
