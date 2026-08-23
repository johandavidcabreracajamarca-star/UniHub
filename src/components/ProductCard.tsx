import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '../types';
import { formatCOP } from '../utils/format';
import { ImagePlaceholder } from './ImagePlaceholder';
import { VerifiedBadge } from './VerifiedBadge';
import { StarRating } from './StarRating';

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const business = product.business;

  return (
    <button
      onClick={() => navigate(`/product/${product.id}`)}
      className="group text-left w-full rounded-card bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden border border-ink/5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <ImagePlaceholder category={product.category} className="h-full w-full" />
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink line-clamp-1">{product.name}</h3>
        </div>

        {business && (
          <div className="mt-1 flex items-center gap-1 min-w-0">
            <span className="text-xs text-ink/60 truncate">{business.name}</span>
            {business.verified && <VerifiedBadge compact />}
          </div>
        )}

        {business && (
          <p className="mt-0.5 text-[11px] text-ink/40 truncate">
            {business.university_name} · {business.faculty_name}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-ink">{formatCOP(product.price)}</span>
            {business && <StarRating rating={business.rating} size={12} />}
          </div>
          <span
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary text-white shrink-0 group-hover:bg-primary-dark transition-colors"
            aria-label="Comprar"
          >
            <ShoppingBag size={16} />
          </span>
        </div>
      </div>
    </button>
  );
}
