import { NavLink } from 'react-router-dom';
import { Compass, Search, Receipt, User } from 'lucide-react';

const items = [
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/search', label: 'Buscar', icon: Search },
  { to: '/orders', label: 'Pedidos', icon: Receipt },
  { to: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/8 bg-white/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto flex max-w-app items-stretch justify-between gap-1 px-3 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 rounded-control py-2 min-h-[52px] text-[11px] font-medium transition-all duration-200 active:scale-95 ${
                isActive ? 'bg-primary-light text-primary' : 'text-ink/45'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={`transition-transform duration-200 ease-out ${isActive ? 'scale-110' : 'scale-100'}`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
