import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 md:max-w-3xl md:mx-auto">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-control text-ink/60 hover:bg-ink/5"
          aria-label="Volver a perfil"
        >
          <ArrowLeft size={19} />
        </button>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
          <ShieldCheck size={20} className="text-primary" />
          Panel de administración
        </h1>
      </div>

      <Outlet />
    </div>
  );
}
