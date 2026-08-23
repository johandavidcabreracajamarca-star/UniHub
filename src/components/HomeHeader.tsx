import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function HomeHeader() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
            <ShoppingBag size={16} />
          </span>
          <span className="text-lg font-bold text-ink">UniHub</span>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-light text-sm font-semibold text-secondary"
        >
          {profile?.full_name?.[0]?.toUpperCase() ?? <User size={16} />}
        </button>
      </div>

      <button
        onClick={() => navigate('/search')}
        className="mt-3 flex w-full items-center gap-2.5 rounded-control border border-ink/10 bg-white px-3.5 py-2.5 text-left text-sm text-ink/40 min-h-[44px]"
      >
        <Search size={16} />
        ¿Qué estás buscando?
      </button>
    </div>
  );
}
