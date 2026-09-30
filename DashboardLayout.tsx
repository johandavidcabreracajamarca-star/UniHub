import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Package, ClipboardList } from 'lucide-react';

const tabs = [
  { to: '/dashboard', label: 'Resumen', icon: LayoutGrid, end: true },
  { to: '/dashboard/products', label: 'Productos', icon: Package, end: false },
  { to: '/dashboard/orders', label: 'Pedidos', icon: ClipboardList, end: false },
];

export function DashboardLayout() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 md:max-w-3xl md:mx-auto">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5"
          aria-label="Volver a perfil"
        >
          <ArrowLeft size={21} />
        </button>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">Panel emprendedor</h1>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-white shadow-card'
                  : 'border-ink/10 bg-white text-ink/70 hover:bg-primary-light'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
