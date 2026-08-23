import type { OrderStatus } from '../types';
import { ORDER_STATUS_LABELS } from '../types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pendiente: 'bg-accent-light text-accent',
  confirmado: 'bg-secondary-light text-secondary',
  en_preparacion: 'bg-secondary-light text-secondary',
  completado: 'bg-primary-light text-primary-dark',
  cancelado: 'bg-red-50 text-red-500',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
