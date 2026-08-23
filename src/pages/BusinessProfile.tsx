import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { Business, Product, Review } from '../types';
import { CATEGORY_LABELS } from '../types';
import { businessService } from '../services/businessService';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { ImagePlaceholder } from '../components/ImagePlaceholder';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { StarRating } from '../components/StarRating';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { formatDate } from '../utils/format';

export function BusinessProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [b, p, r] = await Promise.all([
        businessService.getById(id),
        productService.listByBusiness(id),
        reviewService.listByBusiness(id),
      ]);
      setBusiness(b);
      setProducts(p.map((prod) => ({ ...prod, business: b ?? undefined })));
      setReviews(r);
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
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (error || !business) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="pb-10">
      <div className="relative">
        <ImagePlaceholder category={business.category} className="h-40 w-full md:h-56" iconSize={32} />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-card"
          aria-label="Volver"
        >
          <ArrowLeft size={19} />
        </button>
      </div>

      <div className="relative px-4 md:px-6 md:max-w-3xl md:mx-auto">
        <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-surface bg-white shadow-card">
          <ImagePlaceholder category={business.category} className="h-full w-full rounded-xl" iconSize={22} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-xl font-bold text-ink">{business.name}</h1>
          {business.verified && <VerifiedBadge />}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/50">
          <span>{CATEGORY_LABELS[business.category]}</span>
          <StarRating rating={business.rating} reviewCount={business.review_count} />
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-ink/40">
          <MapPin size={12} />
          {business.university_name} · {business.faculty_name}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-ink/70">{business.description}</p>

        <section className="mt-7">
          <h2 className="mb-3 text-base font-semibold text-ink">
            Productos disponibles ({products.length})
          </h2>
          {products.length === 0 ? (
            <EmptyState title="Este emprendimiento aún no tiene productos publicados." />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-ink">Reseñas ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <EmptyState title="Todavía no hay reseñas para este emprendimiento." />
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-card border border-ink/8 bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{r.buyer_name ?? 'Estudiante'}</span>
                    <span className="text-xs text-ink/40">{formatDate(r.created_at)}</span>
                  </div>
                  <div className="mt-1">
                    <StarRating rating={r.rating} showValue={false} />
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm text-ink/70">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
