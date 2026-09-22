import { Utensils, Shirt, Cpu, Watch, Wrench, Grid3x3 } from 'lucide-react';
import type { ProductCategory } from '../types';
import { CATEGORY_LABELS } from '../types';

const CATEGORY_ICONS: Record<ProductCategory, typeof Utensils> = {
  comida: Utensils,
  ropa: Shirt,
  tecnologia: Cpu,
  accesorios: Watch,
  servicios: Wrench,
  otros: Grid3x3,
};

// Color de cada categoría cuando NO está seleccionada (paleta de la marca).
const CATEGORY_TONES: Record<ProductCategory, string> = {
  comida: 'bg-secondary-light text-secondary',
  ropa: 'bg-accent-light text-accent',
  tecnologia: 'bg-primary-light text-primary',
  accesorios: 'bg-secondary-light text-accent',
  servicios: 'bg-ink/10 text-ink',
  otros: 'bg-white text-ink/60',
};

const CATEGORIES: ProductCategory[] = ['comida', 'ropa', 'tecnologia', 'accesorios', 'servicios', 'otros'];

interface CategoryPillsProps {
  selected: ProductCategory | 'todas';
  onSelect: (category: ProductCategory | 'todas') => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-1 scrollbar-none md:px-0">
      <Tile
        active={selected === 'todas'}
        onClick={() => onSelect('todas')}
        label="Todas"
        Icon={Grid3x3}
        tone="bg-white text-ink/60"
      />
      {CATEGORIES.map((cat) => (
        <Tile
          key={cat}
          active={selected === cat}
          onClick={() => onSelect(cat)}
          label={CATEGORY_LABELS[cat]}
          Icon={CATEGORY_ICONS[cat]}
          tone={CATEGORY_TONES[cat]}
        />
      ))}
    </div>
  );
}

function Tile({
  active,
  onClick,
  label,
  Icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: typeof Utensils;
  tone: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="flex w-[68px] shrink-0 flex-col items-center gap-1.5"
    >
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-[20px] shadow-card transition-all duration-200 active:scale-95 ${
          active ? 'scale-105 bg-primary text-white ring-2 ring-primary/30' : tone
        }`}
      >
        <Icon size={26} strokeWidth={1.7} />
      </span>
      <span className={`whitespace-nowrap text-[11.5px] font-semibold ${active ? 'text-primary' : 'text-ink'}`}>
        {label}
      </span>
    </button>
  );
}
