import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute({ requiredRole }: { requiredRole?: UserRole | UserRole[] }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(profile.role)
      : profile.role === requiredRole;
    if (!allowed) return <Navigate to="/explore" replace />;
  }

  return <Outlet />;
}
