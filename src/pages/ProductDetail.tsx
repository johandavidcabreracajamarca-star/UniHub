import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MapPin } from 'lucide-react';
import type { Product } from '../types';
import { CATEGORY_LABELS } from '../types';
import { productService } from '../services/productService';
import { formatCOP } from '../utils/format';
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

  return (
    <div className="pb-28 md:pb-10">
      <div className="relative">
        <ProductImage
          src={product.image}
          category={product.category}
          className="aspect-square w-full md:aspect-[21/9]"
          iconSize={44}
          alt={product.name}
          name={product.name}
          seedKey={product.id}
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-card"
          aria-label="Volver"
        >
          <ArrowLeft size={19} />
        </button>
        {!product.available && (
          <span className="absolute right-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
            Agotado
          </span>
        )}
      </div>

      <div className="px-4 pt-5 md:px-6 md:max-w-2xl md:mx-auto">
        <span className="text-xs font-medium uppercase tracking-wide text-primary">
          {CATEGORY_LABELS[product.category]}
        </span>
        <h1 className="mt-1 text-xl font-bold text-ink">{product.name}</h1>
        <p className="mt-1.5 text-2xl font-bold text-ink">{formatCOP(product.price)}</p>

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

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-ink/8 bg-white p-4 md:static md:mt-6 md:border-0 md:px-6 md:max-w-2xl md:mx-auto">
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
