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

// ----------------------------------------------------------------------------
// Expiración por inactividad (~1 semana)
// ----------------------------------------------------------------------------
// Supabase mantiene la sesión viva indefinidamente por defecto (el token se
// refresca solo mientras la app está abierta). Eso es justo lo que NO
// queríamos: Yohan pidió que, si alguien no abre la app en ~1 semana, se le
// vuelva a pedir usuario/contraseña la próxima vez, así el token de fondo
// siga siendo técnicamente válido.
//
// Guardamos la fecha de la última vez que la app estuvo activa en
// localStorage (funciona igual en modo demo, sin depender de Supabase).
// Al montar la app comparamos contra esa fecha ANTES de refrescarla: si pasó
// más de una semana, cerramos la sesión nosotros mismos.
// ----------------------------------------------------------------------------
const LAST_ACTIVE_KEY = 'unihub_last_active';
const INACTIVITY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000; // ~1 semana

function touchActivity() {
  localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}

function isInactiveTooLong(): boolean {
  const raw = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!raw) return false; // primera vez que se registra en este navegador: no forzamos nada
  const lastActive = Number(raw);
  if (Number.isNaN(lastActive)) return false;
  return Date.now() - lastActive > INACTIVITY_LIMIT_MS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const current = await authService.getCurrentProfile();
    if (current) touchActivity();
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
      let current = await authService.getCurrentProfile();

      if (current && isInactiveTooLong()) {
        await authService.logout();
        current = null;
      }
      touchActivity();

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

  useEffect(() => {
    // Refresca la marca de actividad cada vez que se vuelve a esta pestaña
    // (por ejemplo, al reabrir la PWA desde segundo plano sin que la página
    // se recargue del todo), para que la ventana de 1 semana se cuente desde
    // el último uso real, no solo desde la última carga completa.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        touchActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
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
