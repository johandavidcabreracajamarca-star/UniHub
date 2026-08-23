import { useState, type FormEvent } from 'react';
import { Store } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input, Select, Textarea } from '../../components/Input';
import { businessService } from '../../services/businessService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { CATEGORY_LABELS } from '../../types';
import type { ProductCategory } from '../../types';

export function CreateBusinessForm({ onCreated }: { onCreated: () => void }) {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('otros');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!name.trim() || !description.trim()) {
      setError('Completa el nombre y la descripción de tu emprendimiento.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await businessService.create({
      owner_id: profile.id,
      name,
      description,
      category,
      university_id: profile.university_id,
      faculty_id: profile.faculty_id,
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
