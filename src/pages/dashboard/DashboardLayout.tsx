import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, Package, ClipboardList } from 'lucide-react';

const tabs = [
  { to: '/dashboard', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/dashboard/products', label: 'Mis productos', icon: Package, end: false },
  { to: '/dashboard/orders', label: 'Pedidos recibidos', icon: ClipboardList, end: false },
];

export function DashboardLayout() {
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
        <h1 className="text-xl font-bold text-ink">Panel del emprendedor</h1>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium min-h-[36px] transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-white'
                  : 'border-ink/12 bg-white text-ink/60 hover:bg-ink/5'
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
