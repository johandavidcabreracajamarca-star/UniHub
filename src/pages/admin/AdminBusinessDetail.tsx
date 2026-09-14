import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, ShieldOff, Trash2, Plus } from 'lucide-react';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `¿Eliminar "${product.name}" de forma permanente? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    const { error, blocked } = await productService.delete(product.id);

    // Bloqueado porque el producto ya tiene pedidos asociados — como admin,
    // se le ofrece forzar el borrado igual (el pedido conserva su historial,
    // solo pierde la referencia a este producto puntual).
    if (blocked) {
      const forceConfirmed = window.confirm(
        `${error}\n\n¿Quieres forzar el borrado de todas formas? Los pedidos que incluían "${product.name}" se conservarán, pero ya no mostrarán este producto.`
      );
      if (forceConfirmed) {
        const forced = await productService.forceDeleteAsAdmin(product.id);
        setDeletingId(null);
        if (forced.error) {
          showToast(forced.error, 'error');
          return;
        }
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        showToast('Producto eliminado (borrado forzado)');
        return;
      }
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    if (error) {
      showToast(error, 'error');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    showToast('Producto eliminado');
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

      <div className="mb-3 mt-6 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">Productos ({products.length})</h3>
        <Button
          size="sm"
          variant="outline"
          icon={<Plus size={14} />}
          onClick={() => navigate(`/admin/business/${id}/products/new`)}
        >
          Crear producto
        </Button>
      </div>

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
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant={p.suspended ? 'outline' : 'danger'}
                  loading={pendingId === p.id}
                  disabled={deletingId === p.id}
                  onClick={() => handleToggleProductSuspended(p)}
                  icon={p.suspended ? <ShieldOff size={14} /> : <Ban size={14} />}
                >
                  {p.suspended ? 'Reactivar' : 'Suspender'}
                </Button>
                <button
                  onClick={() => handleDeleteProduct(p)}
                  disabled={deletingId === p.id || pendingId === p.id}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-ink/12 text-ink/60 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  aria-label="Eliminar producto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
