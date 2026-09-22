import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { formatCOP } from '../utils/format';
import { formatDistance } from '../utils/geo';
import { isProductOnSale, getDiscountedPrice } from '../utils/discount';
import { ProductImage } from './ProductImage';
import { VerifiedBadge } from './VerifiedBadge';

export function ProductCard({
  product,
  distanceMeters,
}: {
  product: Product;
  // distancia (en metros) al emprendimiento, cuando se está ordenando por
  // cercanía y se conoce la ubicación del comprador
  distanceMeters?: number | null;
}) {
  const navigate = useNavigate();
  const business = product.business;
  const distanceLabel = formatDistance(distanceMeters);
  const onSale = isProductOnSale(product);
  const finalPrice = onSale ? getDiscountedPrice(product) : product.price;
  const availableNow = business?.available_now;

  return (
    <button
      onClick={() => navigate(`/product/${product.id}`)}
      className="group w-full overflow-hidden rounded-card bg-white text-left shadow-card transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.98] active:shadow-card"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <ProductImage
          src={product.image}
          category={product.category}
          className="h-full w-full"
          alt={product.name}
          name={product.name}
          seedKey={product.id}
        />
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">Agotado</span>
          </div>
        )}
        {onSale && (
          <span className="absolute left-0 top-3 rounded-r-xl bg-accent py-1 pl-2.5 pr-3 text-xs font-bold text-white shadow-card">
            -{product.discount_percent}%
          </span>
        )}
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink">{product.name}</h3>

        {business && (
          <div className="mt-1 flex min-w-0 items-center gap-1">
            <span className="truncate text-xs text-ink/60">{business.name}</span>
            {business.verified && <VerifiedBadge compact />}
            {distanceLabel && <span className="shrink-0 text-xs text-ink/40">· {distanceLabel}</span>}
          </div>
        )}

        {typeof availableNow === 'boolean' && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/60">
            <span className={`h-1.5 w-1.5 rounded-full ${availableNow ? 'bg-green-600' : 'bg-ink/30'}`} />
            {availableNow ? 'Disponible ahora' : 'No disponible ahora'}
          </p>
        )}

        <div className="mt-2 flex items-end justify-between">
          <div className="flex flex-col">
            {onSale && (
              <span className="text-[11px] leading-none text-ink/40 line-through">{formatCOP(product.price)}</span>
            )}
            <span className="text-base font-bold text-ink">{formatCOP(finalPrice)}</span>
          </div>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-all duration-200 group-hover:scale-110 group-active:scale-95"
            aria-label="Comprar"
          >
            <Plus size={18} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </button>
  );
}
