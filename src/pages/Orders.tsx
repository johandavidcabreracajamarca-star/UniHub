import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Star } from 'lucide-react';
import type { Order } from '../types';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { ImagePlaceholder } from '../components/ImagePlaceholder';
import { RowSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { ReviewModal } from '../components/ReviewModal';
import { Button } from '../components/Button';
import { formatCOP, formatDateTime } from '../utils/format';

export function Orders() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [eligibleForReview, setEligibleForReview] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    setError(false);
    try {
      const list = await orderService.listByBuyer(profile.id);
      setOrders(list);
      const eligibility: Record<string, boolean> = {};
      await Promise.all(
        list
          .filter((o) => o.status === 'completado')
          .map(async (o) => {
            eligibility[o.id] = await reviewService.canReview(o.id);
          })
      );
      setEligibleForReview(eligibility);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (loading) {
    return (
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <h1 className="mb-4 text-xl font-bold text-ink">Pedidos</h1>
        <RowSkeleton count={3} />
      </div>
    );
  }

  if (error) return <ErrorState onRetry={load} />;

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 md:max-w-2xl md:mx-auto">
      <h1 className="mb-4 text-xl font-bold text-ink">Pedidos</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Receipt size={22} />}
          title="Todavía no tienes pedidos."
          description="Explora los emprendimientos de tu universidad y haz tu primera compra."
          action={
            <Button className="mt-2" onClick={() => navigate('/explore')}>
              Explorar productos
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const item = order.items?.[0];
            const canReview = order.status === 'completado' && eligibleForReview[order.id];
            return (
              <div key={order.id} className="rounded-card border border-ink/8 bg-white p-3.5 shadow-card">
                <div className="flex items-start gap-3">
                  <ImagePlaceholder
                    category={item?.product?.category}
                    className="h-14 w-14 shrink-0 rounded-control"
                    iconSize={18}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink line-clamp-1">
                        {item?.product?.name ?? 'Producto'}
                      </p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-ink/50">{order.business?.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-ink/40">
                        {item ? `Cantidad: ${item.quantity}` : ''} · {formatDateTime(order.created_at)}
                      </span>
                      <span className="text-sm font-semibold text-ink">{formatCOP(order.total)}</span>
                    </div>
                  </div>
                </div>

                {canReview && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    icon={<Star size={14} />}
                    className="mt-3"
                    onClick={() => setReviewOrder(order)}
                  >
                    Calificar pedido
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => {
            setReviewOrder(null);
            showToast('¡Gracias por tu reseña!');
            load();
          }}
        />
      )}
    </div>
  );
}
