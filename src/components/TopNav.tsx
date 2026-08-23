import { NavLink, useNavigate } from 'react-router-dom';
import { Compass, Search, Receipt, User, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const items = [
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/search', label: 'Buscar', icon: Search },
  { to: '/orders', label: 'Pedidos', icon: Receipt },
];

export function TopNav() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <header className="hidden md:block sticky top-0 z-40 border-b border-ink/8 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-desktop items-center justify-between px-6 py-3.5">
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center gap-2 text-lg font-bold text-ink"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
            <ShoppingBag size={18} />
          </span>
          UniHub
        </button>

        <nav className="flex items-center gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-control px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-light text-primary-dark' : 'text-ink/60 hover:bg-ink/5'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 rounded-control py-1.5 pl-1.5 pr-3 hover:bg-ink/5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-light text-sm font-semibold text-secondary">
            {profile?.full_name?.[0]?.toUpperCase() ?? <User size={16} />}
          </span>
          <span className="text-sm font-medium text-ink">
            {profile?.full_name?.split(' ')[0] ?? 'Perfil'}
          </span>
        </button>
      </div>
    </header>
  );
}
