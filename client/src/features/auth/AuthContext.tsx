import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../../types';
import * as authService from '../../services/authService';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// React Context that makes the current auth state (and login/logout
// actions) available anywhere in the component tree without prop-drilling
// — consumed via the useAuth() hook.
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Holds the logged-in user's public profile (or null if not logged in).
  // Changing this value is what causes ProtectedRoute/AdminLayout to
  // re-render with the correct authenticated/unauthenticated UI.
  const [user, setUser] = useState<User | null>(null);
  // True only during the initial session check below; used so
  // ProtectedRoute can show a "Checking session..." state instead of
  // redirecting to /login before we actually know if the user is logged in.
  const [loading, setLoading] = useState(true);

  // Runs once when the app first mounts. Calls GET /auth/me — since the
  // JWT lives in an httpOnly cookie the browser sends automatically, this
  // silently restores the session after a page reload without requiring
  // the user to log in again. If it fails (no cookie, or an expired one),
  // `user` simply stays null.
  useEffect(() => {
    authService
      .getCurrentUser()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Flow: LoginPage calls this -> authService.login() -> apiClient POST
  // /auth/login -> backend verifies credentials and sets the auth cookie
  // -> the returned user profile is stored in state, which lets
  // ProtectedRoute/AdminLayout immediately treat the user as logged in.
  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Memoized so consumers of this context don't see a new object identity
  // (and re-render unnecessarily) unless one of these values actually changed.
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
