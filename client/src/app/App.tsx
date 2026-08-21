import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '../features/auth/AuthContext';
import { ToastProvider } from '../components/Toast';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { PublicMenuPage } from '../features/menu/PublicMenuPage';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { SalesPage } from '../features/sales/SalesPage';
import { MenuManagementPage } from '../features/menu/MenuManagementPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { SuppliersPage } from '../features/suppliers/SuppliersPage';
import { ReportsPage } from '../features/reports/ReportsPage';

// The top-level route map for the whole app, using React Router v7
// (imported from the `react-router` package). AuthProvider/ToastProvider
// wrap every route so authentication state and toast notifications are
// available anywhere in the tree via useAuth()/useToast().
export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public, unauthenticated routes — the student-facing menu. Both
                paths render the same page. */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PublicMenuPage />} />
              <Route path="/menu" element={<PublicMenuPage />} />
            </Route>

            {/* Login page is intentionally outside ProtectedRoute — it must be reachable while logged out. */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Everything under /admin requires a logged-in session (any
                role). ProtectedRoute redirects to /admin/login otherwise. */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard and Sales are usable by both OWNER and CASHIER. */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="sales" element={<SalesPage />} />

              {/* Menu/Inventory/Suppliers/Reports are OWNER-only — each gets
                  its own nested ProtectedRoute with an explicit `roles` list,
                  on top of the outer (login-only) ProtectedRoute above. */}
              <Route
                path="menu"
                element={
                  <ProtectedRoute roles={['OWNER']}>
                    <MenuManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventory"
                element={
                  <ProtectedRoute roles={['OWNER']}>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="suppliers"
                element={
                  <ProtectedRoute roles={['OWNER']}>
                    <SuppliersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute roles={['OWNER']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
