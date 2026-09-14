import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Link2, X, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input, Select, Textarea } from '../../components/Input';
import { productService } from '../../services/productService';
import { storageService } from '../../services/storageService';
import { useMyBusiness } from '../../hooks/useMyBusiness';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { CATEGORY_LABELS } from '../../types';
import type { ProductCategory } from '../../types';
import { RowSkeleton } from '../../components/StateViews';
import { ProductImage } from '../../components/ProductImage';
import { processUploadedImage } from '../../utils/imageUpload';

// Convierte una fecha ISO (como la guarda la base de datos) al formato que
// espera un <input type="datetime-local">, en hora LOCAL del navegador.
function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { business, loading: loadingBusiness } = useMyBusiness();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('otros');
  const [stock, setStock] = useState('');
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState('');
  // Foto recién elegida y comprimida, pendiente de subir a Supabase Storage
  // cuando se guarde el formulario (no se sube antes para no gastar datos
  // si el usuario cancela o cambia de foto varias veces).
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const [loadingProduct, setLoadingProduct] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [discountPercent, setDiscountPercent] = useState('');
  const [discountStart, setDiscountStart] = useState('');
  const [discountEnd, setDiscountEnd] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    productService.getById(id).then((product) => {
      if (product) {
        setName(product.name);
        setDescription(product.description);
        setPrice(String(product.price));
        setCategory(product.category);
        setStock(String(product.stock));
        setAvailable(product.available);
        setImage(product.image ?? '');
        setDiscountPercent(product.discount_percent ? String(product.discount_percent) : '');
        setDiscountStart(
          product.discount_starts_at ? toDatetimeLocalValue(product.discount_starts_at) : ''
        );
        setDiscountEnd(
          product.discount_ends_at ? toDatetimeLocalValue(product.discount_ends_at) : ''
        );
      }
      setLoadingProduct(false);
    });
  }, [id, isEditing]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir la misma foto si hace falta
    if (!file) return;

    setUploading(true);
    setError(null);
    const { dataUrl, blob, error: uploadError } = await processUploadedImage(file);
    setUploading(false);

    if (uploadError) {
      setError(uploadError);
      return;
    }
    setImage(dataUrl ?? '');
    setImageBlob(blob);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!business) return;

    const priceNum = Number(price);
    const stockNum = Number(stock);

    if (!name.trim() || !description.trim() || Number.isNaN(priceNum) || priceNum < 0 || Number.isNaN(stockNum) || stockNum < 0) {
      setError('Completa todos los campos obligatorios con valores válidos.');
      return;
    }

    // El descuento es opcional, pero si el vendedor le puso un porcentaje
    // entonces las dos fechas son obligatorias y la de fin debe ser después
    // de la de inicio.
    let discountPercentNum: number | null = null;
    let discountStartsIso: string | null = null;
    let discountEndsIso: string | null = null;

    if (discountPercent.trim()) {
      const pct = Number(discountPercent);
      if (Number.isNaN(pct) || pct <= 0 || pct > 90) {
        setError('El descuento debe ser un porcentaje entre 1 y 90.');
        return;
      }
      if (!discountStart || !discountEnd) {
        setError('Si vas a poner un descuento, elige cuándo empieza y cuándo termina.');
        return;
      }
      const startDate = new Date(discountStart);
      const endDate = new Date(discountEnd);
      if (endDate.getTime() <= startDate.getTime()) {
        setError('La fecha de fin del descuento debe ser posterior a la de inicio.');
        return;
      }
      discountPercentNum = pct;
      discountStartsIso = startDate.toISOString();
      discountEndsIso = endDate.toISOString();
    }

    setSaving(true);
    setError(null);

    // Si el usuario eligió una foto nueva, la subimos a Supabase Storage
    // ahora y usamos su enlace público en vez del dataUrl local (que solo
    // sirve para la vista previa). En modo demo no hay Storage real, así
    // que uploadImage no hace nada y seguimos usando el dataUrl de siempre.
    let finalImage = image.trim() || null;
    if (imageBlob && profile) {
      const { url, error: uploadError } = await storageService.uploadImage(
        'product-images',
        profile.id,
        imageBlob
      );
      if (uploadError) {
        setSaving(false);
        setError(`No se pudo subir la foto: ${uploadError}`);
        return;
      }
      if (url) {
        finalImage = url;
      }
    }

    if (isEditing && id) {
      const { error } = await productService.update(id, {
        name,
        description,
        price: priceNum,
        category,
        stock: stockNum,
        available,
        image: finalImage,
        discount_percent: discountPercentNum,
        discount_starts_at: discountStartsIso,
        discount_ends_at: discountEndsIso,
      });
      setSaving(false);
      if (error) {
        setError(error);
        return;
      }
      showToast('Producto actualizado con éxito');
    } else {
      const { error } = await productService.create({
        business_id: business.id,
        name,
        description,
        price: priceNum,
        category,
        stock: stockNum,
        available,
        image: finalImage,
      });
      setSaving(false);
      if (error) {
        setError(error);
        return;
      }
      showToast('Producto creado con éxito');
    }

    navigate('/dashboard/products');
  };

  if (loadingBusiness || loadingProduct) return <RowSkeleton count={3} />;

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard/products')}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink/60"
      >
        <ArrowLeft size={16} />
        Volver a mis productos
      </button>

      <h2 className="mb-4 text-base font-bold text-ink">
        {isEditing ? 'Editar producto' : 'Crear producto'}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card border border-ink/8 bg-white p-5 shadow-card">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Foto del producto</span>

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
              className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-control border-2 border-dashed border-ink/20 bg-surface transition-colors hover:border-primary disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={22} className="animate-spin text-ink/40" />
              ) : image.trim() ? (
                <ProductImage
                  src={image}
                  category={category}
                  className="h-full w-full"
                  iconSize={22}
                  alt="Vista previa"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-ink/40">
                  <Camera size={22} />
                  <span className="text-[11px] font-medium">Tomar foto</span>
                </div>
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
                {image.trim() ? 'Cambiar foto' : 'Elegir foto'}
              </Button>

              {image.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setImage('');
                    setImageBlob(null);
                  }}
                  className="inline-flex items-center gap-1 self-start text-xs font-medium text-ink/50 hover:text-red-600"
                >
                  <X size={13} />
                  Quitar foto
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

          {showUrlField && !image.trim() && (
            <div className="mt-3">
              <Input
                label="Enlace de la imagen (URL)"
                type="url"
                placeholder="https://ejemplo.com/mi-foto.jpg"
                value={image}
                onChange={(e) => {
                  setImage(e.target.value);
                  setImageBlob(null);
                }}
              />
            </div>
          )}

          <p className="mt-2 text-xs text-ink/40">
            Opcional. Si no subes una foto, UniHub mostrará automáticamente una imagen relacionada con la categoría de tu producto.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio (COP)"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Input
            label="Stock"
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>

        <Select label="Categoría" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-ink/25 text-primary focus:ring-primary/30"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          Disponible para la venta
        </label>

        {isEditing && (
          <div className="rounded-card border border-ink/8 bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">Descuento (opcional)</span>
              {(discountPercent || discountStart || discountEnd) && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscountPercent('');
                    setDiscountStart('');
                    setDiscountEnd('');
                  }}
                  className="text-xs font-medium text-ink/50 hover:text-red-600"
                >
                  Quitar descuento
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Los compradores verán el precio original tachado junto al precio con descuento,
              solo mientras esté dentro de las fechas que elijas.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Descuento (%)"
                type="number"
                min={1}
                max={90}
                placeholder="ej. 20"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
              <Input
                label="Empieza"
                type="datetime-local"
                value={discountStart}
                onChange={(e) => setDiscountStart(e.target.value)}
              />
              <Input
                label="Termina"
                type="datetime-local"
                value={discountEnd}
                onChange={(e) => setDiscountEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" fullWidth loading={saving}>
          {isEditing ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </form>
    </div>
  );
}
