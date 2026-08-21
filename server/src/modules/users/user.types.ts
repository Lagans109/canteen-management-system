// The only two staff roles this system supports. OWNER has full access;
// CASHIER is restricted to recording sales and viewing the dashboard
// (enforced server-side via requireRole — see middlewares/auth.ts).
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
