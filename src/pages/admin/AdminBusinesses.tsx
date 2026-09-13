import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Ban, ChevronRight, ShieldOff } from 'lucide-react';
import type { Business } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { businessService } from '../../services/businessService';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { RowSkeleton, EmptyState, ErrorState } from '../../components/StateViews';

export function AdminBusinesses() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await businessService.listAll();
      setBusinesses(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleVerified = async (business: Business) => {
    setPendingId(business.id);
    const { error } = await businessService.setVerified(business.id, !business.verified);
    setPendingId(null);
    if (error) {
      showToast(error, 'error');
      return;
    }
    setBusinesses((prev) =>
      prev.map((b) => (b.id === business.id ? { ...b, verified: !b.verified } : b))
    );
    showToast(!business.verified ? 'Emprendimiento verificado' : 'Verificación retirada');
  };

  const handleToggleSuspended = async (business: Business) => {
    setPendingId(business.id);
    const { error } = await businessService.setSuspended(business.id, !business.suspended);
    setPendingId(null);
    if (error) {
      showToast(error, 'error');
      return;
    }
    setBusinesses((prev) =>
      prev.map((b) => (b.id === business.id ? { ...b, suspended: !b.suspended } : b))
    );
    showToast(!business.suspended ? 'Emprendimiento suspendido' : 'Emprendimiento reactivado');
  };

  if (loading) return <RowSkeleton count={4} />;
  if (error) return <ErrorState onRetry={load} />;
  if (businesses.length === 0) {
    return <EmptyState title="Todavía no hay emprendimientos registrados." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink/50">
        {businesses.length} {businesses.length === 1 ? 'emprendimiento' : 'emprendimientos'} en
        total. Verifica los que sean de confianza y suspende los que incumplan las reglas.
      </p>

      {businesses.map((b) => (
        <div
          key={b.id}
          className={`rounded-card border bg-white p-4 shadow-card ${
            b.suspended ? 'border-red-200 bg-red-50/40' : 'border-ink/8'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => navigate(`/admin/business/${b.id}`)}
              className="flex flex-1 items-center gap-1 text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-ink truncate">{b.name}</h3>
                  {b.verified && <BadgeCheck size={15} className="fill-secondary text-white shrink-0" />}
                  {b.suspended && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      Suspendido
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/50 truncate">
                  {CATEGORY_LABELS[b.category]} · {b.university_name} · {b.faculty_name}
                </p>
              </div>
              <ChevronRight size={16} className="ml-auto shrink-0 text-ink/30" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={b.verified ? 'outline' : 'secondary'}
              loading={pendingId === b.id}
              onClick={() => handleToggleVerified(b)}
              icon={<BadgeCheck size={14} />}
            >
              {b.verified ? 'Quitar verificación' : 'Verificar'}
            </Button>
            <Button
              size="sm"
              variant={b.suspended ? 'outline' : 'danger'}
              loading={pendingId === b.id}
              onClick={() => handleToggleSuspended(b)}
              icon={b.suspended ? <ShieldOff size={14} /> : <Ban size={14} />}
            >
              {b.suspended ? 'Reactivar' : 'Suspender'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
