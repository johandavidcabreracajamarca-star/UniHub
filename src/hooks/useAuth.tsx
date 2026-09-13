import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Profile } from '../types';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const current = await authService.getCurrentProfile();
    setProfile(current);
    setLoading(false);
  };

  useEffect(() => {
    // Solo en la carga inicial (la del splash) forzamos un mínimo de tiempo
    // visible, para que el logo se alcance a notar aunque la app cargue muy
    // rápido. Los refresh() posteriores (login, logout, etc.) no la usan,
    // para que esas acciones se sigan sintiendo instantáneas.
    const MIN_SPLASH_MS = 500;
    const start = Date.now();

    (async () => {
      const current = await authService.getCurrentProfile();
      const remaining = MIN_SPLASH_MS - (Date.now() - start);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setProfile(current);
      setLoading(false);
    })();

    if (isSupabaseConfigured && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(() => {
        refresh();
      });
      return () => listener.subscription.unsubscribe();
    }

    // En modo demo, escuchamos cambios de localStorage entre pestañas
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const logout = async () => {
    await authService.logout();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
