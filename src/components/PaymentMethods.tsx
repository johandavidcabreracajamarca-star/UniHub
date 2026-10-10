import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { Order, PaymentMethod } from '../types';
import { PAYMENT_METHODS, PAYMENT_METHOD_ORDER } from '../utils/paymentMethods';
import { formatCOP } from '../utils/format';
import { formatPhone, paymentService, type OrderPaymentInfo } from '../services/paymentService';

/** "Formas de pago: Efectivo · Nequi" — visible para todos en producto y emprendimiento. */
export function PaymentMethodChips({ methods }: { methods?: PaymentMethod[] | null }) {
  const list = PAYMENT_METHOD_ORDER.filter((m) => methods?.includes(m));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {list.length === 0 ? (
        <span className="text-xs text-ink/50">El pago se acuerda por el chat con el emprendedor</span>
      ) : (
        list.map((m) => {
          const { label, Icon } = PAYMENT_METHODS[m];
          return (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-full bg-secondary-light px-2.5 py-1 text-xs font-medium text-secondary"
            >
              <Icon size={13} /> {label}
            </span>
          );
        })
      )}
    </div>
  );
}

/**
 * En "Mis pedidos": cómo pagar ese pedido. Los datos (número de Nequi,
 * cuenta…) solo aparecen cuando el emprendedor ya aceptó el pedido.
 */
export function OrderPaymentInfoCard({ order }: { order: Order }) {
  const [info, setInfo] = useState<OrderPaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const method = order.payment_method;
  const accepted = ['confirmado', 'en_preparacion', 'completado'].includes(order.status);

  useEffect(() => {
    if (!method || method === 'efectivo' || !accepted) return;
    let active = true;
    paymentService.getOrderPaymentInfo(order.id).then((data) => active && setInfo(data));
    return () => {
      active = false;
    };
  }, [order.id, method, accepted]);

  if (!method || order.status === 'cancelado') return null;
  const { label, Icon } = PAYMENT_METHODS[method];
  const business = order.business?.name ?? 'el emprendedor';

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // sin portapapeles: el dato igual está a la vista
    }
  };

  let body;
  if (method === 'efectivo') {
    body = <>Pagas {formatCOP(order.total)} en efectivo cuando recibas tu pedido.</>;
  } else if (!accepted) {
    body = <>Cuando {business} acepte tu pedido, aquí verás los datos para pagar por {label}.</>;
  } else if (info) {
    const shown = method === 'transferencia' ? info.account : formatPhone(info.account);
    body = (
      <>
        <span className="block">
          Envía {formatCOP(order.total)} por {label} a:
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-2 rounded-control bg-white px-3 py-2">
          <span className="min-w-0 break-words font-semibold text-ink">{shown}</span>
          <button
            onClick={() => copy(info.account)}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
          </button>
        </span>
        <span className="mt-1.5 block text-[11px] text-ink/45">Luego avísale por el chat que ya pagaste.</span>
      </>
    );
  } else {
    body = <>Pregúntale a {business} por el chat los datos para pagar por {label}.</>;
  }

  return (
    <div className="mt-3 rounded-control bg-surface p-3 text-xs text-ink/70">
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
        <Icon size={14} className="text-primary" /> Pago: {label}
      </p>
      {body}
    </div>
  );
}
