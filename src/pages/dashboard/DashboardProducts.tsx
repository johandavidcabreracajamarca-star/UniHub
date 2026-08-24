import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Pencil, Eye, EyeOff } from 'lucide-react';
import type { Product } from '../../types';
import { useMyBusiness } from '../../hooks/useMyBusiness';
import { productService } from '../../services/productService';
import { useToast } from '../../hooks/useToast';
import { CreateBusinessForm } from './CreateBusinessForm';
import { Button } from '../../components/Button';
import { ProductImage } from '../../components/ProductImage';
import { EmptyState, RowSkeleton } from '../../components/StateViews';
import { formatCOP } from '../../utils/format';

export function DashboardProducts() {
  const { business, loading: loadingBusiness, refresh: refreshBusiness } = useMyBusiness();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    if (!business) return;
    setLoading(true);
    const list = await productService.listByBusiness(business.id);
    setProducts(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const toggleAvailability = async (product: Product) => {
    setTogglingId(product.id);
    const { error } = await productService.setAvailability(product.id, !product.available);
    setTogglingId(null);
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast(product.available ? 'Producto desactivado' : 'Producto activado');
    load();
  };

  if (loadingBusiness) return <RowSkeleton count={3} />;
  if (!business) return <CreateBusinessForm onCreated={refreshBusiness} />;

  return (
    <div>
      <Button
        fullWidth
        icon={<Plus size={16} />}
        onClick={() => navigate('/dashboard/products/new')}
        className="mb-4"
      >
        Crear producto
      </Button>

      {loading && <RowSkeleton count={3} />}

      {!loading && products.length === 0 && (
        <EmptyState
          icon={<Package size={22} />}
          title="Aún no has publicado productos."
          description="Crea tu primer producto para que la comunidad pueda encontrarlo."
        />
      )}

      {!loading && products.length > 0 && (
        <div className="flex flex-col gap-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3 rounded-card border border-ink/8 bg-white p-3 shadow-card">
              <ProductImage
                src={product.image}
                category={product.category}
                className="h-14 w-14 shrink-0 rounded-control"
                iconSize={18}
                alt={product.name}
                name={product.name}
                seedKey={product.id}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{product.name}</p>
                <p className="text-sm text-ink/50">{formatCOP(product.price)}</p>
                <p className="text-xs text-ink/40">
                  Stock: {product.stock} ·{' '}
                  <span className={product.available ? 'text-primary' : 'text-red-500'}>
                    {product.available ? 'Disponible' : 'Desactivado'}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                  className="flex h-8 w-8 items-center justify-center rounded-control border border-ink/12 text-ink/60 hover:bg-ink/5"
                  aria-label="Editar producto"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => toggleAvailability(product)}
                  disabled={togglingId === product.id}
                  className="flex h-8 w-8 items-center justify-center rounded-control border border-ink/12 text-ink/60 hover:bg-ink/5 disabled:opacity-40"
                  aria-label={product.available ? 'Desactivar producto' : 'Activar producto'}
                >
                  {product.available ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
