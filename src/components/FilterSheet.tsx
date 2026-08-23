import { X } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Input';
import type { Faculty, ProductCategory, University } from '../types';
import { CATEGORY_LABELS } from '../types';

export interface FilterState {
  category: ProductCategory | 'todas';
  universityId: string | 'todas';
  facultyId: string | 'todas';
  onlyAvailable: boolean;
  minRating: number;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: FilterState;
  onChange: (value: FilterState) => void;
  universities: University[];
  faculties: Faculty[];
}

export function FilterSheet({ open, onClose, value, onChange, universities, faculties }: FilterSheetProps) {
  if (!open) return null;

  const reset = () =>
    onChange({ category: 'todas', universityId: 'todas', facultyId: 'todas', onlyAvailable: false, minRating: 0 });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center">
      <div className="w-full max-w-app rounded-t-card bg-white p-5 md:rounded-card md:max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Filtros</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Select
            label="Categoría"
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value as ProductCategory | 'todas' })}
          >
            <option value="todas">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>

          <Select
            label="Universidad"
            value={value.universityId}
            onChange={(e) => onChange({ ...value, universityId: e.target.value })}
          >
            <option value="todas">Todas</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>

          <Select
            label="Facultad"
            value={value.facultyId}
            onChange={(e) => onChange({ ...value, facultyId: e.target.value })}
          >
            <option value="todas">Todas</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>

          <Select
            label="Calificación mínima"
            value={value.minRating}
            onChange={(e) => onChange({ ...value, minRating: Number(e.target.value) })}
          >
            <option value={0}>Cualquiera</option>
            <option value={4}>4 estrellas o más</option>
            <option value={4.5}>4.5 estrellas o más</option>
          </Select>

          <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink/25 text-primary focus:ring-primary/30"
              checked={value.onlyAvailable}
              onChange={(e) => onChange({ ...value, onlyAvailable: e.target.checked })}
            />
            Solo disponibles
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" fullWidth onClick={reset}>
            Limpiar
          </Button>
          <Button fullWidth onClick={onClose}>
            Ver resultados
          </Button>
        </div>
      </div>
    </div>
  );
}
