import { useEffect, useState } from 'react';
import type { Business, Product, ProductCategory } from '../types';
import { productService, type ProductSort } from '../services/productService';
import { businessService } from '../services/businessService';
import { HomeHeader } from '../components/HomeHeader';
import { CategoryPills } from '../components/CategoryPills';
import { SortSelect } from '../components/SortSelect';
import { ProductCard } from '../components/ProductCard';
import { BusinessCard } from '../components/BusinessCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { PackageSearch } from 'lucide-react';

export function Explore() {
  const [category, setCategory] = useState<ProductCategory | 'todas'>('todas');
  const [sort, setSort] = useState<ProductSort>('recientes');
  const [products, setProducts] = useState<Product[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [p, b] = await Promise.all([
        productService.listAll({ category, sort }),
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
  }, [category, sort]);

  return (
    <div>
      <HomeHeader />

      <div className="hidden md:block px-6 pt-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">Explorar</h1>
        <p className="mt-1 text-sm text-ink/50">Descubre lo que ofrece tu comunidad universitaria.</p>
      </div>

      <div className="mt-3 md:mt-5">
        <CategoryPills selected={category} onSelect={setCategory} />
      </div>

      {businesses.length > 0 && (
        <section className="mt-7 px-4 md:px-6">
          <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Emprendimientos destacados</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 px-4 pb-6 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-ink">Productos destacados</h2>
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
          <div className="grid grid-cols-2 gap-3.5
