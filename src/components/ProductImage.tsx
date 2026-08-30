import { useEffect, useMemo, useState } from 'react';
import type { ProductCategory } from '../types';
import { ImagePlaceholder } from './ImagePlaceholder';
import { getAutoProductImage } from '../utils/autoImage';

interface ProductImageProps {
  src?: string | null;
  category?: ProductCategory;
  className?: string;
  iconSize?: number;
  alt?: string;
  name?: string;
  seedKey?: string;
}

type ImageStage = 'manual' | 'automatic' | 'placeholder';

export function ProductImage({ src, category, className = '', iconSize, alt = '', name, seedKey }: ProductImageProps) {
  const manualSrc = src?.trim() || null;
  const autoSrc = useMemo(
    () => (name && category && seedKey ? getAutoProductImage(name, category, seedKey) : null),
    [name, category, seedKey]
  );
  const [stage, setStage] = useState<ImageStage>(manualSrc ? 'manual' : autoSrc ? 'automatic' : 'placeholder');

  useEffect(() => {
    setStage(manualSrc ? 'manual' : autoSrc ? 'automatic' : 'placeholder');
  }, [manualSrc, autoSrc]);

  const finalSrc = stage === 'manual' ? manualSrc : stage === 'automatic' ? autoSrc : null;
  if (!finalSrc) {
    return <ImagePlaceholder category={category} className={className} iconSize={iconSize} />;
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      onError={() => setStage(stage === 'manual' && autoSrc ? 'automatic' : 'placeholder')}
      className={`object-cover ${className}`}
    />
  );
}
