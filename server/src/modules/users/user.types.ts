// The only two staff roles this system supports. They're purely a label —
// OWNER and CASHIER accounts have identical access to every feature; there
// is no server-side permission difference between them (see
// middlewares/auth.ts's requireAuth, the only auth gate routes use).
export const ROLES = ['OWNER', 'CASHIER'] as const;
export type Role = (typeof ROLES)[number];

// The shape of a user as exposed to the frontend/API responses —
// deliberately excludes passwordHash (see user.service.ts's toUserPublic).
export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
