import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, SlidersHorizontal, PackageSearch } from 'lucide-react';
import type { Faculty, Product, University } from '../types';
import { productService } from '../services/productService';
import { universityService } from '../services/universityService';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton, EmptyState } from '../components/StateViews';
import { FilterSheet, type FilterState } from '../components/FilterSheet';

const DEFAULT_FILTERS: FilterState = {
  category: 'todas',
  universityId: 'todas',
  facultyId: 'todas',
  onlyAvailable: false,
  minRating: 0,
};

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    universityService.listUniversities().then(setUniversities);
    universityService.listFaculties('univ-ean').then(setFaculties);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      const results = await productService.listAll({
        query: query || undefined,
        category: filters.category,
        universityId: filters.universityId !== 'todas' ? filters.universityId : undefined,
        facultyId: filters.facultyId !== 'todas' ? filters.facultyId : undefined,
        onlyAvailable: filters.onlyAvailable,
        minRating: filters.minRating || undefined,
      });
      setProducts(results);
      setLoading(false);
      setHasSearched(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, filters]);

  const activeFilterCount =
    (filters.category !== 'todas' ? 1 : 0) +
    (filters.universityId !== 'todas' ? 1 : 0) +
    (filters.facultyId !== 'todas' ? 1 : 0) +
    (filters.onlyAvailable ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  return (
    <div className="px-4 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-ink/60 hover:bg-ink/5 md:hidden"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-1 items-center gap-2.5 rounded-control border border-ink/12 bg-white px-3.5 py-2.5 min-h-[44px]">
          <SearchIcon size={16} className="text-ink/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 outline-none"
          />
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-ink/12 bg-white text-ink/60"
          aria-label="Filtros"
        >
          <SlidersHorizontal size={17} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-5 pb-6">
        {loading && <ProductGridSkeleton />}

        {!loading && hasSearched && products.length === 0 && (
          <EmptyState
            icon={<PackageSearch size={22} />}
            title="No encontramos productos con estos filtros."
            description="Intenta con otra palabra clave o ajusta los filtros."
          />
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <FilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        value={filters}
        onChange={setFilters}
        universities={universities}
        faculties={faculties}
      />
    </div>
  );
}
