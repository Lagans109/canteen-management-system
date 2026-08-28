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
              {/* OWNER and CASHIER have identical access to every admin
                  page — the outer ProtectedRoute above already covers
                  "must be logged in"; no per-route role restriction. */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
