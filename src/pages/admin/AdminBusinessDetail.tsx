import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, ShieldOff } from 'lucide-react';
import type { Business, Product } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { businessService } from '../../services/businessService';
import { productService } from '../../services/productService';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { formatCOP } from '../../utils/format';
import { RowSkeleton, EmptyState, ErrorState } from '../../components/StateViews';

export function AdminBusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [b, p] = await Promise.all([
        businessService.getById(id),
        productService.listByBusiness(id),
      ]);
      setBusiness(b);
      setProducts(p);
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

  const handleToggleProductSuspended = async (product: Product) => {
    setPendingId(product.id);
    const { error } = await productService.setSuspended(product.id, !product.suspended);
    setPendingId(null);
    if (error) {
      showToast(error, 'error');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, suspended: !p.suspended } : p))
    );
    showToast(!product.suspended ? 'Producto suspendido' : 'Producto reactivado');
  };

  if (loading) return <RowSkeleton count={4} />;
  if (error || !business) return <ErrorState onRetry={load} />;

  return (
    <div>
      <button
        onClick={() => navigate('/admin')}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink/60"
      >
        <ArrowLeft size={16} />
        Volver a emprendimientos
      </button>

      <div className="rounded-card border border-ink/8 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-ink">{business.name}</h2>
          {business.verified && <VerifiedBadge compact />}
          {business.suspended && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              Suspendido
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink/50">
          {CATEGORY_LABELS[business.category]} · {business.university_name} · {business.faculty_name}
        </p>
        <p className="mt-2 text-sm text-ink/70">{business.description}</p>
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-ink">
        Productos ({products.length})
      </h3>

      {products.length === 0 ? (
        <EmptyState title="Este emprendimiento aún no tiene productos." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {products.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-card border bg-white p-3.5 shadow-card ${
                p.suspended ? 'border-red-200 bg-red-50/40' : 'border-ink/8'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                  {p.suspended && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      Suspendido
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/50">{formatCOP(p.price)}</p>
              </div>
              <Button
                size="sm"
                variant={p.suspended ? 'outline' : 'danger'}
                loading={pendingId === p.id}
                onClick={() => handleToggleProductSuspended(p)}
                icon={p.suspended ? <ShieldOff size={14} /> : <Ban size={14} />}
              >
                {p.suspended ? 'Reactivar' : 'Suspender'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
