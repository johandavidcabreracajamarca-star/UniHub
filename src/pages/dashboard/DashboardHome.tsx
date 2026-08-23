import { useEffect, useState, type ReactNode } from 'react';
import { Package, ClipboardList, DollarSign, Star } from 'lucide-react';
import { useMyBusiness } from '../../hooks/useMyBusiness';
import { CreateBusinessForm } from './CreateBusinessForm';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { StarRating } from '../../components/StarRating';
import { RowSkeleton } from '../../components/StateViews';
import { formatCOP } from '../../utils/format';

export function DashboardHome() {
  const { business, loading, refresh } = useMyBusiness();
  const [stats, setStats] = useState<{
    activeProducts: number;
    totalOrders: number;
    totalSales: number;
  } | null>(null);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [products, orders] = await Promise.all([
        productService.listByBusiness(business.id),
        orderService.listByBusiness(business.id),
      ]);
      setStats({
        activeProducts: products.filter((p) => p.available).length,
        totalOrders: orders.length,
        totalSales: orders
          .filter((o) => o.status === 'completado')
          .reduce((sum, o) => sum + o.total, 0),
      });
    })();
  }, [business]);

  if (loading) return <RowSkeleton count={3} />;

  if (!business) {
    return <CreateBusinessForm onCreated={refresh} />;
  }

  return (
    <div>
      <div className="rounded-card border border-ink/8 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-ink">{business.name}</h2>
          {business.verified ? (
            <VerifiedBadge />
          ) : (
            <span className="rounded-full bg-ink/8 px-2 py-0.5 text-xs font-medium text-ink/50">
              No verificado
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <StarRating rating={business.rating} reviewCount={business.review_count} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Package size={17} />}
          label="Productos activos"
          value={stats ? String(stats.activeProducts) : '—'}
          color="primary"
        />
        <StatCard
          icon={<ClipboardList size={17} />}
          label="Pedidos"
          value={stats ? String(stats.totalOrders) : '—'}
          color="secondary"
        />
        <StatCard
          icon={<DollarSign size={17} />}
          label="Ventas"
          value={stats ? formatCOP(stats.totalSales) : '—'}
          color="accent"
        />
        <StatCard
          icon={<Star size={17} />}
          label="Calificación"
          value={business.rating > 0 ? business.rating.toFixed(1) : 'Sin datos'}
          color="primary"
        />
      </div>

      {!business.verified && (
        <div className="mt-4 rounded-card bg-secondary-light p-3.5 text-xs text-secondary">
          Tu emprendimiento aún no está verificado. La verificación la otorga el equipo de UniHub
          revisando tu identidad universitaria; no puedes activarla manualmente.
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'accent';
}) {
  const bg = { primary: 'bg-primary-light text-primary-dark', secondary: 'bg-secondary-light text-secondary', accent: 'bg-accent-light text-accent' }[color];
  return (
    <div className="rounded-card border border-ink/8 bg-white p-3.5 shadow-card">
      <span className={`flex h-8 w-8 items-center justify-center rounded-control ${bg}`}>{icon}</span>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}
