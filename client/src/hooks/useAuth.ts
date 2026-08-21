import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../features/auth/AuthContext';

// Convenience hook for reading the shared authentication state (current
// user, loading flag, login/logout functions) from anywhere in the app.
// Throws early if used outside of <AuthProvider> so a missing provider is
// caught immediately during development instead of silently returning
// undefined values.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
