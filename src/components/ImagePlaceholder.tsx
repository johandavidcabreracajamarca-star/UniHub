import { ImageIcon } from 'lucide-react';
import type { ProductCategory } from '../types';

const CATEGORY_GRADIENTS: Record<ProductCategory, string> = {
  comida: 'from-accent/25 to-accent/5',
  ropa: 'from-secondary/25 to-secondary/5',
  tecnologia: 'from-primary/25 to-primary/5',
  accesorios: 'from-accent/20 to-secondary/10',
  servicios: 'from-secondary/20 to-primary/10',
  otros: 'from-ink/15 to-ink/5',
};

interface ImagePlaceholderProps {
  category?: ProductCategory;
  className?: string;
  iconSize?: number;
}

export function ImagePlaceholder({ category = 'otros', className = '', iconSize = 28 }: ImagePlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${CATEGORY_GRADIENTS[category]} ${className}`}
    >
      <ImageIcon size={iconSize} strokeWidth={1.5} className="text-ink/25" />
    </div>
  );
}
