import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/StateViews';

// A route guard used in App.tsx to wrap any admin page. This is a
// client-side convenience only — the real security boundary is enforced
// server-side by requireAuth (see server/src/middlewares/auth.ts).
// This component just prevents the UI from flashing admin content before
// redirecting an unauthenticated visitor.
//
// Behavior:
//   - While the initial session check (AuthContext's `loading`) is still in
//     flight, shows a loading indicator instead of a flash of the wrong screen.
//   - If there's no logged-in user, redirects to the login page.
//   - Otherwise renders the protected children. OWNER and CASHIER accounts
//     have identical access, so there's no role-based restriction here.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking session..." />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
