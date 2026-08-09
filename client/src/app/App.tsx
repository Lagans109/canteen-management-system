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

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PublicMenuPage />} />
              <Route path="/menu" element={<PublicMenuPage />} />
            </Route>

            <Route path="/admin/login" element={<LoginPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="sales" element={<SalesPage />} />
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
