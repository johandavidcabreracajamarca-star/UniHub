import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { rememberRedirect } from '../utils/redirect';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute({ requiredRole }: { requiredRole?: UserRole | UserRole[] }) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    // Guardamos a dónde iba (p. ej. un producto compartido) para llevarlo ahí después de entrar
    rememberRedirect(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(profile.role)
      : profile.role === requiredRole;
    if (!allowed) return <Navigate to="/explore" replace />;
  }

  return <Outlet />;
}
