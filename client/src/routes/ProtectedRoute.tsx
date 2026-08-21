import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { LoadingState } from '../components/StateViews';

// A route guard used in App.tsx to wrap any admin page. This is a
// client-side convenience only — the real security boundary is enforced
// server-side by requireAuth/requireRole (see server/src/middlewares/auth.ts).
// This component just prevents the UI from flashing admin content before
// redirecting an unauthenticated/unauthorized visitor.
//
// Behavior:
//   - While the initial session check (AuthContext's `loading`) is still in
//     flight, shows a loading indicator instead of a flash of the wrong screen.
//   - If there's no logged-in user, redirects to the login page.
//   - If an optional `roles` list is given and the user's role isn't in it,
//     shows a permission-denied message instead of the page (used to
//     restrict Menu/Inventory/Suppliers/Reports to OWNER only).
//   - Otherwise renders the protected children.
export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking session..." />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <div className="error-state">You do not have permission to view this page.</div>;
  }

  return <>{children}</>;
}
