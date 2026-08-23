import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ requiredRole }: { requiredRole?: UserRole }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;
  if (requiredRole && profile.role !== requiredRole) return <Navigate to="/explore" replace />;

  return <Outlet />;
}
