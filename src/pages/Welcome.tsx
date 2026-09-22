import { Navigate, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Users } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { Button } from '../components/Button';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

export function Welcome() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  // Mientras se verifica si ya hay una sesión guardada, mostramos la misma
  // pantalla de carga con marca (evita el parpadeo del login).
  if (loading) {
    return <LoadingScreen />;
  }

  // Si ya hay una sesión activa (Supabase la guarda automáticamente en el
  // dispositivo), saltamos directo a la app en vez de pedir iniciar sesión
  // otra vez cada vez que se abre desde la pantalla de inicio.
  if (profile) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-surface"
      style={{ backgroundImage: 'radial-gradient(700px 320px at 50% 0%, rgba(63,90,58,0.16), transparent 70%)' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandMark size={88} className="mb-5 drop-shadow-lg" />
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">UniHub</h1>
            <p className="mt-2 text-base font-medium text-ink/60">
              Conectando ideas, impulsando emprendimientos.
            </p>
          </div>

          <div className="mb-10 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 rounded-card bg-white p-3 text-center shadow-card">
              <ShieldCheck size={20} className="text-primary" />
              <span className="text-[11px] font-medium text-ink/60">Confianza</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-card bg-white p-3 text-center shadow-card">
              <Users size={20} className="text-secondary" />
              <span className="text-[11px] font-medium text-ink/60">Comunidad</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-card bg-white p-3 text-center shadow-card">
              <Sparkles size={20} className="text-accent" />
              <span className="text-[11px] font-medium text-ink/60">Emprendimiento</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" fullWidth onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
            <Button size="lg" fullWidth variant="outline" onClick={() => navigate('/register')}>
              Crear cuenta
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-ink/40">
            El marketplace de confianza de la comunidad universitaria.
            <br />
            Comenzando en Universidad EAN.
          </p>
        </div>
      </div>
    </div>
  );
}
