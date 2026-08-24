import { useState } from 'react';
import type { ProductCategory } from '../types';
import { ImagePlaceholder } from './ImagePlaceholder';
import { getAutoProductImage } from '../utils/autoImage';

interface ProductImageProps {
  src?: string | null;
  category?: ProductCategory;
  className?: string;
  iconSize?: number;
  alt?: string;
  /** Nombre del producto, usado para elegir una foto automática relacionada. */
  name?: string;
  /** Clave estable (p. ej. el id del producto) para que la foto automática no cambie entre recargas. */
  seedKey?: string;
}

/**
 * Muestra la imagen del producto en este orden de prioridad:
 * 1. La imagen que el vendedor subió manualmente (src).
 * 2. Si no hay imagen manual pero sí nombre/categoría, una foto automática
 *    relacionada obtenida de internet por palabra clave.
 * 3. Si todo falla (o no hay internet), el ícono ilustrado de respaldo.
 */
export function ProductImage({
  src,
  category,
  className = '',
  iconSize,
  alt = '',
  name,
  seedKey,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  const autoSrc =
    !src && name && category && seedKey
      ? getAutoProductImage(name, category, seedKey)
      : null;

  const finalSrc = src || autoSrc;

  if (!finalSrc || failed) {
    return <ImagePlaceholder category={category} className={className} iconSize={iconSize} />;
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
