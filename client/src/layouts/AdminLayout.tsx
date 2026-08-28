import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import {
  IconBowl,
  IconDashboard,
  IconInventory,
  IconLogout,
  IconMenu,
  IconReports,
  IconSales,
  IconSuppliers,
} from '../components/Icons';
import type { ComponentType, SVGProps } from 'react';

// The sidebar navigation for the admin area. OWNER and CASHIER accounts see
// the exact same set of links — there's no role-based restriction in this system.
const NAV_ITEMS: { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/admin/sales', label: 'Sales', icon: IconSales },
  { to: '/admin/menu', label: 'Menu', icon: IconMenu },
  { to: '/admin/inventory', label: 'Inventory', icon: IconInventory },
  { to: '/admin/suppliers', label: 'Suppliers', icon: IconSuppliers },
  { to: '/admin/reports', label: 'Reports', icon: IconReports },
];

// Shell layout rendered for every /admin/* route (see App.tsx): a sidebar
// with navigation + a topbar showing the logged-in user, wrapping whatever
// page is rendered via <Outlet /> (React Router's placeholder for the
// matched child route).
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div className="admin-shell">
      <nav className="admin-sidebar" aria-label="Admin navigation">
        <div className="brand">
          <span className="brand-icon">
            <IconBowl style={{ color: '#fff' }} />
          </span>
          Canteen Admin
        </div>
        <div>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="admin-main">
        <header className="admin-topbar">
          <span className="user-chip">
            <span className="avatar">{initials}</span>
            <span>
              {user?.name}
              <span className="badge badge-muted" style={{ marginLeft: 8 }}>
                {user?.role}
              </span>
            </span>
          </span>
          <button className="btn btn-sm" onClick={handleLogout}>
            <IconLogout style={{ width: 15, height: 15 }} />
            Logout
          </button>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
