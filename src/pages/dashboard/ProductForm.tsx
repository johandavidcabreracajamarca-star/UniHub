import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input, Select, Textarea } from '../../components/Input';
import { productService } from '../../services/productService';
import { useMyBusiness } from '../../hooks/useMyBusiness';
import { useToast } from '../../hooks/useToast';
import { CATEGORY_LABELS } from '../../types';
import type { ProductCategory } from '../../types';
import { RowSkeleton } from '../../components/StateViews';
import { ProductImage } from '../../components/ProductImage';

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { business, loading: loadingBusiness } = useMyBusiness();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('otros');
  const [stock, setStock] = useState('');
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState('');

  const [loadingProduct, setLoadingProduct] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      }
      setLoadingProduct(false);
    });
  }, [id, isEditing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!business) return;

    const priceNum = Number(price);
    const stockNum = Number(stock);

    if (!name.trim() || !description.trim() || Number.isNaN(priceNum) || priceNum < 0 || Number.isNaN(stockNum) || stockNum < 0) {
      setError('Completa todos los campos obligatorios con valores válidos.');
      return;
    }

    setSaving(true);
    setError(null);

    if (isEditing && id) {
      const { error } = await productService.update(id, {
        name,
        description,
        price: priceNum,
        category,
        stock: stockNum,
        available,
        image: image.trim() || null,
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
        image: image.trim() || null,
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
          <Input
            label="Imagen del producto (URL)"
            type="url"
            placeholder="https://ejemplo.com/mi-foto.jpg"
            hint="Opcional. Si lo dejas vacío, UniHub buscará automáticamente una foto relacionada con el nombre y la categoría de tu producto."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          {image.trim() && (
            <div className="mt-2">
              <ProductImage
                src={image}
                category={category}
                className="h-28 w-28 rounded-control border border-ink/10"
                iconSize={22}
                alt="Vista previa"
                name={name || 'producto'}
                seedKey={id || name || 'preview'}
              />
            </div>
          )}
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" fullWidth loading={saving}>
          {isEditing ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </form>
    </div>
  );
}
