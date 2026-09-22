import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MapPin } from 'lucide-react';
import type { Product } from '../types';
import { CATEGORY_LABELS } from '../types';
import { productService } from '../services/productService';
import { formatCOP } from '../utils/format';
import { isProductOnSale, getDiscountedPrice } from '../utils/discount';
import { ProductImage } from '../components/ProductImage';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { StarRating } from '../components/StarRating';
import { Button } from '../components/Button';
import { PurchaseModal } from '../components/PurchaseModal';
import { RowSkeleton, ErrorState } from '../components/StateViews';
import { useAuth } from '../hooks/useAuth';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await productService.getById(id);
      setProduct(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <RowSkeleton count={1} />
        <div className="mt-4">
          <RowSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return <ErrorState onRetry={load} />;
  }

  const business = product.business;
  const onSale = isProductOnSale(product);
  const finalPrice = onSale ? getDiscountedPrice(product) : product.price;

  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 pt-4 md:px-0 md:pt-0">
      <div className="relative overflow-hidden rounded-[30px] md:rounded-none">
        <ProductImage
          src={product.image}
          category={product.category}
          className="aspect-[5/4] w-full md:aspect-[21/9]"
          iconSize={44}
          alt={product.name}
          name={product.name}
          seedKey={product.id}
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card"
          aria-label="Volver"
        >
          <ArrowLeft size={19} />
        </button>
        {!product.available && (
          <span className="absolute right-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
            Agotado
          </span>
        )}
        {onSale && (
          <span className="absolute bottom-4 left-4 rounded-xl bg-accent px-3 py-1.5 text-sm font-bold text-white shadow-card">
            -{product.discount_percent}%
          </span>
        )}
      </div>
      </div>

      <div className="px-4 pt-4 md:px-6 md:max-w-2xl md:mx-auto">
        <div className="flex flex-wrap items-center gap-2">
          {typeof business?.available_now === 'boolean' && (
            <span
              className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
                business.available_now ? 'bg-green-100 text-green-800' : 'bg-ink/8 text-ink/60'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${business.available_now ? 'bg-green-600' : 'bg-ink/30'}`} />
              {business.available_now ? 'Disponible ahora' : 'No disponible ahora'}
            </span>
          )}
          <span className="inline-flex h-7 items-center rounded-full bg-primary-light px-3 text-xs font-semibold text-primary">
            {CATEGORY_LABELS[product.category]}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink">{product.name}</h1>

        <p className="mt-4 text-sm leading-relaxed text-ink/70">{product.description}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-ink/50">
          <span>{product.available ? `${product.stock} disponibles` : 'Sin stock'}</span>
        </div>

        {business && (
          <button
            onClick={() => navigate(`/business/${business.id}`)}
            className="mt-5 flex w-full items-center gap-3 rounded-card border border-ink/8 bg-white p-3.5 text-left shadow-card"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-light text-primary">
              <ShoppingBag size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-ink truncate">{business.name}</span>
                {business.verified && <VerifiedBadge compact />}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <StarRating rating={business.rating} size={12} reviewCount={business.review_count} />
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/40">
                <MapPin size={11} />
                {business.university_name} · {business.faculty_name}
              </p>
            </div>
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-ink/8 bg-white px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:static md:mt-6 md:border-0 md:px-6 md:max-w-2xl md:mx-auto">
        <div className="shrink-0">
          {onSale && <p className="text-xs leading-none text-ink/40 line-through">{formatCOP(product.price)}</p>}
          <p className="text-2xl font-extrabold leading-tight tracking-tight text-accent">{formatCOP(finalPrice)}</p>
        </div>
        <Button
          size="lg"
          fullWidth
          disabled={!product.available}
          onClick={() => {
            if (!profile) {
              navigate('/login');
              return;
            }
            setShowPurchase(true);
          }}
        >
          {product.available ? 'Comprar' : 'No disponible'}
        </Button>
      </div>

      {showPurchase && (
        <PurchaseModal
          product={product}
          onClose={() => {
            setShowPurchase(false);
            load();
          }}
        />
      )}
    </div>
  );
}
