import { useEffect, useState } from 'react';
import { Eye, Heart, TrendingDown, TrendingUp } from 'lucide-react';
import type { Order, Product } from '../../types';
import { statsService, type BusinessStats } from '../../services/statsService';

const WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/** "Cómo te va esta semana": visitas, favoritos y productos que más llaman la atención. */
export function BusinessInsights({
  businessId,
  products,
  orders,
}: {
  businessId: string;
  products: Product[];
  orders: Order[];
}) {
  const [stats, setStats] = useState<BusinessStats | null>(null);

  useEffect(() => {
    let active = true;
    statsService
      .getBusinessStats(businessId)
      .then((s) => active && setStats(s))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [businessId]);

  if (!stats) return null;

  // Unidades vendidas por producto (sin contar pedidos cancelados)
  const sold: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === 'cancelado') continue;
    for (const item of o.items ?? []) sold[item.product_id] = (sold[item.product_id] ?? 0) + item.quantity;
  }

  const top = products
    .map((p) => ({ product: p, views: stats.viewsByProduct[p.id] ?? 0, sold: sold[p.id] ?? 0 }))
    .filter((r) => r.views > 0 || r.sold > 0)
    .sort((a, b) => b.views - a.views || b.sold - a.sold)
    .slice(0, 3);

  const maxDaily = Math.max(1, ...stats.dailyViews.map((d) => d.views));
  const change =
    stats.viewsLastWeek > 0 ? Math.round(((stats.viewsThisWeek - stats.viewsLastWeek) / stats.viewsLastWeek) * 100) : null;

  return (
    <section className="mt-4 rounded-card border border-ink/8 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-ink">Cómo te va esta semana</h2>
        <span className="text-[11px] text-ink/40">Últimos 7 días</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-control bg-primary-light p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary-dark">
            <Eye size={14} /> Visitas a tus productos
          </div>
          <p className="mt-1 text-2xl font-bold text-ink">{stats.viewsThisWeek}</p>
          {change !== null && (
            <p className={`flex items-center gap-1 text-[11px] font-semibold ${change >= 0 ? 'text-green-700' : 'text-accent-dark'}`}>
              {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change >= 0 ? '+' : ''}
              {change}% vs. semana pasada
            </p>
          )}
        </div>
        <div className="rounded-control bg-accent-light p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-accent-dark">
            <Heart size={14} /> En favoritos
          </div>
          <p className="mt-1 text-2xl font-bold text-ink">{stats.favorites ?? '—'}</p>
          <p className="text-[11px] text-ink/50">{stats.favorites === 1 ? 'estudiante te sigue' : 'estudiantes te siguen'}</p>
        </div>
      </div>

      <div className="mt-4 flex h-24 items-end gap-2" aria-label="Visitas por día">
        {stats.dailyViews.map((d, i) => {
          const isToday = i === stats.dailyViews.length - 1;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-ink/50">{d.views > 0 ? d.views : ''}</span>
              <div
                className={`w-full rounded-md ${isToday ? 'bg-accent' : 'bg-primary/70'}`}
                style={{ height: `${Math.max(4, (d.views / maxDaily) * 64)}px` }}
              />
              <span className={`text-[10px] ${isToday ? 'font-bold text-ink' : 'text-ink/40'}`}>
                {WEEKDAYS[new Date(`${d.date}T12:00:00`).getDay()]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-ink/6 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">Tus productos más vistos</p>
        {top.length === 0 ? (
          <p className="text-xs text-ink/50">
            Aún no hay visitas esta semana. Comparte tus productos por WhatsApp desde el botón de compartir para atraer
            compradores.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {top.map((r, i) => (
              <li key={r.product.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-ink/60">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.product.name}</span>
                <span className="shrink-0 text-xs text-ink/50">
                  {r.views} {r.views === 1 ? 'visita' : 'visitas'} · {r.sold} {r.sold === 1 ? 'vendido' : 'vendidos'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
