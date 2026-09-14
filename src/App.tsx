import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Welcome } from './pages/Welcome';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Explore } from './pages/Explore';
import { SearchPage } from './pages/SearchPage';
import { ProductDetail } from './pages/ProductDetail';
import { BusinessProfile } from './pages/BusinessProfile';
import { Orders } from './pages/Orders';
import { ProfilePage } from './pages/ProfilePage';

import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { DashboardProducts } from './pages/dashboard/DashboardProducts';
import { DashboardOrders } from './pages/dashboard/DashboardOrders';
import { ProductForm } from './pages/dashboard/ProductForm';

import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminBusinesses } from './pages/admin/AdminBusinesses';
import { AdminBusinessDetail } from './pages/admin/AdminBusinessDetail';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Autenticado */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/explore" element={<Explore />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/business/:id" element={<BusinessProfile />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Autenticado + rol emprendedor */}
                        <Route element={<ProtectedRoute requiredRole={['emprendedor', 'admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="products" element={<DashboardProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="orders" element={<DashboardOrders />} />
                </Route>
              </Route>
            </Route>

            {/* Autenticado + rol admin */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminBusinesses />} />
                  <Route path="business/:id" element={<AdminBusinessDetail />} />
                  <Route path="business/:businessId/products/new" element={<ProductForm />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
