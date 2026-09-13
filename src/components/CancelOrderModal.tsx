import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Textarea } from './Input';
import { orderService } from '../services/orderService';
import type { Order } from '../types';

const REASONS = [
  'Producto agotado',
  'No pude prepararlo a tiempo',
  'No pude contactar al comprador',
  'Pedido duplicado o por error',
];

interface CancelOrderModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelOrderModal({ order, onClose, onSuccess }: CancelOrderModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOther = selected === 'otro';
  const finalReason = isOther ? customReason.trim() : selected;
  const canSubmit = Boolean(finalReason);

  const handleSubmit = async () => {
    if (!finalReason) return;
    setLoading(true);
    setError(null);
    const { error } = await orderService.cancelOrder(order.id, finalReason);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center">
      <div className="w-full max-w-app rounded-t-card bg-white p-5 pb-7 md:rounded-card md:max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Cancelar pedido</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-ink/50">Cuéntale al comprador por qué se canceló su pedido.</p>

        <div className="mt-4 flex flex-col gap-2">
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelected(reason)}
              className={`rounded-control border px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                selected === reason ? 'border-primary bg-primary-light text-primary-dark' : 'border-ink/15 text-ink/70'
              }`}
            >
              {reason}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelected('otro')}
            className={`rounded-control border px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
              isOther ? 'border-primary bg-primary-light text-primary-dark' : 'border-ink/15 text-ink/70'
            }`}
          >
            Otro
          </button>
        </div>

        {isOther && (
          <div className="mt-3">
            <Textarea
              label="Escribe el motivo"
              placeholder="Cuéntale al comprador qué pasó..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <Button variant="outline" size="lg" onClick={onClose}>
            Volver
          </Button>
          <Button variant="danger" size="lg" fullWidth loading={loading} disabled={!canSubmit} onClick={handleSubmit}>
            Cancelar pedido
          </Button>
        </div>
      </div>
    </div>
  );
}
