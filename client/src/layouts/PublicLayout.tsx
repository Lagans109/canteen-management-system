import { Outlet } from 'react-router';

export function PublicLayout() {
  return (
    <div className="public-page">
      <Outlet />
    </div>
  );
}
