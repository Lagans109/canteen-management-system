import { apiRequest } from '../lib/apiClient';
import type { User } from '../types';

export function login(email: string, password: string): Promise<{ user: User }> {
  return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
}

export function logout(): Promise<{ message: string }> {
  return apiRequest('/auth/logout', { method: 'POST' });
}

export function getCurrentUser(): Promise<{ user: User }> {
  return apiRequest('/auth/me');
}
