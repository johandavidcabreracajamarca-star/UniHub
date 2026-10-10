import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, CheckCircle2 } from 'lucide-react';
import type { PaymentMethod, Product, ProductVariant } from '../types';
import { Button } from './Button';
import { formatCOP } from '../utils/format';
import { isProductOnSale, getDiscountedPrice } from '../utils/discount';
import { orderService } from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PushOfferAfterOrder } from './PushPrompt';
import { PAYMENT_METHODS, PAYMENT_METHOD_ORDER, needsPaymentDetails } from '../utils/paymentMethods';

interface PurchaseModalProps {
  product: Product;
  // Variante elegida en ProductDetail cuando el producto tiene variantes
  // (null si el producto no tiene o todavía no se eligió ninguna).
  variant?: ProductVariant | null;
  onClose: () => void;
}

type Step = 'quantity' | 'confirm' | 'success';

export function PurchaseModal({ product, variant = null, onClose }: PurchaseModalProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Medios que acepta el emprendimiento; si no configuró ninguno, se acuerda por chat
  const acceptedMethods = PAYMENT_METHOD_ORDER.filter((m) => product.business?.payment_methods?.includes(m));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(acceptedMethods[0] ?? null);

  // Si el producto está en oferta, el comprador paga el precio con
  // descuento — mostrarlo tachado en la tarjeta no serviría de nada si al
  // final se le sigue cobrando el precio normal. Los descuentos no aplican
  // a productos con variantes (cada variante ya tiene su propio precio).
  const onSale = !variant && isProductOnSale(product);
  const unitPrice = variant ? variant.price : onSale ? getDiscountedPrice(product) : product.price;
  const availableStock = variant ? variant.stock : product.stock;
  const total = unitPrice * quantity;
  const displayName = variant ? `${product.name} (${variant.name})` : product.name;

  const handleConfirm = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const { error } = await orderService.createOrder({
      buyer_id: profile.id,
      business_id: product.business_id,
      product_id: product.id,
      quantity,
      unit_price: unitPrice,
      variant_id: variant?.id ?? null,
      variant_name: variant?.name ?? null,
      payment_method: paymentMethod,
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
                <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
                <p className="text-sm text-ink/50">
                  {onSale && (
                    <span className="mr-1.5 text-ink/40 line-through">{formatCOP(product.price)}</span>
                  )}
                  {formatCOP(unitPrice)} c/u
                </p>
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
                onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink disabled:opacity-40"
                disabled={quantity >= availableStock}
                aria-label="Aumentar cantidad"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-ink/40">{availableStock} disponibles</p>

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
              <Row label="Producto" value={displayName} />
              <Row label="Emprendimiento" value={product.business?.name ?? '—'} />
              <Row label="Cantidad" value={String(quantity)} />
              <Row label="Total" value={formatCOP(total)} bold />
            </div>

            <p className="mb-2 mt-4 text-sm font-semibold text-ink">¿Cómo vas a pagar?</p>
            {acceptedMethods.length === 0 ? (
              <p className="rounded-card bg-surface p-3 text-xs text-ink/60">
                Este emprendimiento todavía no indicó sus medios de pago. Acuerden el pago por el chat.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {acceptedMethods.map((m) => {
                  const { label, hint, Icon } = PAYMENT_METHODS[m];
                  const on = paymentMethod === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 rounded-control border p-2.5 text-left transition-colors ${
                        on ? 'border-primary bg-primary-light' : 'border-ink/12 bg-white'
                      }`}
                    >
                      <Icon size={18} className={on ? 'text-primary' : 'text-ink/40'} />
                      <span className="min-w-0">
                        <span className={`block text-sm font-semibold ${on ? 'text-primary-dark' : 'text-ink'}`}>{label}</span>
                        <span className="block truncate text-[11px] text-ink/45">{hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <p className="mt-4 text-center text-xs text-ink/40">
              {needsPaymentDetails(paymentMethod)
                ? 'Cuando el emprendedor acepte tu pedido, verás en Pedidos los datos para pagar.'
                : 'UniHub no cobra ni procesa pagos: le pagas directamente al emprendedor.'}
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
              <Row label="Producto" value={displayName} />
              <Row label="Emprendimiento" value={product.business?.name ?? '—'} />
              <Row label="Cantidad" value={String(quantity)} />
              <Row label="Total" value={formatCOP(total)} bold />
              {paymentMethod && <Row label="Pago" value={PAYMENT_METHODS[paymentMethod].label} />}
              <Row label="Estado" value="Pendiente" />
            </div>

            <PushOfferAfterOrder />

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
