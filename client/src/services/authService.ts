import { apiRequest } from '../lib/apiClient';
import type { User } from '../types';

// Thin wrappers around the auth endpoints — AuthContext calls these rather
// than using apiClient directly, keeping the raw endpoint paths/methods in
// one place per feature.

// POST /api/auth/login — sends credentials, backend sets the auth cookie
// and returns the logged-in user's public profile.
export function login(email: string, password: string): Promise<{ user: User }> {
  return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
}

// POST /api/auth/logout — clears the auth cookie server-side.
export function logout(): Promise<{ message: string }> {
  return apiRequest('/auth/logout', { method: 'POST' });
}

// GET /api/auth/me — used on app load to check whether the auth cookie
// (if any) still represents a valid session.
export function getCurrentUser(): Promise<{ user: User }> {
  return apiRequest('/auth/me');
}
