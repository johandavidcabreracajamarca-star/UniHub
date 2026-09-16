import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Shield,
  Rocket,
  UserCog,
  Heart,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useMyBusiness } from '../hooks/useMyBusiness';

export function ProfilePage() {
  const { profile, logout } = useAuth();
  const { business, loading: loadingBusiness } = useMyBusiness();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';
  const hasBusiness = Boolean(business);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  return (
    <div className="px-4 pt-4 pb-8 md:px-6 md:pt-6 md:max-w-lg md:mx-auto">
      <h1 className="mb-5 font-serif text-2xl font-semibold text-ink">Perfil</h1>

      <div className="flex items-center gap-4 rounded-card-lg border border-ink/8 bg-white p-5 shadow-card">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary-light text-2xl font-bold text-secondary">
          {profile.full_name[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold text-ink truncate">{profile.full_name}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary-dark capitalize">
            {profile.role}
          </span>
        </div>
      </div>

      <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
        Cuenta
      </p>
      <div className="flex flex-col divide-y divide-ink/6 rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
        {!loadingBusiness && (hasBusiness || isAdmin) && (
          <MenuRow
            icon={<LayoutDashboard size={17} />}
            label="Panel del emprendedor"
            onClick={() => navigate('/dashboard')}
          />
        )}

        {!loadingBusiness && !hasBusiness && !isAdmin && (
          <button
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center gap-3 p-4 text-left transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F0D2C0' }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: '#B1502B' }}
            >
              <Rocket size={18} />
            </span>
            <span className="text-sm font-semibold" style={{ color: '#712B13' }}>
              Crea tu negocio y empieza a vender
            </span>
          </button>
        )}

        <MenuRow icon={<UserCog size={17} />} label="Editar perfil" comingSoon />
      </div>

      <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
        Favoritos y ajustes
      </p>
      <div className="flex flex-col divide-y divide-ink/6 rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
        <MenuRow icon={<Heart size={17} />} label="Favoritos" onClick={() => navigate('/favorites')} />
        <MenuRow icon={<Settings size={17} />} label="Ajustes" comingSoon />
      </div>

      {isAdmin && (
        <>
          <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
            Administración
          </p>
          <div className="flex flex-col rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
            <MenuRow
              icon={<Shield size={17} />}
              label="Panel de administración"
              onClick={() => navigate('/admin')}
            />
          </div>
        </>
      )}

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-card-lg border border-ink/8 bg-white p-4 text-sm font-semibold text-accent shadow-card transition-colors hover:bg-accent-light disabled:opacity-60"
      >
        <LogOut size={16} />
        {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  comingSoon,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={comingSoon}
      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-ink/5 disabled:hover:bg-transparent"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface text-ink/50">
          {icon}
        </span>
        {label}
      </span>
      {comingSoon ? (
        <span className="text-[11px] font-medium text-ink/30">Próximamente</span>
      ) : (
        <ChevronRight size={16} className="text-ink/30" />
      )}
    </button>
  );
}
