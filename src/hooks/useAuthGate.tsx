import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from './useAuth';
import { rememberRedirect } from '../utils/redirect';

// ============================================================================
// EXPLORAR SIN CUENTA
// ============================================================================
// Cualquiera puede ver productos y emprendimientos sin registrarse (así los
// links compartidos por WhatsApp se abren directo). Solo al intentar comprar,
// escribir por el chat o guardar un favorito se pide crear cuenta, con una
// hoja que explica por qué. Al entrar o registrarse, vuelve a la misma página.
// ============================================================================

interface AuthGateValue {
  /** true si hay sesión; si no, muestra la invitación a crear cuenta y devuelve false. */
  requireAuth: (action: string) => boolean;
}

const AuthGateContext = createContext<AuthGateValue | undefined>(undefined);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [action, setAction] = useState<string | null>(null);

  const requireAuth = useCallback(
    (nextAction: string) => {
      if (profile) return true;
      setAction(nextAction);
      return false;
    },
    [profile]
  );

  const go = (path: '/login' | '/register') => {
    rememberRedirect(location.pathname + location.search);
    setAction(null);
    navigate(path);
  };

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      {action && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 backdrop-blur-sm md:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setAction(null)}
        >
          <div
            className="w-full max-w-md animate-fade-up rounded-t-[32px] bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 text-center shadow-card-hover md:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            <BrandMark size={56} className="mx-auto" />
            <h2 className="mt-4 font-serif text-2xl font-semibold leading-tight text-ink">Crea tu cuenta para {action}</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
              Es gratis y solo necesitas tu correo institucional. Así todos en UniHub son de tu comunidad.
            </p>
            <button
              onClick={() => go('/register')}
              className="mt-6 h-12 w-full rounded-control bg-primary text-base font-semibold text-white transition-transform active:scale-[0.98]"
            >
              Crear cuenta gratis
            </button>
            <button
              onClick={() => go('/login')}
              className="mt-2.5 h-12 w-full rounded-control border border-ink/12 bg-white text-base font-semibold text-ink transition-transform active:scale-[0.98]"
            >
              Ya tengo cuenta
            </button>
            <button onClick={() => setAction(null)} className="mt-2 h-11 w-full text-sm font-medium text-ink/50">
              Seguir explorando
            </button>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate debe usarse dentro de AuthGateProvider');
  return ctx;
}
