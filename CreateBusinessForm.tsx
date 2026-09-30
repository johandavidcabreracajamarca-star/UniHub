import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Store, Camera, Link2, X, Loader2, MapPin, Info, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input, Select, Textarea } from '../../components/Input';
import { businessService } from '../../services/businessService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { CATEGORY_LABELS } from '../../types';
import type { ProductCategory } from '../../types';
import { processUploadedImage } from '../../utils/imageUpload';
import { containsContactInfo } from '../../utils/contactFilter';

export function CreateBusinessForm({ onCreated }: { onCreated: () => void }) {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
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
    if (!category) {
      setError('Selecciona una categoría para tu emprendimiento.');
      return;
    }

    const contactIssue = containsContactInfo(description) || containsContactInfo(name);
    if (contactIssue) {
      setError(contactIssue);
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

  // Botón con borde violeta (estilo del panel emprendedor).
  const outlineViolet =
    'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-primary bg-white px-4 text-sm font-semibold text-primary transition-all hover:bg-primary-light active:scale-[0.98] disabled:opacity-60';

  return (
    <div className="flex flex-col gap-4">
      <img
        src="/banner-emprende.jpg"
        alt="Tu talento merece su propio espacio. Crea tu emprendimiento y conecta con tu comunidad universitaria."
        className="w-full rounded-card object-cover shadow-card"
      />

      <div className="rounded-card-lg border border-ink/5 bg-white p-5 shadow-card">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-light text-accent-dark">
            <Store size={22} />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink">
              Crea tu emprendimiento
            </h2>
            <p className="text-sm text-ink/60">Conecta con tu comunidad universitaria.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Nombre del emprendimiento"
            placeholder="Ej. Dulce Campus"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">Logo del emprendimiento</span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Elegir logo"
                className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-primary-light/60 transition-colors hover:border-primary disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 size={22} className="animate-spin text-primary" />
                ) : logo.trim() ? (
                  <img src={logo} alt="Vista previa del logo" className="h-full w-full object-cover" />
                ) : (
                  <Camera size={22} className="text-primary/60" />
                )}
              </button>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={outlineViolet}
                >
                  <Camera size={16} />
                  {logo.trim() ? 'Cambiar logo' : 'Elegir logo'}
                </button>

                {logo.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLogo('');
                      setLogoBlob(null);
                    }}
                    className="inline-flex items-center gap-1 self-start text-sm font-medium text-ink/60 hover:text-red-600"
                  >
                    <X size={14} />
                    Quitar logo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUrlField((v) => !v)}
                    className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    <Link2 size={15} />
                    Usar un enlace
                  </button>
                )}
                <p className="text-xs text-ink/50">Opcional. Puedes agregarlo después.</p>
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
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">Ubicación</span>
            <button type="button" onClick={handleUseLocation} disabled={locating} className={outlineViolet}>
              {locating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : latitude != null ? (
                <Check size={16} />
              ) : (
                <MapPin size={16} />
              )}
              {locating
                ? 'Obteniendo ubicación…'
                : latitude != null
                  ? 'Ubicación guardada · actualizar'
                  : 'Usar mi ubicación actual'}
            </button>
            {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}
            <p className="mt-2 text-xs text-ink/50">Opcional. Facilita que te encuentren cerca.</p>
          </div>

          <Select
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className={category ? '' : 'text-ink/40'}
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="text-ink">
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
          <p className="-mt-3 text-xs text-ink/50">
            No incluyas WhatsApp, redes ni teléfono: coordina con tus compradores por el chat de UniHub.
          </p>

          <div className="flex items-center gap-2 text-sm text-ink/70">
            <Info size={17} className="shrink-0 text-ink/50" />
            <span>
              Tu emprendimiento empezará como <strong className="text-ink">no verificado</strong>.
            </span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" fullWidth loading={loading} className="rounded-2xl font-semibold">
            Crear mi emprendimiento
            {!loading && <ArrowRight size={18} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
