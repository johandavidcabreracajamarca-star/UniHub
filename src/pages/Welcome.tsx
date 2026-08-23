import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { Button } from '../components/Button';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-card-hover">
              <ShoppingBag size={30} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">UniHub</h1>
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
