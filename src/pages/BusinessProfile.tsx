import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Circle, MessageCircle } from 'lucide-react';
import type { Business, Product, Review } from '../types';
import { CATEGORY_LABELS } from '../types';
import { businessService } from '../services/businessService';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { chatService } from '../services/chatService';
import { useAuth } from '../hooks/useAuth';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { StarRating } from '../components/StarRating';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { formatDate } from '../utils/format';

export function BusinessProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [askingLoading, setAskingLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

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

  const handleAsk = async () => {
    if (!business || !profile || askingLoading) return;
    setAskingLoading(true);
    const { conversation, error } = await chatService.getOrCreate(profile.id, business.id);
    setAskingLoading(false);
    if (error || !conversation) return;
    navigate(`/messages/${conversation.id}`);
  };

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

  const isOwnBusiness = profile?.id === business.owner_id;
  const logoUrl = !logoFailed && business.logo?.trim() ? business.logo : null;
  const coverUrl = !coverFailed && business.cover_image?.trim() ? business.cover_image : null;
  const initial = business.name.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="pb-10">
      <div className="relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            onError={() => setCoverFailed(true)}
            className="h-40 w-full object-cover md:h-56"
          />
        ) : (
          <div className="relative h-40 w-full overflow-hidden bg-primary md:h-56">
            <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/[0.08]" />
            <div className="absolute right-16 top-20 h-20 w-20 rounded-full bg-accent/90" />
            <div className="absolute -left-8 bottom-[-60px] h-36 w-36 rounded-full bg-white/[0.06]" />
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-card"
          aria-label="Volver"
        >
          <ArrowLeft size={19} />
        </button>
      </div>

      <div className="relative px-4 md:px-6 md:max-w-3xl md:mx-auto">
        <div className="-mt-10 flex items-end justify-between gap-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-primary-light shadow-card">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo de ${business.name}`}
                onError={() => setLogoFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-serif text-3xl font-semibold text-primary">{initial}</span>
            )}
          </div>

          {!isOwnBusiness && (
            <button
              onClick={handleAsk}
              disabled={askingLoading}
              className="mb-1 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card transition-transform active:scale-95 disabled:opacity-60"
            >
              <MessageCircle size={15} />
              Preguntar
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">{business.name}</h1>
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

        <div className="mt-4 flex items-start gap-2.5 rounded-card border border-ink/8 bg-white p-3.5 shadow-card">
          <Circle
            size={9}
            className={`mt-1 shrink-0 ${
              business.available_now ? 'fill-primary text-primary' : 'fill-ink/20 text-ink/20'
            }`}
          />
          <div>
            <p className="text-sm font-medium text-ink">
              {business.available_now ? 'Disponible ahora' : 'No disponible en este momento'}
            </p>
            {business.availability_note?.trim() && (
              <p className="mt-0.5 text-xs text-ink/50">{business.availability_note}</p>
            )}
          </div>
        </div>

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
                    <StarRating rating={r.rating} variant="stars" size={16} />
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
