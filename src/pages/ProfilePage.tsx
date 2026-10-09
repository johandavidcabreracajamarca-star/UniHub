import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Shield,
  Rocket,
  Heart,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useMyBusiness } from '../hooks/useMyBusiness';
import { orderService } from '../services/orderService';
import { favoriteService } from '../services/favoriteService';

export function ProfilePage() {
  const { profile, logout } = useAuth();
  const { business, loading: loadingBusiness } = useMyBusiness();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<{ orders: number; favorites: number } | null>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    Promise.all([orderService.listByBuyer(profile.id), favoriteService.listFavoriteIds(profile.id)])
      .then(([orders, favorites]) => {
        if (active) setStats({ orders: orders.length, favorites: favorites.size });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [profile]);

  if (!profile) return null;

  const joined = new Date(profile.created_at);
  const memberSince = `${new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(joined).replace('.', '')} ${joined.getFullYear()}`;

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

      <div className="relative overflow-hidden rounded-card-lg bg-primary p-5 text-white shadow-card-hover">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/[0.07]" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface font-serif text-2xl font-semibold text-primary">
            {profile.full_name[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-serif text-xl font-semibold truncate">{profile.full_name}</p>
            <p className="truncate text-xs text-white/70">{profile.email}</p>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
              {isAdmin ? 'Administrador' : hasBusiness ? 'Emprendedor' : 'Estudiante'}
            </span>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/15 rounded-2xl bg-white/10 py-3 text-center">
          <Stat value={stats ? String(stats.orders) : '–'} label="Pedidos" />
          <Stat value={stats ? String(stats.favorites) : '–'} label="Favoritos" />
          <Stat value={memberSince} label="Miembro desde" />
        </div>
      </div>

      {!loadingBusiness && (hasBusiness || isAdmin) && (
        <>
          <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
            Cuenta
          </p>
          <div className="flex flex-col rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
            <MenuRow
              icon={<LayoutDashboard size={17} />}
              label="Panel del emprendedor"
              onClick={() => navigate('/dashboard')}
            />
          </div>
        </>
      )}

      {!loadingBusiness && !hasBusiness && !isAdmin && (
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 flex w-full items-center gap-3 rounded-card-lg bg-accent-light p-4 text-left shadow-card transition-opacity hover:opacity-90"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-ink"
          >
            <Rocket size={18} />
          </span>
          <span className="text-sm font-semibold text-ink">
            Crea tu negocio y empieza a vender
          </span>
        </button>
      )}

      <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
        Favoritos y ajustes
      </p>
      <div className="flex flex-col divide-y divide-ink/6 rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
        <MenuRow icon={<Heart size={17} />} label="Favoritos" onClick={() => navigate('/favorites')} />
        <MenuRow icon={<Settings size={17} />} label="Ajustes" onClick={() => navigate('/settings')} />
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
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-card-lg border border-ink/8 bg-white p-4 text-sm font-semibold text-red-600 shadow-card transition-colors hover:bg-accent-light disabled:opacity-60"
      >
        <LogOut size={16} />
        {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <p className="whitespace-nowrap text-base font-bold">{value}</p>
      <p className="text-[11px] text-white/70">{label}</p>
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
