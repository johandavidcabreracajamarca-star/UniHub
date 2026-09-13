import { ArrowUpDown, ChevronDown } from 'lucide-react';
import type { ProductSort } from '../services/productService';

const SORT_LABELS: Record<ProductSort, string> = {
  recientes: 'Más recientes',
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
  calificacion: 'Mejor calificados',
  cercanos: 'Más cercanos',
};

interface SortSelectProps {
  value: ProductSort;
  onChange: (value: ProductSort) => void;
  className?: string;
}

export function SortSelect({ value, onChange, className = '' }: SortSelectProps) {
  return (
    <div className={`relative inline-flex shrink-0 items-center ${className}`}>
      <ArrowUpDown size={13} className="pointer-events-none absolute left-2.5 text-ink/40" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProductSort)}
        aria-label="Ordenar por"
        className="min-h-[36px] appearance-none rounded-control border border-ink/12 bg-white py-2 pl-7 pr-7 text-xs font-medium text-ink/70 outline-none focus:border-primary"
      >
        {Object.entries(SORT_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 text-ink/40" />
    </div>
  );
}
