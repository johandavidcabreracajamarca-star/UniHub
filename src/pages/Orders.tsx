import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, PackageCheck, Receipt, Star } from 'lucide-react';
import type { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { ProductImage } from '../components/ProductImage';
import { RowSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { ReviewModal } from '../components/ReviewModal';
import { Button } from '../components/Button';
import { formatCOP } from '../utils/format';

export function Orders() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [eligibleForReview, setEligibleForReview] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);
  // ?calificar=<id> llega desde el aviso "Tu pedido fue entregado"
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('calificar');

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
      return { list, eligibility };
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().then((result) => {
      // Si llegó desde el aviso, abrimos directo lo que falte: confirmar o calificar
      if (!result || !highlightId) return;
      const order = result.list.find((o) => o.id === highlightId);
      if (order && needsConfirm(order, result.eligibility)) setConfirmOrder(order);
      else if (order && result.eligibility[order.id]) setReviewOrder(order);
      setSearchParams({}, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleConfirmReceived = async () => {
    if (!confirmOrder) return;
    setConfirming(true);
    const { error: confirmError } = await orderService.confirmReceived(confirmOrder.id);
    setConfirming(false);
    if (confirmError) {
      showToast(confirmError, 'error');
      return;
    }
    const order = confirmOrder;
    setConfirmOrder(null);
    showToast('¡Gracias por confirmar!');
    await load();
    // Justo después de recibirlo es el mejor momento para calificar
    if (await reviewService.canReview(order.id)) {
      setReviewOrder({ ...order, status: 'completado', buyer_confirmed_at: new Date().toISOString() });
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <h1 className="mb-4 font-serif text-2xl font-semibold text-ink">Pedidos</h1>
        <RowSkeleton count={3} />
      </div>
    );
  }

  if (error) return <ErrorState onRetry={load} />;

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 md:max-w-2xl md:mx-auto">
      <h1 className="mb-5 font-serif text-2xl font-semibold text-ink">Pedidos</h1>

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
            const highlighted = order.id === highlightId;
            return (
              <div
                key={order.id}
                className={`rounded-card border bg-white p-3.5 shadow-card ${highlighted ? 'border-primary ring-2 ring-primary/20' : 'border-ink/8'}`}
              >
                <div className="flex items-start gap-3">
                  <ProductImage
                    src={item?.product?.image}
                    category={item?.product?.category}
                    className="h-16 w-16 shrink-0 rounded-control"
                    iconSize={18}
                    alt={item?.product?.name}
                    name={item?.product?.name}
                    seedKey={item?.product?.id}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-semibold text-ink line-clamp-2">
                        {item?.product?.name ?? 'Producto eliminado'}
                        {item?.variant_name && (
                          <span className="font-normal text-ink/50"> · {item.variant_name}</span>
                        )}
                      </p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink/50">{order.business?.name}</p>
                    {order.status === 'cancelado' && order.cancellation_reason && (
                      <p className="mt-0.5 text-xs text-red-500">Motivo: {order.cancellation_reason}</p>
                    )}
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span className="text-xs text-ink/40">
                        {item ? `${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'} · ` : ''}
                        {formatShortDate(order.created_at)}
                      </span>
                      <span className="shrink-0 text-base font-bold text-ink">{formatCOP(order.total)}</span>
                    </div>
                  </div>
                </div>

                {order.status !== 'cancelado' && <OrderProgress status={order.status} />}

                {order.buyer_confirmed_at && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-700">
                    <CheckCircle2 size={14} /> Confirmaste que lo recibiste
                  </p>
                )}

                {needsConfirm(order, eligibleForReview) && (
                  <Button
                    size="sm"
                    fullWidth
                    icon={<PackageCheck size={15} />}
                    className="mt-3"
                    onClick={() => setConfirmOrder(order)}
                  >
                    Ya recibí mi pedido
                  </Button>
                )}

                {canReview && !needsConfirm(order, eligibleForReview) && (
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

      {confirmOrder && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm md:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !confirming && setConfirmOrder(null)}
        >
          <div
            className="w-full max-w-md animate-fade-up rounded-t-[32px] bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 text-center shadow-card-hover md:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary-light text-primary">
              <PackageCheck size={30} />
            </span>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">¿Ya recibiste tu pedido?</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
              Confírmalo solo cuando ya tengas
              {confirmOrder.items?.[0]?.product?.name ? ` tu ${confirmOrder.items[0].product.name}` : ' tu pedido'} en la mano.
              Así {confirmOrder.business?.name ?? 'el emprendedor'} sabe que todo salió bien.
            </p>
            <Button size="lg" fullWidth className="mt-6" loading={confirming} onClick={handleConfirmReceived}>
              Sí, ya lo recibí
            </Button>
            <button
              onClick={() => setConfirmOrder(null)}
              disabled={confirming}
              className="mt-2 h-11 w-full text-sm font-medium text-ink/50"
            >
              Todavía no
            </button>
          </div>
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

// "Ya recibí mi pedido": cuando el emprendedor ya lo aceptó y el comprador aún
// no lo confirmó. Los pedidos completados que ya tienen reseña no lo piden
// (si lo calificó, es que le llegó).
function needsConfirm(order: Order, eligibleForReview: Record<string, boolean>): boolean {
  if (order.buyer_confirmed_at) return false;
  if (order.status === 'completado') return Boolean(eligibleForReview[order.id]);
  return order.status === 'confirmado' || order.status === 'en_preparacion';
}

const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(iso)).replace('.', '');

// Progreso del pedido en 3 pasos, para entender de un vistazo en qué va
const PROGRESS_STEPS = ['Recibido', 'En preparación', 'Entregado'];
const STATUS_STEP: Record<OrderStatus, number> = {
  pendiente: 0,
  confirmado: 1,
  en_preparacion: 1,
  completado: 2,
  cancelado: -1,
};

function OrderProgress({ status }: { status: OrderStatus }) {
  const current = STATUS_STEP[status];
  return (
    <div className="mt-3.5 grid grid-cols-3 gap-1.5">
      {PROGRESS_STEPS.map((label, i) => (
        <div key={label}>
          <div className={`h-1.5 rounded-full ${i <= current ? 'bg-primary' : 'bg-ink/10'}`} />
          <p className={`mt-1.5 text-[11px] font-medium ${i <= current ? 'text-primary' : 'text-ink/35'}`}>{label}</p>
        </div>
      ))}
    </div>
  );
}
