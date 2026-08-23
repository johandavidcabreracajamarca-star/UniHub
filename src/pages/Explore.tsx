import { useEffect, useState } from 'react';
import type { Business, Product, ProductCategory } from '../types';
import { productService } from '../services/productService';
import { businessService } from '../services/businessService';
import { HomeHeader } from '../components/HomeHeader';
import { CategoryPills } from '../components/CategoryPills';
import { ProductCard } from '../components/ProductCard';
import { BusinessCard } from '../components/BusinessCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { PackageSearch } from 'lucide-react';

export function Explore() {
  const [category, setCategory] = useState<ProductCategory | 'todas'>('todas');
  const [products, setProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [p, b] = await Promise.all([
        productService.listAll({ category }),
        businessService.listVerified(),
      ]);
      setProducts(p);
      setBusinesses(b);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div>
      <HomeHeader />

      <div className="hidden md:block px-6 pt-6">
        <h1 className="text-2xl font-bold text-ink">Explorar</h1>
        <p className="mt-1 text-sm text-ink/50">Descubre lo que ofrece tu comunidad universitaria.</p>
      </div>

      <div className="mt-3 md:mt-5">
        <CategoryPills selected={category} onSelect={setCategory} />
      </div>

      {businesses.length > 0 && (
        <section className="mt-6 px-4 md:px-6">
          <h2 className="mb-3 text-base font-semibold text-ink">Emprendimientos destacados</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 px-4 pb-6 md:px-6">
        <h2 className="mb-3 text-base font-semibold text-ink">Productos destacados</h2>

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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
