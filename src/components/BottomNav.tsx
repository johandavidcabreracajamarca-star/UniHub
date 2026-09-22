import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Search, Receipt, User } from 'lucide-react';

const items = [
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/search', label: 'Buscar', icon: Search },
  { to: '/orders', label: 'Pedidos', icon: Receipt },
  { to: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();

  // En el detalle de un producto la barra inferior es la de "Comprar",
  // así que ocultamos la navegación para que no se encimen.
  if (pathname.startsWith('/product/')) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="pointer-events-auto flex w-full max-w-[19rem] items-center justify-between rounded-full bg-ink p-2 shadow-[0_14px_30px_rgba(42,35,32,0.32)]">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                isActive ? 'bg-surface text-ink' : 'text-white/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
