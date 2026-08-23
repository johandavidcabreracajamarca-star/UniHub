import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, CheckCircle2 } from 'lucide-react';
import type { Product } from '../types';
import { Button } from './Button';
import { formatCOP } from '../utils/format';
import { orderService } from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface PurchaseModalProps {
  product: Product;
  onClose: () => void;
}

type Step = 'quantity' | 'confirm' | 'success';

export function PurchaseModal({ product, onClose }: PurchaseModalProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = product.price * quantity;

  const handleConfirm = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const { error } = await orderService.createOrder({
      buyer_id: profile.id,
      business_id: product.business_id,
      product_id: product.id,
      quantity,
      unit_price: product.price,
    });
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center">
      <div className="w-full max-w-app rounded-t-card bg-white p-5 pb-7 md:rounded-card md:max-w-sm">
        {step !== 'success' && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">
              {step === 'quantity' ? 'Elige la cantidad' : 'Confirma tu pedido'}
            </h2>
            <button onClick={onClose} className="text-ink/50 hover:text-ink" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
        )}

        {step === 'quantity' && (
          <div>
            <div className="flex items-center gap-3 rounded-card bg-surface p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{product.name}</p>
                <p className="text-sm text-ink/50">{formatCOP(product.price)} c/u</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-6">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Reducir cantidad"
              >
                <Minus size={18} />
              </button>
              <span className="w-10 text-center text-2xl font-bold text-ink">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink disabled:opacity-40"
                disabled={quantity >= product.stock}
                aria-label="Aumentar cantidad"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-ink/40">{product.stock} disponibles</p>

            <div className="mt-6 flex items-center justify-between border-t border-ink/8 pt-4">
              <span className="text-sm font-medium text-ink/60">Total</span>
              <span className="text-lg font-bold text-ink">{formatCOP(total)}</span>
            </div>

            <Button fullWidth size="lg" className="mt-5" onClick={() => setStep('confirm')}>
              Continuar
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div>
            <div className="rounded-card bg-surface p-4 space-y-2.5">
              <Row label="Producto" value={product.name} />
              <Row label="Emprendimiento" value={product.business?.name ?? '—'} />
              <Row label="Cantidad" value={String(quantity)} />
              <Row label="Total" value={formatCOP(total)} bold />
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <p className="mt-4 text-center text-xs text-ink/40">
              Este MVP no procesa pagos en línea. Coordina la entrega directamente con el emprendedor.
            </p>

            <div className="mt-5 flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep('quantity')}>
                Atrás
              </Button>
              <Button fullWidth loading={loading} onClick={handleConfirm}>
                Confirmar pedido
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-2 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="text-lg font-bold text-ink">¡Pedido realizado!</h2>

            <div className="mt-5 w-full rounded-card bg-surface p-4 space-y-2.5 text-left">
              <Row label="Producto" value={product.name} />
              <Row label="Emprendimiento" value={product.business?.name ?? '—'} />
              <Row label="Cantidad" value={String(quantity)} />
              <Row label="Total" value={formatCOP(total)} bold />
              <Row label="Estado" value="Pendiente" />
            </div>

            <div className="mt-6 flex w-full gap-3">
              <Button variant="outline" fullWidth onClick={onClose}>
                Seguir explorando
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  showToast('Pedido realizado con éxito');
                  navigate('/orders');
                }}
              >
                Ver mis pedidos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink/50">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{value}</span>
    </div>
  );
}
