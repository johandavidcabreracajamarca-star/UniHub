import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Quote } from 'lucide-react';
import type { Business, Product, Review } from '../types';
import { reviewService } from '../services/reviewService';
import { productService } from '../services/productService';
import { formatDate, shortName } from '../utils/format';
import { StarRating } from './StarRating';
import { ProductCard } from './ProductCard';

/**
 * Debajo del detalle de un producto: lo que dicen otros estudiantes del
 * emprendimiento y más productos del mismo vendedor. Las reseñas en UniHub
 * son por emprendimiento (se dejan al completar un pedido), no por producto.
 */
export function ProductExtras({ business, productId }: { business: Business; productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [moreProducts, setMoreProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([reviewService.listByBusiness(business.id), productService.listByBusiness(business.id)])
      .then(([r, p]) => {
        if (!active) return;
        setReviews(r.filter((review) => review.comment?.trim()).slice(0, 3));
        setMoreProducts(
          p
            .filter((item) => item.id !== productId && item.available && !item.suspended)
            .slice(0, 8)
            .map((item) => ({ ...item, business }))
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [business, productId]);

  if (reviews.length === 0 && moreProducts.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-8 md:px-6">
      {reviews.length > 0 && (
        <section className="px-4 md:px-0">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink">Lo que dicen los estudiantes</h2>
              <p className="mt-0.5 text-xs text-ink/50">Reseñas de compras a {business.name}</p>
            </div>
            <Link to={`/business/${business.id}`} className="flex shrink-0 items-center text-sm font-semibold text-primary">
              Ver todas
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:px-0">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="relative w-[78%] shrink-0 snap-start rounded-card border border-ink/8 bg-white p-4 shadow-card md:w-auto"
              >
                <Quote size={22} className="absolute right-4 top-4 fill-primary-light text-primary-light" />
                <StarRating rating={r.rating} variant="stars" size={15} />
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-ink/80">“{r.comment}”</p>
                <p className="mt-3 text-xs font-semibold text-ink">
                  {shortName(r.buyer_name)} <span className="font-normal text-ink/40">· {formatDate(r.created_at)}</span>
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {moreProducts.length > 0 && (
        <section className="px-4 md:px-0">
          <div className="mb-3 flex items-end justify-between gap-2">
            <h2 className="font-serif text-xl font-semibold text-ink">Más de {business.name}</h2>
            <Link to={`/business/${business.id}`} className="flex shrink-0 items-center text-sm font-semibold text-primary">
              Ver tienda
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-4 md:px-0">
            {moreProducts.map((p) => (
              <div key={p.id} className="w-[46%] shrink-0 snap-start md:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
