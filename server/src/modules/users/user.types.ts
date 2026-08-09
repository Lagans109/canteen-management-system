export const ROLES = ['OWNER', 'CASHIER'] as const;
export type Role = (typeof ROLES)[number];

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
