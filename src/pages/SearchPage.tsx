import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, SlidersHorizontal, PackageSearch, Clock, TrendingUp, X } from 'lucide-react';
import type { Faculty, Product, University } from '../types';
import { productService, type ProductSort } from '../services/productService';
import { universityService } from '../services/universityService';
import { ProductCard } from '../components/ProductCard';
import { SortSelect } from '../components/SortSelect';
import { ProductGridSkeleton, EmptyState } from '../components/StateViews';
import { FilterSheet, type FilterState } from '../components/FilterSheet';
import { distanceToBusiness, type Coordinates } from '../utils/geo';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '../utils/recentSearches';

// Ideas para quien no sabe qué buscar: las palabras que más se repiten en los
// nombres de los productos publicados, completadas con las categorías.
const STOPWORDS = new Set(['para', 'con', 'por', 'del', 'las', 'los', 'una', 'unos', 'hora', 'caja', 'porción', 'porcion']);
const FALLBACK_SEARCHES = ['Comida', 'Ropa', 'Tecnología', 'Accesorios', 'Servicios'];

function popularTerms(products: Product[]): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const p of products) {
    const seen = new Set<string>();
    for (const raw of p.name.split(/[^\p{L}\p{N}]+/u)) {
      const key = raw.toLowerCase();
      if (key.length < 4 || STOPWORDS.has(key) || /^\d+$/.test(key) || seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key) ?? { label: raw[0].toUpperCase() + raw.slice(1).toLowerCase(), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6).map((e) => e.label);
  const extra = FALLBACK_SEARCHES.filter((c) => !top.some((t) => t.toLowerCase() === c.toLowerCase()));
  return [...top, ...extra].slice(0, 8);
}

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
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches());
  const [popular, setPopular] = useState<string[]>(FALLBACK_SEARCHES);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<ProductSort>('recientes');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // Solo pedimos la ubicación al navegador cuando el usuario realmente
  // elige ordenar por cercanía — nunca de entrada.
  const handleSortChange = (value: ProductSort) => {
    setSort(value);
    if (value === 'cercanos' && !userLocation && !locationDenied && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => setLocationDenied(true),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

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
        sort,
        userLocation,
      });
      setProducts(results);
      if (!query && filters.category === 'todas') setPopular(popularTerms(results));
      setLoading(false);
      setHasSearched(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, filters, sort, userLocation]);

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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setRecent(addRecentSearch(query));
                (e.target as HTMLInputElement).blur();
              }
            }}
            enterKeyHint="search"
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

      {!query && (
        <div className="mt-5 flex flex-col gap-5">
          {recent.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Búsquedas recientes</p>
                <button
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-ink/50"
                >
                  <X size={13} /> Borrar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-sm text-ink"
                  >
                    <Clock size={14} className="text-ink/40" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">Populares en la U</p>
            <div className="flex flex-wrap gap-2">
              {popular.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    setRecent(addRecentSearch(term));
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-primary-light px-3.5 py-2 text-sm font-medium text-primary"
                >
                  <TrendingUp size={14} />
                  {term}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Todos los productos</p>
        </div>
      )}

      <div className="mt-3 pb-6">
        {!loading && hasSearched && products.length > 0 && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-ink/50">
              {products.length} {products.length === 1 ? 'resultado' : 'resultados'}
            </span>
            <SortSelect value={sort} onChange={handleSortChange} />
          </div>
        )}

        {loading && <ProductGridSkeleton />}

        {!loading && hasSearched && products.length === 0 && (
          <EmptyState
            icon={<PackageSearch size={22} />}
            title="No encontramos productos con estos filtros."
            description="Intenta con otra palabra clave o ajusta los filtros."
          />
        )}

        {!loading && products.length > 0 && (
          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
            onClickCapture={() => query && addRecentSearch(query)}
          >
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                distanceMeters={distanceToBusiness(userLocation, p.business)}
              />
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
