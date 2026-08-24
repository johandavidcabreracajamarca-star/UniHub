import type { ProductCategory } from '../types';

// ============================================================================
// IMÁGENES AUTOMÁTICAS POR PALABRA CLAVE
// ============================================================================
// Cuando un producto no tiene una imagen asignada manualmente, generamos una
// URL que trae una foto real de internet relacionada con su nombre/categoría,
// usando LoremFlickr (servicio público y gratuito, sin necesidad de API key).
// El "lock" fija siempre la misma foto para el mismo producto, para que no
// cambie cada vez que se recarga la página.
// ============================================================================

const CATEGORY_KEYWORDS: Record<ProductCategory, string> = {
  comida: 'food',
  ropa: 'clothing',
  tecnologia: 'technology',
  accesorios: 'accessories',
  servicios: 'service',
  otros: 'shop',
};

/** Convierte el id del producto en un número estable para "fijar" la foto. */
function stableSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return (hash % 9999) + 1;
}

/** Extrae la primera palabra significativa del nombre del producto. */
function firstKeyword(name: string): string | null {
  const word = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)[0];
  return word && word.length > 2 ? word : null;
}

export function getAutoProductImage(
  name: string,
  category: ProductCategory,
  seedKey: string
): string {
  const keywords = [firstKeyword(name), CATEGORY_KEYWORDS[category]].filter(Boolean).join(',');
  const seed = stableSeed(seedKey);
  return `https://loremflickr.com/480/480/${keywords}?lock=${seed}`;
}
