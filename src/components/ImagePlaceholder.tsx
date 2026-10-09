import { Utensils, Shirt, Cpu, Watch, Wrench, Shapes } from 'lucide-react';
import type { ProductCategory } from '../types';

const CATEGORY_GRADIENTS: Record<ProductCategory, string> = {
  comida: 'from-accent/25 to-accent/5',
  ropa: 'from-secondary/25 to-secondary/5',
  tecnologia: 'from-primary/25 to-primary/5',
  accesorios: 'from-accent/20 to-secondary/10',
  servicios: 'from-secondary/20 to-primary/10',
  otros: 'from-ink/15 to-ink/5',
};

const CATEGORY_ICONS: Record<ProductCategory, typeof Utensils> = {
  comida: Utensils,
  ropa: Shirt,
  tecnologia: Cpu,
  accesorios: Watch,
  servicios: Wrench,
  otros: Shapes,
};

const CATEGORY_ICON_COLORS: Record<ProductCategory, string> = {
  comida: 'text-accent-dark/70',
  ropa: 'text-secondary/50',
  tecnologia: 'text-primary/60',
  accesorios: 'text-accent-dark/60',
  servicios: 'text-secondary/50',
  otros: 'text-ink/35',
};

interface ImagePlaceholderProps {
  category?: ProductCategory;
  className?: string;
  iconSize?: number;
}

export function ImagePlaceholder({ category = 'otros', className = '', iconSize = 28 }: ImagePlaceholderProps) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${CATEGORY_GRADIENTS[category]} ${className}`}
    >
      <Icon size={iconSize * 1.4} strokeWidth={1.4} className={CATEGORY_ICON_COLORS[category]} />
    </div>
  );
}
