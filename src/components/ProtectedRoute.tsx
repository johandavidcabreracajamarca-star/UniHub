import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute({ requiredRole }: { requiredRole?: UserRole }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) return <Navigate to="/login" replace />;
  if (requiredRole && profile.role !== requiredRole) return <Navigate to="/explore" replace />;

  return <Outlet />;
}
