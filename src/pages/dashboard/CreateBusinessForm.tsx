import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Store, Camera, Link2, X, Loader2, MapPin } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input, Select, Textarea } from '../../components/Input';
import { businessService } from '../../services/businessService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { CATEGORY_LABELS } from '../../types';
import type { ProductCategory } from '../../types';
import { processUploadedImage } from '../../utils/imageUpload';

export function CreateBusinessForm({ onCreated }: { onCreated: () => void }) {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('otros');
  const [logo, setLogo] = useState('');
  const [logoBlob, setLogoBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no permite compartir ubicación.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocationError('No pudimos obtener tu ubicación. Revisa los permisos del navegador.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    const { dataUrl, blob, error: uploadError } = await processUploadedImage(file);
    setUploading(false);

    if (uploadError) {
      setError(uploadError);
      return;
    }
    setLogo(dataUrl ?? '');
    setLogoBlob(blob);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!name.trim() || !description.trim()) {
      setError('Completa el nombre y la descripción de tu emprendimiento.');
      return;
    }
    setLoading(true);
    setError(null);

    // Si eligió un logo nuevo, lo subimos a Supabase Storage ahora y usamos
    // su enlace público (igual que con las fotos de producto). En modo demo
    // no hay Storage real, así que seguimos usando el dataUrl local.
    let finalLogo = logo.trim() || null;
    if (logoBlob) {
      const { url, error: uploadError } = await storageService.uploadImage(
        'business-images',
        profile.id,
        logoBlob
      );
      if (uploadError) {
        setLoading(false);
        setError(`No se pudo subir el logo: ${uploadError}`);
        return;
      }
      if (url) {
        finalLogo = url;
      }
    }

    const { error } = await businessService.create({
      owner_id: profile.id,
      name,
      description,
      category,
      university_id: profile.university_id,
      faculty_id: profile.faculty_id,
      logo: finalLogo,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    });
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    showToast('¡Emprendimiento creado con éxito!');
    onCreated();
  };

  return (
    <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-light text-accent">
          <Store size={22} />
        </div>
        <h2 className="text-base font-bold text-ink">Crea tu emprendimiento</h2>
        <p className="mt-1 text-sm text-ink/50">
          Antes de publicar productos, cuéntanos sobre tu emprendimiento. Empezará como{' '}
          <strong>no verificado</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre del emprendimiento"
          placeholder="p. ej. Dulce EAN"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Logo del emprendimiento</span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ink/20 bg-surface transition-colors hover:border-primary disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-ink/40" />
              ) : logo.trim() ? (
                <img src={logo} alt="Vista previa del logo" className="h-full w-full object-cover" />
              ) : (
                <Camera size={20} className="text-ink/40" />
              )}
            </button>

            <div className="flex flex-1 flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Camera size={14} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {logo.trim() ? 'Cambiar logo' : 'Elegir logo'}
              </Button>

              {logo.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setLogo('');
                    setLogoBlob(null);
                  }}
                  className="inline-flex items-center gap-1 self-start text-xs font-medium text-ink/50 hover:text-red-600"
                >
                  <X size={13} />
                  Quitar logo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUrlField((v) => !v)}
                  className="inline-flex items-center gap-1 self-start text-xs font-medium text-ink/50 hover:text-ink"
                >
                  <Link2 size={13} />
                  Usar un enlace en su lugar
                </button>
              )}
            </div>
          </div>

          {showUrlField && !logo.trim() && (
            <div className="mt-3">
              <Input
                label="Enlace del logo (URL)"
                type="url"
                placeholder="https://ejemplo.com/mi-logo.jpg"
                value={logo}
                onChange={(e) => {
                  setLogo(e.target.value);
                  setLogoBlob(null);
                }}
              />
            </div>
          )}

          <p className="mt-2 text-xs text-ink/40">Opcional. Puedes agregarlo o cambiarlo después.</p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Ubicación</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<MapPin size={14} />}
            onClick={handleUseLocation}
            disabled={locating}
          >
            {locating
              ? 'Obteniendo ubicación…'
              : latitude != null
                ? 'Actualizar mi ubicación'
                : 'Usar mi ubicación actual'}
          </Button>
          {latitude != null && longitude != null && (
            <p className="mt-2 text-xs text-primary">Ubicación guardada ✓</p>
          )}
          {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}
          <p className="mt-2 text-xs text-ink/40">
            Opcional. Ayuda a que los compradores cercanos te encuentren más fácil. Puedes
            agregarla o cambiarla después.
          </p>
        </div>

        <Select label="Categoría" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Textarea
          label="Descripción"
          placeholder="¿Qué ofreces y qué te hace especial?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Crear emprendimiento
        </Button>
      </form>
    </div>
  );
}
