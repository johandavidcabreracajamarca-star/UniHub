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

const CATEGORIES: ProductCategory[] = ['comida', 'ropa', 'tecnologia', 'accesorios', 'servicios', 'otros'];

interface CategoryPillsProps {
  selected: ProductCategory | 'todas';
  onSelect: (category: ProductCategory | 'todas') => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none md:px-0">
      <PillButton active={selected === 'todas'} onClick={() => onSelect('todas')} label="Todas" Icon={Grid3x3} />
      {CATEGORIES.map((cat) => (
        <PillButton
          key={cat}
          active={selected === cat}
          onClick={() => onSelect(cat)}
          label={CATEGORY_LABELS[cat]}
          Icon={CATEGORY_ICONS[cat]}
        />
      ))}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  label,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: typeof Utensils;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors min-h-[36px] ${
        active
          ? 'border-primary bg-primary text-white'
          : 'border-ink/12 bg-white text-ink/60 hover:bg-ink/5'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
