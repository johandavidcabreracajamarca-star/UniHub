import { useEffect, useState } from 'react';
import type { Business, Product, ProductCategory } from '../types';
import { productService, type ProductSort } from '../services/productService';
import { businessService } from '../services/businessService';
import { statsService } from '../services/statsService';
import { HomeHeader } from '../components/HomeHeader';
import { CategoryPills } from '../components/CategoryPills';
import { SortSelect } from '../components/SortSelect';
import { ProductCard } from '../components/ProductCard';
import { BusinessCard } from '../components/BusinessCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { PackageSearch, Rocket, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useMyBusiness } from '../hooks/useMyBusiness';
import { InstallBanner } from '../components/InstallBanner';

// Destacados: los de más actividad en las últimas dos semanas (visitas,
// favoritos y pedidos), los mejor calificados (con suficientes reseñas para
// confiar en el promedio) y un empujón a los recién llegados para que también
// se vean.
function featuredScore(b: Business, activity: number): number {
  const confidence = Math.min(b.review_count ?? 0, 10) / 10;
  const isNew = Date.now() - new Date(b.created_at).getTime() < 14 * 24 * 60 * 60 * 1000;
  return activity + (b.rating ?? 0) * confidence + (isNew ? 2.5 : 0) + (b.available_now ? 0.5 : 0);
}

export function Explore() {
  const [category, setCategory] = useState<ProductCategory | 'todas'>('todas');
  const [sort, setSort] = useState<ProductSort>('populares');
  const [products, setProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { requireAuth } = useAuthGate();
  const { business: myBusiness, loading: loadingMyBusiness } = useMyBusiness();

  // Invitación a vender: para quien no tiene cuenta o aún no tiene emprendimiento
  const showSellInvite = !profile || (!loadingMyBusiness && !myBusiness && profile.role !== 'admin');
  const handleSell = () => {
    if (!requireAuth('abrir tu emprendimiento') || !profile) return;
    navigate('/dashboard');
  };

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [p, b, popularity] = await Promise.all([
        productService.listAll({ category, sort }),
        businessService.listVerified(),
        statsService.getPopularityScores(),
      ]);
      setProducts(p);
      const score = (x: Business) => featuredScore(x, popularity.byBusiness[x.id] ?? 0);
      setBusinesses([...b].sort((x, y) => score(y) - score(x)).slice(0, 10));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  return (
    <div>
      <HomeHeader />

      <div className="hidden md:block px-6 pt-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">Explorar</h1>
        <p className="mt-1 text-sm text-ink/50">Descubre lo que ofrece tu comunidad universitaria.</p>
      </div>

      <InstallBanner />

      <div className="mt-5 md:mt-5">
        <CategoryPills selected={category} onSelect={setCategory} />
      </div>

      {businesses.length > 0 && (
        <section className="mt-7 px-4 md:px-6">
          <div className="mb-3">
            <h2 className="text-lg font-bold tracking-tight text-ink">Destacados de la semana</h2>
            <p className="text-xs text-ink/50">Los más populares, mejor calificados y nuevos en la U</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        </section>
      )}

      {showSellInvite && (
        <div className="mt-7 px-4 md:px-6">
          <button
            type="button"
            onClick={handleSell}
            className="flex w-full items-center gap-3 rounded-card-lg bg-accent-light p-4 text-left shadow-card transition-opacity hover:opacity-90"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
              <Rocket size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">¿Vendes algo? Crea tu emprendimiento</span>
              <span className="block text-xs text-ink/60">Es gratis y sin comisión. Te toma un minuto.</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink/40" />
          </button>
        </div>
      )}

      <section className="mt-7 px-4 pb-6 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="whitespace-nowrap text-lg font-bold tracking-tight text-ink">Productos</h2>
          <SortSelect value={sort} onChange={setSort} />
        </div>

        {loading && <ProductGridSkeleton />}

        {!loading && error && <ErrorState onRetry={load} />}

        {!loading && !error && products.length === 0 && (
          <EmptyState
            icon={<PackageSearch size={22} />}
            title="No encontramos productos con estos filtros."
            description="Prueba con otra categoría o vuelve más tarde."
          />
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
