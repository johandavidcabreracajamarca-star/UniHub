import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Package, ClipboardList, DollarSign, Star, MapPin, Camera, Loader2, Circle } from 'lucide-react';
import { useMyBusiness } from '../../hooks/useMyBusiness';
import { CreateBusinessForm } from './CreateBusinessForm';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { businessService } from '../../services/businessService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { StarRating } from '../../components/StarRating';
import { RowSkeleton } from '../../components/StateViews';
import { Button } from '../../components/Button';
import { formatCOP } from '../../utils/format';
import { processUploadedImage } from '../../utils/imageUpload';

export function DashboardHome() {
  const { profile } = useAuth();
  const { business, loading, refresh } = useMyBusiness();
  const [stats, setStats] = useState<{
    activeProducts: number;
    totalOrders: number;
    totalSales: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [availabilityNote, setAvailabilityNote] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useEffect(() => {
    setAvailabilityNote(business?.availability_note ?? '');
  }, [business?.id, business?.availability_note]);

  const handleToggleAvailable = async () => {
    if (!business) return;
    setSavingAvailability(true);
    setAvailabilityError(null);
    const { error } = await businessService.updateAvailability(
      business.id,
      !business.available_now,
      business.availability_note ?? null
    );
    setSavingAvailability(false);
    if (error) {
      setAvailabilityError(error);
      return;
    }
    refresh();
  };

  const handleSaveAvailabilityNote = async () => {
    if (!business) return;
    setSavingAvailability(true);
    setAvailabilityError(null);
    const { error } = await businessService.updateAvailability(
      business.id,
      Boolean(business.available_now),
      availabilityNote.trim() || null
    );
    setSavingAvailability(false);
    if (error) {
      setAvailabilityError(error);
      return;
    }
    refresh();
  };

  const handleLogoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !business || !profile) return;

    setLogoUploading(true);
    setLogoError(null);

    const { blob, error: processError } = await processUploadedImage(file);
    if (processError || !blob) {
      setLogoUploading(false);
      setLogoError(processError ?? 'No se pudo procesar la imagen.');
      return;
    }

    const { url, error: uploadError } = await storageService.uploadImage(
      'business-images',
      profile.id,
      blob
    );
    if (uploadError || !url) {
      setLogoUploading(false);
      setLogoError(uploadError ?? 'No se pudo subir el logo.');
      return;
    }

    const { error } = await businessService.updateLogo(business.id, url);
    setLogoUploading(false);
    if (error) {
      setLogoError(error);
      return;
    }
    refresh();
  };

  const handleUpdateLocation = () => {
    if (!business) return;
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no permite compartir ubicación.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { error } = await businessService.updateLocation(
          business.id,
          position.coords.latitude,
          position.coords.longitude
        );
        setLocating(false);
        if (error) {
          setLocationError(error);
          return;
        }
        refresh();
      },
      () => {
        setLocationError('No pudimos obtener tu ubicación. Revisa los permisos del navegador.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [products, orders] = await Promise.all([
        productService.listByBusiness(business.id),
        orderService.listByBusiness(business.id),
      ]);
      setStats({
        activeProducts: products.filter((p) => p.available).length,
        totalOrders: orders.length,
        totalSales: orders
          .filter((o) => o.status === 'completado')
          .reduce((sum, o) => sum + o.total, 0),
      });
    })();
  }, [business]);

  if (loading) return <RowSkeleton count={3} />;

  if (!business) {
    return <CreateBusinessForm onCreated={refresh} />;
  }

  return (
    <div>
      <div className="rounded-card border border-ink/8 bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleLogoSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={logoUploading}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ink/20 bg-surface transition-colors hover:border-primary disabled:opacity-60"
          >
            {logoUploading ? (
              <Loader2 size={18} className="animate-spin text-ink/40" />
            ) : business.logo?.trim() ? (
              <img src={business.logo} alt={business.name} className="h-full w-full object-cover" />
            ) : (
              <Camera size={18} className="text-ink/40" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-bold text-ink">{business.name}</h2>
              {business.verified ? (
                <VerifiedBadge />
              ) : (
                <span className="shrink-0 rounded-full bg-ink/8 px-2 py-0.5 text-xs font-medium text-ink/50">
                  No verificado
                </span>
              )}
            </div>
            <div className="mt-1">
              <StarRating rating={business.rating} reviewCount={business.review_count} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          disabled={logoUploading}
          className="mt-2 text-xs font-medium text-primary hover:underline disabled:opacity-60"
        >
          {business.logo?.trim() ? 'Cambiar logo' : 'Agregar logo'}
        </button>
        {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
      </div>

      <div className="mt-4 rounded-card border border-ink/8 bg-white p-3.5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Circle
              size={9}
              className={business.available_now ? 'fill-primary text-primary' : 'fill-ink/20 text-ink/20'}
            />
            <div>
              <p className="text-sm font-medium text-ink">
                {business.available_now ? 'Disponible ahora' : 'No disponible ahora'}
              </p>
              <p className="mt-0.5 text-xs text-ink/50">
                Los compradores ven esto antes de escribirte.
              </p>
            </div>
          </div>
                    <button
            type="button"
            role="switch"
            aria-checked={Boolean(business.available_now)}
            onClick={handleToggleAvailable}
            disabled={savingAvailability}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
              business.available_now ? 'bg-primary' : 'bg-ink/15'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-card transition-transform duration-200 ${
                business.available_now ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="mt-3">
          <textarea
            value={availabilityNote}
            onChange={(e) => setAvailabilityNote(e.target.value)}
            placeholder="p. ej. Suelo responder entre semana en las tardes"
            rows={2}
            maxLength={120}
            className="w-full rounded-control border border-ink/15 bg-surface p-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[11px] text-ink/35">{availabilityNote.length}/120</span>
            {availabilityNote !== (business.availability_note ?? '') && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={savingAvailability}
                onClick={handleSaveAvailabilityNote}
              >
                Guardar nota
              </Button>
            )}
          </div>
        </div>
        {availabilityError && <p className="mt-2 text-xs text-red-600">{availabilityError}</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Package size={17} />}
          label="Productos activos"
          value={stats ? String(stats.activeProducts) : '—'}
          color="primary"
        />
        <StatCard
          icon={<ClipboardList size={17} />}
          label="Pedidos"
          value={stats ? String(stats.totalOrders) : '—'}
          color="secondary"
        />
        <StatCard
          icon={<DollarSign size={17} />}
          label="Ventas"
          value={stats ? formatCOP(stats.totalSales) : '—'}
          color="accent"
        />
        <StatCard
          icon={<Star size={17} />}
          label="Calificación"
          value={business.rating > 0 ? business.rating.toFixed(1) : 'Sin datos'}
          color="primary"
        />
      </div>

      {!business.verified && (
        <div className="mt-4 rounded-card bg-secondary-light p-3.5 text-xs text-secondary">
          Tu emprendimiento aún no está verificado. La verificación la otorga el equipo de UniHub
          revisando tu identidad universitaria; no puedes activarla manualmente.
        </div>
      )}

      <div className="mt-4 rounded-card border border-ink/8 bg-white p-3.5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Ubicación</p>
            <p className="mt-0.5 text-xs text-ink/50">
              {business.latitude != null && business.longitude != null
                ? 'Los compradores cercanos pueden encontrarte más fácil al ordenar por "Más cercanos".'
                : 'Agrega tu ubicación para aparecer cuando alguien ordene por "Más cercanos".'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<MapPin size={14} />}
            onClick={handleUpdateLocation}
            loading={locating}
          >
            {business.latitude != null ? 'Actualizar' : 'Agregar'}
          </Button>
        </div>
        {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'accent';
}) {
  const bg = { primary: 'bg-primary-light text-primary-dark', secondary: 'bg-secondary-light text-secondary', accent: 'bg-accent-light text-accent' }[color];
  return (
    <div className="rounded-card border border-ink/8 bg-white p-3.5 shadow-card">
      <span className={`flex h-8 w-8 items-center justify-center rounded-control ${bg}`}>{icon}</span>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}
