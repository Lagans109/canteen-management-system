import { Outlet } from 'react-router';

// Minimal wrapper for the public, unauthenticated pages (the student menu).
// Unlike AdminLayout, there's no navigation/auth-aware UI here since public
// visitors never log in.
export function PublicLayout() {
  return (
    <div className="public-page">
      <Outlet />
    </div>
  );
}
