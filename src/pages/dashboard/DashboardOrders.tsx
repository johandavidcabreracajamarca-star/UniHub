import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_LABELS } from '../../types';
import { useMyBusiness } from '../../hooks/useMyBusiness';
import { orderService } from '../../services/orderService';
import { useToast } from '../../hooks/useToast';
import { CreateBusinessForm } from './CreateBusinessForm';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { ImagePlaceholder } from '../../components/ImagePlaceholder';
import { EmptyState, RowSkeleton } from '../../components/StateViews';
import { Select } from '../../components/Input';
import { formatCOP, formatDateTime } from '../../utils/format';

const ALL_STATUSES: OrderStatus[] = ['pendiente', 'confirmado', 'en_preparacion', 'completado', 'cancelado'];

export function DashboardOrders() {
  const { business, loading: loadingBusiness, refresh: refreshBusiness } = useMyBusiness();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    if (!business) return;
    setLoading(true);
    const list = await orderService.listByBusiness(business.id);
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    const { error } = await orderService.updateStatus(orderId, status);
    setUpdatingId(null);
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast('Estado del pedido actualizado');
    load();
  };

  if (loadingBusiness) return <RowSkeleton count={3} />;
  if (!business) return <CreateBusinessForm onCreated={refreshBusiness} />;
  if (loading) return <RowSkeleton count={3} />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={22} />}
        title="Todavía no has recibido pedidos."
        description="Cuando alguien compre tus productos, los verás aquí."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const item = order.items?.[0];
        return (
          <div key={order.id} className="rounded-card border border-ink/8 bg-white p-3.5 shadow-card">
            <div className="flex items-start gap-3">
              <ImagePlaceholder category={item?.product?.category} className="h-12 w-12 shrink-0 rounded-control" iconSize={16} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{item?.product?.name ?? 'Producto'}</p>
                <p className="text-xs text-ink/50">Comprador: {order.buyer?.full_name ?? 'Estudiante'}</p>
                <p className="text-xs text-ink/40">
                  {item ? `Cantidad: ${item.quantity}` : ''} · {formatDateTime(order.created_at)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-ink">{formatCOP(order.total)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            <div className="mt-3">
              <Select
                label="Actualizar estado"
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
              >
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
