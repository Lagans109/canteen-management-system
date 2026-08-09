import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { LoadingState } from '../components/StateViews';

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
